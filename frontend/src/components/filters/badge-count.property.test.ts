/**
 * Property 5: Active filter badge count accuracy
 *
 * Validates: Requirements 5.2, 5.5
 *
 * For any filter section and for any combination of active filter values within
 * that section, the Active_Filter_Badge count displayed on the section header
 * SHALL equal the number of distinct active filter values in that section.
 * When the count is zero, the badge SHALL not be rendered.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { FILTER_SECTIONS, INITIAL_FILTER_STATE, type FilterState } from '../../hooks/useFilters';
import type {
  DrivetrainType,
  ConditionType,
  EngineDetailConfiguration,
  ForcedInductionDetail,
  HeritageEra,
  PerformancePresetId,
  SellerType,
  TransmissionType,
  FuelType,
  BodyType,
} from '@car-ads/shared';

// ─── Badge Count Computation ────────────────────────────────────────────────────

/**
 * Computes the active badge count for a given section based on its fields in the FilterState.
 * This mirrors the logic used in each filter section component:
 * - Arrays: array.length (number of selected values)
 * - Optional numbers (ranges): +1 if defined (not undefined)
 * - Booleans: +1 if true
 * - Nullable (performancePreset): +1 if not null
 * - Objects (soundProfile): count of arrays with length > 0
 */
function computeBadgeCount(state: FilterState, section: string): number {
  const fields = FILTER_SECTIONS[section];
  if (!fields) return 0;

  let count = 0;
  for (const field of fields) {
    const value = state[field];

    if (Array.isArray(value)) {
      count += value.length;
    } else if (typeof value === 'boolean') {
      if (value) count += 1;
    } else if (typeof value === 'object' && value !== null) {
      // soundProfile: count arrays with length > 0
      for (const v of Object.values(value)) {
        if (Array.isArray(v) && v.length > 0) count += 1;
      }
    } else if (value !== undefined && value !== null) {
      // number or string that is defined and non-null
      count += 1;
    }
  }
  return count;
}

// ─── Arbitraries ────────────────────────────────────────────────────────────────

const arbDrivetrain = fc.subarray(['rwd', 'fwd', 'awd'] as DrivetrainType[]);
const arbCondition = fc.subarray(['new', 'used', 'classic'] as ConditionType[]);
const arbEngineConfig = fc.subarray([
  'inline-4', 'inline-6', 'v6', 'v8', 'v10', 'v12', 'flat-4', 'flat-6', 'w12', 'rotary',
] as EngineDetailConfiguration[]);
const arbForcedInduction = fc.subarray([
  'naturally_aspirated', 'turbocharged', 'supercharged', 'twin_turbo',
] as ForcedInductionDetail[]);
const arbHeritageEra = fc.subarray(['classic', 'modern_classic', 'contemporary'] as HeritageEra[]);
const arbSellerType = fc.subarray(['dealer', 'private'] as SellerType[]);
const arbTransmission = fc.subarray(['manual', 'automatic'] as TransmissionType[]);
const arbFuelType = fc.subarray(['petrol', 'diesel', 'electric', 'hybrid', 'lpg'] as FuelType[]);
const arbBodyType = fc.subarray(['sedan', 'coupe', 'cabriolet', 'hatchback', 'suv', 'wagon', 'van'] as BodyType[]);
const arbDoors = fc.subarray([2, 3, 4, 5]);
const arbSeats = fc.subarray([2, 4, 5, 6, 7]);
const arbMakes = fc.subarray(['BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Ferrari', 'Lamborghini']);
const arbModels = fc.subarray(['M3', 'C63', 'RS6', '911', 'F40', 'Huracan']);
const arbColors = fc.subarray(['black', 'white', 'red', 'blue', 'silver', 'green']);
const arbOptionalNumber = fc.option(fc.integer({ min: 1, max: 100000 }), { nil: undefined });
const arbPresetId = fc.option(
  fc.constantFrom('v8_grand_tourers', 'track_weapons', 'daily_luxury', 'classic_collectibles') as fc.Arbitrary<PerformancePresetId>,
  { nil: null },
);

/** Generates an arbitrary FilterState with random combinations of active filters */
const arbFilterState: fc.Arbitrary<FilterState> = fc.record({
  engineDisplacementMin: arbOptionalNumber,
  engineDisplacementMax: arbOptionalNumber,
  horsepowerMin: arbOptionalNumber,
  horsepowerMax: arbOptionalNumber,
  yearMin: fc.option(fc.integer({ min: 1950, max: 2025 }), { nil: undefined }),
  yearMax: fc.option(fc.integer({ min: 1950, max: 2025 }), { nil: undefined }),
  priceMin: arbOptionalNumber,
  priceMax: arbOptionalNumber,
  mileageMin: arbOptionalNumber,
  mileageMax: arbOptionalNumber,
  makes: arbMakes,
  models: arbModels,
  transmissionType: arbTransmission,
  fuelType: arbFuelType,
  bodyType: arbBodyType,
  soundProfile: fc.record({
    engineConfiguration: fc.option(fc.subarray(['inline', 'v-type', 'flat', 'rotary']), { nil: undefined }),
    cylinderCount: fc.option(fc.subarray([4, 6, 8, 10, 12]), { nil: undefined }),
    forcedInduction: fc.option(fc.subarray(['turbo', 'supercharged', 'natural']), { nil: undefined }),
    exhaustNote: fc.option(fc.subarray(['deep', 'raspy', 'high-pitched']), { nil: undefined }),
  }),
  showSold: fc.boolean(),
  drivetrain: arbDrivetrain,
  color: arbColors,
  sellerType: arbSellerType,
  doors: arbDoors,
  seats: arbSeats,
  condition: arbCondition,
  performancePreset: arbPresetId,
  engineDetailConfiguration: arbEngineConfig,
  forcedInductionDetail: arbForcedInduction,
  heritageEra: arbHeritageEra,
  isSpecialEdition: fc.boolean(),
  accelerationMax: fc.option(fc.double({ min: 2.0, max: 15.0, noNaN: true }), { nil: undefined }),
  topSpeedMin: fc.option(fc.integer({ min: 100, max: 400 }), { nil: undefined }),
});

// The sections specified in the task description that we must validate
const TARGET_SECTIONS = [
  'drivetrain',
  'color',
  'sellerType',
  'doorsSeats',
  'condition',
  'enginePerformance',
  'heritageEdition',
] as const;

// ─── Property Tests ─────────────────────────────────────────────────────────────

describe('Feature: premium-filter-overhaul, Property 5: Active filter badge count accuracy', () => {
  it('badge count equals the number of distinct active filter values per section', () => {
    fc.assert(
      fc.property(arbFilterState, (state) => {
        for (const section of TARGET_SECTIONS) {
          const fields = FILTER_SECTIONS[section];
          let expectedCount = 0;

          for (const field of fields) {
            const value = state[field];
            if (Array.isArray(value)) {
              expectedCount += value.length;
            } else if (typeof value === 'boolean') {
              if (value) expectedCount += 1;
            } else if (value !== undefined && value !== null) {
              expectedCount += 1;
            }
          }

          const computedCount = computeBadgeCount(state, section);
          expect(computedCount).toBe(expectedCount);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('badge count is zero when all fields in a section are at default values', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...TARGET_SECTIONS),
        (section) => {
          const count = computeBadgeCount(INITIAL_FILTER_STATE, section);
          expect(count).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('badge count matches component-specific computation logic for each section', () => {
    fc.assert(
      fc.property(arbFilterState, (state) => {
        // Verify drivetrain: count = array.length
        expect(computeBadgeCount(state, 'drivetrain')).toBe(state.drivetrain.length);

        // Verify color: count = array.length
        expect(computeBadgeCount(state, 'color')).toBe(state.color.length);

        // Verify sellerType: count = array.length
        expect(computeBadgeCount(state, 'sellerType')).toBe(state.sellerType.length);

        // Verify doorsSeats: count = doors.length + seats.length
        expect(computeBadgeCount(state, 'doorsSeats')).toBe(
          state.doors.length + state.seats.length,
        );

        // Verify condition: count = array.length
        expect(computeBadgeCount(state, 'condition')).toBe(state.condition.length);

        // Verify enginePerformance: arrays + defined range values
        const expectedEnginePerf =
          state.engineDetailConfiguration.length +
          state.forcedInductionDetail.length +
          (state.accelerationMax !== undefined ? 1 : 0) +
          (state.topSpeedMin !== undefined ? 1 : 0);
        expect(computeBadgeCount(state, 'enginePerformance')).toBe(expectedEnginePerf);

        // Verify heritageEdition: array + boolean
        const expectedHeritage =
          state.heritageEra.length + (state.isSpecialEdition ? 1 : 0);
        expect(computeBadgeCount(state, 'heritageEdition')).toBe(expectedHeritage);
      }),
      { numRuns: 200 },
    );
  });

  it('badge should not be rendered (count === 0) when section has no active filters', () => {
    fc.assert(
      fc.property(arbFilterState, fc.constantFrom(...TARGET_SECTIONS), (state, section) => {
        // Create a state with the target section cleared to defaults
        const clearedState = { ...state };
        const fields = FILTER_SECTIONS[section];
        for (const field of fields) {
          (clearedState as Record<string, unknown>)[field] = INITIAL_FILTER_STATE[field];
        }

        const count = computeBadgeCount(clearedState, section);
        // When count is zero, the badge SHALL not be rendered
        expect(count).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});
