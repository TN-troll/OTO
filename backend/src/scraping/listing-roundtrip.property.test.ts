import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { toListingRow, fromListingRow } from './listing-conversion';
import { MAX_IMAGES_PER_LISTING } from '@car-ads/shared';
import type { RawAdvertisement } from '@car-ads/shared';

/**
 * Property 1: Listing Data Round-Trip
 *
 * For any valid raw advertisement with all mandatory fields present and up to 25 images,
 * storing it as a Listing and then retrieving it SHALL produce an object with identical
 * values for all stored fields, and the image array SHALL contain at most 20 entries
 * (truncating from the end if the input had more).
 *
 * **Validates: Requirements 1.3**
 */

// ============================================================
// Arbitrary generators
// ============================================================

const sellerTypeArb = fc.oneof(
  fc.constant('dealer' as const),
  fc.constant('private' as const),
  fc.constant(null),
);

const transmissionTypeArb = fc.oneof(
  fc.constant('manual' as const),
  fc.constant('automatic' as const),
  fc.constant(null),
);

const fuelTypeArb = fc.oneof(
  fc.constant('petrol' as const),
  fc.constant('diesel' as const),
  fc.constant('hybrid' as const),
  fc.constant('electric' as const),
  fc.constant(null),
);

/**
 * Generates a valid RawAdvertisement with all mandatory fields (price, make, model, year)
 * non-null and 0–25 images.
 */
const validRawAdvertisementArb: fc.Arbitrary<RawAdvertisement> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 200 }),
  price: fc.integer({ min: 1, max: 50_000_000 }),
  mileage: fc.oneof(fc.integer({ min: 0, max: 500_000 }), fc.constant(null)),
  year: fc.integer({ min: 1950, max: 2025 }),
  make: fc.string({ minLength: 1, maxLength: 100 }),
  model: fc.string({ minLength: 1, maxLength: 200 }),
  engineDisplacementCc: fc.oneof(fc.integer({ min: 0, max: 10_000 }), fc.constant(null)),
  horsepower: fc.oneof(fc.integer({ min: 0, max: 2000 }), fc.constant(null)),
  location: fc.oneof(fc.string({ minLength: 1, maxLength: 200 }), fc.constant(null)),
  sellerType: sellerTypeArb,
  sourceUrl: fc.webUrl(),
  imageUrls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 25 }),
  transmissionType: transmissionTypeArb,
  fuelType: fuelTypeArb,
});

// ============================================================
// Tests
// ============================================================

describe('Property 1: Listing Data Round-Trip', () => {
  it('should preserve all fields when converting to listing row and back', () => {
    fc.assert(
      fc.property(validRawAdvertisementArb, (ad) => {
        const row = toListingRow(ad);
        const retrieved = fromListingRow(row);

        // Core fields should match the original advertisement
        expect(retrieved.title).toBe(ad.title);
        expect(retrieved.price).toBe(ad.price);
        expect(retrieved.mileage).toBe(ad.mileage);
        expect(retrieved.year).toBe(ad.year);
        expect(retrieved.make).toBe(ad.make);
        expect(retrieved.model).toBe(ad.model);
        expect(retrieved.engineDisplacementCc).toBe(ad.engineDisplacementCc);
        expect(retrieved.horsepower).toBe(ad.horsepower);
        expect(retrieved.location).toBe(ad.location);
        expect(retrieved.sellerType).toBe(ad.sellerType);
        expect(retrieved.transmissionType).toBe(ad.transmissionType);
        expect(retrieved.fuelType).toBe(ad.fuelType);
        expect(retrieved.sourceUrl).toBe(ad.sourceUrl);

        // Status should be 'active' for new listings
        expect(retrieved.status).toBe('active');

        // Dates should be set
        expect(retrieved.dateAdded).toBeInstanceOf(Date);
        expect(retrieved.lastVerified).toBeInstanceOf(Date);
        expect(retrieved.createdAt).toBeInstanceOf(Date);
        expect(retrieved.updatedAt).toBeInstanceOf(Date);

        // ID should be a valid UUID
        expect(retrieved.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('should truncate images to maximum of 20 entries', () => {
    fc.assert(
      fc.property(validRawAdvertisementArb, (ad) => {
        const row = toListingRow(ad);
        const retrieved = fromListingRow(row);

        // Image count should be min(inputImages.length, MAX_IMAGES_PER_LISTING)
        const expectedImageCount = Math.min(ad.imageUrls.length, MAX_IMAGES_PER_LISTING);
        expect(retrieved.imageUrls).toHaveLength(expectedImageCount);

        // Images should never exceed MAX_IMAGES_PER_LISTING
        expect(retrieved.imageUrls.length).toBeLessThanOrEqual(MAX_IMAGES_PER_LISTING);

        // The stored images should be the first N images from the input
        expect(retrieved.imageUrls).toEqual(ad.imageUrls.slice(0, MAX_IMAGES_PER_LISTING));
      }),
      { numRuns: 100 },
    );
  });

  it('should handle zero images correctly', () => {
    const adWithNoImages = validRawAdvertisementArb.map((ad) => ({
      ...ad,
      imageUrls: [],
    }));

    fc.assert(
      fc.property(adWithNoImages, (ad) => {
        const row = toListingRow(ad);
        const retrieved = fromListingRow(row);

        expect(retrieved.imageUrls).toEqual([]);
        expect(retrieved.imageUrls).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });
});
