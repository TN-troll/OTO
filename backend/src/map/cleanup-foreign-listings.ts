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

  if (foreignIds.length === 0) return 0;

  // Mark as inactive
  await query(
    `UPDATE listings SET status = 'inactive', updated_at = NOW() WHERE id = ANY($1)`,
    [foreignIds]
  );

  console.log(`[OTO] Marked ${foreignIds.length} non-Dutch listings as inactive`);
  return foreignIds.length;
}
