import { useState } from 'react';
import type { ListingSummary } from '@car-ads/shared';

interface ListingListItemProps {
  listing: ListingSummary;
}

function ImagePlaceholder() {
  return (
    <div className="flex h-full items-center justify-center bg-surface-100 dark:bg-surface-700">
      <svg className="h-10 w-10 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    </div>
  );
}

export function ListingListItem({ listing }: ListingListItemProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <a
      href={`/listing/${listing.id}`}
      className="group flex overflow-hidden rounded-xl bg-white shadow-card transition-all duration-200 hover:shadow-card-hover dark:bg-surface-800 dark:border dark:border-surface-700"
      aria-label={`${listing.make} ${listing.model} ${listing.year}`}
    >
      {/* Image — left side */}
      <div className="relative w-48 shrink-0 overflow-hidden sm:w-56 md:w-64">
        {listing.primaryImageUrl && !imageError ? (
          <>
            {/* Shimmer skeleton while loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-surface-100 via-surface-200 to-surface-100 dark:from-surface-700 dark:via-surface-600 dark:to-surface-700" />
            )}
            <img
              src={listing.primaryImageUrl}
              alt={`${listing.make} ${listing.model}`}
              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <ImagePlaceholder />
        )}
        {/* Year badge */}
        <div className="absolute left-2 top-2 rounded bg-brand/80 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
          {listing.year}
        </div>
      </div>

      {/* Content — right side */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          {/* Title */}
          <h3 className="text-base font-bold text-surface-900 group-hover:text-brand-accent dark:text-white">
            {listing.make}{' '}
            <span className="font-medium text-surface-600 dark:text-surface-300">{listing.model}</span>
          </h3>

          {/* Specs row */}
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-surface-500 dark:text-surface-400">
            {listing.horsepower != null && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {listing.horsepower} HP
              </span>
            )}
            {listing.engineDisplacementCc != null && (
              <span>{(listing.engineDisplacementCc / 1000).toFixed(1)}L</span>
            )}
            <span>{listing.year}</span>
          </div>
        </div>

        {/* Price — bottom right */}
        <div className="mt-3 flex items-end justify-between">
          <span className="text-xl font-bold text-brand dark:text-brand-accent">
            €{listing.price.toLocaleString('nl-NL')}
          </span>
        </div>
      </div>
    </a>
  );
}
