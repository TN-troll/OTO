import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ACCELERATION_DATA, ACCELERATION_0_200, ACCELERATION_100_200 } from '../data/performance';
import { getMakeLogo } from '../utils/makeLogos';
import { useLanguage } from '../i18n';
import { PageTransition } from '../components/PageTransition';

type SpeedCategory = '0-100' | '0-200' | '100-200';

interface ModelEntry {
  make: string;
  model: string;
  searchTerm: string;
  time: number;
}

/** Extract base model name for better DB matching */
function getBaseModel(model: string): string {
  const baseModelMap: Record<string, string> = {
    '911 Turbo S': '911',
    '911 GT3': '911',
    '911 GT3 RS': '911',
    '911 GT2 RS': '911',
    '911 Turbo': '911',
    '911 Sport Classic': '911',
    'SF90 Spider': 'SF90',
    'SF90XX': 'SF90',
    'F8 Tributo': 'F8',
    'F8 Spider': 'F8',
    '812 Competizione': '812',
    '296 GTS': '296',
    '296 GTB': '296',
    'Huracán STO': 'Huracán',
    'Huracán Tecnica': 'Huracán',
    'Continental GT': 'Continental',
    'Continental GTC': 'Continental',
    'Golf R': 'Golf',
    'Golf GTI': 'Golf',
    'Civic Type R': 'Civic',
    'i30 N': 'i30',
    'Ioniq 5 N': 'Ioniq',
    'Cayman GT4': 'Cayman',
    'Aventador SVJ': 'Aventador',
    'AMG GT R': 'AMG GT',
    'AMG GT Black Series': 'AMG GT',
    'M3 CS': 'M3',
    'Model S Plaid': 'Model S',
    'Model 3 Performance': 'Model 3',
    'Model X Plaid': 'Model X',
  };
  return baseModelMap[model] || model;
}

function getEntriesForCategory(category: SpeedCategory): ModelEntry[] {
  const dataMap = category === '0-100' ? ACCELERATION_DATA : category === '0-200' ? ACCELERATION_0_200 : ACCELERATION_100_200;
  const entries: ModelEntry[] = [];
  for (const [make, models] of Object.entries(dataMap)) {
    for (const [model, time] of Object.entries(models)) {
      entries.push({ make, model, searchTerm: getBaseModel(model), time });
    }
  }
  return entries.sort((a, b) => a.time - b.time);
}

export function LeaderboardPage() {
  const { locale } = useLanguage();
  const [category, setCategory] = useState<SpeedCategory>('0-100');

  useEffect(() => {
    document.title = `${category} km/h Leaderboard | OTO`;
    return () => { document.title = 'OTO — Online Top Occasions'; };
  }, [category]);

  const entries = useMemo(() => getEntriesForCategory(category), [category]);

  return (
    <PageTransition>
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-surface-400 transition-colors hover:text-brand-accent">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        {locale === 'nl' ? 'Terug' : 'Back'}
      </Link>

      <div className="mt-6">
        <h1 className="text-2xl font-bold text-surface-900 dark:text-white">
          ⚡ Sprint Leaderboard
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          {locale === 'nl' ? 'De snelste auto\'s, gerangschikt op acceleratie' : 'The fastest cars, ranked by acceleration'}
        </p>
      </div>

      {/* Speed category toggle */}
      <div className="mt-5 inline-flex items-center gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1 dark:border-white/[0.1] dark:bg-white/[0.04]">
        {(['0-100', '0-200', '100-200'] as SpeedCategory[]).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              category === cat
                ? 'bg-brand-accent text-white shadow-sm'
                : 'text-surface-500 hover:text-surface-900 dark:text-surface-400 dark:hover:text-white'
            }`}
          >
            {cat} km/h
          </button>
        ))}
      </div>

      {/* Leaderboard list */}
      <div className="mt-6 space-y-2">
        {entries.map((entry, index) => {
          const logo = getMakeLogo(entry.make);
          return (
            <a
              key={`${entry.make}-${entry.model}`}
              href={`/?q=${encodeURIComponent(entry.make + ' ' + entry.model)}`}
              className="group flex items-center gap-4 rounded-xl border border-surface-100 bg-white p-4 transition-all hover:border-brand-accent/30 hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-brand-accent/30"
            >
              {/* Rank */}
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                index === 1 ? 'bg-surface-200 text-surface-600 dark:bg-surface-700 dark:text-surface-300' :
                index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                'bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400'
              }`}>
                {index + 1}
              </div>

              {/* Brand logo */}
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                {logo ? (
                  <img src={logo} alt={entry.make} className="h-7 w-7 object-contain" loading="lazy" />
                ) : (
                  <span className="text-xs font-bold text-surface-400">{entry.make.charAt(0)}</span>
                )}
              </div>

              {/* Make + Model */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-surface-900 group-hover:text-brand-accent dark:text-white truncate">
                  {entry.make} {entry.model}
                </p>
                <p className="text-[11px] text-surface-400">
                  {locale === 'nl' ? 'Bekijk advertenties' : 'View listings'} →
                </p>
              </div>

              {/* Time */}
              <div className="shrink-0 text-right">
                <p className="text-xl font-bold text-brand-accent">{entry.time}s</p>
                <p className="text-[10px] text-surface-400">{category} km/h</p>
              </div>
            </a>
          );
        })}

        {entries.length === 0 && (
          <p className="py-8 text-center text-sm text-surface-400">
            {locale === 'nl' ? 'Geen data beschikbaar voor deze categorie' : 'No data available for this category'}
          </p>
        )}
      </div>
    </div>
    </PageTransition>
  );
}
