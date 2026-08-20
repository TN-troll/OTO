import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('hello'));
    expect(result.current).toBe('hello');
  });

  it('does not update the debounced value before the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('initial');
  });

  it('updates the debounced value after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      vi.advanceTimersByTime(400);
    });

    expect(result.current).toBe('updated');
  });

  it('only uses the final value when rapid changes occur within the delay window', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      { initialProps: { value: 0 } }
    );

    // Simulate rapid changes
    rerender({ value: 1 });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: 2 });
    act(() => { vi.advanceTimersByTime(100); });

    rerender({ value: 3 });
    act(() => { vi.advanceTimersByTime(100); });

    // Still within delay of the last change, debounced value should be initial
    expect(result.current).toBe(0);

    // Advance past the delay from the last change
    act(() => { vi.advanceTimersByTime(400); });

    // Should be the final value, not any intermediate ones
    expect(result.current).toBe(3);
  });

  it('cleans up the timer on unmount', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = renderHook(
      ({ value }) => useDebouncedValue(value, 400),
      { initialProps: { value: 'test' } }
    );

    unmount();

    // clearTimeout should have been called during cleanup
    expect(setTimeoutSpy).toHaveBeenCalled();
    setTimeoutSpy.mockRestore();
  });

  it('uses the default delay of 400ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value),
      { initialProps: { value: 'start' } }
    );

    rerender({ value: 'end' });

    // Not yet at 400ms
    act(() => { vi.advanceTimersByTime(399); });
    expect(result.current).toBe('start');

    // At exactly 400ms
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('end');
  });

  it('respects a custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 1000),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });

    act(() => { vi.advanceTimersByTime(999); });
    expect(result.current).toBe('a');

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('b');
  });
});
