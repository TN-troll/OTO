/**
 * Image Proxy URL utility.
 *
 * Converts direct image URLs (e.g. from AutoScout24) into proxied URLs
 * served through OTO's `/api/images/:encodedUrl` endpoint. This avoids
 * hotlink-blocking issues and enables server-side caching.
 */

// Same API base used by the rest of the client
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

/**
 * Converts an external image URL into a proxied URL through OTO's image proxy.
 *
 * @param originalUrl - The direct image URL (e.g. an AutoScout24 image URL)
 * @returns The proxied URL in the format `/api/images/:encodedUrl`
 *
 * If the input is falsy or already a proxied URL, it is returned as-is.
 */
export function getProxyImageUrl(originalUrl: string | null | undefined): string {
  if (!originalUrl) return '';

  // Don't double-proxy URLs that are already going through the proxy
  if (originalUrl.includes('/api/images/')) {
    return originalUrl;
  }

  // Don't proxy data: URLs or blob: URLs
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
    return originalUrl;
  }

  const encodedUrl = encodeURIComponent(originalUrl);
  return `${API_BASE}/images/${encodedUrl}`;
}

/**
 * Converts an array of image URLs to their proxied equivalents.
 *
 * @param urls - Array of direct image URLs
 * @returns Array of proxied URLs
 */
export function getProxyImageUrls(urls: string[] | null | undefined): string[] {
  if (!urls || urls.length === 0) return [];
  return urls.map(getProxyImageUrl);
}
