import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import type { FilterCriteria } from '@car-ads/shared';

/**
 * Property 12: Performance Figure Filters Exclude NULL Data
 *
 * For any accelerationMax value, all returned listings SHALL have
 * zero_to_hundred_seconds <= accelerationMax AND zero_to_hundred_seconds IS NOT NULL.
 *
 * For any topSpeedMin value, all returned listings SHALL have
 * top_speed_kmh >= topSpeedMin AND top_speed_kmh IS NOT NULL.
 *
 * Validates: Requirements 14.13, 14.14, 18.8, 18.9, 18.10
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

describe('Property 12: Performance Figure Filters Exclude NULL Data', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    engine = new FilterEngine();
    setupMockForQuery();
  });

  it('should include IS NOT NULL and <= bound for accelerationMax', async () => {
    await fc.assert(
      fc.asyncProperty(arbAccelerationMax, async (accelerationMax) => {
        setupMockForQuery();

        await engine.query({ accelerationMax } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;
        const params = mockQuery.mock.calls[0][1] as unknown[];

        // SQL must include NULL exclusion for zero_to_hundred_seconds
        expect(countSql).toContain('l.zero_to_hundred_seconds IS NOT NULL');
        // SQL must include the upper bound condition
        expect(countSql).toMatch(/l\.zero_to_hundred_seconds <= \$\d+/);
        // Params must contain the accelerationMax value
        expect(params).toContain(accelerationMax);
      }),
      { numRuns: 100 },
    );
  });

  it('should include IS NOT NULL and >= bound for topSpeedMin', async () => {
    await fc.assert(
      fc.asyncProperty(arbTopSpeedMin, async (topSpeedMin) => {
        setupMockForQuery();

        await engine.query({ topSpeedMin } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;
        const params = mockQuery.mock.calls[0][1] as unknown[];

        // SQL must include NULL exclusion for top_speed_kmh
        expect(countSql).toContain('l.top_speed_kmh IS NOT NULL');
        // SQL must include the lower bound condition
        expect(countSql).toMatch(/l\.top_speed_kmh >= \$\d+/);
        // Params must contain the topSpeedMin value
        expect(params).toContain(topSpeedMin);
      }),
      { numRuns: 100 },
    );
  });

  it('should include both NULL exclusions when both filters are active', async () => {
    await fc.assert(
      fc.asyncProperty(arbAccelerationMax, arbTopSpeedMin, async (accelerationMax, topSpeedMin) => {
        setupMockForQuery();

        await engine.query({ accelerationMax, topSpeedMin } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;
        const params = mockQuery.mock.calls[0][1] as unknown[];

        // Both NULL exclusions must be present
        expect(countSql).toContain('l.zero_to_hundred_seconds IS NOT NULL');
        expect(countSql).toContain('l.top_speed_kmh IS NOT NULL');

        // Both bound conditions must be present
        expect(countSql).toMatch(/l\.zero_to_hundred_seconds <= \$\d+/);
        expect(countSql).toMatch(/l\.top_speed_kmh >= \$\d+/);

        // Params must contain both values
        expect(params).toContain(accelerationMax);
        expect(params).toContain(topSpeedMin);
      }),
      { numRuns: 100 },
    );
  });

  it('should pass performance figure values as parameterized query values (not inlined)', async () => {
    await fc.assert(
      fc.asyncProperty(arbAccelerationMax, arbTopSpeedMin, async (accelerationMax, topSpeedMin) => {
        setupMockForQuery();

        await engine.query({ accelerationMax, topSpeedMin } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        // The raw numeric values should NOT appear inline in the SQL
        expect(countSql).not.toContain(`<= ${accelerationMax}`);
        expect(countSql).not.toContain(`>= ${topSpeedMin}`);

        // Instead they should use parameterized $N placeholders
        expect(countSql).toMatch(/l\.zero_to_hundred_seconds <= \$\d+/);
        expect(countSql).toMatch(/l\.top_speed_kmh >= \$\d+/);
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
