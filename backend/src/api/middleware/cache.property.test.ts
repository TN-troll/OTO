import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import type { Request, Response, NextFunction } from 'express';
import { computeETag, cacheMiddleware } from './cache.js';
import type { CacheConfig } from './cache.js';

/**
 * Property 11: ETag Consistency and Conditional Requests
 *
 * For any cacheable API response, the ETag SHALL be a deterministic hash of the
 * response content. For the same content, the ETag SHALL always be identical.
 * For different content, the ETag SHALL differ. When a client sends If-None-Match
 * matching the current ETag, the server SHALL respond with 304 and no body.
 *
 * Validates: Requirements 8.4, 8.5
 */

// ============================================================
// Test helpers
// ============================================================

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

function createMockRes(): Response & {
  _headers: Record<string, string>;
  _statusCode: number | null;
  _ended: boolean;
  _sentBody: unknown;
} {
  const headers: Record<string, string> = {};
  const state = { statusCode: null as number | null, ended: false, sentBody: undefined as unknown };

  const res = {
    _headers: headers,
    get _statusCode() { return state.statusCode; },
    get _ended() { return state.ended; },
    get _sentBody() { return state.sentBody; },
    setHeader: vi.fn((name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    }),
    status: vi.fn(function (this: unknown, code: number) {
      state.statusCode = code;
      return res;
    }),
    end: vi.fn(function () {
      state.ended = true;
      return res;
    }),
    json: vi.fn(function (body: unknown) {
      state.sentBody = body;
      return res;
    }),
    send: vi.fn(function (body: unknown) {
      state.sentBody = body;
      return res;
    }),
  } as unknown as Response & {
    _headers: Record<string, string>;
    _statusCode: number | null;
    _ended: boolean;
    _sentBody: unknown;
  };
  return res;
}

/** Cache config that enables ETag for GET /api/listings */
const TEST_CACHE_CONFIG: CacheConfig = {
  routes: [
    { path: '/api/listings', method: 'GET', maxAge: 300, isPublic: true, etag: true },
  ],
};

// ============================================================
// Generators
// ============================================================

/** Arbitrary JSON-serializable objects to use as response bodies */
const arbJsonBody = fc.oneof(
  fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }),
    fc.oneof(
      fc.string({ maxLength: 100 }),
      fc.integer(),
      fc.boolean(),
      fc.constant(null),
      fc.array(fc.integer(), { maxLength: 5 }),
    ),
    { minKeys: 1, maxKeys: 10 },
  ),
  fc.array(fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string({ maxLength: 50 }), { minKeys: 1, maxKeys: 5 }), { minLength: 1, maxLength: 5 }),
);

/** Arbitrary non-empty string content */
const arbStringBody = fc.string({ minLength: 1, maxLength: 500 });

// ============================================================
// Property tests
// ============================================================

describe('Property 11: ETag Consistency and Conditional Requests', () => {
  it('same content always produces the same ETag (deterministic)', () => {
    fc.assert(
      fc.property(arbStringBody, (content) => {
        const etag1 = computeETag(content);
        const etag2 = computeETag(content);

        // Deterministic: same input → same output
        expect(etag1).toBe(etag2);

        // Format check: must be a weak ETag
        expect(etag1).toMatch(/^W\/"[a-f0-9]+"/);
      }),
      { numRuns: 100 },
    );
  });

  it('different content produces different ETags', () => {
    fc.assert(
      fc.property(
        arbStringBody,
        arbStringBody,
        (content1, content2) => {
          // Pre-condition: only test when contents actually differ
          fc.pre(content1 !== content2);

          const etag1 = computeETag(content1);
          const etag2 = computeETag(content2);

          expect(etag1).not.toBe(etag2);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when If-None-Match matches the ETag, server responds with 304 and no body', () => {
    fc.assert(
      fc.property(arbJsonBody, (body) => {
        const bodyStr = JSON.stringify(body);
        const expectedEtag = computeETag(bodyStr);

        // Create request with matching If-None-Match
        const req = createMockReq({
          method: 'GET',
          path: '/api/listings',
          headers: { 'if-none-match': expectedEtag },
        });
        const res = createMockRes();
        const next: NextFunction = vi.fn();
        const middleware = cacheMiddleware(TEST_CACHE_CONFIG);

        // Apply middleware and send response
        middleware(req, res, next);
        res.json(body);

        // Should respond with 304
        expect(res._statusCode).toBe(304);
        // Should call end() (no body sent)
        expect(res._ended).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('when If-None-Match does NOT match the ETag, server responds with full body', () => {
    fc.assert(
      fc.property(arbJsonBody, (body) => {
        // Use a stale/non-matching ETag
        const req = createMockReq({
          method: 'GET',
          path: '/api/listings',
          headers: { 'if-none-match': 'W/"stale-non-matching-etag"' },
        });
        const res = createMockRes();
        const next: NextFunction = vi.fn();
        const middleware = cacheMiddleware(TEST_CACHE_CONFIG);

        middleware(req, res, next);
        res.json(body);

        // Should NOT return 304
        expect(res._statusCode).not.toBe(304);
        // Should NOT have ended without body
        expect(res._ended).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});
