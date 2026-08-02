import { Router, Request, Response } from 'express';
import type { MarketplaceId } from '@car-ads/shared';
import { ScraperCoordinator } from '../scraping/scraper-coordinator.js';

export const healthRouter = Router();

const MARKETPLACES: MarketplaceId[] = ['autotrack', 'autoscout24', 'marktplaats'];

/**
 * GET /api/marketplace-health
 *
 * Returns the health status for all configured marketplaces.
 */
healthRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const coordinator = new ScraperCoordinator();

    const healthStatuses = await Promise.all(
      MARKETPLACES.map((marketplace) => coordinator.getMarketplaceHealth(marketplace)),
    );

    await coordinator.shutdown();

    res.json({ marketplaces: healthStatuses });
  } catch (err) {
    console.error('Error fetching marketplace health:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
