import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import type {
  SoundFilterCriteria,
  FilterCriteria,
  EngineConfiguration,
  ForcedInduction,
  ExhaustNote,
} from '@car-ads/shared';

/**
 * Property 6: Sound Filter Correctness
 *
 * For any set of sound filter criteria and for any Listing returned by the Filter Engine,
 * that Listing SHALL have a classified Sound_Profile matching ALL selected sound criteria.
 * No Listing with an unclassified sound profile SHALL appear in sound-filtered results.
 *
 * Validates: Requirements 3.3
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
// Arbitrary generators for SoundFilterCriteria
// ============================================================

const ENGINE_CONFIGURATIONS: EngineConfiguration[] = ['inline', 'v-type', 'flat', 'rotary'];
const FORCED_INDUCTIONS: ForcedInduction[] = ['naturally_aspirated', 'turbocharged', 'supercharged'];
const EXHAUST_NOTES: ExhaustNote[] = ['deep_rumble', 'high_pitched_scream', 'aggressive_bark', 'smooth_purr'];
const CYLINDER_COUNTS = [2, 3, 4, 5, 6, 8, 10, 12, 16];

/** Generate a non-empty subset of engine configurations */
const arbEngineConfigurations = fc.subarray(ENGINE_CONFIGURATIONS, { minLength: 1 });

/** Generate a non-empty subset of cylinder counts */
const arbCylinderCounts = fc.subarray(CYLINDER_COUNTS, { minLength: 1 });

/** Generate a non-empty subset of forced induction types */
const arbForcedInductions = fc.subarray(FORCED_INDUCTIONS, { minLength: 1 });

/** Generate a non-empty subset of exhaust notes */
const arbExhaustNotes = fc.subarray(EXHAUST_NOTES, { minLength: 1 });

/**
 * Generate a SoundFilterCriteria where at least one field is non-empty.
 * This ensures the sound filter is actually active (triggers the INNER JOIN).
 */
const arbNonEmptySoundFilter: fc.Arbitrary<SoundFilterCriteria> = fc
  .record({
    engineConfiguration: fc.oneof(
      fc.constant(undefined as EngineConfiguration[] | undefined),
      arbEngineConfigurations.map((v) => v as EngineConfiguration[] | undefined),
    ),
    cylinderCount: fc.oneof(
      fc.constant(undefined as number[] | undefined),
      arbCylinderCounts.map((v) => v as number[] | undefined),
    ),
    forcedInduction: fc.oneof(
      fc.constant(undefined as ForcedInduction[] | undefined),
      arbForcedInductions.map((v) => v as ForcedInduction[] | undefined),
    ),
    exhaustNote: fc.oneof(
      fc.constant(undefined as ExhaustNote[] | undefined),
      arbExhaustNotes.map((v) => v as ExhaustNote[] | undefined),
    ),
  })
  .filter((sp) => {
    // At least one field must be a non-empty array
    return !!(
      (sp.engineConfiguration && sp.engineConfiguration.length > 0) ||
      (sp.cylinderCount && sp.cylinderCount.length > 0) ||
      (sp.forcedInduction && sp.forcedInduction.length > 0) ||
      (sp.exhaustNote && sp.exhaustNote.length > 0)
    );
  }) as fc.Arbitrary<SoundFilterCriteria>;

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

describe('Property 6: Sound Filter Correctness', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    engine = new FilterEngine();
    setupMockForQuery();
  });

  it('should include INNER JOIN to sound_profiles when sound filters are applied', async () => {
    await fc.assert(
      fc.asyncProperty(arbNonEmptySoundFilter, async (soundFilter) => {
        setupMockForQuery();

        await engine.query({ soundProfile: soundFilter });

        // Both the count and data queries should contain the INNER JOIN
        expect(mockQuery).toHaveBeenCalled();
        const countSql = mockQuery.mock.calls[0][0] as string;
        const dataSql = mockQuery.mock.calls[1][0] as string;

        expect(countSql).toContain('INNER JOIN sound_profiles sp ON l.sound_profile_id = sp.id');
        expect(dataSql).toContain('INNER JOIN sound_profiles sp ON l.sound_profile_id = sp.id');
      }),
      { numRuns: 100 },
    );
  });

  it('should include sound_profile_id IS NOT NULL to exclude unclassified profiles', async () => {
    await fc.assert(
      fc.asyncProperty(arbNonEmptySoundFilter, async (soundFilter) => {
        setupMockForQuery();

        await engine.query({ soundProfile: soundFilter });

        const countSql = mockQuery.mock.calls[0][0] as string;
        const dataSql = mockQuery.mock.calls[1][0] as string;

        expect(countSql).toContain('l.sound_profile_id IS NOT NULL');
        expect(dataSql).toContain('l.sound_profile_id IS NOT NULL');
      }),
      { numRuns: 100 },
    );
  });

  it('should include correct WHERE conditions for each sound filter criterion', async () => {
    await fc.assert(
      fc.asyncProperty(arbNonEmptySoundFilter, async (soundFilter) => {
        setupMockForQuery();

        await engine.query({ soundProfile: soundFilter });

        const countSql = mockQuery.mock.calls[0][0] as string;
        const params = mockQuery.mock.calls[0][1] as unknown[];

        // Verify engine configuration filter
        if (soundFilter.engineConfiguration && soundFilter.engineConfiguration.length > 0) {
          expect(countSql).toContain('sp.engine_configuration = ANY(');
          expect(params).toContainEqual(soundFilter.engineConfiguration);
        }

        // Verify cylinder count filter
        if (soundFilter.cylinderCount && soundFilter.cylinderCount.length > 0) {
          expect(countSql).toContain('sp.cylinder_count = ANY(');
          expect(params).toContainEqual(soundFilter.cylinderCount);
        }

        // Verify forced induction filter
        if (soundFilter.forcedInduction && soundFilter.forcedInduction.length > 0) {
          expect(countSql).toContain('sp.forced_induction = ANY(');
          expect(params).toContainEqual(soundFilter.forcedInduction);
        }

        // Verify exhaust note filter
        if (soundFilter.exhaustNote && soundFilter.exhaustNote.length > 0) {
          expect(countSql).toContain('sp.exhaust_note = ANY(');
          expect(params).toContainEqual(soundFilter.exhaustNote);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('should NOT include sound join or sound conditions when no sound filter is applied', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          horsepowerMin: fc.oneof(
            fc.constant(undefined as number | undefined),
            fc.integer({ min: 0, max: 2000 }).map((v) => v as number | undefined),
          ),
          priceMin: fc.oneof(
            fc.constant(undefined as number | undefined),
            fc.integer({ min: 0, max: 50000000 }).map((v) => v as number | undefined),
          ),
        }),
        async (criteria) => {
          setupMockForQuery();

          await engine.query(criteria as FilterCriteria);

          expect(mockQuery).toHaveBeenCalled();
          const countSql = mockQuery.mock.calls[0][0] as string;

          expect(countSql).not.toContain('INNER JOIN sound_profiles');
          expect(countSql).not.toContain('l.sound_profile_id IS NOT NULL');
          expect(countSql).not.toContain('sp.engine_configuration');
          expect(countSql).not.toContain('sp.cylinder_count');
          expect(countSql).not.toContain('sp.forced_induction');
          expect(countSql).not.toContain('sp.exhaust_note');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should pass all sound filter values as parameterized query values (not inline)', async () => {
    await fc.assert(
      fc.asyncProperty(arbNonEmptySoundFilter, async (soundFilter) => {
        setupMockForQuery();

        await engine.query({ soundProfile: soundFilter });

        const countSql = mockQuery.mock.calls[0][0] as string;
        const params = mockQuery.mock.calls[0][1] as unknown[];

        // Count the expected number of sound filter params
        let expectedSoundParams = 0;
        if (soundFilter.engineConfiguration && soundFilter.engineConfiguration.length > 0) expectedSoundParams++;
        if (soundFilter.cylinderCount && soundFilter.cylinderCount.length > 0) expectedSoundParams++;
        if (soundFilter.forcedInduction && soundFilter.forcedInduction.length > 0) expectedSoundParams++;
        if (soundFilter.exhaustNote && soundFilter.exhaustNote.length > 0) expectedSoundParams++;

        // Params should contain all sound filter arrays
        expect(params.length).toBeGreaterThanOrEqual(expectedSoundParams);

        // Verify no raw sound values are inlined in SQL
        for (const config of soundFilter.engineConfiguration ?? []) {
          expect(countSql).not.toContain(`'${config}'`);
        }
        for (const note of soundFilter.exhaustNote ?? []) {
          expect(countSql).not.toContain(`'${note}'`);
        }
        for (const induction of soundFilter.forcedInduction ?? []) {
          expect(countSql).not.toContain(`'${induction}'`);
        }
      }),
      { numRuns: 100 },
    );
  });
});
