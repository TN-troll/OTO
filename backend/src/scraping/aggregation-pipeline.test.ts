import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AggregationPipeline } from './aggregation-pipeline.js';
import { CurationEngine } from '../curation/curation-engine.js';
import { DeduplicationService } from '../deduplication/dedup-service.js';
import type { RawAdvertisement } from '@car-ads/shared';

// Mock the database connection
vi.mock('../db/connection.js', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
}));

import { query } from '../db/connection.js';

const mockQuery = vi.mocked(query);

/** Helper to create a valid raw advertisement with all mandatory fields. */
function createValidAd(overrides: Partial<RawAdvertisement> = {}): RawAdvertisement {
  return {
    title: 'Ferrari 488 GTB',
    price: 250000,
    mileage: 15000,
    year: 2020,
    make: 'Ferrari',
    model: '488 GTB',
    engineDisplacementCc: 3902,
    horsepower: 670,
    location: 'Amsterdam',
    sellerType: 'dealer',
    sourceUrl: 'https://autotrack.nl/ferrari/488/12345',
    imageUrls: ['https://img.example.com/1.jpg', 'https://img.example.com/2.jpg'],
    transmissionType: 'automatic',
    fuelType: 'petrol',
    bodyType: 'coupe',
    ...overrides,
  };
}

describe('AggregationPipeline', () => {
  let pipeline: AggregationPipeline;
  let curationEngine: CurationEngine;
  let deduplicationService: DeduplicationService;

  beforeEach(() => {
    vi.clearAllMocks();

    curationEngine = new CurationEngine();
    deduplicationService = new DeduplicationService();

    // Mock the curation engine's evaluate method
    vi.spyOn(curationEngine, 'evaluate').mockReturnValue({
      eligible: true,
      reason: 'luxury_brand',
      matchedCriteria: ['luxury_brand_match'],
    });

    // Mock deduplication to return no duplicates by default
    vi.spyOn(deduplicationService, 'findDuplicate').mockResolvedValue(null);
    vi.spyOn(deduplicationService, 'mergeSources').mockResolvedValue(undefined);

    pipeline = new AggregationPipeline(curationEngine, deduplicationService);

    // Default: no prior import failures
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
  });

  describe('process()', () => {
    it('should insert a new listing when ad passes all pipeline stages', async () => {
      const ad = createValidAd();
      const listingId = 'new-listing-uuid';

      // Mock: no prior failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO listings RETURNING id
      mockQuery.mockResolvedValueOnce({ rows: [{ id: listingId }], rowCount: 1, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO source_references
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });
      // Mock: SELECT sound profile
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'sound-profile-1' }], rowCount: 1, command: '', oid: 0, fields: [] });
      // Mock: UPDATE listings SET sound_profile_id
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      const result = await pipeline.process([ad], 'autotrack');

      expect(result.totalProcessed).toBe(1);
      expect(result.inserted).toBe(1);
      expect(result.results[0].outcome).toBe('inserted');
      expect(result.results[0].listingId).toBe(listingId);
    });

    it('should skip and log when mandatory fields are missing', async () => {
      const ad = createValidAd({ price: null, make: null });

      // Mock: no prior failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      // Mock: check existing import_failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO import_failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      const result = await pipeline.process([ad], 'autotrack');

      expect(result.totalProcessed).toBe(1);
      expect(result.skippedValidation).toBe(1);
      expect(result.results[0].outcome).toBe('skipped_validation');
    });

    it('should discard silently when curation rules reject the ad', async () => {
      const ad = createValidAd({ make: 'Toyota', model: 'Corolla', horsepower: 100 });

      vi.spyOn(curationEngine, 'evaluate').mockReturnValue({
        eligible: false,
        reason: 'not_eligible',
        matchedCriteria: [],
      });

      // Mock: no prior failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });

      const result = await pipeline.process([ad], 'autotrack');

      expect(result.totalProcessed).toBe(1);
      expect(result.skippedCuration).toBe(1);
      expect(result.results[0].outcome).toBe('skipped_curation');
    });

    it('should merge sources when a duplicate is found', async () => {
      const ad = createValidAd();
      const existingListingId = 'existing-listing-uuid';

      vi.spyOn(deduplicationService, 'findDuplicate').mockResolvedValue({
        existingListingId,
        confidence: 1.0,
        matchedFields: ['make', 'model', 'year', 'mileage', 'price'],
      });

      // Mock: no prior failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });

      const result = await pipeline.process([ad], 'autotrack');

      expect(result.totalProcessed).toBe(1);
      expect(result.merged).toBe(1);
      expect(result.results[0].outcome).toBe('merged');
      expect(result.results[0].listingId).toBe(existingListingId);
      expect(deduplicationService.mergeSources).toHaveBeenCalledWith(
        existingListingId,
        ad.sourceUrl,
        'autotrack',
        expect.any(String),
      );
    });

    it('should skip ad after 3 failed import attempts', async () => {
      const ad = createValidAd({ price: null }); // invalid but that's not what stops it

      // Mock: prior failures with attempt_count >= 3
      mockQuery.mockResolvedValueOnce({
        rows: [{ attempt_count: 3 }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      });

      const result = await pipeline.process([ad], 'autotrack');

      expect(result.totalProcessed).toBe(1);
      expect(result.skippedMaxAttempts).toBe(1);
      expect(result.results[0].outcome).toBe('skipped_max_attempts');
    });

    it('should process multiple advertisements and aggregate results', async () => {
      const validAd = createValidAd({ sourceUrl: 'https://autotrack.nl/1' });
      const invalidAd = createValidAd({ sourceUrl: 'https://autotrack.nl/2', price: null });
      const anotherValidAd = createValidAd({ sourceUrl: 'https://autotrack.nl/3' });

      // For validAd: no prior failures → insert success
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'id-1' }], rowCount: 1, command: '', oid: 0, fields: [] });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] }); // no sound profile
      // For invalidAd: no prior failures → validation fails → log
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] }); // no existing failure
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] }); // insert failure
      // For anotherValidAd: no prior failures → insert success
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'id-3' }], rowCount: 1, command: '', oid: 0, fields: [] });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] }); // no sound profile

      const result = await pipeline.process([validAd, invalidAd, anotherValidAd], 'autotrack');

      expect(result.totalProcessed).toBe(3);
      expect(result.inserted).toBe(2);
      expect(result.skippedValidation).toBe(1);
    });

    it('should truncate image URLs to MAX_IMAGES_PER_LISTING', async () => {
      const manyImages = Array.from({ length: 25 }, (_, i) => `https://img.example.com/${i}.jpg`);
      const ad = createValidAd({ imageUrls: manyImages });
      const listingId = 'listing-with-images';

      // Mock: no prior failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO listings
      mockQuery.mockResolvedValueOnce({ rows: [{ id: listingId }], rowCount: 1, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO source_references
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });
      // Mock: no sound profile
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });

      await pipeline.process([ad], 'autotrack');

      // Verify the INSERT call used truncated images (max 20)
      const insertCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO listings'),
      );
      expect(insertCall).toBeDefined();
      const imageUrlsParam = insertCall![1]![13] as string[];
      expect(imageUrlsParam.length).toBe(20);
    });

    it('should associate sound profile when a match is found by make/model', async () => {
      const ad = createValidAd();
      const listingId = 'listing-with-sound';
      const soundProfileId = 'ferrari-488-profile';

      // Mock: no prior failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO listings
      mockQuery.mockResolvedValueOnce({ rows: [{ id: listingId }], rowCount: 1, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO source_references
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });
      // Mock: SELECT sound profile (found)
      mockQuery.mockResolvedValueOnce({ rows: [{ id: soundProfileId }], rowCount: 1, command: '', oid: 0, fields: [] });
      // Mock: UPDATE listings SET sound_profile_id
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      const result = await pipeline.process([ad], 'autotrack');

      expect(result.results[0].outcome).toBe('inserted');

      // Verify sound profile association query
      const updateCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('UPDATE listings SET sound_profile_id'),
      );
      expect(updateCall).toBeDefined();
      expect(updateCall![1]).toEqual([soundProfileId, listingId]);
    });

    it('should not update sound profile when no match is found', async () => {
      const ad = createValidAd({ make: 'Unknown', model: 'Car' });
      const listingId = 'listing-no-sound';

      // Mock: no prior failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO listings
      mockQuery.mockResolvedValueOnce({ rows: [{ id: listingId }], rowCount: 1, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO source_references
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });
      // Mock: SELECT sound profile (not found)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });

      await pipeline.process([ad], 'autotrack');

      // Should NOT have called UPDATE for sound profile
      const updateCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('UPDATE listings SET sound_profile_id'),
      );
      expect(updateCall).toBeUndefined();
    });

    it('should handle errors gracefully and log them', async () => {
      const ad = createValidAd();

      // Mock: no prior failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO listings throws an error
      mockQuery.mockRejectedValueOnce(new Error('Database connection lost'));
      // Mock: check existing import_failures for error logging
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      // Mock: INSERT INTO import_failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      const result = await pipeline.process([ad], 'autotrack');

      expect(result.totalProcessed).toBe(1);
      expect(result.errors).toBe(1);
      expect(result.results[0].outcome).toBe('error');
      expect(result.results[0].error).toBe('Database connection lost');
    });

    it('should increment attempt count on repeated failures', async () => {
      const ad = createValidAd({ price: null });

      // Mock: no prior failures (attempt_count check)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0, command: '', oid: 0, fields: [] });
      // Mock: check existing import_failures (found with count 2)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'failure-id', attempt_count: 2 }],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      });
      // Mock: UPDATE import_failures
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1, command: '', oid: 0, fields: [] });

      const result = await pipeline.process([ad], 'autotrack');

      expect(result.skippedValidation).toBe(1);

      // Verify update was called (incrementing attempt_count)
      const updateCall = mockQuery.mock.calls.find(
        (call) => typeof call[0] === 'string' && call[0].includes('UPDATE import_failures'),
      );
      expect(updateCall).toBeDefined();
    });
  });

  describe('markStaleListingsInactive()', () => {
    it('should mark listings as inactive when last_verified is older than 120 minutes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'stale-1' }, { id: 'stale-2' }],
        rowCount: 2,
        command: '',
        oid: 0,
        fields: [],
      });

      const count = await pipeline.markStaleListingsInactive();

      expect(count).toBe(2);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE listings'),
        expect.arrayContaining([expect.any(String)]),
      );
    });

    it('should return 0 when no stale listings exist', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: [],
      });

      const count = await pipeline.markStaleListingsInactive();

      expect(count).toBe(0);
    });
  });
});
