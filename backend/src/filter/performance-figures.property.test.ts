import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import type { FilterCriteria } from '@car-ads/shared';

/**
 * Property 12: Performance Figure Filters Generate Correct SQL
 *
 * The columns zero_to_hundred_seconds and top_speed_kmh now exist in the
 * production database (migrations run 2025-01-XX). The filter engine must
 * generate SQL referencing these columns when filter values are provided.
 *
 * Validates: Requirements 14.2, 19.4
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

describe('Property 12: Performance Figure Filters Generate Correct SQL', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    engine = new FilterEngine();
    setupMockForQuery();
  });

  it('should include zero_to_hundred_seconds in SQL when accelerationMax is set', async () => {
    await fc.assert(
      fc.asyncProperty(arbAccelerationMax, async (accelerationMax) => {
        setupMockForQuery();

        await engine.query({ accelerationMax } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        expect(countSql).toContain('l.zero_to_hundred_seconds');
      }),
      { numRuns: 100 },
    );
  });

  it('should include top_speed_kmh in SQL when topSpeedMin is set', async () => {
    await fc.assert(
      fc.asyncProperty(arbTopSpeedMin, async (topSpeedMin) => {
        setupMockForQuery();

        await engine.query({ topSpeedMin } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        expect(countSql).toContain('l.top_speed_kmh');
      }),
      { numRuns: 100 },
    );
  });

  it('should include both performance columns when both filters are active', async () => {
    await fc.assert(
      fc.asyncProperty(arbAccelerationMax, arbTopSpeedMin, async (accelerationMax, topSpeedMin) => {
        setupMockForQuery();

        await engine.query({ accelerationMax, topSpeedMin } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        expect(countSql).toContain('l.zero_to_hundred_seconds');
        expect(countSql).toContain('l.top_speed_kmh');
      }),
      { numRuns: 100 },
    );
  });

  it('should include performance figure columns alongside other filters', async () => {
    await fc.assert(
      fc.asyncProperty(arbAccelerationMax, arbTopSpeedMin, async (accelerationMax, topSpeedMin) => {
        setupMockForQuery();

        await engine.query({ accelerationMax, topSpeedMin, horsepowerMin: 300 } as FilterCriteria);

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        // Performance columns should appear
        expect(countSql).toContain('l.zero_to_hundred_seconds');
        expect(countSql).toContain('l.top_speed_kmh');

        // Other valid filters should still work
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

          // No performance figure conditions should be present when not requested
          expect(countSql).not.toContain('l.zero_to_hundred_seconds');
          expect(countSql).not.toContain('l.top_speed_kmh');
        },
      ),
      { numRuns: 100 },
    );
  });
});
