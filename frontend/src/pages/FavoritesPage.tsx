import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFavorites } from '../hooks/useFavorites';
import { api } from '../api/client';
import { ListingCard } from '../components/ListingCard';
import { useLanguage } from '../i18n';
import type { ListingSummary } from '@car-ads/shared';
import { PageTransition } from '../components/PageTransition';

export function FavoritesPage() {
  const { favorites } = useFavorites();
  const { locale } = useLanguage();

  useEffect(() => {
    document.title = locale === 'nl' ? 'Favorieten | OTO' : 'Favorites | OTO';
    return () => { document.title = 'OTO — The Online Trade Occasions Platform'; };
  }, [locale]);

  // Fetch full listing data for favorited IDs
  const { data: listings, isLoading } = useQuery({
    queryKey: ['favorites-listings', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      const results = await Promise.allSettled(
        favorites.map(id => api.getListing(id))
      );
      return results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map(r => {
          const listing = r.value;
          return {
            ...listing,
            primaryImageUrl: listing.imageUrls?.[0] ?? null,
            snippet: null,
          } as ListingSummary;
        });
    },
    enabled: favorites.length > 0,
    staleTime: 60_000,
  });

  return (
    <PageTransition>
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          {locale === 'nl' ? 'Mijn Favorieten' : 'My Favorites'}
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          {favorites.length} {locale === 'nl' ? 'opgeslagen auto\'s' : 'saved cars'}
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" />
        </div>
      )}

      {!isLoading && favorites.length === 0 && (
        <div className="rounded-2xl border border-surface-200 bg-surface-50 p-12 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
          <svg className="mx-auto h-12 w-12 text-surface-300 dark:text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          <p className="mt-4 text-sm text-surface-500 dark:text-surface-400">
            {locale === 'nl' ? 'Nog geen favorieten. Klik op het hartje bij een auto om deze op te slaan.' : 'No favorites yet. Click the heart icon on a listing to save it.'}
          </p>
          <a href="/" className="mt-4 inline-block rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white">
            {locale === 'nl' ? 'Auto\'s bekijken' : 'Browse cars'}
          </a>
        </div>
      )}

      {!isLoading && listings && listings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
    </PageTransition>
  );
}
