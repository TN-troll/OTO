import { chromium, type Browser, type Page } from 'playwright';
import type { RawAdvertisement, ListingStatus, SellerType, TransmissionType, FuelType, BodyType } from '@car-ads/shared';
import { MAX_IMAGES_PER_LISTING } from '@car-ads/shared';
import type { MarketplaceScraper } from '../marketplace-scraper.js';

/**
 * CSS selectors for AutoScout24.nl listing pages.
 * Grouped here for maintainability — update these when the site structure changes.
 */
export const SELECTORS = {
  /** Search results page */
  searchResults: {
    listingCard: '[data-testid="listing-entry"], article.cldt-summary-full-item',
    listingLink: 'a[href*="/aanbod/"]',
    nextPage: '[data-testid="pagination-step-forwards"], a[aria-label="Volgende pagina"]',
  },
  /** Individual listing detail page */
  detail: {
    title: 'h1, [data-testid="listing-title"]',
    price: '[data-testid="price"], .PriceInfo_price__XU0aF, span[class*="Price"]',
    gallery: '[data-testid="gallery"] img, .gallery-picture img, picture source',
    specsTable: '[data-testid="key-value-list"], .VehicleOverview_itemContainer__XSLWi, dl.DataGrid',
    location: '[data-testid="seller-location"], .SellerInfo_address__leRMu',
    sellerType: '[data-testid="seller-type"], .SellerInfo_type__WEupY',
    removedIndicator: '[data-testid="listing-removed"], .Error_container__tpOHg, h1:has-text("niet gevonden")',
  },
} as const;

/**
 * Configuration for the AutoScout24 NL scraper.
 */
export interface AutoScout24ScraperConfig {
  /** Base URL for AutoScout24 NL (default: https://www.autoscout24.nl) */
  baseUrl: string;
  /** Maximum number of search result pages to scrape per collection run */
  maxSearchPages: number;
  /** Navigation timeout in milliseconds */
  navigationTimeoutMs: number;
  /** Delay between page navigations in milliseconds (rate limiting) */
  pageDelayMs: number;
  /** Browser headless mode */
  headless: boolean;
}

const DEFAULT_CONFIG: AutoScout24ScraperConfig = {
  baseUrl: 'https://www.autoscout24.nl',
  maxSearchPages: 20,
  navigationTimeoutMs: 30_000,
  pageDelayMs: 2_000,
  headless: true,
};

/**
 * AutoScout24 NL marketplace scraper.
 *
 * Uses Playwright to render JavaScript-heavy pages (AutoScout24 is built with Next.js)
 * and extracts listing data from the rendered DOM.
 */
export class AutoScout24Scraper implements MarketplaceScraper {
  private readonly config: AutoScout24ScraperConfig;
  private browser: Browser | null = null;

  constructor(config: Partial<AutoScout24ScraperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getMarketplaceId() {
    return 'autoscout24' as const;
  }

  /**
   * Collect listings from AutoScout24 NL search result pages.
   * Launches a browser, paginates through results, visits each listing detail page,
   * and returns parsed RawAdvertisement objects.
   */
  async collectListings(): Promise<RawAdvertisement[]> {
    const listings: RawAdvertisement[] = [];

    try {
      await this.launchBrowser();
      const page = await this.createPage();

      try {
        const listingUrls = await this.collectListingUrls(page);

        for (const url of listingUrls) {
          try {
            const listing = await this.scrapeListingDetail(page, url);
            if (listing) {
              listings.push(listing);
            }
          } catch (error) {
            // Skip individual listing failures; they'll be retried next cycle
            console.error(`[AutoScout24] Failed to scrape listing: ${url}`, error);
          }

          await this.delay(this.config.pageDelayMs);
        }
      } finally {
        await page.close();
      }
    } finally {
      await this.closeBrowser();
    }

    return listings;
  }

  /**
   * Verify whether a specific listing is still active on AutoScout24.
   */
  async verifyListing(sourceUrl: string): Promise<ListingStatus> {
    try {
      await this.launchBrowser();
      const page = await this.createPage();

      try {
        const response = await page.goto(sourceUrl, {
          waitUntil: 'domcontentloaded',
          timeout: this.config.navigationTimeoutMs,
        });

        if (!response) {
          return 'unknown';
        }

        const status = response.status();

        // HTTP 404 or 410 means the listing has been removed
        if (status === 404 || status === 410) {
          return 'inactive';
        }

        // Check for redirect to homepage or search (often happens for removed listings)
        const finalUrl = page.url();
        if (!finalUrl.includes('/aanbod/') && !finalUrl.includes('/offers/')) {
          return 'inactive';
        }

        // Check if the page contains a "removed" indicator
        const removedElement = await page.$(SELECTORS.detail.removedIndicator);
        if (removedElement) {
          return 'inactive';
        }

        // Check if the listing title is present (active listing)
        const titleElement = await page.$(SELECTORS.detail.title);
        if (titleElement) {
          return 'active';
        }

        return 'unknown';
      } finally {
        await page.close();
      }
    } catch (error) {
      console.error(`[AutoScout24] Failed to verify listing: ${sourceUrl}`, error);
      return 'unknown';
    } finally {
      await this.closeBrowser();
    }
  }

  // ─── Private Methods ───────────────────────────────────────────────────────

  private async launchBrowser(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: this.config.headless,
      });
    }
  }

  private async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private async createPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('[AutoScout24] Browser not launched');
    }

    const context = await this.browser.newContext({
      locale: 'nl-NL',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    return context.newPage();
  }

  /**
   * Paginate through search result pages and collect all individual listing URLs.
   */
  private async collectListingUrls(page: Page): Promise<string[]> {
    const urls: string[] = [];
    let currentPage = 1;

    while (currentPage <= this.config.maxSearchPages) {
      const searchUrl = this.buildSearchUrl(currentPage);

      try {
        await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: this.config.navigationTimeoutMs,
        });

        // Wait for listing cards to appear
        await page.waitForSelector(SELECTORS.searchResults.listingCard, {
          timeout: 10_000,
        }).catch(() => null);

        const linkLocators = await page.locator(SELECTORS.searchResults.listingLink).all();
        const pageUrls: string[] = [];
        for (const link of linkLocators) {
          const href = await link.getAttribute('href');
          if (!href) continue;
          const fullUrl = href.startsWith('http') ? href : `${this.config.baseUrl}${href}`;
          if (fullUrl.includes('/aanbod/')) {
            pageUrls.push(fullUrl);
          }
        }

        if (pageUrls.length === 0) {
          // No more listings, stop paginating
          break;
        }

        // Deduplicate URLs within this collection run
        for (const url of pageUrls) {
          if (!urls.includes(url)) {
            urls.push(url);
          }
        }

        // Check if there's a next page link
        const hasNextPage = await page.$(SELECTORS.searchResults.nextPage);
        if (!hasNextPage) {
          break;
        }

        currentPage++;
        await this.delay(this.config.pageDelayMs);
      } catch (error) {
        console.error(`[AutoScout24] Failed to load search page ${currentPage}`, error);
        break;
      }
    }

    return urls;
  }

  /**
   * Navigate to a listing detail page and extract all advertisement data.
   */
  private async scrapeListingDetail(page: Page, url: string): Promise<RawAdvertisement | null> {
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: this.config.navigationTimeoutMs,
    });

    // Wait for the main content to render
    await page.waitForSelector(SELECTORS.detail.title, { timeout: 10_000 }).catch(() => null);

    const title = await this.extractText(page, SELECTORS.detail.title);
    if (!title) {
      return null;
    }

    const price = await this.extractPrice(page);
    const imageUrls = await this.extractImageUrls(page);
    const specs = await this.extractSpecs(page);
    const location = await this.extractText(page, SELECTORS.detail.location);
    const sellerType = await this.extractSellerType(page);
    const externalId = this.extractExternalId(url);

    return {
      title,
      price,
      mileage: specs.mileage,
      year: specs.year,
      make: specs.make,
      model: specs.model,
      engineDisplacementCc: specs.engineDisplacementCc,
      horsepower: specs.horsepower,
      location: location?.trim() ?? null,
      sellerType,
      sourceUrl: url,
      imageUrls: imageUrls.slice(0, MAX_IMAGES_PER_LISTING),
      transmissionType: specs.transmissionType,
      fuelType: specs.fuelType,
      bodyType: specs.bodyType,
    };
  }

  /**
   * Extract text content from the first element matching the selector.
   */
  private async extractText(page: Page, selector: string): Promise<string | null> {
    const selectors = selector.split(',').map((s) => s.trim());

    for (const sel of selectors) {
      const element = await page.$(sel);
      if (element) {
        const text = await element.textContent();
        return text?.trim() ?? null;
      }
    }

    return null;
  }

  /**
   * Extract the price from the listing page.
   */
  private async extractPrice(page: Page): Promise<number | null> {
    const priceText = await this.extractText(page, SELECTORS.detail.price);
    if (!priceText) return null;

    // Remove currency symbols, dots (thousands separator in NL), and whitespace
    const cleaned = priceText.replace(/[€\s.]/g, '').replace(',', '.');
    const price = parseFloat(cleaned);

    return isNaN(price) ? null : price;
  }

  /**
   * Extract image URLs from the gallery.
   */
  private async extractImageUrls(page: Page): Promise<string[]> {
    const selectors = SELECTORS.detail.gallery.split(',').map((s) => s.trim());
    const urls: string[] = [];

    for (const sel of selectors) {
      const elements = await page.$$(sel);
      if (elements.length > 0) {
        for (const el of elements) {
          const src =
            (await el.getAttribute('src')) ??
            (await el.getAttribute('srcset'))?.split(' ')[0] ??
            null;

          if (src && src.startsWith('http') && !urls.includes(src)) {
            urls.push(src);
          }
        }
        break; // Use the first matching selector group
      }
    }

    return urls.slice(0, MAX_IMAGES_PER_LISTING);
  }

  /**
   * Extract vehicle specifications from the specs table/data grid.
   */
  private async extractSpecs(page: Page): Promise<ParsedSpecs> {
    const specs: ParsedSpecs = {
      mileage: null,
      year: null,
      make: null,
      model: null,
      engineDisplacementCc: null,
      horsepower: null,
      transmissionType: null,
      fuelType: null,
      bodyType: null,
    };

    const selectors = SELECTORS.detail.specsTable.split(',').map((s) => s.trim());

    for (const sel of selectors) {
      const container = await page.$(sel);
      if (!container) continue;

      // Try to extract key-value pairs from the specs container
      const specSelector = `${sel} dt, ${sel} dd, ${sel} [class*="key"], ${sel} [class*="value"]`;
      const specElements = await page.locator(specSelector).all();
      const pairs: Array<{ key: string; value: string }> = [];

      for (let i = 0; i < specElements.length - 1; i += 2) {
        const key = (await specElements[i].textContent())?.trim().toLowerCase() ?? '';
        const value = (await specElements[i + 1].textContent())?.trim() ?? '';
        if (key && value) {
          pairs.push({ key, value });
        }
      }

      for (const { key, value } of pairs) {
        this.parseSpecPair(key, value, specs);
      }

      if (pairs.length > 0) break;
    }

    // Attempt to extract make/model from the URL or title if not found in specs
    if (!specs.make || !specs.model) {
      const fromUrl = this.extractMakeModelFromUrl(page.url());
      if (fromUrl) {
        specs.make = specs.make ?? fromUrl.make;
        specs.model = specs.model ?? fromUrl.model;
      }
    }

    return specs;
  }

  /**
   * Parse a single spec key-value pair and assign to the appropriate field.
   */
  private parseSpecPair(key: string, value: string, specs: ParsedSpecs): void {
    // Mileage: "Kilometerstand", "km stand"
    if (key.includes('kilometer') || key.includes('km')) {
      const mileage = this.parseNumber(value);
      if (mileage !== null) specs.mileage = mileage;
    }

    // Year: "Bouwjaar", "Jaar"
    if (key.includes('bouwjaar') || key.includes('jaar') || key.includes('year')) {
      const year = this.parseNumber(value);
      if (year !== null && year >= 1900 && year <= new Date().getFullYear() + 1) {
        specs.year = year;
      }
    }

    // Make: "Merk"
    if (key.includes('merk') || key === 'make') {
      specs.make = value;
    }

    // Model: "Model"
    if (key.includes('model') && !key.includes('modelcode')) {
      specs.model = value;
    }

    // Engine displacement: "Cilinderinhoud", "Motorinhoud"
    if (key.includes('cilinder') || key.includes('motorinhoud') || key.includes('displacement')) {
      const cc = this.parseNumber(value);
      if (cc !== null) specs.engineDisplacementCc = cc;
    }

    // Horsepower: "Vermogen", "PK"
    if (key.includes('vermogen') || key.includes('pk') || key.includes('power')) {
      const hp = this.parseHorsepower(value);
      if (hp !== null) specs.horsepower = hp;
    }

    // Transmission: "Transmissie", "Versnellingsbak"
    if (key.includes('transmissie') || key.includes('versnelling') || key.includes('transmission')) {
      specs.transmissionType = this.parseTransmission(value);
    }

    // Fuel type: "Brandstof"
    if (key.includes('brandstof') || key.includes('fuel')) {
      specs.fuelType = this.parseFuelType(value);
    }

    // Body type: "Carrosserie", "Carrosserietype", "Type"
    if (key.includes('carrosserie') || key.includes('body') || (key === 'type' && !key.includes('fuel') && !key.includes('brandstof'))) {
      specs.bodyType = this.parseBodyType(value);
    }
  }

  /**
   * Extract seller type (dealer or private) from the page.
   */
  private async extractSellerType(page: Page): Promise<SellerType | null> {
    const text = await this.extractText(page, SELECTORS.detail.sellerType);
    if (!text) return null;

    const lower = text.toLowerCase();
    if (lower.includes('dealer') || lower.includes('bedrijf') || lower.includes('handelaar')) {
      return 'dealer';
    }
    if (lower.includes('particulier') || lower.includes('privé') || lower.includes('private')) {
      return 'private';
    }

    return null;
  }

  /**
   * Extract the external listing ID from the URL.
   * AutoScout24 URLs follow patterns like:
   *   /aanbod/{make}-{model}-{variant}-{uuid}
   *   /aanbod/details/{numeric-id}
   */
  extractExternalId(url: string): string {
    // Try UUID pattern first (most specific)
    const uuidMatch = url.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
    if (uuidMatch) return uuidMatch[1];

    // Try to extract a numeric ID (6+ digits)
    const numericMatch = url.match(/\/(\d{6,})(?:\?|$)/);
    if (numericMatch) return numericMatch[1];

    // Fall back to the full slug after /aanbod/
    const slugMatch = url.match(/\/aanbod\/([^/?]+)/);
    if (slugMatch) return slugMatch[1];

    return url;
  }

  /**
   * Attempt to extract make and model from an AutoScout24 URL.
   * URLs are typically structured as: /aanbod/{make}-{model}-{variant}-{id}
   */
  private extractMakeModelFromUrl(url: string): { make: string; model: string } | null {
    const match = url.match(/\/aanbod\/([^/?]+)/);
    if (!match) return null;

    const slug = match[1];
    const parts = slug.split('-');

    if (parts.length >= 2) {
      return {
        make: this.capitalize(parts[0]),
        model: this.capitalize(parts[1]),
      };
    }

    return null;
  }

  /**
   * Build a search URL for a specific page of results.
   */
  private buildSearchUrl(pageNumber: number): string {
    // AutoScout24 NL search URL with page parameter
    const params = new URLSearchParams({
      page: String(pageNumber),
      sort: 'age',  // Sort by newest first
      desc: '1',
    });

    return `${this.config.baseUrl}/lst?${params.toString()}`;
  }

  // ─── Utility Methods ───────────────────────────────────────────────────────

  private parseNumber(text: string): number | null {
    // Remove dots (thousands), spaces, units (km, cc, etc.)
    const cleaned = text.replace(/[.\s]/g, '').replace(',', '.');
    const match = cleaned.match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;

    const num = parseFloat(match[1]);
    return isNaN(num) ? null : num;
  }

  private parseHorsepower(text: string): number | null {
    // Try to find HP/PK value: "210 pk", "210 PK (155 kW)"
    const match = text.match(/(\d+)\s*(?:pk|hp|ps)/i);
    if (match) return parseInt(match[1], 10);

    // If no unit, try plain number
    return this.parseNumber(text);
  }

  private parseTransmission(text: string): TransmissionType | null {
    const lower = text.toLowerCase();
    if (lower.includes('automaat') || lower.includes('automatic') || lower.includes('auto')) {
      return 'automatic';
    }
    if (lower.includes('handgeschakeld') || lower.includes('manual') || lower.includes('hand')) {
      return 'manual';
    }
    return null;
  }

  private parseFuelType(text: string): FuelType | null {
    const lower = text.toLowerCase();
    if (lower.includes('benzine') || lower.includes('petrol') || lower.includes('gasoline')) {
      return 'petrol';
    }
    if (lower.includes('diesel')) {
      return 'diesel';
    }
    if (lower.includes('hybride') || lower.includes('hybrid')) {
      return 'hybrid';
    }
    if (lower.includes('elektrisch') || lower.includes('electric')) {
      return 'electric';
    }
    return null;
  }

  private parseBodyType(text: string): BodyType | null {
    const lower = text.toLowerCase();
    if (lower.includes('sedan') || lower.includes('limousine')) return 'sedan';
    if (lower.includes('coupé') || lower.includes('coupe')) return 'coupe';
    if (lower.includes('cabrio') || lower.includes('convertible')) return 'cabriolet';
    if (lower.includes('hatchback') || lower.includes('compact')) return 'hatchback';
    if (lower.includes('suv') || lower.includes('terreinwagen') || lower.includes('off-road')) return 'suv';
    if (lower.includes('station') || lower.includes('estate') || lower.includes('touring')) return 'station';
    if (lower.includes('mpv') || lower.includes('minivan') || lower.includes('van')) return 'mpv';
    if (lower.includes('roadster') || lower.includes('spider') || lower.includes('spyder')) return 'roadster';
    if (lower.includes('targa')) return 'targa';
    if (lower.includes('shooting brake')) return 'shooting_brake';
    return 'other';
  }

  private capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Internal type for parsed vehicle specifications.
 */
interface ParsedSpecs {
  mileage: number | null;
  year: number | null;
  make: string | null;
  model: string | null;
  engineDisplacementCc: number | null;
  horsepower: number | null;
  transmissionType: TransmissionType | null;
  fuelType: FuelType | null;
  bodyType: BodyType | null;
}
