import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ListingCard } from '../components/ListingCard';
import { useLanguage } from '../i18n';
import { getMakeLogo } from '../utils/makeLogos';
import { formatPrice, formatNumber } from '../utils/formatNumber';
import { getAcceleration } from '../data/performance';

export function ModelPage() {
  const { make, model } = useParams<{ make: string; model: string }>();
  const { locale } = useLanguage();
  const decodedMake = decodeURIComponent(make || '');
  const decodedModel = decodeURIComponent(model || '');

  useEffect(() => {
    document.title = `${decodedMake} ${decodedModel} | OTO`;
    return () => { document.title = 'OTO — The Online Trade Occasions Platform'; };
  }, [decodedMake, decodedModel]);

  const { data, isLoading } = useQuery({
    queryKey: ['model-listings', decodedMake, decodedModel],
    queryFn: () => api.filterListings({ makes: [decodedMake], models: [decodedModel], pageSize: 20 }),
    enabled: !!decodedMake && !!decodedModel,
  });

  const listings = data?.listings ?? [];
  const totalCount = data?.totalCount ?? 0;
  const logo = getMakeLogo(decodedMake);
  const acceleration = getAcceleration(decodedMake, decodedModel);

  // Calculate market stats from available listings
  const prices = listings.map(l => l.price).filter(p => p > 0);
  const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null;
  const minPrice = prices.length > 0 ? Math.min(...prices) : null;
  const avgMileage = listings.filter(l => l.mileage).length > 0
    ? Math.round(listings.filter(l => l.mileage).reduce((a, l) => a + (l.mileage || 0), 0) / listings.filter(l => l.mileage).length)
    : null;
  const avgHp = listings.filter(l => l.horsepower).length > 0
    ? Math.round(listings.filter(l => l.horsepower).reduce((a, l) => a + (l.horsepower || 0), 0) / listings.filter(l => l.horsepower).length)
    : null;

  return (
    <div className="animate-fade-in space-y-8">
      <Link to={`/brands/${encodeURIComponent(decodedMake)}`} className="inline-flex items-center gap-1 text-sm font-medium text-surface-400 hover:text-brand-accent">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        {decodedMake}
      </Link>

      {/* Model header */}
      <div className="flex items-center gap-4">
        {logo && <img src={logo} alt={decodedMake} className="h-12 w-12 object-contain" />}
        <div>
          <h1 className="text-3xl font-bold text-surface-900 dark:text-white">{decodedMake} {decodedModel}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            {totalCount} {locale === 'nl' ? 'beschikbaar in Nederland' : 'available in the Netherlands'}
          </p>
        </div>
      </div>

      {/* Market stats */}
      {prices.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {avgPrice && (
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
              <p className="text-[10px] uppercase tracking-wider text-surface-400">{locale === 'nl' ? 'Gem. prijs' : 'Avg price'}</p>
              <p className="mt-1 text-lg font-bold text-surface-900 dark:text-white">{formatPrice(avgPrice, locale)}</p>
            </div>
          )}
          {minPrice && (
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
              <p className="text-[10px] uppercase tracking-wider text-surface-400">{locale === 'nl' ? 'Vanaf' : 'From'}</p>
              <p className="mt-1 text-lg font-bold text-green-600 dark:text-green-400">{formatPrice(minPrice, locale)}</p>
            </div>
          )}
          {avgMileage && (
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
              <p className="text-[10px] uppercase tracking-wider text-surface-400">{locale === 'nl' ? 'Gem. km' : 'Avg km'}</p>
              <p className="mt-1 text-lg font-bold text-surface-900 dark:text-white">{formatNumber(avgMileage, locale)} km</p>
            </div>
          )}
          {avgHp && (
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
              <p className="text-[10px] uppercase tracking-wider text-surface-400">{locale === 'nl' ? 'Gem. vermogen' : 'Avg power'}</p>
              <p className="mt-1 text-lg font-bold text-surface-900 dark:text-white">{avgHp} pk</p>
            </div>
          )}
          {acceleration && (
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-white/[0.08] dark:bg-white/[0.02]">
              <p className="text-[10px] uppercase tracking-wider text-surface-400">0-100 km/h</p>
              <p className="mt-1 text-lg font-bold text-brand-accent">{acceleration}s</p>
            </div>
          )}
        </div>
      )}

      {/* Ownership cost estimate */}
      {avgPrice && (
        <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
            {locale === 'nl' ? '💰 Geschatte maandlasten' : '💰 Estimated monthly costs'}
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
            <div>
              <p className="text-surface-400">{locale === 'nl' ? 'Financiering' : 'Financing'}</p>
              <p className="font-semibold text-surface-900 dark:text-white">~€{Math.round(avgPrice / 60)}/mnd</p>
            </div>
            <div>
              <p className="text-surface-400">{locale === 'nl' ? 'Verzekering' : 'Insurance'}</p>
              <p className="font-semibold text-surface-900 dark:text-white">~€{Math.round(avgPrice * 0.0015 + 80)}/mnd</p>
            </div>
            <div>
              <p className="text-surface-400">{locale === 'nl' ? 'Wegenbelasting' : 'Road tax'}</p>
              <p className="font-semibold text-surface-900 dark:text-white">~€{avgHp ? Math.round(avgHp * 0.4 + 30) : 100}/mnd</p>
            </div>
            <div>
              <p className="text-surface-400">{locale === 'nl' ? 'Totaal geschat' : 'Total est.'}</p>
              <p className="font-bold text-brand-accent">~€{Math.round(avgPrice / 60 + avgPrice * 0.0015 + 80 + (avgHp ? avgHp * 0.4 + 30 : 100))}/mnd</p>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-surface-400 italic">{locale === 'nl' ? 'Indicatief — gebaseerd op gemiddelde waarden' : 'Indicative — based on average values'}</p>
        </div>
      )}

      {/* Listings */}
      <div>
        <h2 className="text-lg font-bold text-surface-900 dark:text-white">
          {locale === 'nl' ? `Alle ${decodedMake} ${decodedModel} advertenties` : `All ${decodedMake} ${decodedModel} listings`}
        </h2>
        {isLoading ? (
          <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" /></div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
        {!isLoading && listings.length === 0 && (
          <p className="py-8 text-center text-sm text-surface-400">{locale === 'nl' ? 'Geen advertenties gevonden' : 'No listings found'}</p>
        )}
      </div>
    </div>
  );
}
