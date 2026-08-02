import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('import_failures', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    marketplace: {
      type: 'varchar(50)',
      notNull: true,
    },
    source_url: {
      type: 'text',
    },
    raw_data: {
      type: 'jsonb',
    },
    failure_reason: {
      type: 'text',
      notNull: true,
    },
    attempt_count: {
      type: 'integer',
      default: 1,
    },
    created_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('import_failures');
}
