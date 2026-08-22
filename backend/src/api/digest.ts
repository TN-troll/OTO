import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

export const digestRouter = Router();

/**
 * POST /subscribe
 * Subscribe an email to the weekly digest.
 * Body: { email }
 */
digestRouter.post('/subscribe', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email' });
    return;
  }

  try {
    await query(
      `INSERT INTO digest_subscribers (email, created_at)
       VALUES ($1, NOW())
       ON CONFLICT (email) DO NOTHING`,
      [email.toLowerCase().trim()]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[OTO] Digest subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

/**
 * GET /preview
 * Preview what the weekly digest would contain (latest listings summary).
 */
digestRouter.get('/preview', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query<{ make: string; model: string; price: string; id: string }>(
      `SELECT make, model, price, id FROM listings
       WHERE status = 'active' AND date_added > NOW() - INTERVAL '7 days'
       ORDER BY date_added DESC LIMIT 10`
    );
    res.json({
      newThisWeek: result.rows.length,
      highlights: result.rows.map(r => ({
        id: r.id,
        make: r.make,
        model: r.model,
        price: parseFloat(r.price),
      })),
    });
  } catch (err) {
    console.error('[OTO] Digest preview error:', err);
    res.json({ newThisWeek: 0, highlights: [] });
  }
});
