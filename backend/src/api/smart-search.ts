/**
 * Smart search: parses natural language queries into database filters.
 * Supports Dutch and English without requiring an AI API.
 */
import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

export const smartSearchRouter = Router();

interface ParsedQuery {
  makes: string[];
  priceMin?: number;
  priceMax?: number;
  horsepowerMin?: number;
  horsepowerMax?: number;
  yearMin?: number;
  yearMax?: number;
  fuelType?: string;
  transmission?: string;
  textSearch?: string;
  sortBy?: string;
  sortOrder?: string;
}

// Known car makes (lowercase for matching)
const KNOWN_MAKES: Record<string, string> = {
  'ferrari': 'Ferrari', 'lamborghini': 'Lamborghini', 'lambo': 'Lamborghini',
  'porsche': 'Porsche', 'mclaren': 'McLaren', 'bentley': 'Bentley',
  'aston martin': 'Aston Martin', 'aston': 'Aston Martin',
  'mercedes': 'Mercedes-Benz', 'mercedes-benz': 'Mercedes-Benz', 'merc': 'Mercedes-Benz',
  'bmw': 'BMW', 'rolls-royce': 'Rolls-Royce', 'rolls royce': 'Rolls-Royce',
  'bugatti': 'Bugatti', 'maserati': 'Maserati', 'audi': 'Audi',
  'nissan': 'Nissan', 'corvette': 'Corvette',
};

/**
 * GET /api/smart-search?q=...
 * Parses natural language into filters and returns matching listings.
 */
smartSearchRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const q = ((req.query.q as string) || '').trim();
    if (q.length < 2) {
      res.json({ listings: [], totalCount: 0, parsedFilters: {} });
      return;
    }

    const parsed = parseNaturalLanguage(q);
    const { sql, params } = buildQuery(parsed);

    const result = await query(sql, params);

    const listings = result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      primaryImageUrl: row.image_urls?.[0] || null,
      make: row.make,
      model: row.model,
      year: row.year,
      price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
      horsepower: row.horsepower,
      engineDisplacementCc: row.engine_displacement_cc,
      dateAdded: row.date_added,
    }));

    res.json({
      listings,
      totalCount: listings.length,
      parsedFilters: parsed,
      query: q,
    });
  } catch (err) {
    console.error('[OTO] Smart search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

function parseNaturalLanguage(input: string): ParsedQuery {
  const q = input.toLowerCase();
  const parsed: ParsedQuery = { makes: [] };

  // Detect makes
  for (const [keyword, make] of Object.entries(KNOWN_MAKES)) {
    if (q.includes(keyword)) {
      if (!parsed.makes.includes(make)) {
        parsed.makes.push(make);
      }
    }
  }

  // Price patterns (Dutch + English)
  // "onder 200k", "under 200k", "max 200000", "tot 300.000"
  const priceMaxPatterns = [
    /(?:onder|under|max|tot|minder dan|less than|below|budget)\s*(?:€?\s*)?([\d.,]+)\s*(?:k|duizend|thousand)?(?:\s*(?:euro|eur|€))?/i,
    /(?:€?\s*)?([\d.,]+)\s*(?:k|duizend)?\s*(?:euro|eur|€)?\s*(?:max|maximaal|maximum)/i,
  ];
  for (const pattern of priceMaxPatterns) {
    const match = q.match(pattern);
    if (match) {
      parsed.priceMax = parseNumber(match[1]);
      break;
    }
  }

  // "vanaf 100k", "from 100k", "min 100000", "meer dan 50.000"
  const priceMinPatterns = [
    /(?:vanaf|from|min|meer dan|more than|above|boven)\s*(?:€?\s*)?([\d.,]+)\s*(?:k|duizend|thousand)?(?:\s*(?:euro|eur|€))?/i,
  ];
  for (const pattern of priceMinPatterns) {
    const match = q.match(pattern);
    if (match) {
      parsed.priceMin = parseNumber(match[1]);
      break;
    }
  }

  // Horsepower patterns
  // "500 pk", "meer dan 400 pk", "boven 600pk", "more than 500hp"
  const hpMinPatterns = [
    /(?:meer dan|more than|boven|above|min|minstens|minimaal|vanaf)\s*(\d+)\s*(?:pk|hp|ps|paarden)/i,
    /(\d+)\s*(?:pk|hp|ps|paarden)\s*(?:of meer|or more|\+)/i,
  ];
  for (const pattern of hpMinPatterns) {
    const match = q.match(pattern);
    if (match) {
      parsed.horsepowerMin = parseInt(match[1], 10);
      break;
    }
  }

  // "max 500 pk", "tot 400pk"
  const hpMaxPatterns = [
    /(?:max|tot|minder dan|less than|onder)\s*(\d+)\s*(?:pk|hp|ps|paarden)/i,
  ];
  for (const pattern of hpMaxPatterns) {
    const match = q.match(pattern);
    if (match) {
      parsed.horsepowerMax = parseInt(match[1], 10);
      break;
    }
  }

  // If just "500pk" without context, treat as minimum
  if (!parsed.horsepowerMin && !parsed.horsepowerMax) {
    const hpMatch = q.match(/(\d{3,4})\s*(?:pk|hp|ps)/i);
    if (hpMatch) {
      parsed.horsepowerMin = parseInt(hpMatch[1], 10);
    }
  }

  // Year patterns
  const yearMatch = q.match(/(?:uit|from|van|bouwjaar|year)\s*((?:19|20)\d{2})/i);
  if (yearMatch) parsed.yearMin = parseInt(yearMatch[1], 10);

  const yearAfterMatch = q.match(/(?:na|after|nieuwer dan|newer than)\s*((?:19|20)\d{2})/i);
  if (yearAfterMatch) parsed.yearMin = parseInt(yearAfterMatch[1], 10);

  // Fuel type
  if (q.includes('benzine') || q.includes('petrol')) parsed.fuelType = 'petrol';
  if (q.includes('diesel')) parsed.fuelType = 'diesel';
  if (q.includes('hybride') || q.includes('hybrid')) parsed.fuelType = 'hybrid';
  if (q.includes('elektrisch') || q.includes('electric')) parsed.fuelType = 'electric';

  // Transmission
  if (q.includes('handgeschakeld') || q.includes('manual') || q.includes('handbak')) parsed.transmission = 'manual';
  if (q.includes('automaat') || q.includes('automatic')) parsed.transmission = 'automatic';

  // Sort hints
  if (q.includes('goedkoop') || q.includes('cheap') || q.includes('budget')) {
    parsed.sortBy = 'price';
    parsed.sortOrder = 'ASC';
  }
  if (q.includes('duur') || q.includes('expensive') || q.includes('exclusive')) {
    parsed.sortBy = 'price';
    parsed.sortOrder = 'DESC';
  }
  if (q.includes('snel') || q.includes('fast') || q.includes('krachtig') || q.includes('powerful')) {
    parsed.sortBy = 'horsepower';
    parsed.sortOrder = 'DESC';
  }
  if (q.includes('nieuw') || q.includes('new') || q.includes('recent') || q.includes('latest')) {
    parsed.sortBy = 'date_added';
    parsed.sortOrder = 'DESC';
  }

  // If no makes found and no other filters, do text search on remaining words
  if (parsed.makes.length === 0 && !parsed.priceMax && !parsed.priceMin && !parsed.horsepowerMin) {
    parsed.textSearch = input.trim();
  }

  return parsed;
}

function buildQuery(parsed: ParsedQuery): { sql: string; params: unknown[] } {
  const conditions: string[] = ["status = 'active'"];
  const params: unknown[] = [];

  if (parsed.makes.length > 0) {
    params.push(parsed.makes);
    conditions.push(`make = ANY($${params.length})`);
  }

  if (parsed.priceMin) {
    params.push(parsed.priceMin);
    conditions.push(`price >= $${params.length}`);
  }
  if (parsed.priceMax) {
    params.push(parsed.priceMax);
    conditions.push(`price <= $${params.length}`);
  }

  if (parsed.horsepowerMin) {
    params.push(parsed.horsepowerMin);
    conditions.push(`horsepower >= $${params.length}`);
  }
  if (parsed.horsepowerMax) {
    params.push(parsed.horsepowerMax);
    conditions.push(`horsepower <= $${params.length}`);
  }

  if (parsed.yearMin) {
    params.push(parsed.yearMin);
    conditions.push(`year >= $${params.length}`);
  }
  if (parsed.yearMax) {
    params.push(parsed.yearMax);
    conditions.push(`year <= $${params.length}`);
  }

  if (parsed.fuelType) {
    params.push(parsed.fuelType);
    conditions.push(`fuel_type = $${params.length}`);
  }

  if (parsed.transmission) {
    params.push(parsed.transmission);
    conditions.push(`transmission_type = $${params.length}`);
  }

  if (parsed.textSearch) {
    params.push(`%${parsed.textSearch}%`);
    conditions.push(`(make ILIKE $${params.length} OR model ILIKE $${params.length} OR title ILIKE $${params.length})`);
  }

  const sortBy = parsed.sortBy || 'date_added';
  const sortOrder = parsed.sortOrder || 'DESC';

  const sql = `SELECT id, title, make, model, year, price, horsepower, engine_displacement_cc, image_urls, date_added
    FROM listings
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${sortBy} ${sortOrder}
    LIMIT 50`;

  return { sql, params };
}

function parseNumber(str: string): number {
  let cleaned = str.replace(/\./g, '').replace(',', '.');
  let num = parseFloat(cleaned);
  // Handle "k" suffix (200k = 200000)
  if (str.toLowerCase().includes('k') || num < 1000) {
    if (num < 10000) num *= 1000;
  }
  return Math.round(num);
}
