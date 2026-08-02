import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('source_references', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    listing_id: {
      type: 'uuid',
      notNull: true,
      references: 'listings(id)',
      onDelete: 'CASCADE',
    },
    marketplace: {
      type: 'varchar(50)',
      notNull: true,
    },
    url: {
      type: 'text',
      notNull: true,
    },
    external_id: {
      type: 'varchar(200)',
    },
    last_checked: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
    is_active: {
      type: 'boolean',
      default: true,
    },
  });

  pgm.addConstraint('source_references', 'uq_source_references_marketplace_external_id', {
    unique: ['marketplace', 'external_id'],
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('source_references');
}
