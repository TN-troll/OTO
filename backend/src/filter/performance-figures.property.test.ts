import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import type { FilterCriteria } from '@car-ads/shared';

/**
 * Property 12: Performance Figure Filters Are No-Op (columns not yet in production)
 *
 * The columns zero_to_hundred_seconds and top_speed_kmh do not exist in the
 * production database (migrations not yet run). The filter engine must NOT
 * generate SQL referencing these columns, regardless of filter input values.
 *
 * Once migrations are run in production, this test should be reverted to
 * assert the clauses ARE generated.
 *
 * Validates: No 500 errors from non-existent columns
 */

// Mock the database module
const mockQuery = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

// Mock Redis
const mockRedisGet = vi.fn().mockResolvedValue(null);
const mockRedisSet = vi.fn().mockResolvedValue('OK');
vi.mock('../cache/redis.js', () => ({
  getRedisClient: () => ({
    get: mockRedisGet,
    set: mockRedisSet,
  }),
}));

// ============================================================
// Arbitrary generators
// ============================================================

/** Generate a positive accelerationMax value (2.0–20.0 seconds) */
const arbAccelerationMax = fc.double({ min: 2.0, max: 20.0, noNaN: true });

/** Generate a positive topSpeedMin value (100–400 km/h) */
const arbTopSpeedMin = fc.integer({ min: 100, max: 400 });

// ============================================================
// Helper
// ============================================================

function setupMockForQuery(): void {
  mockQuery.mockReset();
  mockQuery.mockImplementation(() => Promise.resolve({ rows: [{ count: '0' }] }));
  mockRedisGet.mockResolvedValue(null);
}

// ============================================================
// Tests
// ============================================================

describe('Property 12: Performance Figure Filters Are No-Op (columns not in production)', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    engine = new FilterEngine();
    setupMockForQuery();
  });

  it('should NOT include zero_to_hundred_seconds in SQL when accelerationMax is set', async () => {
    await fc.assert(
      fc.asyncProperty(arbAccelerationMax, async (accelerationMax) => {
        setupMockForQuery();

        await engine.query({ accelerationMax } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        // Column does not exist in production — must NOT be referenced
        expect(countSql).not.toContain('l.zero_to_hundred_seconds');
      }),
      { numRuns: 100 },
    );
  });

  it('should NOT include top_speed_kmh in SQL when topSpeedMin is set', async () => {
    await fc.assert(
      fc.asyncProperty(arbTopSpeedMin, async (topSpeedMin) => {
        setupMockForQuery();

        await engine.query({ topSpeedMin } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        // Column does not exist in production — must NOT be referenced
        expect(countSql).not.toContain('l.top_speed_kmh');
      }),
      { numRuns: 100 },
    );
  });

  it('should NOT include either performance column when both filters are active', async () => {
    await fc.assert(
      fc.asyncProperty(arbAccelerationMax, arbTopSpeedMin, async (accelerationMax, topSpeedMin) => {
        setupMockForQuery();

        await engine.query({ accelerationMax, topSpeedMin } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        // Neither column should be referenced
        expect(countSql).not.toContain('l.zero_to_hundred_seconds');
        expect(countSql).not.toContain('l.top_speed_kmh');
      }),
      { numRuns: 100 },
    );
  });

  it('should NOT include performance figure columns regardless of other filters', async () => {
    await fc.assert(
      fc.asyncProperty(arbAccelerationMax, arbTopSpeedMin, async (accelerationMax, topSpeedMin) => {
        setupMockForQuery();

        await engine.query({ accelerationMax, topSpeedMin, horsepowerMin: 300 } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        // Performance columns must not appear even with other valid filters
        expect(countSql).not.toContain('l.zero_to_hundred_seconds');
        expect(countSql).not.toContain('l.top_speed_kmh');

        // But other valid filters should still work
        expect(countSql).toContain('l.horsepower >= ');
      }),
      { numRuns: 100 },
    );
  });

  it('should NOT include performance figure conditions when neither filter is set', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          horsepowerMin: fc.oneof(
            fc.constant(undefined as number | undefined),
            fc.integer({ min: 100, max: 1500 }).map((v) => v as number | undefined),
          ),
        }),
        async (criteria) => {
          setupMockForQuery();

          await engine.query(criteria as FilterCriteria);

          expect(mockQuery).toHaveBeenCalled();
          const countSql = mockQuery.mock.calls[0][0] as string;

          // No performance figure conditions should be present
          expect(countSql).not.toContain('l.zero_to_hundred_seconds');
          expect(countSql).not.toContain('l.top_speed_kmh');
        },
      ),
      { numRuns: 100 },
    );
  });
});
