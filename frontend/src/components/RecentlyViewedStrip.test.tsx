import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { RecentlyViewedStrip } from './RecentlyViewedStrip';
import type { Listing } from '@car-ads/shared';

// --- Mocks ---

const mockUseLanguage = vi.fn();
vi.mock('../i18n', () => ({
  useLanguage: () => mockUseLanguage(),
}));

const mockUseRecentlyViewed = vi.fn();
vi.mock('../hooks/useRecentlyViewed', () => ({
  useRecentlyViewed: () => mockUseRecentlyViewed(),
}));

const mockGetListing = vi.fn();
vi.mock('../api/client', () => ({
  api: {
    getListing: (id: string) => mockGetListing(id),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
      this.name = 'ApiError';
    }
  },
}));

vi.mock('../utils/imageProxy', () => ({
  getProxyImageUrl: (url: string) => url,
}));

// --- Helpers ---

function createMockListing(id: string, overrides: Partial<Listing> = {}): Listing {
  return {
    id,
    title: `${overrides.make || 'BMW'} ${overrides.model || 'M3'}`,
    price: overrides.price ?? 45000,
    mileage: 50000,
    year: 2020,
    make: overrides.make || 'BMW',
    model: overrides.model || 'M3',
    engineDisplacementCc: 3000,
    horsepower: 450,
    location: 'Amsterdam',
    sellerType: 'dealer',
    transmissionType: 'manual',
    fuelType: 'petrol',
    bodyType: null,
    imageUrls: [`https://example.com/${id}.jpg`],
    sourceUrls: [],
    soundProfileId: null,
    status: 'active',
    curationCriteria: [],
    dateAdded: new Date(),
    lastVerified: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Listing;
}

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

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const enTranslations = { recentlyViewed: 'Recently Viewed' };
const nlTranslations = { recentlyViewed: 'Laatst bekeken' };

// --- Tests ---

describe('RecentlyViewedStrip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLanguage.mockReturnValue({ t: enTranslations, locale: 'en' });
  });

  describe('empty state', () => {
    it('renders nothing when no recent IDs exist', () => {
      mockUseRecentlyViewed.mockReturnValue({ recentIds: [] });

      const { container } = renderWithProviders(<RecentlyViewedStrip />);

      expect(container.innerHTML).toBe('');
    });

    it('renders nothing when all queries fail', async () => {
      mockUseRecentlyViewed.mockReturnValue({ recentIds: ['id-1', 'id-2'] });
      mockGetListing.mockRejectedValue(new Error('Not found'));

      const { container } = renderWithProviders(<RecentlyViewedStrip />);

      // Wait for queries to settle
      await waitFor(() => {
        expect(container.querySelector('section')).toBeNull();
      });
    });
  });

  describe('max items cap', () => {
    it('shows at most 5 cards by default', async () => {
      const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
      mockUseRecentlyViewed.mockReturnValue({ recentIds: ids });
      mockGetListing.mockImplementation((id: string) =>
        Promise.resolve(createMockListing(id, { make: 'Car', model: id.toUpperCase() }))
      );

      renderWithProviders(<RecentlyViewedStrip />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(5);
      });
    });

    it('respects custom maxItems prop', async () => {
      const ids = ['a', 'b', 'c', 'd', 'e'];
      mockUseRecentlyViewed.mockReturnValue({ recentIds: ids });
      mockGetListing.mockImplementation((id: string) =>
        Promise.resolve(createMockListing(id))
      );

      renderWithProviders(<RecentlyViewedStrip maxItems={3} />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(3);
      });
    });
  });

  describe('ordering', () => {
    it('renders cards in most-recently-viewed-first order', async () => {
      const ids = ['first', 'second', 'third'];
      mockUseRecentlyViewed.mockReturnValue({ recentIds: ids });
      mockGetListing.mockImplementation((id: string) =>
        Promise.resolve(createMockListing(id, { make: 'Car', model: id }))
      );

      renderWithProviders(<RecentlyViewedStrip />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links[0]).toHaveAttribute('href', '/listing/first');
        expect(links[1]).toHaveAttribute('href', '/listing/second');
        expect(links[2]).toHaveAttribute('href', '/listing/third');
      });
    });
  });

  describe('card navigation links', () => {
    it('each card links to /listing/:id', async () => {
      mockUseRecentlyViewed.mockReturnValue({ recentIds: ['abc123'] });
      mockGetListing.mockResolvedValue(createMockListing('abc123', { make: 'Porsche', model: '911' }));

      renderWithProviders(<RecentlyViewedStrip />);

      await waitFor(() => {
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/listing/abc123');
      });
    });

    it('displays make, model, and price on each card', async () => {
      mockUseRecentlyViewed.mockReturnValue({ recentIds: ['x1'] });
      mockGetListing.mockResolvedValue(
        createMockListing('x1', { make: 'Ferrari', model: 'F40', price: 1250000 })
      );

      renderWithProviders(<RecentlyViewedStrip />);

      await waitFor(() => {
        expect(screen.getByText('Ferrari F40')).toBeInTheDocument();
        expect(screen.getByText(/€1,250,000\.00/)).toBeInTheDocument();
      });
    });
  });

  describe('localized heading', () => {
    it('shows English heading when locale is EN', async () => {
      mockUseLanguage.mockReturnValue({ t: enTranslations, locale: 'en' });
      mockUseRecentlyViewed.mockReturnValue({ recentIds: ['id-1'] });
      mockGetListing.mockResolvedValue(createMockListing('id-1'));

      renderWithProviders(<RecentlyViewedStrip />);

      await waitFor(() => {
        expect(screen.getByText('Recently Viewed')).toBeInTheDocument();
      });
    });

    it('shows Dutch heading when locale is NL', async () => {
      mockUseLanguage.mockReturnValue({ t: nlTranslations, locale: 'nl' });
      mockUseRecentlyViewed.mockReturnValue({ recentIds: ['id-1'] });
      mockGetListing.mockResolvedValue(createMockListing('id-1'));

      renderWithProviders(<RecentlyViewedStrip />);

      await waitFor(() => {
        expect(screen.getByText('Laatst bekeken')).toBeInTheDocument();
      });
    });
  });

  describe('failed listing omission', () => {
    it('omits listings that fail to load without showing errors', async () => {
      mockUseRecentlyViewed.mockReturnValue({ recentIds: ['good', 'bad', 'also-good'] });
      mockGetListing.mockImplementation((id: string) => {
        if (id === 'bad') return Promise.reject(new Error('Not found'));
        return Promise.resolve(createMockListing(id, { make: 'Car', model: id }));
      });

      renderWithProviders(<RecentlyViewedStrip />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(2);
        expect(links[0]).toHaveAttribute('href', '/listing/good');
        expect(links[1]).toHaveAttribute('href', '/listing/also-good');
      });
    });
  });
});
