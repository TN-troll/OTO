import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../i18n';
import { getMakeLogo } from '../utils/makeLogos';

export function BrandsPage() {
  const { locale } = useLanguage();

  useEffect(() => {
    document.title = locale === 'nl' ? 'Merken | OTO' : 'Brands | OTO';
    return () => { document.title = 'OTO — Online Top Occasions'; };
  }, [locale]);

  const { data: filterOptions, isLoading } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: () => api.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const makes = filterOptions?.makes ?? [];
  const modelsByMake = filterOptions?.modelsByMake ?? {};

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          {locale === 'nl' ? 'Alle Merken' : 'All Brands'}
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          {makes.length} {locale === 'nl' ? 'merken beschikbaar' : 'brands available'}
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {makes.map((make) => {
            const logo = getMakeLogo(make);
            const modelCount = modelsByMake[make]?.length ?? 0;
            return (
              <a
                key={make}
                href={`/brands/${encodeURIComponent(make)}`}
                className="flex flex-col items-center gap-2 rounded-2xl border border-surface-200 bg-surface-50 p-4 transition-all hover:border-brand-accent/40 hover:bg-brand-accent/5 hover:shadow-sm dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-brand-accent/30"
              >
                {logo ? (
                  <img src={logo} alt={make} className="h-10 w-10 object-contain" loading="lazy" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-200 text-sm font-bold text-surface-500 dark:bg-surface-700 dark:text-surface-400">
                    {make.charAt(0)}
                  </div>
                )}
                <div className="text-center">
                  <p className="text-sm font-semibold text-surface-900 dark:text-white">{make}</p>
                  <p className="text-[10px] text-surface-400">{modelCount} {locale === 'nl' ? 'modellen' : 'models'}</p>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
