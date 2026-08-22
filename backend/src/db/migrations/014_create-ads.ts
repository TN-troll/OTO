import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable('ads', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    title: {
      type: 'varchar(200)',
      notNull: true,
    },
    description: {
      type: 'text',
    },
    image_url: {
      type: 'text',
    },
    link_url: {
      type: 'text',
      notNull: true,
    },
    /** Where the ad appears: 'feed', 'sidebar', 'detail', 'header' */
    placement: {
      type: 'varchar(20)',
      notNull: true,
      default: "'feed'",
    },
    /** Priority (higher = shown first): 0-100 */
    priority: {
      type: 'integer',
      notNull: true,
      default: 50,
    },
    /** Whether this ad is currently active */
    is_active: {
      type: 'boolean',
      notNull: true,
      default: true,
    },
    /** Optional: target specific car makes (null = all) */
    target_makes: {
      type: 'text[]',
      default: "'{}'",
    },
    /** Click count for analytics */
    click_count: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    /** Impression count for analytics */
    impression_count: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    /** Start date — ad is active from this date (null = immediately) */
    starts_at: {
      type: 'timestamptz',
    },
    /** End date — ad expires after this date (null = never) */
    ends_at: {
      type: 'timestamptz',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createIndex('ads', ['placement', 'is_active']);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable('ads');
}
