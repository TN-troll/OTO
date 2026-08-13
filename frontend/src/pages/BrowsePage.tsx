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
import { CATEGORIES } from '../data/categories';

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

/** Car silhouettes for category buttons */
function CategorySilhouette({ categoryId }: { categoryId: string }) {
  const cls = "h-14 w-auto fill-current";
  switch (categoryId) {
    case 'supercar': // Lamborghini Countach silhouette
      return (
        <svg className={cls} viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 32 L18 32 A5 5 0 0 0 28 32 L82 32 A5 5 0 0 0 92 32 L110 32 L108 28 L95 24 L85 12 L75 8 L45 8 L30 12 L20 18 L12 24 L10 28 Z" />
          <path d="M48 10 L72 10 L80 14 L48 14 Z" opacity="0.3" />
        </svg>
      );
    case 'luxury': // Rolls-Royce Phantom silhouette
      return (
        <svg className={cls} viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 32 L18 32 A5 5 0 0 0 28 32 L85 32 A5 5 0 0 0 95 32 L112 32 L112 26 L108 22 L100 16 L90 12 L80 10 L40 10 L30 12 L20 16 L14 22 L10 26 L8 30 Z" />
          <path d="M35 12 L80 12 L80 20 L35 20 Z" opacity="0.3" />
          <rect x="28" y="8" width="2" height="4" opacity="0.5" />
        </svg>
      );
    case 'performance-sedan': // Mercedes S-Class AMG silhouette
      return (
        <svg className={cls} viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 32 L16 32 A5 5 0 0 0 26 32 L84 32 A5 5 0 0 0 94 32 L112 32 L110 26 L104 22 L96 16 L88 12 L78 10 L42 10 L32 12 L24 16 L16 22 L10 26 L8 30 Z" />
          <path d="M38 12 L82 12 L88 16 L86 22 L34 22 L32 16 Z" opacity="0.3" />
        </svg>
      );
    case 'hot-hatch': // VW Golf GTI silhouette
      return (
        <svg className={cls} viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 32 L20 32 A5 5 0 0 0 30 32 L78 32 A5 5 0 0 0 88 32 L105 32 L105 26 L100 22 L95 16 L88 12 L78 10 L42 10 L32 12 L25 16 L18 22 L14 26 L12 30 Z" />
          <path d="M36 12 L80 12 L86 16 L84 20 L95 20 L95 26 L34 26 L30 20 L28 16 Z" opacity="0.3" />
        </svg>
      );
    case 'sports-car': // BMW M4 / Porsche 911 silhouette
      return (
        <svg className={cls} viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 32 L18 32 A5 5 0 0 0 28 32 L82 32 A5 5 0 0 0 92 32 L108 32 L106 28 L100 24 L92 16 L82 12 L72 10 L45 10 L35 12 L25 16 L18 22 L12 26 L10 30 Z" />
          <path d="M40 12 L75 12 L84 16 L82 20 L38 20 L36 16 Z" opacity="0.3" />
        </svg>
      );
    case 'suv': // Lamborghini Urus silhouette
      return (
        <svg className={cls} viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 34 L18 34 A6 6 0 0 0 30 34 L80 34 A6 6 0 0 0 92 34 L112 34 L112 26 L108 20 L100 14 L92 10 L80 8 L40 8 L28 10 L20 14 L14 20 L10 26 L8 32 Z" />
          <path d="M34 10 L82 10 L90 14 L88 22 L32 22 L30 14 Z" opacity="0.3" />
        </svg>
      );
    case 'electric': // Porsche Taycan silhouette
      return (
        <svg className={cls} viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 32 L18 32 A5 5 0 0 0 28 32 L82 32 A5 5 0 0 0 92 32 L110 32 L108 26 L102 22 L94 16 L84 12 L74 10 L44 10 L34 12 L24 16 L16 22 L12 26 L10 30 Z" />
          <path d="M38 12 L78 12 L86 16 L84 22 L36 22 L34 16 Z" opacity="0.3" />
          <path d="M50 14 L54 14 L52 18 L56 18 L50 24 L52 20 L48 20 Z" opacity="0.5" />
        </svg>
      );
    default:
      return null;
  }
}

export function BrowsePage() {
  const { t } = useLanguage();
  const {
    filtersActive,
    filters,
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
    updateMakes,
  } = useFilterContext();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
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
    placeholderData: (prev: any) => prev, // keep showing old data while new loads
  });

  // Determine which data source to use: search > filter > unfiltered
  // When filters just became active but result isn't ready yet, show loading
  const data = isSearchActive ? searchResult : filtersActive ? filterResult : unfilteredData;
  const isLoading = isSearchActive
    ? isSearching && !searchResult
    : filtersActive
      ? !filterResult  // Show loading while we wait for first filter result
      : unfilteredLoading;
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

  if (isLoading) {
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

      {/* Category filter buttons */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {CATEGORIES.filter(c => c.id !== 'classic').map(category => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => {
                if (isActive) {
                  setActiveCategory(null);
                  updateMakes([]);
                } else {
                  setActiveCategory(category.id);
                  updateMakes(category.filter.makes || []);
                }
              }}
              className={`group relative overflow-hidden rounded-xl px-3 py-3 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-brand text-white shadow-lg ring-2 ring-brand-accent'
                  : 'bg-white text-surface-700 shadow-sm hover:shadow-md hover:ring-1 hover:ring-surface-200 dark:bg-surface-800 dark:text-surface-200 dark:hover:ring-surface-600'
              }`}
            >
              {/* Silhouette background */}
              <div className={`absolute inset-0 flex items-center justify-end pr-1 opacity-[0.08] ${isActive ? 'opacity-[0.15]' : 'group-hover:opacity-[0.12]'}`}>
                <CategorySilhouette categoryId={category.id} />
              </div>
              <div className="relative flex flex-col items-start gap-0.5">
                <span className="text-sm">{category.emoji}</span>
                <span className="text-[11px] leading-tight">{category.labelNl}</span>
              </div>
            </button>
          );
        })}
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
