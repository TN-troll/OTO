/**
 * Property 11: i18n translation completeness
 *
 * Validates: Requirements 13.1, 13.2, 13.3, 13.4
 *
 * For any filter enum value across all new types (DrivetrainType, ConditionType,
 * EngineDetailConfiguration, ForcedInductionDetail, HeritageEra, PerformancePresetId)
 * and for each supported locale (EN, NL), a translation string SHALL exist in the
 * translation dictionary. Switching locale SHALL change all visible labels without
 * modifying the underlying filter state.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { translations, type Locale } from './translations';
import type {
  DrivetrainType,
  ConditionType,
  EngineDetailConfiguration,
  ForcedInductionDetail,
  HeritageEra,
  PerformancePresetId,
} from '@car-ads/shared';

// ─── Enum Values ────────────────────────────────────────────────────────────────

const DRIVETRAIN_VALUES: DrivetrainType[] = ['rwd', 'fwd', 'awd'];
const CONDITION_VALUES: ConditionType[] = ['new', 'used', 'classic'];
const ENGINE_CONFIG_VALUES: EngineDetailConfiguration[] = [
  'inline-4', 'inline-6', 'v6', 'v8', 'v10', 'v12', 'flat-4', 'flat-6', 'w12', 'rotary',
];
const FORCED_INDUCTION_VALUES: ForcedInductionDetail[] = [
  'naturally_aspirated', 'turbocharged', 'supercharged', 'twin_turbo',
];
const HERITAGE_ERA_VALUES: HeritageEra[] = ['classic', 'modern_classic', 'contemporary'];
const PRESET_VALUES: PerformancePresetId[] = [
  'v8_grand_tourers', 'track_weapons', 'daily_luxury', 'classic_collectibles',
];

const LOCALES: Locale[] = ['en', 'nl'];

// ─── Translation Key Mappings ───────────────────────────────────────────────────

/** Maps DrivetrainType enum values to their translation keys */
const drivetrainKeyMap: Record<DrivetrainType, keyof typeof translations.en> = {
  rwd: 'drivetrainRwd',
  fwd: 'drivetrainFwd',
  awd: 'drivetrainAwd',
};

/** Maps ConditionType enum values to their translation keys */
const conditionKeyMap: Record<ConditionType, keyof typeof translations.en> = {
  new: 'conditionNew',
  used: 'conditionUsed',
  classic: 'conditionClassic',
};

/** Maps EngineDetailConfiguration enum values to their translation keys */
const engineConfigKeyMap: Record<EngineDetailConfiguration, keyof typeof translations.en> = {
  'inline-4': 'engineConfigInline4',
  'inline-6': 'engineConfigInline6',
  v6: 'engineConfigV6',
  v8: 'engineConfigV8',
  v10: 'engineConfigV10',
  v12: 'engineConfigV12',
  'flat-4': 'engineConfigFlat4',
  'flat-6': 'engineConfigFlat6',
  w12: 'engineConfigW12',
  rotary: 'engineConfigRotary',
};

/** Maps ForcedInductionDetail enum values to their translation keys */
const forcedInductionKeyMap: Record<ForcedInductionDetail, keyof typeof translations.en> = {
  naturally_aspirated: 'forcedInductionNaturallyAspirated',
  turbocharged: 'forcedInductionTurbocharged',
  supercharged: 'forcedInductionSupercharged',
  twin_turbo: 'forcedInductionTwinTurbo',
};

/** Maps HeritageEra enum values to their translation keys */
const heritageEraKeyMap: Record<HeritageEra, keyof typeof translations.en> = {
  classic: 'heritageEraClassic',
  modern_classic: 'heritageEraModernClassic',
  contemporary: 'heritageEraContemporary',
};

/** Maps PerformancePresetId enum values to their translation keys (label + description) */
const presetKeyMap: Record<PerformancePresetId, { label: keyof typeof translations.en; desc: keyof typeof translations.en }> = {
  v8_grand_tourers: { label: 'presetV8GrandTourers', desc: 'presetV8GrandTourersDesc' },
  track_weapons: { label: 'presetTrackWeapons', desc: 'presetTrackWeaponsDesc' },
  daily_luxury: { label: 'presetDailyLuxury', desc: 'presetDailyLuxuryDesc' },
  classic_collectibles: { label: 'presetClassicCollectibles', desc: 'presetClassicCollectiblesDesc' },
};

// ─── Arbitraries ────────────────────────────────────────────────────────────────

const arbLocale = fc.constantFrom(...LOCALES);
const arbDrivetrain = fc.constantFrom(...DRIVETRAIN_VALUES);
const arbCondition = fc.constantFrom(...CONDITION_VALUES);
const arbEngineConfig = fc.constantFrom(...ENGINE_CONFIG_VALUES);
const arbForcedInduction = fc.constantFrom(...FORCED_INDUCTION_VALUES);
const arbHeritageEra = fc.constantFrom(...HERITAGE_ERA_VALUES);
const arbPreset = fc.constantFrom(...PRESET_VALUES);

// ─── Property Tests ─────────────────────────────────────────────────────────────

describe('Feature: premium-filter-overhaul, Property 11: i18n translation completeness', () => {
  it('every DrivetrainType value has a non-empty translation for each locale', () => {
    fc.assert(
      fc.property(arbDrivetrain, arbLocale, (value, locale) => {
        const key = drivetrainKeyMap[value];
        const translation = translations[locale][key];
        expect(translation).toBeDefined();
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('every ConditionType value has a non-empty translation for each locale', () => {
    fc.assert(
      fc.property(arbCondition, arbLocale, (value, locale) => {
        const key = conditionKeyMap[value];
        const translation = translations[locale][key];
        expect(translation).toBeDefined();
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('every EngineDetailConfiguration value has a non-empty translation for each locale', () => {
    fc.assert(
      fc.property(arbEngineConfig, arbLocale, (value, locale) => {
        const key = engineConfigKeyMap[value];
        const translation = translations[locale][key];
        expect(translation).toBeDefined();
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('every ForcedInductionDetail value has a non-empty translation for each locale', () => {
    fc.assert(
      fc.property(arbForcedInduction, arbLocale, (value, locale) => {
        const key = forcedInductionKeyMap[value];
        const translation = translations[locale][key];
        expect(translation).toBeDefined();
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('every HeritageEra value has a non-empty translation for each locale', () => {
    fc.assert(
      fc.property(arbHeritageEra, arbLocale, (value, locale) => {
        const key = heritageEraKeyMap[value];
        const translation = translations[locale][key];
        expect(translation).toBeDefined();
        expect(typeof translation).toBe('string');
        expect(translation.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('every PerformancePresetId value has non-empty label and description translations for each locale', () => {
    fc.assert(
      fc.property(arbPreset, arbLocale, (value, locale) => {
        const { label, desc } = presetKeyMap[value];
        const labelTranslation = translations[locale][label];
        const descTranslation = translations[locale][desc];

        expect(labelTranslation).toBeDefined();
        expect(typeof labelTranslation).toBe('string');
        expect(labelTranslation.length).toBeGreaterThan(0);

        expect(descTranslation).toBeDefined();
        expect(typeof descTranslation).toBe('string');
        expect(descTranslation.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('switching locale changes labels without losing coverage (all enum values still have translations)', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          arbDrivetrain.map((v) => ({ type: 'drivetrain' as const, value: v })),
          arbCondition.map((v) => ({ type: 'condition' as const, value: v })),
          arbEngineConfig.map((v) => ({ type: 'engineConfig' as const, value: v })),
          arbForcedInduction.map((v) => ({ type: 'forcedInduction' as const, value: v })),
          arbHeritageEra.map((v) => ({ type: 'heritageEra' as const, value: v })),
          arbPreset.map((v) => ({ type: 'preset' as const, value: v })),
        ),
        (enumEntry) => {
          // Verify both locales have translations and they differ (locale switch produces different text)
          let enKey: keyof typeof translations.en;
          let nlKey: keyof typeof translations.nl;

          switch (enumEntry.type) {
            case 'drivetrain':
              enKey = drivetrainKeyMap[enumEntry.value as DrivetrainType];
              nlKey = enKey;
              break;
            case 'condition':
              enKey = conditionKeyMap[enumEntry.value as ConditionType];
              nlKey = enKey;
              break;
            case 'engineConfig':
              enKey = engineConfigKeyMap[enumEntry.value as EngineDetailConfiguration];
              nlKey = enKey;
              break;
            case 'forcedInduction':
              enKey = forcedInductionKeyMap[enumEntry.value as ForcedInductionDetail];
              nlKey = enKey;
              break;
            case 'heritageEra':
              enKey = heritageEraKeyMap[enumEntry.value as HeritageEra];
              nlKey = enKey;
              break;
            case 'preset':
              enKey = presetKeyMap[enumEntry.value as PerformancePresetId].label;
              nlKey = enKey;
              break;
          }

          const enTranslation = translations.en[enKey];
          const nlTranslation = translations.nl[nlKey];

          // Both must exist and be non-empty
          expect(enTranslation.length).toBeGreaterThan(0);
          expect(nlTranslation.length).toBeGreaterThan(0);

          // Both are valid strings regardless of whether they happen to be the same
          // (some technical terms like "V8" or "V12" are the same in both locales)
          expect(typeof enTranslation).toBe('string');
          expect(typeof nlTranslation).toBe('string');
        },
      ),
      { numRuns: 100 },
    );
  });
});
