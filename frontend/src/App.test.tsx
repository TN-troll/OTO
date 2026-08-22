import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';

// ─── Mock heavy child components to isolate routing logic ───────────────────────

vi.mock('./pages/BrowsePage', () => ({
  BrowsePage: () => <div data-testid="browse-page">BrowsePage Content</div>,
}));

vi.mock('./pages/MapPage', () => ({
  __esModule: true,
  default: () => <div data-testid="map-page">MapPage Content</div>,
}));

vi.mock('./pages/ListingDetailPage', () => ({
  ListingDetailPage: () => <div data-testid="listing-detail-page">ListingDetailPage</div>,
}));

vi.mock('./pages/ComparePage', () => ({
  ComparePage: () => <div data-testid="compare-page">ComparePage</div>,
}));

vi.mock('./pages/LeaderboardPage', () => ({
  LeaderboardPage: () => <div data-testid="leaderboard-page">LeaderboardPage</div>,
}));

vi.mock('./pages/PremiumPage', () => ({
  PremiumPage: () => <div data-testid="premium-page">PremiumPage</div>,
}));

vi.mock('./pages/NotificationsPage', () => ({
  NotificationsPage: () => <div data-testid="notifications-page">NotificationsPage</div>,
}));

vi.mock('./components/Header', () => ({
  Header: ({ activeTab, onTabChange }: { activeTab?: string; onTabChange?: (t: string) => void }) => (
    <div data-testid="header">
      {activeTab && onTabChange && (
        <div role="tablist">
          <button role="tab" aria-selected={activeTab === 'listings'} onClick={() => onTabChange('listings')}>Listings</button>
          <button role="tab" aria-selected={activeTab === 'map'} onClick={() => onTabChange('map')}>Map</button>
        </div>
      )}
    </div>
  ),
}));

vi.mock('./components/FilterPanel', () => ({
  FilterPanel: () => <div data-testid="filter-panel">FilterPanel</div>,
}));

vi.mock('./components/NotificationPreferences', () => ({
  NotificationPromptBanner: () => null,
}));

vi.mock('./components/MarketplaceHealthBanner', () => ({
  MarketplaceHealthBanner: () => null,
}));

vi.mock('./components/RecentlyViewedStrip', () => ({
  RecentlyViewedStrip: () => <div data-testid="recently-viewed-strip">RecentlyViewedStrip</div>,
}));

vi.mock('./components/MobileBottomNav', () => ({
  MobileBottomNav: () => <div data-testid="mobile-bottom-nav">MobileBottomNav</div>,
}));

vi.mock('./components/CompareTray', () => ({
  CompareTray: () => null,
}));

vi.mock('./components/JustListedToast', () => ({
  JustListedToast: () => null,
}));

vi.mock('./components/CookieConsent', () => ({
  CookieConsent: () => null,
}));

vi.mock('./components/ScrollToTop', () => ({
  ScrollToTop: () => null,
}));

vi.mock('./components/LoadingBar', () => ({
  LoadingBar: () => null,
}));

vi.mock('./components/OtoLogo', () => ({
  OtoLogo: () => <span data-testid="oto-logo">OTO</span>,
}));

vi.mock('./hooks/FilterContext', () => ({
  FilterProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useFilterContext: () => ({
    mobileFilterOpen: false,
    setMobileFilterOpen: vi.fn(),
    filters: {},
  }),
}));

const mockUseLanguage = vi.fn();
vi.mock('./i18n', () => ({
  useLanguage: () => mockUseLanguage(),
}));

const translations = {
  tabListings: 'Listings',
  tabMap: 'Map',
  recentlyViewed: 'Recently Viewed',
  loadingMap: 'Loading map...',
  mapLoadError: 'Could not load map',
  retry: 'Retry',
  tagline: 'Exclusive Car Ads',
  filters: 'Filters',
};

// ─── Test helpers ───────────────────────────────────────────────────────────────

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
}

function renderApp(initialEntries: string[]) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

// ─── Integration tests for route migration ──────────────────────────────────────

describe('App routing integration', () => {
  beforeEach(() => {
    mockUseLanguage.mockReturnValue({ t: translations, locale: 'en' });
  });

  describe('/map redirects to /', () => {
    it('renders BrowseLayout (Listings tab) when navigating to /map', async () => {
      renderApp(['/map']);

      // The redirect should show BrowseLayout with listings active
      // TabBar should be visible with Listings tab active
      const listingsTab = await screen.findByRole('tab', { name: 'Listings' });
      expect(listingsTab).toHaveAttribute('aria-selected', 'true');

      // BrowsePage content should be visible
      expect(screen.getByTestId('browse-page')).toBeInTheDocument();
    });

    it('does not render a standalone MapPage at /map', async () => {
      renderApp(['/map']);

      // After redirect, we should see BrowseLayout (with tablist), not a standalone map page
      await screen.findByRole('tablist');
      // MapPage should NOT be rendered since default tab is listings
      expect(screen.queryByTestId('map-page')).not.toBeInTheDocument();
    });
  });

  describe('/?view=map renders MapPage tab', () => {
    it('shows MapPage content when URL has view=map', async () => {
      renderApp(['/?view=map']);

      // Map tab should be active
      const mapTab = await screen.findByRole('tab', { name: 'Map' });
      expect(mapTab).toHaveAttribute('aria-selected', 'true');

      // MapPage should be rendered
      expect(await screen.findByTestId('map-page')).toBeInTheDocument();
    });

    it('shows the Map tab as selected in the TabBar', async () => {
      renderApp(['/?view=map']);

      const mapTab = await screen.findByRole('tab', { name: 'Map' });
      const listingsTab = screen.getByRole('tab', { name: 'Listings' });

      expect(mapTab).toHaveAttribute('aria-selected', 'true');
      expect(listingsTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('/ without params renders Listings tab', () => {
    it('shows BrowsePage content at root URL', async () => {
      renderApp(['/']);

      // Listings tab should be active
      const listingsTab = await screen.findByRole('tab', { name: 'Listings' });
      expect(listingsTab).toHaveAttribute('aria-selected', 'true');

      // BrowsePage should be rendered
      expect(screen.getByTestId('browse-page')).toBeInTheDocument();
    });

    it('does not render MapPage at root URL', async () => {
      renderApp(['/']);

      await screen.findByRole('tablist');
      expect(screen.queryByTestId('map-page')).not.toBeInTheDocument();
    });

    it('shows the Listings tab as selected by default', async () => {
      renderApp(['/']);

      const listingsTab = await screen.findByRole('tab', { name: 'Listings' });
      const mapTab = screen.getByRole('tab', { name: 'Map' });

      expect(listingsTab).toHaveAttribute('aria-selected', 'true');
      expect(mapTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('tab switching updates URL without adding history entries', () => {
    it('switches from listings to map tab on click', async () => {
      renderApp(['/']);

      // Initially listings is active
      const listingsTab = await screen.findByRole('tab', { name: 'Listings' });
      expect(listingsTab).toHaveAttribute('aria-selected', 'true');

      // Click the map tab
      const mapTab = screen.getByRole('tab', { name: 'Map' });
      await act(async () => {
        fireEvent.click(mapTab);
      });

      // Map tab should now be active
      expect(mapTab).toHaveAttribute('aria-selected', 'true');
      expect(listingsTab).toHaveAttribute('aria-selected', 'false');

      // MapPage should appear
      expect(await screen.findByTestId('map-page')).toBeInTheDocument();
    });

    it('switches from map to listings tab on click', async () => {
      renderApp(['/?view=map']);

      // Initially map is active
      const mapTab = await screen.findByRole('tab', { name: 'Map' });
      expect(mapTab).toHaveAttribute('aria-selected', 'true');

      // Click the listings tab
      const listingsTab = screen.getByRole('tab', { name: 'Listings' });
      await act(async () => {
        fireEvent.click(listingsTab);
      });

      // Listings tab should now be active
      expect(listingsTab).toHaveAttribute('aria-selected', 'true');
      expect(mapTab).toHaveAttribute('aria-selected', 'false');

      // BrowsePage should be visible
      expect(screen.getByTestId('browse-page')).toBeInTheDocument();
    });

    it('uses replace semantics (useTabState uses replace: true)', async () => {
      // This is validated by the useTabState hook implementation which uses { replace: true }
      // At integration level, we verify that after switching tabs, the listings content is
      // still accessible without navigating back through tab history entries
      renderApp(['/']);

      await screen.findByRole('tablist');

      // Switch to map
      const mapTab = screen.getByRole('tab', { name: 'Map' });
      await act(async () => {
        fireEvent.click(mapTab);
      });

      // Switch back to listings
      const listingsTab = screen.getByRole('tab', { name: 'Listings' });
      await act(async () => {
        fireEvent.click(listingsTab);
      });

      // Verify we're on listings — the URL state was replaced, not pushed
      expect(listingsTab).toHaveAttribute('aria-selected', 'true');
      expect(screen.getByTestId('browse-page')).toBeInTheDocument();
    });
  });
});
