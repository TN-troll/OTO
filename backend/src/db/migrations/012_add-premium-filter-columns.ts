import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Add new columns for premium filter fields
  pgm.sql(`
    ALTER TABLE listings
      ADD COLUMN drivetrain VARCHAR(3) CHECK (drivetrain IN ('rwd', 'fwd', 'awd')),
      ADD COLUMN exterior_color VARCHAR(50),
      ADD COLUMN door_count SMALLINT,
      ADD COLUMN seat_count SMALLINT,
      ADD COLUMN condition VARCHAR(7) CHECK (condition IN ('new', 'used', 'classic')),
      ADD COLUMN engine_detail_config VARCHAR(10) CHECK (engine_detail_config IN (
        'inline-4', 'inline-6', 'v6', 'v8', 'v10', 'v12', 'flat-4', 'flat-6', 'w12', 'rotary'
      )),
      ADD COLUMN forced_induction_detail VARCHAR(20) CHECK (forced_induction_detail IN (
        'naturally_aspirated', 'turbocharged', 'supercharged', 'twin_turbo'
      )),
      ADD COLUMN zero_to_hundred_seconds DECIMAL(4,1),
      ADD COLUMN top_speed_kmh SMALLINT,
      ADD COLUMN is_special_edition BOOLEAN NOT NULL DEFAULT FALSE;
  `);

  // Partial indexes for filter performance
  pgm.createIndex('listings', 'drivetrain', {
    name: 'idx_listings_drivetrain',
    where: 'drivetrain IS NOT NULL',
  });

  pgm.createIndex('listings', 'exterior_color', {
    name: 'idx_listings_exterior_color',
    where: 'exterior_color IS NOT NULL',
  });

  pgm.createIndex('listings', 'door_count', {
    name: 'idx_listings_door_count',
    where: 'door_count IS NOT NULL',
  });

  pgm.createIndex('listings', 'seat_count', {
    name: 'idx_listings_seat_count',
    where: 'seat_count IS NOT NULL',
  });

  pgm.createIndex('listings', 'condition', {
    name: 'idx_listings_condition',
    where: 'condition IS NOT NULL',
  });

  pgm.createIndex('listings', 'engine_detail_config', {
    name: 'idx_listings_engine_detail_config',
    where: 'engine_detail_config IS NOT NULL',
  });

  pgm.createIndex('listings', 'forced_induction_detail', {
    name: 'idx_listings_forced_induction_detail',
    where: 'forced_induction_detail IS NOT NULL',
  });

  pgm.createIndex('listings', 'is_special_edition', {
    name: 'idx_listings_is_special_edition',
    where: 'is_special_edition = TRUE',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop indexes first
  pgm.dropIndex('listings', '', { name: 'idx_listings_is_special_edition' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_forced_induction_detail' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_engine_detail_config' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_condition' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_seat_count' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_door_count' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_exterior_color' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_drivetrain' });

  // Drop columns
  pgm.dropColumn('listings', 'is_special_edition');
  pgm.dropColumn('listings', 'top_speed_kmh');
  pgm.dropColumn('listings', 'zero_to_hundred_seconds');
  pgm.dropColumn('listings', 'forced_induction_detail');
  pgm.dropColumn('listings', 'engine_detail_config');
  pgm.dropColumn('listings', 'condition');
  pgm.dropColumn('listings', 'seat_count');
  pgm.dropColumn('listings', 'door_count');
  pgm.dropColumn('listings', 'exterior_color');
  pgm.dropColumn('listings', 'drivetrain');
}
