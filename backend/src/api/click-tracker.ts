import { query, queryOne } from '../db/connection.js';

export interface ClickStats {
  listingId: string;
  totalClicks: number;
  lastClickedAt: Date | null;
}

export interface AggregateClickStats {
  listingId: string;
  title: string;
  make: string;
  model: string;
  clickCount: number;
  lastClickedAt: Date;
}

export interface StatsQueryOptions {
  since?: Date;
  limit?: number;
  sortBy?: 'clicks' | 'recent';
}

/**
 * ClickTracker service — records outbound clicks from OTO listings
 * to AutoScout24 and provides analytics.
 */
export class ClickTracker {
  /**
   * Record a click event and return the redirect URL for the listing.
   * - Inserts a row in listing_clicks
   * - Upserts listing_click_counts (increment click_count)
   * - Returns the source URL from source_references
   */
  async trackClick(listingId: string, sessionId: string): Promise<string | null> {
    // Insert individual click record
    await query(
      `INSERT INTO listing_clicks (listing_id, session_id)
       VALUES ($1, $2)`,
      [listingId, sessionId],
    );

    // Upsert aggregate count
    await query(
      `INSERT INTO listing_click_counts (listing_id, click_count, last_clicked_at)
       VALUES ($1, 1, NOW())
       ON CONFLICT (listing_id) DO UPDATE
       SET click_count = listing_click_counts.click_count + 1,
           last_clicked_at = NOW()`,
      [listingId],
    );

    // Fetch the source URL for redirect
    const sourceRef = await queryOne<{ url: string }>(
      `SELECT url FROM source_references
       WHERE listing_id = $1 AND is_active = TRUE
       ORDER BY last_checked DESC
       LIMIT 1`,
      [listingId],
    );

    return sourceRef?.url ?? null;
  }

  /**
   * Get click stats for a single listing.
   */
  async getClickStats(listingId: string): Promise<ClickStats> {
    const row = await queryOne<{ click_count: string; last_clicked_at: Date | null }>(
      `SELECT click_count, last_clicked_at
       FROM listing_click_counts
       WHERE listing_id = $1`,
      [listingId],
    );

    return {
      listingId,
      totalClicks: row ? parseInt(row.click_count, 10) : 0,
      lastClickedAt: row?.last_clicked_at ?? null,
    };
  }

  /**
   * Get aggregate click stats across all listings with click activity.
   * Joins with listings table for title, make, model info.
   */
  async getAggregateStats(options?: StatsQueryOptions): Promise<AggregateClickStats[]> {
    const since = options?.since;
    const limit = options?.limit ?? 50;
    const sortBy = options?.sortBy ?? 'clicks';

    const orderClause = sortBy === 'recent'
      ? 'cc.last_clicked_at DESC'
      : 'cc.click_count DESC';

    let whereClause = '';
    const params: unknown[] = [];

    if (since) {
      params.push(since);
      whereClause = `WHERE cc.last_clicked_at >= $${params.length}`;
    }

    params.push(limit);
    const limitParam = `$${params.length}`;

    const result = await query<{
      listing_id: string;
      title: string;
      make: string;
      model: string;
      click_count: string;
      last_clicked_at: Date;
    }>(
      `SELECT cc.listing_id, l.title, l.make, l.model, cc.click_count, cc.last_clicked_at
       FROM listing_click_counts cc
       JOIN listings l ON l.id = cc.listing_id
       ${whereClause}
       ORDER BY ${orderClause}
       LIMIT ${limitParam}`,
      params,
    );

    return result.rows.map((row) => ({
      listingId: row.listing_id,
      title: row.title,
      make: row.make,
      model: row.model,
      clickCount: parseInt(row.click_count, 10),
      lastClickedAt: row.last_clicked_at,
    }));
  }
}
