import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('curation_config', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    config_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    value: {
      type: 'jsonb',
      notNull: true,
    },
    updated_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('curation_config');
}
