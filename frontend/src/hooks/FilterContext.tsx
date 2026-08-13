import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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

function getInitialParams(): URLSearchParams {
  return new URLSearchParams(window.location.search);
}

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const initialParams = useRef(getInitialParams());

  // Initialize state from URL params (read once on mount)
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

  const filterHook = useFilters({
    sortBy,
    sortOrder,
    page,
    pageSize,
    initialFiltersFromParams: {
      makes: initialParams.current.get('makes')?.split(',').filter(Boolean) || [],
      models: initialParams.current.get('models')?.split(',').filter(Boolean) || [],
      priceMin: parseNumberParam(initialParams.current.get('priceMin')),
      priceMax: parseNumberParam(initialParams.current.get('priceMax')),
      mileageMin: parseNumberParam(initialParams.current.get('mileageMin')),
      mileageMax: parseNumberParam(initialParams.current.get('mileageMax')),
      yearMin: parseNumberParam(initialParams.current.get('yearMin')),
      yearMax: parseNumberParam(initialParams.current.get('yearMax')),
      horsepowerMin: parseNumberParam(initialParams.current.get('horsepowerMin')),
      horsepowerMax: parseNumberParam(initialParams.current.get('horsepowerMax')),
      transmissionType: initialParams.current.get('transmissionType')?.split(',').filter(Boolean) || [],
      fuelType: initialParams.current.get('fuelType')?.split(',').filter(Boolean) || [],
      bodyType: initialParams.current.get('bodyType')?.split(',').filter(Boolean) || [],
      showSold: initialParams.current.get('showSold') === 'true',
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
  const prevFiltersJson = useRef(JSON.stringify(filterHook.filters));
  useEffect(() => {
    const currentJson = JSON.stringify(filterHook.filters);
    if (prevFiltersJson.current !== currentJson) {
      setPageState(1);
      prevFiltersJson.current = currentJson;
    }
  }, [filterHook.filters]);

  // Sync state to URL using history.replaceState (no React re-renders)
  useEffect(() => {
    const params = new URLSearchParams();

    if (page > 1) params.set('page', String(page));
    if (sortBy !== 'price') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (searchQuery) params.set('q', searchQuery);

    const { filters } = filterHook;
    if (filters.makes.length > 0) params.set('makes', filters.makes.join(','));
    if (filters.models.length > 0) params.set('models', filters.models.join(','));
    if (filters.priceMin !== undefined) params.set('priceMin', String(filters.priceMin));
    if (filters.priceMax !== undefined) params.set('priceMax', String(filters.priceMax));
    if (filters.mileageMin !== undefined) params.set('mileageMin', String(filters.mileageMin));
    if (filters.mileageMax !== undefined) params.set('mileageMax', String(filters.mileageMax));
    if (filters.yearMin !== undefined) params.set('yearMin', String(filters.yearMin));
    if (filters.yearMax !== undefined) params.set('yearMax', String(filters.yearMax));
    if (filters.horsepowerMin !== undefined) params.set('horsepowerMin', String(filters.horsepowerMin));
    if (filters.horsepowerMax !== undefined) params.set('horsepowerMax', String(filters.horsepowerMax));
    if (filters.transmissionType.length > 0) params.set('transmissionType', filters.transmissionType.join(','));
    if (filters.fuelType.length > 0) params.set('fuelType', filters.fuelType.join(','));
    if (filters.bodyType.length > 0) params.set('bodyType', filters.bodyType.join(','));
    if (filters.showSold) params.set('showSold', 'true');

    const search = params.toString();
    const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [page, sortBy, sortOrder, searchQuery, filterHook.filters]);

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
