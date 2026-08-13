import { query } from '../db/connection.js';
import type { MarketplaceId } from '@car-ads/shared';

/**
 * A listing that has passed curation and has all mandatory fields present.
 */
export interface QualifiedListing {
  title: string;
  price: number;
  mileage: number | null;
  year: number;
  make: string;
  model: string;
  engineDisplacementCc: number | null;
  horsepower: number | null;
  location: string | null;
  sellerType: 'dealer' | 'private' | null;
  sourceUrl: string;
  imageUrls: string[];
  transmissionType: 'manual' | 'automatic' | null;
  fuelType: 'petrol' | 'diesel' | 'hybrid' | 'electric' | null;
  bodyType?: string | null;
  marketplace: MarketplaceId;
  externalId: string;
}

/**
 * Result returned when a duplicate listing is found.
 */
export interface DuplicateMatch {
  existingListingId: string;
  confidence: number;
  matchedFields: string[];
}

/**
 * Identifies duplicate listings across marketplaces and merges sources.
 *
 * Deduplication logic:
 * - Two ads are duplicates if they match on ALL 5 fields: make, model, year, mileage, price
 * - Make and model comparison is case-insensitive
 * - If mileage is null in both listings, treat as a match on that field
 * - If mileage is null in one but not the other, they are NOT duplicates
 * - Price must be an exact match
 */
export class DeduplicationService {
  /**
   * Find an existing listing that is a duplicate of the given qualified listing.
   * Returns the match info if found, or null if no duplicate exists.
   */
  async findDuplicate(listing: QualifiedListing): Promise<DuplicateMatch | null> {
    let sql: string;
    let params: unknown[];

    if (listing.mileage === null) {
      // When incoming listing has null mileage, only match listings that also have null mileage
      sql = `
        SELECT id
        FROM listings
        WHERE LOWER(make) = LOWER($1)
          AND LOWER(model) = LOWER($2)
          AND year = $3
          AND mileage IS NULL
          AND price = $4
          AND status = 'active'
        LIMIT 1
      `;
      params = [listing.make, listing.model, listing.year, listing.price];
    } else {
      // When incoming listing has a mileage value, match only listings with the same mileage
      sql = `
        SELECT id
        FROM listings
        WHERE LOWER(make) = LOWER($1)
          AND LOWER(model) = LOWER($2)
          AND year = $3
          AND mileage = $4
          AND price = $5
          AND status = 'active'
        LIMIT 1
      `;
      params = [listing.make, listing.model, listing.year, listing.mileage, listing.price];
    }

    const result = await query<{ id: string }>(sql, params);

    if (result.rows.length === 0) {
      return null;
    }

    const matchedFields = ['make', 'model', 'year', 'mileage', 'price'];

    return {
      existingListingId: result.rows[0].id,
      confidence: 1.0,
      matchedFields,
    };
  }

  /**
   * Add a new source reference to an existing listing, linking the duplicate
   * advertisement from another marketplace.
   */
  async mergeSources(
    existingId: string,
    newSourceUrl: string,
    marketplace: MarketplaceId,
    externalId: string,
  ): Promise<void> {
    await query(
      `
      INSERT INTO source_references (listing_id, marketplace, url, external_id, last_checked, is_active)
      VALUES ($1, $2, $3, $4, NOW(), TRUE)
      ON CONFLICT (marketplace, external_id) DO UPDATE
        SET url = EXCLUDED.url,
            last_checked = NOW(),
            is_active = TRUE
      `,
      [existingId, marketplace, newSourceUrl, externalId],
    );
  }
}
