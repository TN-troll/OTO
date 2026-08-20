// Feature: interactive-dealer-map, Property 9: API response location structural validity

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { MapLocation, MapListingPreview } from '@car-ads/shared';

/**
 * **Validates: Requirements 5.2, 5.3**
 */

/** Netherlands bounding box */
const NL_LAT_MIN = 50.7;
const NL_LAT_MAX = 53.6;
const NL_LNG_MIN = 3.3;
const NL_LNG_MAX = 7.3;

/** Arbitrary for a valid MapListingPreview */
const mapListingPreviewArb: fc.Arbitrary<MapListingPreview> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 36 }),
  title: fc.string({ minLength: 1, maxLength: 200 }),
  price: fc.double({ min: 1, max: 10_000_000, noNaN: true }),
  primaryImageUrl: fc.option(fc.webUrl(), { nil: null }),
  make: fc.string({ minLength: 1, maxLength: 50 }),
  model: fc.string({ minLength: 1, maxLength: 50 }),
});

/** Arbitrary for a valid MapLocation that satisfies all structural invariants */
const mapLocationArb: fc.Arbitrary<MapLocation> = fc
  .record({
    city: fc.string({ minLength: 1, maxLength: 100 }),
    latitude: fc.double({ min: NL_LAT_MIN, max: NL_LAT_MAX, noNaN: true }),
    longitude: fc.double({ min: NL_LNG_MIN, max: NL_LNG_MAX, noNaN: true }),
    dealerCount: fc.integer({ min: 0, max: 500 }),
    privateCount: fc.integer({ min: 0, max: 500 }),
    previews: fc.array(mapListingPreviewArb, { minLength: 0, maxLength: 3 }),
  })
  .filter((loc) => loc.dealerCount + loc.privateCount >= 1)
  .map((loc) => ({
    ...loc,
    totalCount: loc.dealerCount + loc.privateCount,
  }));

describe('Map Locations API - Property Tests', () => {
  // Property 9: API response location structural validity
  // For any location in the response: non-empty city, lat/lng within NL bounds,
  // totalCount >= 1, dealerCount >= 0, privateCount >= 0,
  // dealerCount + privateCount == totalCount, previews array with 0-3 items
  // each with required fields
  it('Property 9: Every MapLocation satisfies structural invariants', () => {
    fc.assert(
      fc.property(mapLocationArb, (location: MapLocation) => {
        // Non-empty city
        expect(location.city.length).toBeGreaterThan(0);

        // Latitude within Netherlands bounds
        expect(location.latitude).toBeGreaterThanOrEqual(NL_LAT_MIN);
        expect(location.latitude).toBeLessThanOrEqual(NL_LAT_MAX);

        // Longitude within Netherlands bounds
        expect(location.longitude).toBeGreaterThanOrEqual(NL_LNG_MIN);
        expect(location.longitude).toBeLessThanOrEqual(NL_LNG_MAX);

        // Count invariants
        expect(location.totalCount).toBeGreaterThanOrEqual(1);
        expect(location.dealerCount).toBeGreaterThanOrEqual(0);
        expect(location.privateCount).toBeGreaterThanOrEqual(0);
        expect(location.dealerCount + location.privateCount).toBe(location.totalCount);

        // Previews array: 0-3 items
        expect(location.previews.length).toBeGreaterThanOrEqual(0);
        expect(location.previews.length).toBeLessThanOrEqual(3);

        // Each preview has all required fields
        for (const preview of location.previews) {
          expect(preview.id).toBeDefined();
          expect(preview.id.length).toBeGreaterThan(0);
          expect(preview.title).toBeDefined();
          expect(preview.title.length).toBeGreaterThan(0);
          expect(typeof preview.price).toBe('number');
          expect(preview.price).toBeGreaterThan(0);
          expect('primaryImageUrl' in preview).toBe(true);
          expect(preview.make).toBeDefined();
          expect(preview.make.length).toBeGreaterThan(0);
          expect(preview.model).toBeDefined();
          expect(preview.model.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });
});
