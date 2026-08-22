import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

export const adsRouter = Router();

interface AdRow {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  placement: string;
  priority: number;
  target_makes: string[];
  click_count: number;
  impression_count: number;
}

/**
 * GET /
 * Get active ads for a placement. Optionally filter by target make.
 * Query params: placement (required), make (optional)
 */
adsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const { placement, make } = req.query;

  if (!placement) {
    res.status(400).json({ error: 'Missing placement query parameter' });
    return;
  }

  try {
    let sql = `
      SELECT id, title, description, image_url, link_url, placement, priority, target_makes, click_count, impression_count
      FROM ads
      WHERE is_active = TRUE
        AND placement = $1
        AND (starts_at IS NULL OR starts_at <= NOW())
        AND (ends_at IS NULL OR ends_at > NOW())
    `;
    const params: unknown[] = [placement];

    if (make) {
      sql += ` AND (target_makes = '{}' OR $2 = ANY(target_makes))`;
      params.push(make);
    }

    sql += ` ORDER BY priority DESC, created_at DESC LIMIT 5`;

    const result = await query<AdRow>(sql, params);

    // Track impressions (fire and forget)
    if (result.rows.length > 0) {
      const ids = result.rows.map(r => r.id);
      query(
        `UPDATE ads SET impression_count = impression_count + 1 WHERE id = ANY($1)`,
        [ids]
      ).catch(() => {});
    }

    res.json({
      ads: result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        imageUrl: row.image_url,
        linkUrl: row.link_url,
        placement: row.placement,
        targetMakes: row.target_makes,
      })),
    });
  } catch (err) {
    console.error('[OTO] Error fetching ads:', err);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

/**
 * POST /click/:id
 * Track an ad click.
 */
adsRouter.post('/click/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await query(`UPDATE ads SET click_count = click_count + 1 WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[OTO] Error tracking ad click:', err);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

/**
 * POST /
 * Create a new ad (admin endpoint).
 */
adsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const { title, description, imageUrl, linkUrl, placement, priority, targetMakes, startsAt, endsAt } = req.body;

  if (!title || !linkUrl) {
    res.status(400).json({ error: 'Missing required fields: title, linkUrl' });
    return;
  }

  try {
    const result = await query<{ id: string }>(
      `INSERT INTO ads (title, description, image_url, link_url, placement, priority, target_makes, starts_at, ends_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        title,
        description || null,
        imageUrl || null,
        linkUrl,
        placement || 'feed',
        priority ?? 50,
        targetMakes || [],
        startsAt || null,
        endsAt || null,
      ]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    console.error('[OTO] Error creating ad:', err);
    res.status(500).json({ error: 'Failed to create ad' });
  }
});

/**
 * DELETE /:id
 * Deactivate an ad.
 */
adsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await query(`UPDATE ads SET is_active = FALSE, updated_at = NOW() WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('[OTO] Error deactivating ad:', err);
    res.status(500).json({ error: 'Failed to deactivate ad' });
  }
});

/**
 * GET /stats
 * Get ad performance stats.
 */
adsRouter.get('/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await query<{
      id: string;
      title: string;
      placement: string;
      click_count: number;
      impression_count: number;
      is_active: boolean;
    }>(
      `SELECT id, title, placement, click_count, impression_count, is_active
       FROM ads ORDER BY created_at DESC`
    );
    res.json({
      ads: result.rows.map(r => ({
        id: r.id,
        title: r.title,
        placement: r.placement,
        clicks: r.click_count,
        impressions: r.impression_count,
        ctr: r.impression_count > 0 ? ((r.click_count / r.impression_count) * 100).toFixed(2) + '%' : '0%',
        isActive: r.is_active,
      })),
    });
  } catch (err) {
    console.error('[OTO] Error fetching ad stats:', err);
    res.status(500).json({ error: 'Failed to fetch ad stats' });
  }
});
