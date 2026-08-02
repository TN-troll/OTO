import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { SoundProfile } from '@car-ads/shared';

/** Extended listing type as returned by the detail API (includes nested soundProfile) */
interface ListingDetail {
  id: string;
  title: string;
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
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading listing details...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">
          Failed to load listing details.{' '}
          <Link to="/" className="text-primary-600 underline">
            Back to browse
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center text-sm text-primary-600 hover:underline">
        ← Back to listings
      </Link>

      {/* Image Gallery */}
      <ImageGallery
        imageUrls={listing.imageUrls}
        alt={`${listing.make} ${listing.model}`}
      />

      {/* Main Content */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="p-6">
          {/* Title and Price */}
          <h1 className="text-2xl font-bold text-gray-900">
            {listing.make} {listing.model} ({listing.year})
          </h1>
          <p className="mt-1 text-3xl font-bold text-primary-700">
            €{listing.price?.toLocaleString('nl-NL')}
          </p>

          {/* Last Verified */}
          <p className="mt-2 text-sm text-gray-500">
            Last verified: {formatDateTime(listing.lastVerified)}
          </p>

          {/* Specifications Grid */}
          <SpecificationsSection listing={listing} />

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

  if (!imageUrls || imageUrls.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-gray-200 text-gray-400">
        No images available
      </div>
    );
  }

  const canGoLeft = activeIndex > 0;
  const canGoRight = activeIndex < imageUrls.length - 1;

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100">
        <img
          src={imageUrls[activeIndex]}
          alt={`${alt} - image ${activeIndex + 1}`}
          className="mx-auto max-h-[500px] w-full object-contain"
        />

        {/* Left Arrow */}
        {canGoLeft && (
          <button
            onClick={() => setActiveIndex((i) => i - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeftIcon />
          </button>
        )}

        {/* Right Arrow */}
        {canGoRight && (
          <button
            onClick={() => setActiveIndex((i) => i + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRightIcon />
          </button>
        )}

        {/* Image counter */}
        <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
          {activeIndex + 1} / {imageUrls.length}
        </div>
      </div>

      {/* Thumbnail Strip */}
      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {imageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded border-2 ${
                index === activeIndex
                  ? 'border-primary-600'
                  : 'border-transparent hover:border-gray-300'
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
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h2 className="text-lg font-semibold text-gray-900">Specifications</h2>
      <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {displayedSpecs.map((spec) => (
          <div key={spec.label}>
            <dt className="text-sm text-gray-500">{spec.label}</dt>
            <dd className="font-semibold text-gray-900">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Sound profile section with audio player */
function SoundProfileSection({ soundProfile }: { soundProfile: SoundProfile | null }) {
  return (
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h2 className="text-lg font-semibold text-gray-900">Sound Profile</h2>

      {soundProfile ? (
        <div className="mt-3 space-y-4">
          {/* Characteristics */}
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <dt className="text-sm text-gray-500">Engine Configuration</dt>
              <dd className="font-semibold text-gray-900">{formatEnumLabel(soundProfile.engineConfiguration)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Cylinders</dt>
              <dd className="font-semibold text-gray-900">{soundProfile.cylinderCount}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Induction</dt>
              <dd className="font-semibold text-gray-900">{formatEnumLabel(soundProfile.forcedInduction)}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Exhaust Note</dt>
              <dd className="font-semibold text-gray-900">{formatEnumLabel(soundProfile.exhaustNote)}</dd>
            </div>
          </dl>

          {/* Audio Player */}
          <AudioPlayer soundProfileId={soundProfile.id} />
        </div>
      ) : (
        <div className="mt-3">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
            Unclassified
          </span>
          <p className="mt-1 text-sm text-gray-500">
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
      <div className="rounded-md bg-yellow-50 p-3">
        <p className="text-sm text-yellow-800">
          Audio unavailable — the engine sound clip could not be loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-500">Engine Sound Clip</p>
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
    <div className="mt-6 border-t border-gray-200 pt-4">
      <h2 className="text-lg font-semibold text-gray-900">Original Advertisements</h2>
      <div className="mt-3 space-y-2">
        {sourceUrls.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
          >
            View on {capitalize(source.marketplace)} →
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
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
  );
}
