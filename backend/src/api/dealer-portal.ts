import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

export const dealerPortalRouter = Router();

/**
 * GET /inventory?location=X
 * Get all listings for a dealer (by location), with view counts.
 */
dealerPortalRouter.get('/inventory', async (req: Request, res: Response): Promise<void> => {
  const { location } = req.query;
  if (!location) { res.status(400).json({ error: 'Missing location' }); return; }

  try {
    const result = await query<{
      id: string; title: string; make: string; model: string; price: string;
      year: number; status: string; date_added: Date; view_count: string;
    }>(
      `SELECT l.id, l.title, l.make, l.model, l.price, l.year, l.status, l.date_added,
              COALESCE(c.view_count, 0)::text as view_count
       FROM listings l
       LEFT JOIN (SELECT listing_id, COUNT(*)::text as view_count FROM listing_clicks GROUP BY listing_id) c ON c.listing_id = l.id
       WHERE l.location = $1 AND l.seller_type = 'dealer' AND l.status = 'active'
       ORDER BY l.date_added DESC`,
      [location]
    );

    res.json({
      listings: result.rows.map(r => ({
        id: r.id,
        title: r.title,
        make: r.make,
        model: r.model,
        price: parseFloat(r.price),
        year: r.year,
        status: r.status,
        dateAdded: r.date_added,
        views: parseInt(r.view_count, 10),
      })),
      totalListings: result.rows.length,
    });
  } catch (err) {
    console.error('[OTO] Dealer inventory error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

/**
 * GET /performance?location=X
 * Get performance benchmarks for a dealer vs platform average.
 */
dealerPortalRouter.get('/performance', async (req: Request, res: Response): Promise<void> => {
  const { location } = req.query;
  if (!location) { res.status(400).json({ error: 'Missing location' }); return; }

  try {
    // Dealer's metrics
    const dealerStats = await query<{ listing_count: string; avg_price: string; total_views: string }>(
      `SELECT
        COUNT(*)::text as listing_count,
        COALESCE(AVG(l.price), 0)::text as avg_price,
        COALESCE(SUM(c.views), 0)::text as total_views
       FROM listings l
       LEFT JOIN (SELECT listing_id, COUNT(*) as views FROM listing_clicks GROUP BY listing_id) c ON c.listing_id = l.id
       WHERE l.location = $1 AND l.seller_type = 'dealer' AND l.status = 'active'`,
      [location]
    );

    // Platform averages
    const platformStats = await query<{ avg_views_per_listing: string; total_active: string }>(
      `SELECT
        COALESCE(AVG(views), 0)::text as avg_views_per_listing,
        COUNT(*)::text as total_active
       FROM listings l
       LEFT JOIN (SELECT listing_id, COUNT(*) as views FROM listing_clicks GROUP BY listing_id) c ON c.listing_id = l.id
       WHERE l.status = 'active' AND l.seller_type = 'dealer'`
    );

    // Dealer's ratings
    const ratings = await query<{ avg_rating: string; count: string }>(
      `SELECT COALESCE(AVG(rating), 0)::text as avg_rating, COUNT(*)::text as count
       FROM dealer_ratings WHERE location = $1 AND seller_type = 'dealer'`,
      [location]
    );

    const dealer = dealerStats.rows[0];
    const platform = platformStats.rows[0];
    const rating = ratings.rows[0];

    const dealerViews = parseInt(dealer?.total_views || '0', 10);
    const dealerListings = parseInt(dealer?.listing_count || '0', 10);
    const avgViewsPerListing = dealerListings > 0 ? Math.round(dealerViews / dealerListings) : 0;
    const platformAvg = parseFloat(platform?.avg_views_per_listing || '0');

    res.json({
      dealer: {
        location,
        listingCount: dealerListings,
        avgPrice: Math.round(parseFloat(dealer?.avg_price || '0')),
        totalViews: dealerViews,
        avgViewsPerListing,
        rating: parseFloat(parseFloat(rating?.avg_rating || '0').toFixed(1)),
        ratingCount: parseInt(rating?.count || '0', 10),
      },
      platform: {
        avgViewsPerListing: Math.round(platformAvg),
        totalDealers: parseInt(platform?.total_active || '0', 10),
      },
      performance: {
        viewsVsPlatform: platformAvg > 0 ? Math.round(((avgViewsPerListing - platformAvg) / platformAvg) * 100) : 0,
      },
    });
  } catch (err) {
    console.error('[OTO] Dealer performance error:', err);
    res.status(500).json({ error: 'Failed to fetch performance' });
  }
});

/**
 * GET /reviews?location=X
 * Get all reviews for a dealer.
 */
dealerPortalRouter.get('/reviews', async (req: Request, res: Response): Promise<void> => {
  const { location } = req.query;
  if (!location) { res.status(400).json({ error: 'Missing location' }); return; }

  try {
    const result = await query<{ rating: number; comment: string | null; created_at: Date }>(
      `SELECT rating, comment, created_at FROM dealer_ratings
       WHERE location = $1 AND seller_type = 'dealer'
       ORDER BY created_at DESC LIMIT 50`,
      [location]
    );

    res.json({
      reviews: result.rows.map(r => ({
        rating: r.rating,
        comment: r.comment,
        date: r.created_at,
      })),
    });
  } catch (err) {
    console.error('[OTO] Dealer reviews error:', err);
    res.json({ reviews: [] });
  }
});
