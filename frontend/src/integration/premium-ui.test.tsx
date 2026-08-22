import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DescriptionSection } from '../pages/ListingDetailPage';
import { ListingCard } from '../components/ListingCard';
import { ListingGrid } from '../components/ListingGrid';
import { Header } from '../components/Header';
import type { ListingSummary } from '@car-ads/shared';

/**
 * Integration tests for the Premium UI Overhaul full flow.
 *
 * These tests verify cross-cutting concerns:
 * 1. Language switch triggers correct description display (Req 1.1, 1.2)
 * 2. Dark/light mode toggle applies correct glass surfaces (Req 7.1)
 * 3. Responsive layout transitions between breakpoints (Req 8.1)
 *
 * Since jsdom can't simulate viewport changes or computed styles from Tailwind,
 * we verify the correct CSS classes are present — they take effect in real browsers.
 */

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockUseLanguage = vi.fn();
vi.mock('../i18n', () => ({
  useLanguage: () => mockUseLanguage(),
}));

// Mocks for ListingCard dependencies
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
  getProxyImageUrls: (urls: string[]) => urls,
}));

// Mocks for Header dependencies
vi.mock('../components/SearchBar', () => ({
  SearchBar: () => <div data-testid="search-bar">SearchBar</div>,
}));

vi.mock('../components/LanguageSwitcher', () => ({
  LanguageSwitcher: () => <div data-testid="language-switcher">LanguageSwitcher</div>,
}));

vi.mock('../components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">ThemeToggle</div>,
}));

vi.mock('../components/PremiumBadge', () => ({
  PremiumBadge: () => <div data-testid="premium-badge">PremiumBadge</div>,
}));

vi.mock('../hooks/usePushNotifications', () => ({
  isPushSupported: () => true,
}));

// Mock ListingCard within ListingGrid to isolate grid layout testing
vi.mock('../components/ListingCard', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../components/ListingCard')>();
  return {
    ...actual,
    // Keep the real ListingCard for direct ListingCard tests
  };
});

vi.mock('../components/ListingListItem', () => ({
  ListingListItem: ({ listing }: { listing: ListingSummary }) => (
    <div data-testid={`list-item-${listing.id}`}>{listing.make}</div>
  ),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const enTranslations = {
  adDescription: 'Advertisement',
  tagline: 'The Online Trade Occasions Platform',
  searchPlaceholder: 'Search...',
};

const nlTranslations = {
  adDescription: 'Advertentietekst',
  tagline: 'The Online Trade Occasions Platform',
  searchPlaceholder: 'Zoek...',
};

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

// ─── Test Suite 1: Language Switch Triggers Correct Description Display ───────

describe('Integration: Language switch triggers correct description display', () => {
  /**
   * Validates: Requirements 1.1, 1.2
   * Tests the full flow: DescriptionSection renders different content
   * based on locale and descriptionEn availability.
   */

  it('shows "Translated" badge and English text when locale is EN and valid descriptionEn exists', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'en',
      t: enTranslations,
      setLocale: vi.fn(),
    });

    const { container } = render(
      <DescriptionSection
        description="Dit is een prachtige Porsche 911."
        descriptionEn="This is a beautiful Porsche 911."
      />,
    );

    // "Translated" badge should be visible
    expect(screen.getByText(/Translated/)).toBeInTheDocument();
    // English text should be rendered in the description content
    expect(container.textContent).toContain('This is a beautiful Porsche 911.');
    // No "Original (NL)" badge
    expect(screen.queryByText(/Original \(NL\)/)).not.toBeInTheDocument();
  });

  it('shows "Original (NL)" badge and Dutch text when locale is EN but no valid descriptionEn', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'en',
      t: enTranslations,
      setLocale: vi.fn(),
    });

    const { container } = render(
      <DescriptionSection
        description="Dit is een prachtige Porsche 911."
        descriptionEn={null}
      />,
    );

    // "Original (NL)" badge should be visible
    expect(screen.getByText(/Original \(NL\)/)).toBeInTheDocument();
    // Dutch text should be rendered as fallback
    expect(container.textContent).toContain('Dit is een prachtige Porsche 911.');
    // No "Translated" badge
    expect(screen.queryByText(/Translated/)).not.toBeInTheDocument();
  });

  it('shows no badge and Dutch text when locale is NL', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const { container } = render(
      <DescriptionSection
        description="Dit is een prachtige Porsche 911."
        descriptionEn="This is a beautiful Porsche 911."
      />,
    );

    // No badges should appear in NL mode
    expect(screen.queryByText(/Translated/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Original \(NL\)/)).not.toBeInTheDocument();
    // Dutch text should be shown
    expect(container.textContent).toContain('Dit is een prachtige Porsche 911.');
  });

  it('falls back to Dutch with "Original (NL)" badge when descriptionEn is whitespace-only', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'en',
      t: enTranslations,
      setLocale: vi.fn(),
    });

    const { container } = render(
      <DescriptionSection
        description="Nederlandse tekst hier."
        descriptionEn="   "
      />,
    );

    expect(screen.getByText(/Original \(NL\)/)).toBeInTheDocument();
    expect(container.textContent).toContain('Nederlandse tekst hier.');
  });
});

// ─── Test Suite 2: Dark/Light Mode Toggle Applies Correct Glass Surfaces ─────

describe('Integration: Dark/light mode toggle applies correct glass surfaces', () => {
  /**
   * Validates: Requirement 7.1
   * Glass surfaces must use correct translucent backgrounds and borders
   * for both light and dark modes via Tailwind utility classes.
   */

  it('ListingCard has glass surface classes for light mode (bg-white/60)', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const listing = createMockListing();
    render(<ListingCard listing={listing} />);

    const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
    expect(card.className).toContain('bg-white/60');
  });

  it('ListingCard has glass surface classes for dark mode (dark:bg-white/[0.04])', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const listing = createMockListing();
    render(<ListingCard listing={listing} />);

    const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
    expect(card.className).toContain('dark:bg-white/[0.04]');
  });

  it('ListingCard has light mode glass border (border-white/20)', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const listing = createMockListing();
    render(<ListingCard listing={listing} />);

    const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
    expect(card.className).toContain('border-white/20');
  });

  it('ListingCard has dark mode glass border (dark:border-white/[0.08])', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const listing = createMockListing();
    render(<ListingCard listing={listing} />);

    const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
    expect(card.className).toContain('dark:border-white/[0.08]');
  });

  it('Header has light mode frosted glass background (bg-white/70)', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const { container } = render(<Header />);

    // The header's main glass bar div
    const glassBar = container.querySelector('[class*="bg-white/70"]');
    expect(glassBar).not.toBeNull();
    expect(glassBar!.className).toContain('bg-white/70');
  });

  it('Header has dark mode frosted glass background (dark:bg-black/70)', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const { container } = render(<Header />);

    const glassBar = container.querySelector('[class*="dark:bg-black/70"]');
    expect(glassBar).not.toBeNull();
    expect(glassBar!.className).toContain('dark:bg-black/70');
  });

  it('ListingCard has backdrop-blur-xl for glass effect', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const listing = createMockListing();
    render(<ListingCard listing={listing} />);

    const card = screen.getByRole('link', { name: /Porsche 911 2023/i });
    expect(card.className).toContain('backdrop-blur-xl');
  });
});

// ─── Test Suite 3: Responsive Layout Transitions Between Breakpoints ─────────

describe('Integration: Responsive layout transitions between breakpoints', () => {
  /**
   * Validates: Requirement 8.1
   * The listing grid must have responsive Tailwind classes that produce:
   * - 1 column below 640px (grid-cols-1)
   * - 2 columns at sm breakpoint (sm:grid-cols-2)
   * - 3 columns at lg breakpoint (lg:grid-cols-3)
   * - Appropriate gaps at each breakpoint
   */

  it('ListingGrid has responsive column classes (grid-cols-1, sm:grid-cols-2, lg:grid-cols-3)', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const { container } = render(
      <ListingGrid listings={createMockListings(6)} view="grid" />,
    );

    const gridElement = container.firstElementChild as HTMLElement;
    expect(gridElement.className).toContain('grid-cols-1');
    expect(gridElement.className).toContain('sm:grid-cols-2');
    expect(gridElement.className).toContain('lg:grid-cols-3');
  });

  it('ListingGrid has responsive gap classes (gap-4, sm:gap-5, lg:gap-6)', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const { container } = render(
      <ListingGrid listings={createMockListings(6)} view="grid" />,
    );

    const gridElement = container.firstElementChild as HTMLElement;
    // gap-4 = 16px, sm:gap-5 = 20px, lg:gap-6 = 24px — all exceed 12px minimum
    expect(gridElement.className).toContain('gap-4');
    expect(gridElement.className).toContain('sm:gap-5');
    expect(gridElement.className).toContain('lg:gap-6');
  });

  it('ListingGrid uses grid display class for correct CSS Grid rendering', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const { container } = render(
      <ListingGrid listings={createMockListings(4)} view="grid" />,
    );

    const gridElement = container.firstElementChild as HTMLElement;
    expect(gridElement.className).toContain('grid');
  });

  it('ListingGrid has full-width classes to prevent horizontal overflow', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const { container } = render(
      <ListingGrid listings={createMockListings(4)} view="grid" />,
    );

    const gridElement = container.firstElementChild as HTMLElement;
    expect(gridElement.className).toContain('w-full');
    expect(gridElement.className).toContain('max-w-full');
  });

  it('renders multiple listing cards within the responsive grid', () => {
    mockUseLanguage.mockReturnValue({
      locale: 'nl',
      t: nlTranslations,
      setLocale: vi.fn(),
    });

    const listings = createMockListings(6);
    const { container } = render(
      <ListingGrid listings={listings} view="grid" />,
    );

    const gridElement = container.firstElementChild as HTMLElement;
    // Each listing renders in a wrapper div
    expect(gridElement.children.length).toBe(6);
  });
});
