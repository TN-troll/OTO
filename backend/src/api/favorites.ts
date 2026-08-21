import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

export const favoritesRouter = Router();

/**
 * GET /
 * Get all favorites for a device token.
 * Header: X-Device-Token
 */
favoritesRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const deviceToken = req.headers['x-device-token'] as string;
  if (!deviceToken || deviceToken.length < 16) {
    res.status(400).json({ error: 'Missing or invalid X-Device-Token header' });
    return;
  }

  try {
    const result = await query<{ listing_id: string; created_at: Date }>(
      'SELECT listing_id, created_at FROM user_favorites WHERE device_token = $1 ORDER BY created_at DESC',
      [deviceToken]
    );
    res.json({ favorites: result.rows.map(r => r.listing_id) });
  } catch (err) {
    console.error('[OTO] Error fetching favorites:', err);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

/**
 * POST /
 * Add a listing to favorites.
 * Header: X-Device-Token
 * Body: { listingId: string }
 */
favoritesRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const deviceToken = req.headers['x-device-token'] as string;
  if (!deviceToken || deviceToken.length < 16) {
    res.status(400).json({ error: 'Missing or invalid X-Device-Token header' });
    return;
  }

  const { listingId } = req.body;
  if (!listingId) {
    res.status(400).json({ error: 'Missing listingId in body' });
    return;
  }

  try {
    await query(
      'INSERT INTO user_favorites (device_token, listing_id) VALUES ($1, $2) ON CONFLICT (device_token, listing_id) DO NOTHING',
      [deviceToken, listingId]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('[OTO] Error adding favorite:', err);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

/**
 * DELETE /:listingId
 * Remove a listing from favorites.
 * Header: X-Device-Token
 */
favoritesRouter.delete('/:listingId', async (req: Request, res: Response): Promise<void> => {
  const deviceToken = req.headers['x-device-token'] as string;
  if (!deviceToken || deviceToken.length < 16) {
    res.status(400).json({ error: 'Missing or invalid X-Device-Token header' });
    return;
  }

  const { listingId } = req.params;

  try {
    await query(
      'DELETE FROM user_favorites WHERE device_token = $1 AND listing_id = $2',
      [deviceToken, listingId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[OTO] Error removing favorite:', err);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});
