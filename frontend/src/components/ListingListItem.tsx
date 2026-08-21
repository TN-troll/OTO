import { useState, useRef, useCallback, memo } from 'react';
import type { ListingSummary } from '@car-ads/shared';
import { useFavorites } from '../hooks/useFavorites';
import { useCompare } from '../hooks/useCompare';
import { getProxyImageUrl } from '../utils/imageProxy';
import { formatPrice, formatNumber } from '../utils/formatNumber';
import { getMakeLogo } from '../utils/makeLogos';
import { useLanguage } from '../i18n';

interface ListingListItemProps {
  listing: ListingSummary;
}

function ListingListItemInner({ listing }: ListingListItemProps) {
  const [imgIndex, setImgIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const touchStartX = useRef(0);
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const { locale } = useLanguage();
  const isNew = listing.dateAdded && (Date.now() - new Date(listing.dateAdded).getTime()) < 48 * 60 * 60 * 1000;

  const images = listing.imageUrls?.length > 0 ? listing.imageUrls.slice(0, 4) : (listing.primaryImageUrl ? [listing.primaryImageUrl] : []);
  const hasMultiple = images.length > 1;

  const handleTouchStart = useCallback((e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; }, []);
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!hasMultiple) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setImgIndex((p) => (p + 1) % images.length);
      else setImgIndex((p) => (p - 1 + images.length) % images.length);
    }
  }, [hasMultiple, images.length]);

  return (
    <a
      href={`/listing/${listing.id}`}
      className="group flex overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] shadow-glass-dark backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glass-elevated hover:border-white/[0.12]"
      aria-label={`${listing.make} ${listing.model} ${listing.year}`}
    >
      {/* Image carousel — left side */}
      <div
        className="relative w-48 shrink-0 overflow-hidden sm:w-56 md:w-72"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 0 && !imageError ? (
          <img
            src={getProxyImageUrl(images[imgIndex])}
            alt={`${listing.make} ${listing.model}`}
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:brightness-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-surface-800">
            <svg className="h-10 w-10 text-surface-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>
          </div>
        )}

        {/* Carousel dots */}
        {hasMultiple && (
          <div className="absolute bottom-2 left-1/2 z-[8] flex -translate-x-1/2 gap-1">
            {images.map((_, i) => (
              <button key={i} type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex(i); }}
                className={`h-1.5 rounded-full transition-all ${i === imgIndex ? 'w-3 bg-white' : 'w-1.5 bg-white/50'}`} aria-label={`Image ${i + 1}`} />
            ))}
          </div>
        )}

        {/* Carousel arrows */}
        {hasMultiple && (
          <>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex((imgIndex - 1 + images.length) % images.length); }}
              className="absolute left-1 top-1/2 z-[8] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="Previous">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIndex((imgIndex + 1) % images.length); }}
              className="absolute right-1 top-1/2 z-[8] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="Next">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}

        {/* Badges */}
        {isNew && <div className="absolute left-2 top-2 rounded-full bg-green-500/90 px-2 py-0.5 text-[10px] font-bold text-white">NIEUW</div>}
        {listing.isFeatured && <div className="absolute left-2 top-2 rounded-full bg-accent-gold/90 px-2 py-0.5 text-[10px] font-bold text-white">FEATURED</div>}
        {listing.status === 'sold' && (
          <div className="absolute inset-0 z-[5] flex items-center justify-center bg-black/40"><span className="rounded-full bg-red-600/90 px-3 py-1 text-sm font-bold text-white">Sold</span></div>
        )}
      </div>

      {/* Content — middle */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {/* Title */}
          <h3 className="flex items-center gap-2 text-base font-bold text-white group-hover:text-brand-accent sm:text-lg">
            {getMakeLogo(listing.make) && (
              <img src={getMakeLogo(listing.make)!} alt="" className="h-5 w-5 object-contain" loading="lazy" />
            )}
            {listing.make} <span className="font-medium text-surface-300">{listing.model}</span>
          </h3>

          {/* Key specs — prominent row */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-bold text-brand-accent text-lg">{formatPrice(listing.price, locale)}</span>
            {listing.mileage != null && (
              <span className="flex items-center gap-1 font-medium text-surface-200">
                <svg className="h-3.5 w-3.5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                {formatNumber(listing.mileage, locale)} km
              </span>
            )}
            {listing.horsepower != null && (
              <span className="flex items-center gap-1 text-surface-300">
                <svg className="h-3.5 w-3.5 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                {listing.horsepower} HP
              </span>
            )}
            {listing.engineDisplacementCc != null && (
              <span className="text-surface-400">{(listing.engineDisplacementCc / 1000).toFixed(1)}L</span>
            )}
            <span className="text-surface-400">{listing.year}</span>
          </div>

          {/* Ad description snippet */}
          {listing.snippet && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-surface-400">
              {listing.snippet}{listing.snippet.length >= 145 ? '…' : ''}
            </p>
          )}

          {/* Secondary details */}
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-surface-400">
            {listing.location && (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {listing.location}
              </span>
            )}
            {listing.sellerType && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${listing.sellerType === 'dealer' ? 'bg-brand-accent/10 text-brand-accent' : 'bg-white/[0.06] text-surface-400'}`}>
                {listing.sellerType === 'dealer' ? 'Dealer' : 'Particulier'}
              </span>
            )}
            {listing.fuelType === 'electric' && (
              <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">EV</span>
            )}
            {listing.price > 5000 && (
              <span className="text-surface-500">~€{formatNumber(Math.round(listing.price / 60), locale)}/mnd</span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons — right column */}
      <div className="flex flex-col items-center justify-center gap-2 border-l border-white/[0.06] px-3">
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(listing.id); }}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isFavorite(listing.id) ? 'bg-red-500/15 text-red-500' : 'bg-white/[0.06] text-surface-400 hover:text-red-500'}`}
          aria-label="Favorite">
          <svg className={`h-4 w-4 ${isFavorite(listing.id) ? 'fill-red-500' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
        </button>
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); isInCompare(listing.id) ? removeFromCompare(listing.id) : addToCompare(listing.id); }}
          className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${isInCompare(listing.id) ? 'bg-brand-accent/15 text-brand-accent' : 'bg-white/[0.06] text-surface-400 hover:text-brand-accent'}`}
          aria-label="Compare">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(`${listing.make} ${listing.model} - ${formatPrice(listing.price, locale)}: ${window.location.origin}/listing/${listing.id}`)}`}
          target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-surface-400 transition-colors hover:bg-green-500/15 hover:text-green-500"
          aria-label="WhatsApp">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
        </a>
      </div>
    </a>
  );
}

export const ListingListItem = memo(ListingListItemInner);
