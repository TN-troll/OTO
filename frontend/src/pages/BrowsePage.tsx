import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SortField, SortOrder } from '@car-ads/shared';
import { api } from '../api/client';
import { ListingGrid } from '../components/ListingGrid';
import { Pagination } from '../components/Pagination';
import { SortControls } from '../components/SortControls';
import { ViewToggle } from '../components/ViewToggle';
import { useFilterContext } from '../hooks/FilterContext';
import { useLanguage } from '../i18n';

const DEFAULT_PAGE_SIZE = 50;

/** Skeleton card placeholder for loading state */
function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white shadow-card dark:bg-surface-800">
      <div className="aspect-[3/2] bg-surface-200 dark:bg-surface-700" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-surface-200 dark:bg-surface-700" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-md bg-surface-100 dark:bg-surface-700" />
          <div className="h-6 w-12 rounded-md bg-surface-100 dark:bg-surface-700" />
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function BrowsePage() {
  const { t } = useLanguage();
  const {
    filtersActive,
    filterResult,
    isLoading: filterLoading,
    isFetching: filterFetching,
    queryError: filterError,
    sortBy,
    sortOrder,
    page,
    setSortBy,
    setSortOrder,
    setPage,
    searchQuery,
    searchResult,
    isSearching,
    clearSearch,
    setMobileFilterOpen,
  } = useFilterContext();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showLoading, setShowLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Determine if search is active
  const isSearchActive = searchQuery.length >= 2 && searchResult !== null;

  // Unfiltered listings query — only enabled when NO filters and NO search are active
  const unfilteredQueryKey = ['listings', { page, pageSize: DEFAULT_PAGE_SIZE, sortBy, sortOrder }];
  const {
    data: unfilteredData,
    isLoading: unfilteredLoading,
    isFetching: unfilteredFetching,
    error: unfilteredError,
    refetch: unfilteredRefetch,
  } = useQuery({
    queryKey: unfilteredQueryKey,
    queryFn: () => api.getListings({ page, pageSize: DEFAULT_PAGE_SIZE, sortBy, sortOrder }),
    enabled: !filtersActive && !isSearchActive,
  });

  // Determine which data source to use: search > filter > unfiltered
  const data = isSearchActive ? searchResult : filtersActive ? filterResult : unfilteredData;
  const isLoading = isSearchActive ? isSearching : filtersActive ? filterLoading : unfilteredLoading;
  const isFetching = isSearchActive ? isSearching : filtersActive ? filterFetching : unfilteredFetching;
  const error = isSearchActive ? null : filtersActive ? filterError : unfilteredError;
  const refetch = filtersActive || isSearchActive ? undefined : unfilteredRefetch;

  useEffect(() => {
    if (isFetching) {
      loadingTimerRef.current = setTimeout(() => setShowLoading(true), 300);
    } else {
      setShowLoading(false);
      if (loadingTimerRef.current) { clearTimeout(loadingTimerRef.current); loadingTimerRef.current = null; }
    }
    return () => { if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current); };
  }, [isFetching]);

  useEffect(() => {
    if (isFetching) {
      setTimedOut(false);
      timeoutTimerRef.current = setTimeout(() => setTimedOut(true), 5000);
    } else {
      setTimedOut(false);
      if (timeoutTimerRef.current) { clearTimeout(timeoutTimerRef.current); timeoutTimerRef.current = null; }
    }
    return () => { if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current); };
  }, [isFetching]);

  const handleSortChange = (newSortBy: SortField, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (timedOut && isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-xl bg-white p-8 shadow-premium text-center dark:bg-surface-800">
          <p className="text-base font-semibold text-surface-900 dark:text-white">{t.takingLonger}</p>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">{t.takingLongerHint}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => { setTimedOut(false); refetch?.(); }} className="btn-primary">{t.retry}</button>
            <button onClick={() => setTimedOut(false)} className="btn-ghost">{t.cancel}</button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && showLoading) {
    return (
      <div className="animate-fade-in">
        <div className="mb-6 flex items-center justify-between">
          <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-200 dark:bg-surface-700" />
          <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-200 dark:bg-surface-700" />
        </div>
        <SkeletonGrid />
      </div>
    );
  }

  if (isLoading) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-xl bg-white p-8 shadow-premium text-center dark:bg-surface-800">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-surface-900 dark:text-white">{t.failedToLoad}</p>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">{t.failedToLoadHint}</p>
          <button onClick={() => refetch?.()} className="btn-primary mt-6">{t.retry}</button>
        </div>
      </div>
    );
  }

  const hasListings = data && data.listings.length > 0;

  return (
    <div className="relative">
      {/* Mobile filter button */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50 dark:border-surface-600 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-surface-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {t.filters}
          {filtersActive && (
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-accent px-1.5 text-[10px] font-bold text-brand">
              !
            </span>
          )}
        </button>
      </div>

      {/* Search active banner */}
      {isSearchActive && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary-50 px-4 py-2.5 dark:bg-surface-700">
          <span className="text-sm font-medium text-primary-700 dark:text-surface-200">
            {t.searchShowingResultsFor} &quot;{searchQuery}&quot;
          </span>
          <button
            onClick={clearSearch}
            className="ml-auto text-xs font-medium text-primary-600 hover:text-primary-800 dark:text-brand-accent dark:hover:text-white"
          >
            ✕ Clear
          </button>
        </div>
      )}

      {/* Updating overlay */}
      {isFetching && showLoading && (
        <div className="absolute inset-0 z-10 flex items-start justify-center bg-surface-50/80 pt-16 backdrop-blur-[1px] dark:bg-surface-900/80">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-premium dark:bg-surface-800">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-200 border-t-brand-accent dark:border-surface-700" />
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">{t.updating}</span>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {data?.totalCount != null && (
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              <span className="text-brand-accent">{data.totalCount.toLocaleString('nl-NL')}</span>{' '}
              <span className="text-surface-600 font-normal text-lg dark:text-surface-300">{t.carsFound}</span>
            </h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <SortControls sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />
        </div>
      </div>

      {hasListings ? (
        <>
          <ListingGrid listings={data.listings} view={viewMode} />
          <div className="mt-10">
            <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
          </div>
          <div className="mt-3 text-center text-xs text-surface-400 dark:text-surface-500">
            {t.page} {data.page} {t.of} {data.totalPages}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white py-20 dark:bg-surface-800 dark:border-surface-700">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-700">
            <svg className="h-10 w-10 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-2.688M5.857 6.143l2.25-2.25m0 0l2.25 2.25M8.107 3.893v6.214M20.625 14.25h-3.375m0 0v-2.688c0-.621-.504-1.125-1.125-1.125H12.89m-7.515 3.813h7.515m0 0v-2.688" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-surface-800 dark:text-white">{t.noListingsFound}</p>
          <p className="mt-3 max-w-md text-center text-sm text-surface-500 dark:text-surface-300">{t.noListingsHint}</p>
        </div>
      )}
    </div>
  );
}
