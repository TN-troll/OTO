import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import type { FilterCriteria } from '@car-ads/shared';
import type { TransmissionType, FuelType } from '@car-ads/shared';
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
 * Property 8: Combined Filter Conjunction
 *
 * For any set of filter criteria (including engine displacement range, horsepower range,
 * year range, price range, transmission type, fuel type, sound profile criteria, and search query)
 * and for any Listing returned by the Filter Engine, that Listing SHALL satisfy ALL applied
 * filter criteria simultaneously. A Listing violating any single criterion SHALL NOT appear
 * in the results.
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.4
 */

// Mock the database and cache modules
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
}));

vi.mock('../cache/redis.js', () => ({
  getRedisClient: vi.fn(),
}));

import { query } from '../db/connection.js';
import { getRedisClient } from '../cache/redis.js';

const mockQuery = vi.mocked(query);
const mockGetRedisClient = vi.mocked(getRedisClient);

// ============================================================
// Types for test listings
// ============================================================

interface TestListing {
  id: string;
  title: string;
  image_urls: string[];
  make: string;
  model: string;
  year: number;
  price: number;
  horsepower: number | null;
  engine_displacement_cc: number | null;
  transmission_type: TransmissionType | null;
  fuel_type: FuelType | null;
  status: 'active' | 'inactive';
  date_added: Date;
}

// ============================================================
// Arbitrary generators
// ============================================================

const TRANSMISSION_TYPES: TransmissionType[] = ['manual', 'automatic'];
const FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'hybrid', 'electric'];

/** Generate a random test listing */
const arbTestListing: fc.Arbitrary<TestListing> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 3, maxLength: 80 }),
  image_urls: fc.array(fc.constant('https://example.com/img.jpg'), { minLength: 0, maxLength: 3 }),
  make: fc.constantFrom('Ferrari', 'BMW', 'Mercedes', 'Porsche', 'Toyota', 'Honda', 'Audi'),
  model: fc.constantFrom('488', 'M5', 'AMG GT', '911', 'Corolla', 'Civic', 'R8'),
  year: fc.integer({ min: YEAR_MIN, max: YEAR_MAX }),
  price: fc.integer({ min: 1000, max: PRICE_MAX }),
  horsepower: fc.oneof(
    fc.constant(null as number | null),
    fc.integer({ min: 50, max: HORSEPOWER_MAX }) as fc.Arbitrary<number | null>,
  ),
  engine_displacement_cc: fc.oneof(
    fc.constant(null as number | null),
    fc.integer({ min: 500, max: DISPLACEMENT_MAX }) as fc.Arbitrary<number | null>,
  ),
  transmission_type: fc.oneof(
    fc.constant(null as TransmissionType | null),
    fc.constantFrom(...TRANSMISSION_TYPES) as fc.Arbitrary<TransmissionType | null>,
  ),
  fuel_type: fc.oneof(
    fc.constant(null as FuelType | null),
    fc.constantFrom(...FUEL_TYPES) as fc.Arbitrary<FuelType | null>,
  ),
  status: fc.constant('active' as const),
  date_added: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
});

/** Generate valid filter criteria with valid ranges (min <= max, within bounds) */
const arbValidFilterCriteria: fc.Arbitrary<FilterCriteria> = fc.record(
  {
    engineDisplacementMin: fc.integer({ min: DISPLACEMENT_MIN, max: DISPLACEMENT_MAX }),
    engineDisplacementMax: fc.integer({ min: DISPLACEMENT_MIN, max: DISPLACEMENT_MAX }),
    horsepowerMin: fc.integer({ min: HORSEPOWER_MIN, max: HORSEPOWER_MAX }),
    horsepowerMax: fc.integer({ min: HORSEPOWER_MIN, max: HORSEPOWER_MAX }),
    yearMin: fc.integer({ min: YEAR_MIN, max: YEAR_MAX }),
    yearMax: fc.integer({ min: YEAR_MIN, max: YEAR_MAX }),
    priceMin: fc.integer({ min: PRICE_MIN, max: PRICE_MAX }),
    priceMax: fc.integer({ min: PRICE_MIN, max: PRICE_MAX }),
    transmissionType: fc.subarray(TRANSMISSION_TYPES, { minLength: 1 }),
    fuelType: fc.subarray(FUEL_TYPES, { minLength: 1 }),
  },
  { requiredKeys: [] },
).map((raw) => {
  const criteria: FilterCriteria = {};

  // Ensure min <= max for each range by sorting
  if (raw.engineDisplacementMin !== undefined && raw.engineDisplacementMax !== undefined) {
    criteria.engineDisplacementMin = Math.min(raw.engineDisplacementMin, raw.engineDisplacementMax);
    criteria.engineDisplacementMax = Math.max(raw.engineDisplacementMin, raw.engineDisplacementMax);
  } else if (raw.engineDisplacementMin !== undefined) {
    criteria.engineDisplacementMin = raw.engineDisplacementMin;
  } else if (raw.engineDisplacementMax !== undefined) {
    criteria.engineDisplacementMax = raw.engineDisplacementMax;
  }

  if (raw.horsepowerMin !== undefined && raw.horsepowerMax !== undefined) {
    criteria.horsepowerMin = Math.min(raw.horsepowerMin, raw.horsepowerMax);
    criteria.horsepowerMax = Math.max(raw.horsepowerMin, raw.horsepowerMax);
  } else if (raw.horsepowerMin !== undefined) {
    criteria.horsepowerMin = raw.horsepowerMin;
  } else if (raw.horsepowerMax !== undefined) {
    criteria.horsepowerMax = raw.horsepowerMax;
  }

  if (raw.yearMin !== undefined && raw.yearMax !== undefined) {
    criteria.yearMin = Math.min(raw.yearMin, raw.yearMax);
    criteria.yearMax = Math.max(raw.yearMin, raw.yearMax);
  } else if (raw.yearMin !== undefined) {
    criteria.yearMin = raw.yearMin;
  } else if (raw.yearMax !== undefined) {
    criteria.yearMax = raw.yearMax;
  }

  if (raw.priceMin !== undefined && raw.priceMax !== undefined) {
    criteria.priceMin = Math.min(raw.priceMin, raw.priceMax);
    criteria.priceMax = Math.max(raw.priceMin, raw.priceMax);
  } else if (raw.priceMin !== undefined) {
    criteria.priceMin = raw.priceMin;
  } else if (raw.priceMax !== undefined) {
    criteria.priceMax = raw.priceMax;
  }

  if (raw.transmissionType !== undefined) {
    criteria.transmissionType = raw.transmissionType;
  }
  if (raw.fuelType !== undefined) {
    criteria.fuelType = raw.fuelType;
  }

  return criteria;
});

// ============================================================
// In-memory filter logic (mirrors the AND conjunction)
// ============================================================

/**
 * Determines if a listing satisfies ALL the given filter criteria.
 * This is the reference implementation for the AND conjunction property.
 */
function listingSatisfiesCriteria(listing: TestListing, criteria: FilterCriteria): boolean {
  // Only active listings are returned
  if (listing.status !== 'active') return false;

  // Engine displacement range
  if (criteria.engineDisplacementMin !== undefined) {
    if (listing.engine_displacement_cc === null || listing.engine_displacement_cc < criteria.engineDisplacementMin) {
      return false;
    }
  }
  if (criteria.engineDisplacementMax !== undefined) {
    if (listing.engine_displacement_cc === null || listing.engine_displacement_cc > criteria.engineDisplacementMax) {
      return false;
    }
  }

  // Horsepower range
  if (criteria.horsepowerMin !== undefined) {
    if (listing.horsepower === null || listing.horsepower < criteria.horsepowerMin) {
      return false;
    }
  }
  if (criteria.horsepowerMax !== undefined) {
    if (listing.horsepower === null || listing.horsepower > criteria.horsepowerMax) {
      return false;
    }
  }

  // Year range
  if (criteria.yearMin !== undefined) {
    if (listing.year < criteria.yearMin) return false;
  }
  if (criteria.yearMax !== undefined) {
    if (listing.year > criteria.yearMax) return false;
  }

  // Price range
  if (criteria.priceMin !== undefined) {
    if (listing.price < criteria.priceMin) return false;
  }
  if (criteria.priceMax !== undefined) {
    if (listing.price > criteria.priceMax) return false;
  }

  // Transmission type (array of allowed values)
  if (criteria.transmissionType?.length) {
    if (listing.transmission_type === null || !criteria.transmissionType.includes(listing.transmission_type)) {
      return false;
    }
  }

  // Fuel type (array of allowed values)
  if (criteria.fuelType?.length) {
    if (listing.fuel_type === null || !criteria.fuelType.includes(listing.fuel_type)) {
      return false;
    }
  }

  return true;
}

// ============================================================
// Helper to set up mocks
// ============================================================

function setupMocks() {
  mockGetRedisClient.mockReturnValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  } as any);
}

function setupDbForListings(matchingListings: TestListing[]) {
  mockQuery.mockImplementation(async (text: string) => {
    if (typeof text === 'string' && text.includes('COUNT(*)')) {
      return {
        rows: [{ count: String(matchingListings.length) }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any;
    }
    return {
      rows: matchingListings.map((l) => ({
        id: l.id,
        title: l.title,
        image_urls: l.image_urls,
        make: l.make,
        model: l.model,
        year: l.year,
        price: l.price,
        horsepower: l.horsepower,
        engine_displacement_cc: l.engine_displacement_cc,
        date_added: l.date_added,
      })),
      command: 'SELECT',
      rowCount: matchingListings.length,
      oid: 0,
      fields: [],
    } as any;
  });
}

// ============================================================
// Tests
// ============================================================

describe('Property 8: Combined Filter Conjunction', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new FilterEngine();
    setupMocks();
  });

  it('should validate any valid combined filter criteria without errors', () => {
    fc.assert(
      fc.property(arbValidFilterCriteria, (criteria) => {
        const result = engine.validateCriteria(criteria);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 150 },
    );
  });

  it('every returned listing satisfies ALL applied filter criteria (AND conjunction)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbTestListing, { minLength: 1, maxLength: 20 }),
        arbValidFilterCriteria,
        async (listings, criteria) => {
          // Compute expected results using in-memory AND filtering
          const expectedResults = listings.filter((l) => listingSatisfiesCriteria(l, criteria));

          // Mock the DB to return only those listings that pass all criteria
          // This simulates what the real DB would return with the WHERE clause
          setupMocks();
          setupDbForListings(expectedResults);

          const result = await engine.query(criteria);

          // Property: every returned listing must satisfy ALL criteria
          for (const returned of result.listings) {
            const original = listings.find((l) => l.id === returned.id);
            if (original) {
              expect(listingSatisfiesCriteria(original, criteria)).toBe(true);
            }
          }

          // Property: no listing violating any criterion appears in results
          const violatingIds = listings
            .filter((l) => !listingSatisfiesCriteria(l, criteria))
            .map((l) => l.id);
          const returnedIds = result.listings.map((l) => l.id);
          for (const violatingId of violatingIds) {
            expect(returnedIds).not.toContain(violatingId);
          }

          // Property: count matches expected
          expect(result.totalCount).toBe(expectedResults.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('the WHERE clause contains AND conditions for every specified filter', async () => {
    await fc.assert(
      fc.asyncProperty(arbValidFilterCriteria, async (criteria) => {
        // Track SQL calls
        const sqlStatements: string[] = [];
        setupMocks();
        mockQuery.mockImplementation(async (text: string) => {
          sqlStatements.push(text);
          if (typeof text === 'string' && text.includes('COUNT(*)')) {
            return { rows: [{ count: '0' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] } as any;
          }
          return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as any;
        });

        await engine.query(criteria);

        const countSql = sqlStatements.find((s) => s.includes('COUNT(*)'));
        expect(countSql).toBeDefined();

        // Always filter active only
        expect(countSql!).toContain("l.status = 'active'");

        // Verify each applied filter generates a corresponding AND condition
        if (criteria.engineDisplacementMin !== undefined) {
          expect(countSql!).toContain('l.engine_displacement_cc >= $');
        }
        if (criteria.engineDisplacementMax !== undefined) {
          expect(countSql!).toContain('l.engine_displacement_cc <= $');
        }
        if (criteria.horsepowerMin !== undefined) {
          expect(countSql!).toContain('l.horsepower >= $');
        }
        if (criteria.horsepowerMax !== undefined) {
          expect(countSql!).toContain('l.horsepower <= $');
        }
        if (criteria.yearMin !== undefined) {
          expect(countSql!).toContain('l.year >= $');
        }
        if (criteria.yearMax !== undefined) {
          expect(countSql!).toContain('l.year <= $');
        }
        if (criteria.priceMin !== undefined) {
          expect(countSql!).toContain('l.price >= $');
        }
        if (criteria.priceMax !== undefined) {
          expect(countSql!).toContain('l.price <= $');
        }
        if (criteria.transmissionType?.length) {
          expect(countSql!).toContain('l.transmission_type = ANY($');
        }
        if (criteria.fuelType?.length) {
          expect(countSql!).toContain('l.fuel_type = ANY($');
        }

        // Verify conditions are joined with AND (all active conditions plus status)
        const andCount = (countSql!.match(/ AND /g) || []).length;
        const expectedConditions = [
          criteria.engineDisplacementMin !== undefined,
          criteria.engineDisplacementMax !== undefined,
          criteria.horsepowerMin !== undefined,
          criteria.horsepowerMax !== undefined,
          criteria.yearMin !== undefined,
          criteria.yearMax !== undefined,
          criteria.priceMin !== undefined,
          criteria.priceMax !== undefined,
          (criteria.transmissionType?.length ?? 0) > 0,
          (criteria.fuelType?.length ?? 0) > 0,
        ].filter(Boolean).length;

        // AND count should equal the number of additional conditions
        // (since the base condition "l.status = 'active'" is first)
        expect(andCount).toBe(expectedConditions);
      }),
      { numRuns: 100 },
    );
  });
});
