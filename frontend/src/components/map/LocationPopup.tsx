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
 * Renders:
 * - City name and total listing count header
 * - Up to 3 listing previews with image, title, and formatted price
 * - Link per listing to its detail page
 * - "View all listings" link to browse page filtered by location
 *
 * Used inside both a Leaflet Popup (desktop) and MobileBottomSheet (mobile).
 */
export function LocationPopup({ location }: LocationPopupProps) {
  const { city, totalCount, previews } = location;
  const displayPreviews = previews.slice(0, 3);

  return (
    <div className="w-64 sm:w-72">
      {/* Header: city name + listing count */}
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-base font-semibold tracking-tight text-surface-900 dark:text-white">
          {city}
        </h3>
        <span className="ml-2 rounded-full bg-surface-100/80 px-2.5 py-0.5 text-xs font-medium text-surface-600 dark:bg-white/[0.06] dark:text-surface-300">
          {totalCount} {totalCount === 1 ? 'listing' : 'listings'}
        </span>
      </div>

      {/* Listing previews */}
      {displayPreviews.length > 0 && (
        <ul className="space-y-2">
          {displayPreviews.map((preview) => (
            <li key={preview.id}>
              <Link
                to={`/listing/${preview.id}`}
                className="group flex gap-3 rounded-xl p-1.5 transition-colors hover:bg-surface-100/60 dark:hover:bg-white/[0.04]"
              >
                {/* Thumbnail */}
                <div className="h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-100 dark:bg-surface-800">
                  {preview.primaryImageUrl ? (
                    <img
                      src={getProxyImageUrl(preview.primaryImageUrl)}
                      alt={`${preview.make} ${preview.model}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        className="h-5 w-5 text-surface-300 dark:text-surface-600"
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
                  <span className="truncate text-sm font-medium text-surface-900 group-hover:text-accent dark:text-white">
                    {preview.title}
                  </span>
                  <span className="text-xs font-semibold text-accent-gold">
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
        className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-surface-100/80 px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-200/80 dark:bg-white/[0.06] dark:text-surface-200 dark:hover:bg-white/[0.1]"
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
