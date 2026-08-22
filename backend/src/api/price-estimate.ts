import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

export const priceEstimateRouter = Router();

/**
 * GET /:id
 * Estimate fair market value for a listing based on similar cars.
 */
priceEstimateRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Get the listing's details
    const listingResult = await query<{ make: string; model: string; year: number; mileage: number | null; horsepower: number | null; price: string }>(
      `SELECT make, model, year, mileage, horsepower, price FROM listings WHERE id = $1`,
      [id]
    );

    if (listingResult.rows.length === 0) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const listing = listingResult.rows[0];
    const currentPrice = parseFloat(listing.price);

    // Find similar listings (same make, ±2 years, similar mileage)
    const similarResult = await query<{ price: string; mileage: number | null; year: number }>(
      `SELECT price, mileage, year FROM listings
       WHERE make = $1
         AND status = 'active'
         AND year BETWEEN $2 AND $3
         AND id != $4
       ORDER BY ABS(year - $5) ASC, ABS(COALESCE(mileage, 0) - $6) ASC
       LIMIT 20`,
      [listing.make, listing.year - 2, listing.year + 2, id, listing.year, listing.mileage || 0]
    );

    if (similarResult.rows.length < 3) {
      res.json({ estimate: null, confidence: 'low', reason: 'Not enough similar listings', similarCount: similarResult.rows.length });
      return;
    }

    // Calculate statistics
    const prices = similarResult.rows.map(r => parseFloat(r.price));
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Price position
    const percentile = Math.round((sorted.filter(p => p <= currentPrice).length / sorted.length) * 100);
    let verdict: string;
    if (currentPrice < median * 0.85) verdict = 'below_market';
    else if (currentPrice > median * 1.15) verdict = 'above_market';
    else verdict = 'fair_price';

    res.json({
      estimate: Math.round(median),
      average: Math.round(avg),
      range: { min: Math.round(min), max: Math.round(max) },
      similarCount: prices.length,
      percentile,
      verdict,
      confidence: prices.length >= 10 ? 'high' : prices.length >= 5 ? 'medium' : 'low',
    });
  } catch (err) {
    console.error('[OTO] Price estimate error:', err);
    res.status(500).json({ error: 'Failed to estimate price' });
  }
});
