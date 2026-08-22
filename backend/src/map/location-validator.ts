import { DUTCH_CITY_COORDS } from './geocoding.js';

/**
 * Dutch postal code pattern: 4 digits followed by optional space and 2 letters.
 * Examples: "1012 AB", "3011AB", "1234 XY"
 */
const DUTCH_POSTAL_CODE_REGEX = /\b[1-9]\d{3}\s?[A-Z]{2}\b/i;

/**
 * Dutch province names (both official and common variants).
 */
const DUTCH_PROVINCES = [
  'noord-holland', 'zuid-holland', 'noord-brabant', 'zuid-holland',
  'gelderland', 'utrecht', 'overijssel', 'limburg', 'friesland',
  'groningen', 'drenthe', 'flevoland', 'zeeland',
  // Common abbreviations/variants
  'n-holland', 'z-holland', 'n-brabant', 'n.h.', 'z.h.', 'n.b.',
  'fryslân', 'fryslan',
];

/**
 * Extract all city names from the geocoding table for partial matching.
 */
const DUTCH_CITY_NAMES: string[] = Array.from(DUTCH_CITY_COORDS.keys());

/**
 * Check if a location is within the Netherlands using a STRICT whitelist approach.
 * 
 * Returns true ONLY if:
 * - Location is null/empty (allowed — might be NL without tagged city)
 * - Contains a Dutch postal code (1234 AB pattern)
 * - Exact match in Dutch city geocoding table
 * - Contains a known Dutch province name
 * - Contains a Dutch city name as a substring (e.g., "Amsterdam, Noord-Holland" matches "amsterdam")
 * 
 * Returns false for EVERYTHING else (strict by default).
 */
export function isDutchLocation(location: string | null | undefined): boolean {
  if (!location || location.trim() === '') return true;

  const normalized = location.trim().toLowerCase();

  // 1. Exact match in Dutch city table
  if (DUTCH_CITY_COORDS.has(normalized)) return true;

  // 2. Contains a Dutch postal code
  if (DUTCH_POSTAL_CODE_REGEX.test(location)) return true;

  // 3. Contains a Dutch province name
  for (const province of DUTCH_PROVINCES) {
    if (normalized.includes(province)) return true;
  }

  // 4. Contains a known Dutch city name as substring
  // e.g., "Amsterdam, Noord-Holland" → contains "amsterdam"
  for (const city of DUTCH_CITY_NAMES) {
    if (city.length >= 4 && normalized.includes(city)) return true;
  }

  // 5. Check if a Dutch city name contains the location (reverse match)
  // e.g., location "amstelveen" might be a truncated version
  if (normalized.length >= 4) {
    for (const city of DUTCH_CITY_NAMES) {
      if (city.includes(normalized)) return true;
    }
  }

  // STRICT: reject anything that doesn't match Dutch patterns
  return false;
}
