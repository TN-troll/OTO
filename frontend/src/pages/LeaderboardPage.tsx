import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { getAcceleration } from '../data/performance';
import { getProxyImageUrl } from '../utils/imageProxy';
import { useLanguage } from '../i18n';
import { formatPrice } from '../utils/formatNumber';

export function LeaderboardPage() {
  const { locale } = useLanguage();
  const { data, isLoading } = useQuery({
    queryKey: ['listings', { page: 1, pageSize: 100, sortBy: 'horsepower', sortOrder: 'desc' }],
    queryFn: () => api.getListings({ page: 1, pageSize: 100, sortBy: 'horsepower', sortOrder: 'desc' }),
  });

  // Calculate 0-100 for each listing and sort
  const rankedListings = (data?.listings || [])
    .map(listing => ({
      ...listing,
      acceleration: getAcceleration(listing.make, listing.model),
    }))
    .filter(l => l.acceleration !== null)
    .sort((a, b) => (a.acceleration as number) - (b.acceleration as number))
    .slice(0, 30);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-surface-600 transition-colors hover:text-brand-accent dark:text-surface-400">
        ← Back to listings
      </Link>
      
      <h1 className="mt-6 text-2xl font-bold text-surface-900 dark:text-white">🏁 0-100 km/h Leaderboard</h1>
      <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">The fastest cars currently listed on OTO, ranked by acceleration</p>

      {isLoading ? (
        <div className="mt-8 flex items-center justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-surface-200 border-t-brand-accent" />
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {rankedListings.map((listing, index) => (
            <a
              key={listing.id}
              href={`/listing/${listing.id}`}
              className="group flex items-center gap-4 rounded-xl bg-white p-4 shadow-card transition-all hover:shadow-card-hover dark:bg-surface-800"
            >
              {/* Rank */}
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                index === 0 ? 'bg-yellow-100 text-yellow-800' :
                index === 1 ? 'bg-surface-200 text-surface-700' :
                index === 2 ? 'bg-orange-100 text-orange-800' :
                'bg-surface-100 text-surface-600 dark:bg-surface-700 dark:text-surface-300'
              }`}>
                {index + 1}
              </div>

              {/* Image */}
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-700">
                {listing.primaryImageUrl ? (
                  <img src={getProxyImageUrl(listing.primaryImageUrl)} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-surface-900 group-hover:text-brand-accent dark:text-white truncate">
                  {listing.make} {listing.model}
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">
                  {listing.horsepower} HP • {listing.year} • {formatPrice(listing.price, locale)}
                </p>
              </div>

              {/* Acceleration time */}
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-brand-accent">{listing.acceleration}s</p>
                <p className="text-[10px] text-surface-400">0-100 km/h</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
