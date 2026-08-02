import type { RawAdvertisement, ListingStatus, MarketplaceId } from '@car-ads/shared';

/**
 * Interface that each marketplace-specific scraper must implement.
 */
export interface MarketplaceScraper {
  /** Collect all current listings from the marketplace. */
  collectListings(): Promise<RawAdvertisement[]>;

  /** Verify whether a specific listing is still active on the marketplace. */
  verifyListing(sourceUrl: string): Promise<ListingStatus>;

  /** Return the marketplace identifier for this scraper. */
  getMarketplaceId(): MarketplaceId;
}
