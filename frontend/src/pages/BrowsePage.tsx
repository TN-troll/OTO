import { useState, useEffect, useRef, useMemo } from 'react';
import type { SortField, SortOrder } from '@car-ads/shared';
import { ListingGrid } from '../components/ListingGrid';
import { InfiniteScrollTrigger } from '../components/InfiniteScrollTrigger';
import { SortControls } from '../components/SortControls';
import { ViewToggle } from '../components/ViewToggle';
import { useFilterContext } from '../hooks/FilterContext';
import { useInfiniteListings } from '../hooks/useInfiniteListings';
import { useLanguage } from '../i18n';
import { CATEGORIES } from '../data/categories';
import { getMakeLogo } from '../utils/makeLogos';

import { CATEGORY_CONTENT } from '../data/category-content';
import { useCompare } from '../hooks/useCompare';
import { formatPrice, formatNumber } from '../utils/formatNumber';
import { SavedSearchPrompt } from '../components/SavedSearchPrompt';
import { DigestSubscribe } from '../components/DigestSubscribe';
import { InFeedAd } from '../components/AdSlot';

const DEFAULT_PAGE_SIZE = 20;

/** Skeleton card placeholder for loading state */
function SkeletonCard() {
  return (
    <div className="animate-pulse motion-reduce:animate-none overflow-hidden rounded-xl bg-white shadow-card dark:bg-surface-800">
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
    <div className="grid w-full max-w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function BrowsePage() {
  const { t, locale } = useLanguage();
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
    updateModels,
    setCategory,
  } = useFilterContext();

  const { compareIds, removeFromCompare, clearCompare } = useCompare();

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showLoading, setShowLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build human-readable filter summary for saved search prompt
  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (filters.makes.length > 0) parts.push(filters.makes.join(', '));
    if (filters.bodyType.length > 0) parts.push(filters.bodyType.join(', '));
    if (filters.horsepowerMin) parts.push(`${filters.horsepowerMin}+ HP`);
    if (filters.priceMax) parts.push(`≤ €${Math.round(filters.priceMax / 1000)}k`);
    if (filters.fuelType.length > 0) parts.push(filters.fuelType.join(', '));
    if (filters.yearMin) parts.push(`≥ ${filters.yearMin}`);
    return parts.length > 0 ? parts.join(' • ') : 'Custom filters';
  }, [filters]);

  // Determine if search is active
  const isSearchActive = searchQuery.length >= 2 && searchResult !== null;

  // Build filter criteria for the infinite scroll hook
  const infiniteFilters = filtersActive ? filters : {};

  // Infinite scroll hook — main data source for unfiltered and filtered browse
  const {
    listings: infiniteListings,
    totalCount: infiniteTotalCount,
    isLoading: infiniteLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError: infiniteIsError,
    error: infiniteError,
    refetch: infiniteRefetch,
  } = useInfiniteListings({
    filters: infiniteFilters as any,
    sortBy,
    sortOrder,
    pageSize: DEFAULT_PAGE_SIZE,
    enabled: !isSearchActive,
  });

  // Determine which data source to use: search > infinite scroll
  const listings = isSearchActive ? (searchResult?.listings ?? []) : infiniteListings;
  const totalCount = isSearchActive ? (searchResult?.totalCount ?? 0) : infiniteTotalCount;
  const isLoading = isSearchActive ? (isSearching && !searchResult) : infiniteLoading;
  const isFetching = isSearchActive ? isSearching : isFetchingNextPage;
  const error = isSearchActive ? null : infiniteIsError ? infiniteError : null;
  const refetch = isSearchActive ? undefined : infiniteRefetch;

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
    // Infinite scroll resets automatically when query key changes (sort params are part of the key)
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
          <div className="h-7 w-48 animate-pulse motion-reduce:animate-none rounded-lg bg-surface-200 dark:bg-surface-700" />
          <div className="h-8 w-40 animate-pulse motion-reduce:animate-none rounded-lg bg-surface-200 dark:bg-surface-700" />
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

  const hasListings = listings.length > 0;

  return (
    <div className="relative w-full max-w-full overflow-x-hidden">
      {/* Value proposition — shown only when no filters/search active */}
      {!filtersActive && !isSearchActive && (
        <div className="mb-6 rounded-2xl border border-surface-200 bg-gradient-to-r from-surface-50 to-white p-5 dark:border-white/[0.08] dark:from-surface-900 dark:to-surface-800">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white">
            {locale === 'nl' ? '🏎️ De beste performance & luxe auto\'s van Nederland' : '🏎️ The best performance & luxury cars in the Netherlands'}
          </h2>
          <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
            {locale === 'nl'
              ? '3.000+ exclusieve advertenties van AutoScout24, AutoTrack & Marktplaats — op één plek, met prijsvergelijking en marktanalyse.'
              : '3,000+ exclusive listings from AutoScout24, AutoTrack & Marktplaats — in one place, with price comparison and market analysis.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-surface-400">
            <span className="flex items-center gap-1">✓ {locale === 'nl' ? 'Alleen NL' : 'NL only'}</span>
            <span className="flex items-center gap-1">✓ {locale === 'nl' ? 'Prijsvergelijking' : 'Price comparison'}</span>
            <span className="flex items-center gap-1">✓ {locale === 'nl' ? 'RDW check' : 'RDW check'}</span>
            <span className="flex items-center gap-1">✓ {locale === 'nl' ? 'Dagelijks bijgewerkt' : 'Updated daily'}</span>
          </div>
        </div>
      )}

      {/* Mobile filter button */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-colors hover:bg-surface-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-surface-200 dark:hover:bg-white/[0.08]"
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



      {/* Category content (shown when a category is active) */}
      {activeCategory && CATEGORY_CONTENT[activeCategory] && (
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm dark:bg-surface-800">
          <p className="text-sm leading-relaxed text-surface-600 dark:text-surface-300">
            {locale === 'nl' ? CATEGORY_CONTENT[activeCategory].descriptionNl : CATEGORY_CONTENT[activeCategory].descriptionEn}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {CATEGORY_CONTENT[activeCategory].articles.map((article) => (
              <a
                key={article.url}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full bg-surface-50 px-3 py-1.5 text-[11px] font-medium text-surface-600 transition-colors hover:bg-brand-accent hover:text-brand dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-brand-accent dark:hover:text-brand"
              >
                <span>{article.title}</span>
                <span className="text-surface-400">— {article.source}</span>
              </a>
            ))}
          </div>
        </div>
      )}


      {/* Sponsored content */}
      <div className="my-4">
        <InFeedAd />
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

      {/* Active brand header — shown when make filter is active */}
      {filters.makes.length === 1 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
          {getMakeLogo(filters.makes[0]) && (
            <img src={getMakeLogo(filters.makes[0])!} alt={filters.makes[0]} className="h-8 w-8 object-contain" />
          )}
          <div>
            <p className="text-sm font-bold text-surface-900 dark:text-white">{filters.makes[0]}</p>
            <p className="text-[11px] text-surface-400">
              {infiniteTotalCount} {locale === 'nl' ? 'advertenties' : 'listings'}
            </p>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" aria-atomic="true">
          {totalCount != null && totalCount > 0 && (
            <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
              <span className="text-brand-accent">{formatNumber(totalCount, locale)}</span>{' '}
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
          <ListingGrid listings={listings} view={viewMode} />
          {/* Infinite scroll trigger — replaces traditional pagination (Req 3.1, 3.2, 3.4, 3.5) */}
          {!isSearchActive && (
            <div className="mt-10">
              <InfiniteScrollTrigger
                hasNextPage={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
                isError={infiniteIsError}
                triggerDistance={300}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white py-20 dark:bg-white/[0.04] dark:border-white/[0.08]">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-700">
            <svg className="h-10 w-10 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-2.688M5.857 6.143l2.25-2.25m0 0l2.25 2.25M8.107 3.893v6.214M20.625 14.25h-3.375m0 0v-2.688c0-.621-.504-1.125-1.125-1.125H12.89m-7.515 3.813h7.515m0 0v-2.688" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-surface-800 dark:text-white">{t.noListingsFound}</p>
          <p className="mt-3 max-w-md text-center text-sm text-surface-500 dark:text-surface-300">{t.noListingsHint}</p>
        </div>
      )}

      {/* Floating Compare Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-200 bg-white/95 px-4 py-3 pb-[env(safe-area-inset-bottom)] shadow-premium backdrop-blur-sm dark:border-white/[0.08] dark:bg-black/80 dark:shadow-glass-dark">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {compareIds.map(cid => (
                <div key={cid} className="relative h-12 w-16 overflow-hidden rounded-md bg-surface-100 dark:bg-surface-700">
                  <button
                    type="button"
                    onClick={() => removeFromCompare(cid)}
                    className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm"
                    aria-label="Remove from compare"
                  >
                    ×
                  </button>
                </div>
              ))}
              <span className="text-xs text-surface-500 dark:text-surface-400">{compareIds.length}/3 selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearCompare}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-surface-500 transition-colors hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
              >
                Clear
              </button>
              <a
                href={`/compare?ids=${compareIds.join(',')}`}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-all ${
                  compareIds.length >= 2 ? 'bg-brand-accent hover:bg-brand-accent/90' : 'pointer-events-none bg-surface-300 dark:bg-surface-600'
                }`}
              >
                Compare ({compareIds.length})
              </a>
            </div>
          </div>
        </div>
      )}

      <SavedSearchPrompt filtersActive={filtersActive} filterSummary={filterSummary} />

      {/* Weekly digest signup */}
      <div className="mt-8">
        <DigestSubscribe />
      </div>
    </div>
  );
}
