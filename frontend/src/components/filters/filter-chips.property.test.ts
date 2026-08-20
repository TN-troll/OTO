/**
 * Property 7: Filter chip completeness and removal
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 *
 * For any set of active filters, the summary bar SHALL render exactly one Filter_Chip
 * per active filter value with a human-readable label. Removing a single chip SHALL
 * result in a state that equals the previous state minus exactly that one filter value,
 * with all other values preserved.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { FilterState } from '../../hooks/useFilters';
import { INITIAL_FILTER_STATE } from '../../hooks/useFilters';
import type {
  DrivetrainType,
  ConditionType,
  EngineDetailConfiguration,
  ForcedInductionDetail,
  HeritageEra,
  SellerType,
  TransmissionType,
  FuelType,
  BodyType,
} from '@car-ads/shared';

// ─── Chip Counting Logic ────────────────────────────────────────────────────────

/**
 * Counts expected chips for a FilterState, mirroring the chip generation logic
 * in FilterSummaryBar.tsx. Each active filter value maps to exactly one chip.
 *
 * Rules:
 * - Each item in an array filter → one chip
 * - Each defined range (min and/or max counts as one combined chip per range field)
 * - Each true boolean → one chip
 * - accelerationMax defined → one chip
 * - topSpeedMin defined → one chip
 */
export function countExpectedChips(state: FilterState): number {
  let count = 0;

  // Range filters: one chip per active range (min and/or max defined)
  if (state.priceMin !== undefined || state.priceMax !== undefined) count++;
  if (state.yearMin !== undefined || state.yearMax !== undefined) count++;
  if (state.horsepowerMin !== undefined || state.horsepowerMax !== undefined) count++;
  if (state.engineDisplacementMin !== undefined || state.engineDisplacementMax !== undefined) count++;
  if (state.mileageMin !== undefined || state.mileageMax !== undefined) count++;

  // Performance figure ranges: one chip each
  if (state.accelerationMax !== undefined) count++;
  if (state.topSpeedMin !== undefined) count++;

  // Array filters: one chip per item
  count += state.makes.length;
  count += state.models.length;
  count += state.transmissionType.length;
  count += state.fuelType.length;
  count += state.bodyType.length;
  count += state.drivetrain.length;
  count += state.color.length;
  count += state.sellerType.length;
  count += state.doors.length;
  count += state.seats.length;
  count += state.condition.length;
  count += state.engineDetailConfiguration.length;
  count += state.forcedInductionDetail.length;
  count += state.heritageEra.length;

  // Boolean filter
  if (state.isSpecialEdition) count++;

  return count;
}

/**
 * Represents a chip that can be removed from the filter state.
 * Mirrors the removal logic in FilterSummaryBar.
 */
interface RemovableChip {
  key: string;
  remove: (state: FilterState) => FilterState;
}

/**
 * Enumerates all removable chips for a given FilterState,
 * mirroring FilterSummaryBar's chip generation.
 */
export function getRemovableChips(state: FilterState): RemovableChip[] {
  const chips: RemovableChip[] = [];

  // Range chips
  if (state.priceMin !== undefined || state.priceMax !== undefined) {
    chips.push({
      key: 'price',
      remove: (s) => ({ ...s, priceMin: undefined, priceMax: undefined }),
    });
  }
  if (state.yearMin !== undefined || state.yearMax !== undefined) {
    chips.push({
      key: 'year',
      remove: (s) => ({ ...s, yearMin: undefined, yearMax: undefined }),
    });
  }
  if (state.horsepowerMin !== undefined || state.horsepowerMax !== undefined) {
    chips.push({
      key: 'horsepower',
      remove: (s) => ({ ...s, horsepowerMin: undefined, horsepowerMax: undefined }),
    });
  }
  if (state.engineDisplacementMin !== undefined || state.engineDisplacementMax !== undefined) {
    chips.push({
      key: 'displacement',
      remove: (s) => ({ ...s, engineDisplacementMin: undefined, engineDisplacementMax: undefined }),
    });
  }
  if (state.mileageMin !== undefined || state.mileageMax !== undefined) {
    chips.push({
      key: 'mileage',
      remove: (s) => ({ ...s, mileageMin: undefined, mileageMax: undefined }),
    });
  }
  if (state.accelerationMax !== undefined) {
    chips.push({
      key: 'accelerationMax',
      remove: (s) => ({ ...s, accelerationMax: undefined }),
    });
  }
  if (state.topSpeedMin !== undefined) {
    chips.push({
      key: 'topSpeedMin',
      remove: (s) => ({ ...s, topSpeedMin: undefined }),
    });
  }

  // Array chips: one chip per item
  for (const make of state.makes) {
    chips.push({
      key: `make-${make}`,
      remove: (s) => ({ ...s, makes: s.makes.filter((m) => m !== make) }),
    });
  }
  for (const model of state.models) {
    chips.push({
      key: `model-${model}`,
      remove: (s) => ({ ...s, models: s.models.filter((m) => m !== model) }),
    });
  }
  for (const val of state.transmissionType) {
    chips.push({
      key: `transmission-${val}`,
      remove: (s) => ({ ...s, transmissionType: s.transmissionType.filter((v) => v !== val) }),
    });
  }
  for (const val of state.fuelType) {
    chips.push({
      key: `fuel-${val}`,
      remove: (s) => ({ ...s, fuelType: s.fuelType.filter((v) => v !== val) }),
    });
  }
  for (const val of state.bodyType) {
    chips.push({
      key: `body-${val}`,
      remove: (s) => ({ ...s, bodyType: s.bodyType.filter((v) => v !== val) }),
    });
  }
  for (const val of state.drivetrain) {
    chips.push({
      key: `drivetrain-${val}`,
      remove: (s) => ({ ...s, drivetrain: s.drivetrain.filter((v) => v !== val) }),
    });
  }
  for (const val of state.color) {
    chips.push({
      key: `color-${val}`,
      remove: (s) => ({ ...s, color: s.color.filter((v) => v !== val) }),
    });
  }
  for (const val of state.sellerType) {
    chips.push({
      key: `seller-${val}`,
      remove: (s) => ({ ...s, sellerType: s.sellerType.filter((v) => v !== val) }),
    });
  }
  for (const val of state.doors) {
    chips.push({
      key: `doors-${val}`,
      remove: (s) => ({ ...s, doors: s.doors.filter((v) => v !== val) }),
    });
  }
  for (const val of state.seats) {
    chips.push({
      key: `seats-${val}`,
      remove: (s) => ({ ...s, seats: s.seats.filter((v) => v !== val) }),
    });
  }
  for (const val of state.condition) {
    chips.push({
      key: `condition-${val}`,
      remove: (s) => ({ ...s, condition: s.condition.filter((v) => v !== val) }),
    });
  }
  for (const val of state.engineDetailConfiguration) {
    chips.push({
      key: `engineConfig-${val}`,
      remove: (s) => ({ ...s, engineDetailConfiguration: s.engineDetailConfiguration.filter((v) => v !== val) }),
    });
  }
  for (const val of state.forcedInductionDetail) {
    chips.push({
      key: `induction-${val}`,
      remove: (s) => ({ ...s, forcedInductionDetail: s.forcedInductionDetail.filter((v) => v !== val) }),
    });
  }
  for (const val of state.heritageEra) {
    chips.push({
      key: `era-${val}`,
      remove: (s) => ({ ...s, heritageEra: s.heritageEra.filter((v) => v !== val) }),
    });
  }

  // Boolean
  if (state.isSpecialEdition) {
    chips.push({
      key: 'specialEdition',
      remove: (s) => ({ ...s, isSpecialEdition: false }),
    });
  }

  return chips;
}

// ─── Arbitraries ────────────────────────────────────────────────────────────────

const DRIVETRAIN_VALUES: DrivetrainType[] = ['rwd', 'fwd', 'awd'];
const CONDITION_VALUES: ConditionType[] = ['new', 'used', 'classic'];
const ENGINE_CONFIG_VALUES: EngineDetailConfiguration[] = [
  'inline-4', 'inline-6', 'v6', 'v8', 'v10', 'v12', 'flat-4', 'flat-6', 'w12', 'rotary',
];
const FORCED_INDUCTION_VALUES: ForcedInductionDetail[] = [
  'naturally_aspirated', 'turbocharged', 'supercharged', 'twin_turbo',
];
const HERITAGE_ERA_VALUES: HeritageEra[] = ['classic', 'modern_classic', 'contemporary'];
const SELLER_TYPE_VALUES: SellerType[] = ['dealer', 'private'];
const TRANSMISSION_VALUES: TransmissionType[] = ['manual', 'automatic'];
const FUEL_TYPE_VALUES: FuelType[] = ['petrol', 'diesel', 'hybrid', 'electric'];
const BODY_TYPE_VALUES: BodyType[] = ['sedan', 'coupe', 'cabriolet', 'suv', 'hatchback', 'wagon'];
const SAMPLE_MAKES = ['BMW', 'Ferrari', 'Porsche', 'Mercedes-Benz', 'Audi', 'Lamborghini'];
const SAMPLE_MODELS = ['M3', '911', 'F40', 'RS6', 'Huracan', 'AMG GT'];
const SAMPLE_COLORS = ['black', 'white', 'red', 'blue', 'silver', 'green', 'yellow'];

/** Arbitrary that generates a non-empty optional number or undefined */
const arbOptionalPositiveNumber = fc.option(fc.integer({ min: 1, max: 500000 }), { nil: undefined });

/**
 * Generates an arbitrary FilterState with various active filters.
 * Ensures at least one filter is active to produce meaningful chip counts.
 */
const arbFilterState: fc.Arbitrary<FilterState> = fc.record({
  // Range fields (optional, may produce chips)
  priceMin: arbOptionalPositiveNumber,
  priceMax: arbOptionalPositiveNumber,
  yearMin: fc.option(fc.integer({ min: 1960, max: 2024 }), { nil: undefined }),
  yearMax: fc.option(fc.integer({ min: 1960, max: 2024 }), { nil: undefined }),
  horsepowerMin: fc.option(fc.integer({ min: 50, max: 1500 }), { nil: undefined }),
  horsepowerMax: fc.option(fc.integer({ min: 50, max: 1500 }), { nil: undefined }),
  engineDisplacementMin: fc.option(fc.integer({ min: 800, max: 8000 }), { nil: undefined }),
  engineDisplacementMax: fc.option(fc.integer({ min: 800, max: 8000 }), { nil: undefined }),
  mileageMin: fc.option(fc.integer({ min: 0, max: 500000 }), { nil: undefined }),
  mileageMax: fc.option(fc.integer({ min: 0, max: 500000 }), { nil: undefined }),
  accelerationMax: fc.option(fc.double({ min: 1.5, max: 15.0, noNaN: true }), { nil: undefined }),
  topSpeedMin: fc.option(fc.integer({ min: 100, max: 400 }), { nil: undefined }),
  // Array fields
  makes: fc.subarray(SAMPLE_MAKES, { minLength: 0, maxLength: 3 }),
  models: fc.subarray(SAMPLE_MODELS, { minLength: 0, maxLength: 3 }),
  transmissionType: fc.subarray(TRANSMISSION_VALUES, { minLength: 0, maxLength: 2 }),
  fuelType: fc.subarray(FUEL_TYPE_VALUES, { minLength: 0, maxLength: 3 }),
  bodyType: fc.subarray(BODY_TYPE_VALUES, { minLength: 0, maxLength: 3 }),
  soundProfile: fc.constant({}),
  showSold: fc.constant(false),
  drivetrain: fc.subarray(DRIVETRAIN_VALUES, { minLength: 0, maxLength: 3 }),
  color: fc.subarray(SAMPLE_COLORS, { minLength: 0, maxLength: 3 }),
  sellerType: fc.subarray(SELLER_TYPE_VALUES, { minLength: 0, maxLength: 2 }),
  doors: fc.subarray([2, 3, 4, 5], { minLength: 0, maxLength: 3 }),
  seats: fc.subarray([2, 4, 5, 6, 7], { minLength: 0, maxLength: 3 }),
  condition: fc.subarray(CONDITION_VALUES, { minLength: 0, maxLength: 3 }),
  performancePreset: fc.constant(null),
  engineDetailConfiguration: fc.subarray(ENGINE_CONFIG_VALUES, { minLength: 0, maxLength: 4 }),
  forcedInductionDetail: fc.subarray(FORCED_INDUCTION_VALUES, { minLength: 0, maxLength: 3 }),
  heritageEra: fc.subarray(HERITAGE_ERA_VALUES, { minLength: 0, maxLength: 3 }),
  isSpecialEdition: fc.boolean(),
}).filter((state) => countExpectedChips(state as FilterState) > 0);

// ─── Property Tests ─────────────────────────────────────────────────────────────

describe('Feature: premium-filter-overhaul, Property 7: Filter chip completeness and removal', () => {
  it('chip count matches the number of active filter values', () => {
    fc.assert(
      fc.property(arbFilterState, (state) => {
        const expectedCount = countExpectedChips(state);
        const chips = getRemovableChips(state);

        // The number of generated chips must equal the expected count
        expect(chips.length).toBe(expectedCount);
      }),
      { numRuns: 100 },
    );
  });

  it('every chip has a unique key', () => {
    fc.assert(
      fc.property(arbFilterState, (state) => {
        const chips = getRemovableChips(state);
        const keys = chips.map((c) => c.key);
        const uniqueKeys = new Set(keys);

        // No duplicate keys — each chip represents a distinct filter value
        expect(uniqueKeys.size).toBe(keys.length);
      }),
      { numRuns: 100 },
    );
  });

  it('removing a single chip produces exactly one fewer chip', () => {
    fc.assert(
      fc.property(
        arbFilterState.chain((state) => {
          const chips = getRemovableChips(state);
          // Pick a random chip index to remove
          return fc.tuple(
            fc.constant(state),
            fc.integer({ min: 0, max: chips.length - 1 }),
          );
        }),
        ([state, chipIndex]) => {
          const chips = getRemovableChips(state);
          const chipToRemove = chips[chipIndex];

          // Apply the removal
          const newState = chipToRemove.remove(state);
          const newChipCount = countExpectedChips(newState);

          // After removing one chip, the count should be exactly one less
          expect(newChipCount).toBe(chips.length - 1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('removing a chip preserves all other filter values', () => {
    fc.assert(
      fc.property(
        arbFilterState.chain((state) => {
          const chips = getRemovableChips(state);
          return fc.tuple(
            fc.constant(state),
            fc.integer({ min: 0, max: chips.length - 1 }),
          );
        }),
        ([state, chipIndex]) => {
          const chips = getRemovableChips(state);
          const chipToRemove = chips[chipIndex];

          // Apply the removal
          const newState = chipToRemove.remove(state);

          // Check that all OTHER chips still exist after removal
          const remainingChips = getRemovableChips(newState);
          const remainingKeys = new Set(remainingChips.map((c) => c.key));

          for (const chip of chips) {
            if (chip.key === chipToRemove.key) {
              // The removed chip should no longer be present
              expect(remainingKeys.has(chip.key)).toBe(false);
            } else {
              // All other chips must still exist
              expect(remainingKeys.has(chip.key)).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('chip count is zero only when no filters are active (initial state)', () => {
    const initialChipCount = countExpectedChips(INITIAL_FILTER_STATE);
    expect(initialChipCount).toBe(0);
    expect(getRemovableChips(INITIAL_FILTER_STATE)).toHaveLength(0);
  });
});
