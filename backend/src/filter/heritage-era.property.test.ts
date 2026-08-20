import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import type { FilterCriteria } from '@car-ads/shared';
import type { HeritageEra } from '@car-ads/shared';
import { YEAR_MIN, YEAR_MAX } from '@car-ads/shared';

/**
 * Property 9: Heritage era maps to correct year boundaries
 *
 * For any combination of HeritageEra values, the generated WHERE clause SHALL
 * constrain the year column to:
 *   - classic → year < 1990
 *   - modern_classic → 1990 ≤ year ≤ 2010
 *   - contemporary → year > 2010
 *
 * When combined with explicit yearMin/yearMax filters, the effective constraint
 * SHALL be the intersection (most restrictive range) of both — meaning both
 * conditions appear in the WHERE clause as AND-joined conditions.
 *
 * **Validates: Requirements 14.11, 19.3, 19.6**
 */

// ─── Mocks ──────────────────────────────────────────────────────────────────────

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

// ─── Constants ──────────────────────────────────────────────────────────────────

const ALL_HERITAGE_ERAS: HeritageEra[] = ['classic', 'modern_classic', 'contemporary'];

const ERA_SQL_MAP: Record<HeritageEra, string> = {
  classic: 'l.year < 1990',
  modern_classic: '(l.year >= 1990 AND l.year <= 2010)',
  contemporary: 'l.year > 2010',
};

// ─── Helpers ────────────────────────────────────────────────────────────────────

function setupMocks() {
  mockGetRedisClient.mockReturnValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  } as any);

  mockQuery.mockImplementation(async (text: string) => {
    if (typeof text === 'string' && text.includes('COUNT(*)')) {
      return { rows: [{ count: '0' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] } as any;
    }
    return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as any;
  });
}

/** Captures all SQL statements issued by the engine */
function setupSqlCapture(): string[] {
  const sqlStatements: string[] = [];
  mockQuery.mockImplementation(async (text: string) => {
    sqlStatements.push(text);
    if (typeof text === 'string' && text.includes('COUNT(*)')) {
      return { rows: [{ count: '0' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] } as any;
    }
    return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as any;
  });
  return sqlStatements;
}

// ─── Arbitrary generators ───────────────────────────────────────────────────────

/** Generate a non-empty subset of HeritageEra values */
const arbHeritageEraSubset: fc.Arbitrary<HeritageEra[]> = fc.subarray(ALL_HERITAGE_ERAS, {
  minLength: 1,
});

/** Generate valid year range values where min <= max */
const arbYearRange: fc.Arbitrary<{ yearMin: number; yearMax: number }> = fc
  .tuple(
    fc.integer({ min: YEAR_MIN, max: YEAR_MAX }),
    fc.integer({ min: YEAR_MIN, max: YEAR_MAX }),
  )
  .map(([a, b]) => ({
    yearMin: Math.min(a, b),
    yearMax: Math.max(a, b),
  }));

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('Feature: premium-filter-overhaul, Property 9: Heritage era maps to correct year boundaries', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new FilterEngine();
    setupMocks();
  });

  it('generates correct year boundary SQL for any non-empty subset of HeritageEra values', async () => {
    await fc.assert(
      fc.asyncProperty(arbHeritageEraSubset, async (eras) => {
        const sqlStatements = setupSqlCapture();

        const criteria: FilterCriteria = { heritageEra: eras };
        await engine.query(criteria);

        // Get the WHERE clause from the COUNT query
        const countSql = sqlStatements.find((s) => s.includes('COUNT(*)'));
        expect(countSql).toBeDefined();

        // Verify each selected era's boundary condition is present
        for (const era of eras) {
          expect(countSql!).toContain(ERA_SQL_MAP[era]);
        }

        // Verify unselected eras are NOT present in the SQL
        for (const era of ALL_HERITAGE_ERAS) {
          if (!eras.includes(era)) {
            expect(countSql!).not.toContain(ERA_SQL_MAP[era]);
          }
        }

        // When multiple eras are selected, they are OR-joined within a group
        if (eras.length > 1) {
          expect(countSql!).toContain(' OR ');
        }

        // The era conditions are wrapped in parentheses as a group
        const eraGroupRegex = /\(.*l\.year.*\)/;
        expect(countSql!).toMatch(eraGroupRegex);
      }),
      { numRuns: 100 },
    );
  });

  it('produces intersection when heritage era is combined with explicit yearMin/yearMax filters', async () => {
    await fc.assert(
      fc.asyncProperty(arbHeritageEraSubset, arbYearRange, async (eras, yearRange) => {
        const sqlStatements = setupSqlCapture();

        const criteria: FilterCriteria = {
          heritageEra: eras,
          yearMin: yearRange.yearMin,
          yearMax: yearRange.yearMax,
        };
        await engine.query(criteria);

        const countSql = sqlStatements.find((s) => s.includes('COUNT(*)'));
        expect(countSql).toBeDefined();

        // Verify heritage era conditions are present
        for (const era of eras) {
          expect(countSql!).toContain(ERA_SQL_MAP[era]);
        }

        // Verify explicit year range conditions are ALSO present (intersection)
        expect(countSql!).toContain('l.year >= $');
        expect(countSql!).toContain('l.year <= $');

        // Both heritage era group AND explicit year range use AND conjunction
        // (era group is one AND-joined condition, yearMin is another, yearMax is another)
        const andSegments = countSql!.split(' AND ');
        // At least: status + yearMin + yearMax + era group = 4 segments
        expect(andSegments.length).toBeGreaterThanOrEqual(4);
      }),
      { numRuns: 100 },
    );
  });

  it('single era generates a single year boundary condition without OR', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ALL_HERITAGE_ERAS),
        async (era) => {
          const sqlStatements = setupSqlCapture();

          const criteria: FilterCriteria = { heritageEra: [era] };
          await engine.query(criteria);

          const countSql = sqlStatements.find((s) => s.includes('COUNT(*)'));
          expect(countSql).toBeDefined();

          // Only the selected era's condition should appear
          expect(countSql!).toContain(ERA_SQL_MAP[era]);

          // For a single era, the era group still appears in parens but without OR
          // Verify other era conditions are absent
          for (const otherEra of ALL_HERITAGE_ERAS) {
            if (otherEra !== era) {
              expect(countSql!).not.toContain(ERA_SQL_MAP[otherEra]);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('all three eras selected covers entire year range (equivalent to no year filter)', async () => {
    const sqlStatements = setupSqlCapture();

    const criteria: FilterCriteria = { heritageEra: ALL_HERITAGE_ERAS };
    await engine.query(criteria);

    const countSql = sqlStatements.find((s) => s.includes('COUNT(*)'));
    expect(countSql).toBeDefined();

    // All three era conditions should be present, OR-joined
    for (const era of ALL_HERITAGE_ERAS) {
      expect(countSql!).toContain(ERA_SQL_MAP[era]);
    }

    // The combined condition should use OR to cover the full range
    expect(countSql!).toContain(' OR ');
  });
});
