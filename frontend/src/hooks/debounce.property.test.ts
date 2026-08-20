import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { useDebouncedValue } from './useDebouncedValue';

/**
 * Property tests for useDebouncedValue hook — debounce coalescing.
 *
 * Property 3: Debounce coalescing
 * For any sequence of N values changed within 400ms, after advancing time
 * by 400ms past the last change, the debounced value equals the last value
 * in the sequence. No intermediate values should have been emitted as the
 * debounced output.
 *
 * Validates: Requirements 3.1, 3.3, 3.4
 */

/** Arbitrary that produces a sequence of 2+ distinct numeric values simulating rapid range filter adjustments */
const arbValueSequence = fc.array(
  fc.integer({ min: 0, max: 100000 }),
  { minLength: 2, maxLength: 20 },
);

describe('useDebouncedValue property tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Property 3: Debounce coalescing
   *
   * For any sequence of Range_Filter value changes within a 400ms window,
   * the debounced value SHALL equal only the final value after the debounce
   * period completes, discarding all intermediate states.
   *
   * Validates: Requirements 3.1, 3.3, 3.4
   */
  describe('Property 3: Debounce coalescing', () => {
    it('after 400ms past the last change, debounced value equals the final value in the sequence', () => {
      fc.assert(
        fc.property(arbValueSequence, (values) => {
          const initialValue = values[0];

          const { result, rerender } = renderHook(
            ({ value }) => useDebouncedValue(value, 400),
            { initialProps: { value: initialValue } },
          );

          // Simulate rapid consecutive changes within a 400ms window
          // Each change happens before the debounce timer can fire
          for (let i = 1; i < values.length; i++) {
            // Advance less than 400ms between changes to stay within the window
            act(() => {
              vi.advanceTimersByTime(50);
            });
            rerender({ value: values[i] });
          }

          // Before the debounce completes, the debounced value should still be the initial value
          // (none of the intermediate values should have been emitted)
          expect(result.current).toBe(initialValue);

          // Now advance past the debounce delay
          act(() => {
            vi.advanceTimersByTime(400);
          });

          // After debounce completes, the final value should be emitted
          const finalValue = values[values.length - 1];
          expect(result.current).toBe(finalValue);
        }),
        { numRuns: 100 },
      );
    });

    it('intermediate values are never emitted as the debounced output during rapid changes', () => {
      fc.assert(
        fc.property(arbValueSequence, (values) => {
          const initialValue = values[0];
          const observedValues: number[] = [];

          const { result, rerender } = renderHook(
            ({ value }) => useDebouncedValue(value, 400),
            { initialProps: { value: initialValue } },
          );

          // Record the initial debounced value
          observedValues.push(result.current);

          // Simulate rapid changes, recording debounced output after each
          for (let i = 1; i < values.length; i++) {
            act(() => {
              vi.advanceTimersByTime(50);
            });
            rerender({ value: values[i] });
            observedValues.push(result.current);
          }

          // All observed values during rapid changes should still be the initial value
          // (no intermediate value should have leaked through)
          const intermediateValues = observedValues.slice(1); // skip initial
          for (const observed of intermediateValues) {
            expect(observed).toBe(initialValue);
          }

          // After debounce completes, final value is emitted
          act(() => {
            vi.advanceTimersByTime(400);
          });

          const finalValue = values[values.length - 1];
          expect(result.current).toBe(finalValue);
        }),
        { numRuns: 100 },
      );
    });
  });
});
