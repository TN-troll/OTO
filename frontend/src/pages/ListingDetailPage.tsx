import { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { SoundProfile } from '@car-ads/shared';
import { useLanguage } from '../i18n';
import { useRecentlyViewed } from '../hooks/useRecentlyViewed';
import { ListingCard } from '../components/ListingCard';

/** Extended listing type as returned by the detail API (includes nested soundProfile) */
interface ListingDetail {
  id: string;
  title: string;
  description: string | null;
  descriptionEn: string | null;
  price: number;
  mileage: number | null;
  year: number;
  make: string;
  model: string;
  engineDisplacementCc: number | null;
  horsepower: number | null;
  location: string | null;
  sellerType: string | null;
  transmissionType: string | null;
  fuelType: string | null;
  imageUrls: string[];
  sourceUrls: { marketplace: string; url: string; externalId: string; lastChecked: string; isActive: boolean }[];
  soundProfile: SoundProfile | null;
  status: string;
  curationCriteria: string[];
  dateAdded: string;
  lastVerified: string;
  createdAt: string;
  updatedAt: string;
  marketAvgPrice: number | null;
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const { addViewed } = useRecentlyViewed();

  const { data: listing, isLoading, error } = useQuery<ListingDetail>({
    queryKey: ['listing', id],
    queryFn: () => api.getListing(id!) as unknown as Promise<ListingDetail>,
    enabled: !!id,
  });

  // Track recently viewed
  useEffect(() => {
    if (id) {
      addViewed(id);
    }
  }, [id, addViewed]);

  // Fetch similar cars
  const { data: similarListings } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => api.getSimilarListings(id!),
    enabled: !!id,
  });

  // Fetch price history
  const { data: priceHistoryData } = useQuery({
    queryKey: ['priceHistory', id],
    queryFn: () => api.getPriceHistory(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" />
          <span className="text-sm text-surface-500 dark:text-surface-400">Loading listing details...</span>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="rounded-xl bg-white p-8 shadow-premium text-center dark:bg-surface-800">
          <p className="text-base font-semibold text-red-600 dark:text-red-400">Failed to load listing details.</p>
          <Link to="/" className="mt-4 inline-block text-sm font-medium text-brand-accent hover:underline">
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <Link to="/" className="inline-flex items-center gap-1 text-sm font-medium text-surface-600 transition-colors hover:text-brand-accent dark:text-surface-400 dark:hover:text-brand-accent">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t.backToListings}
      </Link>

      {/* Image Gallery */}
      <ImageGallery
        imageUrls={listing.imageUrls}
        alt={`${listing.make} ${listing.model}`}
      />

      {/* Main Content */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-premium dark:bg-surface-800">
        <div className="p-6 sm:p-8">
          {/* Title and Price */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-surface-900 sm:text-3xl dark:text-white">
                {listing.make} {listing.model}
              </h1>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                {listing.year} • {t.lastVerified} {formatDateTime(listing.lastVerified)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="rounded-xl bg-surface-50 px-5 py-3 dark:bg-surface-700">
                <p className="text-3xl font-bold text-brand dark:text-brand-accent">
                  €{Math.round(listing.price).toLocaleString('nl-NL')}
                </p>
              </div>
              <MarketValueBadge price={listing.price} marketAvgPrice={listing.marketAvgPrice} />
            </div>
          </div>

          {/* Share Buttons */}
          <ShareButtons listing={listing} />

          {/* Specifications Grid */}
          <SpecificationsSection listing={listing} />

          {/* Price History */}
          <PriceHistorySection history={priceHistoryData?.history} />

          {/* Description */}
          {listing.description && (
            <DescriptionSection
              description={listing.description}
              descriptionEn={listing.descriptionEn}
            />
          )}

          {/* Sound Profile Section */}
          <SoundProfileSection soundProfile={listing.soundProfile} />

          {/* Source Links */}
          <SourceLinksSection sourceUrls={listing.sourceUrls} />
        </div>
      </div>

      {/* Similar Cars Section */}
      {similarListings && similarListings.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white">Similar Cars</h2>
          <div className="mt-4 flex gap-4 overflow-x-auto pb-4">
            {similarListings.map((similar, index) => (
              <div key={similar.id} className="w-72 flex-shrink-0">
                <ListingCard listing={similar} featured={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Description section with language-aware display */
function DescriptionSection({ description, descriptionEn }: { description: string; descriptionEn: string | null }) {
  const { t, locale } = useLanguage();

  // Show English translation if user is in EN mode and translation is available
  const displayText = locale === 'en' && descriptionEn ? descriptionEn : description;
  const isTranslated = locale === 'en' && descriptionEn !== null;

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-surface-900 dark:text-white">{t.adDescription}</h2>
        {isTranslated && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-[10px] font-medium text-primary-700 dark:bg-surface-700 dark:text-surface-300">
            🌐 Translated
          </span>
        )}
        {locale === 'en' && !descriptionEn && (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-100 px-2.5 py-1 text-[10px] font-medium text-surface-500 dark:bg-surface-700 dark:text-surface-400">
            🇳🇱 Original (NL)
          </span>
        )}
      </div>
      <div
        className="mt-4 text-sm leading-relaxed text-surface-700 dark:text-surface-300 [&_br]:block [&_strong]:font-bold [&_strong]:text-surface-900 dark:[&_strong]:text-white [&_a]:text-brand-accent [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2"
        dangerouslySetInnerHTML={{ __html: displayText }}
      />
    </div>
  );
}

/** Image gallery with main image and thumbnail navigation */
function ImageGallery({ imageUrls, alt }: { imageUrls: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-2xl bg-surface-100 text-surface-400 dark:bg-surface-700 dark:text-surface-500">
        No images available
      </div>
    );
  }

  const canGoLeft = activeIndex > 0;
  const canGoRight = activeIndex < imageUrls.length - 1;

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative overflow-hidden rounded-2xl bg-surface-100 shadow-premium dark:bg-surface-700">
        {!imageError ? (
          <img
            src={imageUrls[activeIndex]}
            alt={`${alt} - image ${activeIndex + 1}`}
            className="mx-auto max-h-[550px] w-full cursor-zoom-in object-contain"
            onError={() => setImageError(true)}
            onClick={() => setLightboxOpen(true)}
          />
        ) : (
          <div className="flex aspect-video items-center justify-center">
            <svg className="h-16 w-16 text-surface-300 dark:text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}

        {/* Left Arrow */}
        {canGoLeft && (
          <button
            onClick={() => { setActiveIndex((i) => i - 1); setImageError(false); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg transition-all hover:bg-white hover:scale-105 dark:bg-surface-800/90 dark:hover:bg-surface-800"
            aria-label="Previous image"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {/* Right Arrow */}
        {canGoRight && (
          <button
            onClick={() => { setActiveIndex((i) => i + 1); setImageError(false); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 shadow-lg transition-all hover:bg-white hover:scale-105 dark:bg-surface-800/90 dark:hover:bg-surface-800"
            aria-label="Next image"
          >
            <ChevronRightIcon />
          </button>
        )}

        {/* Image counter */}
        <div className="absolute bottom-3 right-3 rounded-lg bg-brand/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {activeIndex + 1} / {imageUrls.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => { setActiveIndex(index); setImageError(false); }}
              className={`h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-200 ${
                index === activeIndex
                  ? 'ring-2 ring-brand-accent ring-offset-2 dark:ring-offset-surface-900'
                  : 'opacity-60 hover:opacity-100'
              }`}
              aria-label={`View image ${index + 1}`}
            >
              <img
                src={url}
                alt={`${alt} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <LightboxOverlay
          imageUrls={imageUrls}
          activeIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setActiveIndex((i) => Math.max(0, i - 1))}
          onNext={() => setActiveIndex((i) => Math.min(imageUrls.length - 1, i + 1))}
        />
      )}
    </div>
  );
}

/** All specifications displayed in a structured grid */
function SpecificationsSection({ listing }: { listing: ListingDetail }) {
  const { t } = useLanguage();

  const specs = [
    { label: t.horsepower, value: listing.horsepower ? `${listing.horsepower} HP` : null },
    { label: t.engineDisplacement, value: listing.engineDisplacementCc ? `${listing.engineDisplacementCc} cc` : null },
    { label: t.mileage, value: listing.mileage != null ? `${listing.mileage.toLocaleString('nl-NL')} km` : null },
    { label: t.transmission, value: listing.transmissionType ? capitalize(listing.transmissionType) : null },
    { label: t.fuelType, value: listing.fuelType ? capitalize(listing.fuelType) : null },
    { label: t.location, value: listing.location },
    { label: t.sellerType, value: listing.sellerType ? (listing.sellerType === 'dealer' ? t.dealer : t.private) : null },
    { label: t.year, value: listing.year ? String(listing.year) : null },
    { label: t.dateAdded, value: listing.dateAdded ? formatDate(listing.dateAdded) : null },
  ];

  const displayedSpecs = specs.filter((s) => s.value != null);

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">{t.specifications}</h2>
      <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {displayedSpecs.map((spec) => (
          <div key={spec.label} className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
            <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">{spec.label}</dt>
            <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Sound profile section with audio player */
function SoundProfileSection({ soundProfile }: { soundProfile: SoundProfile | null }) {
  const { t } = useLanguage();

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">{t.soundProfile}</h2>

      {soundProfile ? (
        <div className="mt-4 space-y-5">
          {/* Characteristics */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">{t.engineConfiguration}</dt>
              <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{formatEnumLabel(soundProfile.engineConfiguration)}</dd>
            </div>
            <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">{t.cylinders}</dt>
              <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{soundProfile.cylinderCount}</dd>
            </div>
            <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">{t.induction}</dt>
              <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{formatEnumLabel(soundProfile.forcedInduction)}</dd>
            </div>
            <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">{t.exhaustNote}</dt>
              <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{formatEnumLabel(soundProfile.exhaustNote)}</dd>
            </div>
          </dl>

          {/* Audio Player */}
          <AudioPlayer soundProfileId={soundProfile.id} />
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-surface-50 p-4 dark:bg-surface-700">
          <span className="inline-flex items-center rounded-full bg-surface-200 px-3 py-1 text-xs font-semibold text-surface-600 dark:bg-surface-600 dark:text-surface-300">
            {t.unclassified}
          </span>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            {t.unclassifiedHint}
          </p>
        </div>
      )}
    </div>
  );
}

/** HTML5 audio player with error handling */
function AudioPlayer({ soundProfileId }: { soundProfileId: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioError, setAudioError] = useState(false);
  const { t } = useLanguage();
  const audioUrl = api.getAudioClipUrl(soundProfileId);

  if (audioError) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-700">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          {t.audioUnavailable}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400">{t.engineSoundClip}</p>
      <audio
        ref={audioRef}
        controls
        className="w-full"
        onError={() => setAudioError(true)}
        aria-label="Engine sound clip"
      >
        <source src={audioUrl} type="audio/mpeg" />
        <source src={audioUrl} type="audio/ogg" />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
}

/** Source marketplace links */
function SourceLinksSection({
  sourceUrls,
}: {
  sourceUrls: ListingDetail['sourceUrls'];
}) {
  const { t } = useLanguage();

  if (!sourceUrls || sourceUrls.length === 0) return null;

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">{t.originalAdvertisements}</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {sourceUrls.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-all duration-200 hover:border-brand-accent hover:text-brand-accent hover:shadow-md dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-brand-accent dark:hover:text-brand-accent"
          >
            {t.viewOn} {capitalize(source.marketplace)}
            <ExternalLinkIcon />
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Lightbox Overlay ─── */

function LightboxOverlay({
  imageUrls,
  activeIndex,
  onClose,
  onPrev,
  onNext,
}: {
  imageUrls: string[];
  activeIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const touchStart = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrev, onNext]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = e.changedTouches[0].clientX - touchStart.current;
    if (delta > 50) onPrev();
    else if (delta < -50) onNext();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white transition-colors hover:bg-white/20"
        aria-label="Close lightbox"
      >
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Previous button */}
      {activeIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
          aria-label="Previous image"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <img
        src={imageUrls[activeIndex]}
        alt={`Image ${activeIndex + 1} of ${imageUrls.length}`}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Next button */}
      {activeIndex < imageUrls.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
          aria-label="Next image"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Counter */}
      <div className="absolute bottom-4 text-sm text-white/80">
        {activeIndex + 1} / {imageUrls.length}
      </div>
    </div>
  );
}

/* ─── Price History Section ─── */

function PriceHistorySection({ history }: { history?: { price: number; date: string }[] }) {
  if (!history || history.length < 2) return null;

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">Price History</h2>
      <div className="mt-4 space-y-2">
        {history.map((entry, index) => {
          const prevPrice = index > 0 ? history[index - 1].price : null;
          const diff = prevPrice !== null ? entry.price - prevPrice : null;
          return (
            <div key={index} className="flex items-center justify-between rounded-lg bg-surface-50 px-4 py-2.5 dark:bg-surface-700">
              <span className="text-sm text-surface-600 dark:text-surface-300">
                {new Date(entry.date).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-surface-900 dark:text-white">
                  €{Math.round(entry.price).toLocaleString('nl-NL')}
                </span>
                {diff !== null && diff !== 0 && (
                  <span className={`text-xs font-medium ${diff < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {diff < 0 ? '▼' : '▲'} €{Math.abs(Math.round(diff)).toLocaleString('nl-NL')}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Market Value Badge ─── */

function MarketValueBadge({ price, marketAvgPrice }: { price: number; marketAvgPrice: number | null }) {
  if (!marketAvgPrice) return null;

  const ratio = price / marketAvgPrice;

  let label: string;
  let className: string;
  if (ratio < 0.85) {
    label = 'Below Market';
    className = 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
  } else if (ratio > 1.15) {
    label = 'Above Market';
    className = 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  } else {
    label = 'Fair Price';
    className = 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300';
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {label}
    </span>
  );
}

/* ─── Utility functions ─── */

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatEnumLabel(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/* ─── Share Buttons ─── */

function ShareButtons({ listing }: { listing: ListingDetail }) {
  const [copied, setCopied] = useState(false);

  const url = window.location.href;
  const title = `${listing.make} ${listing.model}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`Check out this ${title}: ${url}`)}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(`${title} on OTO`)}&body=${encodeURIComponent(`Check out this ${title}: ${url}`)}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-4 flex items-center gap-3">
      <span className="text-xs font-medium text-surface-500 dark:text-surface-400">Share:</span>
      <button
        type="button"
        onClick={copyToClipboard}
        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-all hover:border-brand-accent hover:text-brand-accent dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-brand-accent dark:hover:text-brand-accent"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-5.03a4.5 4.5 0 00-6.364-6.364L4.5 8.88a4.5 4.5 0 001.242 7.244" />
        </svg>
        {copied ? 'Link copied!' : 'Copy link'}
      </button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-all hover:border-green-500 hover:text-green-600 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-green-500 dark:hover:text-green-400"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        WhatsApp
      </a>
      <a
        href={emailUrl}
        className="inline-flex items-center gap-1.5 rounded-lg border border-surface-200 bg-white px-3 py-1.5 text-xs font-medium text-surface-700 transition-all hover:border-brand-accent hover:text-brand-accent dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-brand-accent dark:hover:text-brand-accent"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
        Email
      </a>
    </div>
  );
}

/* ─── Icons ─── */

function ChevronLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-surface-700 dark:text-surface-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-surface-700 dark:text-surface-300" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  );
}
