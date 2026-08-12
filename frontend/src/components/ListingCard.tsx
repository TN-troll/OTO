import { useState } from 'react';
import type { ListingSummary } from '@car-ads/shared';

interface ListingCardProps {
  listing: ListingSummary;
  featured?: boolean;
}

function ImagePlaceholder() {
  return (
    <div className="flex h-full items-center justify-center">
      <svg className="h-16 w-16 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
      </svg>
    </div>
  );
}

export function ListingCard({ listing, featured = false }: ListingCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <a
      href={`/listing/${listing.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover dark:bg-surface-800 dark:border dark:border-surface-700 ${
        featured ? 'md:col-span-2 md:row-span-2' : ''
      }`}
      aria-label={`${listing.make} ${listing.model} ${listing.year}`}
    >
      {/* Image */}
      <div className={`relative overflow-hidden bg-surface-100 dark:bg-surface-700 ${featured ? 'aspect-[16/9]' : 'aspect-[3/2]'}`}>
        {listing.primaryImageUrl && !imageError ? (
          <>
            {/* Shimmer skeleton while loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-surface-100 via-surface-200 to-surface-100 dark:from-surface-700 dark:via-surface-600 dark:to-surface-700" />
            )}
            <img
              src={listing.primaryImageUrl}
              alt={`${listing.make} ${listing.model}`}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
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

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Year badge */}
        <div className="absolute left-3 top-3 rounded-md bg-brand/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {listing.year}
        </div>

        {/* Price badge */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-white/95 px-3 py-1.5 shadow-premium backdrop-blur-sm dark:bg-surface-800">
          <span className="text-base font-bold text-brand dark:text-brand-accent">
            €{listing.price.toLocaleString('nl-NL')}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Make & Model */}
        <h3 className="text-base font-bold text-surface-900 transition-colors duration-200 group-hover:text-brand-accent dark:text-white">
          {listing.make}{' '}
          <span className="font-medium text-surface-600 dark:text-surface-300">{listing.model}</span>
        </h3>

        {/* Specs tags */}
        <div className="mt-3 flex flex-wrap gap-2">
          {listing.horsepower != null && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-100 px-2 py-1 text-xs font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-300">
              <svg className="h-3 w-3 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {listing.horsepower} HP
            </span>
          )}
          {listing.engineDisplacementCc != null && (
            <span className="inline-flex items-center rounded-md bg-surface-100 px-2 py-1 text-xs font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-300">
              {(listing.engineDisplacementCc / 1000).toFixed(1)}L
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
