import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecentlyViewedStrip } from './RecentlyViewedStrip';

/**
 * Property tests for RecentlyViewedStrip display logic.
 *
 * Validates: Requirements 4.3, 4.4, 4.5
 */

// --- Mocks ---

const mockRecentIds: string[] = [];

vi.mock('../hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => ({ recentIds: mockRecentIds, addViewed: vi.fn() }),
}));

vi.mock('../i18n', () => ({
  useLanguage: () => ({
    t: { recentlyViewed: 'Recently Viewed' },
    locale: 'en',
    setLocale: vi.fn(),
  }),
}));

vi.mock('../utils/imageProxy', () => ({
  getProxyImageUrl: (url: string) => url,
}));

// We mock the api module to control getListing responses per ID
const mockGetListing = vi.fn();
vi.mock('../api/client', () => ({
  api: { getListing: (...args: unknown[]) => mockGetListing(...args) },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

// --- Helpers ---

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function renderStrip(maxItems?: number) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <RecentlyViewedStrip maxItems={maxItems} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function makeListing(id: string) {
  return {
    id,
    title: `Listing ${id}`,
    price: 50000,
    mileage: 10000,
    year: 2022,
    make: `Make-${id}`,
    model: `Model-${id}`,
    engineDisplacementCc: 3000,
    horsepower: 300,
    location: 'Amsterdam',
    sellerType: 'dealer',
    transmissionType: 'automatic',
    fuelType: 'petrol',
    bodyType: 'sedan',
    imageUrls: [`https://img.example.com/${id}.jpg`],
    sourceUrls: [],
    soundProfileId: null,
    status: 'active' as const,
    curationCriteria: [],
    dateAdded: new Date(),
    lastVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/** Arbitrary for generating an array of unique IDs of length 0–10 */
const arbIdArray = fc
  .array(fc.uuid(), { minLength: 0, maxLength: 10 })
  .map(ids => [...new Set(ids)]); // ensure uniqueness

/** Arbitrary for generating a non-empty array of unique IDs (1–10) */
const arbNonEmptyIdArray = fc
  .array(fc.uuid(), { minLength: 1, maxLength: 10 })
  .map(ids => [...new Set(ids)])
  .filter(ids => ids.length > 0);

// --- Tests ---

describe('RecentlyViewedStrip property tests', () => {
  beforeEach(() => {
    mockRecentIds.length = 0;
    mockGetListing.mockReset();
  });

  /**
   * Property 5: Display cap
   *
   * For any stored array length (0–10), strip renders at most 5 cards.
   *
   * Validates: Requirements 4.3
   */
  describe('Property 5: Display cap', () => {
    it('renders at most 5 cards regardless of stored array length (0–10)', async () => {
      await fc.assert(
        fc.asyncProperty(arbIdArray, async (ids) => {
          // Set up mock recent IDs
          mockRecentIds.length = 0;
          mockRecentIds.push(...ids);

          // All IDs resolve to valid listings
          mockGetListing.mockImplementation((id: string) =>
            Promise.resolve(makeListing(id)),
          );

          const { container, unmount } = renderStrip();

          // Wait for queries to settle
          await vi.waitFor(() => {
            // Either no cards (empty input or all failed), or cards rendered
            const links = container.querySelectorAll('a[href^="/listing/"]');
            if (ids.length === 0) {
              // Should render null
              expect(links.length).toBe(0);
            } else {
              // Cards should be rendered (queries resolved)
              expect(links.length).toBeGreaterThan(0);
            }
          }, { timeout: 2000 });

          const cards = container.querySelectorAll('a[href^="/listing/"]');
          expect(cards.length).toBeLessThanOrEqual(5);

          unmount();
        }),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property 6: Ordering
   *
   * Cards are always ordered most-recently-viewed first.
   * The order of rendered cards matches the order of IDs in the input array
   * (which is already most-recent-first from the hook).
   *
   * Validates: Requirements 4.4
   */
  describe('Property 6: Ordering', () => {
    it('cards are rendered in the same order as the recentIds array (most-recent first)', async () => {
      await fc.assert(
        fc.asyncProperty(arbNonEmptyIdArray, async (ids) => {
          mockRecentIds.length = 0;
          mockRecentIds.push(...ids);

          // All IDs resolve to valid listings
          mockGetListing.mockImplementation((id: string) =>
            Promise.resolve(makeListing(id)),
          );

          const { container, unmount } = renderStrip();

          // Wait for cards to render
          await vi.waitFor(() => {
            const links = container.querySelectorAll('a[href^="/listing/"]');
            expect(links.length).toBeGreaterThan(0);
          }, { timeout: 2000 });

          const cards = container.querySelectorAll('a[href^="/listing/"]');
          const renderedIds = Array.from(cards).map(card =>
            card.getAttribute('href')!.replace('/listing/', ''),
          );

          // Expected order: first maxItems (5) IDs from the array, in same order
          const expectedIds = ids.slice(0, 5);
          expect(renderedIds).toEqual(expectedIds);

          unmount();
        }),
        { numRuns: 50 },
      );
    });
  });

  /**
   * Property 7: Invalid listing omission
   *
   * Listings with failed API responses are omitted without error.
   * The component should only render cards for IDs that returned valid data.
   *
   * Validates: Requirements 4.5
   */
  describe('Property 7: Invalid listing omission', () => {
    it('only renders cards for successfully fetched listings, omitting failures', async () => {
      // Generate IDs and a boolean mask indicating which ones should fail
      const arbIdsWithFailures = fc.tuple(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }).map(ids => [...new Set(ids)]).filter(ids => ids.length > 0),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 5 }),
      );

      await fc.assert(
        fc.asyncProperty(arbIdsWithFailures, async ([ids, failMask]) => {
          mockRecentIds.length = 0;
          mockRecentIds.push(...ids);

          // Determine which IDs fail based on the mask
          const failingIds = new Set(
            ids.filter((_, idx) => failMask[idx % failMask.length]),
          );
          const successIds = ids.filter(id => !failingIds.has(id)).slice(0, 5);

          mockGetListing.mockImplementation((id: string) => {
            if (failingIds.has(id)) {
              return Promise.reject(new Error('Not found'));
            }
            return Promise.resolve(makeListing(id));
          });

          const { container, unmount } = renderStrip();

          // Wait for queries to settle
          await vi.waitFor(() => {
            const links = container.querySelectorAll('a[href^="/listing/"]');
            // Either all failed (renders null) or some succeeded
            if (successIds.length === 0) {
              // Component should render null — no section heading
              expect(container.querySelector('section')).toBeNull();
            } else {
              expect(links.length).toBe(successIds.length);
            }
          }, { timeout: 2000 });

          // Verify no error message is rendered
          expect(container.textContent).not.toContain('error');
          expect(container.textContent).not.toContain('Error');

          // Verify only successful listings are shown
          const cards = container.querySelectorAll('a[href^="/listing/"]');
          const renderedIds = Array.from(cards).map(card =>
            card.getAttribute('href')!.replace('/listing/', ''),
          );

          for (const renderedId of renderedIds) {
            expect(failingIds.has(renderedId)).toBe(false);
          }

          unmount();
        }),
        { numRuns: 50 },
      );
    });
  });
});
