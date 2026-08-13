import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock database
const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

// Mock env
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
 * Unit tests for Image Proxy endpoint
 *
 * Tests: placeholder fallback, cache hit/miss paths, content-type detection,
 * URL encoding/decoding
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4
 */

// ============================================================
// Helpers
// ============================================================

function createReq(encodedUrl: string) {
  return { params: { encodedUrl } } as any;
}

function createRes() {
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

function createMockFetchResponse(ok: boolean, contentType: string, data: Buffer, status = 200) {
  return {
    ok,
    status,
    headers: new Map([['content-type', contentType]]) as any,
    arrayBuffer: async () => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  };
}

// ============================================================
// Tests
// ============================================================

describe('Image Proxy Unit Tests', () => {
  let handler: (req: any, res: any) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module = await import('./images.js');
    const router = module.imagesRouter;

    // Extract the GET /:encodedUrl handler
    const layer = (router as any).stack.find(
      (l: any) => l.route && l.route.path === '/:encodedUrl' && l.route.methods.get,
    );
    handler = layer.route.stack[0].handle;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================
  // Requirement 2.1: Endpoint at /api/images/:encodedUrl
  // ============================================================
  describe('URL encoding/decoding (Requirement 2.1)', () => {
    it('should decode a valid encoded URL and use it to fetch the image', async () => {
      const originalUrl = 'https://prod.pictures.autoscout24.net/listing-images/abc/image.jpg';
      const encodedUrl = encodeURIComponent(originalUrl);

      // No cache entry
      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const imageData = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]); // JPEG magic bytes
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(true, 'image/jpeg', imageData));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      // Verify fetch was called with the decoded URL
      expect(mockFetch).toHaveBeenCalledWith(
        originalUrl,
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 for an invalid encoded URL (malformed percent-encoding)', async () => {
      const invalidEncodedUrl = '%ZZinvalid%';

      const req = createReq(invalidEncodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid encoded URL' });
    });

    it('should handle URLs with special characters (query params, fragments)', async () => {
      const originalUrl = 'https://example.com/image?w=400&h=300&quality=80';
      const encodedUrl = encodeURIComponent(originalUrl);

      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const imageData = Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG magic bytes
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(true, 'image/png', imageData));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(mockFetch).toHaveBeenCalledWith(
        originalUrl,
        expect.objectContaining({ headers: expect.any(Object) }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ============================================================
  // Requirement 2.2: Fetch, cache, and serve with Content-Type
  // ============================================================
  describe('Fetch, cache, and content-type detection (Requirement 2.2)', () => {
    it('should fetch image from source, write to disk, and store cache entry in DB', async () => {
      const originalUrl = 'https://cdn.example.com/car.jpg';
      const encodedUrl = encodeURIComponent(originalUrl);
      const imageData = Buffer.from('fake-jpeg-data');

      // No existing cache entry
      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      mockFetch.mockResolvedValueOnce(createMockFetchResponse(true, 'image/jpeg', imageData));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      // Verify file was written
      expect(mockWriteFileSync).toHaveBeenCalledWith(expect.any(String), imageData);

      // Verify DB upsert was called
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO image_cache'),
        expect.arrayContaining([encodedUrl, originalUrl, 'image/jpeg']),
      );

      // Verify response
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(imageData);
    });

    it('should detect and forward image/png content type', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/car.png');
      const imageData = Buffer.from('fake-png-data');

      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      mockFetch.mockResolvedValueOnce(createMockFetchResponse(true, 'image/png', imageData));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/png');
    });

    it('should detect and forward image/webp content type', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/car.webp');
      const imageData = Buffer.from('fake-webp-data');

      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      mockFetch.mockResolvedValueOnce(createMockFetchResponse(true, 'image/webp', imageData));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/webp');
    });

    it('should return placeholder when source returns non-image content type', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/not-an-image');

      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      // Return HTML instead of an image
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(true, 'text/html', Buffer.from('<html>Not found</html>')));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      // Should get placeholder since content type is not image/*
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should set Cache-Control: public, max-age=86400 on successful responses', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/car.jpg');
      const imageData = Buffer.from('fake-jpeg-data');

      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(true, 'image/jpeg', imageData));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
    });
  });

  // ============================================================
  // Requirement 2.3: Serve cached version if < 24 hours old
  // ============================================================
  describe('Cache hit/miss paths (Requirement 2.3)', () => {
    it('should serve from cache when entry is fresh (< 24h) and file exists', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/cached.jpg');
      const imageData = Buffer.from('cached-image-data');
      const cachedAt = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago

      mockQueryOne.mockResolvedValueOnce({
        id: 'cache-id-1',
        encoded_url: encodedUrl,
        original_url: 'https://cdn.example.com/cached.jpg',
        content_type: 'image/jpeg',
        file_path: '/cache/abc123',
        file_size_bytes: imageData.length,
        cached_at: cachedAt,
        last_accessed: cachedAt,
      });

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(imageData);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      // Should NOT fetch from source
      expect(mockFetch).not.toHaveBeenCalled();

      // Should serve cached data
      expect(res.send).toHaveBeenCalledWith(imageData);
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');

      // Should update last_accessed
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE image_cache SET last_accessed'),
        ['cache-id-1'],
      );
    });

    it('should re-fetch when cache entry is expired (>= 24h)', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/expired.jpg');
      const cachedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
      const freshData = Buffer.from('fresh-image-data');

      mockQueryOne.mockResolvedValueOnce({
        id: 'cache-id-2',
        encoded_url: encodedUrl,
        original_url: 'https://cdn.example.com/expired.jpg',
        content_type: 'image/jpeg',
        file_path: '/cache/expired',
        file_size_bytes: 100,
        cached_at: cachedAt,
        last_accessed: cachedAt,
      });

      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(true, 'image/jpeg', freshData));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      // Should fetch from source since cache is expired
      expect(mockFetch).toHaveBeenCalled();

      // Should respond with fresh data
      expect(res.send).toHaveBeenCalledWith(freshData);
    });

    it('should re-fetch when cache entry exists but file is missing from disk', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/missing-file.jpg');
      const cachedAt = new Date(Date.now() - 1000 * 60); // 1 minute ago (fresh)
      const freshData = Buffer.from('re-fetched-data');

      mockQueryOne.mockResolvedValueOnce({
        id: 'cache-id-3',
        encoded_url: encodedUrl,
        original_url: 'https://cdn.example.com/missing-file.jpg',
        content_type: 'image/jpeg',
        file_path: '/cache/missing',
        file_size_bytes: 100,
        cached_at: cachedAt,
        last_accessed: cachedAt,
      });

      // File does NOT exist on disk
      mockExistsSync.mockReturnValue(false);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(true, 'image/jpeg', freshData));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      // Should fetch from source since file is missing
      expect(mockFetch).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(freshData);
    });

    it('should fetch from source when no cache entry exists at all', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/brand-new.jpg');
      const imageData = Buffer.from('new-image-data');

      // No cache entry in DB
      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(true, 'image/jpeg', imageData));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(mockFetch).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(imageData);
    });
  });

  // ============================================================
  // Requirement 2.4: Placeholder on source error (HTTP 200)
  // ============================================================
  describe('Placeholder fallback (Requirement 2.4)', () => {
    it('should return placeholder with HTTP 200 when source returns 404', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/deleted.jpg');

      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      mockFetch.mockResolvedValueOnce(createMockFetchResponse(false, 'text/html', Buffer.from(''), 404));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
      // Verify it's actually an SVG placeholder
      expect(res.sentBody).toBeInstanceOf(Buffer);
      expect(res.sentBody!.toString()).toContain('svg');
    });

    it('should return placeholder with HTTP 200 when source returns 500', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/server-error.jpg');

      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      mockFetch.mockResolvedValueOnce(createMockFetchResponse(false, 'text/plain', Buffer.from(''), 500));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
    });

    it('should return placeholder with HTTP 200 when fetch throws (network error)', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/network-fail.jpg');

      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
    });

    it('should return placeholder with HTTP 200 when fetch times out', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/timeout.jpg');

      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      mockFetch.mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
    });

    it('should return placeholder with HTTP 200 when database query throws', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/db-fail.jpg');

      // DB throws error
      mockQueryOne.mockRejectedValueOnce(new Error('Connection refused'));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      // Even on unexpected errors, placeholder with 200
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
    });

    it('should set Cache-Control header even on placeholder responses', async () => {
      const encodedUrl = encodeURIComponent('https://cdn.example.com/gone.jpg');

      mockQueryOne.mockResolvedValueOnce(null);
      mockExistsSync.mockReturnValue(true);
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
      mockFetch.mockResolvedValueOnce(createMockFetchResponse(false, 'text/html', Buffer.from(''), 403));

      const req = createReq(encodedUrl);
      const res = createRes();

      await handler(req, res);

      expect(res.set).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
    });
  });
});
