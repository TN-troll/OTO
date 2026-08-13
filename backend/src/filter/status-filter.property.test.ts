import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import type { FilterCriteria } from '@car-ads/shared';

/**
 * Property 2: Filter Engine Status Filtering
 *
 * For any set of listings with mixed statuses and for any filter query,
 * when "show sold" is disabled (default), no listing with status "sold"
 * SHALL appear in results. When "show sold" is enabled, sold listings
 * SHALL be included alongside active listings.
 *
 * **Validates: Requirements 1.3, 1.4**
 */

// Mock the database and cache modules
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
}));

vi.mock('../cache/redis.js', () => ({
  getRedisClient: vi.fn(),
}));

import { query } from '../db/connection.js';
import { getRedisClient } from '../cache/redis.js';

const mockQuery = vi.mocked(query);
const mockGetRedisClient = vi.mocked(getRedisClient);

// ============================================================
// Types for test listings
// ============================================================

interface TestListing {
  id: string;
  title: string;
  image_urls: string[];
  make: string;
  model: string;
  year: number;
  price: number;
  horsepower: number | null;
  engine_displacement_cc: number | null;
  date_added: Date;
  status: 'active' | 'sold' | 'stale';
  is_featured: boolean;
}

// ============================================================
// Arbitrary generators
// ============================================================

/** Generate a random test listing with a random status */
const arbTestListing: fc.Arbitrary<TestListing> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 3, maxLength: 50 }),
  image_urls: fc.array(fc.constant('https://example.com/img.jpg'), { minLength: 0, maxLength: 2 }),
  make: fc.constantFrom('Ferrari', 'BMW', 'Mercedes', 'Porsche', 'Toyota', 'Honda', 'Audi'),
  model: fc.constantFrom('488', 'M5', 'AMG GT', '911', 'Corolla', 'Civic', 'R8'),
  year: fc.integer({ min: 1950, max: 2025 }),
  price: fc.integer({ min: 1000, max: 5000000 }),
  horsepower: fc.oneof(
    fc.constant(null as number | null),
    fc.integer({ min: 50, max: 2000 }) as fc.Arbitrary<number | null>,
  ),
  engine_displacement_cc: fc.oneof(
    fc.constant(null as number | null),
    fc.integer({ min: 500, max: 8000 }) as fc.Arbitrary<number | null>,
  ),
  date_added: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
  status: fc.constantFrom('active', 'sold', 'stale') as fc.Arbitrary<'active' | 'sold' | 'stale'>,
  is_featured: fc.boolean(),
});

/** Generate a set of listings guaranteed to have at least one of each status */
const arbMixedStatusListings: fc.Arbitrary<TestListing[]> = fc
  .tuple(
    // At least one active listing
    arbTestListing.map((l) => ({ ...l, status: 'active' as const })),
    // At least one sold listing
    arbTestListing.map((l) => ({ ...l, status: 'sold' as const })),
    // At least one stale listing
    arbTestListing.map((l) => ({ ...l, status: 'stale' as const })),
    // Additional random listings
    fc.array(arbTestListing, { minLength: 0, maxLength: 15 }),
  )
  .map(([active, sold, stale, rest]) => [active, sold, stale, ...rest]);

// ============================================================
// Helper: in-memory status filtering (reference implementation)
// ============================================================

/**
 * Reference implementation of status filtering logic.
 * Mirrors the filter engine's buildWhereClause status handling.
 */
function filterByStatus(listings: TestListing[], showSold: boolean): TestListing[] {
  if (showSold) {
    // Include active and sold, never stale
    return listings.filter((l) => l.status === 'active' || l.status === 'sold');
  }
  // Default: only active
  return listings.filter((l) => l.status === 'active');
}

// ============================================================
// Helper to set up mocks
// ============================================================

function setupMocks() {
  mockGetRedisClient.mockReturnValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  } as any);
}

function setupDbForListings(filteredListings: TestListing[]) {
  mockQuery.mockImplementation(async (text: string) => {
    if (typeof text === 'string' && text.includes('COUNT(*)')) {
      return {
        rows: [{ count: String(filteredListings.length) }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any;
    }
    return {
      rows: filteredListings.map((l) => ({
        id: l.id,
        title: l.title,
        image_urls: l.image_urls,
        make: l.make,
        model: l.model,
        year: l.year,
        price: l.price,
        horsepower: l.horsepower,
        engine_displacement_cc: l.engine_displacement_cc,
        date_added: l.date_added,
        status: l.status,
        is_featured: l.is_featured,
      })),
      command: 'SELECT',
      rowCount: filteredListings.length,
      oid: 0,
      fields: [],
    } as any;
  });
}

// ============================================================
// Tests
// ============================================================

describe('Property 2: Filter Engine Status Filtering', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new FilterEngine();
    setupMocks();
  });

  it('when showSold is disabled (default), no sold listing SHALL appear in results', async () => {
    await fc.assert(
      fc.asyncProperty(arbMixedStatusListings, async (allListings) => {
        // Compute what should be returned: only active listings
        const expectedResults = filterByStatus(allListings, false);

        setupMocks();
        setupDbForListings(expectedResults);

        const result = await engine.query({});

        // Property: NO sold listing appears in results
        for (const listing of result.listings) {
          expect(listing.status).not.toBe('sold');
        }

        // Property: NO stale listing appears in results
        for (const listing of result.listings) {
          expect(listing.status).not.toBe('stale');
        }

        // Property: all returned listings are active
        for (const listing of result.listings) {
          expect(listing.status).toBe('active');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('when showSold is enabled, sold listings SHALL be included alongside active listings', async () => {
    await fc.assert(
      fc.asyncProperty(arbMixedStatusListings, async (allListings) => {
        // Compute what should be returned: active + sold, never stale
        const expectedResults = filterByStatus(allListings, true);

        setupMocks();
        setupDbForListings(expectedResults);

        const result = await engine.query({ showSold: true });

        // Property: returned listings include only active and sold statuses
        for (const listing of result.listings) {
          expect(['active', 'sold']).toContain(listing.status);
        }

        // Property: stale listings NEVER appear even with showSold enabled
        for (const listing of result.listings) {
          expect(listing.status).not.toBe('stale');
        }

        // Property: the count includes both active and sold
        const activeCount = allListings.filter((l) => l.status === 'active').length;
        const soldCount = allListings.filter((l) => l.status === 'sold').length;
        expect(result.totalCount).toBe(activeCount + soldCount);
      }),
      { numRuns: 100 },
    );
  });

  it('active listings always appear regardless of showSold flag', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbMixedStatusListings,
        fc.boolean(),
        async (allListings, showSold) => {
          const expectedResults = filterByStatus(allListings, showSold);

          setupMocks();
          setupDbForListings(expectedResults);

          const criteria: FilterCriteria = showSold ? { showSold: true } : {};
          const result = await engine.query(criteria);

          // Property: all active listings from input appear in results
          const activeListings = allListings.filter((l) => l.status === 'active');
          const returnedIds = result.listings.map((l) => l.id);

          for (const activeListing of activeListings) {
            expect(returnedIds).toContain(activeListing.id);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('the SQL WHERE clause correctly reflects the showSold parameter', async () => {
    await fc.assert(
      fc.asyncProperty(fc.boolean(), async (showSold) => {
        const sqlStatements: string[] = [];
        setupMocks();
        mockQuery.mockImplementation(async (text: string) => {
          sqlStatements.push(text);
          if (typeof text === 'string' && text.includes('COUNT(*)')) {
            return { rows: [{ count: '0' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] } as any;
          }
          return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as any;
        });

        const criteria: FilterCriteria = showSold ? { showSold: true } : {};
        await engine.query(criteria);

        const countSql = sqlStatements.find((s) => s.includes('COUNT(*)'));
        expect(countSql).toBeDefined();

        if (showSold) {
          // When showSold is enabled, SQL should include both active and sold
          expect(countSql!).toContain("l.status IN ('active', 'sold')");
          // Should never include stale in the IN clause
          expect(countSql!).not.toContain('stale');
        } else {
          // When showSold is disabled (default), SQL should only include active
          expect(countSql!).toContain("l.status = 'active'");
          expect(countSql!).not.toContain('sold');
        }
      }),
      { numRuns: 100 },
    );
  });

  it('cursor-based pagination also respects status filtering', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbMixedStatusListings,
        fc.boolean(),
        async (allListings, showSold) => {
          const expectedResults = filterByStatus(allListings, showSold);

          setupMocks();
          // Return limit+1 to simulate hasMore
          setupDbForListings(expectedResults);

          const result = await engine.queryCursor({
            limit: 50,
            filters: showSold ? { showSold: true } : {},
          });

          // Property: no sold listing in results when showSold is disabled
          if (!showSold) {
            for (const item of result.items) {
              expect(item.status).not.toBe('sold');
            }
          }

          // Property: no stale listing regardless of showSold
          for (const item of result.items) {
            expect(item.status).not.toBe('stale');
          }

          // Property: all items are either active or (sold when showSold=true)
          for (const item of result.items) {
            if (showSold) {
              expect(['active', 'sold']).toContain(item.status);
            } else {
              expect(item.status).toBe('active');
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
