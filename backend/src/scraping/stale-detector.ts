import { query } from '../db/connection.js';

/** Number of retries on timeout/network error before marking as stale. */
const MAX_RETRIES = 3;

/** Delay between retries in milliseconds (5 seconds). */
const RETRY_DELAY_MS = 5_000;

/** Timeout for each HEAD request in milliseconds. */
const REQUEST_TIMEOUT_MS = 10_000;

/** Row shape from the database for active listings with source URLs. */
interface ListingSourceRow {
  listing_id: string;
  source_url: string;
  source_reference_id: string;
}

/** Result of running a batch stale detection cycle. */
export interface StaleDetectionResult {
  checked: number;
  markedSold: number;
  markedStale: number;
  errors: number;
}

/** Result of checking a single listing's source URL. */
export interface ListingCheckResult {
  listingId: string;
  sourceUrl: string;
  httpStatus: number | null;
  newStatus: 'active' | 'sold' | 'stale';
  retryCount: number;
  detectedAt: Date;
}

/**
 * StaleDetector verifies listing source URLs via HEAD requests and updates
 * listing statuses accordingly:
 * - 404/410 → mark as "sold" with sold_at timestamp
 * - Timeout/error after 3 retries → mark as "stale"
 * - 200 → update last_verified timestamp
 * - 5xx → skip (log and move on)
 *
 * All existing listing data is preserved; only status, sold_at,
 * stale_check_count, and last_verified columns are modified.
 */
export class StaleDetector {
  /**
   * Process a batch of active listings, checking their source URLs.
   * @param batchSize Number of listings to check in this batch (default: 50)
   */
  async runBatch(batchSize: number = 50): Promise<StaleDetectionResult> {
    const result: StaleDetectionResult = {
      checked: 0,
      markedSold: 0,
      markedStale: 0,
      errors: 0,
    };

    const listings = await this.getActiveListingsBatch(batchSize);

    for (const listing of listings) {
      try {
        const checkResult = await this.checkListing(listing.listing_id, listing.source_url);
        result.checked++;

        switch (checkResult.newStatus) {
          case 'sold':
            result.markedSold++;
            break;
          case 'stale':
            result.markedStale++;
            break;
          case 'active':
            // Verified successfully, nothing extra to count
            break;
        }
      } catch (error) {
        result.errors++;
        result.checked++;
        console.error(
          `[StaleDetector] Unexpected error checking listing ${listing.listing_id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    return result;
  }

  /**
   * Check a single listing's source URL and update its status.
   * @param listingId The listing ID to check
   * @param sourceUrl Optional source URL override (fetched from DB if not provided)
   */
  async checkListing(listingId: string, sourceUrl?: string): Promise<ListingCheckResult> {
    const url = sourceUrl ?? (await this.getSourceUrlForListing(listingId));

    if (!url) {
      throw new Error(`No source URL found for listing ${listingId}`);
    }

    const { httpStatus, retryCount } = await this.performHeadRequest(url);
    const detectedAt = new Date();

    let newStatus: 'active' | 'sold' | 'stale';

    if (httpStatus === 404 || httpStatus === 410) {
      // Listing no longer exists on source — mark as sold
      newStatus = 'sold';
      await this.markListingSold(listingId, detectedAt);
    } else if (httpStatus === null) {
      // All retries exhausted (timeout/network error) — mark as stale
      newStatus = 'stale';
      await this.markListingStale(listingId);
    } else if (httpStatus >= 200 && httpStatus < 400) {
      // Source URL is reachable — listing is still active
      newStatus = 'active';
      await this.markListingVerified(listingId);
    } else if (httpStatus >= 500) {
      // Server error on source side — don't change status, just log
      newStatus = 'active';
      console.warn(
        `[StaleDetector] Source returned ${httpStatus} for listing ${listingId}, skipping status change`,
      );
    } else {
      // Other status codes (e.g. 403) — treat as active, log
      newStatus = 'active';
      console.warn(
        `[StaleDetector] Unexpected status ${httpStatus} for listing ${listingId}`,
      );
    }

    return {
      listingId,
      sourceUrl: url,
      httpStatus,
      newStatus,
      retryCount,
      detectedAt,
    };
  }

  /**
   * Perform a HEAD request to the source URL with retry logic.
   * Retries up to MAX_RETRIES times on timeout or network errors with RETRY_DELAY_MS between attempts.
   * @returns httpStatus (number if we got a response, null if all retries exhausted)
   */
  private async performHeadRequest(
    url: string,
  ): Promise<{ httpStatus: number | null; retryCount: number }> {
    let retryCount = 0;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
        });

        clearTimeout(timeoutId);
        return { httpStatus: response.status, retryCount };
      } catch (error) {
        retryCount++;

        if (attempt < MAX_RETRIES) {
          // Wait before retrying
          await this.delay(RETRY_DELAY_MS);
        }
      }
    }

    // All retries exhausted
    return { httpStatus: null, retryCount };
  }

  /**
   * Fetch a batch of active listings ordered by least recently verified first.
   */
  private async getActiveListingsBatch(batchSize: number): Promise<ListingSourceRow[]> {
    const result = await query<ListingSourceRow>(
      `SELECT
        l.id AS listing_id,
        sr.url AS source_url,
        sr.id AS source_reference_id
       FROM listings l
       JOIN source_references sr ON sr.listing_id = l.id
       WHERE l.status = 'active'
         AND sr.is_active = TRUE
       ORDER BY l.last_verified ASC NULLS FIRST
       LIMIT $1`,
      [batchSize],
    );

    return result.rows;
  }

  /**
   * Get the source URL for a specific listing.
   */
  private async getSourceUrlForListing(listingId: string): Promise<string | null> {
    const result = await query<{ url: string }>(
      `SELECT sr.url
       FROM source_references sr
       WHERE sr.listing_id = $1 AND sr.is_active = TRUE
       ORDER BY sr.last_checked ASC NULLS FIRST
       LIMIT 1`,
      [listingId],
    );

    return result.rows[0]?.url ?? null;
  }

  /**
   * Mark a listing as sold: update status, record sold_at timestamp,
   * increment stale_check_count. Preserves all other listing data.
   */
  private async markListingSold(listingId: string, soldAt: Date): Promise<void> {
    await query(
      `UPDATE listings
       SET status = 'sold',
           sold_at = $2,
           stale_check_count = stale_check_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [listingId, soldAt],
    );
  }

  /**
   * Mark a listing as stale after all retries have been exhausted.
   * Increments stale_check_count. Preserves all other listing data.
   */
  private async markListingStale(listingId: string): Promise<void> {
    await query(
      `UPDATE listings
       SET status = 'stale',
           stale_check_count = stale_check_count + 1,
           updated_at = NOW()
       WHERE id = $1`,
      [listingId],
    );
  }

  /**
   * Update last_verified timestamp for an active listing that was successfully verified.
   */
  private async markListingVerified(listingId: string): Promise<void> {
    await query(
      `UPDATE listings
       SET last_verified = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [listingId],
    );
  }

  /**
   * Utility: delay execution for a given number of milliseconds.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
