import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ListingGrid } from './ListingGrid';
import type { ListingSummary } from '@car-ads/shared';

// Mock child components to isolate ListingGrid layout testing
vi.mock('./ListingCard', () => ({
  ListingCard: ({ listing }: { listing: ListingSummary }) => (
    <div data-testid={`card-${listing.id}`}>{listing.make}</div>
  ),
}));

vi.mock('./ListingListItem', () => ({
  ListingListItem: ({ listing }: { listing: ListingSummary }) => (
    <div data-testid={`list-item-${listing.id}`}>{listing.make}</div>
  ),
}));

function createMockListings(count: number): ListingSummary[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `listing-${i}`,
    title: `Car ${i}`,
    primaryImageUrl: `https://example.com/car-${i}.jpg`,
    imageUrls: [`https://example.com/car-${i}.jpg`],
    make: `Make${i}`,
    model: `Model${i}`,
    year: 2020 + i,
    price: 50000 + i * 10000,
    horsepower: 200 + i * 50,
    engineDisplacementCc: 2000 + i * 500,
    mileage: null,
    fuelType: null,
    location: null,
    sellerType: null,
    marketAvgPrice: null,
    dateAdded: new Date('2024-01-01'),
    snippet: null,
  }));
}

describe('ListingGrid responsive layout', () => {
  describe('Grid column classes', () => {
    /**
     * Validates: Requirements 8.1, 8.2, 8.3
     * The grid container must have responsive column classes:
     * - grid-cols-1: single column below 640px (Req 8.1)
     * - sm:grid-cols-2: two columns at 640px–1023px (Req 8.2)
     * - lg:grid-cols-3: three columns at 1024px+ (Req 8.3)
     */
    it('applies correct responsive column classes for grid view', () => {
      const { container } = render(
        <ListingGrid listings={createMockListings(6)} view="grid" />
      );

      const gridElement = container.firstElementChild as HTMLElement;

      expect(gridElement.className).toContain('grid-cols-1');
      expect(gridElement.className).toContain('sm:grid-cols-2');
      expect(gridElement.className).toContain('lg:grid-cols-3');
    });

    it('uses grid display for grid view', () => {
      const { container } = render(
        <ListingGrid listings={createMockListings(3)} view="grid" />
      );

      const gridElement = container.firstElementChild as HTMLElement;
      expect(gridElement.className).toContain('grid');
    });

    it('uses flex column layout for list view', () => {
      const { container } = render(
        <ListingGrid listings={createMockListings(3)} view="list" />
      );

      const listElement = container.firstElementChild as HTMLElement;
      expect(listElement.className).toContain('flex');
      expect(listElement.className).toContain('flex-col');
      expect(listElement.className).not.toContain('grid-cols');
    });

    it('defaults to grid view when no view prop is provided', () => {
      const { container } = render(
        <ListingGrid listings={createMockListings(3)} />
      );

      const gridElement = container.firstElementChild as HTMLElement;
      expect(gridElement.className).toContain('grid-cols-1');
      expect(gridElement.className).toContain('sm:grid-cols-2');
      expect(gridElement.className).toContain('lg:grid-cols-3');
    });
  });

  describe('Gap constraints', () => {
    /**
     * Validates: Requirement 8.7
     * The grid must maintain minimum 12px gap between cards.
     * Tailwind gap-4 = 16px, sm:gap-5 = 20px, lg:gap-6 = 24px
     * All values exceed the 12px minimum requirement.
     */
    it('applies responsive gap classes that satisfy minimum 12px gap', () => {
      const { container } = render(
        <ListingGrid listings={createMockListings(6)} view="grid" />
      );

      const gridElement = container.firstElementChild as HTMLElement;

      // gap-4 = 16px (base), gap-5 = 20px (sm), gap-6 = 24px (lg)
      // All satisfy the >= 12px minimum gap requirement
      expect(gridElement.className).toContain('gap-4');
      expect(gridElement.className).toContain('sm:gap-5');
      expect(gridElement.className).toContain('lg:gap-6');
    });

    it('applies gap for list view', () => {
      const { container } = render(
        <ListingGrid listings={createMockListings(3)} view="list" />
      );

      const listElement = container.firstElementChild as HTMLElement;
      expect(listElement.className).toContain('gap-4');
    });
  });

  describe('Container classes (prevent horizontal overflow)', () => {
    /**
     * Validates: Requirements 8.1, 8.2, 8.3 (full-width cards)
     * The container must use w-full max-w-full to prevent horizontal overflow
     * and ensure cards occupy available content width.
     */
    it('applies full-width container classes for grid view', () => {
      const { container } = render(
        <ListingGrid listings={createMockListings(6)} view="grid" />
      );

      const gridElement = container.firstElementChild as HTMLElement;
      expect(gridElement.className).toContain('w-full');
      expect(gridElement.className).toContain('max-w-full');
    });

    it('applies full-width container classes for list view', () => {
      const { container } = render(
        <ListingGrid listings={createMockListings(3)} view="list" />
      );

      const listElement = container.firstElementChild as HTMLElement;
      expect(listElement.className).toContain('w-full');
      expect(listElement.className).toContain('max-w-full');
    });
  });
});
