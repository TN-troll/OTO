import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateMandatoryFields } from './mandatory-field-validator';
import type { RawAdvertisement } from '@car-ads/shared';

/**
 * Property 2: Mandatory Field Validation
 *
 * For any raw advertisement where at least one mandatory field (price, make, model, or year)
 * is null or missing, the validator SHALL reject the advertisement.
 * Conversely, for any raw advertisement where all mandatory fields are present,
 * the advertisement SHALL NOT be rejected on the basis of missing mandatory fields.
 *
 * **Validates: Requirements 1.5**
 */

// Arbitraries for optional/nullable fields
const sellerTypeArb = fc.oneof(
  fc.constant('dealer' as const),
  fc.constant('private' as const),
  fc.constant(null)
);

const transmissionTypeArb = fc.oneof(
  fc.constant('manual' as const),
  fc.constant('automatic' as const),
  fc.constant(null)
);

const fuelTypeArb = fc.oneof(
  fc.constant('petrol' as const),
  fc.constant('diesel' as const),
  fc.constant('hybrid' as const),
  fc.constant('electric' as const),
  fc.constant(null)
);

// Arbitrary for a fully valid RawAdvertisement (all mandatory fields present)
const validRawAdvertisementArb: fc.Arbitrary<RawAdvertisement> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  price: fc.integer({ min: 1, max: 50_000_000 }),
  mileage: fc.oneof(fc.integer({ min: 0, max: 500_000 }), fc.constant(null)),
  year: fc.integer({ min: 1950, max: 2025 }),
  make: fc.string({ minLength: 1, maxLength: 50 }),
  model: fc.string({ minLength: 1, maxLength: 100 }),
  engineDisplacementCc: fc.oneof(fc.integer({ min: 500, max: 10_000 }), fc.constant(null)),
  horsepower: fc.oneof(fc.integer({ min: 50, max: 2000 }), fc.constant(null)),
  location: fc.oneof(fc.string({ minLength: 1, maxLength: 50 }), fc.constant(null)),
  sellerType: sellerTypeArb,
  sourceUrl: fc.webUrl(),
  imageUrls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
  transmissionType: transmissionTypeArb,
  fuelType: fuelTypeArb,
});

// Arbitrary that generates a RawAdvertisement with at least one mandatory field set to null
const invalidRawAdvertisementArb: fc.Arbitrary<RawAdvertisement> = fc
  .record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
    price: fc.oneof(fc.integer({ min: 1, max: 50_000_000 }), fc.constant(null)),
    mileage: fc.oneof(fc.integer({ min: 0, max: 500_000 }), fc.constant(null)),
    year: fc.oneof(fc.integer({ min: 1950, max: 2025 }), fc.constant(null)),
    make: fc.oneof(fc.string({ minLength: 1, maxLength: 50 }), fc.constant(null)),
    model: fc.oneof(fc.string({ minLength: 1, maxLength: 100 }), fc.constant(null)),
    engineDisplacementCc: fc.oneof(fc.integer({ min: 500, max: 10_000 }), fc.constant(null)),
    horsepower: fc.oneof(fc.integer({ min: 50, max: 2000 }), fc.constant(null)),
    location: fc.oneof(fc.string({ minLength: 1, maxLength: 50 }), fc.constant(null)),
    sellerType: sellerTypeArb,
    sourceUrl: fc.webUrl(),
    imageUrls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
    transmissionType: transmissionTypeArb,
    fuelType: fuelTypeArb,
  })
  .filter(
    (ad) =>
      ad.price === null || ad.make === null || ad.model === null || ad.year === null
  );

describe('Property 2: Mandatory Field Validation', () => {
  it('should reject advertisements with at least one missing mandatory field', () => {
    fc.assert(
      fc.property(invalidRawAdvertisementArb, (ad) => {
        const result = validateMandatoryFields(ad);

        // Must be invalid
        expect(result.valid).toBe(false);

        // missingFields must contain at least one field
        expect(result.missingFields.length).toBeGreaterThan(0);

        // Each reported missing field must actually be null in the ad
        for (const field of result.missingFields) {
          expect(ad[field as keyof RawAdvertisement]).toBeNull();
        }

        // Every null mandatory field must be reported
        if (ad.price === null) expect(result.missingFields).toContain('price');
        if (ad.make === null) expect(result.missingFields).toContain('make');
        if (ad.model === null) expect(result.missingFields).toContain('model');
        if (ad.year === null) expect(result.missingFields).toContain('year');
      }),
      { numRuns: 100 }
    );
  });

  it('should accept advertisements with all mandatory fields present', () => {
    fc.assert(
      fc.property(validRawAdvertisementArb, (ad) => {
        const result = validateMandatoryFields(ad);

        // Must be valid
        expect(result.valid).toBe(true);

        // No missing fields
        expect(result.missingFields).toEqual([]);
      }),
      { numRuns: 100 }
    );
  });
});
