import { Router, Request, Response } from 'express';
import { DEFAULT_RANGES } from '@car-ads/shared';
import type { FilterOptionsResponse, HeritageEra } from '@car-ads/shared';
import { query } from '../db/connection.js';
import { getRedisClient } from '../cache/redis.js';

export const filterOptionsRouter = Router();

/** Cache key for the filter options response */
const FILTER_OPTIONS_CACHE_KEY = 'filter-options:all';

/** Cache TTL in seconds (5 minutes) */
const FILTER_OPTIONS_CACHE_TTL_SECONDS = 300;

/**
 * Attempt to read the filter options response from Redis cache.
 * Returns null on cache miss or if Redis is unavailable.
 */
async function getFromCache(): Promise<FilterOptionsResponse | null> {
  try {
    const redis = getRedisClient();
    if (!redis) return null;
    const cached = await redis.get(FILTER_OPTIONS_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as FilterOptionsResponse;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Store the filter options response in Redis cache.
 */
async function setInCache(response: FilterOptionsResponse): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis) return;
    await redis.set(FILTER_OPTIONS_CACHE_KEY, JSON.stringify(response), { EX: FILTER_OPTIONS_CACHE_TTL_SECONDS });
  } catch {
    // Graceful degradation — continue without cache
  }
}

/**
 * GET /api/filter-options
 *
 * Returns available filter values derived from active listings.
 * Provides dynamic ranges, discrete filter values, heritage era distribution,
 * special edition count, and dependent make/model mapping.
 *
 * Response is cached in Redis for 5 minutes.
 */
filterOptionsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Check cache first
    const cached = await getFromCache();
    if (cached) {
      res.json(cached);
      return;
    }

    const settled = await Promise.allSettled([
      // 0: Dynamic range min/max values
      query<{
        min_price: string | null;
        max_price: string | null;
        min_horsepower: string | null;
        max_horsepower: string | null;
        min_displacement: string | null;
        max_displacement: string | null;
        min_year: string | null;
        max_year: string | null;
        min_mileage: string | null;
        max_mileage: string | null;
      }>(
        `SELECT
           MIN(price) as min_price, MAX(price) as max_price,
           MIN(horsepower) as min_horsepower, MAX(horsepower) as max_horsepower,
           MIN(engine_displacement_cc) as min_displacement, MAX(engine_displacement_cc) as max_displacement,
           MIN(year) as min_year, MAX(year) as max_year,
           MIN(mileage) as min_mileage, MAX(mileage) as max_mileage
         FROM listings
         WHERE status = 'active'`,
      ),
      // 1: Distinct drivetrains
      query<{ drivetrain: string }>(
        `SELECT DISTINCT drivetrain FROM listings WHERE status = 'active' AND drivetrain IS NOT NULL ORDER BY drivetrain`,
      ),
      // 2: Distinct exterior colors
      query<{ exterior_color: string }>(
        `SELECT DISTINCT exterior_color FROM listings WHERE status = 'active' AND exterior_color IS NOT NULL ORDER BY exterior_color`,
      ),
      // 3: Distinct seller types
      query<{ seller_type: string }>(
        `SELECT DISTINCT seller_type FROM listings WHERE status = 'active' AND seller_type IS NOT NULL ORDER BY seller_type`,
      ),
      // 4: Distinct door counts
      query<{ door_count: number }>(
        `SELECT DISTINCT door_count FROM listings WHERE status = 'active' AND door_count IS NOT NULL ORDER BY door_count`,
      ),
      // 5: Distinct seat counts
      query<{ seat_count: number }>(
        `SELECT DISTINCT seat_count FROM listings WHERE status = 'active' AND seat_count IS NOT NULL ORDER BY seat_count`,
      ),
      // 6: Distinct conditions
      query<{ condition: string }>(
        `SELECT DISTINCT condition FROM listings WHERE status = 'active' AND condition IS NOT NULL ORDER BY condition`,
      ),
      // 7: Distinct engine detail configurations
      query<{ engine_detail_config: string }>(
        `SELECT DISTINCT engine_detail_config FROM listings WHERE status = 'active' AND engine_detail_config IS NOT NULL ORDER BY engine_detail_config`,
      ),
      // 8: Distinct forced induction details
      query<{ forced_induction_detail: string }>(
        `SELECT DISTINCT forced_induction_detail FROM listings WHERE status = 'active' AND forced_induction_detail IS NOT NULL ORDER BY forced_induction_detail`,
      ),
      // 9: Heritage era distribution counts
      query<{ era: string; count: string }>(
        `SELECT
           CASE
             WHEN year < 1990 THEN 'classic'
             WHEN year >= 1990 AND year <= 2010 THEN 'modern_classic'
             ELSE 'contemporary'
           END AS era,
           COUNT(*)::text AS count
         FROM listings
         WHERE status = 'active'
         GROUP BY era`,
      ),
      // 10: Special edition count
      query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM listings WHERE status = 'active' AND is_special_edition = TRUE`,
      ),
      // 11: Distinct makes
      query<{ make: string }>(
        `SELECT DISTINCT make FROM listings WHERE status = 'active' ORDER BY make`,
      ),
      // 12: Models grouped by make
      query<{ make: string; model: string }>(
        `SELECT DISTINCT make, model FROM listings WHERE status = 'active' ORDER BY make, model`,
      ),
    ]);

    // Safely extract results — default to empty rows on failure
    function getResult<T>(index: number): { rows: T[] } {
      const r = settled[index];
      return r.status === 'fulfilled' ? r.value as unknown as { rows: T[] } : { rows: [] as T[] };
    }

    const rangesResult = getResult<{
      min_price: string | null;
      max_price: string | null;
      min_horsepower: string | null;
      max_horsepower: string | null;
      min_displacement: string | null;
      max_displacement: string | null;
      min_year: string | null;
      max_year: string | null;
      min_mileage: string | null;
      max_mileage: string | null;
    }>(0);
    const drivetrainsResult = getResult<{ drivetrain: string }>(1);
    const colorsResult = getResult<{ exterior_color: string }>(2);
    const sellerTypesResult = getResult<{ seller_type: string }>(3);
    const doorCountsResult = getResult<{ door_count: number }>(4);
    const seatCountsResult = getResult<{ seat_count: number }>(5);
    const conditionsResult = getResult<{ condition: string }>(6);
    const engineConfigsResult = getResult<{ engine_detail_config: string }>(7);
    const inductionDetailsResult = getResult<{ forced_induction_detail: string }>(8);
    const heritageEraResult = getResult<{ era: string; count: string }>(9);
    const specialEditionResult = getResult<{ count: string }>(10);
    const makesResult = getResult<{ make: string }>(11);
    const modelsByMakeResult = getResult<{ make: string; model: string }>(12);

    const ranges = rangesResult.rows[0];

    // Build heritage era distribution with defaults of 0
    const heritageEraDistribution: Record<HeritageEra, number> = {
      classic: 0,
      modern_classic: 0,
      contemporary: 0,
    };
    for (const row of heritageEraResult.rows) {
      heritageEraDistribution[row.era as HeritageEra] = parseInt(row.count, 10);
    }

    // Build modelsByMake record
    const modelsByMake: Record<string, string[]> = {};
    for (const row of modelsByMakeResult.rows) {
      if (!modelsByMake[row.make]) {
        modelsByMake[row.make] = [];
      }
      modelsByMake[row.make].push(row.model);
    }

    const response: FilterOptionsResponse = {
      ranges: {
        price: {
          min: ranges?.min_price != null ? Number(ranges.min_price) : DEFAULT_RANGES.price.min,
          max: ranges?.max_price != null ? Number(ranges.max_price) : DEFAULT_RANGES.price.max,
        },
        horsepower: {
          min: ranges?.min_horsepower != null ? Number(ranges.min_horsepower) : DEFAULT_RANGES.horsepower.min,
          max: ranges?.max_horsepower != null ? Number(ranges.max_horsepower) : DEFAULT_RANGES.horsepower.max,
        },
        engineDisplacement: {
          min: ranges?.min_displacement != null ? Number(ranges.min_displacement) : DEFAULT_RANGES.engineDisplacement.min,
          max: ranges?.max_displacement != null ? Number(ranges.max_displacement) : DEFAULT_RANGES.engineDisplacement.max,
        },
        year: {
          min: ranges?.min_year != null ? Number(ranges.min_year) : DEFAULT_RANGES.year.min,
          max: ranges?.max_year != null ? Number(ranges.max_year) : DEFAULT_RANGES.year.max,
        },
        mileage: {
          min: ranges?.min_mileage != null ? Number(ranges.min_mileage) : DEFAULT_RANGES.mileage.min,
          max: ranges?.max_mileage != null ? Number(ranges.max_mileage) : DEFAULT_RANGES.mileage.max,
        },
      },
      drivetrains: drivetrainsResult.rows.map((r) => r.drivetrain) as FilterOptionsResponse['drivetrains'],
      colors: colorsResult.rows.map((r) => r.exterior_color),
      sellerTypes: sellerTypesResult.rows.map((r) => r.seller_type) as FilterOptionsResponse['sellerTypes'],
      doorCounts: doorCountsResult.rows.map((r) => Number(r.door_count)),
      seatCounts: seatCountsResult.rows.map((r) => Number(r.seat_count)),
      conditions: conditionsResult.rows.map((r) => r.condition) as FilterOptionsResponse['conditions'],
      engineDetailConfigurations: engineConfigsResult.rows.map((r) => r.engine_detail_config) as FilterOptionsResponse['engineDetailConfigurations'],
      forcedInductionDetails: inductionDetailsResult.rows.map((r) => r.forced_induction_detail) as FilterOptionsResponse['forcedInductionDetails'],
      heritageEraDistribution,
      specialEditionCount: parseInt(specialEditionResult.rows[0]?.count ?? '0', 10),
      makes: makesResult.rows.map((r) => r.make),
      modelsByMake,
    };

    // Cache the response
    await setInCache(response);

    res.json(response);
  } catch (err) {
    console.error('Error fetching filter options:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/filter-options/models?make=Ferrari&make=Porsche
 *
 * Returns models for the specified make(s).
 */
filterOptionsRouter.get('/models', async (req: Request, res: Response): Promise<void> => {
  try {
    const makesParam = req.query.make;
    const makes: string[] = Array.isArray(makesParam)
      ? makesParam.map(String)
      : makesParam
        ? [String(makesParam)]
        : [];

    if (makes.length === 0) {
      res.json({ models: [] });
      return;
    }

    const result = await query<{ model: string }>(
      `SELECT DISTINCT model FROM listings WHERE status = 'active' AND make = ANY($1) ORDER BY model`,
      [makes],
    );

    res.json({ models: result.rows.map((r) => r.model) });
  } catch (err) {
    console.error('[OTO] Error fetching models:', err);
    res.json({ models: [] });
  }
});
