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
  PERFORMANCE_PRESETS,
} from '@car-ads/shared';
import type {
  SortField,
  SortOrder,
  DrivetrainType,
  ConditionType,
  EngineDetailConfiguration,
  ForcedInductionDetail,
  HeritageEra,
  PerformancePresetId,
  SellerType,
} from '@car-ads/shared';

// ─── Valid value sets for runtime validation ────────────────────────────────────

const VALID_DRIVETRAIN_VALUES: DrivetrainType[] = ['rwd', 'fwd', 'awd'];
const VALID_CONDITION_VALUES: ConditionType[] = ['new', 'used', 'classic'];
const VALID_ENGINE_DETAIL_CONFIGURATION_VALUES: EngineDetailConfiguration[] = [
  'inline-4', 'inline-6', 'v6', 'v8', 'v10', 'v12', 'flat-4', 'flat-6', 'w12', 'rotary',
];
const VALID_FORCED_INDUCTION_DETAIL_VALUES: ForcedInductionDetail[] = [
  'naturally_aspirated', 'turbocharged', 'supercharged', 'twin_turbo',
];
const VALID_HERITAGE_ERA_VALUES: HeritageEra[] = ['classic', 'modern_classic', 'contemporary'];
const VALID_SELLER_TYPE_VALUES: SellerType[] = ['dealer', 'private'];
const VALID_PERFORMANCE_PRESET_IDS: PerformancePresetId[] = [
  'v8_grand_tourers', 'track_weapons', 'daily_luxury', 'classic_collectibles',
];
import { query } from '../db/connection.js';
import { getRedisClient } from '../cache/redis.js';

const CACHE_TTL_SECONDS = 300; // 5 minutes

/** Parameters for cursor-based pagination */
export interface CursorPaginationParams {
  cursor?: string;                // opaque cursor from previous response
  limit: number;
  filters: FilterCriteria;
  sort?: { field: SortField; order: SortOrder };
}

/** Response for cursor-based pagination */
export interface CursorPaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;      // null means no more pages
  totalCount: number;
}

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

    if (
      criteria.mileageMin !== undefined &&
      criteria.mileageMax !== undefined &&
      criteria.mileageMin > criteria.mileageMax
    ) {
      errors.push({
        field: 'mileage',
        message: 'Minimum mileage must not exceed maximum',
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

    // ─── New filter field validation ──────────────────────────────────────────

    // Drivetrain: each value must be a valid DrivetrainType
    if (criteria.drivetrain?.length) {
      for (const value of criteria.drivetrain) {
        if (!VALID_DRIVETRAIN_VALUES.includes(value as DrivetrainType)) {
          errors.push({
            field: 'drivetrain',
            message: `Invalid drivetrain value: '${value}'. Must be one of: ${VALID_DRIVETRAIN_VALUES.join(', ')}`,
          });
          break;
        }
      }
    }

    // Condition: each value must be a valid ConditionType
    if (criteria.condition?.length) {
      for (const value of criteria.condition) {
        if (!VALID_CONDITION_VALUES.includes(value as ConditionType)) {
          errors.push({
            field: 'condition',
            message: `Invalid condition value: '${value}'. Must be one of: ${VALID_CONDITION_VALUES.join(', ')}`,
          });
          break;
        }
      }
    }

    // Engine detail configuration: each value must be valid
    if (criteria.engineDetailConfiguration?.length) {
      for (const value of criteria.engineDetailConfiguration) {
        if (!VALID_ENGINE_DETAIL_CONFIGURATION_VALUES.includes(value as EngineDetailConfiguration)) {
          errors.push({
            field: 'engineDetailConfiguration',
            message: `Invalid engine detail configuration value: '${value}'. Must be one of: ${VALID_ENGINE_DETAIL_CONFIGURATION_VALUES.join(', ')}`,
          });
          break;
        }
      }
    }

    // Forced induction detail: each value must be valid
    if (criteria.forcedInductionDetail?.length) {
      for (const value of criteria.forcedInductionDetail) {
        if (!VALID_FORCED_INDUCTION_DETAIL_VALUES.includes(value as ForcedInductionDetail)) {
          errors.push({
            field: 'forcedInductionDetail',
            message: `Invalid forced induction detail value: '${value}'. Must be one of: ${VALID_FORCED_INDUCTION_DETAIL_VALUES.join(', ')}`,
          });
          break;
        }
      }
    }

    // Heritage era: each value must be valid
    if (criteria.heritageEra?.length) {
      for (const value of criteria.heritageEra) {
        if (!VALID_HERITAGE_ERA_VALUES.includes(value as HeritageEra)) {
          errors.push({
            field: 'heritageEra',
            message: `Invalid heritage era value: '${value}'. Must be one of: ${VALID_HERITAGE_ERA_VALUES.join(', ')}`,
          });
          break;
        }
      }
    }

    // Seller type: each value must be valid
    if (criteria.sellerType?.length) {
      for (const value of criteria.sellerType) {
        if (!VALID_SELLER_TYPE_VALUES.includes(value as SellerType)) {
          errors.push({
            field: 'sellerType',
            message: `Invalid seller type value: '${value}'. Must be one of: ${VALID_SELLER_TYPE_VALUES.join(', ')}`,
          });
          break;
        }
      }
    }

    // Doors: each value must be a positive integer
    if (criteria.doors?.length) {
      for (const value of criteria.doors) {
        if (!Number.isInteger(value) || value <= 0) {
          errors.push({
            field: 'doors',
            message: `Invalid doors value: '${value}'. Must be a positive integer`,
          });
          break;
        }
      }
    }

    // Seats: each value must be a positive integer
    if (criteria.seats?.length) {
      for (const value of criteria.seats) {
        if (!Number.isInteger(value) || value <= 0) {
          errors.push({
            field: 'seats',
            message: `Invalid seats value: '${value}'. Must be a positive integer`,
          });
          break;
        }
      }
    }

    // Acceleration max: must be a positive number
    if (criteria.accelerationMax !== undefined) {
      if (typeof criteria.accelerationMax !== 'number' || criteria.accelerationMax <= 0) {
        errors.push({
          field: 'accelerationMax',
          message: 'Acceleration max must be a positive number',
        });
      }
    }

    // Top speed min: must be a positive number
    if (criteria.topSpeedMin !== undefined) {
      if (typeof criteria.topSpeedMin !== 'number' || criteria.topSpeedMin <= 0) {
        errors.push({
          field: 'topSpeedMin',
          message: 'Top speed min must be a positive number',
        });
      }
    }

    // isSpecialEdition: must be a boolean when present
    if (criteria.isSpecialEdition !== undefined) {
      if (typeof criteria.isSpecialEdition !== 'boolean') {
        errors.push({
          field: 'isSpecialEdition',
          message: 'isSpecialEdition must be a boolean',
        });
      }
    }

    // Performance preset: must be a valid preset ID when present
    if (criteria.performancePreset !== undefined && criteria.performancePreset !== null) {
      if (!VALID_PERFORMANCE_PRESET_IDS.includes(criteria.performancePreset as PerformancePresetId)) {
        errors.push({
          field: 'performancePreset',
          message: `Invalid performance preset: '${criteria.performancePreset}'. Must be one of: ${VALID_PERFORMANCE_PRESET_IDS.join(', ')}`,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Build WHERE clause conditions and params from filter criteria.
   * Public method for use by other endpoints (e.g. map) that need to apply
   * the same filter logic without pagination/sorting.
   */
  buildFilterConditions(criteria: FilterCriteria): { conditions: string[]; params: unknown[] } {
    const expandedCriteria = this.expandPerformancePreset(criteria);
    const { whereClause, params } = this.buildWhereClause(expandedCriteria);
    return { conditions: [whereClause], params };
  }

  /**
   * Execute a filtered query against the listings database.
   * Results are cached in Redis with a 5-minute TTL.
   */
  async query(criteria: FilterCriteria): Promise<FilterResult> {
    // Expand performance preset into compound filter values before validation
    const expandedCriteria = this.expandPerformancePreset(criteria);

    const validation = this.validateCriteria(expandedCriteria);
    if (!validation.valid) {
      throw new Error(`Invalid filter criteria: ${validation.errors.map((e) => e.message).join(', ')}`);
    }

    // Check cache first
    const cacheKey = this.buildCacheKey(expandedCriteria);
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const page = expandedCriteria.page ?? 1;
    const pageSize = expandedCriteria.pageSize ?? DEFAULT_PAGE_SIZE;
    const sortBy = expandedCriteria.sortBy ?? 'dateAdded';
    const sortOrder = expandedCriteria.sortOrder ?? 'desc';

    const { whereClause, params } = this.buildWhereClause(expandedCriteria);

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM listings l${this.needsSoundJoin(expandedCriteria) ? ' INNER JOIN sound_profiles sp ON l.sound_profile_id = sp.id' : ''} WHERE ${whereClause}`;
    const countResult = await query<{ count: string }>(countSql, params);
    const totalCount = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const sortColumn = SORT_COLUMN_MAP[sortBy];
    const orderDirection = sortOrder.toUpperCase();

    const dataSql = `SELECT l.id, l.title, l.image_urls, l.make, l.model, l.year, l.price, l.horsepower, l.engine_displacement_cc, l.mileage, l.fuel_type, l.location, l.seller_type, l.date_added, l.status, l.is_featured, l.sound_profile_id, LEFT(l.description, 150) AS snippet, LEFT(l.description_en, 150) AS snippet_en FROM listings l${this.needsSoundJoin(expandedCriteria) ? ' INNER JOIN sound_profiles sp ON l.sound_profile_id = sp.id' : ''} WHERE ${whereClause} ORDER BY (l.is_featured = TRUE AND l.status = 'active') DESC, l.featured_sort_order ASC, l.${sortColumn} ${orderDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

    const dataResult = await query<{
      id: string;
      title: string;
      image_urls: string[];
      make: string;
      model: string;
      year: number;
      price: string | number;
      horsepower: number | null;
      engine_displacement_cc: number | null;
      mileage: number | null;
      fuel_type: string | null;
      location: string | null;
      seller_type: string | null;
      date_added: Date;
      status: 'active' | 'sold' | 'stale';
      is_featured: boolean;
      sound_profile_id: string | null;
      snippet: string | null;
      snippet_en: string | null;
    }>(dataSql, [...params, pageSize, offset]);

    const listings: ListingSummary[] = dataResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      primaryImageUrl: row.image_urls?.[0] ?? null,
      imageUrls: (row.image_urls ?? []).slice(0, 4),
      make: row.make,
      model: row.model,
      year: row.year,
      price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
      horsepower: row.horsepower,
      engineDisplacementCc: row.engine_displacement_cc,
      mileage: row.mileage,
      fuelType: row.fuel_type,
      location: row.location,
      sellerType: row.seller_type,
      marketAvgPrice: null,
      dateAdded: row.date_added,
      status: row.status,
      isFeatured: row.is_featured,
      hasSoundClip: !!row.sound_profile_id,
      snippet: row.snippet ? row.snippet.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim() : null,
      snippetEn: row.snippet_en ? row.snippet_en.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim() : null,
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

  /**
   * Execute a filtered query using cursor-based pagination.
   * The cursor encodes the offset position as a base64 string.
   * Fetches limit+1 items to determine if there's a next page.
   */
  async queryCursor(params: CursorPaginationParams): Promise<CursorPaginatedResponse<ListingSummary>> {
    const { cursor, limit, filters, sort } = params;

    // Expand performance preset into compound filter values before validation
    const expandedFilters = this.expandPerformancePreset(filters);

    const validation = this.validateCriteria(expandedFilters);
    if (!validation.valid) {
      throw new Error(`Invalid filter criteria: ${validation.errors.map((e) => e.message).join(', ')}`);
    }

    const offset = cursor ? this.decodeCursor(cursor) : 0;
    const sortBy = sort?.sortBy ?? sort?.field ?? expandedFilters.sortBy ?? 'dateAdded';
    const sortOrder = sort?.sortOrder ?? sort?.order ?? expandedFilters.sortOrder ?? 'desc';

    const { whereClause, params: queryParams } = this.buildWhereClause(expandedFilters);

    // Get total count
    const countSql = `SELECT COUNT(*) as count FROM listings l${this.needsSoundJoin(expandedFilters) ? ' INNER JOIN sound_profiles sp ON l.sound_profile_id = sp.id' : ''} WHERE ${whereClause}`;
    const countResult = await query<{ count: string }>(countSql, queryParams);
    const totalCount = parseInt(countResult.rows[0]?.count ?? '0', 10);

    // Fetch limit+1 to determine if there's a next page
    const sortColumn = SORT_COLUMN_MAP[sortBy];
    const orderDirection = sortOrder.toUpperCase();
    const fetchCount = limit + 1;

    const dataSql = `SELECT l.id, l.title, l.image_urls, l.make, l.model, l.year, l.price, l.horsepower, l.engine_displacement_cc, l.mileage, l.fuel_type, l.location, l.seller_type, l.date_added, l.status, l.is_featured, l.sound_profile_id, LEFT(l.description, 150) AS snippet, LEFT(l.description_en, 150) AS snippet_en FROM listings l${this.needsSoundJoin(expandedFilters) ? ' INNER JOIN sound_profiles sp ON l.sound_profile_id = sp.id' : ''} WHERE ${whereClause} ORDER BY (l.is_featured = TRUE AND l.status = 'active') DESC, l.featured_sort_order ASC, l.${sortColumn} ${orderDirection} LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;

    const dataResult = await query<{
      id: string;
      title: string;
      image_urls: string[];
      make: string;
      model: string;
      year: number;
      price: string | number;
      horsepower: number | null;
      engine_displacement_cc: number | null;
      mileage: number | null;
      fuel_type: string | null;
      location: string | null;
      seller_type: string | null;
      date_added: Date;
      status: 'active' | 'sold' | 'stale';
      is_featured: boolean;
      sound_profile_id: string | null;
      snippet: string | null;
      snippet_en: string | null;
    }>(dataSql, [...queryParams, fetchCount, offset]);

    const hasMore = dataResult.rows.length > limit;
    const rows = hasMore ? dataResult.rows.slice(0, limit) : dataResult.rows;

    const items: ListingSummary[] = rows.map((row) => ({
      id: row.id,
      title: row.title,
      primaryImageUrl: row.image_urls?.[0] ?? null,
      imageUrls: (row.image_urls ?? []).slice(0, 4),
      make: row.make,
      model: row.model,
      year: row.year,
      price: typeof row.price === 'string' ? parseFloat(row.price) : row.price,
      horsepower: row.horsepower,
      engineDisplacementCc: row.engine_displacement_cc,
      mileage: row.mileage,
      fuelType: row.fuel_type,
      location: row.location,
      sellerType: row.seller_type,
      marketAvgPrice: null,
      dateAdded: row.date_added,
      status: row.status,
      isFeatured: row.is_featured,
      hasSoundClip: !!row.sound_profile_id,
      snippet: row.snippet ? row.snippet.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim() : null,
      snippetEn: row.snippet_en ? row.snippet_en.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim() : null,
    }));

    const nextCursor = hasMore ? this.encodeCursor(offset + limit) : null;

    return {
      items,
      nextCursor,
      totalCount,
    };
  }

  /**
   * Encode an offset into an opaque cursor string (base64).
   */
  private encodeCursor(offset: number): string {
    return Buffer.from(String(offset)).toString('base64');
  }

  /**
   * Decode an opaque cursor string back into an offset number.
   * Throws if the cursor is invalid.
   */
  private decodeCursor(cursor: string): number {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf8');
      const offset = parseInt(decoded, 10);
      if (isNaN(offset) || offset < 0) {
        throw new Error('Invalid cursor value');
      }
      return offset;
    } catch {
      throw new Error('Invalid cursor: unable to decode');
    }
  }

  /**
   * Expand a performance preset into compound filter values.
   * Preset filters act as defaults — explicit user values take precedence.
   * Returns a new criteria object without the performancePreset field.
   */
  expandPerformancePreset(criteria: FilterCriteria): FilterCriteria {
    if (!criteria.performancePreset) {
      return criteria;
    }

    const preset = PERFORMANCE_PRESETS.find((p) => p.id === criteria.performancePreset);
    if (!preset) {
      // Unknown preset — strip the field and continue with criteria as-is
      const { performancePreset: _, ...rest } = criteria;
      return rest;
    }

    // Merge: preset filters act as defaults, explicit user values take precedence
    const { performancePreset: _, ...userCriteria } = criteria;
    const merged: FilterCriteria = { ...preset.filters, ...userCriteria };

    // For array fields, use user values if provided (non-empty), otherwise preset values
    const arrayFields = [
      'makes', 'models', 'transmissionType', 'fuelType', 'bodyType',
      'drivetrain', 'color', 'sellerType', 'doors', 'seats', 'condition',
      'engineDetailConfiguration', 'forcedInductionDetail', 'heritageEra',
    ] as const;

    for (const field of arrayFields) {
      const userValue = userCriteria[field] as unknown[] | undefined;
      const presetValue = preset.filters[field] as unknown[] | undefined;
      if (userValue?.length) {
        (merged as Record<string, unknown>)[field] = userValue;
      } else if (presetValue?.length) {
        (merged as Record<string, unknown>)[field] = presetValue;
      }
    }

    // For soundProfile, merge nested object: user values override preset sub-fields
    if (preset.filters.soundProfile || userCriteria.soundProfile) {
      merged.soundProfile = {
        ...preset.filters.soundProfile,
        ...userCriteria.soundProfile,
      };
    }

    return merged;
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
    const conditions: string[] = [];
    const params: unknown[] = [];

    // Status filtering: never include 'stale' listings in user-facing results
    if (criteria.showSold) {
      conditions.push("l.status IN ('active', 'sold')");
    } else {
      conditions.push("l.status = 'active'");
    }

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

    // Mileage range
    if (criteria.mileageMin !== undefined) {
      params.push(criteria.mileageMin);
      conditions.push(`l.mileage >= $${params.length}`);
    }
    if (criteria.mileageMax !== undefined) {
      params.push(criteria.mileageMax);
      conditions.push(`l.mileage <= $${params.length}`);
    }

    // Makes (array of allowed values)
    if (criteria.makes?.length) {
      params.push(criteria.makes);
      conditions.push(`l.make = ANY($${params.length})`);
    }

    // Models (array of allowed values)
    if (criteria.models?.length) {
      params.push(criteria.models);
      conditions.push(`l.model = ANY($${params.length})`);
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

    // Body type (array of allowed values)
    if (criteria.bodyType?.length) {
      params.push(criteria.bodyType);
      conditions.push(`l.body_type = ANY($${params.length})`);
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

    // Location (case-insensitive exact match)
    if (criteria.location) {
      params.push(criteria.location);
      conditions.push(`LOWER(l.location) = LOWER($${params.length})`);
    }

    // New premium filter fields
    this.buildNewFieldClauses(criteria, conditions, params);

    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  }

  /**
   * Build WHERE clause conditions for the new premium filter fields:
   * drivetrain, color, sellerType, doors, seats, condition,
   * engineDetailConfiguration, forcedInductionDetail, heritageEra,
   * isSpecialEdition, accelerationMax, topSpeedMin.
   */
  private buildNewFieldClauses(criteria: FilterCriteria, conditions: string[], params: unknown[]): void {
    // Drivetrain
    if (criteria.drivetrain?.length) {
      params.push(criteria.drivetrain);
      conditions.push(`l.drivetrain = ANY($${params.length})`);
    }
    // Color
    if (criteria.color?.length) {
      params.push(criteria.color);
      conditions.push(`l.exterior_color = ANY($${params.length})`);
    }
    // Seller type
    if (criteria.sellerType?.length) {
      params.push(criteria.sellerType);
      conditions.push(`l.seller_type = ANY($${params.length})`);
    }
    // Doors
    if (criteria.doors?.length) {
      params.push(criteria.doors);
      conditions.push(`l.door_count = ANY($${params.length})`);
    }
    // Seats
    if (criteria.seats?.length) {
      params.push(criteria.seats);
      conditions.push(`l.seat_count = ANY($${params.length})`);
    }
    // Condition
    if (criteria.condition?.length) {
      params.push(criteria.condition);
      conditions.push(`l.condition = ANY($${params.length})`);
    }
    // Engine detail configuration
    if (criteria.engineDetailConfiguration?.length) {
      params.push(criteria.engineDetailConfiguration);
      conditions.push(`l.engine_detail_config = ANY($${params.length})`);
    }
    // Forced induction detail
    if (criteria.forcedInductionDetail?.length) {
      params.push(criteria.forcedInductionDetail);
      conditions.push(`l.forced_induction_detail = ANY($${params.length})`);
    }
    // Heritage era → year-based filtering
    if (criteria.heritageEra?.length) {
      const eraConditions = criteria.heritageEra.map((era) => {
        switch (era) {
          case 'classic': return 'l.year < 1990';
          case 'modern_classic': return '(l.year >= 1990 AND l.year <= 2010)';
          case 'contemporary': return 'l.year > 2010';
        }
      });
      conditions.push(`(${eraConditions.join(' OR ')})`);
    }
    // Special edition
    if (criteria.isSpecialEdition === true) {
      conditions.push(`l.is_special_edition = TRUE`);
    }
    // Performance figures with NULL exclusion
    if (criteria.accelerationMax !== undefined) {
      params.push(criteria.accelerationMax);
      conditions.push(`l.zero_to_hundred_seconds IS NOT NULL AND l.zero_to_hundred_seconds <= $${params.length}`);
    }
    if (criteria.topSpeedMin !== undefined) {
      params.push(criteria.topSpeedMin);
      conditions.push(`l.top_speed_kmh IS NOT NULL AND l.top_speed_kmh >= $${params.length}`);
    }
  }

  private buildCacheKey(criteria: FilterCriteria): string {
    const normalized = JSON.stringify(criteria, Object.keys(criteria).sort());
    const hash = createHash('sha256').update(normalized).digest('hex');
    return `filter:${hash}`;
  }

  private async getFromCache(key: string): Promise<FilterResult | null> {
    try {
      const redis = getRedisClient();
      if (!redis) return null;
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
      if (!redis) return;
      await redis.set(key, JSON.stringify(result), { EX: CACHE_TTL_SECONDS });
    } catch {
      // Cache write failure — non-critical, proceed silently
    }
  }
}
