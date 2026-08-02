import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

const INITIAL_LUXURY_BRANDS = [
  'Ferrari',
  'Lamborghini',
  'Bentley',
  'Rolls-Royce',
  'McLaren',
  'Aston Martin',
  'Bugatti',
];

const INITIAL_EXCLUSIVE_MODELS = [
  { make: 'Porsche', model: '911 GT3' },
  { make: 'BMW', model: 'M5' },
  { make: 'Mercedes', model: 'AMG GT' },
  { make: 'Audi', model: 'R8' },
  { make: 'Nissan', model: 'GT-R' },
];

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(
    `INSERT INTO curation_config (config_type, value) VALUES ('luxury_brands', '${JSON.stringify(INITIAL_LUXURY_BRANDS)}'::jsonb)`,
  );
  pgm.sql(
    `INSERT INTO curation_config (config_type, value) VALUES ('exclusive_models', '${JSON.stringify(INITIAL_EXCLUSIVE_MODELS)}'::jsonb)`,
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DELETE FROM curation_config WHERE config_type IN ('luxury_brands', 'exclusive_models')`);
}
