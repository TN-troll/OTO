import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import {
  cacheMiddleware,
  matchRoute,
  findCacheConfig,
  computeETag,
  CACHE_CONFIG,
} from './cache.js';
import type { CacheConfig } from './cache.js';

function createMockReq(options: {
  method?: string;
  path?: string;
  headers?: Record<string, string>;
} = {}): Request {
  return {
    method: options.method || 'GET',
    path: options.path || '/api/listings',
    headers: options.headers || {},
  } as unknown as Request;
}

function createMockRes(): Response & { _headers: Record<string, string> } {
  const headers: Record<string, string> = {};
  const res = {
    _headers: headers,
    setHeader: vi.fn((name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    }),
    status: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response & { _headers: Record<string, string> };
  return res;
}

describe('matchRoute', () => {
  it('matches exact path', () => {
    expect(matchRoute('/api/listings', '/api/listings')).toBe(true);
  });

  it('does not match different path', () => {
    expect(matchRoute('/api/search', '/api/listings')).toBe(false);
  });

  it('matches path with :id parameter', () => {
    expect(matchRoute('/api/listings/abc-123', '/api/listings/:id')).toBe(true);
  });

  it('does not match path with extra segments beyond pattern', () => {
    expect(matchRoute('/api/listings/abc-123/extra', '/api/listings/:id')).toBe(false);
  });

  it('matches path with filter segment', () => {
    expect(matchRoute('/api/listings/filter', '/api/listings/filter')).toBe(true);
  });

  it('does not match partial paths', () => {
    expect(matchRoute('/api/listings/filter/extra', '/api/listings/filter')).toBe(false);
  });
});

describe('findCacheConfig', () => {
  it('returns config for GET /api/listings', () => {
    const result = findCacheConfig('GET', '/api/listings', CACHE_CONFIG);
    expect(result).toBeDefined();
    expect(result!.maxAge).toBe(300);
    expect(result!.isPublic).toBe(true);
  });

  it('returns config for GET /api/listings/:id', () => {
    const result = findCacheConfig('GET', '/api/listings/some-uuid', CACHE_CONFIG);
    expect(result).toBeDefined();
    expect(result!.maxAge).toBe(600);
  });

  it('returns config for POST /api/listings/filter', () => {
    const result = findCacheConfig('POST', '/api/listings/filter', CACHE_CONFIG);
    expect(result).toBeDefined();
    expect(result!.maxAge).toBe(0);
    expect(result!.etag).toBe(false);
  });

  it('returns undefined for unknown route', () => {
    const result = findCacheConfig('GET', '/api/search', CACHE_CONFIG);
    expect(result).toBeUndefined();
  });

  it('prefers exact match over parameterized route', () => {
    // /api/listings/filter should match the exact POST route, not the :id GET route
    const result = findCacheConfig('POST', '/api/listings/filter', CACHE_CONFIG);
    expect(result).toBeDefined();
    expect(result!.path).toBe('/api/listings/filter');
  });
});

describe('computeETag', () => {
  it('returns a weak ETag string', () => {
    const etag = computeETag('hello');
    expect(etag).toMatch(/^W\/"[a-f0-9]+"/);
  });

  it('produces the same ETag for the same content', () => {
    const etag1 = computeETag('{"items":[1,2,3]}');
    const etag2 = computeETag('{"items":[1,2,3]}');
    expect(etag1).toBe(etag2);
  });

  it('produces different ETags for different content', () => {
    const etag1 = computeETag('{"items":[1,2,3]}');
    const etag2 = computeETag('{"items":[4,5,6]}');
    expect(etag1).not.toBe(etag2);
  });

  it('handles Buffer input', () => {
    const etag = computeETag(Buffer.from('hello'));
    expect(etag).toMatch(/^W\/"[a-f0-9]+"/);
  });
});

describe('cacheMiddleware', () => {
  let next: NextFunction;

  beforeEach(() => {
    next = vi.fn();
  });

  it('sets Cache-Control: public, max-age=300 for GET /api/listings', () => {
    const req = createMockReq({ method: 'GET', path: '/api/listings' });
    const res = createMockRes();
    const middleware = cacheMiddleware();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();

    // Trigger the response
    res.json({ items: [] });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
  });

  it('sets Cache-Control: public, max-age=600 for GET /api/listings/:id', () => {
    const req = createMockReq({ method: 'GET', path: '/api/listings/abc-123' });
    const res = createMockRes();
    const middleware = cacheMiddleware();

    middleware(req, res, next);
    res.json({ id: 'abc-123' });
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=600');
  });

  it('sets Cache-Control: no-store for POST /api/listings/filter', () => {
    const req = createMockReq({ method: 'POST', path: '/api/listings/filter' });
    const res = createMockRes();
    const middleware = cacheMiddleware();

    middleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-store');
    expect(next).toHaveBeenCalled();
  });

  it('attaches ETag header on cacheable responses', () => {
    const req = createMockReq({ method: 'GET', path: '/api/listings' });
    const res = createMockRes();
    const middleware = cacheMiddleware();

    middleware(req, res, next);
    res.json({ items: [1, 2, 3] });

    expect(res.setHeader).toHaveBeenCalledWith('ETag', expect.stringMatching(/^W\/"[a-f0-9]+"/));
  });

  it('does not attach ETag for routes with etag: false', () => {
    const req = createMockReq({ method: 'POST', path: '/api/listings/filter' });
    const res = createMockRes();
    const middleware = cacheMiddleware();

    middleware(req, res, next);
    // no-store is set immediately, no ETag logic runs
    const etagCalls = (res.setHeader as ReturnType<typeof vi.fn>).mock.calls.filter(
      (call) => call[0] === 'ETag',
    );
    expect(etagCalls).toHaveLength(0);
  });

  it('returns 304 when If-None-Match matches the ETag', () => {
    const body = { items: [1, 2, 3] };
    const expectedEtag = computeETag(JSON.stringify(body));

    const req = createMockReq({
      method: 'GET',
      path: '/api/listings',
      headers: { 'if-none-match': expectedEtag },
    });
    const res = createMockRes();
    const middleware = cacheMiddleware();

    middleware(req, res, next);
    res.json(body);

    expect(res.status).toHaveBeenCalledWith(304);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns full response when If-None-Match does not match', () => {
    const body = { items: [1, 2, 3] };

    const req = createMockReq({
      method: 'GET',
      path: '/api/listings',
      headers: { 'if-none-match': 'W/"stale-etag"' },
    });
    const res = createMockRes();
    const middleware = cacheMiddleware();

    middleware(req, res, next);

    // The original json should be called (not 304)
    const originalJsonSpy = res.json;
    res.json(body);

    // Should NOT have returned 304
    expect(res.status).not.toHaveBeenCalledWith(304);
  });

  it('skips caching logic for routes not in config', () => {
    const req = createMockReq({ method: 'GET', path: '/api/search' });
    const res = createMockRes();
    const middleware = cacheMiddleware();

    middleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('works with res.send as well as res.json', () => {
    const req = createMockReq({ method: 'GET', path: '/api/listings' });
    const res = createMockRes();
    const middleware = cacheMiddleware();

    middleware(req, res, next);
    res.send('plain text response');

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=300');
    expect(res.setHeader).toHaveBeenCalledWith('ETag', expect.stringMatching(/^W\/"[a-f0-9]+"/));
  });

  it('accepts custom config', () => {
    const customConfig: CacheConfig = {
      routes: [
        { path: '/api/custom', method: 'GET', maxAge: 120, isPublic: false, etag: true },
      ],
    };

    const req = createMockReq({ method: 'GET', path: '/api/custom' });
    const res = createMockRes();
    const middleware = cacheMiddleware(customConfig);

    middleware(req, res, next);
    res.json({ data: 'test' });

    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, max-age=120');
  });
});
