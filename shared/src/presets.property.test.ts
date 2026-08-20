/**
 * Property 8: Performance preset expansion and deactivation
 *
 * Validates: Requirements 14.8, 17.3, 17.4, 17.5, 17.6, 17.8, 17.10
 *
 * For any PerformancePresetId, applying the preset SHALL set the filter state to
 * exactly the filters defined in the corresponding PERFORMANCE_PRESETS constant.
 * Subsequently modifying any single filter value SHALL set performancePreset to null
 * while preserving all filter values (including the modification). Selecting a new
 * preset SHALL first clear the previous preset's filters before applying the new
 * preset's filters.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { PERFORMANCE_PRESETS } from './constants';
import type { FilterCriteria, PerformancePreset } from './types';
import type { PerformancePresetId } from './enums';

// ─── Helper Types ───────────────────────────────────────────────────────────────

/** Represents the filter state managed by FilterContext */
interface FilterState extends Partial<FilterCriteria> {
  performancePreset: PerformancePresetId | null;
}

// ─── Helper Functions (simulate preset logic) ───────────────────────────────────

/**
 * Applies a preset by its ID, setting filter state to exactly the preset's filters.
 * The performancePreset field is set to the applied preset ID.
 */
function applyPreset(presetId: PerformancePresetId): FilterState {
  const preset = PERFORMANCE_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    return { performancePreset: null };
  }
  return {
    ...preset.filters,
    performancePreset: presetId,
  };
}

/**
 * Simulates modifying a single filter field after a preset is active.
 * Any modification deactivates the preset indicator (sets performancePreset to null)
 * while preserving all current filter values plus the modification.
 */
function modifyFilter<K extends keyof FilterCriteria>(
  state: FilterState,
  field: K,
  value: FilterCriteria[K],
): FilterState {
  return {
    ...state,
    [field]: value,
    performancePreset: null,
  };
}

/**
 * Switches from the current preset to a new one. This clears the previous preset's
 * filters before applying the new preset's filters. The result is exactly the new
 * preset's filters — no leftover values from the previous preset.
 */
function switchPreset(currentState: FilterState, newPresetId: PerformancePresetId): FilterState {
  // Clear all filter values (simulates clearing previous preset)
  // Then apply the new preset
  return applyPreset(newPresetId);
}

// ─── Arbitraries ────────────────────────────────────────────────────────────────

const presetIds: PerformancePresetId[] = ['v8_grand_tourers', 'track_weapons', 'daily_luxury', 'classic_collectibles'];

const arbPresetId = fc.constantFrom(...presetIds);

/** Generates arbitrary filter modifications (field + value pairs) */
const arbFilterModification = fc.oneof(
  fc.record({ field: fc.constant('horsepowerMin' as const), value: fc.integer({ min: 100, max: 2000 }) }),
  fc.record({ field: fc.constant('horsepowerMax' as const), value: fc.integer({ min: 100, max: 2000 }) }),
  fc.record({ field: fc.constant('yearMin' as const), value: fc.integer({ min: 1950, max: 2025 }) }),
  fc.record({ field: fc.constant('yearMax' as const), value: fc.integer({ min: 1950, max: 2025 }) }),
  fc.record({ field: fc.constant('mileageMax' as const), value: fc.integer({ min: 0, max: 500000 }) }),
  fc.record({
    field: fc.constant('drivetrain' as const),
    value: fc.subarray(['rwd', 'fwd', 'awd'] as const, { minLength: 1 }),
  }),
  fc.record({
    field: fc.constant('transmissionType' as const),
    value: fc.subarray(['manual', 'automatic'] as const, { minLength: 1 }),
  }),
  fc.record({
    field: fc.constant('bodyType' as const),
    value: fc.subarray(['sedan', 'coupe', 'cabriolet', 'hatchback', 'suv'] as const, { minLength: 1 }),
  }),
  fc.record({
    field: fc.constant('doors' as const),
    value: fc.subarray([2, 3, 4, 5] as const, { minLength: 1 }),
  }),
  fc.record({ field: fc.constant('isSpecialEdition' as const), value: fc.boolean() }),
  fc.record({ field: fc.constant('accelerationMax' as const), value: fc.double({ min: 2.0, max: 15.0, noNaN: true }) }),
  fc.record({
    field: fc.constant('makes' as const),
    value: fc.subarray(['BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Ferrari'] as const, { minLength: 1 }),
  }),
);

// ─── Property Tests ─────────────────────────────────────────────────────────────

describe('Feature: premium-filter-overhaul, Property 8: Performance preset expansion and deactivation', () => {
  it('applying a preset sets filter state to exactly the preset\'s defined filters', () => {
    fc.assert(
      fc.property(arbPresetId, (presetId) => {
        const preset = PERFORMANCE_PRESETS.find((p) => p.id === presetId)!;
        const state = applyPreset(presetId);

        // The performancePreset field should be set to the preset ID
        expect(state.performancePreset).toBe(presetId);

        // All filter keys defined in the preset should be present in state
        for (const [key, value] of Object.entries(preset.filters)) {
          expect(state[key as keyof FilterState]).toEqual(value);
        }

        // State should only contain the preset's filters + performancePreset
        const stateKeys = Object.keys(state).filter((k) => k !== 'performancePreset');
        const presetFilterKeys = Object.keys(preset.filters);
        expect(stateKeys.sort()).toEqual(presetFilterKeys.sort());
      }),
      { numRuns: 100 },
    );
  });

  it('modifying any filter value after preset application sets performancePreset to null while preserving all values', () => {
    fc.assert(
      fc.property(arbPresetId, arbFilterModification, (presetId, modification) => {
        const preset = PERFORMANCE_PRESETS.find((p) => p.id === presetId)!;
        const initialState = applyPreset(presetId);

        // Modify one filter field
        const modifiedState = modifyFilter(
          initialState,
          modification.field as keyof FilterCriteria,
          modification.value as FilterCriteria[keyof FilterCriteria],
        );

        // performancePreset should be null after modification
        expect(modifiedState.performancePreset).toBeNull();

        // The modified field should have the new value
        expect(modifiedState[modification.field as keyof FilterState]).toEqual(modification.value);

        // All original preset filter values (except the modified field) should be preserved
        for (const [key, value] of Object.entries(preset.filters)) {
          if (key !== modification.field) {
            expect(modifiedState[key as keyof FilterState]).toEqual(value);
          }
        }
      }),
      { numRuns: 100 },
    );
  });

  it('selecting a new preset clears previous preset filters before applying new ones', () => {
    fc.assert(
      fc.property(arbPresetId, arbPresetId, (firstPresetId, secondPresetId) => {
        const secondPreset = PERFORMANCE_PRESETS.find((p) => p.id === secondPresetId)!;

        // Apply first preset
        const firstState = applyPreset(firstPresetId);

        // Switch to second preset
        const switchedState = switchPreset(firstState, secondPresetId);

        // The new state should match exactly the second preset
        expect(switchedState.performancePreset).toBe(secondPresetId);

        // All filter keys defined in the second preset should be present
        for (const [key, value] of Object.entries(secondPreset.filters)) {
          expect(switchedState[key as keyof FilterState]).toEqual(value);
        }

        // State should only contain the second preset's filters + performancePreset
        // (no leftover from the first preset)
        const stateKeys = Object.keys(switchedState).filter((k) => k !== 'performancePreset');
        const secondPresetKeys = Object.keys(secondPreset.filters);
        expect(stateKeys.sort()).toEqual(secondPresetKeys.sort());
      }),
      { numRuns: 100 },
    );
  });
});
