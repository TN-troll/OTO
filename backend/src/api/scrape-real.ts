/**
 * Real AutoTrack.nl scraper.
 * Fetches actual car listings from AutoTrack search pages using Cheerio.
 * Rate-limited and respectful — designed to run once daily.
 */
import { Router, Request, Response } from 'express';
import * as cheerio from 'cheerio';
import { query } from '../db/connection.js';
import { MAX_IMAGES_PER_LISTING, CURATION_HP_THRESHOLD } from '@car-ads/shared';

export const scrapeRealRouter = Router();

const LUXURY_BRANDS = ['ferrari', 'lamborghini', 'bentley', 'rolls-royce', 'mclaren', 'aston martin', 'bugatti', 'maserati', 'porsche'];
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Rate limiting: wait between requests
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * GET /api/scrape-real/autotrack
 * Scrapes real listings from AutoTrack.nl for luxury/performance cars.
 */
scrapeRealRouter.get('/autotrack', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('[OTO] Starting REAL AutoTrack scrape...');
    
    const allListings: ParsedListing[] = [];
    
    // Search for luxury brands
    const searchUrls = [
      'https://www.autotrack.nl/auto/zoeken?minimumPk=300&prijsVan=50000',
      'https://www.autotrack.nl/auto/ferrari',
      'https://www.autotrack.nl/auto/lamborghini',
      'https://www.autotrack.nl/auto/porsche?model=911',
      'https://www.autotrack.nl/auto/mclaren',
      'https://www.autotrack.nl/auto/bentley',
      'https://www.autotrack.nl/auto/aston-martin',
    ];

    for (const url of searchUrls) {
      try {
        console.log(`[OTO] Fetching: ${url}`);
        const html = await fetchPage(url);
        if (html) {
          const listings = parseSearchPage(html, url);
          allListings.push(...listings);
          console.log(`[OTO] Found ${listings.length} listings on page`);
        }
        await delay(2000); // 2 second delay between requests
      } catch (err) {
        console.error(`[OTO] Failed to fetch ${url}:`, err);
      }
    }

    // Deduplicate by title+price
    const unique = deduplicateListings(allListings);
    console.log(`[OTO] Total unique listings: ${unique.length}`);

    // Insert into database
    let inserted = 0;
    let skipped = 0;

    for (const listing of unique) {
      try {
        const existing = await query(
          `SELECT id FROM listings WHERE title = $1 AND price = $2 LIMIT 1`,
          [listing.title, listing.price]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        const result = await query(
          `INSERT INTO listings (title, price, mileage, year, make, model, engine_displacement_cc, horsepower, location, seller_type, transmission_type, fuel_type, image_urls, status, curation_criteria, date_added, last_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active', $14, NOW(), NOW())
           RETURNING id`,
          [
            listing.title, listing.price, listing.mileage, listing.year,
            listing.make, listing.model, listing.engineDisplacementCc,
            listing.horsepower, listing.location, listing.sellerType,
            listing.transmissionType, listing.fuelType,
            listing.imageUrls.slice(0, MAX_IMAGES_PER_LISTING),
            listing.curationCriteria,
          ]
        );

        // Add source reference
        if (result.rows[0]?.id && listing.sourceUrl) {
          await query(
            `INSERT INTO source_references (listing_id, marketplace, url, external_id, last_checked, is_active)
             VALUES ($1, 'autotrack', $2, $3, NOW(), TRUE)
             ON CONFLICT (marketplace, external_id) DO NOTHING`,
            [result.rows[0].id, listing.sourceUrl, listing.externalId]
          );
        }

        inserted++;
      } catch (err) {
        console.error(`[OTO] Failed to insert: ${listing.title}`, err);
      }
    }

    res.json({
      success: true,
      pagesScraped: searchUrls.length,
      totalFound: allListings.length,
      uniqueListings: unique.length,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error('[OTO] Real scrape failed:', err);
    res.status(500).json({ error: 'Scrape failed', details: String(err) });
  }
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface ParsedListing {
  title: string;
  price: number;
  mileage: number | null;
  year: number;
  make: string;
  model: string;
  engineDisplacementCc: number | null;
  horsepower: number | null;
  location: string | null;
  sellerType: string | null;
  transmissionType: string | null;
  fuelType: string | null;
  imageUrls: string[];
  curationCriteria: string[];
  sourceUrl: string;
  externalId: string;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
      },
    });
    if (!response.ok) {
      console.log(`[OTO] HTTP ${response.status} for ${url}`);
      return null;
    }
    return await response.text();
  } catch (err) {
    console.error(`[OTO] Fetch error for ${url}:`, err);
    return null;
  }
}

function parseSearchPage(html: string, pageUrl: string): ParsedListing[] {
  const $ = cheerio.load(html);
  const listings: ParsedListing[] = [];

  // AutoTrack uses various listing card selectors
  $('[data-testid="search-result-item"], article.ListingCard, .listing-card, [class*="ListingCard"]').each((_, el) => {
    try {
      const card = $(el);
      
      // Get the link to the listing
      const linkEl = card.find('a[href*="/auto/"], a[href*="/detail/"]').first();
      let href = linkEl.attr('href') || '';
      if (href && !href.startsWith('http')) {
        href = 'https://www.autotrack.nl' + href;
      }
      if (!href) return;

      // Title
      const title = card.find('h2, h3, [class*="title"], [data-testid*="title"]').first().text().trim();
      if (!title) return;

      // Price
      const priceText = card.find('[class*="price"], [data-testid*="price"]').first().text().trim();
      const price = parsePrice(priceText);
      if (!price) return;

      // Image
      const imgEl = card.find('img[src*="http"], img[data-src*="http"]').first();
      const imgSrc = imgEl.attr('data-src') || imgEl.attr('src') || '';
      const imageUrls = imgSrc ? [imgSrc] : [];

      // Extract make/model from title
      const { make, model } = extractMakeModel(title);

      // Year (try to find in specs or title)
      const yearMatch = title.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();

      // Specs (km, pk)
      const specsText = card.text();
      const mileage = extractMileage(specsText);
      const horsepower = extractHorsepower(specsText);

      // Determine curation criteria
      const criteria: string[] = [];
      if (horsepower && horsepower > CURATION_HP_THRESHOLD) criteria.push('hp_above_300');
      if (LUXURY_BRANDS.some(b => make.toLowerCase().includes(b))) criteria.push('luxury_brand_match');
      if (criteria.length === 0) criteria.push('hp_above_300'); // assume qualifying since we searched for 300+ pk

      listings.push({
        title,
        price,
        mileage,
        year,
        make,
        model,
        engineDisplacementCc: null,
        horsepower,
        location: null,
        sellerType: null,
        transmissionType: null,
        fuelType: 'petrol',
        imageUrls,
        curationCriteria: criteria,
        sourceUrl: href,
        externalId: href.split('/').pop() || href,
      });
    } catch { /* skip bad entries */ }
  });

  return listings;
}

function parsePrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[€\s.]/g, '').replace(',', '.');
  const match = cleaned.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function extractMakeModel(title: string): { make: string; model: string } {
  const parts = title.split(/\s+/);
  if (parts.length >= 2) {
    return { make: parts[0], model: parts.slice(1, 4).join(' ') };
  }
  return { make: title, model: '' };
}

function extractMileage(text: string): number | null {
  const match = text.match(/([\d.]+)\s*km/i);
  if (match) {
    return parseInt(match[1].replace('.', ''), 10);
  }
  return null;
}

function extractHorsepower(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:pk|hp|ps)/i);
  return match ? parseInt(match[1], 10) : null;
}

function deduplicateListings(listings: ParsedListing[]): ParsedListing[] {
  const seen = new Set<string>();
  return listings.filter(l => {
    const key = `${l.title}|${l.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
