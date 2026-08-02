import { describe, it, expect, vi } from 'vitest';
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
} from '@car-ads/shared';

/**
 * Property 9: Invalid Range Rejection
 *
 * For any filter criteria where at least one range filter has a minimum value strictly
 * greater than its maximum value, the Filter Engine SHALL reject the criteria with a
 * validation error and SHALL NOT execute the query or return any Listings.
 *
 * Validates: Requirements 4.8
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

/** The four range types that can be inverted */
type RangeType = 'engineDisplacement' | 'horsepower' | 'year' | 'price';

/** Generate filter criteria with at least one inverted range (min > max) */
const arbInvalidRangeCriteria: fc.Arbitrary<{ criteria: FilterCriteria; invertedRanges: RangeType[] }> = fc
  .record({
    invertEngineDisplacement: fc.boolean(),
    invertHorsepower: fc.boolean(),
    invertYear: fc.boolean(),
    invertPrice: fc.boolean(),
    engineDisplacementRange: arbInvertedRange(DISPLACEMENT_MIN, DISPLACEMENT_MAX),
    horsepowerRange: arbInvertedRange(HORSEPOWER_MIN, HORSEPOWER_MAX),
    yearRange: arbInvertedRange(YEAR_MIN, YEAR_MAX),
    priceRange: arbInvertedRange(PRICE_MIN, PRICE_MAX),
  })
  .filter(
    (v) =>
      v.invertEngineDisplacement || v.invertHorsepower || v.invertYear || v.invertPrice,
  )
  .map((v) => {
    const criteria: FilterCriteria = {};
    const invertedRanges: RangeType[] = [];

    if (v.invertEngineDisplacement) {
      criteria.engineDisplacementMin = v.engineDisplacementRange.rangeMin;
      criteria.engineDisplacementMax = v.engineDisplacementRange.rangeMax;
      invertedRanges.push('engineDisplacement');
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

    if (v.invertPrice) {
      criteria.priceMin = v.priceRange.rangeMin;
      criteria.priceMax = v.priceRange.rangeMax;
      invertedRanges.push('price');
    }

    return { criteria, invertedRanges };
  });

// ============================================================
// Tests
// ============================================================

describe('Property 9: Invalid Range Rejection', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    engine = new FilterEngine();
    mockQuery.mockClear();
    mockRedisGet.mockClear();
    mockRedisSet.mockClear();
  });

  it('should return valid=false for any criteria where at least one range has min > max', () => {
    fc.assert(
      fc.property(arbInvalidRangeCriteria, ({ criteria, invertedRanges }) => {
        const result = engine.validateCriteria(criteria);

        // Must be invalid
        expect(result.valid).toBe(false);

        // Must have at least one error
        expect(result.errors.length).toBeGreaterThan(0);

        // Each inverted range should have a corresponding error
        for (const range of invertedRanges) {
          const hasError = result.errors.some((e) => e.field === range);
          expect(hasError).toBe(true);
        }
      }),
      { numRuns: 150 },
    );
  });

  it('should throw an error from query() without executing any database query', async () => {
    await fc.assert(
      fc.asyncProperty(arbInvalidRangeCriteria, async ({ criteria }) => {
        // query() should throw an error due to invalid criteria
        await expect(engine.query(criteria)).rejects.toThrow('Invalid filter criteria');

        // Database query should never have been called
        expect(mockQuery).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });

  it('should not return any listings for invalid range criteria', async () => {
    await fc.assert(
      fc.asyncProperty(arbInvalidRangeCriteria, async ({ criteria }) => {
        // Attempting to query should throw, ensuring no listings are returned
        let result: unknown = null;
        try {
          result = await engine.query(criteria);
        } catch {
          // Expected to throw - no listings returned
        }

        // If somehow no error was thrown, result should have no listings
        if (result !== null) {
          expect((result as any).listings).toHaveLength(0);
        }

        // No database interaction should have occurred
        expect(mockQuery).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });

  it('should not access Redis cache for invalid range criteria', async () => {
    await fc.assert(
      fc.asyncProperty(arbInvalidRangeCriteria, async ({ criteria }) => {
        try {
          await engine.query(criteria);
        } catch {
          // Expected to throw
        }

        // Redis should not have been consulted
        expect(mockRedisGet).not.toHaveBeenCalled();
        expect(mockRedisSet).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});
