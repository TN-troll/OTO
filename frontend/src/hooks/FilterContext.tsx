import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SortField, SortOrder } from '@car-ads/shared';
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
}

const FilterContext = createContext<FilterContextValue | null>(null);

const VALID_SORT_FIELDS: SortField[] = ['price', 'horsepower', 'engineDisplacement', 'year', 'dateAdded'];
const VALID_SORT_ORDERS: SortOrder[] = ['asc', 'desc'];

function parseNumberParam(value: string | null): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params
  const [sortBy, setSortByState] = useState<SortField>(() => {
    const v = searchParams.get('sortBy');
    return v && VALID_SORT_FIELDS.includes(v as SortField) ? (v as SortField) : 'dateAdded';
  });
  const [sortOrder, setSortOrderState] = useState<SortOrder>(() => {
    const v = searchParams.get('sortOrder');
    return v && VALID_SORT_ORDERS.includes(v as SortOrder) ? (v as SortOrder) : 'desc';
  });
  const [page, setPageState] = useState(() => {
    const v = parseNumberParam(searchParams.get('page'));
    return v && v >= 1 ? v : 1;
  });
  const pageSize = 50;

  // Search state
  const [searchQuery, setSearchQueryState] = useState(() => searchParams.get('q') || '');

  // Mobile filter drawer state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const filterHook = useFilters({
    sortBy,
    sortOrder,
    page,
    pageSize,
    initialFiltersFromParams: {
      makes: searchParams.get('makes')?.split(',').filter(Boolean) || [],
      models: searchParams.get('models')?.split(',').filter(Boolean) || [],
      priceMin: parseNumberParam(searchParams.get('priceMin')),
      priceMax: parseNumberParam(searchParams.get('priceMax')),
      yearMin: parseNumberParam(searchParams.get('yearMin')),
      yearMax: parseNumberParam(searchParams.get('yearMax')),
      horsepowerMin: parseNumberParam(searchParams.get('horsepowerMin')),
      horsepowerMax: parseNumberParam(searchParams.get('horsepowerMax')),
      transmissionType: searchParams.get('transmissionType')?.split(',').filter(Boolean) || [],
      fuelType: searchParams.get('fuelType')?.split(',').filter(Boolean) || [],
    },
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
  const prevFilters = useRef(filterHook.filters);
  useEffect(() => {
    if (prevFilters.current !== filterHook.filters) {
      setPageState(1);
      prevFilters.current = filterHook.filters;
    }
  }, [filterHook.filters]);

  // Sync state to URL params (using replaceState via setSearchParams with replace option)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const params = new URLSearchParams();

    if (page > 1) params.set('page', String(page));
    if (sortBy !== 'dateAdded') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (searchQuery) params.set('q', searchQuery);

    const { filters } = filterHook;
    if (filters.makes.length > 0) params.set('makes', filters.makes.join(','));
    if (filters.models.length > 0) params.set('models', filters.models.join(','));
    if (filters.priceMin !== undefined) params.set('priceMin', String(filters.priceMin));
    if (filters.priceMax !== undefined) params.set('priceMax', String(filters.priceMax));
    if (filters.yearMin !== undefined) params.set('yearMin', String(filters.yearMin));
    if (filters.yearMax !== undefined) params.set('yearMax', String(filters.yearMax));
    if (filters.horsepowerMin !== undefined) params.set('horsepowerMin', String(filters.horsepowerMin));
    if (filters.horsepowerMax !== undefined) params.set('horsepowerMax', String(filters.horsepowerMax));
    if (filters.transmissionType.length > 0) params.set('transmissionType', filters.transmissionType.join(','));
    if (filters.fuelType.length > 0) params.set('fuelType', filters.fuelType.join(','));

    setSearchParams(params, { replace: true });
  }, [page, sortBy, sortOrder, searchQuery, filterHook.filters, setSearchParams]);

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
