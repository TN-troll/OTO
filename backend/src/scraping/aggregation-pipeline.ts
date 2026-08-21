import type { RawAdvertisement, CurationResult, MarketplaceId } from '@car-ads/shared';
import { MAX_IMAGES_PER_LISTING } from '@car-ads/shared';
import { validateMandatoryFields } from '../validation/mandatory-field-validator.js';
import { CurationEngine } from '../curation/curation-engine.js';
import { DeduplicationService, QualifiedListing } from '../deduplication/dedup-service.js';
import { query } from '../db/connection.js';
import { isDutchLocation } from '../map/location-validator.js';

/** Maximum number of import attempts before permanently skipping an advertisement. */
const MAX_IMPORT_ATTEMPTS = 3;

/** Staleness threshold in milliseconds (120 minutes). */
const STALENESS_THRESHOLD_MS = 120 * 60 * 1000;

/** Result of processing a single advertisement through the pipeline. */
export interface PipelineItemResult {
  sourceUrl: string;
  outcome: 'inserted' | 'merged' | 'skipped_validation' | 'skipped_curation' | 'skipped_max_attempts' | 'skipped_location' | 'error';
  listingId?: string;
  error?: string;
}

/** Summary of a full pipeline run. */
export interface PipelineRunResult {
  totalProcessed: number;
  inserted: number;
  merged: number;
  skippedValidation: number;
  skippedCuration: number;
  skippedMaxAttempts: number;
  skippedLocation: number;
  errors: number;
  results: PipelineItemResult[];
}

/**
 * The AggregationPipeline wires together the full flow:
 * scraper output → mandatory field validation → curation engine → deduplication → database insert.
 *
 * It also handles:
 * - Logging incomplete records to the `import_failures` table
 * - Skipping advertisements that have failed 3+ times
 * - Associating sound profiles with new listings
 * - Marking stale listings as inactive
 */
export class AggregationPipeline {
  constructor(
    private readonly curationEngine: CurationEngine,
    private readonly deduplicationService: DeduplicationService,
  ) {}

  /**
   * Process a batch of raw advertisements from a marketplace scraper.
   * Each advertisement flows through: validate → curate → deduplicate → store.
   */
  async process(
    advertisements: RawAdvertisement[],
    marketplace: MarketplaceId,
  ): Promise<PipelineRunResult> {
    const results: PipelineItemResult[] = [];
    let inserted = 0;
    let merged = 0;
    let skippedValidation = 0;
    let skippedCuration = 0;
    let skippedMaxAttempts = 0;
    let skippedLocation = 0;
    let errors = 0;

    for (const ad of advertisements) {
      const result = await this.processOne(ad, marketplace);
      results.push(result);

      switch (result.outcome) {
        case 'inserted':
          inserted++;
          break;
        case 'merged':
          merged++;
          break;
        case 'skipped_validation':
          skippedValidation++;
          break;
        case 'skipped_curation':
          skippedCuration++;
          break;
        case 'skipped_max_attempts':
          skippedMaxAttempts++;
          break;
        case 'skipped_location':
          skippedLocation++;
          break;
        case 'error':
          errors++;
          break;
      }
    }

    return {
      totalProcessed: advertisements.length,
      inserted,
      merged,
      skippedValidation,
      skippedCuration,
      skippedMaxAttempts,
      skippedLocation,
      errors,
      results,
    };
  }

  /**
   * Process a single raw advertisement through the pipeline.
   */
  private async processOne(
    ad: RawAdvertisement,
    marketplace: MarketplaceId,
  ): Promise<PipelineItemResult> {
    try {
      // Check if this ad has already exceeded the max import attempts
      const attemptCount = await this.getAttemptCount(ad.sourceUrl, marketplace);
      if (attemptCount >= MAX_IMPORT_ATTEMPTS) {
        return { sourceUrl: ad.sourceUrl, outcome: 'skipped_max_attempts' };
      }

      // Skip non-Dutch listings
      if (!isDutchLocation(ad.location)) {
        return { sourceUrl: ad.sourceUrl, outcome: 'skipped_location' };
      }

      // Step 1: Validate mandatory fields
      const validation = validateMandatoryFields(ad);
      if (!validation.valid) {
        await this.logImportFailure(
          marketplace,
          ad.sourceUrl,
          ad,
          `Missing mandatory fields: ${validation.missingFields.join(', ')}`,
        );
        return { sourceUrl: ad.sourceUrl, outcome: 'skipped_validation' };
      }

      // Step 2: Apply curation rules
      const curationResult = this.curationEngine.evaluate(ad);
      if (!curationResult.eligible) {
        return { sourceUrl: ad.sourceUrl, outcome: 'skipped_curation' };
      }

      // Step 3: Build qualified listing for deduplication
      const qualifiedListing: QualifiedListing = {
        title: ad.title,
        price: ad.price!,
        mileage: ad.mileage,
        year: ad.year!,
        make: ad.make!,
        model: ad.model!,
        engineDisplacementCc: ad.engineDisplacementCc,
        horsepower: ad.horsepower,
        location: ad.location,
        sellerType: ad.sellerType,
        sourceUrl: ad.sourceUrl,
        imageUrls: ad.imageUrls.slice(0, MAX_IMAGES_PER_LISTING),
        transmissionType: ad.transmissionType,
        fuelType: ad.fuelType,
        bodyType: ad.bodyType ?? null,
        marketplace,
        externalId: this.extractExternalId(ad.sourceUrl),
      };

      // Step 4: Check for duplicates
      const duplicate = await this.deduplicationService.findDuplicate(qualifiedListing);

      if (duplicate) {
        // Merge sources instead of inserting a new listing
        await this.deduplicationService.mergeSources(
          duplicate.existingListingId,
          ad.sourceUrl,
          marketplace,
          qualifiedListing.externalId,
        );
        return {
          sourceUrl: ad.sourceUrl,
          outcome: 'merged',
          listingId: duplicate.existingListingId,
        };
      }

      // Step 5: Insert new listing
      const listingId = await this.insertListing(qualifiedListing, curationResult, marketplace);

      // Step 6: Associate sound profile
      await this.associateSoundProfile(listingId, qualifiedListing.make, qualifiedListing.model);

      return { sourceUrl: ad.sourceUrl, outcome: 'inserted', listingId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logImportFailure(marketplace, ad.sourceUrl, ad, `Import error: ${errorMessage}`);
      return { sourceUrl: ad.sourceUrl, outcome: 'error', error: errorMessage };
    }
  }

  /**
   * Insert a new listing into the database.
   */
  private async insertListing(
    listing: QualifiedListing,
    curationResult: CurationResult,
    marketplace: MarketplaceId,
  ): Promise<string> {
    const result = await query<{ id: string }>(
      `INSERT INTO listings (
        title, price, mileage, year, make, model,
        engine_displacement_cc, horsepower, location, seller_type,
        transmission_type, fuel_type, body_type, image_urls, status,
        curation_criteria, date_added, last_verified, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10,
        $11, $12, $13, $14, 'active',
        $15, NOW(), NOW(), NOW(), NOW()
      ) RETURNING id`,
      [
        listing.title,
        listing.price,
        listing.mileage,
        listing.year,
        listing.make,
        listing.model,
        listing.engineDisplacementCc,
        listing.horsepower,
        listing.location,
        listing.sellerType,
        listing.transmissionType,
        listing.fuelType,
        listing.bodyType ?? null,
        listing.imageUrls,
        curationResult.matchedCriteria,
      ],
    );

    const listingId = result.rows[0].id;

    // Insert source reference
    await query(
      `INSERT INTO source_references (listing_id, marketplace, url, external_id, last_checked, is_active)
       VALUES ($1, $2, $3, $4, NOW(), TRUE)
       ON CONFLICT (marketplace, external_id) DO UPDATE
         SET url = EXCLUDED.url, last_checked = NOW(), is_active = TRUE`,
      [listingId, marketplace, listing.sourceUrl, listing.externalId],
    );

    return listingId;
  }

  /**
   * Associate a sound profile with a listing by looking up make/model in the sound_profiles table.
   * If no match is found, the listing remains with a null sound_profile_id (unclassified).
   */
  private async associateSoundProfile(
    listingId: string,
    make: string,
    model: string,
  ): Promise<void> {
    const result = await query<{ id: string }>(
      `SELECT id FROM sound_profiles
       WHERE LOWER(make) = LOWER($1) AND LOWER(model) = LOWER($2)
       LIMIT 1`,
      [make, model],
    );

    if (result.rows.length > 0) {
      await query(
        `UPDATE listings SET sound_profile_id = $1, updated_at = NOW() WHERE id = $2`,
        [result.rows[0].id, listingId],
      );
    }
  }

  /**
   * Get the current import attempt count for an advertisement.
   */
  private async getAttemptCount(sourceUrl: string, marketplace: MarketplaceId): Promise<number> {
    const result = await query<{ attempt_count: number }>(
      `SELECT attempt_count FROM import_failures
       WHERE source_url = $1 AND marketplace = $2
       ORDER BY created_at DESC LIMIT 1`,
      [sourceUrl, marketplace],
    );

    return result.rows.length > 0 ? result.rows[0].attempt_count : 0;
  }

  /**
   * Log an import failure to the import_failures table.
   * If the record already exists, increment the attempt count.
   */
  private async logImportFailure(
    marketplace: MarketplaceId,
    sourceUrl: string,
    rawData: RawAdvertisement,
    failureReason: string,
  ): Promise<void> {
    const existing = await query<{ id: string; attempt_count: number }>(
      `SELECT id, attempt_count FROM import_failures
       WHERE source_url = $1 AND marketplace = $2
       ORDER BY created_at DESC LIMIT 1`,
      [sourceUrl, marketplace],
    );

    if (existing.rows.length > 0) {
      await query(
        `UPDATE import_failures
         SET attempt_count = attempt_count + 1, failure_reason = $1, raw_data = $2
         WHERE id = $3`,
        [failureReason, JSON.stringify(rawData), existing.rows[0].id],
      );
    } else {
      await query(
        `INSERT INTO import_failures (marketplace, source_url, raw_data, failure_reason, attempt_count, created_at)
         VALUES ($1, $2, $3, $4, 1, NOW())`,
        [marketplace, sourceUrl, JSON.stringify(rawData), failureReason],
      );
    }
  }

  /**
   * Extract an external ID from a source URL.
   * Uses the URL path and query as a unique identifier.
   */
  private extractExternalId(sourceUrl: string): string {
    try {
      const url = new URL(sourceUrl);
      return url.pathname + url.search;
    } catch {
      // Fallback: use the full URL as external ID
      return sourceUrl;
    }
  }

  /**
   * Mark listings as inactive when they are no longer found on the source marketplace.
   * A listing is considered stale if its last_verified timestamp is older than 120 minutes.
   */
  async markStaleListingsInactive(): Promise<number> {
    const threshold = new Date(Date.now() - STALENESS_THRESHOLD_MS);

    const result = await query(
      `UPDATE listings
       SET status = 'inactive', updated_at = NOW()
       WHERE status = 'active'
         AND last_verified < $1
       RETURNING id`,
      [threshold.toISOString()],
    );

    return result.rowCount ?? 0;
  }
}
