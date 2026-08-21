import { Router, Request, Response } from 'express';
import type { FilterCriteria, SortField, SortOrder } from '@car-ads/shared';
import { DEFAULT_PAGE_SIZE } from '@car-ads/shared';
import { FilterEngine } from '../filter/filter-engine.js';
import { query, queryOne } from '../db/connection.js';

export const listingsRouter = Router();

const filterEngine = new FilterEngine();

/**
 * GET /api/listings
 *
 * Browse listings with pagination and sorting.
 * Query params: page, pageSize, sortBy, sortOrder
 * Defaults: page=1, pageSize=50, sortBy=dateAdded, sortOrder=desc
 */
listingsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string, 10) || DEFAULT_PAGE_SIZE));
    const sortBy = (req.query.sortBy as SortField) || 'dateAdded';
    const sortOrder = (req.query.sortOrder as SortOrder) || 'desc';

    const validSortFields: SortField[] = ['price', 'horsepower', 'engineDisplacement', 'year', 'dateAdded'];
    if (!validSortFields.includes(sortBy)) {
      res.status(400).json({ error: `Invalid sortBy value. Must be one of: ${validSortFields.join(', ')}` });
      return;
    }

    const validSortOrders: SortOrder[] = ['asc', 'desc'];
    if (!validSortOrders.includes(sortOrder)) {
      res.status(400).json({ error: 'Invalid sortOrder value. Must be "asc" or "desc".' });
      return;
    }

    const criteria: FilterCriteria = {
      page,
      pageSize,
      sortBy,
      sortOrder,
    };

    const result = await filterEngine.query(criteria);
    res.json(result);
  } catch (err) {
    console.error('Error fetching listings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/listings/:id
 *
 * Full listing detail including all specs, images, sound profile, and source URLs.
 */
listingsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const listing = await queryOne<{
      id: string;
      title: string;
      description: string | null;
      description_en: string | null;
      price: number;
      mileage: number | null;
      year: number;
      make: string;
      model: string;
      engine_displacement_cc: number | null;
      horsepower: number | null;
      location: string | null;
      seller_type: string | null;
      transmission_type: string | null;
      fuel_type: string | null;
      image_urls: string[];
      sound_profile_id: string | null;
      status: string;
      curation_criteria: string[];
      date_added: Date;
      last_verified: Date;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, title, description, description_en, price, mileage, year, make, model,
              engine_displacement_cc, horsepower, location, seller_type,
              transmission_type, fuel_type, image_urls, sound_profile_id,
              status, curation_criteria, date_added, last_verified,
              created_at, updated_at
       FROM listings
       WHERE id = $1`,
      [id],
    );

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    // Fetch source references
    const sourceRefsResult = await query<{
      marketplace: string;
      url: string;
      external_id: string;
      last_checked: Date;
      is_active: boolean;
    }>(
      `SELECT marketplace, url, external_id, last_checked, is_active
       FROM source_references
       WHERE listing_id = $1`,
      [id],
    );

    const sourceUrls = sourceRefsResult.rows.map((row) => ({
      marketplace: row.marketplace,
      url: row.url,
      externalId: row.external_id,
      lastChecked: row.last_checked,
      isActive: row.is_active,
    }));

    // Compute market average price for same make+model
    const avgResult = await queryOne<{ avg_price: string }>(
      `SELECT AVG(price) as avg_price FROM listings WHERE make = $1 AND model = $2 AND status = 'active' AND id != $3`,
      [listing.make, listing.model, listing.id]
    );
    const marketAvgPrice = avgResult?.avg_price ? parseFloat(avgResult.avg_price) : null;

    // Fetch sound profile if present
    let soundProfile = null;
    if (listing.sound_profile_id) {
      const spRow = await queryOne<{
        id: string;
        engine_configuration: string;
        cylinder_count: number;
        forced_induction: string;
        exhaust_note: string;
        audio_clip_url: string | null;
        audio_clip_duration_seconds: number | null;
      }>(
        `SELECT id, engine_configuration, cylinder_count, forced_induction,
                exhaust_note, audio_clip_url, audio_clip_duration_seconds
         FROM sound_profiles
         WHERE id = $1`,
        [listing.sound_profile_id],
      );

      if (spRow) {
        soundProfile = {
          id: spRow.id,
          engineConfiguration: spRow.engine_configuration,
          cylinderCount: spRow.cylinder_count,
          forcedInduction: spRow.forced_induction,
          exhaustNote: spRow.exhaust_note,
          audioClipUrl: spRow.audio_clip_url,
          audioClipDurationSeconds: spRow.audio_clip_duration_seconds,
        };
      }
    }

    const response = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      descriptionEn: listing.description_en,
      price: listing.price,
      mileage: listing.mileage,
      year: listing.year,
      make: listing.make,
      model: listing.model,
      engineDisplacementCc: listing.engine_displacement_cc,
      horsepower: listing.horsepower,
      location: listing.location,
      sellerType: listing.seller_type,
      transmissionType: listing.transmission_type,
      fuelType: listing.fuel_type,
      imageUrls: listing.image_urls,
      sourceUrls,
      soundProfile,
      status: listing.status,
      curationCriteria: listing.curation_criteria,
      dateAdded: listing.date_added,
      lastVerified: listing.last_verified,
      createdAt: listing.created_at,
      updatedAt: listing.updated_at,
      marketAvgPrice,
    };

    res.json(response);
  } catch (err) {
    console.error('Error fetching listing detail:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/listings/:id/similar
 *
 * Returns up to 6 similar listings based on make, price range (±30%), and horsepower range (±20%).
 */
listingsRouter.get('/:id/similar', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // First fetch the listing to get its specs
    const listing = await queryOne<{
      id: string;
      make: string;
      price: number;
      horsepower: number | null;
    }>(
      `SELECT id, make, price, horsepower FROM listings WHERE id = $1`,
      [id],
    );

    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const priceLow = Math.round(listing.price * 0.7);
    const priceHigh = Math.round(listing.price * 1.3);

    let similarQuery: string;
    let params: unknown[];

    if (listing.horsepower) {
      const hpLow = Math.round(listing.horsepower * 0.8);
      const hpHigh = Math.round(listing.horsepower * 1.2);
      similarQuery = `
        SELECT id, title, make, model, year, price, horsepower, engine_displacement_cc, image_urls, date_added
        FROM listings
        WHERE id != $1
          AND status = 'active'
          AND (make = $2 OR (price BETWEEN $3 AND $4 AND horsepower BETWEEN $5 AND $6))
        ORDER BY
          CASE WHEN make = $2 THEN 0 ELSE 1 END,
          ABS(price - $7)
        LIMIT 6
      `;
      params = [id, listing.make, priceLow, priceHigh, hpLow, hpHigh, listing.price];
    } else {
      similarQuery = `
        SELECT id, title, make, model, year, price, horsepower, engine_displacement_cc, image_urls, date_added
        FROM listings
        WHERE id != $1
          AND status = 'active'
          AND (make = $2 OR price BETWEEN $3 AND $4)
        ORDER BY
          CASE WHEN make = $2 THEN 0 ELSE 1 END,
          ABS(price - $5)
        LIMIT 6
      `;
      params = [id, listing.make, priceLow, priceHigh, listing.price];
    }

    const result = await query<{
      id: string;
      title: string;
      make: string;
      model: string;
      year: number;
      price: number;
      horsepower: number | null;
      engine_displacement_cc: number | null;
      image_urls: string[];
      date_added: Date;
    }>(similarQuery, params);

    const similarListings = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      make: row.make,
      model: row.model,
      year: row.year,
      price: row.price,
      horsepower: row.horsepower,
      engineDisplacementCc: row.engine_displacement_cc,
      primaryImageUrl: row.image_urls?.[0] || null,
      imageUrls: (row.image_urls ?? []).slice(0, 4),
      dateAdded: row.date_added,
    }));

    res.json(similarListings);
  } catch (err) {
    console.error('Error fetching similar listings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/listings/:id/price-history
 *
 * Returns historical price changes for a listing.
 */
listingsRouter.get('/:id/price-history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await query<{ price: string; recorded_at: Date }>(
      `SELECT price, recorded_at FROM price_history WHERE listing_id = $1 ORDER BY recorded_at ASC`,
      [id]
    );
    res.json({ history: result.rows.map(r => ({ price: parseFloat(r.price), date: r.recorded_at })) });
  } catch (err) {
    console.error('Error fetching price history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/listings/filter
 *
 * Filter listings with a FilterCriteria body.
 * Returns a FilterResult with paginated, sorted results.
 */
listingsRouter.post('/filter', async (req: Request, res: Response): Promise<void> => {
  try {
    const criteria: FilterCriteria = req.body;

    // Validate criteria
    const validation = filterEngine.validateCriteria(criteria);
    if (!validation.valid) {
      res.status(400).json({ error: 'Invalid filter criteria', details: validation.errors });
      return;
    }

    const result = await filterEngine.query(criteria);
    res.json(result);
  } catch (err) {
    console.error('Error filtering listings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/listings/filter/cursor
 *
 * Cursor-based pagination for infinite scroll.
 * Body: { cursor?, limit, filters, sort? }
 * Returns: { items, nextCursor, totalCount }
 */
listingsRouter.post('/filter/cursor', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cursor, limit = 20, filters = {}, sort } = req.body;

    const result = await filterEngine.queryCursor({
      cursor,
      limit: Math.max(1, Math.min(100, Number(limit))),
      filters,
      sort,
    });

    res.json(result);
  } catch (err: any) {
    if (err.message?.includes('Invalid cursor') || err.message?.includes('Invalid filter criteria')) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Error in cursor pagination:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
