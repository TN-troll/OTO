import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { paginateWithCursor, CursorPaginationResult } from './cursor-pagination';

/**
 * Property 5: Cursor Pagination Correctness
 *
 * For any result set and page size, paginating through all pages using cursor-based
 * pagination SHALL yield every matching listing exactly once (no duplicates, no omissions),
 * and the total items across all pages SHALL equal the reported totalCount.
 *
 * **Validates: Requirements 3.6**
 */

// ============================================================
// Helper: paginate through all pages collecting results
// ============================================================

/**
 * Iterates through all pages using cursor-based pagination,
 * collecting all items returned across every page.
 */
function paginateAll<T>(items: T[], pageSize: number): { allItems: T[]; pageCount: number; reportedTotalCount: number } {
  const allItems: T[] = [];
  let cursor: string | null | undefined = undefined;
  let pageCount = 0;
  let reportedTotalCount = 0;

  while (true) {
    const result: CursorPaginationResult<T> = paginateWithCursor(items, pageSize, cursor);
    allItems.push(...result.items);
    reportedTotalCount = result.totalCount;
    pageCount++;

    if (result.nextCursor === null) {
      break;
    }
    cursor = result.nextCursor;
  }

  return { allItems, pageCount, reportedTotalCount };
}

// ============================================================
// Arbitrary generators
// ============================================================

/** Generate a listing-like object with a unique ID for identity tracking */
const arbListing = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 30 }),
  price: fc.integer({ min: 1000, max: 500000 }),
  make: fc.constantFrom('Ferrari', 'BMW', 'Mercedes', 'Porsche', 'Toyota', 'Audi'),
});

/** Generate a non-empty array of listings (result set) */
const arbResultSet = fc.array(arbListing, { minLength: 1, maxLength: 100 });

/** Generate a valid page size (at least 1) */
const arbPageSize = fc.integer({ min: 1, max: 50 });

// ============================================================
// Tests
// ============================================================

describe('Property 5: Cursor Pagination Correctness', () => {
  it('paginating through all pages yields every item exactly once (no duplicates)', () => {
    fc.assert(
      fc.property(arbResultSet, arbPageSize, (items, pageSize) => {
        const { allItems } = paginateAll(items, pageSize);

        // Check for no duplicates by comparing with a Set of indices
        // Since items may have duplicate values, we compare by position
        expect(allItems.length).toBe(new Set(allItems.map((_, idx) => idx)).size);

        // Additionally verify no duplicate IDs from the original set appear
        const collectedIds = allItems.map((item) => item.id);
        const uniqueIds = new Set(collectedIds);
        expect(collectedIds.length).toBe(uniqueIds.size);
      }),
      { numRuns: 150 },
    );
  });

  it('paginating through all pages yields no omissions (every original item appears)', () => {
    fc.assert(
      fc.property(arbResultSet, arbPageSize, (items, pageSize) => {
        const { allItems } = paginateAll(items, pageSize);

        // Every item from the original set must appear in the collected results
        for (let i = 0; i < items.length; i++) {
          expect(allItems[i]).toEqual(items[i]);
        }

        // And the total length must match
        expect(allItems.length).toBe(items.length);
      }),
      { numRuns: 150 },
    );
  });

  it('total items across all pages equals the reported totalCount', () => {
    fc.assert(
      fc.property(arbResultSet, arbPageSize, (items, pageSize) => {
        const { allItems, reportedTotalCount } = paginateAll(items, pageSize);

        // The totalCount reported by each page should equal the original set size
        expect(reportedTotalCount).toBe(items.length);

        // And the actual collected items should equal totalCount
        expect(allItems.length).toBe(reportedTotalCount);
      }),
      { numRuns: 150 },
    );
  });

  it('items are returned in the same order as the original result set', () => {
    fc.assert(
      fc.property(arbResultSet, arbPageSize, (items, pageSize) => {
        const { allItems } = paginateAll(items, pageSize);

        // Order must be preserved across all pages
        for (let i = 0; i < items.length; i++) {
          expect(allItems[i]).toEqual(items[i]);
        }
      }),
      { numRuns: 150 },
    );
  });

  it('each page contains at most pageSize items', () => {
    fc.assert(
      fc.property(arbResultSet, arbPageSize, (items, pageSize) => {
        let cursor: string | null | undefined = undefined;

        while (true) {
          const result: CursorPaginationResult<{ id: string; title: string; price: number; make: string }> = paginateWithCursor(items, pageSize, cursor);

          // Each page must have at most pageSize items
          expect(result.items.length).toBeLessThanOrEqual(pageSize);

          // Each page must have at least 1 item (unless result set is empty, which we exclude)
          if (cursor === undefined || cursor === null) {
            // First page: should have items since arbResultSet is non-empty
            expect(result.items.length).toBeGreaterThan(0);
          }

          if (result.nextCursor === null) {
            break;
          }
          cursor = result.nextCursor;
        }
      }),
      { numRuns: 150 },
    );
  });

  it('nextCursor is null if and only if all items have been returned', () => {
    fc.assert(
      fc.property(arbResultSet, arbPageSize, (items, pageSize) => {
        let cursor: string | null | undefined = undefined;
        let totalCollected = 0;

        while (true) {
          const result: CursorPaginationResult<{ id: string; title: string; price: number; make: string }> = paginateWithCursor(items, pageSize, cursor);
          totalCollected += result.items.length;

          if (result.nextCursor === null) {
            // When nextCursor is null, we should have collected all items
            expect(totalCollected).toBe(items.length);
            break;
          } else {
            // When nextCursor is not null, we should NOT have collected all items yet
            expect(totalCollected).toBeLessThan(items.length);
          }

          cursor = result.nextCursor;
        }
      }),
      { numRuns: 150 },
    );
  });

  it('empty result set yields one page with zero items and null cursor', () => {
    const result = paginateWithCursor([], 10);

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
    expect(result.totalCount).toBe(0);
  });

  it('page size larger than result set returns all items in one page', () => {
    fc.assert(
      fc.property(arbResultSet, (items) => {
        const largePage = items.length + 10;
        const result = paginateWithCursor(items, largePage);

        expect(result.items).toEqual(items);
        expect(result.nextCursor).toBeNull();
        expect(result.totalCount).toBe(items.length);
      }),
      { numRuns: 150 },
    );
  });
});
