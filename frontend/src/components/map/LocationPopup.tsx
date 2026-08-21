import { Link } from 'react-router-dom';
import type { MapLocation } from '@car-ads/shared';
import { getProxyImageUrl } from '../../utils/imageProxy';

export interface LocationPopupProps {
  /** Location data with aggregated listing information */
  location: MapLocation;
}

/**
 * Formats a price in EUR using Dutch locale.
 * Example: 45000 → "€ 45.000"
 */
function formatPrice(price: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Popup content for a map marker showing location details and listing previews.
 *
 * Premium dark glass design with:
 * - Gold-accented city name header
 * - Up to 3 listing previews with rounded thumbnails and overlay gradients
 * - Formatted prices in gold
 * - Glass background and subtle borders matching OTO dark theme
 *
 * Used inside both a Leaflet Popup (desktop) and MobileBottomSheet (mobile).
 */
export function LocationPopup({ location }: LocationPopupProps) {
  const { city, totalCount, dealerCount, privateCount, previews } = location;
  const displayPreviews = previews.slice(0, 3);

  return (
    <div className="w-64 sm:w-72">
      {/* Header: city name + listing count */}
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-base font-semibold tracking-tight text-brand-accent">
          {city}
        </h3>
        <span className="ml-2 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-medium text-surface-300">
          {totalCount} {totalCount === 1 ? 'listing' : 'listings'}
        </span>
      </div>

      {/* Seller type breakdown */}
      <div className="mb-3 flex gap-2">
        {dealerCount > 0 && (
          <span className="flex items-center gap-1 rounded-lg bg-brand-accent/10 px-2 py-1 text-[10px] font-medium text-brand-accent">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-accent" />
            {dealerCount} dealer
          </span>
        )}
        {privateCount > 0 && (
          <span className="flex items-center gap-1 rounded-lg bg-white/[0.06] px-2 py-1 text-[10px] font-medium text-surface-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-surface-400" />
            {privateCount} private
          </span>
        )}
      </div>

      {/* Listing previews */}
      {displayPreviews.length > 0 && (
        <ul className="space-y-2">
          {displayPreviews.map((preview) => (
            <li key={preview.id}>
              <Link
                to={`/listing/${preview.id}`}
                className="group flex gap-3 rounded-xl p-1.5 transition-all duration-200 hover:bg-white/[0.06]"
              >
                {/* Thumbnail */}
                <div className="relative h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-800">
                  {preview.primaryImageUrl ? (
                    <>
                      <img
                        src={getProxyImageUrl(preview.primaryImageUrl)}
                        alt={`${preview.make} ${preview.model}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Subtle overlay gradient on thumbnail */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="h-5 w-5 text-surface-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Title + price */}
                <div className="flex min-w-0 flex-1 flex-col justify-center">
                  <span className="truncate text-sm font-medium text-white transition-colors duration-150 group-hover:text-brand-accent">
                    {preview.title}
                  </span>
                  <span className="text-xs font-semibold text-brand-accent">
                    {formatPrice(preview.price)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* View all listings link */}
      <Link
        to={`/browse?location=${encodeURIComponent(city)}`}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-surface-200 transition-all duration-200 hover:border-brand-accent/30 hover:bg-brand-accent/10 hover:text-brand-accent"
      >
        View all listings
        <svg
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
          />
        </svg>
      </Link>
    </div>
  );
}
