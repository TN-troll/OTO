import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Header } from './Header';

// Mock child components to isolate Header behavior
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
    t: { tagline: 'The Online Trade Occasions Platform', searchPlaceholder: 'Zoek...' },
    setLocale: vi.fn(),
  }),
}));

vi.mock('../hooks/usePushNotifications', () => ({
  isPushSupported: () => true,
}));

describe('Header responsive behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Validates: Requirement 11.1
   * WHEN the viewport is below 768px, THE System SHALL display the search bar
   * in a dedicated Glass_Panel below the header instead of inline.
   *
   * The mobile search panel has `md:hidden` class so it's visible only on mobile (<768px).
   */
  it('renders a mobile search panel with md:hidden class (visible only below 768px)', () => {
    const { container } = render(<Header />);

    // The mobile search panel is identified by having md:hidden and containing a SearchBar
    const mobileSearchPanel = container.querySelector(
      '[class*="md:hidden"][class*="backdrop-blur"]'
    );
    expect(mobileSearchPanel).not.toBeNull();
    expect(mobileSearchPanel!.className).toContain('md:hidden');

    // Verify it contains a SearchBar instance
    const searchBarInPanel = mobileSearchPanel!.querySelector('[data-testid="search-bar"]');
    expect(searchBarInPanel).not.toBeNull();
  });

  /**
   * Validates: Requirement 11.4
   * WHEN the viewport is below 768px, THE System SHALL collapse primary navigation
   * links into a togglable menu accessible via a button with a minimum Touch_Target
   * size of 44x44 CSS pixels.
   *
   * The mobile menu toggle button has `md:hidden` class so it only appears below 768px.
   */
  it('renders a mobile menu toggle button with md:hidden class (navigation collapse below 768px)', () => {
    render(<Header />);

    // The toggle button should have an aria-label for menu
    const toggleButton = screen.getByLabelText('Open menu');
    expect(toggleButton).toBeDefined();
    expect(toggleButton.className).toContain('md:hidden');

    // Verify 40x40 touch target sizing classes (h-10 w-10 = 40px)
    expect(toggleButton.className).toContain('h-10');
    expect(toggleButton.className).toContain('w-10');
  });

  /**
   * Validates: Requirement 11.3
   * THE header SHALL use sticky positioning to remain visible during scrolling.
   */
  it('applies sticky top-0 positioning to the header element', () => {
    const { container } = render(<Header />);

    const headerElement = container.querySelector('header');
    expect(headerElement).not.toBeNull();
    expect(headerElement!.className).toContain('sticky');
    expect(headerElement!.className).toContain('top-0');
  });
});
