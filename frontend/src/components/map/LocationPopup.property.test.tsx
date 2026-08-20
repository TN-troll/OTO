// Feature: interactive-dealer-map, Property 6: Popup contains city name, count, and listing previews
// Feature: interactive-dealer-map, Property 7: Browse link construction from city name
// Feature: interactive-dealer-map, Property 10: Listing detail link construction

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import fc from 'fast-check';
import type { MapLocation, MapListingPreview } from '@car-ads/shared';
import { LocationPopup } from './LocationPopup';

// Mock the image proxy to return a predictable URL
vi.mock('../../utils/imageProxy', () => ({
  getProxyImageUrl: (url: string | null | undefined) => url ?? '',
}));

// --- Generators ---

/** Generates a valid MapListingPreview */
const arbPreview: fc.Arbitrary<MapListingPreview> = fc.record({
  id: fc.stringMatching(/^[a-z0-9]{8,24}$/),
  title: fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim().length > 0),
  price: fc.integer({ min: 1, max: 500000 }),
  primaryImageUrl: fc.oneof(
    fc.constant(null),
    fc.webUrl(),
  ),
  make: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  model: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
});

/** Generates a valid MapLocation with 1-3 previews */
const arbLocation: fc.Arbitrary<MapLocation> = fc
  .record({
    city: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
    latitude: fc.double({ min: 50.7, max: 53.6, noNaN: true, noDefaultInfinity: true }),
    longitude: fc.double({ min: 3.3, max: 7.3, noNaN: true, noDefaultInfinity: true }),
    dealerCount: fc.integer({ min: 0, max: 100 }),
    privateCount: fc.integer({ min: 0, max: 100 }),
    previews: fc.array(arbPreview, { minLength: 1, maxLength: 3 }),
  })
  .map((loc) => ({
    ...loc,
    totalCount: loc.dealerCount + loc.privateCount || loc.previews.length,
  }));

/** Generates a MapLocation with a guaranteed non-empty previews array */
const arbLocationWithPreviews: fc.Arbitrary<MapLocation> = fc
  .record({
    city: fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
    latitude: fc.double({ min: 50.7, max: 53.6, noNaN: true, noDefaultInfinity: true }),
    longitude: fc.double({ min: 3.3, max: 7.3, noNaN: true, noDefaultInfinity: true }),
    dealerCount: fc.integer({ min: 1, max: 100 }),
    privateCount: fc.integer({ min: 0, max: 100 }),
    previews: fc.array(arbPreview, { minLength: 1, maxLength: 3 }),
  })
  .map((loc) => ({
    ...loc,
    totalCount: loc.dealerCount + loc.privateCount,
  }));

/** Helper to render LocationPopup wrapped in MemoryRouter */
function renderPopup(location: MapLocation) {
  return render(
    <MemoryRouter>
      <LocationPopup location={location} />
    </MemoryRouter>,
  );
}

// --- Property Tests ---

/**
 * Property 6: Popup contains city name, count, and listing previews
 *
 * For any MapLocation, the rendered popup content SHALL contain the city name,
 * the total listing count, and for each preview (up to 3): the listing title,
 * formatted price, and image element.
 *
 * Validates: Requirements 3.3
 */
describe('Property 6: Popup contains city name, count, and listing previews', () => {
  it('renders city name, listing count, and preview titles for any MapLocation', () => {
    fc.assert(
      fc.property(arbLocation, (location) => {
        const { container, unmount } = renderPopup(location);

        // City name is rendered in the heading
        const heading = container.querySelector('h3');
        expect(heading).not.toBeNull();
        expect(heading!.textContent).toBe(location.city);

        // Listing count is rendered (as "N listings" or "1 listing")
        const countText =
          location.totalCount === 1
            ? `${location.totalCount} listing`
            : `${location.totalCount} listings`;
        expect(container.textContent).toContain(countText);

        // Each preview title is rendered in the list items (up to 3)
        const displayPreviews = location.previews.slice(0, 3);
        const listItems = container.querySelectorAll('li');
        expect(listItems.length).toBe(displayPreviews.length);

        for (let i = 0; i < displayPreviews.length; i++) {
          expect(listItems[i].textContent).toContain(displayPreviews[i].title);
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it('renders an image element for each preview with a non-null primaryImageUrl', () => {
    fc.assert(
      fc.property(arbLocationWithPreviews, (location) => {
        const { container, unmount } = renderPopup(location);

        const displayPreviews = location.previews.slice(0, 3);
        const previewsWithImage = displayPreviews.filter((p) => p.primaryImageUrl !== null);

        // Each preview with an image should have an img element
        const images = container.querySelectorAll('img');
        expect(images.length).toBe(previewsWithImage.length);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 7: Browse link construction from city name
 *
 * For any MapLocation with city name C, the popup SHALL contain a navigation link
 * whose target URL includes the location filter parameter set to C.
 *
 * Validates: Requirements 3.4, 6.2
 */
describe('Property 7: Browse link construction from city name', () => {
  it('"View all listings" link contains encoded city in the URL', () => {
    fc.assert(
      fc.property(arbLocation, (location) => {
        const { container, unmount } = renderPopup(location);

        // Find the "View all listings" link — it's the last <a> element in the popup
        const links = container.querySelectorAll('a');
        const viewAllLink = Array.from(links).find(
          (a) => a.textContent?.includes('View all listings'),
        );
        expect(viewAllLink).not.toBeUndefined();

        // The href should contain /browse?location=<encodedCity>
        const expectedHref = `/browse?location=${encodeURIComponent(location.city)}`;
        expect(viewAllLink!.getAttribute('href')).toBe(expectedHref);

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Property 10: Listing detail link construction
 *
 * For any MapListingPreview with id X displayed in a popup, the rendered link
 * SHALL navigate to `/listing/X`.
 *
 * Validates: Requirements 6.1
 */
describe('Property 10: Listing detail link construction', () => {
  it('each preview links to /listing/{id}', () => {
    fc.assert(
      fc.property(arbLocationWithPreviews, (location) => {
        const { container, unmount } = renderPopup(location);

        const displayPreviews = location.previews.slice(0, 3);

        for (const preview of displayPreviews) {
          // Find the link that goes to /listing/{id}
          const expectedHref = `/listing/${preview.id}`;
          const link = container.querySelector(`a[href="${expectedHref}"]`);
          expect(link).not.toBeNull();
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });
});
