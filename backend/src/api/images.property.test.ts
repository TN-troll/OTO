import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

// Mock database
const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

// Mock env (required by transitive imports)
vi.mock('../config/env.js', () => ({
  env: {
    DATABASE_URL: 'postgresql://localhost:5432/car_ads_test',
    REDIS_URL: 'redis://localhost:6379',
    PORT: 3000,
    NODE_ENV: 'test',
  },
}));

// Mock file system
const mockExistsSync = vi.fn();
const mockReadFileSync = vi.fn();
const mockWriteFileSync = vi.fn();
const mockMkdirSync = vi.fn();
vi.mock('fs', () => ({
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

/**
 * Property 3: Image Cache TTL Decision
 *
 * For any cached image entry with a known cached-at timestamp, the image proxy
 * SHALL serve from cache if and only if the current time minus the cached-at
 * timestamp is less than 24 hours (86400 seconds). If the cache entry is 24 hours
 * or older, the proxy SHALL re-fetch from the source.
 *
 * **Validates: Requirements 2.3, 2.6**
 */

// ============================================================
// Constants
// ============================================================

const CACHE_TTL_SECONDS = 86400; // 24 hours
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;

// ============================================================
// Helpers
// ============================================================

/** Create a mock Express request for the image proxy */
function createImageReq(encodedUrl: string) {
  return {
    params: { encodedUrl },
  } as any;
}

/** Create a mock Express response that captures output */
function createImageRes() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let sentBody: Buffer | string | undefined;

  const res = {
    _headers: headers,
    get statusCode() { return statusCode; },
    get sentBody() { return sentBody; },
    set: vi.fn((name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    }),
    status: vi.fn(function (code: number) {
      statusCode = code;
      return res;
    }),
    send: vi.fn(function (body: Buffer | string) {
      sentBody = body;
      return res;
    }),
    json: vi.fn(function (body: unknown) {
      sentBody = JSON.stringify(body) as string;
      return res;
    }),
  };
  return res;
}

// ============================================================
// Generators
// ============================================================

/** Generate a random encoded URL string */
const encodedUrlArb = fc.webUrl().map((url) => encodeURIComponent(url));

/** Generate a cache age in milliseconds that is strictly LESS than 24 hours (cache hit) */
const freshAgeArb = fc.integer({ min: 0, max: CACHE_TTL_MS - 1 });

/** Generate a cache age in milliseconds that is >= 24 hours (cache miss / expired) */
const expiredAgeArb = fc.integer({ min: CACHE_TTL_MS, max: CACHE_TTL_MS * 10 });

/** Random image content type */
const imageContentTypeArb = fc.oneof(
  fc.constant('image/jpeg'),
  fc.constant('image/png'),
  fc.constant('image/webp'),
  fc.constant('image/gif'),
);

/** Random image file data (small buffer) */
const imageDataArb = fc.uint8Array({ minLength: 10, maxLength: 100 }).map((arr) => Buffer.from(arr));

// ============================================================
// Tests
// ============================================================

describe('Property 3: Image Cache TTL Decision', () => {
  let handler: (req: any, res: any) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Dynamically import the router to get the handler
    const module = await import('./images.js');
    const router = module.imagesRouter;

    // Extract the GET /:encodedUrl handler from the router stack
    const layer = (router as any).stack.find(
      (l: any) => l.route && l.route.path === '/:encodedUrl' && l.route.methods.get,
    );
    handler = layer.route.stack[0].handle;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should serve from cache (cache hit) when cached-at timestamp is less than 24 hours old', async () => {
    await fc.assert(
      fc.asyncProperty(
        encodedUrlArb,
        freshAgeArb,
        imageContentTypeArb,
        imageDataArb,
        async (encodedUrl, ageMs, contentType, imageData) => {
          mockQuery.mockReset();
          mockQueryOne.mockReset();
          mockFetch.mockReset();
          mockExistsSync.mockReset();
          mockReadFileSync.mockReset();

          // Fix Date.now() to prevent timing race near the TTL boundary
          const now = Date.now();
          vi.spyOn(Date, 'now').mockReturnValue(now);

          const cachedAt = new Date(now - ageMs);

          // Simulate existing cache entry in database
          mockQueryOne.mockResolvedValueOnce({
            id: 'test-id',
            encoded_url: encodedUrl,
            original_url: decodeURIComponent(encodedUrl),
            content_type: contentType,
            file_path: '/cache/test-file',
            file_size_bytes: imageData.length,
            cached_at: cachedAt,
            last_accessed: cachedAt,
          });

          // File exists on disk
          mockExistsSync.mockReturnValue(true);
          mockReadFileSync.mockReturnValue(imageData);

          // Allow DB update for last_accessed
          mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

          const req = createImageReq(encodedUrl);
          const res = createImageRes();

          await handler(req, res);

          // Should serve from cache — NOT call fetch
          expect(mockFetch).not.toHaveBeenCalled();

          // Should respond with the cached image data
          expect(res.send).toHaveBeenCalledWith(imageData);

          // Should set correct content type
          expect(res.set).toHaveBeenCalledWith('Content-Type', contentType);

          // Should set Cache-Control with max-age=86400
          expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');

          vi.spyOn(Date, 'now').mockRestore();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should re-fetch from source (cache miss) when cached-at timestamp is 24 hours or older', async () => {
    await fc.assert(
      fc.asyncProperty(
        encodedUrlArb,
        expiredAgeArb,
        imageContentTypeArb,
        imageDataArb,
        async (encodedUrl, ageMs, contentType, imageData) => {
          mockQuery.mockReset();
          mockQueryOne.mockReset();
          mockFetch.mockReset();
          mockExistsSync.mockReset();
          mockReadFileSync.mockReset();
          mockWriteFileSync.mockReset();
          mockMkdirSync.mockReset();

          const cachedAt = new Date(Date.now() - ageMs);

          // Simulate expired cache entry in database
          mockQueryOne.mockResolvedValueOnce({
            id: 'test-id',
            encoded_url: encodedUrl,
            original_url: decodeURIComponent(encodedUrl),
            content_type: contentType,
            file_path: '/cache/test-file',
            file_size_bytes: imageData.length,
            cached_at: cachedAt,
            last_accessed: cachedAt,
          });

          // File exists on disk but is expired
          mockExistsSync.mockReturnValue(true);

          // Mock a successful fetch from source
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Map([['content-type', contentType]]) as any,
            arrayBuffer: async () => imageData.buffer.slice(
              imageData.byteOffset,
              imageData.byteOffset + imageData.byteLength,
            ),
          });

          // Allow DB upsert
          mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

          const req = createImageReq(encodedUrl);
          const res = createImageRes();

          await handler(req, res);

          // Should call fetch to re-fetch from source
          expect(mockFetch).toHaveBeenCalled();

          // Should set Cache-Control header with max-age=86400
          expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should treat the boundary at exactly 86400 seconds (24h) as expired (re-fetch)', async () => {
    await fc.assert(
      fc.asyncProperty(
        encodedUrlArb,
        imageContentTypeArb,
        imageDataArb,
        async (encodedUrl, contentType, imageData) => {
          mockQuery.mockReset();
          mockQueryOne.mockReset();
          mockFetch.mockReset();
          mockExistsSync.mockReset();
          mockReadFileSync.mockReset();
          mockWriteFileSync.mockReset();
          mockMkdirSync.mockReset();

          // Exactly 24 hours (86400 seconds) ago
          const cachedAt = new Date(Date.now() - CACHE_TTL_MS);

          // Simulate cache entry with exactly 24h age
          mockQueryOne.mockResolvedValueOnce({
            id: 'test-id',
            encoded_url: encodedUrl,
            original_url: decodeURIComponent(encodedUrl),
            content_type: contentType,
            file_path: '/cache/test-file',
            file_size_bytes: imageData.length,
            cached_at: cachedAt,
            last_accessed: cachedAt,
          });

          // File exists on disk
          mockExistsSync.mockReturnValue(true);

          // Mock fetch since it should re-fetch
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Map([['content-type', contentType]]) as any,
            arrayBuffer: async () => imageData.buffer.slice(
              imageData.byteOffset,
              imageData.byteOffset + imageData.byteLength,
            ),
          });

          // Allow DB upsert
          mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

          const req = createImageReq(encodedUrl);
          const res = createImageRes();

          await handler(req, res);

          // At exactly 24h, the age equals CACHE_TTL_MS, so age < CACHE_TTL_MS is false.
          // The proxy SHOULD re-fetch (treat as expired).
          expect(mockFetch).toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});
