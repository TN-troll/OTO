import { useState, useEffect, memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { getProxyImageUrl } from '../utils/imageProxy';
import { formatPrice } from '../utils/formatNumber';
import { useLanguage } from '../i18n';
import { getMakeLogo } from '../utils/makeLogos';

/**
 * "Just Listed" toast — periodically shows a sliding notification
 * for the most recently added listing. Creates urgency and engagement.
 * Only shows on the browse page, dismissable.
 */
function JustListedToastInner() {
  const { locale } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Fetch latest listing
  const { data } = useQuery({
    queryKey: ['just-listed'],
    queryFn: () => api.getListings({ page: 1, pageSize: 1, sortBy: 'dateAdded', sortOrder: 'desc' }),
    staleTime: 60_000,
    refetchInterval: 120_000, // Check every 2 minutes
  });

  const listing = data?.listings?.[0];

  // Show toast 5 seconds after data loads, then auto-hide after 8 seconds
  useEffect(() => {
    if (!listing || dismissed) return;

    const showTimer = setTimeout(() => setVisible(true), 5000);
    const hideTimer = setTimeout(() => setVisible(false), 13000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [listing, dismissed]);

  if (!listing || dismissed || !visible) return null;

  const logo = getMakeLogo(listing.make);

  return (
    <div className="fixed bottom-20 left-4 z-[55] animate-fade-in md:bottom-6 md:left-6">
      <div className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white/95 p-3 shadow-xl backdrop-blur-xl dark:border-white/[0.1] dark:bg-surface-900/95">
        {/* Image thumbnail */}
        {listing.primaryImageUrl && (
          <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg">
            <img src={getProxyImageUrl(listing.primaryImageUrl)} alt="" className="h-full w-full object-cover" />
          </div>
        )}

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
            {locale === 'nl' ? 'Zojuist geplaatst' : 'Just listed'}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm font-semibold text-surface-900 dark:text-white">
            {logo && <img src={logo} alt="" className="h-3.5 w-3.5 object-contain" />}
            {listing.make} {listing.model}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {listing.year} &bull; {formatPrice(listing.price, locale)}
            {listing.horsepower ? ` \u2022 ${listing.horsepower} pk` : ''}
          </p>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => { setDismissed(true); setVisible(false); }}
          className="ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-surface-400 hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-white/[0.08]"
          aria-label="Dismiss"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Click to view */}
        <a
          href={`/listing/${listing.id}`}
          className="ml-1 shrink-0 rounded-lg bg-brand-accent px-3 py-1.5 text-[10px] font-bold text-white transition-transform active:scale-95"
        >
          {locale === 'nl' ? 'Bekijk' : 'View'}
        </a>
      </div>
    </div>
  );
}

export const JustListedToast = memo(JustListedToastInner);
