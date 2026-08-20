import { renderHook, act } from '@testing-library/react';
import { MemoryRouter, useSearchParams } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import React from 'react';
import { useTabState, type ActiveTab } from './useTabState';

/**
 * Property tests for useTabState hook.
 *
 * Validates: Requirements 2.1, 2.2, 2.4, 2.6
 */

/** Arbitrary that produces a valid ActiveTab value */
const arbTab = fc.constantFrom<ActiveTab>('listings', 'map');

/** Arbitrary that produces a non-empty sequence of tab switches */
const arbTabSequence = fc.array(arbTab, { minLength: 1, maxLength: 20 });

/**
 * Arbitrary that produces a set of URL search param key-value pairs.
 * Keys are restricted to realistic URL param names (lowercase alpha strings),
 * excluding 'view' which is the param managed by useTabState.
 */
const arbSearchParams = fc.array(
  fc.tuple(
    fc.stringMatching(/^[a-z]{1,10}$/).filter((k) => k !== 'view'),
    fc.stringMatching(/^[a-zA-Z0-9]{1,15}$/),
  ),
  { minLength: 0, maxLength: 5 },
);

/** Helper wrapper that provides MemoryRouter context */
function createWrapper(initialEntries: string[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(MemoryRouter, { initialEntries }, children);
  };
}

/** Hook that exposes both useTabState and raw searchParams for assertions */
function useTabStateWithParams() {
  const tabState = useTabState();
  const [searchParams] = useSearchParams();
  return { ...tabState, searchParams };
}

describe('useTabState property tests', () => {
  /**
   * Property 1: Tab state ↔ URL round-trip
   *
   * For any sequence of tab switches, URL param always matches the last set tab.
   * - If last tab is 'map', the view param should be 'map'
   * - If last tab is 'listings', the view param should be absent
   *
   * Validates: Requirements 2.1, 2.2, 2.4
   */
  describe('Property 1: Tab state ↔ URL round-trip', () => {
    it('for any sequence of tab switches, activeTab matches the last set tab', () => {
      fc.assert(
        fc.property(arbTabSequence, (tabs) => {
          const { result } = renderHook(() => useTabStateWithParams(), {
            wrapper: createWrapper(['/']),
          });

          // Apply each tab switch in sequence
          for (const tab of tabs) {
            act(() => {
              result.current.setActiveTab(tab);
            });
          }

          const lastTab = tabs[tabs.length - 1];
          expect(result.current.activeTab).toBe(lastTab);
        }),
        { numRuns: 100 },
      );
    });

    it('for any sequence of tab switches, URL view param reflects the last set tab', () => {
      fc.assert(
        fc.property(arbTabSequence, (tabs) => {
          const { result } = renderHook(() => useTabStateWithParams(), {
            wrapper: createWrapper(['/']),
          });

          for (const tab of tabs) {
            act(() => {
              result.current.setActiveTab(tab);
            });
          }

          const lastTab = tabs[tabs.length - 1];
          if (lastTab === 'map') {
            expect(result.current.searchParams.get('view')).toBe('map');
          } else {
            expect(result.current.searchParams.has('view')).toBe(false);
          }
        }),
        { numRuns: 100 },
      );
    });

    it('for any initial URL view value, activeTab defaults correctly', () => {
      const arbViewParam = fc.oneof(
        fc.constant('map'),
        fc.constant('listings'),
        fc.stringMatching(/^[a-z]{1,8}$/),
        fc.constant(''),
      );

      fc.assert(
        fc.property(arbViewParam, (viewValue) => {
          const url = viewValue ? `/?view=${viewValue}` : '/';
          const { result } = renderHook(() => useTabStateWithParams(), {
            wrapper: createWrapper([url]),
          });

          if (viewValue === 'map') {
            expect(result.current.activeTab).toBe('map');
          } else {
            expect(result.current.activeTab).toBe('listings');
          }
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Property 2: URL parameter preservation
   *
   * For any set of existing search params, switching tabs preserves all non-view params.
   * The non-view parameters before and after a tab switch are identical.
   *
   * Validates: Requirement 2.6
   */
  describe('Property 2: URL parameter preservation', () => {
    it('switching tabs preserves all non-view search params', () => {
      fc.assert(
        fc.property(arbSearchParams, arbTab, (params, targetTab) => {
          // Build initial URL with arbitrary params
          const initial = new URLSearchParams();
          for (const [key, value] of params) {
            initial.set(key, value);
          }
          const initialUrl = `/?${initial.toString()}`;

          const { result } = renderHook(() => useTabStateWithParams(), {
            wrapper: createWrapper([initialUrl]),
          });

          // Capture non-view params before the switch
          const paramsBefore = new URLSearchParams(result.current.searchParams);
          paramsBefore.delete('view');

          // Switch tab
          act(() => {
            result.current.setActiveTab(targetTab);
          });

          // Capture non-view params after the switch
          const paramsAfter = new URLSearchParams(result.current.searchParams);
          paramsAfter.delete('view');

          // All non-view params must be preserved
          expect(paramsAfter.toString()).toBe(paramsBefore.toString());
        }),
        { numRuns: 100 },
      );
    });

    it('multiple tab switches preserve all non-view search params', () => {
      fc.assert(
        fc.property(arbSearchParams, arbTabSequence, (params, tabs) => {
          // Build initial URL with arbitrary params
          const initial = new URLSearchParams();
          for (const [key, value] of params) {
            initial.set(key, value);
          }
          const initialUrl = `/?${initial.toString()}`;

          const { result } = renderHook(() => useTabStateWithParams(), {
            wrapper: createWrapper([initialUrl]),
          });

          // Capture non-view params at the start
          const paramsBefore = new URLSearchParams(result.current.searchParams);
          paramsBefore.delete('view');

          // Apply all tab switches
          for (const tab of tabs) {
            act(() => {
              result.current.setActiveTab(tab);
            });
          }

          // Capture non-view params after all switches
          const paramsAfter = new URLSearchParams(result.current.searchParams);
          paramsAfter.delete('view');

          // All non-view params must still be preserved
          expect(paramsAfter.toString()).toBe(paramsBefore.toString());
        }),
        { numRuns: 100 },
      );
    });
  });
});
