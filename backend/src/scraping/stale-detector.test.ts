import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock database
const mockQuery = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: vi.fn(),
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

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import { StaleDetector } from './stale-detector.js';
import type { StaleDetectionResult, ListingCheckResult } from './stale-detector.js';

describe('StaleDetector', () => {
  let detector: StaleDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    detector = new StaleDetector();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('checkListing', () => {
    it('should mark listing as sold when source returns 404', async () => {
      mockFetch.mockResolvedValueOnce({ status: 404 });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await detector.checkListing('listing-1', 'https://autoscout24.nl/ad/123');

      expect(result.newStatus).toBe('sold');
      expect(result.httpStatus).toBe(404);
      expect(result.retryCount).toBe(0);

      // Verify the SQL update was called with 'sold' status
      const updateCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes("status = 'sold'"),
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1]![0]).toBe('listing-1');
    });

    it('should mark listing as sold when source returns 410 (Gone)', async () => {
      mockFetch.mockResolvedValueOnce({ status: 410 });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await detector.checkListing('listing-2', 'https://autoscout24.nl/ad/456');

      expect(result.newStatus).toBe('sold');
      expect(result.httpStatus).toBe(410);
    });

    it('should mark listing as active and update last_verified when source returns 200', async () => {
      mockFetch.mockResolvedValueOnce({ status: 200 });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await detector.checkListing('listing-3', 'https://autoscout24.nl/ad/789');

      expect(result.newStatus).toBe('active');
      expect(result.httpStatus).toBe(200);

      // Verify last_verified was updated
      const updateCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('last_verified = NOW()'),
      );
      expect(updateCall).toBeDefined();
    });

    it('should mark listing as stale after 3 failed retries on timeout', async () => {
      // Simulate abort errors (timeouts) for all attempts (initial + 3 retries = 4 calls)
      mockFetch
        .mockRejectedValueOnce(new Error('The operation was aborted'))
        .mockRejectedValueOnce(new Error('The operation was aborted'))
        .mockRejectedValueOnce(new Error('The operation was aborted'))
        .mockRejectedValueOnce(new Error('The operation was aborted'));
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const resultPromise = detector.checkListing('listing-4', 'https://autoscout24.nl/ad/timeout');

      // Advance through all retry delays (3 retries × 5 seconds)
      await vi.advanceTimersByTimeAsync(5_000);
      await vi.advanceTimersByTimeAsync(5_000);
      await vi.advanceTimersByTimeAsync(5_000);

      const result = await resultPromise;

      expect(result.newStatus).toBe('stale');
      expect(result.httpStatus).toBeNull();
      expect(result.retryCount).toBe(4); // initial attempt + 3 retries

      // Verify the SQL update was called with 'stale' status
      const updateCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes("status = 'stale'"),
      );
      expect(updateCall).toBeDefined();
    });

    it('should not change status on 5xx server errors', async () => {
      mockFetch.mockResolvedValueOnce({ status: 503 });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await detector.checkListing('listing-5', 'https://autoscout24.nl/ad/error');

      expect(result.newStatus).toBe('active');
      expect(result.httpStatus).toBe(503);

      // Should only update last_verified (not status change to sold/stale)
      const soldCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes("status = 'sold'"),
      );
      const staleCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes("status = 'stale'"),
      );
      expect(soldCall).toBeUndefined();
      expect(staleCall).toBeUndefined();
    });

    it('should succeed on retry after initial timeout', async () => {
      // First attempt times out, second succeeds
      mockFetch
        .mockRejectedValueOnce(new Error('The operation was aborted'))
        .mockResolvedValueOnce({ status: 200 });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const resultPromise = detector.checkListing('listing-6', 'https://autoscout24.nl/ad/retry');

      // Advance past the first retry delay
      await vi.advanceTimersByTimeAsync(5_000);

      const result = await resultPromise;

      expect(result.newStatus).toBe('active');
      expect(result.httpStatus).toBe(200);
      expect(result.retryCount).toBe(1);
    });

    it('should record sold_at timestamp when marking as sold', async () => {
      mockFetch.mockResolvedValueOnce({ status: 404 });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      const result = await detector.checkListing('listing-7', 'https://autoscout24.nl/ad/sold');

      // The sold_at parameter should be a Date
      const updateCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes("status = 'sold'"),
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1]![1]).toBeInstanceOf(Date);
    });

    it('should fetch source URL from DB when not provided', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ url: 'https://autoscout24.nl/ad/fromdb' }] })
        .mockResolvedValue({ rows: [], rowCount: 1 });
      mockFetch.mockResolvedValueOnce({ status: 200 });

      const result = await detector.checkListing('listing-8');

      expect(result.sourceUrl).toBe('https://autoscout24.nl/ad/fromdb');
      expect(result.newStatus).toBe('active');
    });

    it('should throw when no source URL is found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await expect(detector.checkListing('listing-missing')).rejects.toThrow(
        'No source URL found for listing listing-missing',
      );
    });

    it('should preserve all existing listing data (only UPDATE specific columns)', async () => {
      mockFetch.mockResolvedValueOnce({ status: 404 });
      mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });

      await detector.checkListing('listing-preserve', 'https://autoscout24.nl/ad/preserve');

      // Verify SQL only updates status, sold_at, stale_check_count, and updated_at
      const updateCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes("status = 'sold'"),
      );
      expect(updateCall).toBeDefined();
      const sql = updateCall![0] as string;
      // Should NOT contain DELETE or REPLACE or overwrite other columns
      expect(sql).not.toContain('DELETE');
      expect(sql).toContain('UPDATE listings');
      expect(sql).toContain('SET status');
      expect(sql).toContain('sold_at');
      expect(sql).toContain('stale_check_count');
      expect(sql).toContain('updated_at');
    });
  });

  describe('runBatch', () => {
    it('should process a batch of listings and return aggregate results', async () => {
      // Return two listings from DB
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM listings') && sql.includes('LIMIT')) {
          return {
            rows: [
              { listing_id: 'l1', source_url: 'https://autoscout24.nl/ad/1', source_reference_id: 'sr-1' },
              { listing_id: 'l2', source_url: 'https://autoscout24.nl/ad/2', source_reference_id: 'sr-2' },
            ],
          };
        }
        return { rows: [], rowCount: 1 };
      });

      // First listing: 404 (sold), second listing: 200 (active)
      mockFetch
        .mockResolvedValueOnce({ status: 404 })
        .mockResolvedValueOnce({ status: 200 });

      const result = await detector.runBatch(50);

      expect(result.checked).toBe(2);
      expect(result.markedSold).toBe(1);
      expect(result.markedStale).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should return empty results when no active listings exist', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await detector.runBatch(50);

      expect(result.checked).toBe(0);
      expect(result.markedSold).toBe(0);
      expect(result.markedStale).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should count errors when checkListing throws unexpectedly', async () => {
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM listings') && sql.includes('LIMIT')) {
          return {
            rows: [
              { listing_id: 'l-error', source_url: 'https://autoscout24.nl/ad/err', source_reference_id: 'sr-err' },
            ],
          };
        }
        // Throw on update to simulate an unexpected DB error
        throw new Error('DB connection lost');
      });

      mockFetch.mockResolvedValueOnce({ status: 404 });

      const result = await detector.runBatch(50);

      expect(result.checked).toBe(1);
      expect(result.errors).toBe(1);
    });

    it('should use default batch size of 50', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await detector.runBatch();

      const selectCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('LIMIT'),
      );
      expect(selectCall).toBeDefined();
      expect(selectCall![1]).toContain(50);
    });

    it('should respect custom batch size', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      await detector.runBatch(10);

      const selectCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('LIMIT'),
      );
      expect(selectCall).toBeDefined();
      expect(selectCall![1]).toContain(10);
    });
  });
});
