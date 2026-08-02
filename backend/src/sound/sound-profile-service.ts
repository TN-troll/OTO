import { query, queryOne } from '../db/connection.js';
import { MAX_AUDIO_CLIP_DURATION_SECONDS } from '@car-ads/shared';
import type { SoundProfile } from '@car-ads/shared';
import type { EngineConfiguration, ForcedInduction, ExhaustNote } from '@car-ads/shared';

/**
 * Sound Profile Service implementation.
 *
 * Maps car models and engine configurations to sound profiles,
 * classifies exhaust note categories based on engine characteristics,
 * and provides access to audio clip URLs with duration constraints.
 */
export class SoundProfileService {
  /**
   * Look up a sound profile by make, model, and optional engine configuration.
   * Performs case-insensitive matching against the sound_profiles table.
   *
   * Returns null if no matching profile exists (unclassified).
   */
  async getSoundProfile(
    make: string,
    model: string,
    engineConfig?: string,
  ): Promise<SoundProfile | null> {
    let sql: string;
    let params: unknown[];

    if (engineConfig) {
      sql = `
        SELECT id, engine_configuration, cylinder_count, forced_induction,
               exhaust_note, audio_clip_url, audio_clip_duration_seconds
        FROM sound_profiles
        WHERE LOWER(make) = LOWER($1)
          AND LOWER(model) = LOWER($2)
          AND LOWER(engine_configuration) = LOWER($3)
        LIMIT 1
      `;
      params = [make.trim(), model.trim(), engineConfig.trim()];
    } else {
      sql = `
        SELECT id, engine_configuration, cylinder_count, forced_induction,
               exhaust_note, audio_clip_url, audio_clip_duration_seconds
        FROM sound_profiles
        WHERE LOWER(make) = LOWER($1)
          AND LOWER(model) = LOWER($2)
        LIMIT 1
      `;
      params = [make.trim(), model.trim()];
    }

    const row = await queryOne<{
      id: string;
      engine_configuration: string;
      cylinder_count: number;
      forced_induction: string;
      exhaust_note: string;
      audio_clip_url: string | null;
      audio_clip_duration_seconds: number | null;
    }>(sql, params);

    if (!row) {
      return null;
    }

    return mapRowToSoundProfile(row);
  }

  /**
   * Get the audio clip URL for a sound profile by its ID.
   * Returns null if the profile doesn't exist, has no audio clip,
   * or the clip exceeds the 30-second duration limit.
   */
  async getAudioClipUrl(soundProfileId: string): Promise<string | null> {
    const row = await queryOne<{
      audio_clip_url: string | null;
      audio_clip_duration_seconds: number | null;
    }>(
      `SELECT audio_clip_url, audio_clip_duration_seconds
       FROM sound_profiles
       WHERE id = $1`,
      [soundProfileId],
    );

    if (!row || !row.audio_clip_url) {
      return null;
    }

    // Enforce audio clip duration constraint
    if (
      row.audio_clip_duration_seconds != null &&
      row.audio_clip_duration_seconds > MAX_AUDIO_CLIP_DURATION_SECONDS
    ) {
      return null;
    }

    return row.audio_clip_url;
  }

  /**
   * Classify a car's sound profile based on engine characteristics.
   *
   * Uses heuristics to determine the exhaust note category:
   * - V12 naturally aspirated → 'high_pitched_scream'
   * - V10 naturally aspirated → 'high_pitched_scream'
   * - V8 naturally aspirated → 'deep_rumble'
   * - Flat/boxer engines → 'deep_rumble'
   * - Inline-4 turbo → 'aggressive_bark'
   * - V6 turbo → 'aggressive_bark'
   * - Rotary → 'high_pitched_scream'
   * - Small inline-4 naturally aspirated → 'smooth_purr'
   * - Default: 'smooth_purr'
   */
  classifySound(
    _make: string,
    _model: string,
    cylinderCount: number,
    engineLayout: string,
    induction: string,
  ): SoundProfile {
    const engineConfiguration = normalizeEngineLayout(engineLayout);
    const forcedInduction = normalizeInduction(induction);
    const exhaustNote = classifyExhaustNote(cylinderCount, engineConfiguration, forcedInduction);

    return {
      id: '',
      engineConfiguration,
      cylinderCount,
      forcedInduction,
      exhaustNote,
      audioClipUrl: null,
      audioClipDurationSeconds: null,
    };
  }
}

/**
 * Classify the exhaust note based on engine characteristics using heuristics.
 */
function classifyExhaustNote(
  cylinderCount: number,
  engineConfiguration: EngineConfiguration,
  forcedInduction: ForcedInduction,
): ExhaustNote {
  // Rotary engines always scream
  if (engineConfiguration === 'rotary') {
    return 'high_pitched_scream';
  }

  // Flat/boxer engines have a distinctive rumble
  if (engineConfiguration === 'flat') {
    return 'deep_rumble';
  }

  // V-type engines
  if (engineConfiguration === 'v-type') {
    if (forcedInduction === 'naturally_aspirated') {
      // V12 and V10 naturally aspirated → high-pitched scream
      if (cylinderCount >= 10) {
        return 'high_pitched_scream';
      }
      // V8 naturally aspirated → deep rumble
      if (cylinderCount === 8) {
        return 'deep_rumble';
      }
    }
    // V6 turbo → aggressive bark
    if (cylinderCount === 6 && forcedInduction !== 'naturally_aspirated') {
      return 'aggressive_bark';
    }
    // V8 turbo → deep rumble (still rumbles with forced induction)
    if (cylinderCount === 8) {
      return 'deep_rumble';
    }
  }

  // Inline engines
  if (engineConfiguration === 'inline') {
    // Inline-4 turbo → aggressive bark
    if (cylinderCount === 4 && forcedInduction !== 'naturally_aspirated') {
      return 'aggressive_bark';
    }
    // Inline-6 turbo → aggressive bark
    if (cylinderCount === 6 && forcedInduction !== 'naturally_aspirated') {
      return 'aggressive_bark';
    }
    // Inline-6 naturally aspirated → smooth purr (think BMW straight-6)
    if (cylinderCount === 6 && forcedInduction === 'naturally_aspirated') {
      return 'smooth_purr';
    }
    // Small inline-4 naturally aspirated → smooth purr
    if (cylinderCount <= 4 && forcedInduction === 'naturally_aspirated') {
      return 'smooth_purr';
    }
  }

  // Default for unrecognized configurations
  return 'smooth_purr';
}

/**
 * Normalize engine layout string to a valid EngineConfiguration value.
 */
function normalizeEngineLayout(layout: string): EngineConfiguration {
  const normalized = layout.toLowerCase().trim();

  if (normalized === 'v-type' || normalized === 'v' || normalized.startsWith('v-')) {
    return 'v-type';
  }
  if (normalized === 'inline' || normalized === 'straight' || normalized === 'i') {
    return 'inline';
  }
  if (normalized === 'flat' || normalized === 'boxer' || normalized === 'h') {
    return 'flat';
  }
  if (normalized === 'rotary' || normalized === 'wankel') {
    return 'rotary';
  }

  // Default to inline if unrecognized
  return 'inline';
}

/**
 * Normalize induction string to a valid ForcedInduction value.
 */
function normalizeInduction(induction: string): ForcedInduction {
  const normalized = induction.toLowerCase().trim();

  if (normalized === 'naturally_aspirated' || normalized === 'na' || normalized === 'natural') {
    return 'naturally_aspirated';
  }
  if (normalized === 'turbocharged' || normalized === 'turbo') {
    return 'turbocharged';
  }
  if (normalized === 'supercharged' || normalized === 'supercharger' || normalized === 'sc') {
    return 'supercharged';
  }

  // Default
  return 'naturally_aspirated';
}

/**
 * Map a database row to a SoundProfile interface.
 */
function mapRowToSoundProfile(row: {
  id: string;
  engine_configuration: string;
  cylinder_count: number;
  forced_induction: string;
  exhaust_note: string;
  audio_clip_url: string | null;
  audio_clip_duration_seconds: number | null;
}): SoundProfile {
  return {
    id: row.id,
    engineConfiguration: row.engine_configuration as EngineConfiguration,
    cylinderCount: row.cylinder_count,
    forcedInduction: row.forced_induction as ForcedInduction,
    exhaustNote: row.exhaust_note as ExhaustNote,
    audioClipUrl: row.audio_clip_url,
    audioClipDurationSeconds: row.audio_clip_duration_seconds,
  };
}

// Exported for testing
export { classifyExhaustNote, normalizeEngineLayout, normalizeInduction };
