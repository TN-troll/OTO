import { useState, useEffect, useRef, useCallback } from 'react';
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

/**
 * RecentlyViewedStrip — morphing recently viewed section.
 *
 * Behavior:
 * - Shows full-size cards at the top of the page when first loaded
 * - As the user scrolls down and the section goes out of view,
 *   a compact mini-bar with small thumbnails appears fixed at the bottom
 * - The mini-bar uses smaller tiles and slides up with a smooth animation
 * - When scrolled back to the top, the mini-bar hides and the full cards are visible again
 */
export function RecentlyViewedStrip({ maxItems = 5 }: RecentlyViewedStripProps) {
  const { t, locale } = useLanguage();
  const { recentIds } = useRecentlyViewed();
  const idsToShow = recentIds.slice(0, maxItems);
  const sectionRef = useRef<HTMLElement>(null);
  const [showMiniBar, setShowMiniBar] = useState(false);

  const queries = useQueries({
    queries: idsToShow.map(id => ({
      queryKey: ['listing-summary', id],
      queryFn: () => api.getListing(id),
      staleTime: 300_000,
      retry: (failureCount: number, error: unknown) => {
        if (error instanceof ApiError && error.status === 404) return false;
        return failureCount < 2;
      },
    })),
  });

  // Track when the full-size section scrolls out of view
  const handleScroll = useCallback(() => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    // Show mini-bar when the section's bottom edge is above the viewport
    setShowMiniBar(rect.bottom < 0);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (idsToShow.length === 0) return null;

  const listings = queries
    .filter(q => q.data != null)
    .map(q => q.data!);

  if (listings.length === 0) return null;

  return (
    <>
      {/* ═══ Full-size section (top of page) ═══ */}
      <section ref={sectionRef} className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-surface-900 dark:text-white">
          {t.recentlyViewed}
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {listings.map((listing, idx) => (
            <Link
              key={listing.id}
              to={`/listing/${listing.id}`}
              className={[
                'group relative flex-shrink-0 w-52 overflow-hidden rounded-2xl',
                'bg-white/60 backdrop-blur-xl dark:bg-white/[0.04]',
                'border border-white/20 dark:border-white/[0.08]',
                'shadow-glass dark:shadow-glass-dark',
                'transition-[transform,box-shadow] duration-200 ease-smooth',
                'motion-reduce:transition-none motion-reduce:transform-none',
                'hover:-translate-y-1 hover:shadow-glass-elevated',
                idx < 6 ? `animate-stagger-${idx + 1}` : 'animate-fade-in',
              ].join(' ')}
            >
              <div className="relative aspect-[3/2] overflow-hidden">
                {listing.imageUrls[0] ? (
                  <img
                    src={getProxyImageUrl(listing.imageUrls[0])}
                    alt={`${listing.make} ${listing.model}`}
                    className="h-full w-full object-cover transition-transform duration-300 ease-smooth group-hover:scale-[1.03] motion-reduce:transition-none"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface-100 dark:bg-surface-800">
                    <svg className="h-8 w-8 text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="truncate text-xs font-semibold text-surface-900 dark:text-white">
                  {listing.make} {listing.model}
                </p>
                <p className="mt-0.5 text-xs font-bold text-brand-accent">
                  {formatPrice(listing.price, locale)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ Compact mini-bar (fixed bottom, appears on scroll) ═══ */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-50 md:left-80',
          'border-t border-white/[0.1] bg-surface-950/80 backdrop-blur-lg',
          'transition-transform duration-300 ease-smooth',
          'motion-reduce:transition-none',
          showMiniBar ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        aria-hidden={!showMiniBar}
      >
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-surface-400">
            {t.recentlyViewed}
          </span>
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {listings.map(listing => (
              <Link
                key={listing.id}
                to={`/listing/${listing.id}`}
                className="group flex shrink-0 items-center gap-2 rounded-lg bg-white/[0.06] px-2 py-1.5 transition-[background-color] duration-150 hover:bg-white/[0.12]"
                title={`${listing.make} ${listing.model}`}
              >
                {/* Mini thumbnail */}
                <div className="h-8 w-12 overflow-hidden rounded-md">
                  {listing.imageUrls[0] ? (
                    <img
                      src={getProxyImageUrl(listing.imageUrls[0])}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-surface-700" />
                  )}
                </div>
                {/* Mini text */}
                <div className="hidden sm:block">
                  <p className="text-[10px] font-medium text-surface-200 leading-tight">
                    {listing.make} {listing.model}
                  </p>
                  <p className="text-[10px] font-bold text-brand-accent leading-tight">
                    {formatPrice(listing.price, locale)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
