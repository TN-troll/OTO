import { useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ListingCard } from '../components/ListingCard';
import { DealerRating } from '../components/DealerRating';
import { useLanguage } from '../i18n';
import type { FilterCriteria, SellerType } from '@car-ads/shared';

export function SellerPage() {
  const [params] = useSearchParams();
  const location = params.get('location') || '';
  const sellerType = params.get('type') || 'dealer';
  const { locale } = useLanguage();

  useEffect(() => {
    document.title = `${sellerType === 'dealer' ? 'Dealer' : 'Particulier'} — ${location} | OTO`;
    return () => { document.title = 'OTO — Online Top Occasions'; };
  }, [location, sellerType]);

  const criteria: FilterCriteria = useMemo(() => ({
    location: location || undefined,
    sellerType: sellerType ? [sellerType as SellerType] : undefined,
    pageSize: 50,
  }), [location, sellerType]);

  const { data, isLoading } = useQuery({
    queryKey: ['seller-listings', location, sellerType],
    queryFn: () => api.filterListings(criteria),
    enabled: !!location,
  });

  const listings = data?.listings ?? [];
  const totalCount = data?.totalCount ?? 0;

  return (
    <div className="animate-fade-in space-y-6">
      {/* Back link */}
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-surface-400 transition-colors hover:text-brand-accent">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {locale === 'nl' ? 'Terug naar overzicht' : 'Back to listings'}
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent/10">
            {sellerType === 'dealer' ? (
              <svg className="h-6 w-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">
              {sellerType === 'dealer' ? 'Dealer' : 'Particulier'} — {location}
            </h1>
            <p className="text-sm text-surface-400">
              {totalCount} {locale === 'nl' ? 'advertenties' : 'listings'}
            </p>
            <DealerRating location={location} sellerType={sellerType} />
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-surface-700 border-t-brand-accent" />
        </div>
      )}

      {/* Results grid */}
      {!isLoading && listings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && listings.length === 0 && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-12 text-center">
          <p className="text-surface-400">
            {locale === 'nl' ? 'Geen andere advertenties gevonden' : 'No other listings found'}
          </p>
        </div>
      )}
    </div>
  );
}
