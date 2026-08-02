import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeduplicationService, QualifiedListing } from './dedup-service.js';

// Mock the database connection module
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
}));

import { query } from '../db/connection.js';

const mockedQuery = vi.mocked(query);

function makeQualifiedListing(overrides: Partial<QualifiedListing> = {}): QualifiedListing {
  return {
    title: '2020 BMW M3 Competition',
    price: 85000,
    mileage: 15000,
    year: 2020,
    make: 'BMW',
    model: 'M3',
    engineDisplacementCc: 2993,
    horsepower: 510,
    location: 'Amsterdam',
    sellerType: 'dealer',
    sourceUrl: 'https://autotrack.nl/listing/123',
    imageUrls: ['https://img.example.com/1.jpg'],
    transmissionType: 'automatic',
    fuelType: 'petrol',
    marketplace: 'autotrack',
    externalId: 'AT-123',
    ...overrides,
  };
}

describe('DeduplicationService', () => {
  let service: DeduplicationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DeduplicationService();
  });

  describe('findDuplicate', () => {
    it('returns null when no duplicate is found', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const listing = makeQualifiedListing();
      const result = await service.findDuplicate(listing);

      expect(result).toBeNull();
    });

    it('returns a DuplicateMatch when a matching listing exists', async () => {
      const existingId = 'existing-uuid-123';
      mockedQuery.mockResolvedValueOnce({ rows: [{ id: existingId }], rowCount: 1 } as any);

      const listing = makeQualifiedListing();
      const result = await service.findDuplicate(listing);

      expect(result).not.toBeNull();
      expect(result!.existingListingId).toBe(existingId);
      expect(result!.confidence).toBe(1.0);
      expect(result!.matchedFields).toEqual(['make', 'model', 'year', 'mileage', 'price']);
    });

    it('performs case-insensitive comparison on make and model', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [{ id: 'id-1' }], rowCount: 1 } as any);

      const listing = makeQualifiedListing({ make: 'bmw', model: 'm3' });
      await service.findDuplicate(listing);

      // The SQL uses LOWER() so the passed params are the original values
      const callArgs = mockedQuery.mock.calls[0];
      expect(callArgs[0]).toContain('LOWER(make) = LOWER($1)');
      expect(callArgs[0]).toContain('LOWER(model) = LOWER($2)');
      expect(callArgs[1]).toContain('bmw');
      expect(callArgs[1]).toContain('m3');
    });

    it('handles null mileage in both listings as a match', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [{ id: 'id-null-mileage' }], rowCount: 1 } as any);

      const listing = makeQualifiedListing({ mileage: null });
      const result = await service.findDuplicate(listing);

      // When mileage is null, the query should use IS NULL
      const callArgs = mockedQuery.mock.calls[0];
      expect(callArgs[0]).toContain('mileage IS NULL');
      expect(result).not.toBeNull();
      expect(result!.existingListingId).toBe('id-null-mileage');
    });

    it('uses exact mileage match when mileage is provided', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const listing = makeQualifiedListing({ mileage: 25000 });
      await service.findDuplicate(listing);

      const callArgs = mockedQuery.mock.calls[0];
      expect(callArgs[0]).toContain('mileage = $4');
      expect(callArgs[1]).toContain(25000);
    });

    it('uses exact price match', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const listing = makeQualifiedListing({ price: 99999 });
      await service.findDuplicate(listing);

      const callArgs = mockedQuery.mock.calls[0];
      expect(callArgs[0]).toContain('price = $');
      expect(callArgs[1]).toContain(99999);
    });

    it('only matches active listings', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const listing = makeQualifiedListing();
      await service.findDuplicate(listing);

      const callArgs = mockedQuery.mock.calls[0];
      expect(callArgs[0]).toContain("status = 'active'");
    });
  });

  describe('mergeSources', () => {
    it('inserts a new source reference for the existing listing', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await service.mergeSources('listing-uuid', 'https://autoscout24.nl/ad/456', 'autoscout24', 'AS-456');

      expect(mockedQuery).toHaveBeenCalledTimes(1);
      const callArgs = mockedQuery.mock.calls[0];
      expect(callArgs[0]).toContain('INSERT INTO source_references');
      expect(callArgs[1]).toEqual(['listing-uuid', 'autoscout24', 'https://autoscout24.nl/ad/456', 'AS-456']);
    });

    it('uses ON CONFLICT to update existing source reference', async () => {
      mockedQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      await service.mergeSources('listing-uuid', 'https://marktplaats.nl/auto/789', 'marktplaats', 'MP-789');

      const callArgs = mockedQuery.mock.calls[0];
      expect(callArgs[0]).toContain('ON CONFLICT (marketplace, external_id)');
      expect(callArgs[0]).toContain('DO UPDATE');
    });
  });
});
