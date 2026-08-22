import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('dealer_ratings', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    device_token: { type: 'varchar(64)', notNull: true },
    location: { type: 'varchar(200)', notNull: true },
    seller_type: { type: 'varchar(20)', notNull: true },
    rating: { type: 'integer', notNull: true }, // 1-5
    comment: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('dealer_ratings', 'unique_device_dealer', { unique: ['device_token', 'location', 'seller_type'] });
  pgm.createIndex('dealer_ratings', ['location', 'seller_type']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('dealer_ratings');
}
