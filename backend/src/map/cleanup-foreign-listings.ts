import { query } from '../db/connection.js';
import { isDutchLocation } from './location-validator.js';

/**
 * Marks active listings with non-Dutch locations as 'inactive'.
 * Idempotent — runs on every startup to catch any foreign listings
 * that slipped through between validator updates.
 */
export async function cleanupForeignListings(): Promise<number> {
  // Get all active listings with a location
  const result = await query<{ id: string; location: string }>(
    `SELECT id, location FROM listings WHERE status = 'active' AND location IS NOT NULL AND location != ''`
  );

  const foreignIds: string[] = [];
  for (const row of result.rows) {
    if (!isDutchLocation(row.location)) {
      foreignIds.push(row.id);
    }
  }

  if (foreignIds.length > 0) {
    // Mark as inactive
    await query(
      `UPDATE listings SET status = 'inactive', updated_at = NOW() WHERE id = ANY($1)`,
      [foreignIds]
    );

    console.log(`[OTO] Marked ${foreignIds.length} non-Dutch listings as inactive`);
  }

  // Also clean out non-Quadrifoglio Alfa Romeos (< 400 HP)
  try {
    const alfaResult = await query(
      `UPDATE listings SET status = 'inactive', updated_at = NOW()
       WHERE make = 'Alfa Romeo' AND status = 'active'
       AND (horsepower IS NULL OR horsepower < 400)
       RETURNING id`
    );
    if (alfaResult.rows.length > 0) {
      console.log(`[OTO] Marked ${alfaResult.rows.length} non-Quadrifoglio Alfa Romeo listings as inactive`);
    }
  } catch {
    // Non-critical
  }

  // Backfill body_type from model names for listings that don't have it
  try {
    // SUVs — common model names
    await query(`UPDATE listings SET body_type = 'suv' WHERE body_type IS NULL AND status = 'active' AND (
      model ILIKE '%Cayenne%' OR model ILIKE '%Macan%' OR model ILIKE '%Urus%' OR
      model ILIKE '%Bentayga%' OR model ILIKE '%DBX%' OR model ILIKE '%Levante%' OR
      model ILIKE '%Purosangue%' OR model ILIKE '%X3%' OR model ILIKE '%X4%' OR
      model ILIKE '%X5%' OR model ILIKE '%X6%' OR model ILIKE '%X7%' OR
      model ILIKE '%GLE%' OR model ILIKE '%GLC%' OR model ILIKE '%G 63%' OR
      model ILIKE '%G 500%' OR model ILIKE '%Q7%' OR model ILIKE '%Q8%' OR
      model ILIKE '%RSQ8%' OR model ILIKE '%SQ7%' OR model ILIKE '%SQ8%' OR
      model ILIKE '%Cullinan%' OR model ILIKE '%Range Rover%' OR model ILIKE '%Defender%' OR
      model ILIKE '%Stelvio%' OR model ILIKE '%Grecale%'
    )`);

    // Sedans
    await query(`UPDATE listings SET body_type = 'sedan' WHERE body_type IS NULL AND status = 'active' AND (
      model ILIKE '%M3%' OR model ILIKE '%M5%' OR model ILIKE '%RS3%' OR
      model ILIKE '%RS6%' OR model ILIKE '%RS7%' OR model ILIKE '%Giulia%' OR
      model ILIKE '%Panamera%' OR model ILIKE '%Flying Spur%' OR
      model ILIKE '%Ghost%' OR model ILIKE '%Phantom%' OR model ILIKE '%S-Klasse%' OR
      model ILIKE '%S 63%' OR model ILIKE '%S 65%' OR model ILIKE '%Ghibli%' OR
      model ILIKE '%Taycan%' OR model ILIKE '%e-tron GT%'
    )`);

    // Coupes
    await query(`UPDATE listings SET body_type = 'coupe' WHERE body_type IS NULL AND status = 'active' AND (
      make IN ('Ferrari', 'Lamborghini', 'McLaren', 'Bugatti', 'Pagani', 'Koenigsegg') OR
      model ILIKE '%M4%' OR model ILIKE '%M8%' OR model ILIKE '%M2%' OR
      model ILIKE '%GT3%' OR model ILIKE '%GT2%' OR model ILIKE '%Turbo S%' OR
      model ILIKE '%911%' OR model ILIKE '%Continental GT%' OR
      model ILIKE '%AMG GT%' OR model ILIKE '%R8%' OR model ILIKE '%RS5%' OR
      model ILIKE '%GT-R%' OR model ILIKE '%Supra%' OR model ILIKE '%Corvette%' OR
      model ILIKE '%F-Type%' OR model ILIKE '%LC 500%' OR model ILIKE '%i4%' OR
      model ILIKE '%Cayman%' OR model ILIKE '%718%'
    )`);

    // Cabriolets
    await query(`UPDATE listings SET body_type = 'cabriolet' WHERE body_type IS NULL AND status = 'active' AND (
      model ILIKE '%Spider%' OR model ILIKE '%Spyder%' OR model ILIKE '%Roadster%' OR
      model ILIKE '%Boxster%' OR model ILIKE '%Cabrio%' OR model ILIKE '%GTC%' OR
      model ILIKE '%GTS%' OR model ILIKE '%Targa%' OR model ILIKE '%Z4%' OR
      model ILIKE '%SL %' OR model ILIKE '%Spectre%'
    )`);

    // Hatchbacks
    await query(`UPDATE listings SET body_type = 'hatchback' WHERE body_type IS NULL AND status = 'active' AND (
      model ILIKE '%Golf%' OR model ILIKE '%Civic%' OR model ILIKE '%i30%' OR
      model ILIKE '%i20%' OR model ILIKE '%Yaris%' OR model ILIKE '%Focus%' OR
      model ILIKE '%Cooper%' OR model ILIKE '%A 45%' OR model ILIKE '%A 35%'
    )`);

    const backfillResult = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM listings WHERE body_type IS NOT NULL AND status = 'active'`);
    console.log(`[OTO] Body type backfill: ${backfillResult.rows[0]?.count || 0} listings now have body_type`);
  } catch (err) {
    console.error('[OTO] Body type backfill failed:', err);
  }

  // Backfill fuel_type for known EVs
  try {
    await query(`UPDATE listings SET fuel_type = 'electric' WHERE fuel_type IS NULL AND status = 'active' AND (
      model ILIKE '%Taycan%' OR model ILIKE '%e-tron GT%' OR model ILIKE '%iX%' OR
      model ILIKE '%i4%' OR model ILIKE '%EQS%' OR model ILIKE '%EQE%' OR
      model ILIKE '%Model S%' OR model ILIKE '%Model 3%' OR model ILIKE '%Model X%' OR
      model ILIKE '%IONIQ%' OR model ILIKE '%Spectre%' OR model ILIKE '%Nevera%' OR
      model ILIKE '%Eletre%' OR model ILIKE '%Emeya%'
    )`);
    await query(`UPDATE listings SET fuel_type = 'electric' WHERE fuel_type = 'petrol' AND status = 'active' AND (
      model ILIKE '%Taycan%' OR model ILIKE '%e-tron GT%' OR model ILIKE '%iX%' OR
      model ILIKE '%i4%' OR model ILIKE '%EQS%' OR model ILIKE '%Model S%' OR
      model ILIKE '%Model 3%' OR model ILIKE '%IONIQ%' OR model ILIKE '%Spectre%'
    )`);
  } catch {
    // Non-critical
  }

  return foreignIds.length;
}
