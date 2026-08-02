import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SortField, SortOrder } from '@car-ads/shared';
import { api } from '../api/client';
import { ListingGrid } from '../components/ListingGrid';
import { Pagination } from '../components/Pagination';
import { SortControls } from '../components/SortControls';
import { useLanguage } from '../i18n';

const DEFAULT_PAGE_SIZE = 50;

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
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-base font-medium text-gray-800">{t.takingLonger}</p>
        <p className="mt-1 text-sm text-gray-500">{t.takingLongerHint}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => { setTimedOut(false); refetch(); }} className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">{t.retry}</button>
          <button onClick={() => setTimedOut(false)} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">{t.cancel}</button>
        </div>
      </div>
    );
  }

  if (isLoading && showLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
          <span className="text-sm text-gray-500">{t.loading}</span>
        </div>
      </div>
    );
  }

  if (isLoading) return null;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-base font-medium text-red-600">{t.failedToLoad}</p>
        <p className="mt-1 text-sm text-gray-500">{t.failedToLoadHint}</p>
        <button onClick={() => refetch()} className="mt-4 rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">{t.retry}</button>
      </div>
    );
  }

  const hasListings = data && data.listings.length > 0;

  return (
    <div className="relative">
      {isFetching && showLoading && (
        <div className="absolute inset-0 z-10 flex items-start justify-center bg-white/60 pt-12">
          <div className="flex items-center gap-2 rounded-md bg-white px-4 py-2 shadow-md">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-primary-600" />
            <span className="text-sm text-gray-600">{t.updating}</span>
          </div>
        </div>
      )}

      {/* Results header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {data?.totalCount != null && (
              <span className="text-primary-600">{data.totalCount.toLocaleString('nl-NL')}</span>
            )}{' '}
            {t.exclusiveCars}
          </h1>
        </div>
        <SortControls sortBy={sortBy} sortOrder={sortOrder} onSortChange={handleSortChange} />
      </div>

      {hasListings ? (
        <>
          <ListingGrid listings={data.listings} />
          <div className="mt-8">
            <Pagination currentPage={data.page} totalPages={data.totalPages} onPageChange={handlePageChange} />
          </div>
          <div className="mt-3 text-center text-xs text-gray-400">
            {t.page} {data.page} {t.of} {data.totalPages}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white py-16">
          <svg className="mb-4 h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-base font-medium text-gray-800">{t.noListingsFound}</p>
          <p className="mt-2 max-w-md text-center text-sm text-gray-500">{t.noListingsHint}</p>
        </div>
      )}
    </div>
  );
}
