import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { SearchService, SearchValidationError } from './search-service.js';
import { SEARCH_QUERY_MIN_LENGTH, SEARCH_QUERY_MAX_LENGTH } from '@car-ads/shared';

/**
 * Property 14: Search Query Validation
 *
 * For any search query shorter than 2 characters, the Platform SHALL not execute a search
 * and SHALL return no results. For any search query longer than 100 characters, the Platform
 * SHALL reject it.
 *
 * Validates: Requirements 6.5
 */

// Mock the database module - should not be called for invalid queries
const mockQuery = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
}));

// ============================================================
// Arbitrary generators
// ============================================================

/** Generate a string shorter than the minimum query length (0 or 1 char) */
const arbTooShortQuery: fc.Arbitrary<string> = fc.stringOf(
  fc.char(),
  { minLength: 0, maxLength: SEARCH_QUERY_MIN_LENGTH - 1 },
);

/** Generate a string longer than the maximum query length (101–150 chars) */
const arbTooLongQuery: fc.Arbitrary<string> = fc.stringOf(
  fc.char(),
  { minLength: SEARCH_QUERY_MAX_LENGTH + 1, maxLength: 150 },
);

/** Generate a valid-length query (2–100 chars) with printable characters */
const arbValidLengthQuery: fc.Arbitrary<string> = fc.stringOf(
  fc.char16bits().filter((c) => c.trim().length > 0),
  { minLength: SEARCH_QUERY_MIN_LENGTH, maxLength: SEARCH_QUERY_MAX_LENGTH },
).filter((s) => s.length >= SEARCH_QUERY_MIN_LENGTH && s.length <= SEARCH_QUERY_MAX_LENGTH);

// ============================================================
// Tests
// ============================================================

describe('Property 14: Search Query Validation', () => {
  let service: SearchService;

  beforeEach(() => {
    service = new SearchService();
    mockQuery.mockClear();
  });

  it('should return empty results without executing DB query for queries < 2 chars', async () => {
    await fc.assert(
      fc.asyncProperty(arbTooShortQuery, async (queryText) => {
        const result = await service.search(queryText);

        // Must return empty results
        expect(result.listings).toHaveLength(0);
        expect(result.totalCount).toBe(0);
        expect(result.expandedQuery).toBeNull();
        expect(result.suggestions).toHaveLength(0);

        // Database query should never have been called
        expect(mockQuery).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });

  it('should throw SearchValidationError for queries > 100 chars', async () => {
    await fc.assert(
      fc.asyncProperty(arbTooLongQuery, async (queryText) => {
        await expect(service.search(queryText)).rejects.toThrow(SearchValidationError);

        // Database query should never have been called
        expect(mockQuery).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });

  it('should not throw a validation error for queries between 2–100 chars', async () => {
    // Mock DB to return empty results for valid queries
    mockQuery.mockResolvedValue({ rows: [] });

    await fc.assert(
      fc.asyncProperty(arbValidLengthQuery, async (queryText) => {
        // Should not throw
        const result = await service.search(queryText);

        // Result should be a valid SearchResult (not a validation rejection)
        expect(result).toHaveProperty('listings');
        expect(result).toHaveProperty('totalCount');
      }),
      { numRuns: 100 },
    );
  });

  it('validateQuery() should report invalid for queries < 2 chars', () => {
    fc.assert(
      fc.property(arbTooShortQuery, (queryText) => {
        const result = service.validateQuery(queryText);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'searchQuery')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('validateQuery() should report invalid for queries > 100 chars', () => {
    fc.assert(
      fc.property(arbTooLongQuery, (queryText) => {
        const result = service.validateQuery(queryText);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'searchQuery')).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it('validateQuery() should report valid for queries 2–100 chars', () => {
    fc.assert(
      fc.property(arbValidLengthQuery, (queryText) => {
        const result = service.validateQuery(queryText);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 100 },
    );
  });
});
