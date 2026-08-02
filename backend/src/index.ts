// Backend entry point for the Exclusive Car Ads Aggregator
// Uses mock mode when DATABASE_URL is not configured (no PostgreSQL/Redis needed)

import { env } from './config/env.js';

const port = env.PORT;
const host = '0.0.0.0'; // Bind to all interfaces (required for Railway/Docker)

async function start() {
  const useMock = !process.env.DATABASE_URL;

  if (useMock) {
    console.log('[OTO] Starting in MOCK MODE (no database required)');
    const { createMockApp } = await import('./mock/mock-server.js');
    const app = createMockApp();
    app.listen(port, host, () => {
      console.log(`[OTO] Mock API server running at http://${host}:${port}`);
      console.log(`[OTO] Serving 10 sample luxury car listings`);
    });
  } else {
    console.log('[OTO] Starting with database connection');
    const { createApp } = await import('./api/server.js');
    const app = createApp();
    app.listen(port, host, () => {
      console.log(`[OTO] API server running at http://${host}:${port}`);
      console.log(`[OTO] Environment: ${env.NODE_ENV}`);
    });
  }
}

start().catch((err) => {
  console.error('[OTO] Failed to start:', err);
  process.exit(1);
});
