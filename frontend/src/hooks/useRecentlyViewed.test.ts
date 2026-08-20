import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRecentlyViewed } from './useRecentlyViewed';

const STORAGE_KEY = 'oto-recently-viewed';

describe('useRecentlyViewed', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty array when localStorage is empty', () => {
    const { result } = renderHook(() => useRecentlyViewed());
    expect(result.current.recentIds).toEqual([]);
  });

  it('initializes with persisted data from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['a', 'b', 'c']));
    const { result } = renderHook(() => useRecentlyViewed());
    expect(result.current.recentIds).toEqual(['a', 'b', 'c']);
  });

  it('initializes with empty array when localStorage has invalid JSON', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json');
    const { result } = renderHook(() => useRecentlyViewed());
    expect(result.current.recentIds).toEqual([]);
  });

  it('prepends new ID to the array', () => {
    const { result } = renderHook(() => useRecentlyViewed());
    act(() => result.current.addViewed('listing-1'));
    expect(result.current.recentIds).toEqual(['listing-1']);
  });

  it('deduplicates: removes old occurrence and prepends new', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(['a', 'b', 'c']));
    const { result } = renderHook(() => useRecentlyViewed());

    act(() => result.current.addViewed('c'));
    expect(result.current.recentIds).toEqual(['c', 'a', 'b']);
  });

  it('caps at 10 entries, removing oldest', () => {
    const initial = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    const { result } = renderHook(() => useRecentlyViewed());

    act(() => result.current.addViewed('new'));
    expect(result.current.recentIds).toHaveLength(10);
    expect(result.current.recentIds[0]).toBe('new');
    expect(result.current.recentIds).not.toContain('10');
  });

  it('is a no-op when localStorage.setItem throws (quota exceeded)', () => {
    const { result } = renderHook(() => useRecentlyViewed());

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    // Should not throw — graceful degradation
    act(() => result.current.addViewed('listing-1'));
    // State still updates in memory even if persist fails
    expect(result.current.recentIds).toEqual(['listing-1']);

    vi.restoreAllMocks();
  });

  it('persists to localStorage on addViewed', () => {
    const { result } = renderHook(() => useRecentlyViewed());
    act(() => result.current.addViewed('x'));
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual(['x']);
  });
});
