import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { geocodeCity } from '../map/geocoding.js';
import { getRedisClient } from '../cache/redis.js';
import type { MapLocationsResponse, MapLocation, MapListingPreview } from '@car-ads/shared';

export const mapRouter = Router();

/** Cache key for the map locations response */
const MAP_CACHE_KEY = 'map:locations';

/** Cache TTL in seconds (5 minutes) */
const MAP_CACHE_TTL_SECONDS = 300;

/** Row shape returned by the location aggregation query */
interface LocationRow {
  city: string;
  total_count: string;
  dealer_count: string;
  private_count: string;
}

/** Row shape returned by the preview listings lateral join query */
interface PreviewRow {
  city: string;
  id: string;
  title: string;
  price: string | number;
  primary_image_url: string | null;
  make: string;
  model: string;
}

/**
 * Attempt to read the map locations response from Redis cache.
 * Returns null on cache miss or if Redis is unavailable.
 */
async function getFromCache(): Promise<MapLocationsResponse | null> {
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    const cached = await redis.get(MAP_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as MapLocationsResponse;
    }
  } catch {
    // Cache miss or Redis error — proceed without cache
  }
  return null;
}

/**
 * Store the map locations response in Redis cache with the configured TTL.
 * Silently ignores errors (non-critical path).
 */
async function setInCache(response: MapLocationsResponse): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.set(MAP_CACHE_KEY, JSON.stringify(response), { EX: MAP_CACHE_TTL_SECONDS });
  } catch {
    // Cache write failure — non-critical, proceed silently
  }
}

/**
 * GET /locations
 *
 * Returns all active listing locations grouped by city, enriched with
 * geocoded coordinates, listing counts by seller type, and up to 3
 * preview listings per location.
 *
 * Only locations that can be geocoded (exist in the Dutch city lookup table)
 * are included in the response.
 *
 * Results are cached in Redis for 5 minutes. On Redis unavailability,
 * gracefully degrades to direct database queries.
 */
mapRouter.get('/locations', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check Redis cache first
    const cached = await getFromCache();
    if (cached) {
      res.json(cached);
      return;
    }

    // Query 1: Group active listings by location with counts by seller_type
    const locationResult = await query<LocationRow>(
      `SELECT
        location AS city,
        COUNT(*) AS total_count,
        COUNT(*) FILTER (WHERE seller_type = 'dealer') AS dealer_count,
        COUNT(*) FILTER (WHERE seller_type != 'dealer' OR seller_type IS NULL) AS private_count
      FROM listings
      WHERE status = 'active'
        AND location IS NOT NULL
        AND location != ''
      GROUP BY location
      ORDER BY total_count DESC`,
    );

    // If no results, return empty response
    if (locationResult.rows.length === 0) {
      const emptyResponse: MapLocationsResponse = {
        locations: [],
        totalListings: 0,
        generatedAt: new Date().toISOString(),
      };
      await setInCache(emptyResponse);
      res.json(emptyResponse);
      return;
    }

    // Query 2: Preview listings per location (lateral join for up to 3 per city)
    const previewResult = await query<PreviewRow>(
      `SELECT
        l.location AS city,
        previews.id,
        previews.title,
        previews.price,
        previews.image_urls[1] AS primary_image_url,
        previews.make,
        previews.model
      FROM (
        SELECT DISTINCT location FROM listings WHERE status = 'active' AND location IS NOT NULL AND location != ''
      ) l,
      LATERAL (
        SELECT id, title, price, image_urls, make, model
        FROM listings
        WHERE location = l.location AND status = 'active'
        ORDER BY date_added DESC
        LIMIT 3
      ) previews`,
    );

    // Index previews by city for fast lookup
    const previewsByCity = new Map<string, MapListingPreview[]>();
    for (const row of previewResult.rows) {
      const cityKey = row.city;
      if (!previewsByCity.has(cityKey)) {
        previewsByCity.set(cityKey, []);
      }
      previewsByCity.get(cityKey)!.push({
        id: row.id,
        title: row.title,
        price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
        primaryImageUrl: row.primary_image_url ?? null,
        make: row.make,
        model: row.model,
      });
    }

    // Filter to only geocodable locations and enrich with coordinates
    const locations: MapLocation[] = [];
    let totalListings = 0;

    for (const row of locationResult.rows) {
      const coords = geocodeCity(row.city);
      if (!coords) {
        // Skip locations that cannot be geocoded
        continue;
      }

      const totalCount = parseInt(row.total_count, 10);
      const dealerCount = parseInt(row.dealer_count, 10);
      const privateCount = parseInt(row.private_count, 10);

      locations.push({
        city: row.city,
        latitude: coords.latitude,
        longitude: coords.longitude,
        totalCount,
        dealerCount,
        privateCount,
        previews: previewsByCity.get(row.city) ?? [],
      });

      totalListings += totalCount;
    }

    const response: MapLocationsResponse = {
      locations,
      totalListings,
      generatedAt: new Date().toISOString(),
    };

    // Cache the response in Redis
    await setInCache(response);

    res.json(response);
  } catch (err) {
    console.error('[OTO] Error fetching map locations:', err);
    res.status(500).json({ error: 'Failed to fetch map locations' });
  }
});

export default mapRouter;
