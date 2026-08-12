import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

export const searchRouter = Router();

/**
 * GET /api/search?q=...
 * Simple search on make, model, and title using ILIKE.
 */
searchRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').trim();

    if (q.length < 2) {
      res.json({ listings: [], totalCount: 0, expandedQuery: null, suggestions: [] });
      return;
    }

    const pattern = `%${q}%`;

    const result = await query(
      `SELECT id, title, make, model, year, price, horsepower, engine_displacement_cc, image_urls, date_added
       FROM listings
       WHERE status = 'active'
         AND (make ILIKE $1 OR model ILIKE $1 OR title ILIKE $1)
       ORDER BY date_added DESC
       LIMIT 50`,
      [pattern]
    );

    const listings = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      primaryImageUrl: row.image_urls?.[0] || null,
      make: row.make,
      model: row.model,
      year: row.year,
      price: parseFloat(row.price),
      horsepower: row.horsepower,
      engineDisplacementCc: row.engine_displacement_cc,
      dateAdded: row.date_added,
    }));

    res.json({
      listings,
      totalCount: listings.length,
      expandedQuery: null,
      suggestions: [],
    });
  } catch (err) {
    console.error('[OTO] Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});
