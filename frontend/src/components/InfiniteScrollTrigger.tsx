import { useEffect, useRef } from 'react';
import { useLanguage } from '../i18n';

interface InfiniteScrollTriggerProps {
  /** Whether there are more pages to load */
  hasNextPage: boolean;
  /** Whether a next page is currently being fetched */
  isFetchingNextPage: boolean;
  /** Callback to fetch the next page */
  fetchNextPage: () => void;
  /** Whether there was an error fetching the next page */
  isError: boolean;
  /** Distance in pixels from bottom to trigger next page load */
  triggerDistance?: number;
}

/**
 * InfiniteScrollTrigger uses an IntersectionObserver to detect when the user
 * scrolls within a certain distance of the bottom, then triggers the next page load.
 *
 * Displays:
 * - Loading spinner while fetching next page (Req 3.2)
 * - "No more listings" when all pages are loaded (Req 3.4)
 * - "Retry" button on page request failure (Req 3.5)
 */
export function InfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isError,
  triggerDistance = 300,
}: InfiniteScrollTriggerProps) {
  const { t } = useLanguage();
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = triggerRef.current;
    if (!element) return;

    // Only observe if there are more pages and no error
    if (!hasNextPage || isError || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          fetchNextPage();
        }
      },
      {
        // rootMargin adds pixels to the observation boundary:
        // bottom margin of triggerDistance means the trigger fires
        // when the element is within triggerDistance pixels of the viewport bottom
        rootMargin: `0px 0px ${triggerDistance}px 0px`,
        threshold: 0,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isError, isFetchingNextPage, fetchNextPage, triggerDistance]);

  // Error state: show retry button, preserving previously loaded results (Req 3.5)
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className="text-sm text-surface-500 dark:text-surface-400">{t.loadMoreError}</p>
        <button
          type="button"
          onClick={() => fetchNextPage()}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
        >
          {t.retryLoadMore}
        </button>
      </div>
    );
  }

  // Loading state: spinner while fetching next page (Req 3.2)
  if (isFetchingNextPage) {
    return (
      <div className="flex items-center justify-center gap-3 py-8">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" />
        <span className="text-sm font-medium text-surface-500 dark:text-surface-400">{t.loadingMore}</span>
      </div>
    );
  }

  // No more pages: show end indicator (Req 3.4)
  if (!hasNextPage) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-sm text-surface-400 dark:text-surface-500">{t.noMoreListings}</span>
      </div>
    );
  }

  // Invisible trigger element observed by IntersectionObserver (Req 3.1)
  return <div ref={triggerRef} className="h-px w-full" aria-hidden="true" />;
}
