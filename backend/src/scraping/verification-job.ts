import type { Job } from 'bullmq';
import type { MarketplaceId, ListingStatus } from '@car-ads/shared';
import type { MarketplaceScraper } from './marketplace-scraper.js';
import type { VerificationJobData } from './scraper-coordinator.js';
import { ScraperCoordinator } from './scraper-coordinator.js';
import { query } from '../db/connection.js';

/** Interval between verification cycles (60 minutes in ms). */
export const VERIFICATION_INTERVAL_MS = 60 * 60 * 1000;

/** Threshold for marking a listing as inactive (120 minutes in ms). */
export const INACTIVITY_THRESHOLD_MS = 120 * 60 * 1000;

/** Row shape from the database for active listings with source references. */
interface ListingSourceRow {
  listing_id: string;
  source_url: string;
  marketplace: string;
  source_reference_id: string;
}

/** Result of verifying a single listing source. */
export interface VerificationItemResult {
  listingId: string;
  sourceUrl: string;
  status: ListingStatus;
  error?: string;
}

/** Summary of a verification run for a marketplace. */
export interface VerificationRunResult {
  marketplace: MarketplaceId;
  totalVerified: number;
  active: number;
  inactive: number;
  unknown: number;
  errors: number;
}

/**
 * VerificationJob processes BullMQ verification jobs for a specific marketplace.
 *
 * For each active listing with source references on the target marketplace:
 * - Calls the marketplace scraper's `verifyListing()` method
 * - Updates `last_verified` timestamp on successful verification
 * - Marks listing as inactive when the source ad is no longer available
 * - On marketplace recovery (successful contact after being unreachable),
 *   calls ScraperCoordinator.recordSuccess() which clears staleness state
 */
export class VerificationJob {
  constructor(
    private readonly scrapers: Map<MarketplaceId, MarketplaceScraper>,
    private readonly coordinator: ScraperCoordinator,
  ) {}

  /**
   * Process a BullMQ verification job.
   * This is the main entry point called by BullMQ workers.
   */
  async process(job: Job<VerificationJobData>): Promise<VerificationRunResult> {
    const { marketplace } = job.data;
    return this.verifyMarketplace(marketplace);
  }

  /**
   * Verify all active listings for a specific marketplace.
   */
  async verifyMarketplace(marketplace: MarketplaceId): Promise<VerificationRunResult> {
    const scraper = this.scrapers.get(marketplace);
    if (!scraper) {
      throw new Error(`No scraper registered for marketplace: ${marketplace}`);
    }

    // Get the marketplace health before verification to detect recovery
    const healthBefore = await this.coordinator.getMarketplaceHealth(marketplace);

    // Fetch all active listings for this marketplace
    const listings = await this.getActiveListingsForMarketplace(marketplace);

    const result: VerificationRunResult = {
      marketplace,
      totalVerified: 0,
      active: 0,
      inactive: 0,
      unknown: 0,
      errors: 0,
    };

    let hasSuccessfulContact = false;

    for (const listing of listings) {
      const verificationResult = await this.verifySingleListing(scraper, listing);
      result.totalVerified++;

      switch (verificationResult.status) {
        case 'active':
          result.active++;
          hasSuccessfulContact = true;
          await this.markListingVerified(listing.listing_id);
          break;
        case 'inactive':
          result.inactive++;
          hasSuccessfulContact = true;
          await this.markSourceInactive(listing.source_reference_id);
          await this.checkAndDeactivateListing(listing.listing_id);
          break;
        case 'unknown':
          result.unknown++;
          if (verificationResult.error) {
            result.errors++;
          }
          break;
      }
    }

    // Handle marketplace recovery: if we had successful contacts and the marketplace
    // was previously degraded or unreachable, record success to clear staleness
    if (hasSuccessfulContact) {
      await this.coordinator.recordSuccess(marketplace);

      // If marketplace was previously unreachable or degraded, trigger a full collection
      if (healthBefore.status === 'unreachable' || healthBefore.status === 'degraded') {
        await this.triggerFullCollection(marketplace);
      }
    } else if (listings.length > 0) {
      // All verifications failed or returned unknown – record failure
      await this.coordinator.recordFailure(marketplace);
    }

    return result;
  }

  /**
   * Verify a single listing against its source marketplace.
   */
  private async verifySingleListing(
    scraper: MarketplaceScraper,
    listing: ListingSourceRow,
  ): Promise<VerificationItemResult> {
    try {
      const status = await scraper.verifyListing(listing.source_url);
      return {
        listingId: listing.listing_id,
        sourceUrl: listing.source_url,
        status,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        listingId: listing.listing_id,
        sourceUrl: listing.source_url,
        status: 'unknown',
        error: errorMessage,
      };
    }
  }

  /**
   * Get all active listings with source references for a specific marketplace.
   */
  private async getActiveListingsForMarketplace(
    marketplace: MarketplaceId,
  ): Promise<ListingSourceRow[]> {
    const result = await query<ListingSourceRow>(
      `SELECT 
        l.id AS listing_id,
        sr.url AS source_url,
        sr.marketplace,
        sr.id AS source_reference_id
       FROM listings l
       JOIN source_references sr ON sr.listing_id = l.id
       WHERE l.status = 'active'
         AND sr.marketplace = $1
         AND sr.is_active = TRUE
       ORDER BY l.last_verified ASC`,
      [marketplace],
    );

    return result.rows;
  }

  /**
   * Update the last_verified timestamp for a listing on successful verification.
   */
  private async markListingVerified(listingId: string): Promise<void> {
    await query(
      `UPDATE listings
       SET last_verified = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [listingId],
    );

    // Also update the source reference's last_checked timestamp
    await query(
      `UPDATE source_references
       SET last_checked = NOW()
       WHERE listing_id = $1`,
      [listingId],
    );
  }

  /**
   * Mark a specific source reference as inactive.
   */
  private async markSourceInactive(sourceReferenceId: string): Promise<void> {
    await query(
      `UPDATE source_references
       SET is_active = FALSE, last_checked = NOW()
       WHERE id = $1`,
      [sourceReferenceId],
    );
  }

  /**
   * Check if a listing has any remaining active sources.
   * If not, mark the listing itself as inactive.
   */
  private async checkAndDeactivateListing(listingId: string): Promise<void> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM source_references
       WHERE listing_id = $1 AND is_active = TRUE`,
      [listingId],
    );

    const activeSourceCount = parseInt(result.rows[0]?.count ?? '0', 10);

    if (activeSourceCount === 0) {
      await query(
        `UPDATE listings
         SET status = 'inactive', updated_at = NOW()
         WHERE id = $1`,
        [listingId],
      );
    }
  }

  /**
   * Trigger a full collection cycle for a marketplace that has recovered.
   * This enqueues a collection job immediately rather than waiting for the next cron cycle.
   */
  private async triggerFullCollection(marketplace: MarketplaceId): Promise<void> {
    const collectionQueue = this.coordinator.getCollectionQueue();
    await collectionQueue.add(
      `collect-recovery-${marketplace}`,
      {
        marketplace,
        scheduledAt: new Date().toISOString(),
      },
      { jobId: `collect-recovery-${marketplace}-${Date.now()}` },
    );
  }
}
