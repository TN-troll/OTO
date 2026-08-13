import { useCallback, useState } from 'react';
import { handleTrackedClick } from '../utils/clickTracker';

/**
 * React hook for click-tracked outbound links.
 *
 * Provides a click handler that routes through the click tracking endpoint
 * before redirecting the user to the original URL.
 *
 * Usage:
 * ```tsx
 * const { trackOutboundClick, isTracking } = useClickTracker(listingId);
 * <button onClick={(e) => trackOutboundClick(e, url)}>View on AutoScout24</button>
 * ```
 */
export function useClickTracker(listingId: string) {
  const [isTracking, setIsTracking] = useState(false);

  const trackOutboundClick = useCallback(
    async (event: React.MouseEvent, targetUrl: string) => {
      event.preventDefault();
      setIsTracking(true);

      try {
        await handleTrackedClick(listingId, targetUrl, true);
      } finally {
        setIsTracking(false);
      }
    },
    [listingId],
  );

  return { trackOutboundClick, isTracking };
}
