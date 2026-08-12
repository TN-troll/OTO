import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { SoundProfile } from '@car-ads/shared';

/** Extended listing type as returned by the detail API (includes nested soundProfile) */
interface ListingDetail {
  id: string;
  title: string;
  description: string | null;
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
}

export function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: listing, isLoading, error } = useQuery<ListingDetail>({
    queryKey: ['listing', id],
    queryFn: () => api.getListing(id!) as unknown as Promise<ListingDetail>,
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
        Back to listings
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
                {listing.year} • Last verified: {formatDateTime(listing.lastVerified)}
              </p>
            </div>
            <div className="rounded-xl bg-surface-50 px-5 py-3 dark:bg-surface-700">
              <p className="text-3xl font-bold text-brand dark:text-brand-accent">
                €{listing.price?.toLocaleString('nl-NL')}
              </p>
            </div>
          </div>

          {/* Specifications Grid */}
          <SpecificationsSection listing={listing} />

          {/* Description */}
          {listing.description && (
            <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
              <h2 className="text-lg font-bold text-surface-900 dark:text-white">Advertentietekst</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-surface-700 dark:text-surface-300">
                {listing.description}
              </p>
            </div>
          )}

          {/* Sound Profile Section */}
          <SoundProfileSection soundProfile={listing.soundProfile} />

          {/* Source Links */}
          <SourceLinksSection sourceUrls={listing.sourceUrls} />
        </div>
      </div>
    </div>
  );
}

/** Image gallery with main image and thumbnail navigation */
function ImageGallery({ imageUrls, alt }: { imageUrls: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

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
            className="mx-auto max-h-[550px] w-full object-contain"
            onError={() => setImageError(true)}
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
    </div>
  );
}

/** All specifications displayed in a structured grid */
function SpecificationsSection({ listing }: { listing: ListingDetail }) {
  const specs = [
    { label: 'Horsepower', value: listing.horsepower ? `${listing.horsepower} HP` : null },
    { label: 'Engine Displacement', value: listing.engineDisplacementCc ? `${listing.engineDisplacementCc} cc` : null },
    { label: 'Mileage', value: listing.mileage != null ? `${listing.mileage.toLocaleString('nl-NL')} km` : null },
    { label: 'Transmission', value: listing.transmissionType ? capitalize(listing.transmissionType) : null },
    { label: 'Fuel Type', value: listing.fuelType ? capitalize(listing.fuelType) : null },
    { label: 'Location', value: listing.location },
    { label: 'Seller Type', value: listing.sellerType ? capitalize(listing.sellerType) : null },
    { label: 'Year', value: listing.year ? String(listing.year) : null },
    { label: 'Date Added', value: listing.dateAdded ? formatDate(listing.dateAdded) : null },
  ];

  const displayedSpecs = specs.filter((s) => s.value != null);

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">Specifications</h2>
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
  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">Sound Profile</h2>

      {soundProfile ? (
        <div className="mt-4 space-y-5">
          {/* Characteristics */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">Engine Configuration</dt>
              <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{formatEnumLabel(soundProfile.engineConfiguration)}</dd>
            </div>
            <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">Cylinders</dt>
              <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{soundProfile.cylinderCount}</dd>
            </div>
            <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">Induction</dt>
              <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{formatEnumLabel(soundProfile.forcedInduction)}</dd>
            </div>
            <div className="rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
              <dt className="text-xs font-medium text-surface-500 dark:text-surface-400">Exhaust Note</dt>
              <dd className="mt-1 text-sm font-bold text-surface-900 dark:text-white">{formatEnumLabel(soundProfile.exhaustNote)}</dd>
            </div>
          </dl>

          {/* Audio Player */}
          <AudioPlayer soundProfileId={soundProfile.id} />
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-surface-50 p-4 dark:bg-surface-700">
          <span className="inline-flex items-center rounded-full bg-surface-200 px-3 py-1 text-xs font-semibold text-surface-600 dark:bg-surface-600 dark:text-surface-300">
            Unclassified
          </span>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            No sound profile data is available for this vehicle.
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
  const audioUrl = api.getAudioClipUrl(soundProfileId);

  if (audioError) {
    return (
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-700">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Audio unavailable — the engine sound clip could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-surface-500 dark:text-surface-400">Engine Sound Clip</p>
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
  if (!sourceUrls || sourceUrls.length === 0) return null;

  return (
    <div className="mt-8 border-t border-surface-100 pt-6 dark:border-surface-700">
      <h2 className="text-lg font-bold text-surface-900 dark:text-white">Original Advertisements</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        {sourceUrls.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-surface-200 bg-white px-4 py-2.5 text-sm font-medium text-surface-700 shadow-sm transition-all duration-200 hover:border-brand-accent hover:text-brand-accent hover:shadow-md dark:border-surface-600 dark:bg-surface-700 dark:text-surface-300 dark:hover:border-brand-accent dark:hover:text-brand-accent"
          >
            View on {capitalize(source.marketplace)}
            <ExternalLinkIcon />
          </a>
        ))}
      </div>
    </div>
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
