import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

export const ratingsRouter = Router();

/** GET /?location=X&type=dealer — get average rating for a dealer */
ratingsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { location, type } = req.query;
  if (!location) { res.status(400).json({ error: 'Missing location' }); return; }

  try {
    const result = await query<{ avg_rating: string; count: string }>(
      `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*)::text as count
       FROM dealer_ratings WHERE location = $1 AND seller_type = $2`,
      [location, type || 'dealer']
    );
    const row = result.rows[0];
    res.json({
      averageRating: parseFloat(parseFloat(row?.avg_rating || '0').toFixed(1)),
      totalRatings: parseInt(row?.count || '0', 10),
    });
  } catch (err) {
    console.error('[OTO] Rating fetch error:', err);
    res.json({ averageRating: 0, totalRatings: 0 });
  }
});

/** POST / — submit a rating */
ratingsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const deviceToken = req.headers['x-device-token'] as string;
  if (!deviceToken) { res.status(400).json({ error: 'Missing device token' }); return; }

  const { location, sellerType, rating, comment } = req.body;
  if (!location || !rating || rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Invalid rating data' });
    return;
  }

  try {
    await query(
      `INSERT INTO dealer_ratings (device_token, location, seller_type, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (device_token, location, seller_type) DO UPDATE SET rating = $4, comment = $5`,
      [deviceToken, location, sellerType || 'dealer', rating, comment || null]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('[OTO] Rating submit error:', err);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});
