import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { clearSection, FILTER_SECTIONS, INITIAL_FILTER_STATE, type FilterState } from './useFilters';

/**
 * Property 6: Section clear isolation
 *
 * For any filter state with active filters across multiple sections,
 * clearing a single section SHALL reset only that section's filters to
 * their default values while leaving all other sections' filter values unchanged.
 *
 * **Validates: Requirements 6.2**
 */

/** All section keys from FILTER_SECTIONS */
const sectionKeys = Object.keys(FILTER_SECTIONS);

/** Arbitrary that picks a random section key */
const arbSection = fc.constantFrom(...sectionKeys);

/**
 * Arbitrary generator for a FilterState with random active filters across sections.
 * Generates realistic values for each field type.
 */
const arbFilterState: fc.Arbitrary<FilterState> = fc.record({
  engineDisplacementMin: fc.option(fc.integer({ min: 1000, max: 5000 }), { nil: undefined }),
  engineDisplacementMax: fc.option(fc.integer({ min: 5001, max: 10000 }), { nil: undefined }),
  horsepowerMin: fc.option(fc.integer({ min: 100, max: 500 }), { nil: undefined }),
  horsepowerMax: fc.option(fc.integer({ min: 501, max: 1500 }), { nil: undefined }),
  yearMin: fc.option(fc.integer({ min: 1960, max: 2000 }), { nil: undefined }),
  yearMax: fc.option(fc.integer({ min: 2001, max: 2025 }), { nil: undefined }),
  priceMin: fc.option(fc.integer({ min: 1000, max: 50000 }), { nil: undefined }),
  priceMax: fc.option(fc.integer({ min: 50001, max: 500000 }), { nil: undefined }),
  mileageMin: fc.option(fc.integer({ min: 0, max: 50000 }), { nil: undefined }),
  mileageMax: fc.option(fc.integer({ min: 50001, max: 300000 }), { nil: undefined }),
  makes: fc.array(fc.constantFrom('BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Ferrari'), { minLength: 0, maxLength: 3 }),
  models: fc.array(fc.constantFrom('M3', 'M5', 'RS6', '911', 'F40'), { minLength: 0, maxLength: 3 }),
  transmissionType: fc.array(fc.constantFrom('manual', 'automatic'), { minLength: 0, maxLength: 2 }),
  fuelType: fc.array(fc.constantFrom('petrol', 'diesel', 'electric', 'hybrid'), { minLength: 0, maxLength: 3 }),
  bodyType: fc.array(fc.constantFrom('sedan', 'coupe', 'cabriolet', 'suv', 'hatchback'), { minLength: 0, maxLength: 3 }),
  soundProfile: fc.oneof(
    fc.constant({}),
    fc.record({
      cylinderCount: fc.array(fc.constantFrom(4, 6, 8, 10, 12), { minLength: 1, maxLength: 3 }),
    }),
  ),
  showSold: fc.boolean(),
  drivetrain: fc.array(fc.constantFrom('rwd', 'fwd', 'awd'), { minLength: 0, maxLength: 3 }),
  color: fc.array(fc.constantFrom('black', 'white', 'red', 'blue', 'silver'), { minLength: 0, maxLength: 3 }),
  sellerType: fc.array(fc.constantFrom('dealer', 'private'), { minLength: 0, maxLength: 2 }),
  doors: fc.array(fc.constantFrom(2, 3, 4, 5), { minLength: 0, maxLength: 3 }),
  seats: fc.array(fc.constantFrom(2, 4, 5, 6, 7), { minLength: 0, maxLength: 3 }),
  condition: fc.array(fc.constantFrom('new', 'used', 'classic'), { minLength: 0, maxLength: 3 }),
  performancePreset: fc.constantFrom(null, 'v8_grand_tourers', 'track_weapons', 'daily_luxury', 'classic_collectibles'),
  engineDetailConfiguration: fc.array(
    fc.constantFrom('inline-4', 'inline-6', 'v6', 'v8', 'v10', 'v12', 'flat-4', 'flat-6', 'w12', 'rotary'),
    { minLength: 0, maxLength: 4 },
  ),
  forcedInductionDetail: fc.array(
    fc.constantFrom('naturally_aspirated', 'turbocharged', 'supercharged', 'twin_turbo'),
    { minLength: 0, maxLength: 3 },
  ),
  heritageEra: fc.array(fc.constantFrom('classic', 'modern_classic', 'contemporary'), { minLength: 0, maxLength: 3 }),
  isSpecialEdition: fc.boolean(),
  accelerationMax: fc.option(fc.double({ min: 2.0, max: 15.0, noNaN: true }), { nil: undefined }),
  topSpeedMin: fc.option(fc.integer({ min: 100, max: 400 }), { nil: undefined }),
}) as fc.Arbitrary<FilterState>;

describe('Property 6: Section clear isolation', () => {
  it('clearing a section resets only that section fields to INITIAL_FILTER_STATE defaults', () => {
    fc.assert(
      fc.property(arbFilterState, arbSection, (state, section) => {
        const result = clearSection(state, section);
        const sectionFields = FILTER_SECTIONS[section];

        // All fields in the cleared section must equal their INITIAL_FILTER_STATE default
        for (const field of sectionFields) {
          expect(result[field]).toEqual(INITIAL_FILTER_STATE[field]);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('clearing a section leaves all OTHER section fields unchanged', () => {
    fc.assert(
      fc.property(arbFilterState, arbSection, (state, section) => {
        const result = clearSection(state, section);
        const sectionFields = new Set(FILTER_SECTIONS[section]);

        // All fields NOT in the cleared section must remain identical to the original state
        // Exception: performancePreset may be set to null if the cleared section isn't 'presets'
        for (const [otherSection, fields] of Object.entries(FILTER_SECTIONS)) {
          if (otherSection === section) continue;

          for (const field of fields) {
            if (sectionFields.has(field)) continue;
            // performancePreset is a special case: clearing any non-presets section
            // deactivates the preset
            if (field === 'performancePreset' && section !== 'presets') continue;

            expect(result[field]).toEqual(state[field]);
          }
        }
      }),
      { numRuns: 200 },
    );
  });

  it('clearing a non-presets section deactivates performancePreset when it was active', () => {
    const arbNonPresetSection = fc.constantFrom(...sectionKeys.filter((k) => k !== 'presets'));

    fc.assert(
      fc.property(arbFilterState, arbNonPresetSection, (state, section) => {
        // Ensure preset is active for this test
        const stateWithPreset: FilterState = { ...state, performancePreset: 'v8_grand_tourers' };
        const result = clearSection(stateWithPreset, section);

        // Clearing any non-presets section should deactivate the preset
        expect(result.performancePreset).toBeNull();
      }),
      { numRuns: 100 },
    );
  });

  it('clearing the presets section itself resets performancePreset to null', () => {
    fc.assert(
      fc.property(arbFilterState, (state) => {
        const stateWithPreset: FilterState = { ...state, performancePreset: 'track_weapons' };
        const result = clearSection(stateWithPreset, 'presets');

        expect(result.performancePreset).toEqual(INITIAL_FILTER_STATE.performancePreset);
      }),
      { numRuns: 100 },
    );
  });
});
