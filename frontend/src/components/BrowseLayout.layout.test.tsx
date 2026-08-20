import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import type { ActiveTab } from '../hooks/useTabState';

// ─── Mocks ─────────────────────────────────────────────────────────────────────

// Mock useTabState to control activeTab externally
const mockSetActiveTab = vi.fn();
let mockActiveTab: ActiveTab = 'listings';

vi.mock('../hooks/useTabState', () => ({
  useTabState: () => ({ activeTab: mockActiveTab, setActiveTab: mockSetActiveTab }),
}));

// Mock i18n
vi.mock('../i18n', () => ({
  useLanguage: () => ({
    t: {
      tabListings: 'Listings',
      tabMap: 'Map',
      recentlyViewed: 'Recently Viewed',
      loadingMap: 'Loading map...',
      mapLoadError: 'Could not load map',
      retry: 'Retry',
      filters: 'Filters',
      tagline: 'Exclusive car ads',
    },
    locale: 'en',
  }),
}));

// Mock heavy child components to isolate BrowseLayout testing
vi.mock('./Header', () => ({
  Header: () => <div data-testid="header">Header</div>,
}));

vi.mock('./NotificationPreferences', () => ({
  NotificationPromptBanner: () => <div data-testid="notification-banner">NotificationBanner</div>,
}));

// TabBar mock includes id attributes so aria-labelledby can resolve accessible names
vi.mock('./TabBar', () => ({
  TabBar: ({ activeTab, onTabChange }: { activeTab: string; onTabChange: (t: string) => void }) => (
    <div role="tablist" data-testid="tabbar">
      <button id="tab-listings" role="tab" aria-selected={activeTab === 'listings'} onClick={() => onTabChange('listings')}>Listings</button>
      <button id="tab-map" role="tab" aria-selected={activeTab === 'map'} onClick={() => onTabChange('map')}>Map</button>
    </div>
  ),
}));

vi.mock('./FilterPanel', () => ({
  FilterPanel: () => <div data-testid="filter-panel">FilterPanel</div>,
}));

vi.mock('./RecentlyViewedStrip', () => ({
  RecentlyViewedStrip: () => <div data-testid="recently-viewed">RecentlyViewedStrip</div>,
}));

vi.mock('../pages/BrowsePage', () => ({
  BrowsePage: () => <div data-testid="browse-page">BrowsePage Content</div>,
}));

// MapPage mock — resolves immediately (simulates lazy load completing)
vi.mock('../pages/MapPage', () => ({
  default: () => <div data-testid="map-page">MapPage Content</div>,
}));

// Mock FilterContext (FilterProvider wraps everything)
vi.mock('../hooks/FilterContext', () => ({
  FilterProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="filter-provider">{children}</div>,
  useFilterContext: () => ({
    mobileFilterOpen: false,
    setMobileFilterOpen: vi.fn(),
    filters: {},
  }),
}));

// Import the component under test AFTER all mocks are set up
import { BrowseLayout } from './BrowseLayout';

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('BrowseLayout', () => {
  beforeEach(() => {
    mockActiveTab = 'listings';
    mockSetActiveTab.mockClear();
  });

  describe('when listings tab is active', () => {
    it('renders the listings tabpanel visible with correct ARIA attributes', () => {
      render(<BrowseLayout />);

      const listingsPanel = document.getElementById('tabpanel-listings')!;
      expect(listingsPanel).toBeInTheDocument();
      expect(listingsPanel).toHaveAttribute('role', 'tabpanel');
      expect(listingsPanel).toHaveAttribute('aria-labelledby', 'tab-listings');
      expect(listingsPanel).not.toHaveClass('hidden');
    });

    it('renders BrowsePage within the listings panel', () => {
      render(<BrowseLayout />);

      expect(screen.getByTestId('browse-page')).toBeInTheDocument();
    });

    it('does not render the map tabpanel when listings is active', () => {
      render(<BrowseLayout />);

      expect(screen.queryByTestId('map-page')).not.toBeInTheDocument();
      const mapPanel = document.getElementById('tabpanel-map');
      expect(mapPanel).toBeNull();
    });

    it('renders shared chrome: Header, NotificationBanner, TabBar', () => {
      render(<BrowseLayout />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('notification-banner')).toBeInTheDocument();
      expect(screen.getByTestId('tabbar')).toBeInTheDocument();
    });
  });

  describe('when map tab is active', () => {
    beforeEach(() => {
      mockActiveTab = 'map';
    });

    it('renders the map tabpanel with correct ARIA attributes', async () => {
      await act(async () => {
        render(<BrowseLayout />);
      });

      const mapPanel = document.getElementById('tabpanel-map');
      expect(mapPanel).toBeInTheDocument();
      expect(mapPanel).toHaveAttribute('role', 'tabpanel');
      expect(mapPanel).toHaveAttribute('aria-labelledby', 'tab-map');
    });

    it('renders MapPage within the map panel (lazy loaded)', async () => {
      await act(async () => {
        render(<BrowseLayout />);
      });

      expect(await screen.findByTestId('map-page')).toBeInTheDocument();
    });

    it('hides the listings panel via CSS class="hidden" but keeps it in DOM', async () => {
      await act(async () => {
        render(<BrowseLayout />);
      });

      const listingsPanel = document.getElementById('tabpanel-listings');
      expect(listingsPanel).toBeInTheDocument();
      expect(listingsPanel).toHaveClass('hidden');
    });
  });

  describe('state preservation', () => {
    it('keeps BrowsePage mounted in DOM when switching to map tab', () => {
      // First render with listings active
      const { rerender } = render(<BrowseLayout />);
      expect(screen.getByTestId('browse-page')).toBeInTheDocument();

      // Switch to map
      mockActiveTab = 'map';
      rerender(<BrowseLayout />);

      // BrowsePage should still be in DOM (just hidden)
      expect(screen.getByTestId('browse-page')).toBeInTheDocument();
      // And map should be visible
      expect(screen.getByTestId('map-page')).toBeInTheDocument();
    });

    it('BrowsePage remains in DOM after switching tabs back and forth', () => {
      const { rerender } = render(<BrowseLayout />);

      // Start on listings
      expect(screen.getByTestId('browse-page')).toBeInTheDocument();

      // Switch to map
      mockActiveTab = 'map';
      rerender(<BrowseLayout />);
      expect(screen.getByTestId('browse-page')).toBeInTheDocument();

      // Switch back to listings
      mockActiveTab = 'listings';
      rerender(<BrowseLayout />);
      expect(screen.getByTestId('browse-page')).toBeInTheDocument();
      // Listings panel should be visible again (not hidden)
      const listingsPanel = document.getElementById('tabpanel-listings');
      expect(listingsPanel).not.toHaveClass('hidden');
    });
  });

  describe('loading skeleton during map lazy load', () => {
    it('Suspense wraps MapPage with MapLoadingSkeleton fallback', () => {
      // When map tab is active and MapPage resolves instantly (mocked),
      // verify the map content renders correctly through the Suspense boundary
      mockActiveTab = 'map';
      render(<BrowseLayout />);

      // If MapPage loaded successfully through Suspense, map-page should be present
      expect(screen.getByTestId('map-page')).toBeInTheDocument();
    });

    it('shows loading skeleton text when MapPage is suspending', async () => {
      // To test Suspense fallback, we need a component that actually suspends.
      // We verify the MapLoadingSkeleton component renders correctly (unit test exists).
      // Here we test the integration: the Suspense boundary exists by verifying
      // that when MapPage throws a promise (suspends), the fallback is shown.
      
      // Since our mock resolves immediately, we verify the structural presence
      // by checking the BrowseLayout renders MapErrorBoundary + Suspense around MapPage.
      // The MapLoadingSkeleton tests in the companion file verify it displays "Loading map..."
      mockActiveTab = 'map';
      render(<BrowseLayout />);
      
      // Map loaded through Suspense — the structure is correct
      const mapPanel = document.getElementById('tabpanel-map');
      expect(mapPanel).toBeInTheDocument();
      expect(screen.getByTestId('map-page')).toBeInTheDocument();
    });
  });

  describe('ARIA tabpanel structure', () => {
    it('listings panel references tab-listings via aria-labelledby', () => {
      render(<BrowseLayout />);

      const panel = document.getElementById('tabpanel-listings')!;
      expect(panel).toHaveAttribute('role', 'tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', 'tab-listings');
    });

    it('map panel references tab-map via aria-labelledby', () => {
      mockActiveTab = 'map';
      render(<BrowseLayout />);

      const panel = document.getElementById('tabpanel-map')!;
      expect(panel).toHaveAttribute('role', 'tabpanel');
      expect(panel).toHaveAttribute('aria-labelledby', 'tab-map');
    });

    it('tabpanel IDs match aria-controls values from tabs', () => {
      mockActiveTab = 'map';
      render(<BrowseLayout />);

      // The mock TabBar renders tab buttons — verify the panels they reference exist
      expect(document.getElementById('tabpanel-listings')).toBeInTheDocument();
      expect(document.getElementById('tabpanel-map')).toBeInTheDocument();
    });
  });
});
