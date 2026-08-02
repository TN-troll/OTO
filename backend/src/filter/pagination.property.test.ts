import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import { DEFAULT_PAGE_SIZE } from '@car-ads/shared';

/**
 * Property 15: Pagination Correctness
 *
 * For any result set and page size, paginating through all pages SHALL yield every
 * matching Listing exactly once (no duplicates, no omissions), each page SHALL contain
 * at most pageSize items, and the total number of items across all pages SHALL equal
 * the reported totalCount.
 *
 * Validates: Requirements 8.3
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
// Helper types and utilities
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
}

function setupMocks() {
  mockGetRedisClient.mockReturnValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  } as any);
}

/**
 * Sets up the DB mock so it returns totalCount for COUNT queries and
 * the correct slice of listings for paginated data queries based on LIMIT/OFFSET.
 */
function setupDbForPagination(allListings: TestListing[]) {
  const totalCount = allListings.length;

  mockQuery.mockImplementation(async (text: string, params?: unknown[]) => {
    if (typeof text === 'string' && text.includes('COUNT(*)')) {
      return {
        rows: [{ count: String(totalCount) }],
        command: 'SELECT',
        rowCount: 1,
        oid: 0,
        fields: [],
      } as any;
    }

    // Extract LIMIT and OFFSET from the params (they're always the last two)
    const paramArray = params as unknown[];
    const limit = paramArray[paramArray.length - 2] as number;
    const offset = paramArray[paramArray.length - 1] as number;

    const pageItems = allListings.slice(offset, offset + limit);

    return {
      rows: pageItems.map((l) => ({
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
      })),
      command: 'SELECT',
      rowCount: pageItems.length,
      oid: 0,
      fields: [],
    } as any;
  });
}

// ============================================================
// Arbitrary generators
// ============================================================

/** Generate a unique test listing with a sequential ID to ensure uniqueness */
function generateListings(count: number): TestListing[] {
  const listings: TestListing[] = [];
  for (let i = 0; i < count; i++) {
    listings.push({
      id: `listing-${i.toString().padStart(6, '0')}`,
      title: `Car Listing ${i}`,
      image_urls: ['https://example.com/img.jpg'],
      make: 'Ferrari',
      model: '488',
      year: 2020,
      price: 100000 + i * 1000,
      horsepower: 500,
      engine_displacement_cc: 3902,
      date_added: new Date('2024-01-01'),
    });
  }
  return listings;
}

/** Arbitrary for totalCount (number of listings in the result set) */
const arbTotalCount = fc.integer({ min: 0, max: 200 });

/** Arbitrary for pageSize (valid page sizes) */
const arbPageSize = fc.integer({ min: 1, max: 100 });

// ============================================================
// Tests
// ============================================================

describe('Property 15: Pagination Correctness', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new FilterEngine();
    setupMocks();
  });

  it('totalPages is always ceil(totalCount / pageSize)', async () => {
    await fc.assert(
      fc.asyncProperty(arbTotalCount, arbPageSize, async (totalCount, pageSize) => {
        const expectedTotalPages = Math.ceil(totalCount / pageSize);

        setupMocks();
        setupDbForPagination(generateListings(totalCount));

        const result = await engine.query({ pageSize, page: 1 });

        expect(result.totalPages).toBe(expectedTotalPages);
        expect(result.pageSize).toBe(pageSize);
        expect(result.totalCount).toBe(totalCount);
      }),
      { numRuns: 150 },
    );
  });

  it('OFFSET is always (page - 1) * pageSize for any page/pageSize combination', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 50 }), // totalCount
        fc.integer({ min: 1, max: 25 }), // pageSize
        async (totalCount, pageSize) => {
          const totalPages = Math.ceil(totalCount / pageSize);
          if (totalPages === 0) return; // No pages to test

          // Pick a random valid page
          const page = Math.floor(Math.random() * totalPages) + 1;

          const sqlCalls: { text: string; params: unknown[] }[] = [];
          setupMocks();

          mockQuery.mockImplementation(async (text: string, params?: unknown[]) => {
            sqlCalls.push({ text, params: (params ?? []) as unknown[] });
            if (typeof text === 'string' && text.includes('COUNT(*)')) {
              return {
                rows: [{ count: String(totalCount) }],
                command: 'SELECT',
                rowCount: 1,
                oid: 0,
                fields: [],
              } as any;
            }
            return {
              rows: [],
              command: 'SELECT',
              rowCount: 0,
              oid: 0,
              fields: [],
            } as any;
          });

          await engine.query({ pageSize, page });

          // Find the data query (not the COUNT query)
          const dataCall = sqlCalls.find((c) => c.text.includes('LIMIT'));
          expect(dataCall).toBeDefined();

          // The last two params are LIMIT and OFFSET
          const params = dataCall!.params;
          const limitParam = params[params.length - 2];
          const offsetParam = params[params.length - 1];

          expect(limitParam).toBe(pageSize);
          expect(offsetParam).toBe((page - 1) * pageSize);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('paginating through all pages yields every item exactly once with no duplicates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 80 }), // totalCount
        fc.integer({ min: 1, max: 30 }), // pageSize
        async (totalCount, pageSize) => {
          const allListings = generateListings(totalCount);
          const totalPages = Math.ceil(totalCount / pageSize);

          const allCollectedIds: string[] = [];

          for (let page = 1; page <= totalPages; page++) {
            setupMocks();
            setupDbForPagination(allListings);

            const result = await engine.query({ pageSize, page });

            // Each page has at most pageSize items
            expect(result.listings.length).toBeLessThanOrEqual(pageSize);

            // Collect all returned IDs
            for (const listing of result.listings) {
              allCollectedIds.push(listing.id);
            }

            // Verify pagination metadata is consistent
            expect(result.totalPages).toBe(totalPages);
            expect(result.totalCount).toBe(totalCount);
            expect(result.page).toBe(page);
            expect(result.pageSize).toBe(pageSize);
          }

          // All items appear exactly once: total collected equals totalCount
          expect(allCollectedIds.length).toBe(totalCount);

          // No duplicates
          const uniqueIds = new Set(allCollectedIds);
          expect(uniqueIds.size).toBe(totalCount);

          // Every original listing ID is present
          for (const listing of allListings) {
            expect(uniqueIds.has(listing.id)).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('default pageSize is 50 when not specified', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 200 }), // totalCount
        async (totalCount) => {
          setupMocks();
          setupDbForPagination(generateListings(totalCount));

          const result = await engine.query({}); // No pageSize specified

          expect(result.pageSize).toBe(DEFAULT_PAGE_SIZE);
          expect(result.pageSize).toBe(50);
          expect(result.totalPages).toBe(Math.ceil(totalCount / DEFAULT_PAGE_SIZE));
        },
      ),
      { numRuns: 100 },
    );
  });

  it('last page contains at most pageSize items and exactly the remainder', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }), // totalCount
        fc.integer({ min: 1, max: 30 }), // pageSize
        async (totalCount, pageSize) => {
          const allListings = generateListings(totalCount);
          const totalPages = Math.ceil(totalCount / pageSize);

          setupMocks();
          setupDbForPagination(allListings);

          const result = await engine.query({ pageSize, page: totalPages });

          // Last page item count should be the remainder (or pageSize if evenly divisible)
          const expectedLastPageCount = totalCount % pageSize === 0 ? pageSize : totalCount % pageSize;
          expect(result.listings.length).toBe(expectedLastPageCount);
          expect(result.listings.length).toBeLessThanOrEqual(pageSize);
        },
      ),
      { numRuns: 100 },
    );
  });
});
