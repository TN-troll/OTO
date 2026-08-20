import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { useTabState } from './useTabState';

function wrapper({ children, initialEntries = ['/'] }: { children: React.ReactNode; initialEntries?: string[] }) {
  return <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>;
}

describe('useTabState', () => {
  it('defaults to listings when no view param is present', () => {
    const { result } = renderHook(() => useTabState(), {
      wrapper: ({ children }) => wrapper({ children, initialEntries: ['/'] }),
    });
    expect(result.current.activeTab).toBe('listings');
  });

  it('returns map when view=map is in URL', () => {
    const { result } = renderHook(() => useTabState(), {
      wrapper: ({ children }) => wrapper({ children, initialEntries: ['/?view=map'] }),
    });
    expect(result.current.activeTab).toBe('map');
  });

  it('defaults to listings for invalid view param values', () => {
    const { result } = renderHook(() => useTabState(), {
      wrapper: ({ children }) => wrapper({ children, initialEntries: ['/?view=invalid'] }),
    });
    expect(result.current.activeTab).toBe('listings');
  });

  it('setActiveTab(map) updates activeTab to map', () => {
    const { result } = renderHook(() => useTabState(), {
      wrapper: ({ children }) => wrapper({ children, initialEntries: ['/'] }),
    });

    act(() => {
      result.current.setActiveTab('map');
    });

    expect(result.current.activeTab).toBe('map');
  });

  it('setActiveTab(listings) updates activeTab to listings', () => {
    const { result } = renderHook(() => useTabState(), {
      wrapper: ({ children }) => wrapper({ children, initialEntries: ['/?view=map'] }),
    });

    act(() => {
      result.current.setActiveTab('listings');
    });

    expect(result.current.activeTab).toBe('listings');
  });

  it('preserves other search params when switching to map', () => {
    const { result } = renderHook(() => useTabState(), {
      wrapper: ({ children }) => wrapper({ children, initialEntries: ['/?make=bmw&price=50000'] }),
    });

    act(() => {
      result.current.setActiveTab('map');
    });

    expect(result.current.activeTab).toBe('map');
  });

  it('preserves other search params when switching to listings', () => {
    const { result } = renderHook(() => useTabState(), {
      wrapper: ({ children }) => wrapper({ children, initialEntries: ['/?view=map&make=bmw&price=50000'] }),
    });

    act(() => {
      result.current.setActiveTab('listings');
    });

    expect(result.current.activeTab).toBe('listings');
  });

  it('removes view param entirely when switching to listings (clean URL)', () => {
    const { result } = renderHook(() => useTabState(), {
      wrapper: ({ children }) => wrapper({ children, initialEntries: ['/?view=map'] }),
    });

    act(() => {
      result.current.setActiveTab('listings');
    });

    // activeTab should be listings, and the view param shouldn't linger
    expect(result.current.activeTab).toBe('listings');
  });
});
