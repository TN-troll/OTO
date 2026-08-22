import { useState, useEffect, useRef, useCallback, memo } from 'react';
import type { ListingSummary } from '@car-ads/shared';
import { useFavorites } from '../hooks/useFavorites';
import { useCompare } from '../hooks/useCompare';
import { getProxyImageUrl } from '../utils/imageProxy';
import { formatPrice, formatNumber } from '../utils/formatNumber';
import { getMakeLogo } from '../utils/makeLogos';
import { useLanguage } from '../i18n';

// Track last visit time — set on first card render each session
if (typeof window !== 'undefined') {
  const SESSION_KEY = 'oto-visit-session';
  if (!sessionStorage.getItem(SESSION_KEY)) {
    // Only update lastVisit if this is a new session (tab/window)
    sessionStorage.setItem(SESSION_KEY, '1');
    const prev = localStorage.getItem('oto-last-visit');
    if (prev) {
      // Keep the previous visit timestamp as reference for "new since last visit"
      // Update it AFTER reading, so cards rendered in this session compare against the OLD value
      setTimeout(() => localStorage.setItem('oto-last-visit', new Date().toISOString()), 5000);
    } else {
      localStorage.setItem('oto-last-visit', new Date().toISOString());
    }
  }
}

interface ListingCardProps {
  listing: ListingSummary;
  featured?: boolean;
  /** When true, uses loading="eager" and fetchPriority="high" for above-the-fold images */
  priority?: boolean;
}

function ImagePlaceholder({ loading = false }: { loading?: boolean }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center bg-surface-100 dark:bg-surface-800 ${loading ? 'animate-pulse' : ''}`}
      role="img"
      aria-label="Image could not be loaded"
    >
      <svg
        className="h-16 w-16 text-surface-300 dark:text-surface-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1}
          d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25m-2.25 0h-2.25m0 0V6.375c0-.621-.504-1.125-1.125-1.125H4.125C3.504 5.25 3 5.754 3 6.375v8.084M12 9.75H9.75"
        />
      </svg>
    </div>
  );
}

function ListingCardInner({ listing, featured = false, priority = false }: ListingCardProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageTimedOut, setImageTimedOut] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartX = useRef(0);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { locale } = useLanguage();

  const isNew = listing.dateAdded && (Date.now() - new Date(listing.dateAdded).getTime()) < 48 * 60 * 60 * 1000;
  const isFeaturedCard = featured || listing.isFeatured;

  const images = listing.imageUrls?.length > 0 ? listing.imageUrls.slice(0, 4) : (listing.primaryImageUrl ? [listing.primaryImageUrl] : []);
  const hasMultiple = images.length > 1;

  const isNewSinceLastVisit = (() => {
    try {
      const lastVisit = localStorage.getItem('oto-last-visit');
      if (!lastVisit) return false;
      return new Date(listing.dateAdded) > new Date(lastVisit);
    } catch { return false; }
  })();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!hasMultiple) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setImgIndex((prev) => (prev + 1) % images.length);
      else setImgIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  }, [hasMultiple, images.length]);

  // 10-second timeout: if image hasn't loaded, show pulsing placeholder
  useEffect(() => {
    if (images.length > 0 && !imageLoaded && !imageError) {
      timeoutRef.current = setTimeout(() => {
        setImageTimedOut(true);
      }, 10000);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [images.length, imageLoaded, imageError]);

  // Clear timeout when image loads or errors
  useEffect(() => {
    if (imageLoaded || imageError) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [imageLoaded, imageError]);

  return (
    <a
      href={`/listing/${listing.id}`}
      className={[
        // Base — Apple glass card
        'group relative flex flex-col overflow-hidden rounded-[20px]',
        'bg-white/60 backdrop-blur-xl dark:bg-white/[0.04]',
        'border border-white/20 dark:border-white/[0.08]',
        'shadow-glass dark:shadow-glass-dark',
        // Transition — spring-based with reduced motion support
        'will-change-transform transition-[transform,opacity,box-shadow] duration-300 ease-smooth',
        'motion-reduce:transition-none motion-reduce:transform-none',
        // Hover — lift with elevated shadow
        'hover:-translate-y-1 hover:shadow-glass-elevated',
        'hover:bg-white/70 dark:hover:bg-white/[0.06]',
        'hover:border-white/30 dark:hover:border-white/[0.12]',
        // Focus — visible ring for keyboard navigation (3:1 contrast)
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        // Active/Touch — match hover elevation on touch-hold
        'active:-translate-y-1 active:shadow-glass-elevated',
        // Featured variant — gold vibrancy tint + ring
        isFeaturedCard
          ? 'md:col-span-2 bg-[rgba(212,168,83,0.04)] ring-1 ring-[rgba(212,168,83,0.2)]'
          : '',
      ].join(' ')}
      aria-label={`${listing.make} ${listing.model} ${listing.year}`}
    >
      {/* Image container with fixed aspect ratio */}
      <div
        className={`relative overflow-hidden ${isFeaturedCard ? 'aspect-[16/9]' : 'aspect-[3/2]'}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 0 && !imageError && !imageTimedOut ? (
          <>
            {/* Shimmer skeleton while loading */}
            {!imageLoaded && (
              <div className="absolute inset-0 animate-shimmer motion-reduce:animate-none bg-gradient-to-r from-surface-100 via-surface-200 to-surface-100 bg-[length:200%_100%] dark:from-surface-800 dark:via-surface-700 dark:to-surface-800" />
            )}
            <img
              src={getProxyImageUrl(images[imgIndex])}
              alt={`${listing.make} ${listing.model}`}
              className={[
                'h-full w-full object-cover',
                'transition-transform duration-500 ease-smooth',
                'group-hover:scale-[1.05] group-hover:brightness-105',
                'motion-reduce:transition-none motion-reduce:transform-none',
                imageLoaded ? 'opacity-100' : 'opacity-0',
              ].join(' ')}
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : undefined}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : imageTimedOut && !imageError ? (
          <ImagePlaceholder loading={true} />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Gradient overlay — bottom fade from-black/50 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* Carousel dots */}
        {hasMultiple && (
          <div className="absolute bottom-12 left-1/2 z-[8] flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex(i); }}
                className={`h-1.5 rounded-full transition-all duration-200 ${i === imgIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Carousel prev/next arrows (visible on hover) */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex((imgIndex - 1 + images.length) % images.length); }}
              className="absolute left-2 top-1/2 z-[8] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex((imgIndex + 1) % images.length); }}
              className="absolute right-2 top-1/2 z-[8] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100"
              aria-label="Next image"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Year badge — glass pill */}
        <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
          {listing.year}
        </div>

        {/* Featured badge */}
        {isFeaturedCard && (
          <div className="absolute left-4 top-11 flex items-center gap-1 rounded-full bg-accent-gold/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-glow-gold backdrop-blur-sm">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            FEATURED
          </div>
        )}

        {/* Nieuw badge */}
        {isNew && !isFeaturedCard && (
          <div className="absolute left-4 top-11 rounded-full bg-green-500/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            NIEUW
          </div>
        )}
        {isNew && isFeaturedCard && (
          <div className="absolute left-4 top-[4.5rem] rounded-full bg-green-500/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            NIEUW
          </div>
        )}

        {/* New since last visit (but not brand new) */}
        {!isNew && isNewSinceLastVisit && !isFeaturedCard && (
          <div className="absolute left-4 top-11 rounded-full bg-blue-500/90 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            RECENT
          </div>
        )}

        {/* Sold overlay badge */}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <span className="rounded-full bg-red-600/90 px-5 py-2.5 text-lg font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md">
              Sold
            </span>
          </div>
        )}

        {/* Image counter badge */}
        {hasMultiple && (
          <div className="absolute left-4 bottom-4 z-[8] rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
            {imgIndex + 1}/{images.length}
          </div>
        )}
      </div>

      {/* Content — generous padding, clean hierarchy */}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Price */}
        <div className="flex items-baseline justify-between">
          <span className="text-xl font-bold text-brand dark:text-brand-accent">
            {formatPrice(listing.price, locale)}
          </span>
        </div>

        {/* Make & Model — tracking-tight, 17px semibold */}
        <h3 className="flex items-center gap-1.5 text-[17px] font-semibold tracking-tight text-surface-900 dark:text-white">
          {getMakeLogo(listing.make) && (
            <img src={getMakeLogo(listing.make)!} alt="" className="h-4 w-4 object-contain" loading="lazy" />
          )}
          {listing.make}
          <span className="ml-1 font-normal text-surface-500 dark:text-surface-400">
            {listing.model}
          </span>
        </h3>

        {/* Spec pills — max 3 key specs */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {listing.mileage != null && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-100/80 px-2 py-1 text-[11px] font-medium text-surface-600 dark:bg-white/[0.06] dark:text-surface-300">
              {formatNumber(listing.mileage, locale)} km
            </span>
          )}
          {listing.horsepower != null && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-100/80 px-2 py-1 text-[11px] font-medium text-surface-600 dark:bg-white/[0.06] dark:text-surface-300">
              {listing.horsepower} pk
            </span>
          )}
          {listing.engineDisplacementCc != null && (
            <span className="inline-flex items-center rounded-md bg-surface-100/80 px-2 py-1 text-[11px] font-medium text-surface-600 dark:bg-white/[0.06] dark:text-surface-300">
              {(listing.engineDisplacementCc / 1000).toFixed(1)}L
            </span>
          )}
        </div>

        {/* Deal badge */}
        {listing.marketAvgPrice != null && listing.price < listing.marketAvgPrice && (
          <div className="mt-2 flex items-center gap-1">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:bg-green-500/15 dark:text-green-400">
              <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              €{formatNumber(Math.round(listing.marketAvgPrice - listing.price), locale)} {locale === 'nl' ? 'onder markt' : 'below market'}
            </span>
          </div>
        )}

        {/* Location + Seller type */}
        {(listing.location || listing.sellerType) && (
          <div className="mt-auto pt-3 flex items-center gap-2 text-xs text-surface-400">
            {listing.location && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.location}
              </span>
            )}
            {listing.sellerType && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${listing.sellerType === 'dealer' ? 'bg-brand-accent/10 text-brand-accent' : 'bg-surface-100 text-surface-500 dark:bg-white/[0.06] dark:text-surface-400'}`}>
                {listing.sellerType === 'dealer' ? 'Dealer' : 'Particulier'}
              </span>
            )}
          </div>
        )}

        {/* Action buttons row */}
        <div className="mt-3 flex items-center gap-2 border-t border-surface-100 pt-3 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(listing.id); }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isFavorite(listing.id) ? 'bg-red-500/10 text-red-500' : 'bg-surface-100 text-surface-400 hover:text-red-500 dark:bg-white/[0.06]'}`}
            aria-label={isFavorite(listing.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg className={`h-4 w-4 ${isFavorite(listing.id) ? 'fill-red-500' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(listing.id) ? removeFromCompare(listing.id) : addToCompare(listing.id); }}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${isInCompare(listing.id) ? 'bg-brand-accent/15 text-brand-accent' : 'bg-surface-100 text-surface-400 hover:text-brand-accent dark:bg-white/[0.06]'}`}
            aria-label={isInCompare(listing.id) ? 'Remove from compare' : 'Add to compare'}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${listing.make} ${listing.model} ${listing.year} - ${formatPrice(listing.price, locale)}: ${window.location.origin}/listing/${listing.id}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-100 text-surface-400 transition-colors hover:bg-green-500/10 hover:text-green-500 dark:bg-white/[0.06]"
            aria-label="Share via WhatsApp"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      </div>
    </a>
  );
}

export const ListingCard = memo(ListingCardInner);
