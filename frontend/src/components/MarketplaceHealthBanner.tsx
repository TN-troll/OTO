import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { MarketplaceHealth } from '@car-ads/shared';

/** Display names for marketplace IDs */
const MARKETPLACE_NAMES: Record<string, string> = {
  autotrack: 'AutoTrack',
  autoscout24: 'AutoScout24',
  marktplaats: 'Marktplaats',
};

function getMarketplaceName(id: string): string {
  return MARKETPLACE_NAMES[id] || id;
}

/**
 * Banner component that polls marketplace health status and shows
 * a warning when any marketplace has been unreachable for > 4 hours.
 *
 * Requirements:
 * - 7.4: Display notification when a marketplace is unreachable > 4 hours
 * - 7.5: Remove notification within 15 minutes of recovery
 */
export function MarketplaceHealthBanner() {
  const [dismissed, setDismissed] = useState(false);
  const prevUnreachableRef = useRef<string[]>([]);

  const { data: healthData } = useQuery<MarketplaceHealth[]>({
    queryKey: ['marketplace-health'],
    queryFn: () => api.getMarketplaceHealth(),
    refetchInterval: 60_000, // Poll every minute
    staleTime: 30_000,
  });

  // Filter to only unreachable marketplaces
  const unreachableMarketplaces = healthData?.filter(
    (m) => m.status === 'unreachable'
  ) ?? [];

  const unreachableIds = unreachableMarketplaces.map((m) => m.marketplace).sort();
  const unreachableKey = unreachableIds.join(',');

  // Reset dismissed state when the set of unreachable marketplaces changes
  // (new marketplace becomes unreachable, or all recover)
  useEffect(() => {
    const prev = prevUnreachableRef.current;
    const prevKey = prev.join(',');

    if (prevKey !== unreachableKey) {
      setDismissed(false);
      prevUnreachableRef.current = unreachableIds;
    }
  }, [unreachableKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nothing to show
  if (unreachableMarketplaces.length === 0 || dismissed) {
    return null;
  }

  const names = unreachableMarketplaces.map((m) => getMarketplaceName(m.marketplace));
  const marketplaceList = names.join(', ');
  const plural = names.length > 1;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 border-b border-amber-400/30 bg-amber-50 px-4 py-3 sm:px-6"
    >
      <div className="flex items-center gap-3">
        {/* Warning icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <svg
            className="h-4 w-4 text-amber-600"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.168 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-sm text-amber-800">
          <span className="font-semibold">{marketplaceList}</span>
          {plural ? ' are' : ' is'} currently unreachable. Listings from{' '}
          {plural ? 'these sources' : 'this source'} may not be up to date.
        </p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-100 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
        aria-label="Dismiss notification"
      >
        <svg
          className="h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
        </svg>
      </button>
    </div>
  );
}
