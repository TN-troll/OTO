import { describe, it, expect, beforeAll, vi } from 'vitest';
import fc from 'fast-check';
import { CurationEngine } from './curation-engine.js';
import type { RawAdvertisement, ExclusiveModelEntry } from '@car-ads/shared';
import { CURATION_HP_THRESHOLD } from '@car-ads/shared';

/**
 * Property 4: Curation Eligibility
 *
 * For any raw advertisement, the Curation Engine SHALL determine eligibility as follows:
 * the advertisement is eligible if and only if at least one of these conditions holds:
 * (a) horsepower > 300, (b) make appears in the luxury brands list, or (c) make+model
 * appears in the exclusive models list. When horsepower is null or 0, condition (a)
 * SHALL be treated as false and eligibility SHALL be determined by (b) and (c) only.
 *
 * Validates: Requirements 2.2, 2.3, 2.5
 */

// Test configuration
const LUXURY_BRANDS = [
  'Ferrari',
  'Lamborghini',
  'Bentley',
  'Rolls-Royce',
  'McLaren',
  'Aston Martin',
  'Bugatti',
];

const EXCLUSIVE_MODELS: ExclusiveModelEntry[] = [
  { make: 'Porsche', model: '911 GT3' },
  { make: 'BMW', model: 'M5' },
  { make: 'Mercedes', model: 'AMG GT' },
  { make: 'Audi', model: 'R8' },
  { make: 'Nissan', model: 'GT-R' },
];

// Mock the database module so CurationEngine doesn't hit a real DB
vi.mock('../db/connection.js', () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
}));

// Non-luxury brands for generating ads that don't match brand criterion
const NON_LUXURY_MAKES = [
  'Toyota',
  'Honda',
  'Volkswagen',
  'Ford',
  'Hyundai',
  'Kia',
  'Fiat',
  'Opel',
  'Renault',
  'Peugeot',
  'Skoda',
  'Seat',
  'Dacia',
  'Suzuki',
  'Mazda',
  'Subaru',
];

// Non-exclusive models for generating ads that don't match model criterion
const NON_EXCLUSIVE_MODELS = [
  'Corolla',
  'Civic',
  'Golf',
  'Focus',
  'i30',
  '3 Series',
  'A4',
  'C-Class',
  'Megane',
  '308',
];

// ============================================================
// Arbitrary generators
// ============================================================

/** Generate a random make (can be luxury or not) */
const arbMake = fc.oneof(
  fc.constantFrom(...LUXURY_BRANDS),
  fc.constantFrom(...NON_LUXURY_MAKES),
);

/** Generate a random model (can be exclusive or not) */
const arbModel = fc.oneof(
  fc.constantFrom(...EXCLUSIVE_MODELS.map((m) => m.model)),
  fc.constantFrom(...NON_EXCLUSIVE_MODELS),
);

/** Generate HP: null, 0, or a random positive integer */
const arbHorsepower = fc.oneof(
  fc.constant(null as number | null),
  fc.constant(0 as number | null),
  fc.integer({ min: 1, max: 2000 }) as fc.Arbitrary<number | null>,
);

/** Generate a full RawAdvertisement with random fields */
const arbRawAdvertisement: fc.Arbitrary<RawAdvertisement> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }),
  price: fc.oneof(fc.constant(null), fc.integer({ min: 1000, max: 5000000 })),
  mileage: fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 500000 })),
  year: fc.oneof(fc.constant(null), fc.integer({ min: 1950, max: 2024 })),
  make: fc.oneof(fc.constant(null), arbMake) as fc.Arbitrary<string | null>,
  model: fc.oneof(fc.constant(null), arbModel) as fc.Arbitrary<string | null>,
  engineDisplacementCc: fc.oneof(
    fc.constant(null),
    fc.integer({ min: 500, max: 8000 }),
  ),
  horsepower: arbHorsepower,
  location: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 50 })),
  sellerType: fc.oneof(
    fc.constant(null),
    fc.constantFrom('dealer' as const, 'private' as const),
  ),
  sourceUrl: fc.webUrl(),
  imageUrls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
  transmissionType: fc.oneof(
    fc.constant(null),
    fc.constantFrom('manual' as const, 'automatic' as const),
  ),
  fuelType: fc.oneof(
    fc.constant(null),
    fc.constantFrom(
      'petrol' as const,
      'diesel' as const,
      'hybrid' as const,
      'electric' as const,
    ),
  ),
});

// ============================================================
// Helper: compute expected eligibility using the same OR-logic
// ============================================================

function computeExpectedEligibility(ad: RawAdvertisement): boolean {
  // Condition (a): HP > 300 (only if not null and not 0)
  const hpEligible =
    ad.horsepower != null && ad.horsepower > 0 && ad.horsepower > CURATION_HP_THRESHOLD;

  // Condition (b): make is in luxury brands (case-insensitive)
  const brandEligible =
    ad.make != null &&
    LUXURY_BRANDS.some(
      (brand) => brand.toLowerCase().trim() === ad.make!.toLowerCase().trim(),
    );

  // Condition (c): make+model is in exclusive models (case-insensitive)
  const modelEligible =
    ad.make != null &&
    ad.model != null &&
    EXCLUSIVE_MODELS.some(
      (entry) =>
        entry.make.toLowerCase().trim() === ad.make!.toLowerCase().trim() &&
        entry.model.toLowerCase().trim() === ad.model!.toLowerCase().trim(),
    );

  return hpEligible || brandEligible || modelEligible;
}

// ============================================================
// Tests
// ============================================================

describe('Property 4: Curation Eligibility', () => {
  let engine: CurationEngine;

  beforeAll(async () => {
    engine = new CurationEngine();
    // Bypass the normal DB-based initialize by directly setting internal state
    // We access private fields via bracket notation for testing purposes
    (engine as any).luxuryBrands = LUXURY_BRANDS;
    (engine as any).exclusiveModels = EXCLUSIVE_MODELS;
    (engine as any).initialized = true;
  });

  it('should correctly determine eligibility using OR-logic (HP > 300, luxury brand, exclusive model)', () => {
    fc.assert(
      fc.property(arbRawAdvertisement, (ad) => {
        const result = engine.evaluate(ad);
        const expectedEligible = computeExpectedEligibility(ad);

        expect(result.eligible).toBe(expectedEligible);
      }),
      { numRuns: 100 },
    );
  });

  it('should never match HP criterion when horsepower is null or 0', () => {
    const arbAdWithNullOrZeroHp = arbRawAdvertisement.map((ad) => ({
      ...ad,
      horsepower: fc.sample(fc.constantFrom(null, 0), 1)[0],
    }));

    fc.assert(
      fc.property(arbAdWithNullOrZeroHp, (ad) => {
        const result = engine.evaluate(ad);

        // hp_above_300 should never be in matched criteria
        expect(result.matchedCriteria).not.toContain('hp_above_300');

        // Eligibility should only depend on brand and model
        const brandEligible =
          ad.make != null &&
          LUXURY_BRANDS.some(
            (brand) => brand.toLowerCase().trim() === ad.make!.toLowerCase().trim(),
          );
        const modelEligible =
          ad.make != null &&
          ad.model != null &&
          EXCLUSIVE_MODELS.some(
            (entry) =>
              entry.make.toLowerCase().trim() === ad.make!.toLowerCase().trim() &&
              entry.model.toLowerCase().trim() === ad.model!.toLowerCase().trim(),
          );

        expect(result.eligible).toBe(brandEligible || modelEligible);
      }),
      { numRuns: 100 },
    );
  });

  it('should include correct matched criteria when eligible', () => {
    fc.assert(
      fc.property(arbRawAdvertisement, (ad) => {
        const result = engine.evaluate(ad);

        if (result.eligible) {
          // At least one criterion must be matched
          expect(result.matchedCriteria.length).toBeGreaterThan(0);

          // Verify each matched criterion is valid
          if (result.matchedCriteria.includes('hp_above_300')) {
            expect(ad.horsepower).not.toBeNull();
            expect(ad.horsepower!).toBeGreaterThan(CURATION_HP_THRESHOLD);
          }

          if (result.matchedCriteria.includes('luxury_brand_match')) {
            expect(ad.make).not.toBeNull();
            expect(
              LUXURY_BRANDS.some(
                (b) => b.toLowerCase().trim() === ad.make!.toLowerCase().trim(),
              ),
            ).toBe(true);
          }

          if (result.matchedCriteria.includes('exclusive_model_match')) {
            expect(ad.make).not.toBeNull();
            expect(ad.model).not.toBeNull();
            expect(
              EXCLUSIVE_MODELS.some(
                (entry) =>
                  entry.make.toLowerCase().trim() === ad.make!.toLowerCase().trim() &&
                  entry.model.toLowerCase().trim() === ad.model!.toLowerCase().trim(),
              ),
            ).toBe(true);
          }
        } else {
          // Not eligible → no criteria matched
          expect(result.matchedCriteria).toHaveLength(0);
          expect(result.reason).toBe('not_eligible');
        }
      }),
      { numRuns: 100 },
    );
  });
});
