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
import { translateRouter } from './translate.js';
import { imagesRouter } from './images.js';
import { clicksRouter } from './clicks.js';
import { contactRouter } from './contact.js';
import { featuredRouter } from './featured.js';
import { notificationsRouter } from './notifications.js';
import { premiumSignupRouter } from './premium-signup.js';
import { mapRouter } from './map.js';
import { favoritesRouter } from './favorites.js';
import { adsRouter } from './ads.js';
import { rdwRouter } from './rdw.js';
import { authRouter } from './auth.js';
import { priceEstimateRouter } from './price-estimate.js';
import { ratingsRouter } from './ratings.js';
import { digestRouter } from './digest.js';
import { dealerPortalRouter } from './dealer-portal.js';
import { cacheMiddleware } from './middleware/cache.js';
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
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-Device-Token');
    if (_req.method === 'OPTIONS') { res.sendStatus(204); return; }
    next();
  });

  // Middleware
  app.use(express.json());
  app.use(cacheMiddleware());

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
  app.use('/api/translate', translateRouter);
  app.use('/api/images', imagesRouter);
  app.use('/api', clicksRouter);
  app.use('/api/contact', contactRouter);
  app.use('/api/admin/featured', featuredRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/premium-signup', premiumSignupRouter);
  app.use('/api/map', mapRouter);
  app.use('/api/favorites', favoritesRouter);
  app.use('/api/ads', adsRouter);
  app.use('/api/rdw', rdwRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/price-estimate', priceEstimateRouter);
  app.use('/api/ratings', ratingsRouter);
  app.use('/api/digest', digestRouter);
  app.use('/api/dealer', dealerPortalRouter);

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
