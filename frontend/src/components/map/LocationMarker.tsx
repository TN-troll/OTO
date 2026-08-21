import { useCallback } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import type { MapLocation } from '@car-ads/shared';

export interface LocationMarkerProps {
  /** Location data with aggregated listing information */
  location: MapLocation;
  /** Callback when the marker is clicked */
  onClick?: (location: MapLocation) => void;
}

/** Brand gold for dealer locations */
const GOLD_PRIMARY = '#d4a853';
const GOLD_DARK = '#b8922f';
const GOLD_GLOW = 'rgba(212, 168, 83, 0.4)';

/** Muted silver for private-only locations */
const PRIVATE_PRIMARY = '#94a3b8';
const PRIVATE_DARK = '#64748b';
const PRIVATE_GLOW = 'rgba(148, 163, 184, 0.3)';

/** Threshold for "hot" locations that get pulse animation */
const HOT_THRESHOLD = 10;

/**
 * Creates a premium DivIcon for a location marker showing the listing count badge.
 * Uses gold gradient for dealer locations, muted silver for private-only.
 * Hot locations (>10 listings) get a pulsing gold glow animation.
 */
function createMarkerIcon(location: MapLocation): L.DivIcon {
  const isDealer = location.dealerCount > 0;
  const isHot = location.totalCount > HOT_THRESHOLD;
  const primary = isDealer ? GOLD_PRIMARY : PRIVATE_PRIMARY;
  const dark = isDealer ? GOLD_DARK : PRIVATE_DARK;
  const glow = isDealer ? GOLD_GLOW : PRIVATE_GLOW;

  const size = 36;
  const pulseClass = isHot ? 'oto-marker-pulse' : '';

  return L.divIcon({
    html: `<div class="oto-marker ${pulseClass}" style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: linear-gradient(135deg, ${primary} 0%, ${dark} 100%);
      border: 2px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: -0.02em;
      box-shadow: 0 4px 12px ${glow}, 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2);
      cursor: pointer;
      transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
    ">${location.totalCount}</div>`,
    className: 'location-marker-custom',
    iconSize: L.point(size, size),
    iconAnchor: L.point(size / 2, size / 2),
  });
}

/**
 * Individual location marker component for the interactive map.
 *
 * Features:
 * - Renders a Leaflet marker at the location's coordinates
 * - Displays a badge with the total listing count
 * - Gold gradient for dealer locations, silver for private-only
 * - Pulsing glow animation for "hot" locations (>10 listings)
 * - Premium glass border and shadow effects
 */
export function LocationMarker({ location, onClick }: LocationMarkerProps) {
  const position: [number, number] = [location.latitude, location.longitude];
  const icon = createMarkerIcon(location);

  const handleClick = useCallback(() => {
    onClick?.(location);
  }, [onClick, location]);

  return (
    <Marker
      position={position}
      icon={icon}
      eventHandlers={{ click: handleClick }}
    />
  );
}
