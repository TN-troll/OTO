import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { useFilterContext } from '../hooks/FilterContext';
import { buildCriteria, hasActiveFilters } from '../hooks/useFilters';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLanguage } from '../i18n';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { MarkerClusterGroup } from '../components/map/MarkerClusterGroup';
import { LocationMarker } from '../components/map/LocationMarker';
import { LocationPopup } from '../components/map/LocationPopup';
import { MobileBottomSheet } from '../components/map/MobileBottomSheet';
import { formatNumber } from '../utils/formatNumber';
import { CATEGORIES } from '../data/categories';
import {
  SupercarIcon,
  LuxuryIcon,
  PerformanceSedanIcon,
  HotHatchIcon,
  SportsCarIcon,
  PerformanceSuvIcon,
  ElectricPerformanceIcon,
} from '../components/icons/CategoryIcons';
import type { MapLocation } from '@car-ads/shared';

// Leaflet core CSS
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import '../components/map/map.css';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'hypercar': SupercarIcon,
  'supercar': SupercarIcon,
  'luxury': LuxuryIcon,
  'performance-sedan': PerformanceSedanIcon,
  'hot-hatch': HotHatchIcon,
  'sports-car': SportsCarIcon,
  'suv': PerformanceSuvIcon,
  'electric': ElectricPerformanceIcon,
};

/**
 * MapPage — Interactive map with filter integration, result counts,
 * and smooth transitions when filters update. Premium dark theme.
 */
export default function MapPage() {
  const isMobile = useIsMobile();
  const { locale } = useLanguage();
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { debouncedFilters, filtersActive, setCategory } = useFilterContext();
  const criteria = useMemo(() => buildCriteria(debouncedFilters), [debouncedFilters]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['mapLocations', criteria],
    queryFn: () => api.getMapLocationsFiltered(criteria),
    staleTime: 60_000,
    gcTime: 600_000,
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

  const handleCategoryClick = useCallback((categoryId: string | null) => {
    if (categoryId === null) {
      setActiveCategory(null);
      setCategory({});
    } else {
      const category = CATEGORIES.find((c) => c.id === categoryId);
      if (category) {
        setActiveCategory(categoryId);
        setCategory(category.filter);
      }
    }
  }, [setCategory]);

  const locations = data?.locations ?? [];
  const totalListings = data?.totalListings ?? 0;

  // Loading state (initial load only)
  if (isLoading) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-4 px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-surface-200 border-t-brand-accent dark:border-surface-700 dark:border-t-brand-accent" />
        <p className="text-sm text-surface-500 dark:text-surface-400">Loading map...</p>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-4 px-4">
        <div className="rounded-2xl border border-white/[0.08] bg-surface-900/90 p-6 text-center backdrop-blur-lg">
          <p className="text-sm font-medium text-red-400">
            Failed to load map
          </p>
          <p className="mt-1 text-xs text-red-300/70">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-surface-200 transition-all duration-200 hover:border-brand-accent/30 hover:bg-brand-accent/10 hover:text-brand-accent"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[calc(100vh-120px)] flex-col">
      {/* Map container — fills available height */}
      <div className="relative flex-1">
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

        {/* Refetching overlay — subtle pill when filters change */}
        {isFetching && !isLoading && (
          <div className="absolute inset-0 z-[900] flex items-start justify-center pt-4 pointer-events-none animate-fade-in">
            <div className="flex items-center gap-2 rounded-full border border-white/[0.1] bg-surface-900/90 px-4 py-2 shadow-lg backdrop-blur-xl">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-accent/30 border-t-brand-accent" />
              <span className="text-xs font-medium text-surface-200">Updating map...</span>
            </div>
          </div>
        )}

        {/* Results count badge — top-left floating */}
        <div className="absolute left-4 top-4 z-[900] animate-fade-in">
          <div className="flex items-center gap-2 rounded-2xl border border-white/[0.1] bg-surface-900/80 px-4 py-2 shadow-lg backdrop-blur-xl">
            <svg className="h-4 w-4 text-brand-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <div>
              <span className="text-sm font-bold text-white">{formatNumber(totalListings, locale)}</span>
              <span className="ml-1.5 text-xs text-surface-400">
                {locale === 'nl' ? 'auto\'s' : 'cars'}
              </span>
            </div>
            {filtersActive && (
              <span className="ml-1 flex h-5 items-center rounded-full bg-brand-accent/15 px-2 text-[10px] font-semibold text-brand-accent">
                {locale === 'nl' ? 'Gefilterd' : 'Filtered'}
              </span>
            )}
          </div>
        </div>

        {/* Category quick-filter strip — top-right */}
        <div className="absolute right-4 top-4 z-[900] animate-fade-in">
          <div className={`flex gap-1.5 ${isMobile ? 'max-w-[calc(100vw-200px)] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`}>
            {/* "All" button */}
            <button
              onClick={() => handleCategoryClick(null)}
              className={`flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2.5 py-1.5 shadow-lg backdrop-blur-xl transition-all duration-200 ${
                activeCategory === null
                  ? 'border-brand-accent/50 bg-brand-accent/15 text-brand-accent'
                  : 'border-white/[0.1] bg-surface-900/80 text-surface-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <svg className="h-4 w-9" viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
                <circle cx="25" cy="18" r="4" opacity="0.6" />
                <circle cx="40" cy="18" r="4" opacity="0.6" />
                <circle cx="55" cy="18" r="4" opacity="0.6" />
              </svg>
              {!isMobile && (
                <span className="text-[10px] font-medium">
                  {locale === 'nl' ? 'Alles' : 'All'}
                </span>
              )}
            </button>

            {/* Category buttons */}
            {CATEGORIES.filter((c) => CATEGORY_ICONS[c.id]).map((category) => {
              const Icon = CATEGORY_ICONS[category.id];
              const isActive = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(isActive ? null : category.id)}
                  className={`flex flex-shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2.5 py-1.5 shadow-lg backdrop-blur-xl transition-all duration-200 ${
                    isActive
                      ? 'border-brand-accent/50 bg-brand-accent/15 text-brand-accent'
                      : 'border-white/[0.1] bg-surface-900/80 text-surface-300 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-9" />
                  {!isMobile && (
                    <span className="text-[10px] font-medium">
                      {locale === 'nl' ? category.labelNl : category.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map legend — bottom-left */}
        <div className="absolute left-4 bottom-8 z-[900] animate-fade-in">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-surface-900/80 px-3 py-1.5 shadow-lg backdrop-blur-xl">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: '#d4a853' }} />
              <span className="text-[11px] font-medium text-surface-300">Dealer</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-surface-400" />
              <span className="text-[11px] font-medium text-surface-300">
                {locale === 'nl' ? 'Particulier' : 'Private sale'}
              </span>
            </span>
          </div>
        </div>

        {/* Empty state overlay */}
        {locations.length === 0 && !isFetching && (
          <div className="absolute inset-0 z-[800] flex items-center justify-center bg-surface-900/40 backdrop-blur-sm animate-fade-in">
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.08] bg-surface-900/80 px-8 py-6 shadow-xl backdrop-blur-xl">
              <svg className="h-10 w-10 text-surface-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
                <path d="M3 3l18 18" strokeWidth={2} />
              </svg>
              <p className="text-sm font-medium text-surface-200">
                {locale === 'nl' ? 'Geen resultaten voor deze filters' : 'No results for these filters'}
              </p>
              <p className="text-xs text-surface-500">
                {locale === 'nl' ? 'Pas je filters aan om meer te zien' : 'Adjust your filters to see more'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Desktop: popup overlay */}
      {!isMobile && selectedLocation && (
        <div className="absolute right-4 top-16 z-[1000] animate-scale-in rounded-2xl border border-white/[0.08] bg-surface-900/90 p-4 shadow-premium-lg backdrop-blur-xl">
          <button
            onClick={() => setSelectedLocation(null)}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-surface-400 transition-all duration-150 hover:bg-white/[0.08] hover:text-white"
            aria-label="Close popup"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          <LocationPopup location={selectedLocation} />
        </div>
      )}

      {/* Mobile: bottom sheet */}
      {isMobile && (
        <MobileBottomSheet isOpen={isBottomSheetOpen} onClose={handleBottomSheetClose}>
          {selectedLocation && <LocationPopup location={selectedLocation} />}
        </MobileBottomSheet>
      )}
    </div>
  );
}
