import type { ListingSummary } from '@car-ads/shared';

interface ListingCardProps {
  listing: ListingSummary;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <a
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-card transition-all duration-200 hover:border-gray-300 hover:shadow-card-hover"
      aria-label={`${listing.make} ${listing.model} ${listing.year}`}
    >
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
        {listing.primaryImageUrl ? (
          <img
            src={listing.primaryImageUrl}
            alt={`${listing.make} ${listing.model}`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-300">
            <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
        {/* Year badge */}
        <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
          {listing.year}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Make & Model */}
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
          {listing.make} <span className="font-normal text-gray-700">{listing.model}</span>
        </h3>

        {/* Specs row */}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {listing.horsepower != null && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              {listing.horsepower} pk
            </span>
          )}
          {listing.engineDisplacementCc != null && (
            <span>{(listing.engineDisplacementCc / 1000).toFixed(1)}L</span>
          )}
        </div>

        {/* Price */}
        <div className="mt-auto pt-3">
          <span className="text-lg font-bold text-gray-900">
            €{listing.price.toLocaleString('nl-NL')}
          </span>
        </div>
      </div>
    </a>
  );
}
