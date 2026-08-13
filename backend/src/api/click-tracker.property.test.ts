import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { ClickTracker } from './click-tracker.js';

/**
 * Property 13: Click Tracking Accuracy
 *
 * For any sequence of click events on a listing, after N clicks are tracked
 * through `POST /api/listings/:id/track-click`, the listing's click count
 * SHALL equal N. Each click record SHALL contain a valid listing_id, timestamp,
 * and session_id. The endpoint SHALL return the listing's source URL as the
 * redirect target.
 *
 * Validates: Requirements 11.1, 11.2, 11.3
 */

// ============================================================
// Mock setup
// ============================================================

const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

// ============================================================
// Generators
// ============================================================

/** Arbitrary valid listing IDs (UUID-like strings) */
const arbListingId = fc.uuid();

/** Arbitrary valid session IDs (non-empty alphanumeric strings) */
const arbSessionId = fc.stringOf(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_'.split('')),
  { minLength: 5, maxLength: 50 },
);

/** Arbitrary source URLs for AutoScout24 listings */
const arbSourceUrl = fc.constantFrom(
  'https://www.autoscout24.nl/aanbod/porsche-911-carrera',
  'https://www.autoscout24.nl/aanbod/bmw-m3-competition',
  'https://www.autoscout24.nl/aanbod/mercedes-amg-gt',
  'https://www.autoscout24.nl/aanbod/audi-rs6-avant',
  'https://www.autoscout24.nl/aanbod/ferrari-f8-tributo',
  'https://www.autoscout24.nl/aanbod/lamborghini-huracan',
);

/** Arbitrary number of clicks (1 to 20 per test run) */
const arbClickCount = fc.integer({ min: 1, max: 20 });

// ============================================================
// Property tests
// ============================================================

describe('Property 13: Click Tracking Accuracy', () => {
  let tracker: ClickTracker;

  beforeEach(() => {
    tracker = new ClickTracker();
    mockQuery.mockReset();
    mockQueryOne.mockReset();
  });

  it('after N clicks are tracked, the listing click count SHALL equal N', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbListingId,
        arbClickCount,
        arbSessionId,
        arbSourceUrl,
        async (listingId, n, sessionId, sourceUrl) => {
          // Fresh state per iteration
          let currentCount = 0;

          mockQuery.mockImplementation(async (sql: string) => {
            if (sql.includes('INSERT INTO listing_clicks')) {
              return { rows: [], rowCount: 1 };
            }
            if (sql.includes('INSERT INTO listing_click_counts')) {
              currentCount++;
              return { rows: [], rowCount: 1 };
            }
            return { rows: [], rowCount: 0 };
          });

          mockQueryOne.mockImplementation(async (sql: string) => {
            if (sql.includes('SELECT url FROM source_references')) {
              return { url: sourceUrl };
            }
            if (sql.includes('SELECT click_count')) {
              return { click_count: String(currentCount), last_clicked_at: new Date() };
            }
            return null;
          });

          // Perform N clicks
          for (let i = 0; i < n; i++) {
            await tracker.trackClick(listingId, `${sessionId}-${i}`);
          }

          // Verify: click count equals N
          const stats = await tracker.getClickStats(listingId);
          expect(stats.totalClicks).toBe(n);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('each click record SHALL contain a valid listing_id and session_id', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbListingId,
        arbSessionId,
        arbSourceUrl,
        async (listingId, sessionId, sourceUrl) => {
          // Capture inserts for this iteration only
          const capturedInserts: { listingId: string; sessionId: string }[] = [];

          mockQuery.mockImplementation(async (sql: string, params?: unknown[]) => {
            if (sql.includes('INSERT INTO listing_clicks') && params) {
              capturedInserts.push({
                listingId: params[0] as string,
                sessionId: params[1] as string,
              });
            }
            return { rows: [], rowCount: 1 };
          });

          mockQueryOne.mockImplementation(async () => ({ url: sourceUrl }));

          // Track a click
          await tracker.trackClick(listingId, sessionId);

          // Verify: the click record contains the correct listing_id and session_id
          expect(capturedInserts).toHaveLength(1);
          expect(capturedInserts[0].listingId).toBe(listingId);
          expect(capturedInserts[0].sessionId).toBe(sessionId);

          // Both fields must be non-empty strings
          expect(capturedInserts[0].listingId.length).toBeGreaterThan(0);
          expect(capturedInserts[0].sessionId.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('the endpoint SHALL return the listing source URL as the redirect target', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbListingId,
        arbSessionId,
        arbSourceUrl,
        async (listingId, sessionId, sourceUrl) => {
          mockQuery.mockImplementation(async () => ({ rows: [], rowCount: 1 }));

          mockQueryOne.mockImplementation(async (sql: string) => {
            if (sql.includes('SELECT url FROM source_references')) {
              return { url: sourceUrl };
            }
            return null;
          });

          // Track a click
          const redirectUrl = await tracker.trackClick(listingId, sessionId);

          // The returned URL SHALL be the listing's source URL
          expect(redirectUrl).toBe(sourceUrl);
          expect(redirectUrl).not.toBeNull();
          expect(redirectUrl!.startsWith('https://')).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when no source URL exists, trackClick SHALL return null', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbListingId,
        arbSessionId,
        async (listingId, sessionId) => {
          mockQuery.mockImplementation(async () => ({ rows: [], rowCount: 1 }));

          // No source URL found
          mockQueryOne.mockImplementation(async () => null);

          const redirectUrl = await tracker.trackClick(listingId, sessionId);

          expect(redirectUrl).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  it('click records SHALL contain a timestamp (verified by INSERT using NOW())', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbListingId,
        arbSessionId,
        arbSourceUrl,
        async (listingId, sessionId, sourceUrl) => {
          const capturedSql: string[] = [];

          mockQuery.mockImplementation(async (sql: string) => {
            capturedSql.push(sql);
            return { rows: [], rowCount: 1 };
          });

          mockQueryOne.mockImplementation(async () => ({ url: sourceUrl }));

          await tracker.trackClick(listingId, sessionId);

          // The listing_clicks table has a DEFAULT NOW() on clicked_at column
          // Verify the INSERT targets the correct table with expected columns
          const clickInsertSql = capturedSql.find((s) => s.includes('INSERT INTO listing_clicks'));
          expect(clickInsertSql).toBeDefined();
          expect(clickInsertSql).toContain('listing_id');
          expect(clickInsertSql).toContain('session_id');

          // The upsert into listing_click_counts tracks last_clicked_at with NOW()
          const countUpsertSql = capturedSql.find((s) => s.includes('INSERT INTO listing_click_counts'));
          expect(countUpsertSql).toBeDefined();
          expect(countUpsertSql).toContain('NOW()');
          expect(countUpsertSql).toContain('last_clicked_at');
        },
      ),
      { numRuns: 100 },
    );
  });
});
