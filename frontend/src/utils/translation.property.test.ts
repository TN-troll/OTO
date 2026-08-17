import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { resolveTranslation } from './translation';

/**
 * Property 3: EN Locale Translation Selection
 *
 * For any description and for any non-null, non-empty, non-whitespace descriptionEn
 * string (excluding the literal string 'null' or 'undefined'), when locale is 'en',
 * resolveTranslation() SHALL return the descriptionEn value as text.
 * Conversely, when descriptionEn is null, empty, whitespace-only, or the literal
 * 'null'/'undefined', the function SHALL fall back to the original description.
 *
 * Validates: Requirements 1.2, 1.3
 */

describe('Property 3: EN Locale Translation Selection', () => {
  // Generator for a valid non-empty description (at least 1 non-whitespace char)
  const arbDescription = fc
    .string({ minLength: 1 })
    .filter((s) => s.trim().length > 0);

  // Generator for a valid descriptionEn: non-empty, non-whitespace, not literal 'null'/'undefined'
  const arbValidDescriptionEn = fc
    .string({ minLength: 1 })
    .filter(
      (s) =>
        s.trim().length > 0 &&
        s !== 'null' &&
        s !== 'undefined',
    );

  // Generator for invalid descriptionEn values that should trigger fallback
  const arbInvalidDescriptionEn = fc.oneof(
    // null
    fc.constant(null),
    // empty string
    fc.constant(''),
    // whitespace-only strings (spaces, tabs, newlines)
    fc
      .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
      .map((chars) => chars.join('')),
    // literal 'null'
    fc.constant('null'),
    // literal 'undefined'
    fc.constant('undefined'),
  );

  it('returns descriptionEn with "translated" badge when descriptionEn is valid and locale is "en"', () => {
    fc.assert(
      fc.property(arbDescription, arbValidDescriptionEn, (description, descriptionEn) => {
        const result = resolveTranslation(description, descriptionEn, 'en');

        expect(result.text).toBe(descriptionEn);
        expect(result.badge).toBe('translated');
      }),
      { numRuns: 200 },
    );
  });

  it('falls back to original description with "original-nl" badge when descriptionEn is invalid and locale is "en"', () => {
    fc.assert(
      fc.property(arbDescription, arbInvalidDescriptionEn, (description, descriptionEn) => {
        const result = resolveTranslation(description, descriptionEn, 'en');

        expect(result.text).toBe(description);
        expect(result.badge).toBe('original-nl');
      }),
      { numRuns: 200 },
    );
  });
});
