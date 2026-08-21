import { query } from '../db/connection.js';
import { SEARCH_QUERY_MIN_LENGTH, SEARCH_QUERY_MAX_LENGTH } from '@car-ads/shared';
import type { ListingSummary, ValidationResult, FilterCriteria } from '@car-ads/shared';

/**
 * Default abbreviation map for common car make short forms.
 * Maps known abbreviations/alternate names to their canonical make names.
 */
const DEFAULT_ABBREVIATIONS: Record<string, string> = {
  merc: 'Mercedes-Benz',
  mercedes: 'Mercedes-Benz',
  chevy: 'Chevrolet',
  lambo: 'Lamborghini',
  beemer: 'BMW',
  bimmer: 'BMW',
  vette: 'Corvette',
  porsche: 'Porsche',
  astonmartin: 'Aston Martin',
  aston: 'Aston Martin',
};

export interface SearchResult {
  listings: ListingSummary[];
  totalCount: number;
  expandedQuery: string | null;
  suggestions: string[];
}

/**
 * Search Service implementation.
 *
 * Provides case-insensitive search across listing make, model, and title fields
 * with abbreviation expansion, query validation, and suggestion generation.
 * Designed to integrate with the filter engine via FilterCriteria.searchQuery.
 */
export class SearchService {
  private abbreviations: Record<string, string>;

  constructor(abbreviations?: Record<string, string>) {
    this.abbreviations = abbreviations ?? { ...DEFAULT_ABBREVIATIONS };
  }

  /**
   * Validate a search query against length constraints.
   * - Less than 2 characters: invalid (no search should be performed)
   * - More than 100 characters: invalid (rejected with error)
   */
  validateQuery(queryText: string): ValidationResult {
    const errors: { field: string; message: string }[] = [];

    if (queryText.length < SEARCH_QUERY_MIN_LENGTH) {
      errors.push({
        field: 'searchQuery',
        message: `Search query must be at least ${SEARCH_QUERY_MIN_LENGTH} characters`,
      });
    }

    if (queryText.length > SEARCH_QUERY_MAX_LENGTH) {
      errors.push({
        field: 'searchQuery',
        message: `Search query must not exceed ${SEARCH_QUERY_MAX_LENGTH} characters`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Expand a query using the abbreviation map.
   * Performs case-insensitive lookup against known abbreviations.
   * Returns the expanded form if found, otherwise returns the original query.
   */
  expandAbbreviation(queryText: string): string {
    const normalized = queryText.toLowerCase().trim();
    if (Object.hasOwn(this.abbreviations, normalized)) {
      return this.abbreviations[normalized];
    }
    return queryText;
  }

  /**
   * Execute a search query against listings.
   * - Validates query length
   * - Expands abbreviations
   * - Performs case-insensitive ILIKE search on make, model, and title
   * - Combines with active filter criteria if provided
   * - Returns suggestions when no results are found
   */
  async search(queryText: string, filters?: FilterCriteria): Promise<SearchResult> {
    const validation = this.validateQuery(queryText);

    if (!validation.valid) {
      // For queries that are too short, return empty results without error
      if (queryText.length < SEARCH_QUERY_MIN_LENGTH) {
        return {
          listings: [],
          totalCount: 0,
          expandedQuery: null,
          suggestions: [],
        };
      }
      // For queries that are too long, throw an error
      throw new SearchValidationError(validation.errors[0].message);
    }

    const expanded = this.expandAbbreviation(queryText);
    const wasExpanded = expanded !== queryText;
    const searchTerm = expanded;

    // Build query with ILIKE for case-insensitive matching
    const { sql, params } = this.buildSearchQuery(searchTerm, filters);

    const result = await query<{
      id: string;
      title: string;
      make: string;
      model: string;
      year: number;
      price: number;
      horsepower: number | null;
      engine_displacement_cc: number | null;
      image_urls: string[];
      date_added: Date;
      snippet: string | null;
    }>(sql, params);

    const listings: ListingSummary[] = result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      primaryImageUrl: row.image_urls.length > 0 ? row.image_urls[0] : null,
      imageUrls: (row.image_urls ?? []).slice(0, 4),
      make: row.make,
      model: row.model,
      year: row.year,
      price: row.price,
      horsepower: row.horsepower,
      engineDisplacementCc: row.engine_displacement_cc,
      dateAdded: row.date_added,
      snippet: row.snippet ? row.snippet.replace(/\n/g, ' ').trim() : null,
    }));

    // Generate suggestions when no results found
    let suggestions: string[] = [];
    if (listings.length === 0) {
      suggestions = await this.getSuggestions(searchTerm);
    }

    return {
      listings,
      totalCount: listings.length,
      expandedQuery: wasExpanded ? expanded : null,
      suggestions,
    };
  }

  /**
   * Generate search suggestions based on available makes and models in the database.
   * Uses trigram similarity (pg_trgm) or prefix matching to find similar terms.
   */
  async getSuggestions(queryText: string): Promise<string[]> {
    const searchPattern = `%${queryText}%`;

    // Query distinct makes and models that are similar to the search term
    const result = await query<{ suggestion: string }>(
      `SELECT DISTINCT make AS suggestion FROM listings
       WHERE status = 'active' AND make ILIKE $1
       UNION
       SELECT DISTINCT model AS suggestion FROM listings
       WHERE status = 'active' AND model ILIKE $1
       LIMIT 5`,
      [searchPattern],
    );

    if (result.rows.length > 0) {
      return result.rows.map((row) => row.suggestion);
    }

    // Fallback: return some available makes when no similar terms found
    const fallback = await query<{ suggestion: string }>(
      `SELECT DISTINCT make AS suggestion FROM listings
       WHERE status = 'active'
       ORDER BY make
       LIMIT 5`,
    );

    return fallback.rows.map((row) => row.suggestion);
  }

  /**
   * Update the abbreviation map with new entries.
   */
  updateAbbreviations(newAbbreviations: Record<string, string>): void {
    this.abbreviations = { ...this.abbreviations, ...newAbbreviations };
  }

  /**
   * Get the current abbreviation map.
   */
  getAbbreviations(): Record<string, string> {
    return { ...this.abbreviations };
  }

  /**
   * Build a SQL query for search with optional filter criteria.
   */
  private buildSearchQuery(
    searchTerm: string,
    filters?: FilterCriteria,
  ): { sql: string; params: unknown[] } {
    const conditions: string[] = ['status = \'active\''];
    const params: unknown[] = [];
    let paramIndex = 1;

    // Add search condition: match against make, model, or title (case-insensitive)
    const searchPattern = `%${searchTerm}%`;
    conditions.push(
      `(make ILIKE $${paramIndex} OR model ILIKE $${paramIndex} OR title ILIKE $${paramIndex})`,
    );
    params.push(searchPattern);
    paramIndex++;

    // Apply additional filter criteria if provided
    if (filters) {
      if (filters.engineDisplacementMin != null) {
        conditions.push(`engine_displacement_cc >= $${paramIndex}`);
        params.push(filters.engineDisplacementMin);
        paramIndex++;
      }
      if (filters.engineDisplacementMax != null) {
        conditions.push(`engine_displacement_cc <= $${paramIndex}`);
        params.push(filters.engineDisplacementMax);
        paramIndex++;
      }
      if (filters.horsepowerMin != null) {
        conditions.push(`horsepower >= $${paramIndex}`);
        params.push(filters.horsepowerMin);
        paramIndex++;
      }
      if (filters.horsepowerMax != null) {
        conditions.push(`horsepower <= $${paramIndex}`);
        params.push(filters.horsepowerMax);
        paramIndex++;
      }
      if (filters.yearMin != null) {
        conditions.push(`year >= $${paramIndex}`);
        params.push(filters.yearMin);
        paramIndex++;
      }
      if (filters.yearMax != null) {
        conditions.push(`year <= $${paramIndex}`);
        params.push(filters.yearMax);
        paramIndex++;
      }
      if (filters.priceMin != null) {
        conditions.push(`price >= $${paramIndex}`);
        params.push(filters.priceMin);
        paramIndex++;
      }
      if (filters.priceMax != null) {
        conditions.push(`price <= $${paramIndex}`);
        params.push(filters.priceMax);
        paramIndex++;
      }
      if (filters.transmissionType && filters.transmissionType.length > 0) {
        conditions.push(`transmission_type = ANY($${paramIndex})`);
        params.push(filters.transmissionType);
        paramIndex++;
      }
      if (filters.fuelType && filters.fuelType.length > 0) {
        conditions.push(`fuel_type = ANY($${paramIndex})`);
        params.push(filters.fuelType);
        paramIndex++;
      }
    }

    const whereClause = conditions.join(' AND ');
    const sql = `SELECT id, title, make, model, year, price, horsepower, engine_displacement_cc, image_urls, date_added, LEFT(description, 150) AS snippet
                 FROM listings
                 WHERE ${whereClause}
                 ORDER BY date_added DESC`;

    return { sql, params };
  }
}

/**
 * Custom error for search validation failures (query too long).
 */
export class SearchValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SearchValidationError';
  }
}
