import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { useRecentlyViewed } from './useRecentlyViewed';

/**
 * Property tests for useRecentlyViewed hook.
 *
 * Validates: Requirements 5.1, 5.2, 5.3
 */

/** Arbitrary that produces a non-empty sequence of IDs to add */
const arbIdSequence = fc.array(
  fc.string({ minLength: 1, maxLength: 10 }),
  { minLength: 1, maxLength: 30 },
);

describe('useRecentlyViewed property tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  /**
   * Property 4: Storage invariants
   *
   * For any sequence of addViewed calls:
   * (a) length ≤ 10
   * (b) no duplicates
   * (c) most recently added at index 0
   *
   * Validates: Requirements 5.1, 5.2, 5.3
   */
  describe('Property 4: Storage invariants', () => {
    it('(a) recentIds length is always ≤ 10 after any sequence of addViewed calls', () => {
      fc.assert(
        fc.property(arbIdSequence, (ids) => {
          localStorage.clear();

          const { result } = renderHook(() => useRecentlyViewed());

          for (const id of ids) {
            act(() => {
              result.current.addViewed(id);
            });
          }

          expect(result.current.recentIds.length).toBeLessThanOrEqual(10);
        }),
        { numRuns: 100 },
      );
    });

    it('(b) recentIds contains no duplicate IDs after any sequence of addViewed calls', () => {
      fc.assert(
        fc.property(arbIdSequence, (ids) => {
          localStorage.clear();

          const { result } = renderHook(() => useRecentlyViewed());

          for (const id of ids) {
            act(() => {
              result.current.addViewed(id);
            });
          }

          const uniqueIds = new Set(result.current.recentIds);
          expect(uniqueIds.size).toBe(result.current.recentIds.length);
        }),
        { numRuns: 100 },
      );
    });

    it('(c) the most recently added ID is always at index 0', () => {
      fc.assert(
        fc.property(arbIdSequence, (ids) => {
          localStorage.clear();

          const { result } = renderHook(() => useRecentlyViewed());

          for (const id of ids) {
            act(() => {
              result.current.addViewed(id);
            });
          }

          const lastAdded = ids[ids.length - 1];
          expect(result.current.recentIds[0]).toBe(lastAdded);
        }),
        { numRuns: 100 },
      );
    });
  });
});
