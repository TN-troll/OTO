import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';
import { FilterEngine } from './filter-engine.js';
import type { SortField, SortOrder } from '@car-ads/shared';

/**
 * Property 11: Sorting Correctness
 *
 * For any list of Listings and for any valid sort field (price, horsepower,
 * engine displacement, year, date added) and sort order (ascending, descending),
 * the returned results SHALL be ordered such that for every consecutive pair
 * of Listings (a, b) in the result, the sort field value of a precedes or equals
 * the sort field value of b according to the specified order.
 *
 * Validates: Requirements 5.3
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

interface TestListingRow {
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

// ============================================================
// Constants
// ============================================================

const SORT_FIELDS: SortField[] = ['price', 'horsepower', 'engineDisplacement', 'year', 'dateAdded'];
const SORT_ORDERS: SortOrder[] = ['asc', 'desc'];

const SORT_COLUMN_MAP: Record<SortField, string> = {
  price: 'price',
  horsepower: 'horsepower',
  engineDisplacement: 'engine_displacement_cc',
  year: 'year',
  dateAdded: 'date_added',
};

// ============================================================
// Arbitrary generators
// ============================================================

/** Generate a random sort field */
const arbSortField: fc.Arbitrary<SortField> = fc.constantFrom(...SORT_FIELDS);

/** Generate a random sort order */
const arbSortOrder: fc.Arbitrary<SortOrder> = fc.constantFrom(...SORT_ORDERS);

/** Generate a random test listing row */
const arbTestListingRow: fc.Arbitrary<TestListingRow> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 3, maxLength: 50 }),
  image_urls: fc.array(fc.constant('https://example.com/img.jpg'), { minLength: 0, maxLength: 3 }),
  make: fc.constantFrom('Ferrari', 'BMW', 'Mercedes', 'Porsche', 'Audi', 'Lamborghini'),
  model: fc.constantFrom('488', 'M5', 'AMG GT', '911', 'R8', 'Huracan'),
  year: fc.integer({ min: 1950, max: 2024 }),
  price: fc.integer({ min: 1000, max: 50000000 }),
  horsepower: fc.oneof(
    fc.constant(null as number | null),
    fc.integer({ min: 50, max: 2000 }) as fc.Arbitrary<number | null>,
  ),
  engine_displacement_cc: fc.oneof(
    fc.constant(null as number | null),
    fc.integer({ min: 500, max: 10000 }) as fc.Arbitrary<number | null>,
  ),
  date_added: fc.date({ min: new Date('2020-01-01'), max: new Date('2024-12-31') }),
});

// ============================================================
// Helper functions
// ============================================================

/**
 * Get the sortable value from a listing row for the given sort field.
 */
function getSortValue(row: TestListingRow, sortField: SortField): number | Date | null {
  switch (sortField) {
    case 'price':
      return row.price;
    case 'horsepower':
      return row.horsepower;
    case 'engineDisplacement':
      return row.engine_displacement_cc;
    case 'year':
      return row.year;
    case 'dateAdded':
      return row.date_added;
  }
}

/**
 * Sort listings in-memory according to the given field and order.
 * Null values sort after non-null values in ascending, before in descending.
 */
function sortListings(rows: TestListingRow[], sortField: SortField, sortOrder: SortOrder): TestListingRow[] {
  return [...rows].sort((a, b) => {
    const aVal = getSortValue(a, sortField);
    const bVal = getSortValue(b, sortField);

    // Handle nulls: PostgreSQL default NULLS LAST for ASC, NULLS FIRST for DESC
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return sortOrder === 'asc' ? 1 : -1;
    if (bVal === null) return sortOrder === 'asc' ? -1 : 1;

    const aNum = aVal instanceof Date ? aVal.getTime() : aVal;
    const bNum = bVal instanceof Date ? bVal.getTime() : bVal;

    if (sortOrder === 'asc') {
      return aNum - bNum;
    } else {
      return bNum - aNum;
    }
  });
}

/**
 * Verify that consecutive pairs in the result are in correct order.
 */
function isCorrectlySorted(rows: TestListingRow[], sortField: SortField, sortOrder: SortOrder): boolean {
  for (let i = 0; i < rows.length - 1; i++) {
    const aVal = getSortValue(rows[i], sortField);
    const bVal = getSortValue(rows[i + 1], sortField);

    // Handle nulls
    if (aVal === null && bVal === null) continue;
    if (aVal === null) {
      // In ASC: nulls should come last (after non-nulls), so if a is null and b is not, wrong order
      if (sortOrder === 'asc') return false;
      continue;
    }
    if (bVal === null) {
      // In DESC: nulls should come last (after non-nulls in desc = first in natural), so if b is null and a is not
      if (sortOrder === 'desc') return false;
      continue;
    }

    const aNum = aVal instanceof Date ? aVal.getTime() : aVal;
    const bNum = bVal instanceof Date ? bVal.getTime() : bVal;

    if (sortOrder === 'asc' && aNum > bNum) return false;
    if (sortOrder === 'desc' && aNum < bNum) return false;
  }
  return true;
}

function setupMocks() {
  mockGetRedisClient.mockReturnValue({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  } as any);
}

// ============================================================
// Tests
// ============================================================

describe('Property 11: Sorting Correctness', () => {
  let engine: FilterEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new FilterEngine();
    setupMocks();
  });

  it('SQL query contains correct ORDER BY clause with the right column and direction', async () => {
    await fc.assert(
      fc.asyncProperty(arbSortField, arbSortOrder, async (sortField, sortOrder) => {
        const sqlStatements: string[] = [];

        mockQuery.mockImplementation(async (text: string) => {
          sqlStatements.push(text);
          if (typeof text === 'string' && text.includes('COUNT(*)')) {
            return { rows: [{ count: '0' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] } as any;
          }
          return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as any;
        });

        await engine.query({ sortBy: sortField, sortOrder });

        // Find the data query (not the COUNT query)
        const dataSql = sqlStatements.find((s) => s.includes('ORDER BY'));
        expect(dataSql).toBeDefined();

        // Verify the ORDER BY clause contains the correct column and direction
        // Featured ordering is prepended, so the user sort appears after featured sort
        const expectedColumn = SORT_COLUMN_MAP[sortField];
        const expectedDirection = sortOrder.toUpperCase();

        expect(dataSql!).toContain(`l.${expectedColumn} ${expectedDirection}`);
      }),
      { numRuns: 100 },
    );
  });

  it('returned results maintain correct order for pre-sorted listing rows', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbTestListingRow, { minLength: 2, maxLength: 20 }),
        arbSortField,
        arbSortOrder,
        async (listings, sortField, sortOrder) => {
          // Sort the listings in-memory (simulating what the DB would return)
          const sorted = sortListings(listings, sortField, sortOrder);

          setupMocks();
          mockQuery.mockImplementation(async (text: string) => {
            if (typeof text === 'string' && text.includes('COUNT(*)')) {
              return { rows: [{ count: String(sorted.length) }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] } as any;
            }
            return {
              rows: sorted,
              command: 'SELECT',
              rowCount: sorted.length,
              oid: 0,
              fields: [],
            } as any;
          });

          const result = await engine.query({ sortBy: sortField, sortOrder });

          // Verify that the returned results maintain the order
          expect(result.listings.length).toBe(sorted.length);

          // Check consecutive pairs are in correct order per field and direction
          for (let i = 0; i < result.listings.length - 1; i++) {
            const a = result.listings[i];
            const b = result.listings[i + 1];

            let aVal: number | Date | null;
            let bVal: number | Date | null;

            switch (sortField) {
              case 'price':
                aVal = a.price;
                bVal = b.price;
                break;
              case 'horsepower':
                aVal = a.horsepower;
                bVal = b.horsepower;
                break;
              case 'engineDisplacement':
                aVal = a.engineDisplacementCc;
                bVal = b.engineDisplacementCc;
                break;
              case 'year':
                aVal = a.year;
                bVal = b.year;
                break;
              case 'dateAdded':
                aVal = a.dateAdded;
                bVal = b.dateAdded;
                break;
            }

            // Skip comparison when values are null (DB handles null ordering)
            if (aVal === null || bVal === null) continue;

            const aNum = aVal instanceof Date ? aVal.getTime() : aVal;
            const bNum = bVal instanceof Date ? bVal.getTime() : bVal;

            if (sortOrder === 'asc') {
              expect(aNum).toBeLessThanOrEqual(bNum);
            } else {
              expect(aNum).toBeGreaterThanOrEqual(bNum);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('default sort is dateAdded DESC when no sort criteria specified', async () => {
    const sqlStatements: string[] = [];

    mockQuery.mockImplementation(async (text: string) => {
      sqlStatements.push(text);
      if (typeof text === 'string' && text.includes('COUNT(*)')) {
        return { rows: [{ count: '0' }], command: 'SELECT', rowCount: 1, oid: 0, fields: [] } as any;
      }
      return { rows: [], command: 'SELECT', rowCount: 0, oid: 0, fields: [] } as any;
    });

    await engine.query({});

    const dataSql = sqlStatements.find((s) => s.includes('ORDER BY'));
    expect(dataSql).toBeDefined();
    // Featured ordering is prepended, but the default user sort should still be date_added DESC
    expect(dataSql!).toContain('l.date_added DESC');
  });

  it('in-memory sort reference matches correctness check for all field/order combos', () => {
    fc.assert(
      fc.property(
        fc.array(arbTestListingRow, { minLength: 2, maxLength: 30 }),
        arbSortField,
        arbSortOrder,
        (listings, sortField, sortOrder) => {
          const sorted = sortListings(listings, sortField, sortOrder);
          expect(isCorrectlySorted(sorted, sortField, sortOrder)).toBe(true);
        },
      ),
      { numRuns: 150 },
    );
  });
});
