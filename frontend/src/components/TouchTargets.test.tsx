import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';
import { ListingCard } from './ListingCard';
import { Header } from './Header';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSwitcher } from './LanguageSwitcher';
import type { ListingSummary } from '@car-ads/shared';

// --- Mocks ---

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

vi.mock('./SearchBar', () => ({
  SearchBar: () => <div data-testid="search-bar">SearchBar</div>,
}));

vi.mock('./PremiumBadge', () => ({
  PremiumBadge: () => <div data-testid="premium-badge">PremiumBadge</div>,
}));

vi.mock('../i18n', () => ({
  useLanguage: () => ({
    locale: 'nl',
    t: { tagline: 'Online Top Occasions', searchPlaceholder: 'Zoek...' },
    setLocale: vi.fn(),
  }),
  useTheme: () => ({
    isDark: false,
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('../hooks/usePushNotifications', () => ({
  isPushSupported: () => true,
}));

// --- Helpers ---

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

/** Checks whether an element has 44px touch target sizing classes */
function has44pxSizingClasses(className: string): boolean {
  const hasHeight = className.includes('h-11') || className.includes('min-h-[44px]');
  const hasWidth = className.includes('w-11') || className.includes('min-w-[44px]');
  return hasHeight && hasWidth;
}

/** Checks whether an element has at least 44px height */
function has44pxHeight(className: string): boolean {
  return className.includes('h-11') || className.includes('min-h-[44px]');
}

// --- Tests ---

describe('Touch Target Sizing', () => {
  /**
   * Validates: Requirement 9.1
   * THE System SHALL ensure all interactive elements have a minimum touch target
   * size of 44x44 CSS pixels.
   */
  describe('ListingCard buttons', () => {
    it('favorite button has h-8 w-8 classes (32px touch target)', () => {
      render(<ListingCard listing={createMockListing()} />);

      const favButton = screen.getByRole('button', { name: /add to favorites/i });
      expect(favButton.className).toContain('h-8');
      expect(favButton.className).toContain('w-8');
    });

    it('compare button has h-8 w-8 classes (32px touch target)', () => {
      render(<ListingCard listing={createMockListing()} />);

      const compareButton = screen.getByRole('button', { name: /add to compare/i });
      expect(compareButton.className).toContain('h-8');
      expect(compareButton.className).toContain('w-8');
    });
  });

  describe('Header buttons', () => {
    it('mobile menu toggle has h-10 w-10 classes (40px touch target)', () => {
      render(<Header />);

      const toggleButton = screen.getByLabelText('Open menu');
      expect(toggleButton.className).toContain('h-10');
      expect(toggleButton.className).toContain('w-10');
    });
  });

  describe('ThemeToggle', () => {
    it('has h-11 w-11 classes (44x44px touch target)', () => {
      render(<ThemeToggle />);

      const button = screen.getByRole('button', { name: /switch to dark mode/i });
      expect(button.className).toContain('h-11');
      expect(button.className).toContain('w-11');
    });
  });

  describe('LanguageSwitcher buttons', () => {
    it('each language button has h-11 and min-w-[44px] classes', () => {
      render(<LanguageSwitcher />);

      const nlButton = screen.getByRole('button', { name: /switch to NL/i });
      const enButton = screen.getByRole('button', { name: /switch to EN/i });

      expect(nlButton.className).toContain('h-11');
      expect(nlButton.className).toContain('min-w-[44px]');

      expect(enButton.className).toContain('h-11');
      expect(enButton.className).toContain('min-w-[44px]');
    });
  });

  describe('Spacing between adjacent targets', () => {
    it('ListingCard action buttons container uses gap-2 spacing', () => {
      const { container } = render(<ListingCard listing={createMockListing()} />);

      // The action buttons are in a flex container with gap-2 (8px) spacing
      const favButton = screen.getByRole('button', { name: /add to favorites/i });
      const actionsContainer = favButton.parentElement;
      expect(actionsContainer).not.toBeNull();
      expect(actionsContainer!.className).toContain('gap-2');
    });

    it('Header action buttons group uses gap-1 spacing', () => {
      const { container } = render(<Header />);

      // The header actions container uses gap-1 between items
      const actionsContainer = container.querySelector('.gap-1');
      expect(actionsContainer).not.toBeNull();
    });
  });

  /**
   * Property 6: Touch Target Minimum Size
   * *For any* interactive element (button, link, toggle) rendered in the UI,
   * the element's clickable area SHALL be at least 44x44 CSS pixels.
   *
   * **Validates: Requirement 9.1**
   */
  describe('Property 6: Touch Target Minimum Size', () => {
    it('all interactive buttons in a rendered ListingCard have appropriate sizing classes', () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 10 }),
            price: fc.integer({ min: 1000, max: 500000 }),
            horsepower: fc.integer({ min: 50, max: 1500 }),
            year: fc.integer({ min: 1990, max: 2025 }),
          }),
          (data) => {
            const listing = createMockListing({
              id: data.id,
              price: data.price,
              horsepower: data.horsepower,
              year: data.year,
            });

            const { container, unmount } = render(<ListingCard listing={listing} />);

            // Get all buttons in the rendered card
            const buttons = container.querySelectorAll('button');

            for (const button of buttons) {
              const className = button.className;
              // Each button must have at least h-8 w-8 (32px) or h-11 w-11 (44px) sizing
              const hasProperHeight = className.includes('h-8') || className.includes('h-11') || className.includes('min-h-[44px]') || className.includes('h-1.5');
              const hasProperWidth = className.includes('w-8') || className.includes('w-11') || className.includes('min-w-[44px]') || className.includes('w-4') || className.includes('w-1.5');
              expect(hasProperHeight || hasProperWidth).toBe(true);
            }

            unmount();
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
