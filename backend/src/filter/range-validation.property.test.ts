import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import type { FilterCriteria } from '@car-ads/shared';
import {
  DISPLACEMENT_MIN,
  DISPLACEMENT_MAX,
  HORSEPOWER_MIN,
  HORSEPOWER_MAX,
  YEAR_MIN,
  YEAR_MAX,
  PRICE_MIN,
  PRICE_MAX,
  DEFAULT_RANGES,
} from '@car-ads/shared';

/**
 * Property 4: Range validation rejects inverted bounds
 *
 * For any range filter field (price, horsepower, year, engineDisplacement, mileage)
 * where the user-supplied minimum exceeds the maximum, the validation function SHALL
 * return an error for that field, and the FilterContext SHALL suppress the API request.
 *
 * Validates: Requirements 9.1, 9.2, 9.3
 */

// Mock the database module - should never be called for invalid criteria
const mockQuery = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

// Mock Redis - should never be called for invalid criteria
const mockRedisGet = vi.fn();
const mockRedisSet = vi.fn();
vi.mock('../cache/redis.js', () => ({
  getRedisClient: () => ({
    get: (...args: unknown[]) => mockRedisGet(...args),
    set: (...args: unknown[]) => mockRedisSet(...args),
  }),
}));

// ============================================================
// Arbitrary generators for inverted ranges
// ============================================================

/** Generate a range pair where min > max within given bounds */
function arbInvertedRange(min: number, max: number): fc.Arbitrary<{ rangeMin: number; rangeMax: number }> {
  return fc.integer({ min, max }).chain((rangeMax) =>
    fc.integer({ min: rangeMax + 1, max: Math.max(rangeMax + 1, max + 1) }).map((rangeMin) => ({
      rangeMin,
      rangeMax,
    })),
  );
}

/** All five range types that can be inverted */
type RangeType = 'price' | 'horsepower' | 'year' | 'engineDisplacement' | 'mileage';

/** Range definitions with their bounds */
const RANGE_DEFINITIONS: Record<RangeType, { min: number; max: number; minField: keyof FilterCriteria; maxField: keyof FilterCriteria }> = {
  price: { min: PRICE_MIN, max: PRICE_MAX, minField: 'priceMin', maxField: 'priceMax' },
  horsepower: { min: HORSEPOWER_MIN, max: HORSEPOWER_MAX, minField: 'horsepowerMin', maxField: 'horsepowerMax' },
  year: { min: YEAR_MIN, max: YEAR_MAX, minField: 'yearMin', maxField: 'yearMax' },
  engineDisplacement: { min: DISPLACEMENT_MIN, max: DISPLACEMENT_MAX, minField: 'engineDisplacementMin', maxField: 'engineDisplacementMax' },
  mileage: { min: DEFAULT_RANGES.mileage.min, max: DEFAULT_RANGES.mileage.max, minField: 'mileageMin', maxField: 'mileageMax' },
};

// ============================================================
// Tests
// ============================================================

describe('Feature: premium-filter-overhaul, Property 4: Range validation rejects inverted bounds', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    engine = new FilterEngine();
    mockQuery.mockClear();
    mockRedisGet.mockClear();
    mockRedisSet.mockClear();
  });

  /**
   * **Validates: Requirements 9.1, 9.2, 9.3**
   *
   * For each range field pair (priceMin/priceMax, horsepowerMin/horsepowerMax,
   * yearMin/yearMax, engineDisplacementMin/engineDisplacementMax, mileageMin/mileageMax):
   * when min > max, validateCriteria returns { valid: false } with a field-level error.
   */
  it('should return valid=false with field-level error for any single inverted range field', () => {
    const rangeTypes: RangeType[] = ['price', 'horsepower', 'year', 'engineDisplacement', 'mileage'];

    for (const rangeType of rangeTypes) {
      const def = RANGE_DEFINITIONS[rangeType];

      fc.assert(
        fc.property(arbInvertedRange(def.min, def.max), ({ rangeMin, rangeMax }) => {
          const criteria: FilterCriteria = {
            [def.minField]: rangeMin,
            [def.maxField]: rangeMax,
          };

          const result = engine.validateCriteria(criteria);

          // Must be invalid
          expect(result.valid).toBe(false);

          // Must have an error for this specific field
          const fieldError = result.errors.find((e) => e.field === rangeType);
          expect(fieldError).toBeDefined();
          expect(fieldError!.message).toBeTruthy();
        }),
        { numRuns: 100 },
      );
    }
  });

  it('should return errors for ALL inverted range fields when multiple ranges are inverted simultaneously', () => {
    // Generate criteria where a random non-empty subset of range fields are inverted
    const arbMultipleInvertedRanges = fc
      .record({
        invertPrice: fc.boolean(),
        invertHorsepower: fc.boolean(),
        invertYear: fc.boolean(),
        invertEngineDisplacement: fc.boolean(),
        invertMileage: fc.boolean(),
        priceRange: arbInvertedRange(PRICE_MIN, PRICE_MAX),
        horsepowerRange: arbInvertedRange(HORSEPOWER_MIN, HORSEPOWER_MAX),
        yearRange: arbInvertedRange(YEAR_MIN, YEAR_MAX),
        engineDisplacementRange: arbInvertedRange(DISPLACEMENT_MIN, DISPLACEMENT_MAX),
        mileageRange: arbInvertedRange(DEFAULT_RANGES.mileage.min, DEFAULT_RANGES.mileage.max),
      })
      .filter(
        (v) => v.invertPrice || v.invertHorsepower || v.invertYear || v.invertEngineDisplacement || v.invertMileage,
      )
      .map((v) => {
        const criteria: FilterCriteria = {};
        const invertedRanges: RangeType[] = [];

        if (v.invertPrice) {
          criteria.priceMin = v.priceRange.rangeMin;
          criteria.priceMax = v.priceRange.rangeMax;
          invertedRanges.push('price');
        }
        if (v.invertHorsepower) {
          criteria.horsepowerMin = v.horsepowerRange.rangeMin;
          criteria.horsepowerMax = v.horsepowerRange.rangeMax;
          invertedRanges.push('horsepower');
        }
        if (v.invertYear) {
          criteria.yearMin = v.yearRange.rangeMin;
          criteria.yearMax = v.yearRange.rangeMax;
          invertedRanges.push('year');
        }
        if (v.invertEngineDisplacement) {
          criteria.engineDisplacementMin = v.engineDisplacementRange.rangeMin;
          criteria.engineDisplacementMax = v.engineDisplacementRange.rangeMax;
          invertedRanges.push('engineDisplacement');
        }
        if (v.invertMileage) {
          criteria.mileageMin = v.mileageRange.rangeMin;
          criteria.mileageMax = v.mileageRange.rangeMax;
          invertedRanges.push('mileage');
        }

        return { criteria, invertedRanges };
      });

    fc.assert(
      fc.property(arbMultipleInvertedRanges, ({ criteria, invertedRanges }) => {
        const result = engine.validateCriteria(criteria);

        // Must be invalid
        expect(result.valid).toBe(false);

        // Each inverted range must have a corresponding error
        for (const range of invertedRanges) {
          const hasError = result.errors.some((e) => e.field === range);
          expect(hasError).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should suppress API request (query throws) when criteria have inverted ranges', async () => {
    const arbSingleInvertedRange = fc.constantFrom(...(['price', 'horsepower', 'year', 'engineDisplacement', 'mileage'] as RangeType[])).chain((rangeType) => {
      const def = RANGE_DEFINITIONS[rangeType];
      return arbInvertedRange(def.min, def.max).map(({ rangeMin, rangeMax }) => ({
        criteria: {
          [def.minField]: rangeMin,
          [def.maxField]: rangeMax,
        } as FilterCriteria,
        rangeType,
      }));
    });

    await fc.assert(
      fc.asyncProperty(arbSingleInvertedRange, async ({ criteria }) => {
        // query() should throw due to invalid criteria — request is suppressed
        await expect(engine.query(criteria)).rejects.toThrow('Invalid filter criteria');

        // Database should never be called
        expect(mockQuery).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});
