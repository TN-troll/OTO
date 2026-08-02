import { describe, it, expect, vi } from 'vitest';
import { AutoTrackScraper } from './autotrack-scraper.js';

/**
 * HTML fixture simulating an AutoTrack search results page.
 */
const SEARCH_RESULTS_HTML = `
<html>
<body>
  <div data-testid="search-result-item">
    <a href="/auto/detail/ferrari-488-gtb/12345">Ferrari 488 GTB</a>
  </div>
  <div data-testid="search-result-item">
    <a href="/auto/detail/porsche-911-gt3/67890">Porsche 911 GT3</a>
  </div>
  <div data-testid="search-result-item">
    <a href="/auto/detail/bmw-m5/11111">BMW M5 Competition</a>
  </div>
</body>
</html>
`;

/**
 * HTML fixture simulating an AutoTrack individual listing page.
 */
const LISTING_PAGE_HTML = `
<html>
<body>
  <h1 data-testid="listing-title">Ferrari 488 GTB 3.9 V8 Turbo</h1>
  <span data-testid="listing-price">€ 189.900,-</span>
  <span data-testid="listing-make">Ferrari</span>
  <span data-testid="listing-model">488 GTB</span>
  <span data-testid="seller-location">Amsterdam, Noord-Holland</span>
  <span data-testid="seller-type">Dealer</span>

  <dl>
    <dt>Bouwjaar</dt>
    <dd>2017</dd>
    <dt>Kilometerstand</dt>
    <dd>25.000 km</dd>
    <dt>Vermogen</dt>
    <dd>670 pk</dd>
    <dt>Cilinderinhoud</dt>
    <dd>3.9 L</dd>
    <dt>Transmissie</dt>
    <dd>Automaat (DCT)</dd>
    <dt>Brandstof</dt>
    <dd>Benzine</dd>
  </dl>

  <div data-testid="gallery-image"><img src="https://images.autotrack.nl/img1.jpg" /></div>
  <div data-testid="gallery-image"><img src="https://images.autotrack.nl/img2.jpg" /></div>
  <div data-testid="gallery-image"><img src="https://images.autotrack.nl/img3.jpg" /></div>
</body>
</html>
`;

/**
 * HTML fixture for a listing with minimal / missing data.
 */
const MINIMAL_LISTING_HTML = `
<html>
<body>
  <h1>BMW M3</h1>
  <dl>
    <dt>Bouwjaar</dt>
    <dd>2020</dd>
    <dt>Brandstof</dt>
    <dd>Benzine</dd>
  </dl>
</body>
</html>
`;

/**
 * HTML fixture for a removed listing page.
 */
const REMOVED_LISTING_HTML = `
<html>
<body>
  <h1>Advertentie niet gevonden</h1>
  <p>Deze advertentie is niet meer beschikbaar.</p>
</body>
</html>
`;

/**
 * HTML fixture with many images (more than 20).
 */
function generateManyImagesHtml(count: number): string {
  const images = Array.from({ length: count }, (_, i) =>
    `<div data-testid="gallery-image"><img src="https://images.autotrack.nl/img${i + 1}.jpg" /></div>`
  ).join('\n');

  return `
<html>
<body>
  <h1 data-testid="listing-title">Lamborghini Huracán</h1>
  <span data-testid="listing-price">€ 250.000,-</span>
  <dl>
    <dt>Bouwjaar</dt>
    <dd>2022</dd>
    <dt>Vermogen</dt>
    <dd>640 pk</dd>
  </dl>
  ${images}
</body>
</html>
`;
}

/**
 * HTML fixture with kW power format.
 */
const KW_LISTING_HTML = `
<html>
<body>
  <h1 data-testid="listing-title">Mercedes-AMG GT 63 S</h1>
  <span data-testid="listing-price">€ 165.000,-</span>
  <dl>
    <dt>Bouwjaar</dt>
    <dd>2021</dd>
    <dt>Vermogen</dt>
    <dd>470 kW</dd>
    <dt>Cilinderinhoud</dt>
    <dd>3982 cc</dd>
    <dt>Transmissie</dt>
    <dd>Handgeschakeld</dd>
    <dt>Brandstof</dt>
    <dd>Diesel</dd>
    <dt>Kilometerstand</dt>
    <dd>45000 km</dd>
  </dl>
</body>
</html>
`;

describe('AutoTrackScraper', () => {
  describe('getMarketplaceId', () => {
    it('returns "autotrack"', () => {
      const scraper = new AutoTrackScraper();
      expect(scraper.getMarketplaceId()).toBe('autotrack');
    });
  });

  describe('parseSearchResults', () => {
    it('extracts listing URLs from search page HTML', () => {
      const scraper = new AutoTrackScraper({ baseUrl: 'https://www.autotrack.nl' });
      const urls = scraper.parseSearchResults(SEARCH_RESULTS_HTML);

      expect(urls).toHaveLength(3);
      expect(urls[0]).toBe('https://www.autotrack.nl/auto/detail/ferrari-488-gtb/12345');
      expect(urls[1]).toBe('https://www.autotrack.nl/auto/detail/porsche-911-gt3/67890');
      expect(urls[2]).toBe('https://www.autotrack.nl/auto/detail/bmw-m5/11111');
    });

    it('returns empty array for HTML with no listings', () => {
      const scraper = new AutoTrackScraper();
      const urls = scraper.parseSearchResults('<html><body><p>No results</p></body></html>');
      expect(urls).toHaveLength(0);
    });

    it('deduplicates URLs', () => {
      const html = `
        <html><body>
          <div data-testid="search-result-item"><a href="/auto/detail/car/123">Car</a></div>
          <div data-testid="search-result-item"><a href="/auto/detail/car/123">Car</a></div>
        </body></html>
      `;
      const scraper = new AutoTrackScraper({ baseUrl: 'https://www.autotrack.nl' });
      const urls = scraper.parseSearchResults(html);
      expect(urls).toHaveLength(1);
    });
  });

  describe('parseListingPage', () => {
    it('parses a full listing page with all fields', () => {
      const scraper = new AutoTrackScraper({ baseUrl: 'https://www.autotrack.nl' });
      const ad = scraper.parseListingPage(LISTING_PAGE_HTML, 'https://www.autotrack.nl/auto/detail/ferrari-488-gtb/12345');

      expect(ad).not.toBeNull();
      expect(ad!.title).toBe('Ferrari 488 GTB 3.9 V8 Turbo');
      expect(ad!.price).toBe(189900);
      expect(ad!.year).toBe(2017);
      expect(ad!.mileage).toBe(25000);
      expect(ad!.make).toBe('Ferrari');
      expect(ad!.model).toBe('488 GTB');
      expect(ad!.horsepower).toBe(670);
      expect(ad!.engineDisplacementCc).toBe(3900);
      expect(ad!.location).toBe('Amsterdam, Noord-Holland');
      expect(ad!.sellerType).toBe('dealer');
      expect(ad!.transmissionType).toBe('automatic');
      expect(ad!.fuelType).toBe('petrol');
      expect(ad!.sourceUrl).toBe('https://www.autotrack.nl/auto/detail/ferrari-488-gtb/12345');
      expect(ad!.imageUrls).toHaveLength(3);
      expect(ad!.imageUrls[0]).toBe('https://images.autotrack.nl/img1.jpg');
    });

    it('parses a minimal listing with missing optional fields', () => {
      const scraper = new AutoTrackScraper();
      const ad = scraper.parseListingPage(MINIMAL_LISTING_HTML, 'https://www.autotrack.nl/auto/detail/bmw-m3/999');

      expect(ad).not.toBeNull();
      expect(ad!.title).toBe('BMW M3');
      expect(ad!.year).toBe(2020);
      expect(ad!.fuelType).toBe('petrol');
      // Optional fields default to null
      expect(ad!.price).toBeNull();
      expect(ad!.mileage).toBeNull();
      expect(ad!.horsepower).toBeNull();
      expect(ad!.engineDisplacementCc).toBeNull();
      expect(ad!.location).toBeNull();
      expect(ad!.sellerType).toBeNull();
      expect(ad!.transmissionType).toBeNull();
      expect(ad!.imageUrls).toHaveLength(0);
    });

    it('returns null for a page with no title', () => {
      const scraper = new AutoTrackScraper();
      const ad = scraper.parseListingPage('<html><body></body></html>', 'https://example.com');
      expect(ad).toBeNull();
    });

    it('limits images to 20 per listing', () => {
      const scraper = new AutoTrackScraper();
      const html = generateManyImagesHtml(30);
      const ad = scraper.parseListingPage(html, 'https://www.autotrack.nl/auto/detail/lambo/1');

      expect(ad).not.toBeNull();
      expect(ad!.imageUrls.length).toBeLessThanOrEqual(20);
      expect(ad!.imageUrls).toHaveLength(20);
    });

    it('parses kW power format correctly', () => {
      const scraper = new AutoTrackScraper();
      const ad = scraper.parseListingPage(KW_LISTING_HTML, 'https://www.autotrack.nl/auto/detail/merc/1');

      expect(ad).not.toBeNull();
      // 470 kW * 1.36 ≈ 639 HP
      expect(ad!.horsepower).toBe(639);
    });

    it('parses cc displacement format', () => {
      const scraper = new AutoTrackScraper();
      const ad = scraper.parseListingPage(KW_LISTING_HTML, 'https://www.autotrack.nl/auto/detail/merc/1');

      expect(ad).not.toBeNull();
      expect(ad!.engineDisplacementCc).toBe(3982);
    });

    it('parses manual transmission', () => {
      const scraper = new AutoTrackScraper();
      const ad = scraper.parseListingPage(KW_LISTING_HTML, 'https://www.autotrack.nl/auto/detail/merc/1');

      expect(ad).not.toBeNull();
      expect(ad!.transmissionType).toBe('manual');
    });

    it('parses diesel fuel type', () => {
      const scraper = new AutoTrackScraper();
      const ad = scraper.parseListingPage(KW_LISTING_HTML, 'https://www.autotrack.nl/auto/detail/merc/1');

      expect(ad).not.toBeNull();
      expect(ad!.fuelType).toBe('diesel');
    });

    it('parses mileage without dot separator', () => {
      const scraper = new AutoTrackScraper();
      const ad = scraper.parseListingPage(KW_LISTING_HTML, 'https://www.autotrack.nl/auto/detail/merc/1');

      expect(ad).not.toBeNull();
      expect(ad!.mileage).toBe(45000);
    });

    it('extracts make and model from title as fallback', () => {
      const html = `
        <html><body>
          <h1>Porsche 911 GT3 RS</h1>
        </body></html>
      `;
      const scraper = new AutoTrackScraper();
      const ad = scraper.parseListingPage(html, 'https://example.com');

      expect(ad).not.toBeNull();
      expect(ad!.make).toBe('Porsche');
      expect(ad!.model).toBe('911 GT3 RS');
    });
  });

  describe('verifyListing', () => {
    it('returns "active" for a successful response with listing content', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve('<html><body><h1>Ferrari 488</h1></body></html>'),
      });

      const scraper = new AutoTrackScraper({ fetchFn: mockFetch as unknown as typeof fetch });
      const status = await scraper.verifyListing('https://www.autotrack.nl/auto/detail/ferrari/123');

      expect(status).toBe('active');
    });

    it('returns "inactive" for a 404 response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        text: () => Promise.resolve(''),
      });

      const scraper = new AutoTrackScraper({ fetchFn: mockFetch as unknown as typeof fetch });
      const status = await scraper.verifyListing('https://www.autotrack.nl/auto/detail/ferrari/123');

      expect(status).toBe('inactive');
    });

    it('returns "inactive" for a 410 Gone response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 410,
        text: () => Promise.resolve(''),
      });

      const scraper = new AutoTrackScraper({ fetchFn: mockFetch as unknown as typeof fetch });
      const status = await scraper.verifyListing('https://www.autotrack.nl/auto/detail/ferrari/123');

      expect(status).toBe('inactive');
    });

    it('returns "inactive" when page content indicates ad is removed', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(REMOVED_LISTING_HTML),
      });

      const scraper = new AutoTrackScraper({ fetchFn: mockFetch as unknown as typeof fetch });
      const status = await scraper.verifyListing('https://www.autotrack.nl/auto/detail/ferrari/123');

      expect(status).toBe('inactive');
    });

    it('returns "unknown" on network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const scraper = new AutoTrackScraper({ fetchFn: mockFetch as unknown as typeof fetch });
      const status = await scraper.verifyListing('https://www.autotrack.nl/auto/detail/ferrari/123');

      expect(status).toBe('unknown');
    });

    it('returns "unknown" for a 500 server error', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(''),
      });

      const scraper = new AutoTrackScraper({ fetchFn: mockFetch as unknown as typeof fetch });
      const status = await scraper.verifyListing('https://www.autotrack.nl/auto/detail/ferrari/123');

      expect(status).toBe('unknown');
    });
  });

  describe('collectListings', () => {
    it('fetches search pages and parses individual listings', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(SEARCH_RESULTS_HTML),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(LISTING_PAGE_HTML),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(MINIMAL_LISTING_HTML),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(LISTING_PAGE_HTML),
        });

      const scraper = new AutoTrackScraper({
        baseUrl: 'https://www.autotrack.nl',
        maxPages: 1,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const listings = await scraper.collectListings();

      // 3 listing URLs from search, all fetched
      expect(mockFetch).toHaveBeenCalledTimes(4); // 1 search page + 3 listing pages
      expect(listings.length).toBeGreaterThanOrEqual(2);
    });

    it('returns empty array when search page fails', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve(''),
      });

      const scraper = new AutoTrackScraper({
        maxPages: 1,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const listings = await scraper.collectListings();
      expect(listings).toHaveLength(0);
    });

    it('skips individual listings that fail to fetch', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(SEARCH_RESULTS_HTML),
        })
        .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('') })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(LISTING_PAGE_HTML),
        })
        .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve('') });

      const scraper = new AutoTrackScraper({
        baseUrl: 'https://www.autotrack.nl',
        maxPages: 1,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const listings = await scraper.collectListings();
      // Only the successful listing should be returned
      expect(listings).toHaveLength(1);
      expect(listings[0].title).toBe('Ferrari 488 GTB 3.9 V8 Turbo');
    });

    it('stops pagination when search page has no results', async () => {
      const mockFetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(SEARCH_RESULTS_HTML),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(LISTING_PAGE_HTML),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(LISTING_PAGE_HTML),
        })
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve(LISTING_PAGE_HTML),
        })
        // Second search page has no results
        .mockResolvedValueOnce({
          ok: true,
          text: () => Promise.resolve('<html><body><p>No results</p></body></html>'),
        });

      const scraper = new AutoTrackScraper({
        baseUrl: 'https://www.autotrack.nl',
        maxPages: 3,
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const listings = await scraper.collectListings();
      // Should have listings from page 1 only (3 items), then stop
      expect(listings).toHaveLength(3);
      // Should not have fetched a third search page
      expect(mockFetch).toHaveBeenCalledTimes(5); // 1 search + 3 listings + 1 empty search
    });
  });
});
