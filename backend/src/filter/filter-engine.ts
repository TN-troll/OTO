import { createHash } from 'crypto';
import type {
  FilterCriteria,
  FilterResult,
  ListingSummary,
  ValidationResult,
  ValidationError,
  SoundFilterCriteria,
} from '@car-ads/shared';
import {
  DISPLACEMENT_MIN,
  DISPLACEMENT_MAX,
  HORSEPOWER_MIN,
  HORSEPOWER_MAX,
  YEAR_MIN,
  YEAR_MAX,
  PRICE_MIN,
  PRICE_MAX,
  DEFAULT_PAGE_SIZE,
} from '@car-ads/shared';
import type { SortField, SortOrder } from '@car-ads/shared';
import { query } from '../db/connection.js';
import { getRedisClient } from '../cache/redis.js';

const CACHE_TTL_SECONDS = 300; // 5 minutes

const SORT_COLUMN_MAP: Record<SortField, string> = {
  price: 'price',
  horsepower: 'horsepower',
  engineDisplacement: 'engine_displacement_cc',
  year: 'year',
  dateAdded: 'date_added',
};

export class FilterEngine {
  /**
   * Validate filter criteria before executing the query.
   * Returns errors for invalid ranges and out-of-bound values.
   */
  validateCriteria(criteria: FilterCriteria): ValidationResult {
    const errors: ValidationError[] = [];

    // Validate range: min must not exceed max
    if (
      criteria.engineDisplacementMin !== undefined &&
      criteria.engineDisplacementMax !== undefined &&
      criteria.engineDisplacementMin > criteria.engineDisplacementMax
    ) {
      errors.push({
        field: 'engineDisplacement',
        message: 'Minimum engine displacement must not exceed maximum',
      });
    }

    if (
      criteria.horsepowerMin !== undefined &&
      criteria.horsepowerMax !== undefined &&
      criteria.horsepowerMin > criteria.horsepowerMax
    ) {
      errors.push({
        field: 'horsepower',
        message: 'Minimum horsepower must not exceed maximum',
      });
    }

    if (
      criteria.yearMin !== undefined &&
      criteria.yearMax !== undefined &&
      criteria.yearMin > criteria.yearMax
    ) {
      errors.push({
        field: 'year',
        message: 'Minimum year must not exceed maximum',
      });
    }

    if (
      criteria.priceMin !== undefined &&
      criteria.priceMax !== undefined &&
      criteria.priceMin > criteria.priceMax
    ) {
      errors.push({
        field: 'price',
        message: 'Minimum price must not exceed maximum',
      });
    }

    // Validate field bounds
    if (criteria.engineDisplacementMin !== undefined && criteria.engineDisplacementMin < DISPLACEMENT_MIN) {
      errors.push({
        field: 'engineDisplacementMin',
        message: `Engine displacement minimum must be at least ${DISPLACEMENT_MIN}`,
      });
    }
    if (criteria.engineDisplacementMax !== undefined && criteria.engineDisplacementMax > DISPLACEMENT_MAX) {
      errors.push({
        field: 'engineDisplacementMax',
        message: `Engine displacement maximum must not exceed ${DISPLACEMENT_MAX}`,
      });
    }

    if (criteria.horsepowerMin !== undefined && criteria.horsepowerMin < HORSEPOWER_MIN) {
      errors.push({
        field: 'horsepowerMin',
        message: `Horsepower minimum must be at least ${HORSEPOWER_MIN}`,
      });
    }
    if (criteria.horsepowerMax !== undefined && criteria.horsepowerMax > HORSEPOWER_MAX) {
      errors.push({
        field: 'horsepowerMax',
        message: `Horsepower maximum must not exceed ${HORSEPOWER_MAX}`,
      });
    }

    if (criteria.yearMin !== undefined && criteria.yearMin < YEAR_MIN) {
      errors.push({
        field: 'yearMin',
        message: `Year minimum must be at least ${YEAR_MIN}`,
      });
    }
    if (criteria.yearMax !== undefined && criteria.yearMax > YEAR_MAX) {
      errors.push({
        field: 'yearMax',
        message: `Year maximum must not exceed ${YEAR_MAX}`,
      });
    }

    if (criteria.priceMin !== undefined && criteria.priceMin < PRICE_MIN) {
      errors.push({
        field: 'priceMin',
        message: `Price minimum must be at least ${PRICE_MIN}`,
      });
    }
    if (criteria.priceMax !== undefined && criteria.priceMax > PRICE_MAX) {
      errors.push({
        field: 'priceMax',
        message: `Price maximum must not exceed ${PRICE_MAX}`,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Execute a filtered query against the listings database.
   * Results are cached in Redis with a 5-minute TTL.
   */
  async query(criteria: FilterCriteria): Promise<FilterResult> {
    const validation = this.validateCriteria(criteria);
    if (!validation.valid) {
      throw new Error(`Invalid filter criteria: ${validation.errors.map((e) => e.message).join(', ')}`);
    }

    // Check cache first
    const cacheKey = this.buildCacheKey(criteria);
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const page = criteria.page ?? 1;
    const pageSize = criteria.pageSize ?? DEFAULT_PAGE_SIZE;
    const sortBy = criteria.sortBy ?? 'dateAdded';
    const sortOrder = criteria.sortOrder ?? 'desc';

    const { whereClause, params } = this.buildWhereClause(criteria);

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM listings l${this.needsSoundJoin(criteria) ? ' INNER JOIN sound_profiles sp ON l.sound_profile_id = sp.id' : ''} WHERE ${whereClause}`;
    const countResult = await query<{ count: string }>(countSql, params);
    const totalCount = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const sortColumn = SORT_COLUMN_MAP[sortBy];
    const orderDirection = sortOrder.toUpperCase();

    const dataSql = `SELECT l.id, l.title, l.image_urls, l.make, l.model, l.year, l.price, l.horsepower, l.engine_displacement_cc, l.date_added FROM listings l${this.needsSoundJoin(criteria) ? ' INNER JOIN sound_profiles sp ON l.sound_profile_id = sp.id' : ''} WHERE ${whereClause} ORDER BY l.${sortColumn} ${orderDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const dataResult = await query<{
      id: string;
      title: string;
      image_urls: string[];
      make: string;
      model: string;
      year: number;
      price: number;
      horsepower: number | null;
      engine_displacement_cc: number | null;
      date_added: Date;
    }>(dataSql, [...params, pageSize, offset]);

    const listings: ListingSummary[] = dataResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      primaryImageUrl: row.image_urls?.[0] ?? null,
      make: row.make,
      model: row.model,
      year: row.year,
      price: row.price,
      horsepower: row.horsepower,
      engineDisplacementCc: row.engine_displacement_cc,
      dateAdded: row.date_added,
    }));

    const totalPages = Math.ceil(totalCount / pageSize);

    const result: FilterResult = {
      listings,
      totalCount,
      page,
      pageSize,
      totalPages,
    };

    // Cache the result
    await this.setInCache(cacheKey, result);

    return result;
  }

  private needsSoundJoin(criteria: FilterCriteria): boolean {
    const sp = criteria.soundProfile;
    if (!sp) return false;
    return !!(
      sp.engineConfiguration?.length ||
      sp.cylinderCount?.length ||
      sp.forcedInduction?.length ||
      sp.exhaustNote?.length
    );
  }

  private buildWhereClause(criteria: FilterCriteria): { whereClause: string; params: unknown[] } {
    const conditions: string[] = ["l.status = 'active'"];
    const params: unknown[] = [];

    // Engine displacement range
    if (criteria.engineDisplacementMin !== undefined) {
      params.push(criteria.engineDisplacementMin);
      conditions.push(`l.engine_displacement_cc >= $${params.length}`);
    }
    if (criteria.engineDisplacementMax !== undefined) {
      params.push(criteria.engineDisplacementMax);
      conditions.push(`l.engine_displacement_cc <= $${params.length}`);
    }

    // Horsepower range
    if (criteria.horsepowerMin !== undefined) {
      params.push(criteria.horsepowerMin);
      conditions.push(`l.horsepower >= $${params.length}`);
    }
    if (criteria.horsepowerMax !== undefined) {
      params.push(criteria.horsepowerMax);
      conditions.push(`l.horsepower <= $${params.length}`);
    }

    // Year range
    if (criteria.yearMin !== undefined) {
      params.push(criteria.yearMin);
      conditions.push(`l.year >= $${params.length}`);
    }
    if (criteria.yearMax !== undefined) {
      params.push(criteria.yearMax);
      conditions.push(`l.year <= $${params.length}`);
    }

    // Price range
    if (criteria.priceMin !== undefined) {
      params.push(criteria.priceMin);
      conditions.push(`l.price >= $${params.length}`);
    }
    if (criteria.priceMax !== undefined) {
      params.push(criteria.priceMax);
      conditions.push(`l.price <= $${params.length}`);
    }

    // Transmission type (array of allowed values)
    if (criteria.transmissionType?.length) {
      params.push(criteria.transmissionType);
      conditions.push(`l.transmission_type = ANY($${params.length})`);
    }

    // Fuel type (array of allowed values)
    if (criteria.fuelType?.length) {
      params.push(criteria.fuelType);
      conditions.push(`l.fuel_type = ANY($${params.length})`);
    }

    // Sound profile filters
    if (this.needsSoundJoin(criteria)) {
      // Exclude listings with unclassified sound profile
      conditions.push('l.sound_profile_id IS NOT NULL');

      const sp = criteria.soundProfile!;

      if (sp.engineConfiguration?.length) {
        params.push(sp.engineConfiguration);
        conditions.push(`sp.engine_configuration = ANY($${params.length})`);
      }
      if (sp.cylinderCount?.length) {
        params.push(sp.cylinderCount);
        conditions.push(`sp.cylinder_count = ANY($${params.length})`);
      }
      if (sp.forcedInduction?.length) {
        params.push(sp.forcedInduction);
        conditions.push(`sp.forced_induction = ANY($${params.length})`);
      }
      if (sp.exhaustNote?.length) {
        params.push(sp.exhaustNote);
        conditions.push(`sp.exhaust_note = ANY($${params.length})`);
      }
    }

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  }

  private buildCacheKey(criteria: FilterCriteria): string {
    const normalized = JSON.stringify(criteria, Object.keys(criteria).sort());
    const hash = createHash('sha256').update(normalized).digest('hex');
    return `filter:${hash}`;
  }

  private async getFromCache(key: string): Promise<FilterResult | null> {
    try {
      const redis = getRedisClient();
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as FilterResult;
      }
    } catch {
      // Cache miss or Redis error — proceed without cache
    }
    return null;
  }

  private async setInCache(key: string, result: FilterResult): Promise<void> {
    try {
      const redis = getRedisClient();
      await redis.set(key, JSON.stringify(result), { EX: CACHE_TTL_SECONDS });
    } catch {
      // Cache write failure — non-critical, proceed silently
    }
  }
}
