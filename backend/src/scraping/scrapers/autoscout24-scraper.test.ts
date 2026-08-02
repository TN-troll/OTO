import { describe, it, expect } from 'vitest';
import { AutoScout24Scraper, SELECTORS } from './autoscout24-scraper.js';

describe('AutoScout24Scraper', () => {
  const scraper = new AutoScout24Scraper({
    baseUrl: 'https://www.autoscout24.nl',
  });

  describe('getMarketplaceId', () => {
    it('returns autoscout24', () => {
      expect(scraper.getMarketplaceId()).toBe('autoscout24');
    });
  });

  describe('extractExternalId', () => {
    it('extracts UUID from listing URL', () => {
      const url = 'https://www.autoscout24.nl/aanbod/bmw-m3-competition-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const id = scraper.extractExternalId(url);
      expect(id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    });

    it('extracts numeric ID from URL with 6+ digit number', () => {
      const url = 'https://www.autoscout24.nl/aanbod/details/12345678';
      const id = scraper.extractExternalId(url);
      expect(id).toBe('12345678');
    });

    it('extracts slug from URL when no UUID or numeric ID present', () => {
      const url = 'https://www.autoscout24.nl/aanbod/porsche-911-gt3-abc123?ref=search';
      const id = scraper.extractExternalId(url);
      expect(id).toBe('porsche-911-gt3-abc123');
    });

    it('returns the full URL as fallback when no pattern matches', () => {
      const url = 'https://www.autoscout24.nl/unknown/path';
      const id = scraper.extractExternalId(url);
      expect(id).toBe(url);
    });

    it('extracts full slug from simple aanbod URL', () => {
      const url = 'https://www.autoscout24.nl/aanbod/ferrari-488-spider';
      const id = scraper.extractExternalId(url);
      expect(id).toBe('ferrari-488-spider');
    });

    it('prefers UUID over numeric ID when both are present', () => {
      const url = 'https://www.autoscout24.nl/aanbod/12345678/a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      const id = scraper.extractExternalId(url);
      expect(id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
    });
  });

  describe('SELECTORS', () => {
    it('has all required detail selectors', () => {
      expect(SELECTORS.detail.title).toBeDefined();
      expect(SELECTORS.detail.price).toBeDefined();
      expect(SELECTORS.detail.gallery).toBeDefined();
      expect(SELECTORS.detail.specsTable).toBeDefined();
      expect(SELECTORS.detail.location).toBeDefined();
      expect(SELECTORS.detail.sellerType).toBeDefined();
      expect(SELECTORS.detail.removedIndicator).toBeDefined();
    });

    it('has all required search result selectors', () => {
      expect(SELECTORS.searchResults.listingCard).toBeDefined();
      expect(SELECTORS.searchResults.listingLink).toBeDefined();
      expect(SELECTORS.searchResults.nextPage).toBeDefined();
    });
  });

  describe('configuration', () => {
    it('uses default config when no options provided', () => {
      const defaultScraper = new AutoScout24Scraper();
      expect(defaultScraper.getMarketplaceId()).toBe('autoscout24');
    });

    it('allows custom config overrides', () => {
      const customScraper = new AutoScout24Scraper({
        baseUrl: 'https://custom.autoscout24.nl',
        maxSearchPages: 5,
        navigationTimeoutMs: 15_000,
        pageDelayMs: 1_000,
        headless: false,
      });
      expect(customScraper.getMarketplaceId()).toBe('autoscout24');
    });
  });
});
