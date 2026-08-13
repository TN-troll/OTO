import { useSearchParams, Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { api } from '../api/client';
import { getProxyImageUrl } from '../utils/imageProxy';

interface ListingDetail {
  id: string;
  title: string;
  price: number;
  mileage: number | null;
  year: number;
  make: string;
  model: string;
  engineDisplacementCc: number | null;
  horsepower: number | null;
  transmissionType: string | null;
  fuelType: string | null;
  imageUrls: string[];
}

export function ComparePage() {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids') || '';
  const ids = idsParam.split(',').filter(Boolean);

  const queries = useQueries({
    queries: ids.map(id => ({
      queryKey: ['listing', id],
      queryFn: () => api.getListing(id) as unknown as Promise<ListingDetail>,
    })),
  });

  const isLoading = queries.some(q => q.isLoading);
  const listings = queries
    .filter(q => q.data)
    .map(q => q.data!);

  if (ids.length < 2) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-surface-600 transition-colors hover:text-brand-accent dark:text-surface-400 dark:hover:text-brand-accent">
          ← Back to listings
        </Link>
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white py-20 dark:bg-surface-800 dark:border-surface-700">
          <p className="text-lg font-semibold text-surface-800 dark:text-white">Select at least 2 cars to compare</p>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">Go back to browse and add cars to compare.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" />
            <span className="text-sm text-surface-500 dark:text-surface-400">Loading comparison...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-surface-600 transition-colors hover:text-brand-accent dark:text-surface-400 dark:hover:text-brand-accent">
        ← Back to listings
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-surface-900 dark:text-white">Compare Cars</h1>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr>
              <th className="w-40 p-3 text-left text-sm font-medium text-surface-500 dark:text-surface-400" />
              {listings.map(listing => (
                <th key={listing.id} className="p-3 text-center">
                  <a href={`/listing/${listing.id}`} className="group block">
                    <div className="mx-auto h-32 w-48 overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-700">
                      {listing.imageUrls?.[0] ? (
                        <img src={getProxyImageUrl(listing.imageUrls[0])} alt={`${listing.make} ${listing.model}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-surface-300">No image</div>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-bold text-surface-900 group-hover:text-brand-accent dark:text-white">
                      {listing.make} {listing.model}
                    </p>
                  </a>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100 dark:divide-surface-700">
            <CompareRow label="Price" listings={listings} render={l => `€${Math.round(l.price).toLocaleString('nl-NL')}`} />
            <CompareRow label="Year" listings={listings} render={l => String(l.year)} />
            <CompareRow label="Horsepower" listings={listings} render={l => l.horsepower ? `${l.horsepower} HP` : '—'} />
            <CompareRow label="Engine" listings={listings} render={l => l.engineDisplacementCc ? `${l.engineDisplacementCc} cc` : '—'} />
            <CompareRow label="Mileage" listings={listings} render={l => l.mileage != null ? `${l.mileage.toLocaleString('nl-NL')} km` : '—'} />
            <CompareRow label="Transmission" listings={listings} render={l => l.transmissionType ? capitalize(l.transmissionType) : '—'} />
            <CompareRow label="Fuel Type" listings={listings} render={l => l.fuelType ? capitalize(l.fuelType) : '—'} />
            <CompareRow label="€/HP" listings={listings} render={l => l.horsepower ? `€${Math.round(l.price / l.horsepower).toLocaleString('nl-NL')}` : '—'} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareRow({ label, listings, render }: { label: string; listings: ListingDetail[]; render: (l: ListingDetail) => string }) {
  return (
    <tr>
      <td className="p-3 text-sm font-medium text-surface-600 dark:text-surface-400">{label}</td>
      {listings.map(listing => (
        <td key={listing.id} className="p-3 text-center text-sm font-semibold text-surface-900 dark:text-white">
          {render(listing)}
        </td>
      ))}
    </tr>
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
