import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  getMaintenanceTierInfo,
  MAINTENANCE_LOOKUP,
  type MaintenanceTier,
} from './maintenanceLookup';

/**
 * Property 10: Maintenance Tier Lookup Correctness
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 *
 * For any car make string, the maintenance indicator SHALL return:
 * the mapped tier (low/medium/high) with corresponding color (green/amber/red)
 * if the make exists in the lookup table, OR "unknown" tier with grey color
 * if the make is not found. The lookup SHALL be case-insensitive.
 */
describe('Property 10: Maintenance Tier Lookup Correctness', () => {
  const knownMakes = Object.keys(MAINTENANCE_LOOKUP);

  const TIER_COLOR_MAP: Record<MaintenanceTier | 'unknown', string> = {
    low: 'green',
    medium: 'amber',
    high: 'red',
    unknown: 'grey',
  };

  /**
   * Helper: randomly change the case of each character in a string.
   */
  const randomizeCase = (str: string): fc.Arbitrary<string> =>
    fc
      .array(fc.boolean(), { minLength: str.length, maxLength: str.length })
      .map((flags) =>
        str
          .split('')
          .map((ch, i) => (flags[i] ? ch.toUpperCase() : ch.toLowerCase()))
          .join('')
      );

  /**
   * Generator for a random known make with randomized casing.
   */
  const knownMakeArb: fc.Arbitrary<{ original: string; caseVariant: string }> =
    fc
      .integer({ min: 0, max: knownMakes.length - 1 })
      .chain((idx) => {
        const original = knownMakes[idx];
        return randomizeCase(original).map((caseVariant) => ({
          original,
          caseVariant,
        }));
      });

  /**
   * Generator for unknown makes: random strings that are NOT in the lookup table.
   */
  const unknownMakeArb: fc.Arbitrary<string> = fc
    .string({ minLength: 1, maxLength: 30 })
    .filter(
      (s) =>
        !knownMakes.some(
          (known) => known.toLowerCase() === s.trim().toLowerCase()
        )
    );

  it('known makes with any case variation return the correct tier and color', () => {
    /**
     * Validates: Requirements 7.1, 7.2
     */
    fc.assert(
      fc.property(knownMakeArb, ({ original, caseVariant }) => {
        const result = getMaintenanceTierInfo(caseVariant);
        const expectedTier = MAINTENANCE_LOOKUP[original];
        const expectedColor = TIER_COLOR_MAP[expectedTier];

        expect(result.tier).toBe(expectedTier);
        expect(result.color).toBe(expectedColor);
      }),
      { numRuns: 100 }
    );
  });

  it('unknown makes always return unknown tier with grey color', () => {
    /**
     * Validates: Requirements 7.3
     */
    fc.assert(
      fc.property(unknownMakeArb, (make) => {
        const result = getMaintenanceTierInfo(make);

        expect(result.tier).toBe('unknown');
        expect(result.color).toBe('grey');
      }),
      { numRuns: 100 }
    );
  });

  it('tier-color mapping is always correct: low→green, medium→amber, high→red, unknown→grey', () => {
    /**
     * Validates: Requirements 7.4
     */
    fc.assert(
      fc.property(
        fc.oneof(knownMakeArb.map((m) => m.caseVariant), unknownMakeArb),
        (make) => {
          const result = getMaintenanceTierInfo(make);

          switch (result.tier) {
            case 'low':
              expect(result.color).toBe('green');
              break;
            case 'medium':
              expect(result.color).toBe('amber');
              break;
            case 'high':
              expect(result.color).toBe('red');
              break;
            case 'unknown':
              expect(result.color).toBe('grey');
              break;
            default:
              throw new Error(`Unexpected tier: ${result.tier}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('lookup is case-insensitive: randomly capitalized known makes return same result', () => {
    /**
     * Validates: Requirements 7.1, 7.2, 7.3, 7.4
     */
    fc.assert(
      fc.property(knownMakeArb, ({ original, caseVariant }) => {
        const baseResult = getMaintenanceTierInfo(original);
        const variantResult = getMaintenanceTierInfo(caseVariant);

        expect(variantResult.tier).toBe(baseResult.tier);
        expect(variantResult.color).toBe(baseResult.color);
        expect(variantResult.label).toBe(baseResult.label);
        expect(variantResult.estimatedAnnualRange).toBe(
          baseResult.estimatedAnnualRange
        );
      }),
      { numRuns: 100 }
    );
  });
});
