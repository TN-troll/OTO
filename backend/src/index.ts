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
    console.log(`[OTO] DATABASE_URL found: ${env.DATABASE_URL.replace(/:[^:@]+@/, ':***@').substring(0, 80)}`);
    console.log('[OTO] Running database migrations...');

    // Auto-run migrations on startup
    try {
      const { pool } = await import('./db/connection.js');
      // Simple migration: create tables if they don't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS sound_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          engine_configuration VARCHAR(20) NOT NULL,
          cylinder_count INTEGER NOT NULL,
          forced_induction VARCHAR(30) NOT NULL,
          exhaust_note VARCHAR(30) NOT NULL,
          audio_clip_url TEXT,
          audio_clip_duration_seconds INTEGER,
          make VARCHAR(100) NOT NULL,
          model VARCHAR(200) NOT NULL,
          UNIQUE(make, model, engine_configuration, cylinder_count, forced_induction)
        );

        CREATE TABLE IF NOT EXISTS listings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(500) NOT NULL,
          price DECIMAL(12,2) NOT NULL,
          mileage INTEGER,
          year INTEGER NOT NULL,
          make VARCHAR(100) NOT NULL,
          model VARCHAR(200) NOT NULL,
          engine_displacement_cc INTEGER,
          horsepower INTEGER,
          location VARCHAR(200),
          seller_type VARCHAR(20),
          transmission_type VARCHAR(20),
          fuel_type VARCHAR(20),
          image_urls TEXT[] DEFAULT '{}',
          sound_profile_id UUID REFERENCES sound_profiles(id),
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          curation_criteria TEXT[] DEFAULT '{}',
          date_added TIMESTAMPTZ DEFAULT NOW(),
          last_verified TIMESTAMPTZ DEFAULT NOW(),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS source_references (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
          marketplace VARCHAR(50) NOT NULL,
          url TEXT NOT NULL,
          external_id VARCHAR(200),
          last_checked TIMESTAMPTZ DEFAULT NOW(),
          is_active BOOLEAN DEFAULT TRUE,
          UNIQUE(marketplace, external_id)
        );

        CREATE TABLE IF NOT EXISTS curation_config (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          config_type VARCHAR(50) NOT NULL,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS marketplace_health (
          marketplace VARCHAR(50) PRIMARY KEY,
          status VARCHAR(20) NOT NULL DEFAULT 'healthy',
          last_successful_contact TIMESTAMPTZ,
          consecutive_failures INTEGER DEFAULT 0,
          unreachable_since TIMESTAMPTZ,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS import_failures (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          marketplace VARCHAR(50) NOT NULL,
          source_url TEXT,
          raw_data JSONB,
          failure_reason TEXT NOT NULL,
          attempt_count INTEGER DEFAULT 1,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      console.log('[OTO] Database tables ready');
    } catch (err) {
      console.error('[OTO] Migration failed:', err);
      console.log('[OTO] Falling back to mock mode');
      const { createMockApp } = await import('./mock/mock-server.js');
      app = createMockApp();
      app.listen(port, host, () => {
        console.log(`[OTO] Mock server running at http://${host}:${port} (DB unavailable)`);
      });
      return;
    }

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

    // Daily auto-scrape (every 24 hours) — only in database mode
    if (!useMock) {
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      console.log('[OTO] Daily auto-scrape scheduled (every 24h)');
      setInterval(async () => {
        try {
          console.log('[OTO] Running daily auto-scrape...');
          const response = await fetch(`http://localhost:${port}/api/scrape-real/autotrack`);
          const result = await response.json();
          console.log('[OTO] Daily scrape result:', result);
        } catch (err) {
          console.error('[OTO] Daily scrape failed:', err);
        }
      }, TWENTY_FOUR_HOURS);
    }
  });
}

start().catch((err) => {
  console.error('[OTO] Failed to start:', err);
  process.exit(1);
});
