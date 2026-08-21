// Backend entry point for OTO - Online Top Occasions
// Serves both the API and the frontend static files from a single service.
// Deploy: restored notification banner with hooks fix

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

        -- Add description column if not exists
        DO $$ BEGIN
          ALTER TABLE listings ADD COLUMN IF NOT EXISTS description TEXT;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;

        -- Add translated description column
        DO $$ BEGIN
          ALTER TABLE listings ADD COLUMN IF NOT EXISTS description_en TEXT;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;

        -- Price history tracking
        CREATE TABLE IF NOT EXISTS price_history (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
          price DECIMAL(12,2) NOT NULL,
          recorded_at TIMESTAMPTZ DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_price_history_listing ON price_history(listing_id, recorded_at);

        -- Platform Improvements: extend listings table
        DO $$ BEGIN
          ALTER TABLE listings ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ;
          ALTER TABLE listings ADD COLUMN IF NOT EXISTS stale_check_count INTEGER DEFAULT 0;
          ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
          ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_sort_order INTEGER DEFAULT 0;
          ALTER TABLE listings ADD COLUMN IF NOT EXISTS dealer_email VARCHAR(300);
          ALTER TABLE listings ADD COLUMN IF NOT EXISTS body_type VARCHAR(30);
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;

        -- Image cache metadata
        CREATE TABLE IF NOT EXISTS image_cache (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          encoded_url TEXT UNIQUE NOT NULL,
          original_url TEXT NOT NULL,
          content_type VARCHAR(50) NOT NULL,
          file_path TEXT NOT NULL,
          file_size_bytes INTEGER NOT NULL,
          cached_at TIMESTAMPTZ DEFAULT NOW(),
          last_accessed TIMESTAMPTZ DEFAULT NOW()
        );

        -- Push notification subscriptions
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          endpoint TEXT UNIQUE NOT NULL,
          p256dh_key TEXT NOT NULL,
          auth_key TEXT NOT NULL,
          makes TEXT[] DEFAULT '{}',
          max_price DECIMAL(12,2),
          frequency VARCHAR(20) NOT NULL DEFAULT 'immediate',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Click tracking
        CREATE TABLE IF NOT EXISTS listing_clicks (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
          session_id VARCHAR(100) NOT NULL,
          clicked_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS listing_click_counts (
          listing_id UUID PRIMARY KEY REFERENCES listings(id) ON DELETE CASCADE,
          click_count INTEGER NOT NULL DEFAULT 0,
          last_clicked_at TIMESTAMPTZ
        );

        -- Dealer contact inquiries
        CREATE TABLE IF NOT EXISTS contact_inquiries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
          sender_name VARCHAR(200) NOT NULL,
          sender_email VARCHAR(300) NOT NULL,
          message TEXT,
          dealer_email VARCHAR(300),
          fallback_used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Premium membership interest signups
        CREATE TABLE IF NOT EXISTS premium_signups (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(300) NOT NULL UNIQUE,
          feature_interests TEXT[] NOT NULL DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Performance indexes
        CREATE INDEX IF NOT EXISTS idx_listings_make_status ON listings(make, status);
        CREATE INDEX IF NOT EXISTS idx_listings_price_status ON listings(price, status);
        CREATE INDEX IF NOT EXISTS idx_listings_horsepower_status ON listings(horsepower, status);
        CREATE INDEX IF NOT EXISTS idx_listings_year_status ON listings(year, status);
        CREATE INDEX IF NOT EXISTS idx_listings_status_date_added ON listings(status, date_added DESC);
        CREATE INDEX IF NOT EXISTS idx_listings_make_model_status ON listings(make, model, status);
        CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured DESC, featured_sort_order ASC) WHERE status = 'active';
        CREATE INDEX IF NOT EXISTS idx_listing_clicks_listing_id ON listing_clicks(listing_id);
        CREATE INDEX IF NOT EXISTS idx_listing_clicks_clicked_at ON listing_clicks(clicked_at DESC);
        CREATE INDEX IF NOT EXISTS idx_push_subscriptions_makes ON push_subscriptions USING gin(makes);
        CREATE INDEX IF NOT EXISTS idx_image_cache_last_accessed ON image_cache(last_accessed);
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

    // Scheduled jobs — only in database mode
    if (!useMock) {
      const SIX_HOURS = 6 * 60 * 60 * 1000;
      const ONE_HOUR = 60 * 60 * 1000;

      // Clean up any non-Dutch listings on startup (one-time)
      import('./map/cleanup-foreign-listings.js')
        .then(({ cleanupForeignListings }) => cleanupForeignListings())
        .catch(err => console.error('[OTO] Foreign listing cleanup failed:', err));

      console.log('[OTO] Cron schedule: scrape every 6h, enrich every 1h');

      // Full scrape every 6 hours
      setInterval(async () => {
        try {
          console.log('[OTO] [CRON] Running scheduled scrape...');
          const response = await fetch(`http://localhost:${port}/api/scrape-autoscout/run`);
          const result = await response.json();
          console.log('[OTO] [CRON] Scrape result:', JSON.stringify(result));
        } catch (err) {
          console.error('[OTO] [CRON] Scrape failed:', err);
        }
      }, SIX_HOURS);

      // Enrichment every hour (50 listings per run)
      setInterval(async () => {
        try {
          console.log('[OTO] [CRON] Running scheduled enrichment...');
          const response = await fetch(`http://localhost:${port}/api/scrape-autoscout/enrich`);
          const result = await response.json();
          console.log('[OTO] [CRON] Enrich result:', JSON.stringify(result));
        } catch (err) {
          console.error('[OTO] [CRON] Enrichment failed:', err);
        }
      }, ONE_HOUR);

      // Translation batch every hour (100 listings per run)
      setInterval(async () => {
        try {
          console.log('[OTO] [CRON] Running scheduled translation batch...');
          const response = await fetch(`http://localhost:${port}/api/translate/batch`, { method: 'POST' });
          const result = await response.json();
          console.log('[OTO] [CRON] Translation result:', JSON.stringify(result));
        } catch (err) {
          console.error('[OTO] [CRON] Translation failed:', err);
        }
      }, ONE_HOUR);

      // Sound profile assignment every 6 hours
      setInterval(async () => {
        try {
          console.log('[OTO] [CRON] Running sound profile assignment...');
          const response = await fetch(`http://localhost:${port}/api/sound-profiles/assign`);
          const result = await response.json();
          console.log('[OTO] [CRON] Sound profiles result:', JSON.stringify(result));
        } catch (err) {
          console.error('[OTO] [CRON] Sound profile assignment failed:', err);
        }
      }, SIX_HOURS);

      // Run initial scrape 5 minutes after startup (allow server to pass health check first)
      setTimeout(async () => {
        try {
          console.log('[OTO] [CRON] Running initial post-startup scrape...');
          const response = await fetch(`http://localhost:${port}/api/scrape-autoscout/run`);
          const result = await response.json();
          console.log('[OTO] [CRON] Initial scrape result:', JSON.stringify(result));
        } catch (err) {
          console.error('[OTO] [CRON] Initial scrape failed:', err);
        }
      }, 300_000); // 5 minutes
    }
  });
}

start().catch((err) => {
  console.error('[OTO] Failed to start:', err);
  process.exit(1);
});
