import { DUTCH_CITY_COORDS } from './geocoding.js';

/**
 * Known non-Dutch location patterns — cities/regions that indicate a foreign listing.
 * Case-insensitive matching.
 */
const FOREIGN_PATTERNS = [
  // Spain
  'marbella', 'barcelona', 'madrid', 'malaga', 'valencia', 'ibiza', 'sevilla',
  // Germany
  'münchen', 'munich', 'berlin', 'hamburg', 'frankfurt', 'düsseldorf', 'köln', 'stuttgart',
  // Belgium (only if explicitly Belgian cities, not border towns)
  'brussel', 'brussels', 'antwerpen', 'gent', 'luik', 'liège',
  // France
  'paris', 'monaco', 'nice', 'lyon', 'cannes',
  // Italy
  'milano', 'milan', 'roma', 'rome', 'torino',
  // UK
  'london', 'manchester', 'birmingham',
  // Other
  'dubai', 'abu dhabi', 'zürich', 'genève', 'geneva', 'wien', 'vienna',
];

/**
 * Check if a location is within the Netherlands.
 * Returns true if:
 * - Location matches a known Dutch city in our geocoding table
 * - Location is null/empty (we allow these — they might be NL without specific city)
 * - Location doesn't match any known foreign pattern
 *
 * Returns false if location matches a known foreign city.
 */
export function isDutchLocation(location: string | null | undefined): boolean {
  if (!location || location.trim() === '') return true; // Allow null/empty

  const normalized = location.trim().toLowerCase();

  // If it's in our Dutch city table, it's definitely Dutch
  if (DUTCH_CITY_COORDS.has(normalized)) return true;

  // Check against known foreign patterns
  for (const pattern of FOREIGN_PATTERNS) {
    if (normalized.includes(pattern)) return false;
  }

  // If location contains country indicators, reject
  if (normalized.includes('spain') || normalized.includes('españa') ||
      normalized.includes('germany') || normalized.includes('deutschland') ||
      normalized.includes('france') || normalized.includes('italy') ||
      normalized.includes('italia') || normalized.includes('belgium') ||
      normalized.includes('belgique') || normalized.includes('uk') ||
      normalized.includes('united kingdom') || normalized.includes('schweiz') ||
      normalized.includes('österreich') || normalized.includes('portugal')) {
    return false;
  }

  // Default: allow (might be a small NL town not in our table)
  return true;
}
