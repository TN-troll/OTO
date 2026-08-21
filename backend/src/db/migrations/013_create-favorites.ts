import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('user_favorites', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    device_token: {
      type: 'varchar(64)',
      notNull: true,
    },
    listing_id: {
      type: 'uuid',
      notNull: true,
      references: 'listings',
      onDelete: 'CASCADE',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint('user_favorites', 'unique_device_listing', {
    unique: ['device_token', 'listing_id'],
  });

  pgm.createIndex('user_favorites', 'device_token');
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('user_favorites');
}
