import { useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { MarkerClusterGroup } from '../components/map/MarkerClusterGroup';
import { LocationMarker } from '../components/map/LocationMarker';
import { LocationPopup } from '../components/map/LocationPopup';
import { MobileBottomSheet } from '../components/map/MobileBottomSheet';
import type { MapLocation } from '@car-ads/shared';

// Leaflet core CSS (required for map tiles, controls, popups)
import 'leaflet/dist/leaflet.css';
// MarkerCluster base CSS (positioning and sizing for cluster icons)
import 'leaflet.markercluster/dist/MarkerCluster.css';
// Custom map overrides (neutralize default cluster styles that conflict with our custom icons)
import '../components/map/map.css';

/** Mobile breakpoint in pixels */
const MOBILE_BREAKPOINT = 768;

/**
 * Hook to detect if viewport is below the mobile breakpoint.
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

/**
 * MapPage — Interactive dealer map showing listing locations across the Netherlands.
 *
 * Features:
 * - Fetches locations from GET /api/map/locations using TanStack Query
 * - Renders InteractiveMap with MarkerClusterGroup containing LocationMarker instances
 * - Shows LocationPopup (desktop) or MobileBottomSheet (mobile) on marker click
 * - Loading, error, and empty states
 * - "Back to listings" navigation link
 *
 * Requirements: 1.1, 3.1, 4.1, 7.2
 */
export default function MapPage() {
  const isMobile = useIsMobile();
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['mapLocations'],
    queryFn: () => api.getMapLocations(),
    staleTime: 300_000, // 5 minutes
    gcTime: 600_000, // 10 minutes
    retry: 3,
  });

  const handleMarkerClick = useCallback((location: MapLocation) => {
    setSelectedLocation(location);
    if (isMobile) {
      setIsBottomSheetOpen(true);
    }
  }, [isMobile]);

  const handleBottomSheetClose = useCallback(() => {
    setIsBottomSheetOpen(false);
    setSelectedLocation(null);
  }, []);

  const locations = data?.locations ?? [];

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" />
        <p className="text-sm text-surface-500 dark:text-surface-400">Loading map locations...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-xl bg-red-50 p-6 text-center dark:bg-red-900/20">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            Failed to load map locations
          </p>
          <p className="mt-1 text-xs text-red-500 dark:text-red-300">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200 dark:bg-red-900/40 dark:text-red-300 dark:hover:bg-red-900/60"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // Empty state
  if (locations.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-4">
        <p className="text-sm text-surface-500 dark:text-surface-400">
          No dealer locations available at this time.
        </p>
        <Link
          to="/"
          className="text-sm font-medium text-brand-accent hover:underline"
        >
          ← Back to listings
        </Link>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col">
      {/* Navigation header */}
      <div className="absolute left-4 top-4 z-[1000]">
        <Link
          to="/"
          className="inline-flex items-center gap-1 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-surface-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white dark:bg-surface-800/90 dark:text-surface-200 dark:hover:bg-surface-800"
        >
          ← Back to listings
        </Link>
      </div>

      {/* Interactive map with markers */}
      <InteractiveMap locations={locations}>
        <MarkerClusterGroup>
          {locations.map((location) => (
            <LocationMarker
              key={`${location.city}-${location.latitude}-${location.longitude}`}
              location={location}
              onClick={handleMarkerClick}
            />
          ))}
        </MarkerClusterGroup>
      </InteractiveMap>

      {/* Desktop: show popup overlay when a location is selected */}
      {!isMobile && selectedLocation && (
        <div className="absolute right-4 top-4 z-[1000] rounded-2xl bg-white p-4 shadow-xl dark:bg-surface-800 dark:border dark:border-white/[0.08]">
          <button
            onClick={() => setSelectedLocation(null)}
            className="absolute right-2 top-2 rounded-lg p-1 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700"
            aria-label="Close popup"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <LocationPopup location={selectedLocation} />
        </div>
      )}

      {/* Mobile: show bottom sheet when a location is selected */}
      {isMobile && (
        <MobileBottomSheet isOpen={isBottomSheetOpen} onClose={handleBottomSheetClose}>
          {selectedLocation && <LocationPopup location={selectedLocation} />}
        </MobileBottomSheet>
      )}
    </div>
  );
}
