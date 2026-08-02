import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('listings', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title: {
      type: 'varchar(500)',
      notNull: true,
    },
    price: {
      type: 'decimal(12,2)',
      notNull: true,
    },
    mileage: {
      type: 'integer',
    },
    year: {
      type: 'integer',
      notNull: true,
    },
    make: {
      type: 'varchar(100)',
      notNull: true,
    },
    model: {
      type: 'varchar(200)',
      notNull: true,
    },
    engine_displacement_cc: {
      type: 'integer',
    },
    horsepower: {
      type: 'integer',
    },
    location: {
      type: 'varchar(200)',
    },
    seller_type: {
      type: 'varchar(20)',
    },
    transmission_type: {
      type: 'varchar(20)',
    },
    fuel_type: {
      type: 'varchar(20)',
    },
    image_urls: {
      type: 'text[]',
      default: "'{}'",
    },
    sound_profile_id: {
      type: 'uuid',
      references: 'sound_profiles(id)',
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: "'active'",
    },
    curation_criteria: {
      type: 'text[]',
      default: "'{}'",
    },
    date_added: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
    last_verified: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
    created_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
    updated_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('listings');
}
