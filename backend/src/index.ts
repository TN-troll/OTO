// Backend entry point for OTO - Online Top Occasions
// Serves both the API and the frontend static files from a single service.

import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { env } from './config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = env.PORT;
const host = '0.0.0.0';

async function start() {
  const useMock = !process.env.DATABASE_URL;

  let app: express.Application;

  if (useMock) {
    console.log('[OTO] Starting in MOCK MODE (no database required)');
    const { createMockApp } = await import('./mock/mock-server.js');
    app = createMockApp();
  } else {
    console.log('[OTO] Starting with database connection');
    const { createApp } = await import('./api/server.js');
    app = createApp();
  }

  // Serve frontend static files (built by Vite)
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDist));

  // SPA fallback: serve index.html for all non-API routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  app.listen(port, host, () => {
    console.log(`[OTO] Server running at http://${host}:${port}`);
    console.log(`[OTO] Mode: ${useMock ? 'MOCK' : 'DATABASE'}`);
    console.log(`[OTO] Frontend: serving from ${frontendDist}`);
  });
}

start().catch((err) => {
  console.error('[OTO] Failed to start:', err);
  process.exit(1);
});
