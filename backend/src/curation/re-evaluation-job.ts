import { CurationEngine } from './curation-engine.js';
import type { ExclusiveModelEntry } from '@car-ads/shared';

/**
 * Result of a re-evaluation job run.
 */
export interface ReEvaluationResult {
  triggeredAt: Date;
  completedAt: Date;
  totalEvaluated: number;
  removedCount: number;
  updatedCount: number;
  trigger: 'luxury_brands_update' | 'exclusive_models_update';
}

/**
 * Re-evaluation job that is triggered when curation configuration changes.
 *
 * When the luxury brands or exclusive models list is updated, this job
 * re-evaluates all active listings against the updated curation rules.
 * Listings that no longer qualify are marked inactive, and listings that
 * still qualify have their curation criteria updated.
 *
 * The job must complete within 60 minutes of the config change (Requirement 2.6).
 */
export class ReEvaluationJob {
  private curationEngine: CurationEngine;
  private running = false;
  private lastResult: ReEvaluationResult | null = null;

  constructor(curationEngine: CurationEngine) {
    this.curationEngine = curationEngine;
  }

  /**
   * Check if the job is currently running.
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get the result of the last completed re-evaluation.
   */
  getLastResult(): ReEvaluationResult | null {
    return this.lastResult;
  }

  /**
   * Trigger a re-evaluation of all active listings.
   * Called after luxury brands or exclusive models config is updated.
   *
   * @param trigger - What caused this re-evaluation
   * @returns The result of the re-evaluation including counts of removed/updated listings
   */
  async trigger(
    trigger: 'luxury_brands_update' | 'exclusive_models_update',
  ): Promise<ReEvaluationResult> {
    if (this.running) {
      throw new Error('Re-evaluation job is already running.');
    }

    this.running = true;
    const triggeredAt = new Date();

    try {
      const counts = await this.curationEngine.reEvaluateAll();

      const completedAt = new Date();

      const result: ReEvaluationResult = {
        triggeredAt,
        completedAt,
        totalEvaluated: counts.totalEvaluated,
        removedCount: counts.removedCount,
        updatedCount: counts.updatedCount,
        trigger,
      };

      this.lastResult = result;

      console.log(
        `[ReEvaluationJob] Completed: trigger=${trigger}, ` +
          `evaluated=${result.totalEvaluated}, removed=${result.removedCount}, ` +
          `updated=${result.updatedCount}, duration=${completedAt.getTime() - triggeredAt.getTime()}ms`,
      );

      return result;
    } finally {
      this.running = false;
    }
  }

  /**
   * Update luxury brands and trigger re-evaluation.
   * Convenience method that wraps the update + re-evaluation flow.
   */
  async updateLuxuryBrandsAndReEvaluate(brands: string[]): Promise<ReEvaluationResult> {
    await this.curationEngine.updateLuxuryBrands(brands);
    return this.trigger('luxury_brands_update');
  }

  /**
   * Update exclusive models and trigger re-evaluation.
   * Convenience method that wraps the update + re-evaluation flow.
   */
  async updateExclusiveModelsAndReEvaluate(
    models: ExclusiveModelEntry[],
  ): Promise<ReEvaluationResult> {
    await this.curationEngine.updateExclusiveModels(models);
    return this.trigger('exclusive_models_update');
  }
}
