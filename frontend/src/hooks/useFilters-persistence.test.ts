/**
 * Tests for task 11.3: Reset All and state persistence
 *
 * Covers:
 * - Reset All clears all filters and URL params
 * - URL params serve as primary persistence (restore on page return)
 * - Invalid URL params are handled gracefully (discard invalid, keep valid)
 *
 * Requirements: 6.3, 8.4, 12.1, 12.2, 12.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useFilters, INITIAL_FILTER_STATE } from './useFilters';

// Mock the API client
vi.mock('../api/client', () => ({
  api: {
    filterListings: vi.fn().mockResolvedValue({ listings: [], total: 0 }),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function setUrlParams(search: string) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search, pathname: '/' },
    writable: true,
  });
}

describe('useFilters - Reset All and State Persistence', () => {
  let replaceStateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset URL to clean state
    setUrlParams('');
    replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
  });

  describe('Reset All (Requirement 6.3, 8.4)', () => {
    it('should reset all filters to INITIAL_FILTER_STATE', () => {
      setUrlParams('?drivetrain=rwd,awd&priceMin=50000&preset=track_weapons');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      // Verify filters were loaded from URL
      expect(result.current.filters.drivetrain).toEqual(['rwd', 'awd']);
      expect(result.current.filters.priceMin).toBe(50000);

      // Reset all
      act(() => {
        result.current.resetFilters();
      });

      // All filters should be at initial state
      expect(result.current.filters).toEqual(INITIAL_FILTER_STATE);
      expect(result.current.filtersActive).toBe(false);
    });

    it('should clear URL params after reset', () => {
      setUrlParams('?drivetrain=rwd&color=black,white');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      act(() => {
        result.current.resetFilters();
      });

      // The URL sync effect should have called replaceState with empty/clean URL
      const lastCall = replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1];
      expect(lastCall).toBeDefined();
      // Should be just the pathname without query params
      expect(lastCall[2]).toBe('/');
    });
  });

  describe('URL Persistence (Requirement 12.1, 12.2)', () => {
    it('should restore filter state from URL params on mount', () => {
      setUrlParams('?drivetrain=awd&condition=used,classic&accelMax=4.5&topSpeedMin=300&specialEdition=true');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.drivetrain).toEqual(['awd']);
      expect(result.current.filters.condition).toEqual(['used', 'classic']);
      expect(result.current.filters.accelerationMax).toBe(4.5);
      expect(result.current.filters.topSpeedMin).toBe(300);
      expect(result.current.filters.isSpecialEdition).toBe(true);
    });

    it('should restore preset from URL params', () => {
      setUrlParams('?preset=daily_luxury');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.performancePreset).toBe('daily_luxury');
    });

    it('should sync state changes to URL', () => {
      setUrlParams('');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      act(() => {
        result.current.updateDrivetrain(['rwd', 'awd']);
      });

      // URL should have been updated
      const lastCall = replaceStateSpy.mock.calls[replaceStateSpy.mock.calls.length - 1];
      expect(lastCall).toBeDefined();
      const url = lastCall[2] as string;
      expect(url).toContain('drivetrain=rwd%2Cawd');
    });
  });

  describe('Invalid URL Params (Requirement 12.3)', () => {
    it('should discard invalid drivetrain values and keep valid ones', () => {
      setUrlParams('?drivetrain=rwd,invalid_value,awd');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      // 'invalid_value' should be discarded, valid values kept
      expect(result.current.filters.drivetrain).toEqual(['rwd', 'awd']);
    });

    it('should discard invalid condition values', () => {
      setUrlParams('?condition=new,broken,classic');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.condition).toEqual(['new', 'classic']);
    });

    it('should discard invalid seller type values', () => {
      setUrlParams('?sellerType=dealer,unknown');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.sellerType).toEqual(['dealer']);
    });

    it('should discard invalid performance preset', () => {
      setUrlParams('?preset=non_existent_preset');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.performancePreset).toBeNull();
    });

    it('should discard invalid engine detail configuration values', () => {
      setUrlParams('?engineConfig=v8,v99,inline-6');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.engineDetailConfiguration).toEqual(['v8', 'inline-6']);
    });

    it('should discard invalid forced induction values', () => {
      setUrlParams('?induction=turbocharged,electric_boost');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.forcedInductionDetail).toEqual(['turbocharged']);
    });

    it('should discard invalid heritage era values', () => {
      setUrlParams('?era=classic,futuristic,modern_classic');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.heritageEra).toEqual(['classic', 'modern_classic']);
    });

    it('should discard non-positive acceleration values', () => {
      setUrlParams('?accelMax=-1');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.accelerationMax).toBeUndefined();
    });

    it('should discard non-positive top speed values', () => {
      setUrlParams('?topSpeedMin=0');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.topSpeedMin).toBeUndefined();
    });

    it('should discard NaN legacy number params', () => {
      setUrlParams('?priceMin=abc&priceMax=200000');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      expect(result.current.filters.priceMin).toBeUndefined();
      expect(result.current.filters.priceMax).toBe(200000);
    });

    it('should not crash on completely malformed URL params', () => {
      setUrlParams('?drivetrain=&condition=&accelMax=&preset=');

      const { result } = renderHook(() => useFilters(), { wrapper: createWrapper() });

      // Should fall back to defaults without crashing
      expect(result.current.filters.drivetrain).toEqual([]);
      expect(result.current.filters.condition).toEqual([]);
      expect(result.current.filters.accelerationMax).toBeUndefined();
      expect(result.current.filters.performancePreset).toBeNull();
    });
  });
});
