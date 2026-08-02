import * as cheerio from 'cheerio';
import { MAX_IMAGES_PER_LISTING } from '@car-ads/shared';
import type { RawAdvertisement, ListingStatus, MarketplaceId, SellerType, TransmissionType, FuelType } from '@car-ads/shared';
import type { MarketplaceScraper } from '../marketplace-scraper.js';

/** Configuration for the AutoTrack scraper. */
export interface AutoTrackScraperConfig {
  /** Base URL for AutoTrack (default: https://www.autotrack.nl) */
  baseUrl?: string;
  /** Maximum number of search result pages to scrape per run */
  maxPages?: number;
  /** Custom fetch implementation (for testing) */
  fetchFn?: typeof fetch;
}

const DEFAULT_BASE_URL = 'https://www.autotrack.nl';
const DEFAULT_MAX_PAGES = 5;

/**
 * AutoTrack marketplace scraper.
 *
 * Scrapes car listings from AutoTrack.nl using Cheerio for HTML parsing.
 * AutoTrack serves mostly server-rendered HTML, making Cheerio appropriate.
 */
export class AutoTrackScraper implements MarketplaceScraper {
  private readonly baseUrl: string;
  private readonly maxPages: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: AutoTrackScraperConfig = {}) {
    this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
    this.maxPages = config.maxPages ?? DEFAULT_MAX_PAGES;
    this.fetchFn = config.fetchFn ?? fetch;
  }

  getMarketplaceId(): MarketplaceId {
    return 'autotrack';
  }

  /**
   * Collect car listings from AutoTrack search result pages.
   * Fetches multiple pages of results and parses individual listing details.
   */
  async collectListings(): Promise<RawAdvertisement[]> {
    const listings: RawAdvertisement[] = [];

    for (let page = 1; page <= this.maxPages; page++) {
      try {
        const searchUrl = this.buildSearchUrl(page);
        const html = await this.fetchPage(searchUrl);
        if (!html) break;

        const listingUrls = this.parseSearchResults(html);
        if (listingUrls.length === 0) break;

        for (const url of listingUrls) {
          try {
            const listingHtml = await this.fetchPage(url);
            if (!listingHtml) continue;

            const ad = this.parseListingPage(listingHtml, url);
            if (ad) {
              listings.push(ad);
            }
          } catch {
            // Skip individual listing on error, continue with others
            continue;
          }
        }
      } catch {
        // Stop pagination on page-level errors
        break;
      }
    }

    return listings;
  }

  /**
   * Verify whether a specific listing is still active on AutoTrack.
   * Makes a GET request to the source URL and checks the HTTP status.
   */
  async verifyListing(sourceUrl: string): Promise<ListingStatus> {
    try {
      const response = await this.fetchFn(sourceUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CarAdsAggregator/1.0)',
        },
      });

      if (response.ok) {
        // Check if the page content indicates the ad is removed
        const html = await response.text();
        if (this.isListingRemovedPage(html)) {
          return 'inactive';
        }
        return 'active';
      }

      if (response.status === 404 || response.status === 410) {
        return 'inactive';
      }

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Build the search URL for a given results page.
   */
  private buildSearchUrl(page: number): string {
    return `${this.baseUrl}/auto/zoeken?page=${page}`;
  }

  /**
   * Fetch a page and return its HTML content, or null on failure.
   */
  private async fetchPage(url: string): Promise<string | null> {
    const response = await this.fetchFn(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CarAdsAggregator/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.text();
  }

  /**
   * Parse a search results page and extract individual listing URLs.
   */
  parseSearchResults(html: string): string[] {
    const $ = cheerio.load(html);
    const urls: string[] = [];

    // AutoTrack uses article elements or link cards for search results
    $('[data-testid="search-result-item"] a, article.search-result a.listing-link, .listing-card a[href*="/auto/detail/"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;
        if (!urls.includes(fullUrl)) {
          urls.push(fullUrl);
        }
      }
    });

    return urls;
  }

  /**
   * Parse an individual listing page and extract all advertisement fields.
   */
  parseListingPage(html: string, sourceUrl: string): RawAdvertisement | null {
    const $ = cheerio.load(html);

    const title = this.parseTitle($);
    if (!title) return null;

    const price = this.parsePrice($);
    const mileage = this.parseMileage($);
    const year = this.parseYear($);
    const { make, model } = this.parseMakeModel($);
    const engineDisplacementCc = this.parseDisplacement($);
    const horsepower = this.parseHorsepower($);
    const location = this.parseLocation($);
    const sellerType = this.parseSellerType($);
    const imageUrls = this.parseImages($);
    const transmissionType = this.parseTransmission($);
    const fuelType = this.parseFuelType($);

    return {
      title,
      price,
      mileage,
      year,
      make,
      model,
      engineDisplacementCc,
      horsepower,
      location,
      sellerType,
      sourceUrl,
      imageUrls,
      transmissionType,
      fuelType,
    };
  }

  /**
   * Parse the listing title from the page.
   */
  private parseTitle($: cheerio.CheerioAPI): string | null {
    const title =
      $('h1[data-testid="listing-title"]').text().trim() ||
      $('h1.listing-title').text().trim() ||
      $('h1').first().text().trim();

    return title || null;
  }

  /**
   * Parse the price from the listing page.
   * Handles formats like "€ 45.900", "€45.900,-", "45900"
   */
  private parsePrice($: cheerio.CheerioAPI): number | null {
    const priceText =
      $('[data-testid="listing-price"]').text().trim() ||
      $('.listing-price').text().trim() ||
      $('[class*="price"]').first().text().trim();

    return this.extractNumericValue(priceText);
  }

  /**
   * Parse mileage from the listing specs.
   * Handles formats like "125.000 km", "125000 km"
   */
  private parseMileage($: cheerio.CheerioAPI): number | null {
    const mileageText = this.findSpecValue($, ['kilometerstand', 'km stand', 'mileage']);
    return this.extractNumericValue(mileageText);
  }

  /**
   * Parse the year of manufacture.
   */
  private parseYear($: cheerio.CheerioAPI): number | null {
    const yearText = this.findSpecValue($, ['bouwjaar', 'jaar', 'year']);
    if (!yearText) return null;

    const match = yearText.match(/(\d{4})/);
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * Parse make and model from the listing page.
   */
  private parseMakeModel($: cheerio.CheerioAPI): { make: string | null; model: string | null } {
    // Try structured data attributes first
    const make =
      $('[data-testid="listing-make"]').text().trim() ||
      this.findSpecValue($, ['merk', 'make']) ||
      null;

    const model =
      $('[data-testid="listing-model"]').text().trim() ||
      this.findSpecValue($, ['model']) ||
      null;

    if (make || model) {
      return { make, model };
    }

    // Fallback: try to extract from the title
    const title = $('h1').first().text().trim();
    if (title) {
      const parts = title.split(/\s+/);
      if (parts.length >= 2) {
        return { make: parts[0], model: parts.slice(1).join(' ') };
      }
    }

    return { make: null, model: null };
  }

  /**
   * Parse engine displacement in cc.
   * Handles formats like "3.0 L", "2998 cc", "3000cc"
   */
  private parseDisplacement($: cheerio.CheerioAPI): number | null {
    const displacementText = this.findSpecValue($, ['cilinderinhoud', 'motorinhoud', 'displacement', 'cilinder']);

    if (!displacementText) return null;

    // Check for liters format (e.g., "3.0 L", "2.5L")
    const litersMatch = displacementText.match(/([\d,.]+)\s*[lL]/);
    if (litersMatch) {
      const liters = parseFloat(litersMatch[1].replace(',', '.'));
      return Math.round(liters * 1000);
    }

    // Check for cc format (e.g., "2998 cc", "3000cc")
    const ccMatch = displacementText.match(/([\d.]+)\s*cc/i);
    if (ccMatch) {
      return parseInt(ccMatch[1].replace('.', ''), 10);
    }

    // Try plain numeric value (assume cc)
    return this.extractNumericValue(displacementText);
  }

  /**
   * Parse horsepower from the listing specs.
   * Handles formats like "450 pk", "450 HP", "331 kW"
   */
  private parseHorsepower($: cheerio.CheerioAPI): number | null {
    const hpText = this.findSpecValue($, ['vermogen', 'pk', 'horsepower', 'power']);
    if (!hpText) return null;

    // Check for kW format and convert to HP (1 kW ≈ 1.36 HP)
    const kwMatch = hpText.match(/([\d.]+)\s*kW/i);
    if (kwMatch) {
      return Math.round(parseFloat(kwMatch[1]) * 1.36);
    }

    // Check for pk/HP format
    const hpMatch = hpText.match(/([\d.]+)\s*(?:pk|hp|bhp|ps)/i);
    if (hpMatch) {
      return parseInt(hpMatch[1], 10);
    }

    return this.extractNumericValue(hpText);
  }

  /**
   * Parse the seller location.
   */
  private parseLocation($: cheerio.CheerioAPI): string | null {
    const location =
      $('[data-testid="seller-location"]').text().trim() ||
      $('[data-testid="listing-location"]').text().trim() ||
      $('.seller-location').text().trim() ||
      this.findSpecValue($, ['locatie', 'plaats', 'location']);

    return location || null;
  }

  /**
   * Parse the seller type (dealer or private).
   */
  private parseSellerType($: cheerio.CheerioAPI): SellerType | null {
    const sellerText =
      $('[data-testid="seller-type"]').text().trim().toLowerCase() ||
      this.findSpecValue($, ['verkoper', 'seller'])?.toLowerCase() ||
      '';

    if (sellerText.includes('dealer') || sellerText.includes('bedrijf') || sellerText.includes('autobedrijf')) {
      return 'dealer';
    }
    if (sellerText.includes('particulier') || sellerText.includes('private') || sellerText.includes('privé')) {
      return 'private';
    }
    return null;
  }

  /**
   * Parse listing images, limited to MAX_IMAGES_PER_LISTING (20).
   */
  private parseImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];

    // Try various image selectors used by AutoTrack
    $('[data-testid="gallery-image"] img, .gallery img, .listing-gallery img, .carousel img, [class*="gallery"] img').each((_, el) => {
      if (images.length >= MAX_IMAGES_PER_LISTING) return false; // stop iteration

      const src = $(el).attr('data-src') || $(el).attr('src');
      if (src && !src.includes('placeholder') && !src.includes('data:image')) {
        const fullUrl = src.startsWith('http') ? src : `${this.baseUrl}${src}`;
        if (!images.includes(fullUrl)) {
          images.push(fullUrl);
        }
      }
    });

    return images.slice(0, MAX_IMAGES_PER_LISTING);
  }

  /**
   * Parse transmission type from the listing specs.
   */
  private parseTransmission($: cheerio.CheerioAPI): TransmissionType | null {
    const transmissionText = this.findSpecValue($, ['transmissie', 'versnellingsbak', 'transmission'])?.toLowerCase();
    if (!transmissionText) return null;

    if (transmissionText.includes('handgeschakeld') || transmissionText.includes('manual') || transmissionText.includes('manueel')) {
      return 'manual';
    }
    if (transmissionText.includes('automaat') || transmissionText.includes('automatic') || transmissionText.includes('automatisch')) {
      return 'automatic';
    }
    return null;
  }

  /**
   * Parse fuel type from the listing specs.
   */
  private parseFuelType($: cheerio.CheerioAPI): FuelType | null {
    const fuelText = this.findSpecValue($, ['brandstof', 'fuel', 'brandstofsoort'])?.toLowerCase();
    if (!fuelText) return null;

    if (fuelText.includes('benzine') || fuelText.includes('petrol') || fuelText.includes('gasoline')) {
      return 'petrol';
    }
    if (fuelText.includes('diesel')) {
      return 'diesel';
    }
    if (fuelText.includes('hybride') || fuelText.includes('hybrid')) {
      return 'hybrid';
    }
    if (fuelText.includes('elektrisch') || fuelText.includes('electric')) {
      return 'electric';
    }
    return null;
  }

  /**
   * Find a specification value by searching for matching labels in the specs table/list.
   * AutoTrack typically displays specs in a definition list or table format.
   */
  private findSpecValue($: cheerio.CheerioAPI, labels: string[]): string | null {
    // Search in definition lists (dt/dd pairs)
    for (const label of labels) {
      const dt = $('dt, th, .spec-label, [class*="spec"] .label')
        .filter((_, el) => $(el).text().trim().toLowerCase().includes(label))
        .first();
      if (dt.length > 0) {
        const value = dt.next('dd, td, .spec-value, [class*="spec"] .value').text().trim();
        if (value) return value;
      }
    }

    // Search in data-testid attributes
    for (const label of labels) {
      const el = $(`[data-testid*="${label}"]`).first();
      if (el.length > 0) {
        const value = el.text().trim();
        if (value) return value;
      }
    }

    // Search in generic key-value pairs
    for (const label of labels) {
      let found: string | null = null;
      $('[class*="spec"], [class*="detail"], [class*="attribute"]').each((_, el) => {
        if (found) return false;
        const text = $(el).text().trim().toLowerCase();
        if (text.includes(label)) {
          // Try to extract the value part (after colon or in sibling)
          const fullText = $(el).text().trim();
          const colonSplit = fullText.split(':');
          if (colonSplit.length > 1) {
            found = colonSplit.slice(1).join(':').trim();
            return false;
          }
          // Check sibling or child value element
          const valueEl = $(el).find('.value, span:last-child').last();
          if (valueEl.length > 0) {
            found = valueEl.text().trim();
            return false;
          }
        }
      });
      if (found) return found;
    }

    return null;
  }

  /**
   * Extract a numeric value from a text string.
   * Handles Dutch number formatting (dots as thousands separators, commas as decimal).
   */
  private extractNumericValue(text: string | null): number | null {
    if (!text) return null;

    // Remove currency symbols, ",-" suffix, units, and whitespace
    const cleaned = text
      .replace(/[€$£]/g, '')
      .replace(/,-/g, '')
      .replace(/\s*(km|cc|pk|hp|kw|bhp|ps|l)\b.*/gi, '')
      .replace(/\s/g, '')
      .trim();

    if (!cleaned) return null;

    // Handle Dutch formatting: "45.900" (dot = thousands separator)
    // If there's a dot and the part after the last dot has exactly 3 digits, it's a thousands separator
    const dotParts = cleaned.split('.');
    if (dotParts.length > 1 && /^\d{3}$/.test(dotParts[dotParts.length - 1])) {
      const withoutDots = cleaned.replace(/\./g, '');
      const num = parseInt(withoutDots, 10);
      return isNaN(num) ? null : num;
    }

    // Handle comma as decimal separator
    const withDot = cleaned.replace(',', '.');
    const num = parseFloat(withDot);
    return isNaN(num) ? null : Math.round(num);
  }

  /**
   * Check if the page content indicates the listing has been removed.
   */
  private isListingRemovedPage(html: string): boolean {
    const $ = cheerio.load(html);
    const bodyText = $('body').text().toLowerCase();

    return (
      bodyText.includes('deze advertentie is niet meer beschikbaar') ||
      bodyText.includes('deze auto is verkocht') ||
      bodyText.includes('advertentie verwijderd') ||
      bodyText.includes('this listing is no longer available') ||
      $('[data-testid="listing-removed"]').length > 0
    );
  }
}
