import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Partial indexes for filter performance (only active listings)
  pgm.createIndex('listings', 'price', {
    name: 'idx_listings_price',
    where: "status = 'active'",
  });

  pgm.createIndex('listings', 'horsepower', {
    name: 'idx_listings_horsepower',
    where: "status = 'active'",
  });

  pgm.createIndex('listings', 'engine_displacement_cc', {
    name: 'idx_listings_displacement',
    where: "status = 'active'",
  });

  pgm.createIndex('listings', 'year', {
    name: 'idx_listings_year',
    where: "status = 'active'",
  });

  pgm.createIndex('listings', [{ name: 'date_added', sort: 'DESC' }], {
    name: 'idx_listings_date_added',
    where: "status = 'active'",
  });

  pgm.createIndex('listings', ['make', 'model'], {
    name: 'idx_listings_make_model',
    where: "status = 'active'",
  });

  pgm.createIndex('listings', 'sound_profile_id', {
    name: 'idx_listings_sound_profile',
    where: "status = 'active'",
  });

  pgm.createIndex('listings', 'fuel_type', {
    name: 'idx_listings_fuel_type',
    where: "status = 'active'",
  });

  pgm.createIndex('listings', 'transmission_type', {
    name: 'idx_listings_transmission',
    where: "status = 'active'",
  });

  // Full-text search index using GIN
  pgm.sql(`
    CREATE INDEX idx_listings_search ON listings USING gin(
      to_tsvector('simple', make || ' ' || model || ' ' || title)
    ) WHERE status = 'active';
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('listings', '', { name: 'idx_listings_search' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_transmission' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_fuel_type' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_sound_profile' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_make_model' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_date_added' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_year' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_displacement' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_horsepower' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_price' });
}
