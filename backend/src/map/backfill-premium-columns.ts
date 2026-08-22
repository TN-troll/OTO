import { query } from '../db/connection.js';

/**
 * Backfills premium filter columns (drivetrain, condition, door_count, seat_count,
 * exterior_color, engine_detail_config, forced_induction_detail) for existing listings.
 * Runs on every startup, is idempotent (only fills NULL values).
 */
export async function backfillPremiumColumns(): Promise<void> {
  console.log('[OTO] Starting premium column backfill...');

  let updated = 0;

  // ═══════════════════════════════════════════════════════════
  // 1. DRIVETRAIN — based on make/model patterns
  // ═══════════════════════════════════════════════════════════

  // AWD vehicles
  const awdResult = await query(`UPDATE listings SET drivetrain = 'awd' WHERE drivetrain IS NULL AND status = 'active' AND (
    model ILIKE '%Quattro%' OR model ILIKE '%4Matic%' OR model ILIKE '%xDrive%' OR
    model ILIKE '%Urus%' OR model ILIKE '%Cayenne%' OR model ILIKE '%Macan%' OR
    model ILIKE '%Huracan%' OR model ILIKE '%Aventador%' OR model ILIKE '%Revuelto%' OR
    model ILIKE '%Chiron%' OR model ILIKE '%Veyron%' OR
    model ILIKE '%GT-R%' OR model ILIKE '%Taycan%' OR model ILIKE '%e-tron%' OR
    model ILIKE '%RS3%' OR model ILIKE '%RS4%' OR model ILIKE '%RS5%' OR model ILIKE '%RS6%' OR model ILIKE '%RS7%' OR model ILIKE '%RSQ8%' OR
    model ILIKE '%M5%' OR model ILIKE '%M8%' OR
    model ILIKE '%AMG GT 63%' OR model ILIKE '%E 63%' OR model ILIKE '%S 63%' OR
    model ILIKE '%Cullinan%' OR model ILIKE '%Ghost%' OR model ILIKE '%Phantom%' OR model ILIKE '%Wraith%' OR
    model ILIKE '%Continental GT%' OR model ILIKE '%Flying Spur%' OR model ILIKE '%Bentayga%' OR
    model ILIKE '%Levante%' OR model ILIKE '%Ghibli%' OR model ILIKE '%Quattroporte%' OR
    model ILIKE '%Purosangue%' OR model ILIKE '%FF%' OR model ILIKE '%GTC4%' OR
    model ILIKE '%Range Rover%' OR model ILIKE '%Defender%' OR
    model ILIKE '%X3%' OR model ILIKE '%X4%' OR model ILIKE '%X5%' OR model ILIKE '%X6%' OR model ILIKE '%X7%' OR model ILIKE '%iX%' OR
    model ILIKE '%GLE%' OR model ILIKE '%GLC%' OR model ILIKE '%G 63%' OR model ILIKE '%G 500%' OR
    model ILIKE '%Q5%' OR model ILIKE '%Q7%' OR model ILIKE '%Q8%' OR model ILIKE '%SQ5%' OR model ILIKE '%SQ7%' OR model ILIKE '%SQ8%' OR
    model ILIKE '%Stelvio%' OR model ILIKE '%Grecale%' OR
    make = 'Bugatti' OR
    (make = 'Lamborghini' AND model NOT ILIKE '%Gallardo%Spyder%RWD%') OR
    (make = 'Rolls-Royce') OR
    (make = 'Bentley')
  )`);
  updated += awdResult.rowCount || 0;

  // RWD vehicles
  const rwdResult = await query(`UPDATE listings SET drivetrain = 'rwd' WHERE drivetrain IS NULL AND status = 'active' AND (
    (make = 'Ferrari' AND model NOT ILIKE '%FF%' AND model NOT ILIKE '%GTC4%' AND model NOT ILIKE '%Purosangue%') OR
    (make = 'McLaren') OR
    (make = 'Aston Martin' AND model NOT ILIKE '%DBX%') OR
    (make = 'Porsche' AND (model ILIKE '%911%' OR model ILIKE '%Cayman%' OR model ILIKE '%Boxster%' OR model ILIKE '%718%' OR model ILIKE '%GT3%' OR model ILIKE '%GT2%' OR model ILIKE '%GT4%')) OR
    model ILIKE '%M2%' OR model ILIKE '%M3%' OR model ILIKE '%M4%' OR
    (make = 'Mercedes-Benz' AND (model ILIKE '%AMG GT %' AND model NOT ILIKE '%63%' AND model NOT ILIKE '%4Matic%')) OR
    model ILIKE '%Corvette%' OR model ILIKE '%Mustang%' OR model ILIKE '%F-Type%' OR
    model ILIKE '%LC 500%' OR model ILIKE '%Supra%' OR model ILIKE '%Z4 M%' OR
    (make = 'Alfa Romeo' AND model ILIKE '%Giulia%') OR
    model ILIKE '%SL 63%' OR model ILIKE '%SL 55%'
  )`);
  updated += rwdResult.rowCount || 0;

  // FWD — not common in luxury but some hot hatches
  const fwdResult = await query(`UPDATE listings SET drivetrain = 'fwd' WHERE drivetrain IS NULL AND status = 'active' AND (
    model ILIKE '%Cooper%' OR model ILIKE '%Golf GTI%' OR model ILIKE '%Civic Type R%'
  )`);
  updated += fwdResult.rowCount || 0;

  console.log(`[OTO] Backfill drivetrain: ${updated} listings updated`);

  // ═══════════════════════════════════════════════════════════
  // 2. CONDITION — almost all are 'used' (new would have 0 mileage)
  // ═══════════════════════════════════════════════════════════

  // Everything without condition that's active → 'used' (default for aggregated ads)
  const condUsed = await query(`UPDATE listings SET condition = 'used' WHERE condition IS NULL AND status = 'active' AND (mileage IS NULL OR mileage > 100)`);
  // Listings with 0 or very low mileage AND current year → 'new'
  const condNew = await query(`UPDATE listings SET condition = 'new' WHERE condition IS NULL AND status = 'active' AND mileage IS NOT NULL AND mileage <= 100 AND year >= 2024`);
  // Classics
  const condClassic = await query(`UPDATE listings SET condition = 'classic' WHERE condition = 'used' AND status = 'active' AND year IS NOT NULL AND year < 1990`);

  console.log(`[OTO] Backfill condition: used=${condUsed.rowCount}, new=${condNew.rowCount}, classic=${condClassic.rowCount}`);

  // ═══════════════════════════════════════════════════════════
  // 3. DOOR COUNT
  // ═══════════════════════════════════════════════════════════

  // 2-door: coupes, sports cars, supercars
  await query(`UPDATE listings SET door_count = 2 WHERE door_count IS NULL AND status = 'active' AND (
    body_type IN ('coupe', 'cabriolet') OR
    make IN ('Ferrari', 'Lamborghini', 'McLaren', 'Bugatti', 'Pagani', 'Koenigsegg') OR
    model ILIKE '%M2%' OR model ILIKE '%M4%' OR model ILIKE '%Cayman%' OR model ILIKE '%Boxster%' OR
    model ILIKE '%718%' OR model ILIKE '%R8%' OR model ILIKE '%AMG GT%' OR model ILIKE '%GT3%' OR model ILIKE '%GT2%' OR
    model ILIKE '%Corvette%' OR model ILIKE '%Supra%' OR model ILIKE '%Z4%' OR
    model ILIKE '%SL %' OR model ILIKE '%F-Type%' OR model ILIKE '%Continental GT%' OR
    model ILIKE '%LC 500%' OR model ILIKE '%Vantage%' OR model ILIKE '%DB%'
  )`);

  // 4-door: sedans, most SUVs
  await query(`UPDATE listings SET door_count = 4 WHERE door_count IS NULL AND status = 'active' AND (
    body_type IN ('sedan', 'hatchback') OR
    model ILIKE '%M3%' OR model ILIKE '%M5%' OR model ILIKE '%Panamera%' OR
    model ILIKE '%Giulia%' OR model ILIKE '%Flying Spur%' OR model ILIKE '%Ghost%' OR model ILIKE '%Phantom%' OR
    model ILIKE '%Taycan%' OR model ILIKE '%e-tron GT%' OR model ILIKE '%RS3%' OR
    model ILIKE '%RS6%' OR model ILIKE '%RS7%' OR model ILIKE '%Ghibli%' OR model ILIKE '%Quattroporte%'
  )`);

  // 5-door: SUVs
  await query(`UPDATE listings SET door_count = 5 WHERE door_count IS NULL AND status = 'active' AND (
    body_type = 'suv' OR
    model ILIKE '%Cayenne%' OR model ILIKE '%Macan%' OR model ILIKE '%Urus%' OR
    model ILIKE '%Bentayga%' OR model ILIKE '%DBX%' OR model ILIKE '%Levante%' OR
    model ILIKE '%Purosangue%' OR model ILIKE '%Cullinan%' OR model ILIKE '%Range Rover%' OR
    model ILIKE '%Stelvio%' OR model ILIKE '%Grecale%' OR
    model ILIKE '%X3%' OR model ILIKE '%X4%' OR model ILIKE '%X5%' OR model ILIKE '%X6%' OR model ILIKE '%X7%' OR
    model ILIKE '%GLE%' OR model ILIKE '%GLC%' OR model ILIKE '%G 63%' OR model ILIKE '%G 500%' OR
    model ILIKE '%Q5%' OR model ILIKE '%Q7%' OR model ILIKE '%Q8%'
  )`);

  const doorResult = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM listings WHERE door_count IS NOT NULL AND status = 'active'`);
  console.log(`[OTO] Backfill door_count: ${doorResult.rows[0]?.count || 0} listings now have door_count`);

  // ═══════════════════════════════════════════════════════════
  // 4. SEAT COUNT
  // ═══════════════════════════════════════════════════════════

  // 2-seat: supercars, roadsters
  await query(`UPDATE listings SET seat_count = 2 WHERE seat_count IS NULL AND status = 'active' AND (
    make IN ('McLaren', 'Bugatti', 'Pagani', 'Koenigsegg') OR
    (make = 'Ferrari' AND model NOT ILIKE '%Purosangue%' AND model NOT ILIKE '%FF%' AND model NOT ILIKE '%GTC4%' AND model NOT ILIKE '%Roma%') OR
    (make = 'Lamborghini' AND model NOT ILIKE '%Urus%') OR
    model ILIKE '%Cayman%' OR model ILIKE '%Boxster%' OR model ILIKE '%718%' OR
    model ILIKE '%Corvette%' OR model ILIKE '%SL 63%' OR model ILIKE '%SL 55%' OR
    model ILIKE '%Z4%' OR model ILIKE '%Viper%' OR model ILIKE '%GT2%' OR
    model ILIKE '%Vantage%'
  )`);

  // 4-seat: most coupes, sports sedans
  await query(`UPDATE listings SET seat_count = 4 WHERE seat_count IS NULL AND status = 'active' AND (
    body_type IN ('coupe', 'cabriolet') OR
    model ILIKE '%M2%' OR model ILIKE '%M4%' OR model ILIKE '%R8%' OR
    model ILIKE '%AMG GT%' OR model ILIKE '%Continental GT%' OR model ILIKE '%DB%' OR
    model ILIKE '%F-Type%' OR model ILIKE '%LC 500%' OR model ILIKE '%Supra%' OR
    model ILIKE '%911%' OR (make = 'Ferrari' AND (model ILIKE '%Roma%'))
  )`);

  // 5-seat: sedans, SUVs (most common)
  await query(`UPDATE listings SET seat_count = 5 WHERE seat_count IS NULL AND status = 'active' AND (
    body_type IN ('sedan', 'suv', 'hatchback') OR
    model ILIKE '%M3%' OR model ILIKE '%M5%' OR model ILIKE '%Panamera%' OR
    model ILIKE '%Cayenne%' OR model ILIKE '%Macan%' OR model ILIKE '%Urus%' OR
    model ILIKE '%Giulia%' OR model ILIKE '%Stelvio%' OR model ILIKE '%Taycan%' OR
    model ILIKE '%RS3%' OR model ILIKE '%RS6%' OR model ILIKE '%RS7%'
  )`);

  const seatResult = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM listings WHERE seat_count IS NOT NULL AND status = 'active'`);
  console.log(`[OTO] Backfill seat_count: ${seatResult.rows[0]?.count || 0} listings now have seat_count`);

  // ═══════════════════════════════════════════════════════════
  // 5. ENGINE DETAIL CONFIG — based on make/model knowledge
  // ═══════════════════════════════════════════════════════════

  // Flat-6 (before V8 to prevent Porsche 911/Cayman/Boxster from matching V8 via GT3/GT2)
  await query(`UPDATE listings SET engine_detail_config = 'flat-6' WHERE engine_detail_config IS NULL AND status = 'active' AND (
    make = 'Porsche' AND (model ILIKE '%911%' OR model ILIKE '%GT3%' OR model ILIKE '%GT2%' OR model ILIKE '%Cayman%' OR model ILIKE '%Boxster%' OR model ILIKE '%718%')
  )`);

  // V12
  await query(`UPDATE listings SET engine_detail_config = 'v12' WHERE engine_detail_config IS NULL AND status = 'active' AND (
    (make = 'Ferrari' AND (model ILIKE '%812%' OR model ILIKE '%F12%' OR model ILIKE '%LaFerrari%' OR model ILIKE '%GTC4%' OR model ILIKE '%FF%' OR model ILIKE '%Purosangue%' OR model ILIKE '%Daytona%')) OR
    (make = 'Lamborghini' AND (model ILIKE '%Aventador%' OR model ILIKE '%Revuelto%' OR model ILIKE '%Countach%' OR model ILIKE '%Diablo%' OR model ILIKE '%Murcielago%')) OR
    make = 'Pagani' OR
    (make = 'Aston Martin' AND (model ILIKE '%DB7%' OR model ILIKE '%Vanquish%' OR model ILIKE '%V12%')) OR
    (make = 'Rolls-Royce') OR
    (make = 'Mercedes-Benz' AND model ILIKE '%S 65%')
  )`);

  // W12 — Bentley models and Bugatti (W16 not available, W12 is closest)
  await query(`UPDATE listings SET engine_detail_config = 'w12' WHERE engine_detail_config IS NULL AND status = 'active' AND (
    (make = 'Bentley' AND (model ILIKE '%Continental%' OR model ILIKE '%Flying Spur%' OR model ILIKE '%Bentayga%') AND year IS NOT NULL AND year < 2024) OR
    (make = 'Bugatti' AND (model ILIKE '%Chiron%' OR model ILIKE '%Veyron%'))
  )`);

  // V10
  await query(`UPDATE listings SET engine_detail_config = 'v10' WHERE engine_detail_config IS NULL AND status = 'active' AND (
    (make = 'Lamborghini' AND (model ILIKE '%Huracan%' OR model ILIKE '%Gallardo%')) OR
    model ILIKE '%R8%' OR model ILIKE '%Viper%' OR
    (make = 'BMW' AND model ILIKE '%M5%' AND year IS NOT NULL AND year >= 2005 AND year <= 2010) OR
    model ILIKE '%LFA%'
  )`);

  // V6 (before V8 to prevent Ferrari 296 from being matched as V8)
  await query(`UPDATE listings SET engine_detail_config = 'v6' WHERE engine_detail_config IS NULL AND status = 'active' AND (
    (make = 'Ferrari' AND model ILIKE '%296%') OR
    (make = 'Maserati' AND (model ILIKE '%Ghibli%' OR model ILIKE '%Grecale%')) OR
    (make = 'Alfa Romeo') OR
    model ILIKE '%GT-R%' OR
    (make = 'Porsche' AND (model ILIKE '%Macan%' OR model ILIKE '%Cayenne%') AND (horsepower IS NULL OR horsepower < 500))
  )`);

  // Inline-6
  await query(`UPDATE listings SET engine_detail_config = 'inline-6' WHERE engine_detail_config IS NULL AND status = 'active' AND (
    (make = 'BMW' AND (model ILIKE '%M2%' OR model ILIKE '%M3%' OR model ILIKE '%M4%' OR model ILIKE '%X3 M%' OR model ILIKE '%X4 M%' OR model ILIKE '%Supra%' OR model ILIKE '%Z4%')) OR
    (make = 'Toyota' AND model ILIKE '%Supra%')
  )`);

  // V8
  await query(`UPDATE listings SET engine_detail_config = 'v8' WHERE engine_detail_config IS NULL AND status = 'active' AND (
    (make = 'Ferrari' AND (model ILIKE '%F8%' OR model ILIKE '%488%' OR model ILIKE '%458%' OR model ILIKE '%Roma%' OR model ILIKE '%Portofino%' OR model ILIKE '%SF90%')) OR
    model ILIKE '%AMG GT%' OR model ILIKE '%C 63%' OR model ILIKE '%E 63%' OR model ILIKE '%S 63%' OR model ILIKE '%G 63%' OR
    model ILIKE '%M5%' OR model ILIKE '%M8%' OR
    model ILIKE '%RS6%' OR model ILIKE '%RS7%' OR model ILIKE '%RSQ8%' OR
    model ILIKE '%Urus%' OR
    model ILIKE '%Mustang%' OR model ILIKE '%Corvette%' OR
    model ILIKE '%Vantage%' OR model ILIKE '%DB11%' OR model ILIKE '%DBS%' OR
    model ILIKE '%Continental GT%' OR model ILIKE '%Flying Spur%' OR model ILIKE '%Bentayga%' OR
    (make = 'McLaren') OR
    (model ILIKE '%Range Rover%' AND horsepower IS NOT NULL AND horsepower >= 400)
  )`);

  // Inline-4
  await query(`UPDATE listings SET engine_detail_config = 'inline-4' WHERE engine_detail_config IS NULL AND status = 'active' AND (
    model ILIKE '%Cooper%' OR model ILIKE '%Golf%' OR model ILIKE '%A 35%' OR
    (make = 'Mercedes-Benz' AND model ILIKE '%A 45%') OR
    (make = 'Porsche' AND model ILIKE '%718%' AND model NOT ILIKE '%GT4%' AND model NOT ILIKE '%GTS%')
  )`);

  const engineResult = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM listings WHERE engine_detail_config IS NOT NULL AND status = 'active'`);
  console.log(`[OTO] Backfill engine_detail_config: ${engineResult.rows[0]?.count || 0} listings`);

  // ═══════════════════════════════════════════════════════════
  // 6. FORCED INDUCTION
  // ═══════════════════════════════════════════════════════════

  // Naturally aspirated (before turbo to prevent GT3/GT4 from being matched)
  await query(`UPDATE listings SET forced_induction_detail = 'naturally_aspirated' WHERE forced_induction_detail IS NULL AND status = 'active' AND (
    (make = 'Ferrari' AND (model ILIKE '%812%' OR model ILIKE '%F12%' OR model ILIKE '%LaFerrari%' OR model ILIKE '%458%' OR model ILIKE '%GTC4%' OR model ILIKE '%Purosangue%' OR model ILIKE '%Daytona%')) OR
    (make = 'Lamborghini' AND (model ILIKE '%Aventador%' OR model ILIKE '%Huracan%' OR model ILIKE '%Gallardo%' OR model ILIKE '%Revuelto%')) OR
    make = 'Pagani' OR
    (make = 'Porsche' AND (model ILIKE '%GT3%' OR model ILIKE '%GT4%')) OR
    model ILIKE '%R8%' OR model ILIKE '%LFA%' OR model ILIKE '%Viper%' OR
    (make = 'Aston Martin' AND (model ILIKE '%V12%' OR model ILIKE '%Vanquish%'))
  )`);

  // Twin turbo
  await query(`UPDATE listings SET forced_induction_detail = 'twin_turbo' WHERE forced_induction_detail IS NULL AND status = 'active' AND (
    (make = 'Ferrari' AND (model ILIKE '%488%' OR model ILIKE '%F8%' OR model ILIKE '%Roma%' OR model ILIKE '%Portofino%' OR model ILIKE '%SF90%' OR model ILIKE '%296%')) OR
    make = 'McLaren' OR make = 'Bugatti' OR
    (make = 'Lamborghini' AND model ILIKE '%Urus%') OR
    model ILIKE '%AMG GT%' OR model ILIKE '%C 63%' OR model ILIKE '%E 63%' OR model ILIKE '%S 63%' OR model ILIKE '%G 63%' OR
    model ILIKE '%M5%' OR model ILIKE '%M8%' OR model ILIKE '%X5 M%' OR model ILIKE '%X6 M%' OR
    model ILIKE '%RS6%' OR model ILIKE '%RS7%' OR model ILIKE '%RSQ8%' OR
    model ILIKE '%GT-R%' OR
    (make = 'Bentley') OR (make = 'Rolls-Royce') OR
    model ILIKE '%Panamera Turbo%' OR model ILIKE '%Cayenne Turbo%' OR
    (make = 'Porsche' AND model ILIKE '%911 Turbo%') OR
    (make = 'Maserati' AND model ILIKE '%MC20%')
  )`);

  // Turbocharged (single)
  await query(`UPDATE listings SET forced_induction_detail = 'turbocharged' WHERE forced_induction_detail IS NULL AND status = 'active' AND (
    (make = 'BMW' AND (model ILIKE '%M2%' OR model ILIKE '%M3%' OR model ILIKE '%M4%')) OR
    model ILIKE '%A 45%' OR model ILIKE '%A 35%' OR model ILIKE '%RS3%' OR
    model ILIKE '%Cooper S%' OR model ILIKE '%Golf GTI%' OR model ILIKE '%Golf R%' OR
    (make = 'Alfa Romeo') OR
    (make = 'Porsche' AND (model ILIKE '%Macan%' OR model ILIKE '%Cayenne%'))
  )`);

  // Supercharged
  await query(`UPDATE listings SET forced_induction_detail = 'supercharged' WHERE forced_induction_detail IS NULL AND status = 'active' AND (
    model ILIKE '%Supercharged%' OR model ILIKE '%F-Type SVR%' OR model ILIKE '%Corvette Z06%'
  )`);

  const inductionResult = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM listings WHERE forced_induction_detail IS NOT NULL AND status = 'active'`);
  console.log(`[OTO] Backfill forced_induction: ${inductionResult.rows[0]?.count || 0} listings`);

  // ═══════════════════════════════════════════════════════════
  // 7. EXTERIOR COLOR — from description text
  // ═══════════════════════════════════════════════════════════

  // Dutch and international color terms from descriptions
  const colorMappings: Array<{ color: string; patterns: string[] }> = [
    { color: 'black', patterns: ['%zwart%', '%black%', '%nero%', '%Obsidian Black%', '%Jet Black%'] },
    { color: 'white', patterns: ['%wit%', '%white%', '%bianco%', '%Carrara White%'] },
    { color: 'red', patterns: ['%rood%', '%red%', '%rosso%', '%Rosso Corsa%'] },
    { color: 'blue', patterns: ['%blauw%', '%blue%', '%blu%', '%Estoril Blue%'] },
    { color: 'silver', patterns: ['%zilver%', '%silver%', '%argento%'] },
    { color: 'grey', patterns: ['%grijs%', '%grey%', '%gray%', '%grigio%', '%Nardo Grey%', '%Daytona Grey%'] },
    { color: 'green', patterns: ['%groen%', '%green%', '%verde%', '%British Racing Green%'] },
    { color: 'yellow', patterns: ['%geel%', '%yellow%', '%giallo%'] },
    { color: 'orange', patterns: ['%oranje%', '%orange%', '%arancio%'] },
    { color: 'brown', patterns: ['%bruin%', '%brown%', '%marrone%'] },
  ];

  for (const { color, patterns } of colorMappings) {
    const descConditions = patterns.map((_p, i) => `description ILIKE $${i + 2}`).join(' OR ');
    await query(
      `UPDATE listings SET exterior_color = $1 WHERE exterior_color IS NULL AND status = 'active' AND (${descConditions})`,
      [color, ...patterns],
    );
  }

  const colorResult = await query<{ count: string }>(`SELECT COUNT(*)::text as count FROM listings WHERE exterior_color IS NOT NULL AND status = 'active'`);
  console.log(`[OTO] Backfill exterior_color: ${colorResult.rows[0]?.count || 0} listings`);

  console.log('[OTO] Premium column backfill complete.');
}
