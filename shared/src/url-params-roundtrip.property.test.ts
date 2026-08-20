/**
 * Property-based test: URL parameter round-trip serialization (Property 2)
 *
 * Validates: Requirements 8.1, 8.2, 8.3, 8.5, 12.1, 16.10
 *
 * For any valid FilterCriteria object (with all premium filter fields populated
 * within their valid domains), serializing to URL query parameters and
 * deserializing back produces a deeply equal object.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { serializeFilters, deserializeFilters } from './url-params';
import type { FilterCriteria } from './types';
import type {
  DrivetrainType,
  ConditionType,
  EngineDetailConfiguration,
  ForcedInductionDetail,
  HeritageEra,
  PerformancePresetId,
  SellerType,
} from './enums';

// ─── Arbitraries for valid domain values ────────────────────────────────────────

const drivetrainArb: fc.Arbitrary<DrivetrainType> = fc.constantFrom('rwd', 'fwd', 'awd');

const sellerTypeArb: fc.Arbitrary<SellerType> = fc.constantFrom('dealer', 'private');

const conditionArb: fc.Arbitrary<ConditionType> = fc.constantFrom('new', 'used', 'classic');

const engineDetailConfigArb: fc.Arbitrary<EngineDetailConfiguration> = fc.constantFrom(
  'inline-4', 'inline-6', 'v6', 'v8', 'v10', 'v12', 'flat-4', 'flat-6', 'w12', 'rotary',
);

const forcedInductionDetailArb: fc.Arbitrary<ForcedInductionDetail> = fc.constantFrom(
  'naturally_aspirated', 'turbocharged', 'supercharged', 'twin_turbo',
);

const heritageEraArb: fc.Arbitrary<HeritageEra> = fc.constantFrom('classic', 'modern_classic', 'contemporary');

const performancePresetArb: fc.Arbitrary<PerformancePresetId> = fc.constantFrom(
  'v8_grand_tourers', 'track_weapons', 'daily_luxury', 'classic_collectibles',
);

/**
 * Color arbitrary: generates non-empty lowercase alpha strings (simulating real color names).
 * Avoids commas and empty strings which would break CSV serialization.
 */
const colorArb: fc.Arbitrary<string> = fc.stringMatching(/^[a-z]{3,12}$/);

/**
 * Doors arbitrary: realistic door counts.
 */
const doorsArb: fc.Arbitrary<number> = fc.constantFrom(2, 3, 4, 5);

/**
 * Seats arbitrary: realistic seat counts.
 */
const seatsArb: fc.Arbitrary<number> = fc.constantFrom(2, 4, 5, 6, 7);

// ─── Non-empty unique array helper ──────────────────────────────────────────────

function nonEmptyUniqueArray<T>(arb: fc.Arbitrary<T>): fc.Arbitrary<T[]> {
  return fc.uniqueArray(arb, { minLength: 1 });
}

// ─── FilterCriteria arbitrary (only URL-param-mapped fields) ────────────────────

/**
 * Generates arbitrary valid FilterCriteria objects containing only fields
 * that are handled by the URL_PARAM_MAP (the premium filter fields).
 * Uses non-empty arrays since empty arrays are intentionally stripped during serialization.
 */
const filterCriteriaArb: fc.Arbitrary<Partial<FilterCriteria>> = fc.record(
  {
    drivetrain: nonEmptyUniqueArray(drivetrainArb),
    color: nonEmptyUniqueArray(colorArb),
    sellerType: nonEmptyUniqueArray(sellerTypeArb),
    doors: nonEmptyUniqueArray(doorsArb),
    seats: nonEmptyUniqueArray(seatsArb),
    condition: nonEmptyUniqueArray(conditionArb),
    performancePreset: performancePresetArb,
    engineDetailConfiguration: nonEmptyUniqueArray(engineDetailConfigArb),
    forcedInductionDetail: nonEmptyUniqueArray(forcedInductionDetailArb),
    heritageEra: nonEmptyUniqueArray(heritageEraArb),
    isSpecialEdition: fc.constant(true),
    accelerationMax: fc.double({ min: 1.0, max: 20.0, noNaN: true, noDefaultInfinity: true }),
    topSpeedMin: fc.double({ min: 100, max: 400, noNaN: true, noDefaultInfinity: true }),
  },
  { requiredKeys: [] },
);

// ─── Property Test ──────────────────────────────────────────────────────────────

describe('Feature: premium-filter-overhaul, Property 2: URL parameter round-trip serialization', () => {
  it('deserialize(serialize(state)) deeply equals the original state', () => {
    fc.assert(
      fc.property(filterCriteriaArb, (criteria) => {
        const serialized = serializeFilters(criteria);
        const deserialized = deserializeFilters(serialized);

        // Build expected: only include fields that survive serialization
        // (non-empty arrays, true booleans, defined numbers, non-empty strings)
        const expected: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(criteria)) {
          if (value === undefined || value === null) continue;
          if (Array.isArray(value) && value.length === 0) continue;
          if (typeof value === 'boolean' && value === false) continue;
          if (typeof value === 'string' && value.length === 0) continue;
          expected[key] = value;
        }

        expect(deserialized).toEqual(expected);
      }),
      { numRuns: 100 },
    );
  });

  /**
   * Validates: Requirements 8.1, 8.2, 8.3, 8.5, 12.1, 16.10
   */
  it('round-trips with all fields populated simultaneously', () => {
    fc.assert(
      fc.property(
        nonEmptyUniqueArray(drivetrainArb),
        nonEmptyUniqueArray(colorArb),
        nonEmptyUniqueArray(sellerTypeArb),
        nonEmptyUniqueArray(doorsArb),
        nonEmptyUniqueArray(seatsArb),
        nonEmptyUniqueArray(conditionArb),
        performancePresetArb,
        nonEmptyUniqueArray(engineDetailConfigArb),
        nonEmptyUniqueArray(forcedInductionDetailArb),
        nonEmptyUniqueArray(heritageEraArb),
        fc.double({ min: 1.0, max: 20.0, noNaN: true, noDefaultInfinity: true }),
        fc.double({ min: 100, max: 400, noNaN: true, noDefaultInfinity: true }),
        (
          drivetrain, color, sellerType, doors, seats, condition,
          performancePreset, engineDetailConfiguration, forcedInductionDetail,
          heritageEra, accelerationMax, topSpeedMin,
        ) => {
          const state: Partial<FilterCriteria> = {
            drivetrain,
            color,
            sellerType,
            doors,
            seats,
            condition,
            performancePreset,
            engineDetailConfiguration,
            forcedInductionDetail,
            heritageEra,
            isSpecialEdition: true,
            accelerationMax,
            topSpeedMin,
          };

          const serialized = serializeFilters(state);
          const deserialized = deserializeFilters(serialized);

          expect(deserialized).toEqual(state);
        },
      ),
      { numRuns: 100 },
    );
  });
});
