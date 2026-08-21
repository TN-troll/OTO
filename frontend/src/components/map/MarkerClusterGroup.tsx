import { createContext, useContext, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';

export interface MarkerClusterGroupProps {
  /** Child marker components to be clustered */
  children?: React.ReactNode;
  /** Zoom level at which clustering stops and individual markers appear. Default: 10 */
  disableClusteringAtZoom?: number;
}

/** Clustering threshold: markers uncluster at zoom level 10+ (Requirement 4.1) */
const DEFAULT_DISABLE_CLUSTERING_AT_ZOOM = 10;

/**
 * Context that provides the MarkerClusterGroup layer to child markers.
 * Child markers should use useClusterGroup() to register themselves
 * with the cluster instead of being added directly to the map.
 */
const ClusterGroupContext = createContext<L.MarkerClusterGroup | null>(null);

/**
 * Hook for child marker components to access the parent cluster group.
 * Returns the L.MarkerClusterGroup instance or null if not inside a MarkerClusterGroup.
 */
export function useClusterGroup(): L.MarkerClusterGroup | null {
  return useContext(ClusterGroupContext);
}

/**
 * Creates a premium cluster icon showing the total listing count.
 * Uses the OTO brand gold gradient with glass border and glow effects.
 *
 * Validates: Requirement 4.2 — Display total listing count on cluster icons
 */
function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const childCount = cluster.getChildCount();

  // Size the cluster icon based on the number of markers
  let size: number;
  let fontSize: number;
  if (childCount < 10) {
    size = 40;
    fontSize = 12;
  } else if (childCount < 50) {
    size = 48;
    fontSize = 13;
  } else {
    size = 56;
    fontSize = 14;
  }

  return L.divIcon({
    html: `<div class="oto-cluster" style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: linear-gradient(135deg, #d4a853 0%, #b8922f 100%);
      border: 2.5px solid rgba(255, 255, 255, 0.3);
      color: #fff;
      font-weight: 700;
      font-size: ${fontSize}px;
      letter-spacing: -0.02em;
      box-shadow: 0 6px 20px rgba(212, 168, 83, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
      cursor: pointer;
    ">${childCount}</div>`,
    className: 'marker-cluster-custom',
    iconSize: L.point(size, size),
  });
}

/**
 * MarkerClusterGroup wraps child markers in a Leaflet.markercluster layer.
 *
 * Features:
 * - Groups nearby markers into clusters at zoom levels below 10 (Req 4.1)
 * - Displays total listing count on each cluster icon (Req 4.2)
 * - Zooms in on cluster click to reveal individual markers (Req 4.3)
 * - Uses smooth animation when expanding/collapsing clusters (Req 4.4)
 *
 * Must be rendered inside a react-leaflet MapContainer.
 * Child Marker components that add themselves to the map will be intercepted
 * and moved into the cluster group automatically.
 */
export function MarkerClusterGroup({
  children,
  disableClusteringAtZoom = DEFAULT_DISABLE_CLUSTERING_AT_ZOOM,
}: MarkerClusterGroupProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    const clusterGroup = L.markerClusterGroup({
      // Requirement 4.1: Cluster markers when zoom is below this level
      disableClusteringAtZoom,
      // Requirement 4.3: Zoom into bounds when clicking a cluster
      zoomToBoundsOnClick: true,
      // Requirement 4.4: Smooth animation when adding/removing markers
      animateAddingMarkers: true,
      // Don't show polygon coverage on hover (cleaner UX)
      showCoverageOnHover: false,
      // Requirement 4.2: Custom icon showing listing count
      iconCreateFunction: createClusterIcon,
    });

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
      clusterGroupRef.current = null;
    };
  }, [map, disableClusteringAtZoom]);

  // Intercept markers added to the map by react-leaflet children
  // and redirect them into the cluster group
  useEffect(() => {
    const group = clusterGroupRef.current;
    if (!group) return;

    const handleLayerAdd = (e: L.LayerEvent) => {
      const layer = e.layer;
      // Only intercept L.Marker instances — skip tiles, the cluster group itself, etc.
      if (
        layer instanceof L.Marker &&
        !(layer instanceof L.MarkerCluster) &&
        !group.hasLayer(layer)
      ) {
        // Use setTimeout to avoid modifying layers during an event handler
        setTimeout(() => {
          if (map.hasLayer(layer)) {
            map.removeLayer(layer);
            group.addLayer(layer);
          }
        }, 0);
      }
    };

    map.on('layeradd', handleLayerAdd);

    return () => {
      map.off('layeradd', handleLayerAdd);
    };
  }, [map]);

  return (
    <ClusterGroupContext.Provider value={clusterGroupRef.current}>
      {children}
    </ClusterGroupContext.Provider>
  );
}
