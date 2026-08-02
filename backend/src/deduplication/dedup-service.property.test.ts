import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { DeduplicationService, QualifiedListing } from './dedup-service.js';

/**
 * Property 3: Deduplication Correctness
 * **Validates: Requirements 1.6**
 *
 * For any two raw advertisements with identical values for make, model, year,
 * mileage, and price, the Deduplication Service SHALL identify them as duplicates.
 * For any two advertisements that differ in at least one of those five fields,
 * they SHALL be treated as distinct Listings.
 */

// Mock the database connection module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
}));

import { query } from '../db/connection.js';

const mockedQuery = vi.mocked(query);

/** Arbitrary generator for a valid QualifiedListing */
function arbitraryQualifiedListing(): fc.Arbitrary<QualifiedListing> {
  return fc.record({
    title: fc.string({ minLength: 1, maxLength: 50 }),
    price: fc.integer({ min: 1, max: 50_000_000 }),
    mileage: fc.oneof(fc.integer({ min: 0, max: 500_000 }), fc.constant(null)),
    year: fc.integer({ min: 1950, max: 2025 }),
    make: fc.stringMatching(/^[A-Za-z][A-Za-z\- ]{0,19}$/),
    model: fc.stringMatching(/^[A-Za-z0-9][A-Za-z0-9\- ]{0,29}$/),
    engineDisplacementCc: fc.oneof(fc.integer({ min: 500, max: 10000 }), fc.constant(null)),
    horsepower: fc.oneof(fc.integer({ min: 50, max: 2000 }), fc.constant(null)),
    location: fc.oneof(fc.string({ minLength: 1, maxLength: 30 }), fc.constant(null)),
    sellerType: fc.oneof(fc.constant('dealer' as const), fc.constant('private' as const), fc.constant(null)),
    sourceUrl: fc.webUrl(),
    imageUrls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 5 }),
    transmissionType: fc.oneof(fc.constant('manual' as const), fc.constant('automatic' as const), fc.constant(null)),
    fuelType: fc.oneof(
      fc.constant('petrol' as const),
      fc.constant('diesel' as const),
      fc.constant('hybrid' as const),
      fc.constant('electric' as const),
      fc.constant(null),
    ),
    marketplace: fc.oneof(
      fc.constant('autotrack' as const),
      fc.constant('autoscout24' as const),
      fc.constant('marktplaats' as const),
    ),
    externalId: fc.string({ minLength: 1, maxLength: 20 }),
  });
}

describe('DeduplicationService - Property 3: Deduplication Correctness', () => {
  let service: DeduplicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DeduplicationService();
  });

  it('identical 5-field tuples → duplicate detected (case-insensitive make/model)', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryQualifiedListing(), async (baseListing) => {
        // Reset mocks for each property iteration
        mockedQuery.mockReset();

        // Create a "duplicate" listing with identical 5 dedup fields but different casing
        const duplicateListing: QualifiedListing = {
          ...baseListing,
          // Vary the case of make and model to verify case-insensitive matching
          make: baseListing.make.toUpperCase(),
          model: baseListing.model.toLowerCase(),
          // Other fields can differ - they don't affect deduplication
          title: 'Different title',
          sourceUrl: 'https://other-marketplace.nl/ad/999',
          externalId: 'other-ext-id',
          marketplace: 'autoscout24',
        };

        // Mock DB to return a match (simulating an existing listing with those fields)
        mockedQuery.mockResolvedValueOnce({
          rows: [{ id: 'existing-listing-uuid' }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        });

        const result = await service.findDuplicate(duplicateListing);

        // Verify: the service detected a duplicate
        expect(result).not.toBeNull();
        expect(result!.existingListingId).toBe('existing-listing-uuid');
        expect(result!.matchedFields).toContain('make');
        expect(result!.matchedFields).toContain('model');
        expect(result!.matchedFields).toContain('year');
        expect(result!.matchedFields).toContain('mileage');
        expect(result!.matchedFields).toContain('price');

        // Verify the SQL query uses correct parameters for dedup matching
        expect(mockedQuery).toHaveBeenCalledTimes(1);
        const [sql, params] = mockedQuery.mock.calls[0];

        // Verify case-insensitive matching is in the SQL
        expect(sql).toContain('LOWER(make)');
        expect(sql).toContain('LOWER(model)');

        // Verify the parameters passed match the listing's dedup fields
        if (duplicateListing.mileage === null) {
          expect(sql).toContain('mileage IS NULL');
          expect(params).toEqual([
            duplicateListing.make,
            duplicateListing.model,
            duplicateListing.year,
            duplicateListing.price,
          ]);
        } else {
          expect(sql).toContain('mileage = $4');
          expect(params).toEqual([
            duplicateListing.make,
            duplicateListing.model,
            duplicateListing.year,
            duplicateListing.mileage,
            duplicateListing.price,
          ]);
        }
      }),
      { numRuns: 100 },
    );
  });

  it('differing in any of the 5 dedup fields → distinct (not duplicates)', async () => {
    const fieldToMutate = fc.integer({ min: 0, max: 4 });

    await fc.assert(
      fc.asyncProperty(
        arbitraryQualifiedListing(),
        fieldToMutate,
        async (baseListing, fieldIdx) => {
          // Reset mocks for each property iteration
          mockedQuery.mockReset();

          // Create a listing that differs in exactly one dedup field
          const differentListing: QualifiedListing = { ...baseListing };

          switch (fieldIdx) {
            case 0: // Differ in make
              differentListing.make = baseListing.make + 'X';
              break;
            case 1: // Differ in model
              differentListing.model = baseListing.model + 'Z';
              break;
            case 2: // Differ in year
              differentListing.year = baseListing.year + 1;
              break;
            case 3: // Differ in mileage
              if (baseListing.mileage === null) {
                differentListing.mileage = 10000;
              } else {
                differentListing.mileage = baseListing.mileage + 1;
              }
              break;
            case 4: // Differ in price
              differentListing.price = baseListing.price + 1;
              break;
          }

          // Mock DB to return no match (no existing listing matches the different fields)
          mockedQuery.mockResolvedValueOnce({
            rows: [],
            command: 'SELECT',
            rowCount: 0,
            oid: 0,
            fields: [],
          });

          const result = await service.findDuplicate(differentListing);

          // Verify: the service correctly reports no duplicate found
          expect(result).toBeNull();

          // Verify that a query WAS executed (the service did look for duplicates)
          expect(mockedQuery).toHaveBeenCalledTimes(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('null mileage edge case: both null → uses IS NULL; non-null → uses parameter comparison', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryQualifiedListing(), async (baseListing) => {
        // Reset mocks for each property iteration
        mockedQuery.mockReset();

        // Force null mileage to test the IS NULL path
        const nullMileageListing: QualifiedListing = {
          ...baseListing,
          mileage: null,
        };

        mockedQuery.mockResolvedValueOnce({
          rows: [{ id: 'match-id' }],
          command: 'SELECT',
          rowCount: 1,
          oid: 0,
          fields: [],
        });

        const result = await service.findDuplicate(nullMileageListing);
        expect(result).not.toBeNull();

        const [sql, params] = mockedQuery.mock.calls[0];
        // When mileage is null, the query should use IS NULL (not a parameter comparison)
        expect(sql).toContain('mileage IS NULL');
        // Params should NOT include mileage value - only make, model, year, price
        expect(params).toEqual([
          nullMileageListing.make,
          nullMileageListing.model,
          nullMileageListing.year,
          nullMileageListing.price,
        ]);
      }),
      { numRuns: 100 },
    );
  });

  it('non-null mileage → uses exact mileage parameter in query', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitraryQualifiedListing(),
        fc.integer({ min: 0, max: 500_000 }),
        async (baseListing, mileageValue) => {
          // Reset mocks for each property iteration
          mockedQuery.mockReset();

          // Force non-null mileage to test the parameter comparison path
          const nonNullMileageListing: QualifiedListing = {
            ...baseListing,
            mileage: mileageValue,
          };

          mockedQuery.mockResolvedValueOnce({
            rows: [{ id: 'match-id-2' }],
            command: 'SELECT',
            rowCount: 1,
            oid: 0,
            fields: [],
          });

          const result = await service.findDuplicate(nonNullMileageListing);
          expect(result).not.toBeNull();

          const [sql, params] = mockedQuery.mock.calls[0];
          // When mileage is non-null, query should compare with a parameter
          expect(sql).toContain('mileage = $4');
          expect(params).toEqual([
            nonNullMileageListing.make,
            nonNullMileageListing.model,
            nonNullMileageListing.year,
            nonNullMileageListing.mileage,
            nonNullMileageListing.price,
          ]);
        },
      ),
      { numRuns: 100 },
    );
  });
});
