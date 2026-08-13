/**
 * Click Tracker utility.
 *
 * Routes outbound AutoScout24 links through the click tracking endpoint
 * (POST /api/listings/:id/track-click) before redirecting the user to the
 * original URL. This records engagement metrics server-side.
 *
 * If the tracking call fails or times out, the user is still redirected
 * to the original URL so navigation is never blocked.
 */

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

/** Timeout in ms — redirect happens regardless after this duration */
const TRACK_TIMEOUT_MS = 3000;

/**
 * Generate a session ID for anonymous click tracking.
 * Persists per browser session via sessionStorage.
 */
function getSessionId(): string {
  const STORAGE_KEY = 'oto-click-session-id';
  let sessionId = sessionStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export interface TrackClickResult {
  redirectUrl: string | null;
  tracked: boolean;
}

/**
 * Track an outbound click for a listing and return the redirect URL.
 *
 * Calls POST /api/listings/:id/track-click with the session ID.
 * If the backend returns a redirectUrl, it's used; otherwise falls back
 * to the provided fallbackUrl.
 *
 * @param listingId - The listing ID to track
 * @param fallbackUrl - The URL to redirect to if the API call fails
 * @returns Object with the final redirect URL and whether tracking succeeded
 */
export async function trackClick(
  listingId: string,
  fallbackUrl: string,
): Promise<TrackClickResult> {
  const sessionId = getSessionId();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TRACK_TIMEOUT_MS);

    const response = await fetch(`${API_BASE}/listings/${listingId}/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return {
        redirectUrl: data.redirectUrl || fallbackUrl,
        tracked: true,
      };
    }

    // Non-OK response — still redirect, just mark as not tracked
    return { redirectUrl: fallbackUrl, tracked: false };
  } catch {
    // Timeout, network error, or abort — redirect anyway
    return { redirectUrl: fallbackUrl, tracked: false };
  }
}

/**
 * Handle an outbound link click: track the click, then redirect.
 *
 * This is the primary function to use in click handlers. It prevents
 * the default link navigation, fires the tracking call, and opens
 * the target URL in a new tab.
 *
 * @param listingId - The listing ID to track
 * @param targetUrl - The original outbound URL
 * @param openInNewTab - Whether to open in a new tab (default: true)
 */
export async function handleTrackedClick(
  listingId: string,
  targetUrl: string,
  openInNewTab = true,
): Promise<void> {
  const { redirectUrl } = await trackClick(listingId, targetUrl);
  const finalUrl = redirectUrl || targetUrl;

  if (openInNewTab) {
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  } else {
    window.location.href = finalUrl;
  }
}
