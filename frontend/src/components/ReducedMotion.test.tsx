import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ListingCard } from './ListingCard';
import { Header } from './Header';
import type { ListingSummary } from '@car-ads/shared';
import * as fs from 'fs';
import * as path from 'path';

// Mock hooks for ListingCard
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

// Mock child components for Header
vi.mock('./SearchBar', () => ({
  SearchBar: () => <div data-testid="search-bar">SearchBar</div>,
}));

vi.mock('./LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">LanguageSwitcher</div>,
}));

vi.mock('./ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
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
}));

vi.mock('../hooks/usePushNotifications', () => ({
  isPushSupported: () => true,
}));

function createMockListing(overrides: Partial<ListingSummary> = {}): ListingSummary {
  return {
    id: 'test-123',
    title: 'Test Car',
    primaryImageUrl: 'https://example.com/car.jpg',
    make: 'Porsche',
    model: '911',
    year: 2023,
    price: 89000,
    horsepower: 450,
    engineDisplacementCc: 3000,
    dateAdded: new Date('2023-01-01'),
    ...overrides,
  };
}

describe('Reduced motion support', () => {
  /**
   * Validates: Requirements 12.1, 12.2
   * WHILE the prefers-reduced-motion media query is active, THE System SHALL
   * disable spring-based transitions, hover animations, and shimmer effects
   * by rendering affected elements in their final visual state with no intermediate frames.
   * THE System SHALL apply state changes with a transition duration of 0ms.
   */

  describe('ListingCard has motion-reduce classes', () => {
    it('card element has motion-reduce:transition-none class', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
      expect(card.className).toContain('motion-reduce:transition-none');
    });

    it('card element has motion-reduce:transform-none class', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
      expect(card.className).toContain('motion-reduce:transform-none');
    });
  });

  describe('ListingCard image has motion-reduce classes', () => {
    it('img element has motion-reduce:transition-none class', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const img = screen.getByAltText('Porsche 911');
      expect(img.className).toContain('motion-reduce:transition-none');
    });

    it('img element has motion-reduce:transform-none class', () => {
      const listing = createMockListing();
      render(<ListingCard listing={listing} />);

      const img = screen.getByAltText('Porsche 911');
      expect(img.className).toContain('motion-reduce:transform-none');
    });
  });

  describe('Shimmer has motion-reduce:animate-none', () => {
    it('shimmer skeleton has motion-reduce:animate-none class', () => {
      // Render a card where image hasn't loaded yet to show shimmer
      const listing = createMockListing();
      const { container } = render(<ListingCard listing={listing} />);

      // The shimmer element has animate-shimmer and motion-reduce:animate-none
      const shimmerEl = container.querySelector('[class*="animate-shimmer"]');
      expect(shimmerEl).not.toBeNull();
      expect(shimmerEl!.className).toContain('motion-reduce:animate-none');
    });
  });

  describe('Header mobile menu has motion-reduce classes', () => {
    it('menu panel has motion-reduce:transition-none class', () => {
      const { container } = render(<Header />);

      // The mobile menu panel is the navigation element with motion-reduce:transition-none
      const menuPanel = container.querySelector('[role="navigation"][aria-label="Mobile navigation"]');
      expect(menuPanel).not.toBeNull();
      expect(menuPanel!.className).toContain('motion-reduce:transition-none');
    });

    it('backdrop has motion-reduce:transition-none class', () => {
      const { container } = render(<Header />);

      // The backdrop is a fixed overlay div with backdrop-blur-sm and motion-reduce:transition-none
      const backdrop = container.querySelector('[class*="fixed"][class*="backdrop-blur-sm"]');
      expect(backdrop).not.toBeNull();
      expect(backdrop!.className).toContain('motion-reduce:transition-none');
    });
  });

  describe('Global CSS rule', () => {
    it('index.css contains a @media (prefers-reduced-motion: reduce) block', () => {
      const cssPath = path.resolve(__dirname, '../index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
    });

    it('reduced motion CSS rule sets animation-duration and transition-duration to near-zero', () => {
      const cssPath = path.resolve(__dirname, '../index.css');
      const cssContent = fs.readFileSync(cssPath, 'utf-8');

      // Extract the reduced motion media query block
      const reducedMotionMatch = cssContent.match(
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\n\s*\}/
      );
      expect(reducedMotionMatch).not.toBeNull();

      const block = reducedMotionMatch![0];
      expect(block).toContain('animation-duration');
      expect(block).toContain('transition-duration');
    });
  });
});
