import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';

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

/**
 * Property 1: Stale Detection Status Update
 *
 * For any listing and for any HTTP response code from its source URL, the stale
 * detector SHALL update the listing status to "sold" if and only if the response
 * code is 404 or 410. When marking as sold, all existing listing data fields
 * SHALL remain unchanged and a `sold_at` timestamp SHALL be recorded.
 *
 * **Validates: Requirements 1.1, 1.5**
 */

// ============================================================
// Arbitrary generators
// ============================================================

/** Generate a random listing ID (UUID-like string). */
const listingIdArb = fc.uuid();

/** Generate a random source URL. */
const sourceUrlArb = fc.webUrl();

/** Generate only the "sold" trigger codes: 404 or 410. */
const soldTriggerCodeArb = fc.oneof(fc.constant(404), fc.constant(410));

/** Generate any HTTP status code (100-599) that is NOT 404 or 410. */
const nonSoldTriggerCodeArb = fc.integer({ min: 100, max: 599 }).filter(
  (code) => code !== 404 && code !== 410,
);

// ============================================================
// Tests
// ============================================================

describe('Property 1: Stale Detection Status Update', () => {
  let detector: StaleDetector;

  beforeEach(() => {
    vi.clearAllMocks();
    detector = new StaleDetector();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should mark listing as "sold" if and only if the HTTP response code is 404 or 410', async () => {
    await fc.assert(
      fc.asyncProperty(
        listingIdArb,
        sourceUrlArb,
        soldTriggerCodeArb,
        async (listingId, sourceUrl, statusCode) => {
          mockQuery.mockReset();
          mockFetch.mockReset();
          mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
          mockFetch.mockResolvedValueOnce({ status: statusCode });

          const result = await detector.checkListing(listingId, sourceUrl);

          // Status MUST be "sold" for 404/410
          expect(result.newStatus).toBe('sold');
          expect(result.httpStatus).toBe(statusCode);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should NOT mark listing as "sold" for any HTTP status code other than 404 or 410', async () => {
    await fc.assert(
      fc.asyncProperty(
        listingIdArb,
        sourceUrlArb,
        nonSoldTriggerCodeArb,
        async (listingId, sourceUrl, statusCode) => {
          mockQuery.mockReset();
          mockFetch.mockReset();
          mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
          mockFetch.mockResolvedValueOnce({ status: statusCode });

          const result = await detector.checkListing(listingId, sourceUrl);

          // Status MUST NOT be "sold" for any other code
          expect(result.newStatus).not.toBe('sold');
          expect(result.httpStatus).toBe(statusCode);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should preserve all existing listing data when marking as sold (only update status, sold_at, stale_check_count, updated_at)', async () => {
    await fc.assert(
      fc.asyncProperty(
        listingIdArb,
        sourceUrlArb,
        soldTriggerCodeArb,
        async (listingId, sourceUrl, statusCode) => {
          mockQuery.mockReset();
          mockFetch.mockReset();
          mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
          mockFetch.mockResolvedValueOnce({ status: statusCode });

          await detector.checkListing(listingId, sourceUrl);

          // Find the UPDATE query that sets status to 'sold'
          const updateCall = mockQuery.mock.calls.find(
            (call) => typeof call[0] === 'string' && call[0].includes("status = 'sold'"),
          );
          expect(updateCall).toBeDefined();

          const sql = updateCall![0] as string;

          // The UPDATE should target the listings table with a WHERE clause on the listing ID
          expect(sql).toContain('UPDATE listings');
          expect(sql).toContain('WHERE id = $1');

          // It should SET only specific columns (preserving all other data)
          expect(sql).toContain('SET');
          expect(sql).toContain("status = 'sold'");
          expect(sql).toContain('sold_at');
          expect(sql).toContain('stale_check_count');
          expect(sql).toContain('updated_at');

          // It should NOT use destructive operations
          expect(sql).not.toContain('DELETE');
          expect(sql).not.toContain('DROP');
          expect(sql).not.toContain('TRUNCATE');
          expect(sql).not.toContain('INSERT');

          // The listing ID parameter should match the input
          expect(updateCall![1]![0]).toBe(listingId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('should record a sold_at timestamp as a Date when marking as sold', async () => {
    await fc.assert(
      fc.asyncProperty(
        listingIdArb,
        sourceUrlArb,
        soldTriggerCodeArb,
        async (listingId, sourceUrl, statusCode) => {
          mockQuery.mockReset();
          mockFetch.mockReset();
          mockQuery.mockResolvedValue({ rows: [], rowCount: 1 });
          mockFetch.mockResolvedValueOnce({ status: statusCode });

          const beforeCheck = new Date();
          await detector.checkListing(listingId, sourceUrl);
          const afterCheck = new Date();

          // Find the UPDATE query that sets status to 'sold'
          const updateCall = mockQuery.mock.calls.find(
            (call) => typeof call[0] === 'string' && call[0].includes("status = 'sold'"),
          );
          expect(updateCall).toBeDefined();

          // The sold_at parameter (second param after listingId) should be a Date
          const soldAtParam = updateCall![1]![1];
          expect(soldAtParam).toBeInstanceOf(Date);

          // The timestamp should be between beforeCheck and afterCheck (inclusive)
          const soldAtTime = (soldAtParam as Date).getTime();
          expect(soldAtTime).toBeGreaterThanOrEqual(beforeCheck.getTime());
          expect(soldAtTime).toBeLessThanOrEqual(afterCheck.getTime());
        },
      ),
      { numRuns: 100 },
    );
  });
});
