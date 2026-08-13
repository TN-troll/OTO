import { useState } from 'react';
import type { ListingSummary } from '@car-ads/shared';
import { useFavorites } from '../hooks/useFavorites';
import { useCompare } from '../hooks/useCompare';
import { getProxyImageUrl } from '../utils/imageProxy';

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
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const isNew = listing.dateAdded && (Date.now() - new Date(listing.dateAdded).getTime()) < 48 * 60 * 60 * 1000;
  const pricePerHp = listing.horsepower ? Math.round(listing.price / listing.horsepower) : null;

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
              src={getProxyImageUrl(listing.primaryImageUrl)}
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

        {/* Featured badge */}
        {listing.isFeatured && (
          <div className="absolute left-2 top-8 flex items-center gap-1 rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            FEATURED
          </div>
        )}

        {/* Nieuw badge */}
        {isNew && !listing.isFeatured && (
          <div className="absolute left-2 top-8 rounded-md bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
            NIEUW
          </div>
        )}
        {isNew && listing.isFeatured && (
          <div className="absolute left-2 top-[34px] rounded-md bg-green-500 px-2 py-0.5 text-[10px] font-bold text-white">
            NIEUW
          </div>
        )}

        {/* Sold overlay badge */}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/40">
            <span className="rounded-lg bg-red-600/90 px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-sm">
              Sold
            </span>
          </div>
        )}

        {/* Favorite button */}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(listing.id); }}
          className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-2 shadow-md backdrop-blur-sm transition-all hover:scale-110 dark:bg-surface-800/90"
          aria-label={isFavorite(listing.id) ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg className={`h-4 w-4 ${isFavorite(listing.id) ? 'fill-red-500 text-red-500' : 'fill-none text-surface-600 dark:text-surface-300'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
        </button>

        {/* Compare button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isInCompare(listing.id)) {
              removeFromCompare(listing.id);
            } else {
              addToCompare(listing.id);
            }
          }}
          className={`absolute right-2 top-12 z-10 rounded-full p-2 shadow-md backdrop-blur-sm transition-all hover:scale-110 ${
            isInCompare(listing.id) ? 'bg-brand-accent/90 text-white' : 'bg-white/90 dark:bg-surface-800/90'
          }`}
          aria-label={isInCompare(listing.id) ? 'Remove from compare' : 'Add to compare'}
        >
          <svg className={`h-4 w-4 ${isInCompare(listing.id) ? 'text-white' : 'text-surface-600 dark:text-surface-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
        </button>
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
            {pricePerHp != null && (
              <span className="inline-flex items-center rounded-md bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-300">
                €{pricePerHp.toLocaleString('nl-NL')}/HP
              </span>
            )}
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
