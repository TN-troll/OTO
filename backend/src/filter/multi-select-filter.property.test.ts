import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import type {
  FilterCriteria,
  DrivetrainType,
  ConditionType,
  EngineDetailConfiguration,
  ForcedInductionDetail,
  SellerType,
} from '@car-ads/shared';

/**
 * Property 1: Multi-select filter correctness
 *
 * Tests that multi-select filters generate correct SQL.
 *
 * All columns now exist in production (migrations run 2025-01-XX).
 *
 * Validates: Requirements 1.7, 14.2, 19.4
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
// Valid value sets for generators
// ============================================================

const DRIVETRAIN_VALUES: DrivetrainType[] = ['rwd', 'fwd', 'awd'];
const CONDITION_VALUES: ConditionType[] = ['new', 'used', 'classic'];
const ENGINE_DETAIL_CONFIG_VALUES: EngineDetailConfiguration[] = [
  'inline-4', 'inline-6', 'v6', 'v8', 'v10', 'v12', 'flat-4', 'flat-6', 'w12', 'rotary',
];
const FORCED_INDUCTION_DETAIL_VALUES: ForcedInductionDetail[] = [
  'naturally_aspirated', 'turbocharged', 'supercharged', 'twin_turbo',
];
const SELLER_TYPE_VALUES: SellerType[] = ['dealer', 'private'];
const DOOR_VALUES = [2, 3, 4, 5];
const SEAT_VALUES = [2, 4, 5, 6, 7];
const COLOR_VALUES = ['black', 'white', 'red', 'blue', 'silver', 'grey', 'green', 'yellow', 'orange', 'brown'];

// ============================================================
// Arbitrary generators for non-empty subsets
// ============================================================

const arbDrivetrains = fc.subarray(DRIVETRAIN_VALUES, { minLength: 1 });
const arbConditions = fc.subarray(CONDITION_VALUES, { minLength: 1 });
const arbEngineDetailConfigs = fc.subarray(ENGINE_DETAIL_CONFIG_VALUES, { minLength: 1 });
const arbForcedInductionDetails = fc.subarray(FORCED_INDUCTION_DETAIL_VALUES, { minLength: 1 });
const arbSellerTypes = fc.subarray(SELLER_TYPE_VALUES, { minLength: 1 });
const arbDoors = fc.subarray(DOOR_VALUES, { minLength: 1 });
const arbSeats = fc.subarray(SEAT_VALUES, { minLength: 1 });
const arbColors = fc.subarray(COLOR_VALUES, { minLength: 1 });

// ============================================================
// Helper: set up mock for a query call
// ============================================================

function setupMockForQuery(): void {
  mockQuery.mockReset();
  mockQuery.mockImplementation(() => Promise.resolve({ rows: [{ count: '0' }] }));
  mockRedisGet.mockResolvedValue(null);
}

// ============================================================
// Tests
// ============================================================

describe('Property 1: Multi-select filter correctness', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    engine = new FilterEngine();
    setupMockForQuery();
  });

  // ─── Active filters (columns exist in production) ───────────────────────

  it('should generate correct ANY clause for sellerType filter with arbitrary valid subsets', async () => {
    await fc.assert(
      fc.asyncProperty(arbSellerTypes, async (sellerTypes) => {
        setupMockForQuery();

        await engine.query({ sellerType: sellerTypes });

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;
        const params = mockQuery.mock.calls[0][1] as unknown[];

        expect(countSql).toContain('l.seller_type = ANY(');
        expect(params).toContainEqual(sellerTypes);
      }),
      { numRuns: 100 },
    );
  });

  it('should pass sellerType values as parameterized params (never inline in SQL)', async () => {
    await fc.assert(
      fc.asyncProperty(arbSellerTypes, async (sellerTypes) => {
        setupMockForQuery();

        await engine.query({ sellerType: sellerTypes });

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        // Verify no raw filter values are inlined in SQL
        for (const value of sellerTypes) {
          expect(countSql).not.toContain(`'${value}'`);
        }
      }),
      { numRuns: 100 },
    );
  });

  // ─── All filters now active (columns exist in production) ───────────────

  it('should generate correct ANY clause for drivetrain filter', async () => {
    await fc.assert(
      fc.asyncProperty(arbDrivetrains, async (drivetrains) => {
        setupMockForQuery();

        await engine.query({ drivetrain: drivetrains });

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        expect(countSql).toContain('l.drivetrain = ANY(');
      }),
      { numRuns: 100 },
    );
  });

  it('should generate correct ANY clause for color filter', async () => {
    await fc.assert(
      fc.asyncProperty(arbColors, async (colors) => {
        setupMockForQuery();

        await engine.query({ color: colors });

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        expect(countSql).toContain('l.exterior_color = ANY(');
      }),
      { numRuns: 100 },
    );
  });

  it('should generate correct ANY clause for doors filter', async () => {
    await fc.assert(
      fc.asyncProperty(arbDoors, async (doors) => {
        setupMockForQuery();

        await engine.query({ doors });

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        expect(countSql).toContain('l.door_count = ANY(');
      }),
      { numRuns: 100 },
    );
  });

  it('should generate correct ANY clause for seats filter', async () => {
    await fc.assert(
      fc.asyncProperty(arbSeats, async (seats) => {
        setupMockForQuery();

        await engine.query({ seats });

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        expect(countSql).toContain('l.seat_count = ANY(');
      }),
      { numRuns: 100 },
    );
  });

  it('should generate correct ANY clause for condition filter', async () => {
    await fc.assert(
      fc.asyncProperty(arbConditions, async (conditions) => {
        setupMockForQuery();

        await engine.query({ condition: conditions });

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        expect(countSql).toContain('l.condition = ANY(');
      }),
      { numRuns: 100 },
    );
  });

  it('should generate correct ANY clause for engineDetailConfiguration filter', async () => {
    await fc.assert(
      fc.asyncProperty(arbEngineDetailConfigs, async (engineConfigs) => {
        setupMockForQuery();

        await engine.query({ engineDetailConfiguration: engineConfigs });

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        expect(countSql).toContain('l.engine_detail_config = ANY(');
      }),
      { numRuns: 100 },
    );
  });

  it('should generate correct ANY clause for forcedInductionDetail filter', async () => {
    await fc.assert(
      fc.asyncProperty(arbForcedInductionDetails, async (inductionDetails) => {
        setupMockForQuery();

        await engine.query({ forcedInductionDetail: inductionDetails });

        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;

        expect(countSql).toContain('l.forced_induction_detail = ANY(');
      }),
      { numRuns: 100 },
    );
  });

  it('should generate SQL for all multi-select columns when all filters are combined', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbDrivetrains,
        arbDoors,
        arbSeats,
        arbConditions,
        arbEngineDetailConfigs,
        arbForcedInductionDetails,
        async (drivetrains, doors, seats, conditions, engineConfigs, inductionDetails) => {
          setupMockForQuery();

          const criteria: FilterCriteria = {
            drivetrain: drivetrains,
            doors,
            seats,
            condition: conditions,
            engineDetailConfiguration: engineConfigs,
            forcedInductionDetail: inductionDetails,
          };

          await engine.query(criteria);

          expect(mockQuery).toHaveBeenCalled();
          const countSql = mockQuery.mock.calls[0][0] as string;

          // All columns should appear in the SQL
          expect(countSql).toContain('l.drivetrain = ANY(');
          expect(countSql).toContain('l.door_count = ANY(');
          expect(countSql).toContain('l.seat_count = ANY(');
          expect(countSql).toContain('l.condition = ANY(');
          expect(countSql).toContain('l.engine_detail_config = ANY(');
          expect(countSql).toContain('l.forced_induction_detail = ANY(');
        },
      ),
      { numRuns: 100 },
    );
  });
});
