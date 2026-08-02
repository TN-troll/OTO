import { query } from '../db/connection.js';
import { CURATION_HP_THRESHOLD } from '@car-ads/shared';
import type { RawAdvertisement, CurationResult, ExclusiveModelEntry } from '@car-ads/shared';
import type { CurationCriterion, CurationReason } from '@car-ads/shared';

/**
 * Counts returned by reEvaluateAll() for reporting purposes.
 */
export interface ReEvaluationCounts {
  totalEvaluated: number;
  removedCount: number;
  updatedCount: number;
}

/**
 * Curation Engine implementation.
 *
 * Evaluates raw advertisements against configurable criteria to determine
 * eligibility for the platform. Uses OR logic: a car qualifies if ANY
 * criterion matches (HP > 300, luxury brand, or exclusive model).
 *
 * Maintains an in-memory cache of luxury brands and exclusive models
 * for synchronous evaluate() calls, refreshed from the database on startup
 * and when configuration is updated.
 */
export class CurationEngine {
  private luxuryBrands: string[] = [];
  private exclusiveModels: ExclusiveModelEntry[] = [];
  private initialized = false;

  /**
   * Load curation config from the database into memory.
   * Must be called before evaluate() can be used.
   */
  async initialize(): Promise<void> {
    await this.loadConfig();
    this.initialized = true;
  }

  /**
   * Evaluate a raw advertisement against curation rules.
   * Returns eligibility status and the matched criteria.
   *
   * OR logic: eligible if ANY criterion matches:
   * - Horsepower > 300 (skipped if HP is null or 0)
   * - Make appears in luxury brands list (case-insensitive)
   * - Make + model appears in exclusive models list (case-insensitive)
   */
  evaluate(ad: RawAdvertisement): CurationResult {
    if (!this.initialized) {
      throw new Error('CurationEngine not initialized. Call initialize() first.');
    }

    const matchedCriteria: CurationCriterion[] = [];

    // Check HP criterion (skip if null or 0)
    if (ad.horsepower != null && ad.horsepower > 0) {
      if (ad.horsepower > CURATION_HP_THRESHOLD) {
        matchedCriteria.push('hp_above_300');
      }
    }

    // Check luxury brand match (case-insensitive)
    if (ad.make != null) {
      const makeNormalized = ad.make.toLowerCase().trim();
      const isLuxuryBrand = this.luxuryBrands.some(
        (brand) => brand.toLowerCase().trim() === makeNormalized,
      );
      if (isLuxuryBrand) {
        matchedCriteria.push('luxury_brand_match');
      }
    }

    // Check exclusive model match (case-insensitive make + model)
    if (ad.make != null && ad.model != null) {
      const makeNormalized = ad.make.toLowerCase().trim();
      const modelNormalized = ad.model.toLowerCase().trim();
      const isExclusiveModel = this.exclusiveModels.some(
        (entry) =>
          entry.make.toLowerCase().trim() === makeNormalized &&
          entry.model.toLowerCase().trim() === modelNormalized,
      );
      if (isExclusiveModel) {
        matchedCriteria.push('exclusive_model_match');
      }
    }

    if (matchedCriteria.length === 0) {
      return {
        eligible: false,
        reason: 'not_eligible',
        matchedCriteria: [],
      };
    }

    // Determine primary reason (first matched criterion)
    const reason = criterionToReason(matchedCriteria[0]);

    return {
      eligible: true,
      reason,
      matchedCriteria,
    };
  }

  /**
   * Get the current list of luxury brands.
   */
  async getLuxuryBrands(): Promise<string[]> {
    await this.loadConfig();
    return [...this.luxuryBrands];
  }

  /**
   * Get the current list of exclusive models.
   */
  async getExclusiveModels(): Promise<ExclusiveModelEntry[]> {
    await this.loadConfig();
    return [...this.exclusiveModels];
  }

  /**
   * Update the luxury brands list in the database and refresh in-memory cache.
   */
  async updateLuxuryBrands(brands: string[]): Promise<void> {
    const existing = await query(
      `SELECT id FROM curation_config WHERE config_type = 'luxury_brands' LIMIT 1`,
    );
    if (existing.rows.length === 0) {
      await query(
        `INSERT INTO curation_config (config_type, value, updated_at) VALUES ('luxury_brands', $1::jsonb, NOW())`,
        [JSON.stringify(brands)],
      );
    } else {
      await query(
        `UPDATE curation_config SET value = $1::jsonb, updated_at = NOW() WHERE config_type = 'luxury_brands'`,
        [JSON.stringify(brands)],
      );
    }

    this.luxuryBrands = brands;
  }

  /**
   * Update the exclusive models list in the database and refresh in-memory cache.
   */
  async updateExclusiveModels(models: ExclusiveModelEntry[]): Promise<void> {
    const result = await query(
      `SELECT id FROM curation_config WHERE config_type = 'exclusive_models'`,
    );
    if (result.rows.length === 0) {
      await query(
        `INSERT INTO curation_config (config_type, value, updated_at) VALUES ('exclusive_models', $1::jsonb, NOW())`,
        [JSON.stringify(models)],
      );
    } else {
      await query(
        `UPDATE curation_config SET value = $1::jsonb, updated_at = NOW() WHERE config_type = 'exclusive_models'`,
        [JSON.stringify(models)],
      );
    }

    this.exclusiveModels = models;
  }

  /**
   * Re-evaluate all active listings against the current curation config.
   * Listings that no longer qualify are marked inactive.
   * This is triggered when the luxury brands or exclusive models lists change.
   *
   * @returns Counts of evaluated, removed, and updated listings.
   */
  async reEvaluateAll(): Promise<ReEvaluationCounts> {
    // Refresh config from the database
    await this.loadConfig();

    // Fetch all active listings
    const result = await query<{
      id: string;
      make: string;
      model: string;
      horsepower: number | null;
    }>(
      `SELECT id, make, model, horsepower FROM listings WHERE status = 'active'`,
    );

    let removedCount = 0;
    let updatedCount = 0;

    for (const row of result.rows) {
      const ad: RawAdvertisement = {
        title: '',
        price: null,
        mileage: null,
        year: null,
        make: row.make,
        model: row.model,
        engineDisplacementCc: null,
        horsepower: row.horsepower,
        location: null,
        sellerType: null,
        sourceUrl: '',
        imageUrls: [],
        transmissionType: null,
        fuelType: null,
      };

      const curationResult = this.evaluate(ad);

      if (!curationResult.eligible) {
        // Mark listing as inactive if it no longer qualifies
        await query(
          `UPDATE listings SET status = 'inactive', curation_criteria = '{}', updated_at = NOW() WHERE id = $1`,
          [row.id],
        );
        removedCount++;
      } else {
        // Update curation criteria for listings that still qualify
        await query(
          `UPDATE listings SET curation_criteria = $1, updated_at = NOW() WHERE id = $2`,
          [curationResult.matchedCriteria, row.id],
        );
        updatedCount++;
      }
    }

    return {
      totalEvaluated: result.rows.length,
      removedCount,
      updatedCount,
    };
  }

  /**
   * Load luxury brands and exclusive models from the database into memory.
   */
  private async loadConfig(): Promise<void> {
    const brandsResult = await query<{ value: unknown }>(
      `SELECT value FROM curation_config WHERE config_type = 'luxury_brands' LIMIT 1`,
    );
    if (brandsResult.rows.length > 0) {
      const value = brandsResult.rows[0].value;
      this.luxuryBrands = Array.isArray(value) ? value : [];
    }

    const modelsResult = await query<{ value: unknown }>(
      `SELECT value FROM curation_config WHERE config_type = 'exclusive_models' LIMIT 1`,
    );
    if (modelsResult.rows.length > 0) {
      const value = modelsResult.rows[0].value;
      this.exclusiveModels = Array.isArray(value) ? value : [];
    }
  }
}

/**
 * Map a curation criterion to its corresponding reason.
 */
function criterionToReason(criterion: CurationCriterion): CurationReason {
  switch (criterion) {
    case 'hp_above_300':
      return 'horsepower';
    case 'luxury_brand_match':
      return 'luxury_brand';
    case 'exclusive_model_match':
      return 'exclusive_model';
  }
}
