import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import type { MapLocation } from '@car-ads/shared';

/** Default center for the Netherlands */
const NL_CENTER: [number, number] = [52.2, 5.3];
/** Default zoom level showing the full Netherlands */
const NL_ZOOM = 7;
/** Mobile breakpoint in pixels */
const MOBILE_BREAKPOINT = 768;

/** CartoDB Dark Matter — premium dark map tiles */
const CARTO_DARK_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
const CARTO_DARK_TILE_URL =
  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export interface InteractiveMapProps {
  /** Location data for markers (rendered by children or future integration) */
  locations?: MapLocation[];
  /** Child components (markers, clusters, etc.) */
  children?: React.ReactNode;
}

/**
 * Hook to detect if viewport is below the mobile breakpoint.
 * Uses window.matchMedia for efficient, event-driven updates.
 */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
    };

    // Set initial value from media query
    setIsMobile(mql.matches);

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return isMobile;
}

/**
 * Inner component that controls scroll wheel zoom based on mobile detection.
 * Must be rendered inside MapContainer to access the map instance via useMap().
 */
function ScrollZoomController({ isMobile }: { isMobile: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (isMobile) {
      map.scrollWheelZoom.disable();
    } else {
      map.scrollWheelZoom.enable();
    }
  }, [map, isMobile]);

  return null;
}

/**
 * Interactive Leaflet map component centered on the Netherlands.
 *
 * Renders a CartoDB Dark Matter map with:
 * - Initial center on NL (52.2, 5.3) at zoom level 7
 * - Responsive height filling viewport below the header (min 400px)
 * - Scroll zoom disabled on mobile viewports (< 768px)
 * - Full support for zoom, pan, and keyboard interactions
 * - Glass border frame matching the premium dark theme
 *
 * Accepts children for rendering markers, clusters, and overlays.
 */
export function InteractiveMap({ locations, children }: InteractiveMapProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className="oto-map-frame w-full overflow-hidden rounded-2xl border border-white/[0.08] shadow-glass-dark"
      style={{
        height: 'calc(100vh - 6rem)',
        minHeight: '400px',
      }}
    >
      <MapContainer
        center={NL_CENTER}
        zoom={NL_ZOOM}
        scrollWheelZoom={!isMobile}
        className="h-full w-full z-0"
        keyboard={true}
        zoomControl={true}
      >
        <TileLayer attribution={CARTO_DARK_ATTRIBUTION} url={CARTO_DARK_TILE_URL} />
        <ScrollZoomController isMobile={isMobile} />
        {children}
      </MapContainer>
    </div>
  );
}
