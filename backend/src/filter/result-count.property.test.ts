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
 * Property 12: Result Count Accuracy
 *
 * For any set of filter criteria and any totalCount returned by the database
 * COUNT(*) query, the FilterEngine result.totalCount SHALL equal the actual
 * matching count. The COUNT(*) query SHALL use the same WHERE clause as
 * the data query to ensure consistency.
 *
 * Validates: Requirements 5.4
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
// Arbitrary generators
// ============================================================

const TRANSMISSION_TYPES: TransmissionType[] = ['manual', 'automatic'];
const FUEL_TYPES: FuelType[] = ['petrol', 'diesel', 'hybrid', 'electric'];

/** Generate a random totalCount value (0 to 1000) */
const arbTotalCount = fc.integer({ min: 0, max: 1000 });

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
// Helper to set up mocks
// ============================================================

function setupRedisMock() {
  mockGetRedisClient.mockReturnValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  } as any);
}

// ============================================================
// Tests
// ============================================================

describe('Property 12: Result Count Accuracy', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new FilterEngine();
    setupRedisMock();
  });

  it('result.totalCount exactly matches the value returned by the COUNT(*) query', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbValidFilterCriteria,
        arbTotalCount,
        async (criteria, expectedCount) => {
          setupRedisMock();

          // Mock DB: COUNT query returns the random expectedCount, data query returns empty page
          mockQuery.mockImplementation(async (text: string) => {
            if (typeof text === 'string' && text.includes('COUNT(*)')) {
              return {
                rows: [{ count: String(expectedCount) }],
                command: 'SELECT',
                rowCount: 1,
                oid: 0,
                fields: [],
              } as any;
            }
            // Data query returns empty results (we're testing count accuracy, not data)
            return {
              rows: [],
              command: 'SELECT',
              rowCount: 0,
              oid: 0,
              fields: [],
            } as any;
          });

          const result = await engine.query(criteria);

          // Property: totalCount must exactly match what the COUNT(*) query returned
          expect(result.totalCount).toBe(expectedCount);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('the COUNT(*) query uses the same WHERE clause as the data query', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbValidFilterCriteria,
        arbTotalCount,
        async (criteria, expectedCount) => {
          setupRedisMock();

          const sqlStatements: string[] = [];

          mockQuery.mockImplementation(async (text: string) => {
            sqlStatements.push(text);
            if (typeof text === 'string' && text.includes('COUNT(*)')) {
              return {
                rows: [{ count: String(expectedCount) }],
                command: 'SELECT',
                rowCount: 1,
                oid: 0,
                fields: [],
              } as any;
            }
            return {
              rows: [],
              command: 'SELECT',
              rowCount: 0,
              oid: 0,
              fields: [],
            } as any;
          });

          await engine.query(criteria);

          // There should be exactly two queries: COUNT and data
          expect(sqlStatements.length).toBe(2);

          const countSql = sqlStatements.find((s) => s.includes('COUNT(*)'));
          const dataSql = sqlStatements.find((s) => !s.includes('COUNT(*)'));

          expect(countSql).toBeDefined();
          expect(dataSql).toBeDefined();

          // Extract WHERE clause from both queries
          const countWhere = countSql!.substring(
            countSql!.indexOf('WHERE'),
            countSql!.length,
          );
          const dataWhere = dataSql!.substring(
            dataSql!.indexOf('WHERE'),
            dataSql!.indexOf('ORDER BY'),
          ).trim();

          // Property: the WHERE clauses must be identical
          expect(countWhere).toBe(dataWhere);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('totalPages is consistent with totalCount and pageSize', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbValidFilterCriteria,
        arbTotalCount,
        async (criteria, expectedCount) => {
          setupRedisMock();

          mockQuery.mockImplementation(async (text: string) => {
            if (typeof text === 'string' && text.includes('COUNT(*)')) {
              return {
                rows: [{ count: String(expectedCount) }],
                command: 'SELECT',
                rowCount: 1,
                oid: 0,
                fields: [],
              } as any;
            }
            return {
              rows: [],
              command: 'SELECT',
              rowCount: 0,
              oid: 0,
              fields: [],
            } as any;
          });

          const result = await engine.query(criteria);

          // Property: totalPages = ceil(totalCount / pageSize)
          const expectedPages = Math.ceil(expectedCount / result.pageSize);
          expect(result.totalPages).toBe(expectedPages);
          expect(result.totalCount).toBe(expectedCount);
        },
      ),
      { numRuns: 100 },
    );
  });
});
