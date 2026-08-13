import { Router, Request, Response } from 'express';
import { ClickTracker } from './click-tracker.js';

export const clicksRouter = Router();

const clickTracker = new ClickTracker();

/**
 * POST /api/listings/:id/track-click
 *
 * Records an outbound click for a listing and returns the redirect URL.
 * Body: { sessionId?: string }
 */
clicksRouter.post('/listings/:id/track-click', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const sessionId: string = req.body.sessionId || generateSessionId();

    if (!id) {
      res.status(400).json({ error: 'Listing ID is required' });
      return;
    }

    const redirectUrl = await clickTracker.trackClick(id, sessionId);

    if (!redirectUrl) {
      res.status(404).json({ error: 'Listing source URL not found' });
      return;
    }

    res.json({ redirectUrl });
  } catch (err) {
    console.error('Error tracking click:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/clicks
 *
 * Returns aggregate click analytics data.
 * Query params: since (ISO date), limit (number), sortBy ('clicks' | 'recent')
 */
clicksRouter.get('/admin/clicks', async (req: Request, res: Response): Promise<void> => {
  try {
    const since = req.query.since ? new Date(req.query.since as string) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const sortBy = (req.query.sortBy as 'clicks' | 'recent') || undefined;

    if (sortBy && sortBy !== 'clicks' && sortBy !== 'recent') {
      res.status(400).json({ error: 'Invalid sortBy value. Must be "clicks" or "recent".' });
      return;
    }

    if (since && isNaN(since.getTime())) {
      res.status(400).json({ error: 'Invalid since date format. Use ISO 8601.' });
      return;
    }

    if (limit !== undefined && (isNaN(limit) || limit < 1)) {
      res.status(400).json({ error: 'Limit must be a positive integer.' });
      return;
    }

    const stats = await clickTracker.getAggregateStats({ since, limit, sortBy });

    res.json({ data: stats, count: stats.length });
  } catch (err) {
    console.error('Error fetching click analytics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Generate a simple random session ID for anonymous tracking.
 */
function generateSessionId(): string {
  return `anon-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}
