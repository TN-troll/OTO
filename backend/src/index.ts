// Backend entry point for the Exclusive Car Ads Aggregator
// Uses mock mode when DATABASE_URL is not configured (no PostgreSQL/Redis needed)

import { env } from './config/env.js';

const port = env.PORT;

async function start() {
  const useMock = !process.env.DATABASE_URL;

  if (useMock) {
    console.log('[car-ads] Starting in MOCK MODE (no database required)');
    const { createMockApp } = await import('./mock/mock-server.js');
    const app = createMockApp();
    app.listen(port, () => {
      console.log(`[car-ads] Mock API server running at http://localhost:${port}`);
      console.log(`[car-ads] Serving 10 sample luxury car listings`);
    });
  } else {
    console.log('[car-ads] Starting with database connection');
    const { createApp } = await import('./api/server.js');
    const app = createApp();
    app.listen(port, () => {
      console.log(`[car-ads] API server running at http://localhost:${port}`);
      console.log(`[car-ads] Environment: ${env.NODE_ENV}`);
    });
  }
}

start().catch((err) => {
  console.error('[car-ads] Failed to start:', err);
  process.exit(1);
});
