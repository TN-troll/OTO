import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { appendPage } from './infiniteScroll';

/**
 * Property 4: Infinite Scroll Append Preservation
 *
 * For any sequence of paginated responses, appending a new page to existing results
 * SHALL produce a combined list whose first N items are identical to the previous state
 * (where N is the count before appending), and the total length SHALL equal the sum of
 * previous items plus new items.
 *
 * Validates: Requirements 3.3
 */

describe('Property 4: Infinite Scroll Append Preservation', () => {
  const arbExisting = fc.array(fc.integer(), { minLength: 0, maxLength: 100 });
  const arbNewPage = fc.array(fc.integer(), { minLength: 0, maxLength: 50 });

  it('first N items of result are identical to the previous state', () => {
    fc.assert(
      fc.property(arbExisting, arbNewPage, (existing, newPage) => {
        const result = appendPage(existing, newPage);

        // The first N items must be identical to existing
        for (let i = 0; i < existing.length; i++) {
          expect(result[i]).toBe(existing[i]);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('total length equals previous count plus new page count', () => {
    fc.assert(
      fc.property(arbExisting, arbNewPage, (existing, newPage) => {
        const result = appendPage(existing, newPage);

        expect(result.length).toBe(existing.length + newPage.length);
      }),
      { numRuns: 100 },
    );
  });

  it('items from the new page appear at the end in order', () => {
    fc.assert(
      fc.property(arbExisting, arbNewPage, (existing, newPage) => {
        const result = appendPage(existing, newPage);

        // Items after position N should be the new page items in order
        for (let i = 0; i < newPage.length; i++) {
          expect(result[existing.length + i]).toBe(newPage[i]);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('appending an empty page does not change the existing list', () => {
    fc.assert(
      fc.property(arbExisting, (existing) => {
        const result = appendPage(existing, []);

        expect(result).toEqual(existing);
        expect(result.length).toBe(existing.length);
      }),
      { numRuns: 100 },
    );
  });
});
