/**
 * Migration runner script.
 *
 * Usage:
 *   npx tsx src/db/migrate.ts up     -- apply all pending migrations
 *   npx tsx src/db/migrate.ts down   -- revert last migration
 *
 * Requires DATABASE_URL environment variable to be set.
 * Example: DATABASE_URL=postgres://user:pass@localhost:5432/car_ads
 */

import { resolve } from 'path';

const MIGRATIONS_DIR = resolve(__dirname, 'migrations');

async function run() {
  const direction = process.argv[2] || 'up';

  if (direction !== 'up' && direction !== 'down') {
    console.error('Usage: migrate.ts [up|down]');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required.');
    console.error('Example: DATABASE_URL=postgres://user:pass@localhost:5432/car_ads');
    process.exit(1);
  }

  // Dynamic import for node-pg-migrate
  const { default: migrate } = await import('node-pg-migrate');

  const result = await migrate({
    databaseUrl,
    migrationsTable: 'pgmigrations',
    dir: MIGRATIONS_DIR,
    direction: direction as 'up' | 'down',
    count: direction === 'down' ? 1 : Infinity,
    log: console.log,
    noLock: false,
  });

  if (result.length === 0) {
    console.log('No migrations to run.');
  } else {
    console.log(`Applied ${result.length} migration(s):`);
    result.forEach((m) => console.log(`  - ${m.name}`));
  }
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
