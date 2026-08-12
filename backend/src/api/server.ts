import express from 'express';
import { listingsRouter } from './listings.js';
import { searchRouter } from './search.js';
import { soundProfilesRouter } from './sound-profiles.js';
import { healthRouter } from './health.js';
import { filterOptionsRouter } from './filter-options.js';
import { scrapeRouter } from './scrape.js';
import { scrapeRealRouter } from './scrape-real.js';
import { scrapeAutoscoutRouter } from './scrape-autoscout.js';
import { smartSearchRouter } from './smart-search.js';
import { env } from '../config/env.js';

/**
 * Create and configure the Express application.
 * Separated from listen() to enable testing.
 */
export function createApp(): express.Application {
  const app = express();

  // CORS
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });

  // Middleware
  app.use(express.json());

  // Route modules
  app.use('/api/listings', listingsRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/sound-profiles', soundProfilesRouter);
  app.use('/api/marketplace-health', healthRouter);
  app.use('/api/filter-options', filterOptionsRouter);
  app.use('/api/scrape', scrapeRouter);
  app.use('/api/scrape-real', scrapeRealRouter);
  app.use('/api/scrape-autoscout', scrapeAutoscoutRouter);
  app.use('/api/smart-search', smartSearchRouter);

  return app;
}

/**
 * Start the Express server on the configured port.
 */
export function startServer(): void {
  const app = createApp();
  const port = env.PORT;

  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
}
