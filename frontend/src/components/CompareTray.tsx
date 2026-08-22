import { memo } from 'react';
import { useCompare } from '../hooks/useCompare';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { getProxyImageUrl } from '../utils/imageProxy';
import { useLanguage } from '../i18n';

/**
 * Floating compare tray — appears at the bottom of the screen when
 * one or more cars are selected for comparison. Shows thumbnails,
 * car names, and a "Compare" button. Persists across page navigation.
 */
function CompareTrayInner() {
  const { compareIds, removeFromCompare, clearCompare, count } = useCompare();
  const { locale } = useLanguage();

  // Fetch summaries for compare items (lightweight query)
  const { data: listings } = useQuery({
    queryKey: ['compare-tray', compareIds],
    queryFn: async () => {
      if (compareIds.length === 0) return [];
      // Fetch each listing's summary — in production this would be a batch endpoint
      const results = await Promise.allSettled(
        compareIds.map(id => api.getListing(id))
      );
      return results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => r.value as { id: string; make: string; model: string; imageUrls: string[]; price: number });
    },
    enabled: compareIds.length > 0,
    staleTime: 60_000,
  });

  if (count === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] animate-fade-in md:bottom-4 md:left-1/2 md:-translate-x-1/2 md:max-w-xl md:rounded-2xl">
      <div className="flex items-center gap-3 border-t border-white/[0.1] bg-surface-900/95 px-4 py-3 shadow-2xl backdrop-blur-xl md:border md:rounded-2xl md:border-white/[0.1]">
        {/* Thumbnails */}
        <div className="flex items-center gap-2">
          {(listings ?? []).slice(0, 4).map((car) => (
            <div key={car.id} className="relative">
              <div className="h-10 w-14 overflow-hidden rounded-lg bg-surface-800">
                {car.imageUrls?.[0] && (
                  <img
                    src={getProxyImageUrl(car.imageUrls[0])}
                    alt={`${car.make} ${car.model}`}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => removeFromCompare(car.id)}
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-surface-700 text-surface-300 hover:bg-red-500 hover:text-white"
                aria-label={`Remove ${car.make} ${car.model}`}
              >
                <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {/* Empty slots */}
          {Array.from({ length: Math.max(0, 2 - count) }).map((_, i) => (
            <div key={`empty-${i}`} className="h-10 w-14 rounded-lg border border-dashed border-white/[0.15] bg-white/[0.02]" />
          ))}
        </div>

        {/* Count + text */}
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-medium text-white">
            {count} {locale === 'nl' ? 'geselecteerd' : 'selected'}
          </span>
          <span className="text-[10px] text-surface-400">
            {locale === 'nl' ? `Max 4 auto's` : 'Max 4 cars'}
          </span>
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={clearCompare}
          className="flex h-8 w-8 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          aria-label="Clear all"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => {
            const url = `${window.location.origin}/compare?ids=${compareIds.join(',')}`;
            navigator.clipboard.writeText(url).then(() => alert('Link copied!'));
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          aria-label="Copy compare link"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </button>
        <a
          href={`/compare?ids=${compareIds.join(',')}`}
          className="rounded-full bg-brand-accent px-5 py-2 text-sm font-bold text-white shadow-sm transition-transform active:scale-95"
        >
          {locale === 'nl' ? 'Vergelijk' : 'Compare'}
        </a>
      </div>
    </div>
  );
}

export const CompareTray = memo(CompareTrayInner);
