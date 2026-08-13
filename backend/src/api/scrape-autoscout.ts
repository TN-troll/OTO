/**
 * Real AutoScout24.nl scraper.
 * Fetches actual luxury car listings by parsing __NEXT_DATA__ JSON from search pages.
 * Rate-limited — designed to run once daily.
 */
import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { MAX_IMAGES_PER_LISTING, CURATION_HP_THRESHOLD } from '@car-ads/shared';

export const scrapeAutoscoutRouter = Router();

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const BASE_URL = 'https://www.autoscout24.nl';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * GET /api/scrape-autoscout/run
 * Scrapes real listings from AutoScout24.nl for luxury/performance cars.
 */
scrapeAutoscoutRouter.get('/run', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('[OTO] Starting REAL AutoScout24 scrape...');

    // Generate search pages dynamically — comprehensive coverage
    const searchPages: string[] = [];
    
    // Luxury brands — all pages
    const luxuryBrands = [
      'ferrari', 'lamborghini', 'mclaren', 'bugatti', 'pagani', 'koenigsegg',
    ];
    for (const brand of luxuryBrands) {
      for (let p = 1; p <= 5; p++) {
        searchPages.push(`${BASE_URL}/lst/${brand}?sort=price&desc=1${p > 1 ? `&page=${p}` : ''}`);
      }
    }

    // Premium brands — with power/price filters, more pages
    const premiumSearches = [
      { path: 'porsche/911', kw: 150, pages: 5 },
      { path: 'porsche/cayenne', kw: 150, pages: 3 },
      { path: 'porsche/taycan', kw: 150, pages: 3 },
      { path: 'porsche/panamera', kw: 150, pages: 3 },
      { path: 'porsche/718', kw: 150, pages: 3 },
      { path: 'porsche/macan', kw: 200, pages: 2 },
      { path: 'bentley', kw: 0, pages: 5 },
      { path: 'aston-martin', kw: 0, pages: 5 },
      { path: 'rolls-royce', kw: 0, pages: 5 },
      { path: 'maserati', kw: 150, pages: 4 },
      { path: 'lotus', kw: 0, pages: 4 },
      { path: 'mercedes-benz/amg-gt', kw: 150, pages: 4 },
      { path: 'mercedes-benz/s-klasse', kw: 200, pages: 3 },
      { path: 'mercedes-benz/g-klasse', kw: 200, pages: 3 },
      { path: 'mercedes-benz/cls', kw: 200, pages: 2 },
      { path: 'mercedes-benz/gle-klasse', kw: 250, pages: 2 },
      { path: 'bmw/m3', kw: 200, pages: 3 },
      { path: 'bmw/m4', kw: 200, pages: 3 },
      { path: 'bmw/m5', kw: 200, pages: 3 },
      { path: 'bmw/m8', kw: 200, pages: 3 },
      { path: 'bmw/x5-m', kw: 200, pages: 2 },
      { path: 'bmw/x6-m', kw: 200, pages: 2 },
      { path: 'bmw/z4', kw: 200, pages: 2 },
      { path: 'audi/r8', kw: 0, pages: 4 },
      { path: 'audi/rs6', kw: 200, pages: 3 },
      { path: 'audi/rs7', kw: 200, pages: 3 },
      { path: 'audi/rsq8', kw: 200, pages: 2 },
      { path: 'audi/rs3', kw: 200, pages: 2 },
      { path: 'audi/rs5', kw: 200, pages: 2 },
      { path: 'audi/e-tron-gt', kw: 200, pages: 3 },
      { path: 'jaguar/f-type', kw: 150, pages: 3 },
      { path: 'nissan/gt-r', kw: 0, pages: 3 },
      { path: 'alfa-romeo/giulia', kw: 150, pages: 3 },
      { path: 'ford/mustang', kw: 200, pages: 3 },
      { path: 'chevrolet/corvette', kw: 0, pages: 3 },
      { path: 'dodge/challenger', kw: 200, pages: 2 },
      { path: 'toyota/supra', kw: 150, pages: 2 },
      { path: 'lexus/lc', kw: 150, pages: 2 },
      { path: 'lexus/lfa', kw: 0, pages: 1 },
    ];

    for (const { path, kw, pages } of premiumSearches) {
      for (let p = 1; p <= pages; p++) {
        const kwParam = kw > 0 ? `&powertype=kw&powerfrom=${kw}` : '';
        searchPages.push(`${BASE_URL}/lst/${path}?sort=price&desc=1${kwParam}${p > 1 ? `&page=${p}` : ''}`);
      }
    }

    // General high-power searches (catches everything we might have missed)
    for (let p = 1; p <= 10; p++) {
      searchPages.push(`${BASE_URL}/lst?sort=price&desc=1&powertype=kw&powerfrom=300&pricefrom=50000${p > 1 ? `&page=${p}` : ''}`);
    }

    console.log(`[OTO] Total search pages to scrape: ${searchPages.length}`);

    const allListings: ParsedListing[] = [];

    for (const url of searchPages) {
      try {
        console.log(`[OTO] Fetching: ${url}`);
        const html = await fetchPage(url);
        if (html) {
          const listings = parseNextData(html);
          allListings.push(...listings);
          console.log(`[OTO] Parsed ${listings.length} listings`);
        }
        await delay(2000); // 2 second delay — be respectful
      } catch (err) {
        console.error(`[OTO] Error scraping ${url}:`, err);
      }
    }

    // Deduplicate
    const unique = dedup(allListings);
    console.log(`[OTO] Total unique: ${unique.length}`);

    // Incremental upsert — don't delete existing listings, only add new ones
    let inserted = 0;
    let skipped = 0;
    for (const listing of unique) {
      try {
        // Check if this listing already exists (by external ID or title+price combo)
        const existing = await query(
          `SELECT l.id FROM listings l
           JOIN source_references sr ON sr.listing_id = l.id
           WHERE sr.external_id = $1 AND sr.marketplace = 'autoscout24'
           LIMIT 1`,
          [listing.externalId]
        );

        if (existing.rows.length > 0) {
          skipped++;
          continue;
        }

        const result = await query(
          `INSERT INTO listings (title, description, price, mileage, year, make, model, engine_displacement_cc, horsepower, location, seller_type, transmission_type, fuel_type, image_urls, status, curation_criteria, date_added, last_verified)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'active', $15, NOW(), NOW())
           RETURNING id`,
          [
            listing.title, listing.description, listing.price, listing.mileage, listing.year,
            listing.make, listing.model, listing.engineDisplacementCc,
            listing.horsepower, listing.location, listing.sellerType,
            listing.transmissionType, listing.fuelType,
            listing.imageUrls.slice(0, MAX_IMAGES_PER_LISTING),
            listing.curationCriteria,
          ]
        );

        if (result.rows[0]?.id) {
          await query(
            `INSERT INTO source_references (listing_id, marketplace, url, external_id, last_checked, is_active)
             VALUES ($1, 'autoscout24', $2, $3, NOW(), TRUE)
             ON CONFLICT (marketplace, external_id) DO NOTHING`,
            [result.rows[0].id, listing.sourceUrl, listing.externalId]
          );
        }
        inserted++;
      } catch (err) {
        console.error(`[OTO] Insert failed for ${listing.title}:`, err);
      }
    }

    res.json({
      success: true,
      pagesScraped: searchPages.length,
      totalFound: allListings.length,
      unique: unique.length,
      inserted,
      skipped,
    });
  } catch (err) {
    console.error('[OTO] AutoScout24 scrape failed:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * GET /api/scrape-autoscout/enrich
 * Enriches existing listings with description/options from individual detail pages.
 * Processes in batches with delays to be respectful. Limit per run: 50 listings.
 */
scrapeAutoscoutRouter.get('/enrich', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('[OTO] Starting listing enrichment...');

    // Get listings that have no enriched description (only the short vehicle details line)
    const toEnrich = await query<{ id: string; listing_id: string; url: string }>(
      `SELECT sr.listing_id, sr.url, l.id
       FROM source_references sr
       JOIN listings l ON l.id = sr.listing_id
       WHERE l.description IS NULL 
          OR l.description = '' 
          OR (l.description NOT LIKE '%Opties:%' AND LENGTH(l.description) < 200)
       LIMIT 50`
    );

    console.log(`[OTO] Found ${toEnrich.rows.length} listings to enrich`);

    let enriched = 0;
    for (const row of toEnrich.rows) {
      try {
        const html = await fetchPage(row.url);
        if (!html) continue;

        const details = parseDetailPage(html);
        if (details.description || details.options) {
          await query(
            `UPDATE listings SET description = $1 WHERE id = $2`,
            [
              [details.description, details.options].filter(Boolean).join('\n\n'),
              row.listing_id,
            ]
          );
          enriched++;
        }
        await delay(2000);
      } catch (err) {
        console.error(`[OTO] Enrich failed for ${row.url}:`, err);
      }
    }

    res.json({ success: true, checked: toEnrich.rows.length, enriched });
  } catch (err) {
    console.error('[OTO] Enrichment failed:', err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * Parse an individual AutoScout24 listing detail page for description and options.
 */
function parseDetailPage(html: string): { description: string | null; options: string | null } {
  let description: string | null = null;
  let options: string | null = null;

  // Try to extract from __NEXT_DATA__
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
  if (match) {
    try {
      const data = JSON.parse(match[1]);
      const listing = data?.props?.pageProps?.listingDetails || data?.props?.pageProps?.listing;
      
      if (listing) {
        // Description / seller notes
        description = listing.description || listing.sellerNotes || listing.vehicle?.description || null;

        // Equipment / options list
        const equipment = listing.equipment || listing.features || listing.vehicle?.equipment;
        if (Array.isArray(equipment)) {
          const optionsList = equipment
            .map((e: any) => typeof e === 'string' ? e : e?.name || e?.label || '')
            .filter(Boolean);
          if (optionsList.length > 0) {
            options = 'Opties: ' + optionsList.join(', ');
          }
        } else if (typeof equipment === 'object' && equipment !== null) {
          // Sometimes equipment is grouped by category
          const allOptions: string[] = [];
          for (const category of Object.values(equipment)) {
            if (Array.isArray(category)) {
              for (const item of category) {
                const name = typeof item === 'string' ? item : item?.name || item?.label || '';
                if (name) allOptions.push(name);
              }
            }
          }
          if (allOptions.length > 0) {
            options = 'Opties: ' + allOptions.join(', ');
          }
        }
      }
    } catch { /* skip parse errors */ }
  }

  return { description, options };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ParsedListing {
  title: string;
  description: string | null;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  }
}

function parseNextData(html: string): ParsedListing[] {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.+?)<\/script>/);
  if (!match) return [];

  try {
    const data = JSON.parse(match[1]);
    const listings = data?.props?.pageProps?.listings;
    if (!Array.isArray(listings)) return [];

    return listings.map(parseListing).filter((l): l is ParsedListing => l !== null);
  } catch {
    return [];
  }
}

function parseListing(raw: any): ParsedListing | null {
  try {
    const make = raw.vehicle?.make || '';
    const model = raw.vehicle?.model || '';
    const price = raw.price?.priceRaw || raw.tracking?.price;
    if (!make || !price) return null;

    // Images — use larger size (480x360 instead of 250x188)
    const images: string[] = (raw.images || [])
      .map((img: string) => img.replace('/250x188.webp', '/720x540.webp').replace('/250x188.jpg', '/720x540.jpg'))
      .slice(0, 20);

    // Year from vehicleDetails or firstRegistration
    let year = new Date().getFullYear();
    const yearDetail = (raw.vehicleDetails || []).find((d: any) => d.iconName === 'calendar');
    if (yearDetail?.data) {
      const m = yearDetail.data.match(/(\d{4})/);
      if (m) year = parseInt(m[1], 10);
    } else if (raw.tracking?.firstRegistration) {
      const m = raw.tracking.firstRegistration.match(/(\d{4})/);
      if (m) year = parseInt(m[1], 10);
    }

    // Mileage
    let mileage: number | null = null;
    const mileageStr = raw.vehicle?.mileageInKm || '';
    const mileageMatch = mileageStr.replace(/\./g, '').match(/(\d+)/);
    if (mileageMatch) mileage = parseInt(mileageMatch[1], 10);

    // Horsepower
    let horsepower: number | null = null;
    const powerDetail = (raw.vehicleDetails || []).find((d: any) => d.iconName === 'speedometer');
    if (powerDetail?.data) {
      const hpMatch = powerDetail.data.match(/\((\d+)\s*PK\)/);
      if (hpMatch) horsepower = parseInt(hpMatch[1], 10);
    }

    // Engine displacement
    let engineCc: number | null = null;
    const displacementStr = raw.vehicle?.engineDisplacementInCCM || '';
    const ccMatch = displacementStr.replace(/\./g, '').match(/(\d+)/);
    if (ccMatch) engineCc = parseInt(ccMatch[1], 10);

    // Transmission
    let transmission: string | null = null;
    const transStr = raw.vehicle?.transmission || '';
    if (transStr.toLowerCase().includes('auto')) transmission = 'automatic';
    else if (transStr.toLowerCase().includes('hand') || transStr.toLowerCase().includes('manu')) transmission = 'manual';

    // Fuel type
    let fuelType: string | null = null;
    const fuelStr = raw.vehicle?.fuel || '';
    if (fuelStr.toLowerCase().includes('benzine') || fuelStr.toLowerCase().includes('petrol')) fuelType = 'petrol';
    else if (fuelStr.toLowerCase().includes('diesel')) fuelType = 'diesel';
    else if (fuelStr.toLowerCase().includes('elektro') || fuelStr.toLowerCase().includes('hybride')) fuelType = 'hybrid';
    else if (fuelStr.toLowerCase().includes('electric')) fuelType = 'electric';

    // Location
    const location = raw.location?.city || null;

    // Seller type
    const sellerType = raw.seller?.type === 'Dealer' ? 'dealer' : 'private';

    // Source URL
    const sourceUrl = raw.url ? `${BASE_URL}${raw.url}` : '';
    const externalId = raw.id || raw.crossReferenceId || sourceUrl;

    // Curation criteria
    const criteria: string[] = [];
    if (horsepower && horsepower > CURATION_HP_THRESHOLD) criteria.push('hp_above_300');
    const luxuryBrands = ['ferrari', 'lamborghini', 'bentley', 'rolls-royce', 'mclaren', 'aston martin', 'bugatti'];
    if (luxuryBrands.some(b => make.toLowerCase().includes(b))) criteria.push('luxury_brand_match');
    if (criteria.length === 0) criteria.push('hp_above_300');

    // Build a description from available data points
    const descParts: string[] = [];
    if (raw.vehicle?.modelVersionInput) descParts.push(raw.vehicle.modelVersionInput);
    const details = (raw.vehicleDetails || []).map((d: any) => d.data).filter(Boolean);
    if (details.length > 0) descParts.push(details.join(' • '));
    if (raw.subtitle) descParts.push(raw.subtitle);
    const description = descParts.length > 0 ? descParts.join('\n') : null;

    return {
      title: `${make} ${model}${raw.vehicle?.modelVersionInput ? ' ' + raw.vehicle.modelVersionInput : ''}`.trim().substring(0, 200),
      description,
      price: typeof price === 'string' ? parseInt(price, 10) : price,
      mileage,
      year,
      make,
      model,
      engineDisplacementCc: engineCc,
      horsepower,
      location,
      sellerType,
      transmissionType: transmission,
      fuelType,
      imageUrls: images,
      curationCriteria: criteria,
      sourceUrl,
      externalId,
    };
  } catch {
    return null;
  }
}

function dedup(listings: ParsedListing[]): ParsedListing[] {
  const seen = new Set<string>();
  return listings.filter(l => {
    const key = l.externalId || `${l.title}|${l.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
