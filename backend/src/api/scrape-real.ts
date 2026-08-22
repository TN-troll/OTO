/**
 * Real AutoTrack.nl scraper.
 * Fetches actual car listings from AutoTrack.nl search pages using Cheerio/fetch.
 * Rate-limited — 2 second delay between pages.
 */
import { Router, Request, Response } from 'express';
import * as cheerio from 'cheerio';
import { query } from '../db/connection.js';
import { MAX_IMAGES_PER_LISTING, CURATION_HP_THRESHOLD } from '@car-ads/shared';
import { isDutchLocation } from '../map/location-validator.js';

export const scrapeRealRouter = Router();

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BASE_URL = 'https://www.autotrack.nl';

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

    const searchPages: string[] = [];

    // Luxury brands — all pages
    const luxuryBrands = ['ferrari', 'lamborghini', 'mclaren', 'bugatti', 'pagani', 'koenigsegg'];
    for (const brand of luxuryBrands) {
      for (let p = 1; p <= 5; p++) {
        searchPages.push(`${BASE_URL}/auto/${brand}?pagina=${p}`);
      }
    }

    // Premium brand + model searches with HP filters
    const premiumSearches = [
      { path: 'porsche/911', pk: 200, pages: 5 },
      { path: 'porsche/cayenne', pk: 200, pages: 3 },
      { path: 'porsche/taycan', pk: 200, pages: 3 },
      { path: 'porsche/panamera', pk: 200, pages: 3 },
      { path: 'porsche/718', pk: 200, pages: 3 },
      { path: 'porsche/macan', pk: 250, pages: 2 },
      { path: 'porsche/cayman', pk: 0, pages: 3 },
      { path: 'porsche/boxster', pk: 0, pages: 3 },
      { path: 'bentley', pk: 0, pages: 5 },
      { path: 'aston-martin', pk: 0, pages: 5 },
      { path: 'rolls-royce', pk: 0, pages: 5 },
      { path: 'maserati', pk: 200, pages: 4 },
      { path: 'lotus', pk: 0, pages: 4 },
      { path: 'alpine', pk: 0, pages: 3 },
      { path: 'donkervoort', pk: 0, pages: 2 },
      { path: 'morgan', pk: 0, pages: 2 },
      { path: 'wiesmann', pk: 0, pages: 2 },
      { path: 'tvr', pk: 0, pages: 2 },
      { path: 'polestar', pk: 0, pages: 3 },
      // Mercedes AMG
      { path: 'mercedes-benz/amg-gt', pk: 200, pages: 4 },
      { path: 'mercedes-benz/s-klasse', pk: 300, pages: 3 },
      { path: 'mercedes-benz/g-klasse', pk: 300, pages: 3 },
      { path: 'mercedes-benz/c-klasse', pk: 300, pages: 3 },
      { path: 'mercedes-benz/e-klasse', pk: 300, pages: 3 },
      { path: 'mercedes-benz/gle-klasse', pk: 350, pages: 2 },
      { path: 'mercedes-benz/sl-klasse', pk: 200, pages: 3 },
      { path: 'mercedes-benz/cls', pk: 300, pages: 2 },
      { path: 'mercedes-benz/a-klasse', pk: 300, pages: 2 },
      { path: 'mercedes-benz/eqs', pk: 300, pages: 2 },
      // BMW M
      { path: 'bmw/m2', pk: 300, pages: 3 },
      { path: 'bmw/m3', pk: 300, pages: 3 },
      { path: 'bmw/m4', pk: 300, pages: 3 },
      { path: 'bmw/m5', pk: 300, pages: 3 },
      { path: 'bmw/m8', pk: 300, pages: 3 },
      { path: 'bmw/x5-m', pk: 300, pages: 2 },
      { path: 'bmw/x6-m', pk: 300, pages: 2 },
      { path: 'bmw/z4', pk: 200, pages: 2 },
      { path: 'bmw/8-serie', pk: 200, pages: 3 },
      { path: 'bmw/i4', pk: 300, pages: 2 },
      { path: 'bmw/ix', pk: 300, pages: 2 },
      { path: 'bmw/xm', pk: 300, pages: 2 },
      // Audi RS/S
      { path: 'audi/r8', pk: 0, pages: 4 },
      { path: 'audi/rs6', pk: 0, pages: 3 },
      { path: 'audi/rs7', pk: 0, pages: 3 },
      { path: 'audi/rsq8', pk: 0, pages: 2 },
      { path: 'audi/rs3', pk: 0, pages: 3 },
      { path: 'audi/rs5', pk: 0, pages: 2 },
      { path: 'audi/rs4', pk: 0, pages: 2 },
      { path: 'audi/e-tron-gt', pk: 300, pages: 3 },
      { path: 'audi/tt-rs', pk: 0, pages: 2 },
      { path: 'audi/sq5', pk: 200, pages: 2 },
      { path: 'audi/s4', pk: 200, pages: 2 },
      { path: 'audi/s5', pk: 200, pages: 2 },
      // Jaguar
      { path: 'jaguar/f-type', pk: 200, pages: 3 },
      { path: 'jaguar/f-pace', pk: 300, pages: 2 },
      { path: 'jaguar/i-pace', pk: 300, pages: 2 },
      // Nissan / Toyota / Lexus
      { path: 'nissan/gt-r', pk: 0, pages: 3 },
      { path: 'toyota/supra', pk: 200, pages: 2 },
      { path: 'lexus/lc', pk: 200, pages: 2 },
      { path: 'lexus/rc-f', pk: 0, pages: 2 },
      // Alfa Romeo
      { path: 'alfa-romeo/giulia', pk: 400, pages: 3 },
      { path: 'alfa-romeo/stelvio', pk: 400, pages: 3 },
      // American muscle
      { path: 'ford/mustang', pk: 300, pages: 3 },
      { path: 'chevrolet/corvette', pk: 0, pages: 3 },
      { path: 'dodge/challenger', pk: 300, pages: 2 },
      { path: 'dodge/charger', pk: 300, pages: 2 },
      { path: 'dodge/viper', pk: 0, pages: 2 },
      // Tesla
      { path: 'tesla/model-s', pk: 300, pages: 3 },
      { path: 'tesla/model-3', pk: 300, pages: 3 },
      { path: 'tesla/model-x', pk: 300, pages: 2 },
      // Land Rover
      { path: 'land-rover/range-rover-sport', pk: 300, pages: 3 },
      { path: 'land-rover/range-rover', pk: 300, pages: 3 },
      { path: 'land-rover/defender', pk: 300, pages: 2 },
      // Hot hatches
      { path: 'volkswagen/golf', pk: 200, pages: 3 },
      { path: 'honda/civic', pk: 200, pages: 2 },
      { path: 'hyundai/i30', pk: 200, pages: 2 },
      { path: 'hyundai/ioniq-5', pk: 400, pages: 2 },
      { path: 'toyota/yaris', pk: 200, pages: 2 },
      { path: 'ford/focus', pk: 200, pages: 2 },
      { path: 'cupra/leon', pk: 200, pages: 2 },
      { path: 'cupra/formentor', pk: 200, pages: 2 },
      { path: 'mini/cooper', pk: 150, pages: 2 },
      { path: 'renault/megane', pk: 200, pages: 2 },
      { path: 'peugeot/308', pk: 200, pages: 2 },
      { path: 'seat/leon', pk: 200, pages: 2 },
      { path: 'bmw/1-serie', pk: 200, pages: 2 },
      { path: 'bmw/2-serie', pk: 200, pages: 2 },
      { path: 'audi/s3', pk: 200, pages: 2 },
      { path: 'mercedes-benz/cla', pk: 300, pages: 2 },
      // Performance SUVs
      { path: 'lamborghini/urus', pk: 0, pages: 3 },
      { path: 'bmw/x3-m', pk: 300, pages: 2 },
      { path: 'bmw/x4-m', pk: 300, pages: 2 },
      { path: 'audi/sq7', pk: 200, pages: 2 },
      { path: 'audi/sq8', pk: 200, pages: 2 },
      // Electric performance
      { path: 'porsche/taycan', pk: 200, pages: 5 },
      { path: 'mercedes-benz/eqe', pk: 300, pages: 2 },
      { path: 'bmw/i7', pk: 300, pages: 2 },
      // Volvo performance
      { path: 'volvo/xc90', pk: 300, pages: 2 },
      { path: 'volvo/s60', pk: 250, pages: 2 },
      // Classics / niche
      { path: 'de-tomaso', pk: 0, pages: 1 },
      { path: 'noble', pk: 0, pages: 1 },
    ];

    for (const { path, pk, pages } of premiumSearches) {
      for (let p = 1; p <= pages; p++) {
        const pkParam = pk > 0 ? `&minimumPk=${pk}` : '';
        searchPages.push(`${BASE_URL}/auto/${path}?pagina=${p}${pkParam}`);
      }
    }

    // General high-power catchall
    for (let p = 1; p <= 15; p++) {
      searchPages.push(`${BASE_URL}/auto/zoeken?minimumPk=300&prijsVan=50000&pagina=${p}`);
    }
    for (let p = 1; p <= 10; p++) {
      searchPages.push(`${BASE_URL}/auto/zoeken?prijsVan=100000&pagina=${p}`);
    }
    for (let p = 1; p <= 5; p++) {
      searchPages.push(`${BASE_URL}/auto/zoeken?minimumPk=500&pagina=${p}`);
    }

    console.log(`[OTO] AutoTrack: ${searchPages.length} search pages to scrape`);

    const allListings: ParsedListing[] = [];

    for (const url of searchPages) {
      try {
        console.log(`[OTO] [AutoTrack] Fetching: ${url}`);
        const html = await fetchPage(url);
        if (html) {
          const listings = parseAutoTrackPage(html, url);
          allListings.push(...listings);
          console.log(`[OTO] [AutoTrack] Found ${listings.length} listings`);
        }
        await delay(2000);
      } catch (err) {
        console.error(`[OTO] [AutoTrack] Error: ${url}`, err);
      }
    }

    // Deduplicate by externalId
    const unique = deduplicateListings(allListings);
    console.log(`[OTO] [AutoTrack] Total unique: ${unique.length}`);

    // Upsert
    let inserted = 0;
    let skipped = 0;
    let priceUpdated = 0;

    for (const listing of unique) {
      try {
        // Check if exists by external_id
        const existing = await query(
          `SELECT l.id, l.price FROM listings l
           JOIN source_references sr ON sr.listing_id = l.id
           WHERE sr.external_id = $1 AND sr.marketplace = 'autotrack'
           LIMIT 1`,
          [listing.externalId]
        );

        if (existing.rows.length > 0) {
          // Price change tracking
          const existingId = existing.rows[0].id;
          const oldPrice = parseFloat(existing.rows[0].price);
          if (listing.price && Math.abs(oldPrice - listing.price) > 1) {
            await query(`INSERT INTO price_history (listing_id, price) VALUES ($1, $2)`, [existingId, listing.price]);
            await query(`UPDATE listings SET price = $1, last_verified = NOW() WHERE id = $2`, [listing.price, existingId]);
            priceUpdated++;
          } else {
            await query(`UPDATE listings SET last_verified = NOW() WHERE id = $1`, [existingId]);
          }
          skipped++;
          continue;
        }

        // Skip non-Dutch
        if (listing.location && !isDutchLocation(listing.location)) {
          skipped++;
          continue;
        }

        const result = await query(
          `INSERT INTO listings (title, description, price, mileage, year, make, model, engine_displacement_cc, horsepower, location, seller_type, transmission_type, fuel_type, body_type, image_urls, status, curation_criteria, date_added, last_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active', $16, NOW(), NOW())
           RETURNING id`,
          [
            listing.title, null, listing.price, listing.mileage, listing.year,
            listing.make, listing.model, listing.engineDisplacementCc,
            listing.horsepower, listing.location, listing.sellerType,
            listing.transmissionType, listing.fuelType, listing.bodyType,
            listing.imageUrls.slice(0, MAX_IMAGES_PER_LISTING),
            listing.curationCriteria,
          ]
        );

        if (result.rows[0]?.id) {
          await query(
            `INSERT INTO source_references (listing_id, marketplace, url, external_id, last_checked, is_active)
             VALUES ($1, 'autotrack', $2, $3, NOW(), TRUE)
             ON CONFLICT (marketplace, external_id) DO NOTHING`,
            [result.rows[0].id, listing.sourceUrl, listing.externalId]
          );
        }
        inserted++;
      } catch (err) {
        console.error(`[OTO] [AutoTrack] Insert failed: ${listing.title}`, err);
      }
    }

    res.json({
      success: true,
      marketplace: 'autotrack',
      pagesScraped: searchPages.length,
      totalFound: allListings.length,
      unique: unique.length,
      inserted,
      skipped,
      priceUpdated,
    });
  } catch (err) {
    console.error('[OTO] AutoTrack scrape failed:', err);
    res.status(500).json({ error: String(err) });
  }
});

// ─── Parsing ──────────────────────────────────────────────────────────────────

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
  bodyType: string | null;
  imageUrls: string[];
  curationCriteria: string[];
  sourceUrl: string;
  externalId: string;
}

const LUXURY_BRANDS = ['ferrari', 'lamborghini', 'bentley', 'rolls-royce', 'mclaren', 'aston martin', 'bugatti', 'maserati', 'porsche', 'lotus', 'pagani', 'koenigsegg'];

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

/**
 * Parse AutoTrack search page.
 * AutoTrack uses Next.js — try __NEXT_DATA__ first, then fall back to HTML parsing.
 */
function parseAutoTrackPage(html: string, pageUrl: string): ParsedListing[] {
  // Try __NEXT_DATA__ JSON first
  const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]);
      const listings = extractFromNextData(data);
      if (listings.length > 0) return listings;
    } catch { /* fall through to HTML */ }
  }

  // Fall back to HTML parsing with Cheerio
  return parseAutoTrackHtml(html, pageUrl);
}

function extractFromNextData(data: unknown): ParsedListing[] {
  const listings: ParsedListing[] = [];

  try {
    // Navigate to search results in __NEXT_DATA__
    const root = data as Record<string, unknown>;
    const props = root?.props as Record<string, unknown> | undefined;
    const pageProps = props?.pageProps as Record<string, unknown> | undefined;
    if (!pageProps) return listings;

    const searchResults = (pageProps.searchResults || pageProps.results || pageProps.listings || []) as unknown;

    const items: unknown[] = Array.isArray(searchResults)
      ? searchResults
      : ((searchResults as Record<string, unknown>)?.items || (searchResults as Record<string, unknown>)?.results || []) as unknown[];

    for (const raw of items) {
      try {
        const item = raw as Record<string, unknown>;
        const title = (item.title || item.name || `${item.make || ''} ${item.model || ''}`.trim()) as string;
        if (!title) continue;

        const priceInfo = item.priceInfo as Record<string, unknown> | undefined;
        const price = (item.price || item.askingPrice || priceInfo?.price || 0) as number;
        if (!price || price < 5000) continue;

        const make = (item.make || item.brand || extractMakeFromTitle(title)) as string;
        const model = (item.model || item.type || '') as string;
        const year = (item.year || item.constructionYear || item.buildYear || new Date().getFullYear()) as number;
        const mileage = (item.mileage || item.kilometerCount || item.odometer || null) as number | null;
        const powerInfo = item.power as Record<string, unknown> | undefined;
        const horsepower = (item.horsepower || powerInfo?.hp || item.powerPk || null) as number | null;
        const location = (item.location || item.city || item.sellerLocation || null) as string | null;

        const sourceUrl = (item.url || item.detailUrl || item.link || '') as string;
        const fullUrl = sourceUrl.startsWith('http') ? sourceUrl : `${BASE_URL}${sourceUrl}`;
        const externalId = (item.id?.toString() || item.advertisementId?.toString() || sourceUrl.split('/').pop() || '') as string;

        const imageUrls: string[] = [];
        if (item.mainImage) imageUrls.push(item.mainImage as string);
        if (item.imageUrl) imageUrls.push(item.imageUrl as string);
        if (item.images && Array.isArray(item.images)) {
          for (const img of item.images.slice(0, MAX_IMAGES_PER_LISTING)) {
            const url = typeof img === 'string' ? img : (img as Record<string, unknown>).url || (img as Record<string, unknown>).src || '';
            if (url) imageUrls.push(url as string);
          }
        }

        const criteria: string[] = [];
        if (horsepower && horsepower >= CURATION_HP_THRESHOLD) criteria.push('hp_above_300');
        if (LUXURY_BRANDS.some(b => make.toLowerCase().includes(b))) criteria.push('luxury_brand_match');
        if (criteria.length === 0) criteria.push('hp_above_300');

        listings.push({
          title,
          price,
          mileage,
          year,
          make,
          model,
          engineDisplacementCc: (item.engineDisplacement || item.cylinderCapacity || null) as number | null,
          horsepower,
          location,
          sellerType: item.sellerType === 'dealer' || item.isDealer ? 'dealer' : item.sellerType === 'private' ? 'private' : null,
          transmissionType: parseTransmission((item.transmission || item.gearbox || '') as string),
          fuelType: parseFuelType((item.fuelType || item.fuel || '') as string),
          bodyType: parseBodyType((item.bodyType || item.body || '') as string),
          imageUrls: imageUrls.slice(0, MAX_IMAGES_PER_LISTING),
          curationCriteria: criteria,
          sourceUrl: fullUrl,
          externalId,
        });
      } catch { continue; }
    }
  } catch { /* ignore */ }

  return listings;
}

function parseAutoTrackHtml(html: string, _pageUrl: string): ParsedListing[] {
  const $ = cheerio.load(html);
  const listings: ParsedListing[] = [];

  // Try multiple selector patterns for AutoTrack listing cards
  $('[data-testid="search-result-item"], article.ListingCard, .listing-card, [class*="ListingCard"], [class*="search-result"], [class*="VehicleCard"]').each((_, el) => {
    try {
      const card = $(el);

      // Link
      const linkEl = card.find('a[href*="/auto/"], a[href*="/detail/"]').first();
      let href = linkEl.attr('href') || '';
      if (href && !href.startsWith('http')) href = `${BASE_URL}${href}`;
      if (!href) return;

      // Title
      const title = card.find('h2, h3, [class*="title"], [data-testid*="title"]').first().text().trim();
      if (!title) return;

      // Price
      const priceText = card.find('[class*="price"], [data-testid*="price"], [class*="Price"]').first().text().trim();
      const price = parsePrice(priceText);
      if (!price || price < 5000) return;

      // Image
      const imgEl = card.find('img[src*="http"], img[data-src*="http"]').first();
      const imgSrc = imgEl.attr('data-src') || imgEl.attr('src') || '';
      const imageUrls = imgSrc && !imgSrc.includes('placeholder') ? [imgSrc] : [];

      // Make/model
      const { make, model } = extractMakeModel(title);

      // Year
      const yearMatch = title.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
      const specsText = card.text();
      const yearFromSpecs = specsText.match(/\b(19[5-9]\d|20[0-2]\d)\b/);
      const year = yearMatch ? parseInt(yearMatch[1], 10) : yearFromSpecs ? parseInt(yearFromSpecs[1], 10) : new Date().getFullYear();

      // Mileage & HP
      const mileage = extractMileage(specsText);
      const horsepower = extractHorsepower(specsText);

      // Location
      const locationEl = card.find('[class*="location"], [class*="Location"], [data-testid*="location"]');
      const location = locationEl.text().trim() || null;

      // External ID
      const externalId = href.match(/\/(\d+)(?:\?|$)/)?.[1] || href.split('/').pop() || href;

      const criteria: string[] = [];
      if (horsepower && horsepower >= CURATION_HP_THRESHOLD) criteria.push('hp_above_300');
      if (LUXURY_BRANDS.some(b => make.toLowerCase().includes(b))) criteria.push('luxury_brand_match');
      if (criteria.length === 0) criteria.push('hp_above_300');

      listings.push({
        title,
        price,
        mileage,
        year,
        make,
        model,
        engineDisplacementCc: null,
        horsepower,
        location,
        sellerType: null,
        transmissionType: null,
        fuelType: null,
        bodyType: null,
        imageUrls,
        curationCriteria: criteria,
        sourceUrl: href,
        externalId,
      });
    } catch { /* skip */ }
  });

  // Also try JSON-LD structured data
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const jsonLd = JSON.parse($(el).html() || '') as Record<string, unknown>;
      if (jsonLd['@type'] === 'ItemList' && jsonLd.itemListElement) {
        for (const raw of jsonLd.itemListElement as unknown[]) {
          const entry = raw as Record<string, unknown>;
          const vehicle = (entry.item || entry) as Record<string, unknown>;
          if (vehicle['@type'] !== 'Car' && vehicle['@type'] !== 'Vehicle') continue;

          const title = (vehicle.name || '') as string;
          const offers = vehicle.offers as Record<string, unknown> | undefined;
          const price = (offers?.price || 0) as number | string;
          if (!title || !price) continue;

          const brand = vehicle.brand as Record<string, unknown> | undefined;
          const manufacturer = vehicle.manufacturer as Record<string, unknown> | undefined;
          const make = (brand?.name || manufacturer?.name || extractMakeFromTitle(title)) as string;
          const model = (vehicle.model || '') as string;
          const sourceUrl = (vehicle.url || vehicle['@id'] || '') as string;
          const fullUrl = sourceUrl.startsWith('http') ? sourceUrl : `${BASE_URL}${sourceUrl}`;

          const mileageObj = vehicle.mileageFromOdometer as Record<string, unknown> | undefined;
          const availableAt = vehicle.availableAtOrFrom as Record<string, unknown> | undefined;
          const address = availableAt?.address as Record<string, unknown> | undefined;

          listings.push({
            title,
            price: typeof price === 'string' ? parseInt(price, 10) : price,
            mileage: (mileageObj?.value || null) as number | null,
            year: (vehicle.modelDate || vehicle.productionDate || new Date().getFullYear()) as number,
            make,
            model,
            engineDisplacementCc: null,
            horsepower: null,
            location: (address?.addressLocality || null) as string | null,
            sellerType: null,
            transmissionType: null,
            fuelType: parseFuelType((vehicle.fuelType || '') as string),
            bodyType: parseBodyType((vehicle.bodyType || '') as string),
            imageUrls: vehicle.image ? (Array.isArray(vehicle.image) ? vehicle.image as string[] : [vehicle.image as string]) : [],
            curationCriteria: ['luxury_brand_match'],
            sourceUrl: fullUrl,
            externalId: fullUrl.split('/').pop() || fullUrl,
          });
        }
      }
    } catch { /* skip */ }
  });

  return listings;
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[€\s.]/g, '').replace(/,-/g, '').replace(',', '.');
  const match = cleaned.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function extractMakeFromTitle(title: string): string {
  return title.split(/\s+/)[0] || '';
}

function extractMakeModel(title: string): { make: string; model: string } {
  const parts = title.split(/\s+/);
  if (parts.length >= 2) {
    // Handle multi-word makes
    const knownMakes = ['Land Rover', 'Aston Martin', 'Rolls-Royce', 'Alfa Romeo', 'Mercedes-Benz', 'De Tomaso'];
    for (const km of knownMakes) {
      if (title.toLowerCase().startsWith(km.toLowerCase())) {
        const model = title.slice(km.length).trim();
        return { make: km, model: model.split(/\s+/).slice(0, 4).join(' ') };
      }
    }
    return { make: parts[0], model: parts.slice(1, 4).join(' ') };
  }
  return { make: title, model: '' };
}

function extractMileage(text: string): number | null {
  const match = text.match(/([\d.]+)\s*km/i);
  if (match) return parseInt(match[1].replace(/\./g, ''), 10);
  return null;
}

function extractHorsepower(text: string): number | null {
  const match = text.match(/(\d+)\s*(?:pk|hp|ps)/i);
  return match ? parseInt(match[1], 10) : null;
}

function parseTransmission(text: string): string | null {
  const lower = (text || '').toLowerCase();
  if (lower.includes('automaat') || lower.includes('automatic')) return 'automatic';
  if (lower.includes('handgeschakeld') || lower.includes('manual')) return 'manual';
  return null;
}

function parseFuelType(text: string): string | null {
  const lower = (text || '').toLowerCase();
  if (lower.includes('benzine') || lower.includes('petrol')) return 'petrol';
  if (lower.includes('diesel')) return 'diesel';
  if (lower.includes('hybride') || lower.includes('hybrid')) return 'hybrid';
  if (lower.includes('elektrisch') || lower.includes('electric')) return 'electric';
  return null;
}

function parseBodyType(text: string): string | null {
  const lower = (text || '').toLowerCase();
  if (lower.includes('sedan') || lower.includes('limousine')) return 'sedan';
  if (lower.includes('coupé') || lower.includes('coupe')) return 'coupe';
  if (lower.includes('cabrio') || lower.includes('convertible')) return 'cabriolet';
  if (lower.includes('suv') || lower.includes('terreinwagen')) return 'suv';
  if (lower.includes('hatchback')) return 'hatchback';
  if (lower.includes('station') || lower.includes('estate')) return 'station';
  return null;
}

function deduplicateListings(listings: ParsedListing[]): ParsedListing[] {
  const seen = new Set<string>();
  return listings.filter(l => {
    const key = l.externalId || `${l.title}|${l.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
