// Feature: interactive-dealer-map, Property 4: Marker count equals location count
// Feature: interactive-dealer-map, Property 5: Marker badge displays total listing count
// Feature: interactive-dealer-map, Property 8: Marker color reflects dealer presence

import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import type { MapLocation, MapListingPreview } from '@car-ads/shared';

/**
 * **Validates: Requirements 3.1, 3.2, 3.5**
 */

// Mock react-leaflet Marker to render a simple div with the icon html
vi.mock('react-leaflet', () => ({
  Marker: ({ icon }: { icon?: { options?: { html?: string } } }) => (
    <div data-testid="leaflet-marker" data-icon-html={icon?.options?.html ?? ''} />
  ),
}));

// Mock leaflet's divIcon and point
vi.mock('leaflet', () => ({
  default: {
    divIcon: (opts: { html: string; className: string; iconSize: unknown; iconAnchor: unknown }) => ({
      options: { html: opts.html, className: opts.className },
    }),
    point: (x: number, y: number) => ({ x, y }),
  },
}));

// Import after mocks are set up
import { LocationMarker } from './LocationMarker';

// Ensure DOM is cleaned up after each test
afterEach(() => {
  cleanup();
});

// --- Arbitraries ---

/** Generates a valid MapListingPreview */
const mapListingPreviewArb: fc.Arbitrary<MapListingPreview> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 80 }),
  price: fc.integer({ min: 1, max: 500_000 }),
  primaryImageUrl: fc.oneof(fc.constant('https://example.com/img.jpg'), fc.constant(null)),
  make: fc.string({ minLength: 1, maxLength: 30 }),
  model: fc.string({ minLength: 1, maxLength: 30 }),
});

/** Generates a valid MapLocation with coordinates in the Netherlands */
const mapLocationArb: fc.Arbitrary<MapLocation> = fc
  .record({
    city: fc.string({ minLength: 1, maxLength: 50 }),
    latitude: fc.double({ min: 50.7, max: 53.6, noNaN: true }),
    longitude: fc.double({ min: 3.3, max: 7.3, noNaN: true }),
    dealerCount: fc.nat({ max: 100 }),
    privateCount: fc.nat({ max: 100 }),
    previews: fc.array(mapListingPreviewArb, { minLength: 0, maxLength: 3 }),
  })
  .filter((rec) => rec.dealerCount + rec.privateCount >= 1)
  .map((rec) => ({
    ...rec,
    totalCount: rec.dealerCount + rec.privateCount,
  }));

/** Generates a MapLocation specifically with dealers (dealerCount > 0) */
const dealerLocationArb: fc.Arbitrary<MapLocation> = fc
  .record({
    city: fc.string({ minLength: 1, maxLength: 50 }),
    latitude: fc.double({ min: 50.7, max: 53.6, noNaN: true }),
    longitude: fc.double({ min: 3.3, max: 7.3, noNaN: true }),
    dealerCount: fc.integer({ min: 1, max: 100 }),
    privateCount: fc.nat({ max: 100 }),
    previews: fc.array(mapListingPreviewArb, { minLength: 0, maxLength: 3 }),
  })
  .map((rec) => ({
    ...rec,
    totalCount: rec.dealerCount + rec.privateCount,
  }));

/** Generates a MapLocation with only private sellers (dealerCount === 0) */
const privateOnlyLocationArb: fc.Arbitrary<MapLocation> = fc
  .record({
    city: fc.string({ minLength: 1, maxLength: 50 }),
    latitude: fc.double({ min: 50.7, max: 53.6, noNaN: true }),
    longitude: fc.double({ min: 3.3, max: 7.3, noNaN: true }),
    privateCount: fc.integer({ min: 1, max: 100 }),
    previews: fc.array(mapListingPreviewArb, { minLength: 0, maxLength: 3 }),
  })
  .map((rec) => ({
    ...rec,
    dealerCount: 0,
    totalCount: rec.privateCount,
  }));

describe('LocationMarker - Property Tests', () => {
  // Property 4: Marker count equals location count
  // For any N locations, N markers render
  it('Property 4: Rendering N LocationMarkers produces exactly N marker elements', () => {
    fc.assert(
      fc.property(
        fc.array(mapLocationArb, { minLength: 0, maxLength: 20 }),
        (locations) => {
          const { container } = render(
            <div>
              {locations.map((loc, i) => (
                <LocationMarker key={i} location={loc} />
              ))}
            </div>
          );

          const markers = container.querySelectorAll('[data-testid="leaflet-marker"]');
          expect(markers.length).toBe(locations.length);

          // Clean up between iterations
          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 5: Marker badge displays total listing count
  // Badge text equals totalCount
  it('Property 5: Marker badge text equals the location totalCount', () => {
    fc.assert(
      fc.property(
        mapLocationArb,
        (location) => {
          const { container } = render(
            <LocationMarker location={location} />
          );

          const marker = container.querySelector('[data-testid="leaflet-marker"]');
          expect(marker).not.toBeNull();
          const iconHtml = marker!.getAttribute('data-icon-html') ?? '';

          // The icon HTML should contain the totalCount as the badge text
          expect(iconHtml).toContain(`>${location.totalCount}</div>`);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 8: Marker color reflects dealer presence
  // Gold (#f59e0b) if dealerCount > 0, blue (#3b82f6) otherwise
  it('Property 8: Marker uses gold color when dealerCount > 0', () => {
    fc.assert(
      fc.property(
        dealerLocationArb,
        (location) => {
          const { container } = render(
            <LocationMarker location={location} />
          );

          const marker = container.querySelector('[data-testid="leaflet-marker"]');
          expect(marker).not.toBeNull();
          const iconHtml = marker!.getAttribute('data-icon-html') ?? '';

          // Gold marker background color for dealer locations
          expect(iconHtml).toContain('#f59e0b');
          // Should NOT contain blue
          expect(iconHtml).not.toContain('#3b82f6');

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8: Marker uses blue color when dealerCount === 0', () => {
    fc.assert(
      fc.property(
        privateOnlyLocationArb,
        (location) => {
          const { container } = render(
            <LocationMarker location={location} />
          );

          const marker = container.querySelector('[data-testid="leaflet-marker"]');
          expect(marker).not.toBeNull();
          const iconHtml = marker!.getAttribute('data-icon-html') ?? '';

          // Blue marker background color for private-only locations
          expect(iconHtml).toContain('#3b82f6');
          // Should NOT contain gold
          expect(iconHtml).not.toContain('#f59e0b');

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
