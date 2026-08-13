import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Stale detection: extend listings table
  pgm.addColumn('listings', {
    sold_at: {
      type: 'timestamptz',
    },
    stale_check_count: {
      type: 'integer',
      default: 0,
    },
  });

  // Featured listings: extend listings table
  pgm.addColumn('listings', {
    is_featured: {
      type: 'boolean',
      default: false,
    },
    featured_sort_order: {
      type: 'integer',
      default: 0,
    },
  });

  // Image cache metadata
  pgm.createTable('image_cache', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    encoded_url: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    original_url: {
      type: 'text',
      notNull: true,
    },
    content_type: {
      type: 'varchar(50)',
      notNull: true,
    },
    file_path: {
      type: 'text',
      notNull: true,
    },
    file_size_bytes: {
      type: 'integer',
      notNull: true,
    },
    cached_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
    last_accessed: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
  });

  // Push notification subscriptions
  pgm.createTable('push_subscriptions', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    endpoint: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    p256dh_key: {
      type: 'text',
      notNull: true,
    },
    auth_key: {
      type: 'text',
      notNull: true,
    },
    makes: {
      type: 'text[]',
      default: "'{}'",
    },
    max_price: {
      type: 'decimal(12,2)',
    },
    frequency: {
      type: 'varchar(20)',
      notNull: true,
      default: "'immediate'",
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

  // Click tracking
  pgm.createTable('listing_clicks', {
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
    session_id: {
      type: 'varchar(100)',
      notNull: true,
    },
    clicked_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
  });

  pgm.createTable('listing_click_counts', {
    listing_id: {
      type: 'uuid',
      primaryKey: true,
      references: 'listings(id)',
      onDelete: 'CASCADE',
    },
    click_count: {
      type: 'integer',
      notNull: true,
      default: 0,
    },
    last_clicked_at: {
      type: 'timestamptz',
    },
  });

  // Dealer contact inquiries
  pgm.createTable('contact_inquiries', {
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
    sender_name: {
      type: 'varchar(200)',
      notNull: true,
    },
    sender_email: {
      type: 'varchar(300)',
      notNull: true,
    },
    message: {
      type: 'text',
    },
    dealer_email: {
      type: 'varchar(300)',
    },
    fallback_used: {
      type: 'boolean',
      default: false,
    },
    created_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
  });

  // Premium membership interest signups
  pgm.createTable('premium_signups', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('gen_random_uuid()'),
    },
    email: {
      type: 'varchar(300)',
      notNull: true,
      unique: true,
    },
    feature_interests: {
      type: 'text[]',
      notNull: true,
      default: "'{}'",
    },
    created_at: {
      type: 'timestamptz',
      default: pgm.func('NOW()'),
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop tables in reverse order (respecting foreign key dependencies)
  pgm.dropTable('premium_signups');
  pgm.dropTable('contact_inquiries');
  pgm.dropTable('listing_click_counts');
  pgm.dropTable('listing_clicks');
  pgm.dropTable('push_subscriptions');
  pgm.dropTable('image_cache');

  // Remove added columns from listings
  pgm.dropColumn('listings', 'featured_sort_order');
  pgm.dropColumn('listings', 'is_featured');
  pgm.dropColumn('listings', 'stale_check_count');
  pgm.dropColumn('listings', 'sold_at');
}
