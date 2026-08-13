import { MigrationBuilder, ColumnDefinitions } from 'node-pg-migrate';

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Composite indexes for common filter combinations
  pgm.createIndex('listings', ['make', 'status'], {
    name: 'idx_listings_make_status',
  });

  pgm.createIndex('listings', ['price', 'status'], {
    name: 'idx_listings_price_status',
  });

  pgm.createIndex('listings', ['horsepower', 'status'], {
    name: 'idx_listings_horsepower_status',
  });

  pgm.createIndex('listings', ['year', 'status'], {
    name: 'idx_listings_year_status',
  });

  pgm.createIndex('listings', ['status', { name: 'date_added', sort: 'DESC' }], {
    name: 'idx_listings_status_date_added',
  });

  pgm.createIndex('listings', ['make', 'model', 'status'], {
    name: 'idx_listings_make_model_status',
  });

  // Featured listings index (partial on active status)
  pgm.createIndex(
    'listings',
    [
      { name: 'is_featured', sort: 'DESC' },
      { name: 'featured_sort_order', sort: 'ASC' },
    ],
    {
      name: 'idx_listings_featured',
      where: "status = 'active'",
    }
  );

  // Click tracking indexes
  pgm.createIndex('listing_clicks', 'listing_id', {
    name: 'idx_listing_clicks_listing_id',
  });

  pgm.createIndex('listing_clicks', [{ name: 'clicked_at', sort: 'DESC' }], {
    name: 'idx_listing_clicks_clicked_at',
  });

  // Push subscription GIN index for array matching
  pgm.sql(`
    CREATE INDEX idx_push_subscriptions_makes ON push_subscriptions USING gin(makes);
  `);

  // Image cache lookup index
  pgm.createIndex('image_cache', 'last_accessed', {
    name: 'idx_image_cache_last_accessed',
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex('image_cache', '', { name: 'idx_image_cache_last_accessed' });
  pgm.dropIndex('push_subscriptions', '', { name: 'idx_push_subscriptions_makes' });
  pgm.dropIndex('listing_clicks', '', { name: 'idx_listing_clicks_clicked_at' });
  pgm.dropIndex('listing_clicks', '', { name: 'idx_listing_clicks_listing_id' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_featured' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_make_model_status' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_status_date_added' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_year_status' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_horsepower_status' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_price_status' });
  pgm.dropIndex('listings', '', { name: 'idx_listings_make_status' });
}
