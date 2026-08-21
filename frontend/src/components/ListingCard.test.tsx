import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('ListingCard interaction states', () => {
  describe('Hover class application', () => {
    it('has hover:-translate-y-1 class for upward lift on hover', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
      expect(card.className).toContain('hover:-translate-y-1');
    });

    it('has hover:shadow-glass-elevated class for elevated shadow on hover', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
      expect(card.className).toContain('hover:shadow-glass-elevated');
    });

    it('has transition-all and duration-300 for smooth hover animation', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
      expect(card.className).toContain('transition-all');
      expect(card.className).toContain('duration-300');
    });
  });

  describe('Reduced motion behavior', () => {
    it('has motion-reduce:transition-none class on the card', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
      expect(card.className).toContain('motion-reduce:transition-none');
    });

    it('has motion-reduce:transform-none class on the card', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
      expect(card.className).toContain('motion-reduce:transform-none');
    });

    it('has motion-reduce classes on the image element', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const img = screen.getByAltText('Porsche 911');
      expect(img.className).toContain('motion-reduce:transition-none');
      expect(img.className).toContain('motion-reduce:transform-none');
    });
  });

  describe('Image error fallback rendering', () => {
    it('renders the image placeholder when image fails to load', () => {
      const listing = createMockListing();
      const { container } = render(<ListingCard listing={listing} />);

      const img = screen.getByAltText('Porsche 911');
      fireEvent.error(img);

      // After error, the placeholder SVG (car silhouette) should render
      const svg = container.querySelector('svg[aria-hidden="true"]');
      expect(svg).not.toBeNull();

      // The broken img element should no longer be rendered
      expect(screen.queryByAltText('Porsche 911')).toBeNull();
    });

    it('renders the placeholder when no image URL is provided', () => {
      const listing = createMockListing({ primaryImageUrl: null });
      const { container } = render(<ListingCard listing={listing} />);

      // Should show accessible placeholder with role="img" and aria-label
      const placeholder = screen.getByRole('img', { name: /image could not be loaded/i });
      expect(placeholder).not.toBeNull();
      const svg = container.querySelector('svg[aria-hidden="true"]');
      expect(svg).not.toBeNull();
    });

    it('placeholder preserves the aspect ratio container', () => {
      const listing = createMockListing({ primaryImageUrl: null });
      const { container } = render(<ListingCard listing={listing} />);

      // The aspect ratio container should still exist
      const aspectContainer = container.querySelector('.aspect-\\[3\\/2\\]');
      expect(aspectContainer).not.toBeNull();
    });

    it('featured card placeholder uses 16:9 aspect ratio', () => {
      const listing = createMockListing({ primaryImageUrl: null });
      const { container } = render(<ListingCard listing={listing} featured={true} />);

      const aspectContainer = container.querySelector('.aspect-\\[16\\/9\\]');
      expect(aspectContainer).not.toBeNull();
    });
  });

  describe('Focus indicator visibility', () => {
    it('card is an anchor element accessible via keyboard navigation', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
      expect(card.tagName).toBe('A');
      expect(card.getAttribute('href')).toBe('/listing/test-123');
    });

    it('card has appropriate aria-label for screen readers', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
      expect(card.getAttribute('aria-label')).toBe('Porsche 911 2023');
    });

    it('favorite button has accessible label', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const favButton = screen.getByRole('button', { name: /add to favorites/i });
      expect(favButton).toBeDefined();
    });

    it('compare button has accessible label', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const compareButton = screen.getByRole('button', { name: /add to compare/i });
      expect(compareButton).toBeDefined();
    });
  });
});
