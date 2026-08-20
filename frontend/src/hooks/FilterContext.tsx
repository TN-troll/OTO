import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { SortField, SortOrder, FilterOptionsResponse } from '@car-ads/shared';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from './useFilters';
import { api, SearchResult } from '../api/client';

type FilterHookReturn = ReturnType<typeof useFilters>;

interface FilterContextValue extends FilterHookReturn {
  sortBy: SortField;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
  setSortBy: (s: SortField) => void;
  setSortOrder: (s: SortOrder) => void;
  setPage: (p: number) => void;
  // Search state
  searchQuery: string;
  searchResult: SearchResult | null;
  isSearching: boolean;
  setSearchQuery: (q: string) => void;
  clearSearch: () => void;
  // Mobile filter drawer
  mobileFilterOpen: boolean;
  setMobileFilterOpen: (open: boolean) => void;
  // Filter options (dynamic data)
  filterOptions: FilterOptionsResponse | undefined;
  filterOptionsLoading: boolean;
}

const FilterContext = createContext<FilterContextValue | null>(null);

const VALID_SORT_FIELDS: SortField[] = ['price', 'horsepower', 'engineDisplacement', 'year', 'dateAdded'];
const VALID_SORT_ORDERS: SortOrder[] = ['asc', 'desc'];

function parseNumberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

function getInitialParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const initialParams = useRef(getInitialParams());

  // Initialize sorting from URL params (read once on mount)
  const [sortBy, setSortByState] = useState<SortField>(() => {
    const v = initialParams.current.get('sortBy');
    return v && VALID_SORT_FIELDS.includes(v as SortField) ? (v as SortField) : 'price';
  });
  const [sortOrder, setSortOrderState] = useState<SortOrder>(() => {
    const v = initialParams.current.get('sortOrder');
    return v && VALID_SORT_ORDERS.includes(v as SortOrder) ? (v as SortOrder) : 'desc';
  });
  const [page, setPageState] = useState(() => {
    const v = parseNumberParam(initialParams.current.get('page'));
    return v && v >= 1 ? v : 1;
  });
  const pageSize = 50;

  // Search state
  const [searchQuery, setSearchQueryState] = useState(() => initialParams.current.get('q') || '');

  // Mobile filter drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Fetch filter options for dynamic ranges and make/model dependency
  const { data: filterOptions, isLoading: filterOptionsLoading } = useQuery<FilterOptionsResponse>({
    queryKey: ['filterOptions'],
    queryFn: () => api.getFilterOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const filterHook = useFilters({
    sortBy,
    sortOrder,
    page,
    pageSize,
    modelsByMake: filterOptions?.modelsByMake,
  });

  // Search query with TanStack Query
  const isSearchValid = searchQuery.length >= 2;
  const { data: searchResult, isFetching: isSearching } = useQuery<SearchResult>({
    queryKey: ['search-context', searchQuery],
    queryFn: () => api.searchListings({ q: searchQuery, page: 1, pageSize: 50 }),
    enabled: isSearchValid,
    staleTime: 30_000,
  });

  // Reset page to 1 when filter state changes
  const prevFiltersJson = useRef(JSON.stringify(filterHook.filters));
  useEffect(() => {
    const currentJson = JSON.stringify(filterHook.filters);
    if (prevFiltersJson.current !== currentJson) {
      setPageState(1);
      prevFiltersJson.current = currentJson;
    }
  }, [filterHook.filters]);

  // Sync sorting/search/page to URL via history.replaceState
  // (Filter state URL sync is handled inside useFilters itself)
  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);

    // Update sort/page/search params
    if (page > 1) {
      currentParams.set('page', String(page));
    } else {
      currentParams.delete('page');
    }
    if (sortBy !== 'price') {
      currentParams.set('sortBy', sortBy);
    } else {
      currentParams.delete('sortBy');
    }
    if (sortOrder !== 'desc') {
      currentParams.set('sortOrder', sortOrder);
    } else {
      currentParams.delete('sortOrder');
    }
    if (searchQuery) {
      currentParams.set('q', searchQuery);
    } else {
      currentParams.delete('q');
    }

    const search = currentParams.toString();
    const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [page, sortBy, sortOrder, searchQuery]);

  const setSortBy = useCallback((s: SortField) => {
    setSortByState(s);
  }, []);

  const setSortOrder = useCallback((s: SortOrder) => {
    setSortOrderState(s);
  }, []);

  const setPage = useCallback((p: number) => {
    setPageState(p);
  }, []);

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryState(q);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQueryState('');
  }, []);

  return (
    <FilterContext.Provider
      value={{
        ...filterHook,
        sortBy,
        sortOrder,
        page,
        pageSize,
        setSortBy,
        setSortOrder,
        setPage,
        searchQuery,
        searchResult: isSearchValid ? (searchResult ?? null) : null,
        isSearching: isSearchValid && isSearching,
        setSearchQuery,
        clearSearch,
        mobileFilterOpen,
        setMobileFilterOpen,
        filterOptions,
        filterOptionsLoading,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilterContext must be used within FilterProvider');
  return ctx;
}

/** Returns null if not inside a FilterProvider — safe to use in components that may or may not be wrapped */
export function useOptionalFilterContext() {
  return useContext(FilterContext);
}
