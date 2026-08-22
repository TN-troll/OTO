import { query } from '../db/connection.js';
import { getRedisClient } from '../cache/redis.js';

const PRICE_CACHE_KEY_PREFIX = 'price:';

/**
 * Checks for price drops on favorited listings and queues notifications.
 * Runs on a schedule (e.g., every 6 hours via setInterval).
 */
export async function checkPriceDrops(): Promise<number> {
  try {
    // Get all active listings that have favorites
    const result = await query<{ listing_id: string; price: string; title: string; device_token: string }>(
      `SELECT DISTINCT f.listing_id, l.price, l.title, f.device_token
       FROM user_favorites f
       JOIN listings l ON l.id = f.listing_id
       WHERE l.status = 'active'`
    );

    if (result.rows.length === 0) return 0;

    const redis = getRedisClient();
    let dropsFound = 0;

    for (const row of result.rows) {
      const cacheKey = `${PRICE_CACHE_KEY_PREFIX}${row.listing_id}`;
      const currentPrice = parseFloat(row.price);

      if (redis) {
        const previousPriceStr = await redis.get(cacheKey);
        if (previousPriceStr) {
          const previousPrice = parseFloat(previousPriceStr);
          if (currentPrice < previousPrice) {
            const drop = previousPrice - currentPrice;
            dropsFound++;
            // Store the notification (the existing web-push system can pick this up)
            await query(
              `INSERT INTO notifications (device_token, type, title, body, data, created_at)
               VALUES ($1, 'price_drop', $2, $3, $4, NOW())
               ON CONFLICT DO NOTHING`,
              [
                row.device_token,
                `Price drop: ${row.title}`,
                `Price dropped by €${Math.round(drop).toLocaleString('nl-NL')}`,
                JSON.stringify({ listingId: row.listing_id, drop, newPrice: currentPrice }),
              ]
            ).catch(() => {}); // notifications table may not exist yet — fail silently
          }
        }
        // Update tracked price
        await redis.set(cacheKey, String(currentPrice), { EX: 86400 * 7 }); // Track for 7 days
      }
    }

    if (dropsFound > 0) {
      console.log(`[OTO] Found ${dropsFound} price drops`);
    }
    return dropsFound;
  } catch (err) {
    console.error('[OTO] Price drop check failed:', err);
    return 0;
  }
}
