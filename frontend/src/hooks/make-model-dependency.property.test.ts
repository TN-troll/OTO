/**
 * Property 10: Dependent make-model consistency
 *
 * Validates: Requirements 4.2
 *
 * For any change in the selected makes set, all previously selected models that do
 * not belong to any of the newly selected makes SHALL be removed from the model
 * selection. The resulting model selection SHALL be a subset of models available for
 * the current make selection.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { clearInvalidModels } from './useFilters';

// ─── Arbitraries ────────────────────────────────────────────────────────────────

/** Known car makes for generating realistic test data */
const SAMPLE_MAKES = ['BMW', 'Ferrari', 'Porsche', 'Mercedes-Benz', 'Audi', 'Lamborghini', 'Aston Martin', 'McLaren'];

/** Known models per make for generating realistic modelsByMake maps */
const SAMPLE_MODELS: Record<string, string[]> = {
  BMW: ['M3', 'M5', 'M4', 'X5M', 'Z4'],
  Ferrari: ['488', 'F40', 'SF90', '296 GTB', 'Roma'],
  Porsche: ['911', 'Cayman', 'Boxster', 'Taycan', 'Panamera'],
  'Mercedes-Benz': ['AMG GT', 'C63', 'S-Class', 'G-Wagon', 'SL'],
  Audi: ['RS6', 'R8', 'RS3', 'e-tron GT', 'TT RS'],
  Lamborghini: ['Huracan', 'Aventador', 'Urus', 'Revuelto'],
  'Aston Martin': ['DB11', 'Vantage', 'DBS', 'Valkyrie'],
  McLaren: ['720S', '765LT', 'Artura', 'P1'],
};

/**
 * Generates an arbitrary modelsByMake map using a subset of makes with their models.
 * Each make gets a non-empty subset of its available models.
 */
const arbModelsByMake = fc
  .subarray(SAMPLE_MAKES, { minLength: 2, maxLength: SAMPLE_MAKES.length })
  .chain((makes) =>
    fc.tuple(
      ...makes.map((make) =>
        fc
          .subarray(SAMPLE_MODELS[make], { minLength: 1, maxLength: SAMPLE_MODELS[make].length })
          .map((models) => [make, models] as const),
      ),
    ),
  )
  .map((entries) => Object.fromEntries(entries) as Record<string, string[]>);

/**
 * Given a modelsByMake map and a set of makes, generates a valid model selection
 * (a subset of models that belong to those makes).
 */
function arbModelsForMakes(modelsByMake: Record<string, string[]>, makes: string[]) {
  const allValidModels = makes.flatMap((make) => modelsByMake[make] || []);
  if (allValidModels.length === 0) {
    return fc.constant([] as string[]);
  }
  return fc.subarray(allValidModels, { minLength: 1, maxLength: allValidModels.length });
}

// ─── Property Tests ─────────────────────────────────────────────────────────────

describe('Feature: premium-filter-overhaul, Property 10: Dependent make-model consistency', () => {
  it('all returned models belong to one of the newly selected makes', () => {
    fc.assert(
      fc.property(
        arbModelsByMake.chain((modelsByMake) => {
          const availableMakes = Object.keys(modelsByMake);
          return fc
            .tuple(
              // Initial makes (at least 1)
              fc.subarray(availableMakes, { minLength: 1, maxLength: availableMakes.length }),
              // New makes (at least 1, potentially different)
              fc.subarray(availableMakes, { minLength: 1, maxLength: availableMakes.length }),
            )
            .chain(([initialMakes, newMakes]) =>
              arbModelsForMakes(modelsByMake, initialMakes).map((selectedModels) => ({
                modelsByMake,
                initialMakes,
                newMakes,
                selectedModels,
              })),
            );
        }),
        ({ modelsByMake, newMakes, selectedModels }) => {
          const result = clearInvalidModels(selectedModels, newMakes, modelsByMake);

          // All returned models must belong to one of the newly selected makes
          const validModelsForNewMakes = new Set(
            newMakes.flatMap((make) => modelsByMake[make] || []),
          );
          for (const model of result) {
            expect(validModelsForNewMakes.has(model)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('no valid model is incorrectly removed (models belonging to both old and new makes survive)', () => {
    fc.assert(
      fc.property(
        arbModelsByMake.chain((modelsByMake) => {
          const availableMakes = Object.keys(modelsByMake);
          return fc
            .tuple(
              fc.subarray(availableMakes, { minLength: 1, maxLength: availableMakes.length }),
              fc.subarray(availableMakes, { minLength: 1, maxLength: availableMakes.length }),
            )
            .chain(([initialMakes, newMakes]) =>
              arbModelsForMakes(modelsByMake, initialMakes).map((selectedModels) => ({
                modelsByMake,
                initialMakes,
                newMakes,
                selectedModels,
              })),
            );
        }),
        ({ modelsByMake, newMakes, selectedModels }) => {
          const result = clearInvalidModels(selectedModels, newMakes, modelsByMake);

          // Models that belong to both old selection and new makes should survive
          const validModelsForNewMakes = new Set(
            newMakes.flatMap((make) => modelsByMake[make] || []),
          );
          const expectedSurvivors = selectedModels.filter((model) =>
            validModelsForNewMakes.has(model),
          );

          // Every model that should survive must be in the result
          for (const model of expectedSurvivors) {
            expect(result).toContain(model);
          }

          // The result should contain exactly the expected survivors (no extras, no missing)
          expect(result.sort()).toEqual(expectedSurvivors.sort());
        },
      ),
      { numRuns: 100 },
    );
  });

  it('result is always a subset of the originally selected models', () => {
    fc.assert(
      fc.property(
        arbModelsByMake.chain((modelsByMake) => {
          const availableMakes = Object.keys(modelsByMake);
          return fc
            .tuple(
              fc.subarray(availableMakes, { minLength: 1, maxLength: availableMakes.length }),
              fc.subarray(availableMakes, { minLength: 1, maxLength: availableMakes.length }),
            )
            .chain(([initialMakes, newMakes]) =>
              arbModelsForMakes(modelsByMake, initialMakes).map((selectedModels) => ({
                modelsByMake,
                newMakes,
                selectedModels,
              })),
            );
        }),
        ({ modelsByMake, newMakes, selectedModels }) => {
          const result = clearInvalidModels(selectedModels, newMakes, modelsByMake);

          // Result must be a subset of the originally selected models
          for (const model of result) {
            expect(selectedModels).toContain(model);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when modelsByMake is undefined, returns empty array for non-empty makes', () => {
    fc.assert(
      fc.property(
        fc.subarray(SAMPLE_MAKES, { minLength: 1, maxLength: SAMPLE_MAKES.length }),
        fc.array(fc.constantFrom('M3', '911', 'F40', 'RS6'), { minLength: 1, maxLength: 5 }),
        (newMakes, selectedModels) => {
          const result = clearInvalidModels(selectedModels, newMakes, undefined);
          expect(result).toEqual([]);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when newMakes is empty, all models are preserved regardless of modelsByMake', () => {
    fc.assert(
      fc.property(
        arbModelsByMake,
        fc.array(fc.constantFrom('M3', '911', 'F40', 'RS6', 'Huracan'), { minLength: 1, maxLength: 5 }),
        (modelsByMake, selectedModels) => {
          const result = clearInvalidModels(selectedModels, [], modelsByMake);
          expect(result).toEqual(selectedModels);
        },
      ),
      { numRuns: 100 },
    );
  });
});
