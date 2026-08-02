import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SortField, SortOrder } from '@car-ads/shared';
import { api } from '../api/client';
import { ListingGrid } from '../components/ListingGrid';
import { Pagination } from '../components/Pagination';
import { SortControls } from '../components/SortControls';
import { useLanguage } from '../i18n';

const DEFAULT_PAGE_SIZE = 50;

/** Skeleton card placeholder for loading state */
function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white shadow-card">
      <div className="aspect-[3/2] bg-surface-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 rounded bg-surface-200" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-md bg-surface-100" />
          <div className="h-6 w-12 rounded-md bg-surface-100" />
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
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('dateAdded');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showLoading, setShowLoading] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const queryKey = ['listings', { page, pageSize: DEFAULT_PAGE_SIZE, sortBy, sortOrder }];

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      api.getListings({ page, pageSize: DEFAULT_PAGE_SIZE, sortBy, sortOrder }),
  });

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
        <div className="rounded-xl bg-white p-8 shadow-premium text-center">
          <p className="text-base font-semibold text-surface-900">{t.takingLonger}</p>
          <p className="mt-2 text-sm text-surface-500">{t.takingLongerHint}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => { setTimedOut(false); refetch(); }} className="btn-primary">{t.retry}</button>
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
          <div className="h-7 w-48 animate-pulse rounded-lg bg-surface-200" />
          <div className="h-8 w-40 animate-pulse rounded-lg bg-surface-200" />
        </div>
        <SkeletonGrid />
      </div>
    );
  }

  if (isLoading) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-xl bg-white p-8 shadow-premium text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-surface-900">{t.failedToLoad}</p>
          <p className="mt-2 text-sm text-surface-500">{t.failedToLoadHint}</p>
          <button onClick={() => refetch()} className="btn-primary mt-6">{t.retry}</button>
        </div>
      </div>
    );
  }

  const hasListings = data && data.listings.length > 0;

  return (
    <div className="relative">
      {/* Updating overlay */}
      {isFetching && showLoading && (
        <div className="absolute inset-0 z-10 flex items-start justify-center bg-surface-50/80 pt-16 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-3 shadow-premium">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-surface-200 border-t-brand-accent" />
            <span className="text-sm font-medium text-surface-700">{t.updating}</span>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {data?.totalCount != null && (
            <h1 className="text-2xl font-bold text-surface-900">
              <span className="text-brand-accent">{data.totalCount.toLocaleString('nl-NL')}</span>{' '}
              <span className="text-surface-600 font-normal text-lg">{t.carsFound}</span>
            </h1>
          )}
        </div>
        <SortControls sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />
      </div>

      {hasListings ? (
        <>
          <ListingGrid listings={data.listings} />
          <div className="mt-10">
            <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
          </div>
          <div className="mt-3 text-center text-xs text-surface-400">
            {t.page} {data.page} {t.of} {data.totalPages}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white py-20">
          {/* Car illustration placeholder */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-100">
            <svg className="h-10 w-10 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.125-.504 1.125-1.125v-2.688M5.857 6.143l2.25-2.25m0 0l2.25 2.25M8.107 3.893v6.214M20.625 14.25h-3.375m0 0v-2.688c0-.621-.504-1.125-1.125-1.125H12.89m-7.515 3.813h7.515m0 0v-2.688" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-surface-800">{t.noListingsFound}</p>
          <p className="mt-3 max-w-md text-center text-sm text-surface-500">{t.noListingsHint}</p>
        </div>
      )}
    </div>
  );
}
