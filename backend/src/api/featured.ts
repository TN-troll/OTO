import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db/connection.js';

export const featuredRouter = Router();

/**
 * FeaturedListingService manages the featured flag and sort order on listings.
 */
export class FeaturedListingService {
  /**
   * Set a listing as featured with a given sort order.
   * Only active listings can be featured.
   */
  async setFeatured(listingId: string, sortOrder: number): Promise<void> {
    const listing = await queryOne<{ id: string; status: string }>(
      `SELECT id, status FROM listings WHERE id = $1`,
      [listingId],
    );

    if (!listing) {
      throw new NotFoundError(`Listing ${listingId} not found`);
    }

    if (listing.status !== 'active') {
      throw new ValidationError(`Cannot feature a listing with status "${listing.status}". Only active listings can be featured.`);
    }

    await query(
      `UPDATE listings SET is_featured = TRUE, featured_sort_order = $2, updated_at = NOW() WHERE id = $1`,
      [listingId, sortOrder],
    );
  }

  /**
   * Remove the featured flag from a listing.
   */
  async removeFeatured(listingId: string): Promise<void> {
    const listing = await queryOne<{ id: string }>(
      `SELECT id FROM listings WHERE id = $1`,
      [listingId],
    );

    if (!listing) {
      throw new NotFoundError(`Listing ${listingId} not found`);
    }

    await query(
      `UPDATE listings SET is_featured = FALSE, featured_sort_order = 0, updated_at = NOW() WHERE id = $1`,
      [listingId],
    );
  }

  /**
   * Get all currently featured active listings, ordered by sort order.
   */
  async getFeaturedListings(): Promise<FeaturedListing[]> {
    const result = await query<{
      id: string;
      title: string;
      make: string;
      model: string;
      year: number;
      price: string | number;
      status: string;
      is_featured: boolean;
      featured_sort_order: number;
      image_urls: string[];
      date_added: Date;
    }>(
      `SELECT id, title, make, model, year, price, status, is_featured, featured_sort_order, image_urls, date_added
       FROM listings
       WHERE is_featured = TRUE AND status = 'active'
       ORDER BY featured_sort_order ASC`,
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      make: row.make,
      model: row.model,
      year: row.year,
      price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
      status: row.status,
      isFeatured: row.is_featured,
      featuredSortOrder: row.featured_sort_order,
      primaryImageUrl: row.image_urls?.[0] ?? null,
      dateAdded: row.date_added,
    }));
  }
}

/** Listing data returned by getFeaturedListings */
export interface FeaturedListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  status: string;
  isFeatured: boolean;
  featuredSortOrder: number;
  primaryImageUrl: string | null;
  dateAdded: Date;
}

/** Custom error for not-found cases */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** Custom error for validation failures */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

const featuredService = new FeaturedListingService();

/**
 * PUT /api/admin/featured/:id
 *
 * Set a listing as featured with a sort order.
 * Body: { sortOrder: number }
 */
featuredRouter.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { sortOrder } = req.body;

    if (sortOrder === undefined || typeof sortOrder !== 'number' || !Number.isInteger(sortOrder)) {
      res.status(400).json({ error: 'sortOrder is required and must be an integer' });
      return;
    }

    await featuredService.setFeatured(id, sortOrder);
    res.json({ success: true, listingId: id, sortOrder });
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    if (err instanceof ValidationError) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error('Error setting featured listing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/featured/:id
 *
 * Remove the featured flag from a listing.
 */
featuredRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    await featuredService.removeFeatured(id);
    res.json({ success: true, listingId: id });
  } catch (err) {
    if (err instanceof NotFoundError) {
      res.status(404).json({ error: err.message });
      return;
    }
    console.error('Error removing featured listing:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/featured
 *
 * List all currently featured active listings.
 */
featuredRouter.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const listings = await featuredService.getFeaturedListings();
    res.json({ data: listings, count: listings.length });
  } catch (err) {
    console.error('Error fetching featured listings:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
