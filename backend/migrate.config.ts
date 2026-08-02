/**
 * node-pg-migrate configuration file.
 *
 * This config is used by the CLI when running:
 *   npx node-pg-migrate up
 *   npx node-pg-migrate down
 *
 * Set DATABASE_URL env variable before running migrations.
 */
export default {
  databaseUrl: process.env.DATABASE_URL || 'postgres://localhost:5432/car_ads',
  migrationsTable: 'pgmigrations',
  dir: 'src/db/migrations',
  'migration-file-language': 'ts' as const,
};
