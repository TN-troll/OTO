import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { ListingCard } from './ListingCard';
import type { ListingSummary } from '@car-ads/shared';

// Mock hooks to avoid external dependencies
vi.mock('../hooks/useFavorites', () => ({
  useFavorites: () => ({
    toggleFavorite: vi.fn(),
    isFavorite: () => false,
  }),
}));

vi.mock('../hooks/useCompare', () => ({
  useCompare: () => ({
    addToCompare: vi.fn(),
    removeFromCompare: vi.fn(),
    isInCompare: () => false,
  }),
}));

vi.mock('../utils/imageProxy', () => ({
  getProxyImageUrl: (url: string | null) => url || '',
}));

function createMockListing(overrides: Partial<ListingSummary> = {}): ListingSummary {
  return {
    id: 'test-123',
    title: 'Test Car',
    primaryImageUrl: 'https://example.com/car.jpg',
    imageUrls: ['https://example.com/car.jpg'],
    make: 'Porsche',
    model: '911',
    year: 2023,
    price: 89000,
    horsepower: 450,
    engineDisplacementCc: 3000,
    mileage: null,
    fuelType: null,
    location: null,
    sellerType: null,
    marketAvgPrice: null,
    dateAdded: new Date('2023-01-01'),
    snippet: null,
    ...overrides,
  };
}

describe('ListingCard image loading behavior', () => {
  describe('Lazy vs eager loading based on priority', () => {
    it('uses loading="lazy" when priority is false (default)', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const img = screen.getByAltText('Porsche 911');
      expect(img).toHaveAttribute('loading', 'lazy');
    });

    it('does not set fetchPriority when priority is false', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const img = screen.getByAltText('Porsche 911');
      expect(img).not.toHaveAttribute('fetchPriority');
    });

    it('uses loading="eager" when priority is true', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} priority={true} />);

      const img = screen.getByAltText('Porsche 911');
      expect(img).toHaveAttribute('loading', 'eager');
    });

    it('sets fetchPriority="high" when priority is true', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} priority={true} />);

      const img = screen.getByAltText('Porsche 911');
      expect(img).toHaveAttribute('fetchPriority', 'high');
    });
  });

  describe('Placeholder rendering on image error', () => {
    it('renders the placeholder with role="img" after image error', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const img = screen.getByAltText('Porsche 911');
      fireEvent.error(img);

      const placeholder = screen.getByRole('img', { name: /image could not be loaded/i });
      expect(placeholder).toBeInTheDocument();
    });

    it('renders the placeholder with aria-label="Image could not be loaded"', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const img = screen.getByAltText('Porsche 911');
      fireEvent.error(img);

      const placeholder = screen.getByRole('img');
      expect(placeholder).toHaveAttribute('aria-label', 'Image could not be loaded');
    });

    it('renders a placeholder SVG inside the placeholder container', () => {
      const listing = createMockListing();
      const { container } = render(<ListingCard listing={listing} />);

      const img = screen.getByAltText('Porsche 911');
      fireEvent.error(img);

      const placeholder = screen.getByRole('img', { name: /image could not be loaded/i });
      const svg = placeholder.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    it('renders placeholder when no image URL is provided', () => {
      const listing = createMockListing({ primaryImageUrl: null, imageUrls: [] });
      render(<ListingCard listing={listing} />);

      const placeholder = screen.getByRole('img', { name: /image could not be loaded/i });
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('Aspect ratio preservation', () => {
    it('standard card has aspect-[3/2] class on image container', () => {
      const listing = createMockListing();
      const { container } = render(<ListingCard listing={listing} />);

      const aspectContainer = container.querySelector('.aspect-\\[3\\/2\\]');
      expect(aspectContainer).not.toBeNull();
    });

    it('featured card has aspect-[16/9] class on image container', () => {
      const listing = createMockListing();
      const { container } = render(<ListingCard listing={listing} featured={true} />);

      const aspectContainer = container.querySelector('.aspect-\\[16\\/9\\]');
      expect(aspectContainer).not.toBeNull();
    });

    it('standard card does NOT have aspect-[16/9]', () => {
      const listing = createMockListing();
      const { container } = render(<ListingCard listing={listing} featured={false} />);

      const aspectContainer = container.querySelector('.aspect-\\[16\\/9\\]');
      expect(aspectContainer).toBeNull();
    });

    it('featured card does NOT have aspect-[3/2]', () => {
      const listing = createMockListing();
      const { container } = render(<ListingCard listing={listing} featured={true} />);

      const aspectContainer = container.querySelector('.aspect-\\[3\\/2\\]');
      expect(aspectContainer).toBeNull();
    });

    it('aspect ratio is preserved even when image fails', () => {
      const listing = createMockListing();
      const { container } = render(<ListingCard listing={listing} />);

      const img = screen.getByAltText('Porsche 911');
      fireEvent.error(img);

      const aspectContainer = container.querySelector('.aspect-\\[3\\/2\\]');
      expect(aspectContainer).not.toBeNull();
    });

    it('isFeatured listing also gets 16:9 aspect ratio', () => {
      const listing = createMockListing({ isFeatured: true });
      const { container } = render(<ListingCard listing={listing} />);

      const aspectContainer = container.querySelector('.aspect-\\[16\\/9\\]');
      expect(aspectContainer).not.toBeNull();
    });
  });

  /**
   * **Property 10: Image Layout Stability**
   * **Validates: Requirements 5.2, 10.3**
   *
   * For any image container in the listing grid, the container SHALL have
   * an explicit aspect ratio set, resulting in zero CLS contribution from
   * image loading.
   */
  describe('Property 10: Image Layout Stability', () => {
    it('every card configuration always has an explicit aspect ratio class', () => {
      fc.assert(
        fc.property(
          fc.record({
            featured: fc.boolean(),
            isFeatured: fc.boolean(),
            hasImage: fc.boolean(),
            imageError: fc.boolean(),
          }),
          ({ featured, isFeatured, hasImage, imageError }) => {
            const listing = createMockListing({
              primaryImageUrl: hasImage ? 'https://example.com/car.jpg' : null,
              isFeatured,
            });

            const { container, unmount } = render(
              <ListingCard listing={listing} featured={featured} />
            );

            // Trigger error if configured
            if (hasImage && imageError) {
              const img = container.querySelector('img');
              if (img) {
                fireEvent.error(img);
              }
            }

            // The image container must have either aspect-[3/2] or aspect-[16/9]
            const has3x2 = container.querySelector('.aspect-\\[3\\/2\\]') !== null;
            const has16x9 = container.querySelector('.aspect-\\[16\\/9\\]') !== null;

            // Exactly one aspect ratio class must be present
            const hasExplicitAspectRatio = has3x2 || has16x9;
            expect(hasExplicitAspectRatio).toBe(true);

            // Featured cards (either via prop or listing.isFeatured) use 16:9
            const isFeaturedCard = featured || isFeatured;
            if (isFeaturedCard) {
              expect(has16x9).toBe(true);
            } else {
              expect(has3x2).toBe(true);
            }

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
