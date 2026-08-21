import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { useLanguage } from '../i18n';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { api, ApiError } from '../api/client';
import { getProxyImageUrl } from '../utils/imageProxy';
import { formatPrice } from '../utils/formatNumber';

interface RecentlyViewedStripProps {
  /** Maximum number of listings to show */
  maxItems?: number;
}

export function RecentlyViewedStrip({ maxItems = 5 }: RecentlyViewedStripProps) {
  const { t, locale } = useLanguage();
  const { recentIds } = useRecentlyViewed();
  const idsToShow = recentIds.slice(0, maxItems);

  const queries = useQueries({
    queries: idsToShow.map(id => ({
      queryKey: ['listing-summary', id],
      queryFn: () => api.getListing(id),
      staleTime: 300_000,
      retry: (failureCount: number, error: unknown) => {
        // Don't retry 404s
        if (error instanceof ApiError && error.status === 404) return false;
        return failureCount < 2;
      },
    })),
  });

  if (idsToShow.length === 0) return null;

  const listings = queries
    .filter(q => q.data != null)
    .map(q => q.data!);

  if (listings.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold tracking-tight text-surface-900 dark:text-white">
        {t.recentlyViewed}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-surface-300 dark:scrollbar-thumb-surface-600">
        {listings.map(listing => (
          <Link
            key={listing.id}
            to={`/listing/${listing.id}`}
            className={[
              // Apple Glass card styling
              'group relative flex-shrink-0 w-56 overflow-hidden rounded-xl',
              'bg-white/10 backdrop-blur-xl',
              'border border-white/20 dark:border-white/[0.08]',
              'shadow-glass dark:shadow-glass-dark',
              // Spring-based hover transitions
              'transition-all duration-300 ease-smooth',
              'motion-reduce:transition-none motion-reduce:transform-none',
              'hover:-translate-y-1 hover:shadow-lg',
            ].join(' ')}
          >
            {/* Thumbnail */}
            <div className="relative aspect-[3/2] overflow-hidden">
              {listing.imageUrls[0] ? (
                <img
                  src={getProxyImageUrl(listing.imageUrls[0])}
                  alt={`${listing.make} ${listing.model}`}
                  className={[
                    'h-full w-full object-cover',
                    'transition-transform duration-300 ease-smooth',
                    'group-hover:scale-[1.02]',
                    'motion-reduce:transition-none motion-reduce:transform-none',
                  ].join(' ')}
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-surface-100 dark:bg-surface-800">
                  <svg
                    className="h-10 w-10 text-surface-300 dark:text-surface-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-2.25 0h-2.25m0 0V6.375c0-.621-.504-1.125-1.125-1.125H4.125C3.504 5.25 3 5.754 3 6.375v8.084M12 9.75H9.75"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-3">
              <p className="truncate text-sm font-semibold text-surface-900 dark:text-white">
                {listing.make} {listing.model}
              </p>
              <p className="mt-1 text-sm font-bold text-surface-700 dark:text-surface-200">
                {formatPrice(listing.price, locale)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
