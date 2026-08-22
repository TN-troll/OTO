import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ListingCard } from '../components/ListingCard';
import { useLanguage } from '../i18n';
import { getMakeLogo } from '../utils/makeLogos';

export function BrandDetailPage() {
  const { make } = useParams<{ make: string }>();
  const { locale } = useLanguage();
  const decodedMake = decodeURIComponent(make || '');

  useEffect(() => {
    document.title = `${decodedMake} | OTO`;
    return () => { document.title = 'OTO — The Online Trade Occasions Platform'; };
  }, [decodedMake]);

  // Fetch models for this make
  const { data: models, isLoading: modelsLoading } = useQuery({
    queryKey: ['modelsForMake', decodedMake],
    queryFn: () => api.getModelsForMake([decodedMake]),
    enabled: !!decodedMake,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch listings for this make (preview)
  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['brand-listings', decodedMake],
    queryFn: () => api.filterListings({ makes: [decodedMake], pageSize: 6 }),
    enabled: !!decodedMake,
    staleTime: 60_000,
  });

  const logo = getMakeLogo(decodedMake);
  const totalListings = listings?.totalCount ?? 0;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Back link */}
      <Link to="/brands" className="inline-flex items-center gap-1 text-sm font-medium text-surface-400 transition-colors hover:text-brand-accent">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {locale === 'nl' ? 'Alle merken' : 'All brands'}
      </Link>

      {/* Brand header */}
      <div className="flex items-center gap-4">
        {logo ? (
          <img src={logo} alt={decodedMake} className="h-14 w-14 object-contain" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-200 text-xl font-bold text-surface-500 dark:bg-surface-700 dark:text-surface-400">
            {decodedMake.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-white">{decodedMake}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {totalListings} {locale === 'nl' ? 'advertenties' : 'listings'} • {models?.length ?? 0} {locale === 'nl' ? 'modellen' : 'models'}
          </p>
        </div>
      </div>

      {/* Models grid */}
      <div>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
          {locale === 'nl' ? 'Modellen' : 'Models'}
        </h2>

        {modelsLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" />
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {(models ?? []).map((model) => (
              <a
                key={model}
                href={`/models/${encodeURIComponent(decodedMake)}/${encodeURIComponent(model)}`}
                className="rounded-xl border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm font-medium text-surface-700 transition-all hover:border-brand-accent/40 hover:bg-brand-accent/5 hover:text-brand-accent dark:border-white/[0.08] dark:bg-white/[0.02] dark:text-surface-200 dark:hover:border-brand-accent/30"
              >
                {model}
              </a>
            ))}
            {(models ?? []).length === 0 && (
              <p className="text-sm text-surface-400">{locale === 'nl' ? 'Geen modellen gevonden' : 'No models found'}</p>
            )}
          </div>
        )}
      </div>

      {/* Recent listings preview */}
      <div>
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-surface-900 dark:text-white">
            {locale === 'nl' ? `Nieuwste ${decodedMake} advertenties` : `Latest ${decodedMake} listings`}
          </h2>
          <a href={`/?makes=${encodeURIComponent(decodedMake)}`} className="text-xs font-medium text-brand-accent hover:underline">
            {locale === 'nl' ? 'Alles bekijken' : 'View all'} →
          </a>
        </div>

        {listingsLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(listings?.listings ?? []).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
