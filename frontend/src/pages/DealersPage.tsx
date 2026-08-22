import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useLanguage } from '../i18n';

export function DealersPage() {
  const { locale } = useLanguage();

  useEffect(() => {
    document.title = locale === 'nl' ? 'Dealers | OTO' : 'Dealers | OTO';
    return () => { document.title = 'OTO — Online Top Occasions'; };
  }, [locale]);

  // Get unique dealer locations
  const { data: filterOptions } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: () => api.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  });

  // Simple: show all cities that have dealer listings
  const cities = filterOptions?.makes ? [] : []; // Placeholder — we don't have a dealer list API yet

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          {locale === 'nl' ? '🏪 Dealers' : '🏪 Dealers'}
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          {locale === 'nl' ? 'Bekijk auto\'s per dealer in Nederland' : 'Browse cars by dealer in the Netherlands'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Show popular dealer cities */}
        {['Amsterdam', 'Rotterdam', 'Utrecht', 'Eindhoven', 'Den Haag', 'Tilburg', 'Breda', 'Arnhem', 'Groningen', 'Apeldoorn', 'Amersfoort', 'Nijmegen'].map((city) => (
          <a
            key={city}
            href={`/seller?location=${encodeURIComponent(city)}&type=dealer`}
            className="flex items-center gap-3 rounded-xl border border-surface-200 bg-surface-50 p-4 transition-all hover:border-brand-accent/40 hover:bg-brand-accent/5 dark:border-white/[0.08] dark:bg-white/[0.02] dark:hover:border-brand-accent/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent/10">
              <svg className="h-5 w-5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-surface-900 dark:text-white">{locale === 'nl' ? `Dealers in ${city}` : `Dealers in ${city}`}</p>
              <p className="text-[10px] text-surface-400">{locale === 'nl' ? 'Bekijk aanbod' : 'View listings'} →</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
