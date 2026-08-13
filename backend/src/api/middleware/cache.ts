import { createHash } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

/**
 * Configuration for a cacheable route.
 */
export interface CacheRouteConfig {
  path: string;
  method: 'GET' | 'POST';
  maxAge: number; // seconds; 0 = no-cache
  isPublic: boolean;
  etag: boolean;
}

export interface CacheConfig {
  routes: CacheRouteConfig[];
}

/**
 * Default cache configuration for listing routes.
 */
export const CACHE_CONFIG: CacheConfig = {
  routes: [
    { path: '/api/listings', method: 'GET', maxAge: 300, isPublic: true, etag: true },
    { path: '/api/listings/:id', method: 'GET', maxAge: 600, isPublic: true, etag: true },
    { path: '/api/listings/filter', method: 'POST', maxAge: 0, isPublic: false, etag: false },
  ],
};

/**
 * Match a request path against a route pattern that supports Express-style params (e.g. `:id`).
 * Returns true if the request path matches the pattern.
 */
export function matchRoute(requestPath: string, pattern: string): boolean {
  // Convert Express-style pattern to regex
  // :param matches one path segment (no slashes)
  const regexStr = '^' + pattern.replace(/:[a-zA-Z_][a-zA-Z0-9_]*/g, '[^/]+') + '$';
  const regex = new RegExp(regexStr);
  return regex.test(requestPath);
}

/**
 * Find the matching cache configuration for a given request.
 * Returns the first matching route config, or undefined if no match.
 * More specific routes (longer paths without params) are matched first.
 */
export function findCacheConfig(
  method: string,
  path: string,
  config: CacheConfig,
): CacheRouteConfig | undefined {
  // Sort routes: exact paths before parameterized ones, longer paths first
  const sortedRoutes = [...config.routes].sort((a, b) => {
    const aHasParam = a.path.includes(':');
    const bHasParam = b.path.includes(':');
    if (aHasParam !== bHasParam) return aHasParam ? 1 : -1;
    return b.path.length - a.path.length;
  });

  return sortedRoutes.find(
    (route) => route.method === method.toUpperCase() && matchRoute(path, route.path),
  );
}

/**
 * Compute an ETag from response body content using MD5 hash.
 * Returns a weak ETag in the format W/"<hash>".
 */
export function computeETag(body: string | Buffer): string {
  const content = typeof body === 'string' ? body : body.toString('utf-8');
  const hash = createHash('md5').update(content).digest('hex');
  return `W/"${hash}"`;
}

/**
 * Express middleware that attaches Cache-Control and ETag headers based on route configuration.
 * Handles If-None-Match conditional requests returning 304 Not Modified.
 */
export function cacheMiddleware(config: CacheConfig = CACHE_CONFIG) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const routeConfig = findCacheConfig(req.method, req.path, config);

    // No matching route config — skip caching logic
    if (!routeConfig) {
      next();
      return;
    }

    // Route explicitly configured with maxAge=0 — no caching
    if (routeConfig.maxAge === 0) {
      res.setHeader('Cache-Control', 'no-store');
      next();
      return;
    }

    // Intercept res.json and res.send to capture the response body for ETag computation
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    const handleResponse = (body: unknown, sender: (body: unknown) => Response): Response => {
      // Set Cache-Control header
      const visibility = routeConfig.isPublic ? 'public' : 'private';
      res.setHeader('Cache-Control', `${visibility}, max-age=${routeConfig.maxAge}`);

      if (routeConfig.etag && body !== undefined && body !== null) {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        const etag = computeETag(bodyStr);
        res.setHeader('ETag', etag);

        // Check If-None-Match for conditional request
        const ifNoneMatch = req.headers['if-none-match'];
        if (ifNoneMatch && ifNoneMatch === etag) {
          res.status(304).end();
          return res;
        }
      }

      return sender(body);
    };

    res.json = (body: unknown): Response => {
      return handleResponse(body, originalJson);
    };

    res.send = (body: unknown): Response => {
      return handleResponse(body, originalSend);
    };

    next();
  };
}
