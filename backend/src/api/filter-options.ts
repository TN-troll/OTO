import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

export const filterOptionsRouter = Router();

/**
 * GET /api/filter-options
 *
 * Returns available filter values derived from active listings.
 * Provides makes, models, fuel types, transmission types, years, and price/hp ranges.
 */
filterOptionsRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      makesResult,
      modelsResult,
      fuelTypesResult,
      transmissionTypesResult,
      rangesResult,
    ] = await Promise.all([
      query<{ make: string }>(
        `SELECT DISTINCT make FROM listings WHERE status = 'active' ORDER BY make`,
      ),
      query<{ model: string }>(
        `SELECT DISTINCT model FROM listings WHERE status = 'active' ORDER BY model`,
      ),
      query<{ fuel_type: string }>(
        `SELECT DISTINCT fuel_type FROM listings WHERE status = 'active' AND fuel_type IS NOT NULL ORDER BY fuel_type`,
      ),
      query<{ transmission_type: string }>(
        `SELECT DISTINCT transmission_type FROM listings WHERE status = 'active' AND transmission_type IS NOT NULL ORDER BY transmission_type`,
      ),
      query<{
        min_price: number | null;
        max_price: number | null;
        min_horsepower: number | null;
        max_horsepower: number | null;
        min_displacement: number | null;
        max_displacement: number | null;
        min_year: number | null;
        max_year: number | null;
      }>(
        `SELECT
           MIN(price) as min_price, MAX(price) as max_price,
           MIN(horsepower) as min_horsepower, MAX(horsepower) as max_horsepower,
           MIN(engine_displacement_cc) as min_displacement, MAX(engine_displacement_cc) as max_displacement,
           MIN(year) as min_year, MAX(year) as max_year
         FROM listings
         WHERE status = 'active'`,
      ),
    ]);

    const ranges = rangesResult.rows[0] ?? {};

    res.json({
      makes: makesResult.rows.map((r) => r.make),
      models: modelsResult.rows.map((r) => r.model),
      fuelTypes: fuelTypesResult.rows.map((r) => r.fuel_type),
      transmissionTypes: transmissionTypesResult.rows.map((r) => r.transmission_type),
      ranges: {
        price: { min: ranges.min_price ?? 0, max: ranges.max_price ?? 0 },
        horsepower: { min: ranges.min_horsepower ?? 0, max: ranges.max_horsepower ?? 0 },
        engineDisplacement: { min: ranges.min_displacement ?? 0, max: ranges.max_displacement ?? 0 },
        year: { min: ranges.min_year ?? 1950, max: ranges.max_year ?? new Date().getFullYear() },
      },
    });
  } catch (err) {
    console.error('Error fetching filter options:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
