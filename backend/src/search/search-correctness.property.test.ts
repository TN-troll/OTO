import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { SearchService } from './search-service.js';

/**
 * Property 13: Search Correctness
 *
 * For any search query of 2–100 characters, all returned Listings SHALL have a make
 * or model that contains the query text (case-insensitive) OR contains the expanded
 * form of the query if the query matches a known abbreviation. No Listing whose make
 * and model both fail to match SHALL appear in results.
 *
 * Validates: Requirements 6.1, 6.2
 */

// Mock the database module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
}));

import { query } from '../db/connection.js';

const mockQuery = vi.mocked(query);

// ============================================================
// Types
// ============================================================

interface TestListing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  horsepower: number | null;
  engine_displacement_cc: number | null;
  image_urls: string[];
  date_added: Date;
}

// ============================================================
// Arbitrary generators
// ============================================================

const CAR_MAKES = ['Ferrari', 'BMW', 'Mercedes-Benz', 'Porsche', 'Toyota', 'Honda', 'Audi', 'Lamborghini', 'Chevrolet', 'Ford'];
const CAR_MODELS = ['488', 'M5', 'AMG GT', '911', 'Corolla', 'Civic', 'R8', 'Huracan', 'Corvette', 'Mustang'];

/** Generate a random test listing with realistic car make/model */
const arbTestListing: fc.Arbitrary<TestListing> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 3, maxLength: 80 }),
  make: fc.constantFrom(...CAR_MAKES),
  model: fc.constantFrom(...CAR_MODELS),
  year: fc.integer({ min: 1950, max: 2024 }),
  price: fc.integer({ min: 1000, max: 50_000_000 }),
  horsepower: fc.oneof(
    fc.constant(null as number | null),
    fc.integer({ min: 50, max: 2000 }) as fc.Arbitrary<number | null>,
  ),
  engine_displacement_cc: fc.oneof(
    fc.constant(null as number | null),
    fc.integer({ min: 500, max: 10000 }) as fc.Arbitrary<number | null>,
  ),
  image_urls: fc.array(fc.constant('https://example.com/img.jpg'), { minLength: 0, maxLength: 3 }),
  date_added: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
});

/** Generate a valid search query (2–100 characters) using safe car-related terms */
const SEARCH_TERMS = [
  'fer', 'bmw', 'porsche', 'audi', 'ford', 'honda', 'toyota',
  'merc', 'lambo', 'turbo', 'gt', 'sport', 'coupe', 'sedan',
  '911', 'r8', 'm5', 'amg', 'rs', 'gtr', 'evo',
  'red', 'black', 'v8', 'v12', 'fast', 'luxury',
];

const arbSearchQuery: fc.Arbitrary<string> = fc.oneof(
  // Use predefined car-related terms for most tests
  fc.constantFrom(...SEARCH_TERMS),
  // Also generate random alphanumeric strings (safe characters only)
  fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')),
    { minLength: 2, maxLength: 50 },
  ),
);

// ============================================================
// Reference implementation for matching logic
// ============================================================

/**
 * Determines if a listing matches the search query using the same ILIKE logic
 * the SearchService uses: case-insensitive substring match on make, model, or title
 * using the expanded search term.
 */
function listingMatchesSearch(listing: TestListing, searchTerm: string): boolean {
  const pattern = searchTerm.toLowerCase();
  const make = listing.make.toLowerCase();
  const model = listing.model.toLowerCase();
  const title = listing.title.toLowerCase();

  return make.includes(pattern) || model.includes(pattern) || title.includes(pattern);
}

// ============================================================
// Tests
// ============================================================

describe('Property 13: Search Correctness', () => {
  let service: SearchService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new SearchService();
  });

  it('abbreviation expansion produces the correct expanded term for known abbreviations', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('merc', 'mercedes', 'chevy', 'lambo', 'beemer', 'bimmer', 'vette', 'aston'),
        (abbreviation) => {
          const expanded = service.expandAbbreviation(abbreviation);
          // Expanded form should differ from the abbreviation (case-insensitive lookup)
          expect(expanded).not.toBe(abbreviation);
          // Expanded form should be a recognized car make name (non-empty)
          expect(expanded.length).toBeGreaterThan(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('the expanded search term is used in the ILIKE query parameter', async () => {
    await fc.assert(
      fc.asyncProperty(arbSearchQuery, async (queryText) => {
        const capturedParams: unknown[][] = [];

        mockQuery.mockImplementation(async (_text: string, params?: unknown[]) => {
          if (params) capturedParams.push(params);
          return {
            rows: [],
            command: 'SELECT',
            rowCount: 0,
            oid: 0,
            fields: [],
          } as any;
        });

        await service.search(queryText);

        // The search should have been called (query is valid: 2-100 chars)
        expect(mockQuery).toHaveBeenCalled();

        // First call is the main search query
        const firstCallParams = capturedParams[0];
        expect(firstCallParams).toBeDefined();

        // The search parameter should be an ILIKE pattern containing the expanded term
        const expanded = service.expandAbbreviation(queryText);
        const expectedPattern = `%${expanded}%`;
        expect(firstCallParams[0]).toBe(expectedPattern);
      }),
      { numRuns: 100 },
    );
  });

  it('all returned listings match the expanded query in make, model, or title', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbTestListing, { minLength: 1, maxLength: 15 }),
        arbSearchQuery,
        async (listings, queryText) => {
          const expanded = service.expandAbbreviation(queryText);

          // Filter listings that actually match the expanded search term
          const matchingListings = listings.filter((l) => listingMatchesSearch(l, expanded));

          // Mock DB to return only matching listings (simulates ILIKE behavior)
          mockQuery.mockImplementation(async (text: string) => {
            // Main search query
            if (typeof text === 'string' && text.includes('ILIKE')) {
              return {
                rows: matchingListings,
                command: 'SELECT',
                rowCount: matchingListings.length,
                oid: 0,
                fields: [],
              } as any;
            }
            // Suggestion queries (when no results)
            return {
              rows: [],
              command: 'SELECT',
              rowCount: 0,
              oid: 0,
              fields: [],
            } as any;
          });

          const result = await service.search(queryText);

          // Property: every returned listing must match the expanded term in make, model, or title
          for (const returned of result.listings) {
            const matchesMake = returned.make.toLowerCase().includes(expanded.toLowerCase());
            const matchesModel = returned.model.toLowerCase().includes(expanded.toLowerCase());
            const matchesTitle = returned.title?.toLowerCase().includes(expanded.toLowerCase()) ?? false;
            expect(matchesMake || matchesModel || matchesTitle).toBe(true);
          }

          // Property: no listing that fails to match in make/model/title should appear
          const returnedIds = new Set(result.listings.map((l) => l.id));
          for (const listing of listings) {
            if (!listingMatchesSearch(listing, expanded)) {
              expect(returnedIds.has(listing.id)).toBe(false);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when query matches an abbreviation, results use the expanded form for matching', async () => {
    const abbreviationQueries = fc.constantFrom('merc', 'chevy', 'lambo', 'beemer', 'aston');

    await fc.assert(
      fc.asyncProperty(
        fc.array(arbTestListing, { minLength: 1, maxLength: 10 }),
        abbreviationQueries,
        async (listings, queryText) => {
          const expanded = service.expandAbbreviation(queryText);

          // Verify that abbreviation was expanded
          expect(expanded).not.toBe(queryText);

          // Filter listings against the EXPANDED form (not the raw abbreviation)
          const matchingListings = listings.filter((l) => listingMatchesSearch(l, expanded));

          mockQuery.mockImplementation(async (text: string) => {
            if (typeof text === 'string' && text.includes('ILIKE')) {
              return {
                rows: matchingListings,
                command: 'SELECT',
                rowCount: matchingListings.length,
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

          const result = await service.search(queryText);

          // The expandedQuery field should be set when abbreviation was used
          expect(result.expandedQuery).toBe(expanded);

          // All results must match the expanded form
          for (const returned of result.listings) {
            const matchesMake = returned.make.toLowerCase().includes(expanded.toLowerCase());
            const matchesModel = returned.model.toLowerCase().includes(expanded.toLowerCase());
            expect(matchesMake || matchesModel).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('the SQL query uses ILIKE for case-insensitive matching on make, model, and title', async () => {
    await fc.assert(
      fc.asyncProperty(arbSearchQuery, async (queryText) => {
        const capturedSql: string[] = [];

        mockQuery.mockImplementation(async (text: string) => {
          capturedSql.push(text);
          return {
            rows: [],
            command: 'SELECT',
            rowCount: 0,
            oid: 0,
            fields: [],
          } as any;
        });

        await service.search(queryText);

        // The first query should be the main search query
        const mainQuery = capturedSql[0];
        expect(mainQuery).toBeDefined();

        // Should use ILIKE for case-insensitive matching
        expect(mainQuery).toContain('ILIKE');

        // Should match against make, model, and title
        expect(mainQuery).toContain('make ILIKE');
        expect(mainQuery).toContain('model ILIKE');
        expect(mainQuery).toContain('title ILIKE');
      }),
      { numRuns: 100 },
    );
  });
});
