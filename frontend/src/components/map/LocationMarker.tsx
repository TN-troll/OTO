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

/** Gold color for dealer locations (dealerCount > 0) */
const DEALER_COLOR = '#f59e0b';
const DEALER_BORDER = '#d97706';

/** Blue color for private-only locations */
const PRIVATE_COLOR = '#3b82f6';
const PRIVATE_BORDER = '#2563eb';

/**
 * Creates a custom DivIcon for a location marker showing the listing count badge.
 * Uses gold for locations with dealer listings, blue for private-only.
 */
function createMarkerIcon(location: MapLocation): L.DivIcon {
  const isDealer = location.dealerCount > 0;
  const bgColor = isDealer ? DEALER_COLOR : PRIVATE_COLOR;
  const borderColor = isDealer ? DEALER_BORDER : PRIVATE_BORDER;

  const size = 32;

  return L.divIcon({
    html: `<div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background-color: ${bgColor};
      border: 2.5px solid ${borderColor};
      color: #fff;
      font-weight: 700;
      font-size: 11px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
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
 * - Gold color for dealer locations (dealerCount > 0), blue for private-only (Req 3.5)
 * - Click handler triggers popup/bottom sheet display (Req 3.1)
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
