import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('marketplace_health', {
    marketplace: {
      type: 'varchar(50)',
      primaryKey: true,
    },
    status: {
      type: 'varchar(20)',
      notNull: true,
      default: "'healthy'",
    },
    last_successful_contact: {
      type: 'timestamptz',
    },
    consecutive_failures: {
      type: 'integer',
      default: 0,
    },
    unreachable_since: {
      type: 'timestamptz',
    },
    updated_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('marketplace_health');
}
