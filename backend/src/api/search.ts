import { Router, Request, Response } from 'express';
import type { FilterCriteria } from '@car-ads/shared';
import { SearchService } from '../search/search-service.js';

export const searchRouter = Router();

const searchService = new SearchService();

/**
 * GET /api/search?q=...&page=...
 *
 * Perform a text search across listings.
 * Query params: q (search text), page (pagination)
 */
searchRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const queryText = (req.query.q as string) || '';
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);

    if (!queryText || queryText.trim().length === 0) {
      res.json({
        listings: [],
        totalCount: 0,
        expandedQuery: null,
        suggestions: [],
      });
      return;
    }

    // Build optional filter criteria from query params
    const filters: FilterCriteria = { page };

    const result = await searchService.search(queryText.trim(), filters);
    res.json(result);
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'SearchValidationError') {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Error performing search:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
