/**
 * Constants and filter range limits for the Exclusive Car Ads Aggregator.
 */

import type { PerformancePreset } from './types';

/** Engine displacement filter range limits (in cc) */
export const DISPLACEMENT_MIN = 0;
export const DISPLACEMENT_MAX = 10_000;

/** Horsepower filter range limits (in HP) */
export const HORSEPOWER_MIN = 0;
export const HORSEPOWER_MAX = 2_000;

/** Year of manufacture filter range limits */
export const YEAR_MIN = 1950;
export const YEAR_MAX = new Date().getFullYear();

/** Price filter range limits (in EUR) */
export const PRICE_MIN = 0;
export const PRICE_MAX = 50_000_000;

/** Maximum number of images per listing */
export const MAX_IMAGES_PER_LISTING = 20;

/** Default page size for paginated results */
export const DEFAULT_PAGE_SIZE = 50;

/** Minimum search query length */
export const SEARCH_QUERY_MIN_LENGTH = 2;

/** Maximum search query length */
export const SEARCH_QUERY_MAX_LENGTH = 100;

/** Maximum audio clip duration in seconds */
export const MAX_AUDIO_CLIP_DURATION_SECONDS = 30;

/** Curation threshold: horsepower above this value qualifies */
export const CURATION_HP_THRESHOLD = 300;

/** Marketplace retry settings */
export const MARKETPLACE_RETRY_MAX_ATTEMPTS = 3;
export const MARKETPLACE_RETRY_INITIAL_DELAY_MS = 30_000;
export const MARKETPLACE_UNREACHABLE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

// ─── Performance Presets ────────────────────────────────────────────────────────

/** Pre-configured filter presets for quick access to popular car categories */
export const PERFORMANCE_PRESETS: PerformancePreset[] = [
  {
    id: 'v8_grand_tourers',
    label: 'V8+ Grand Tourers',
    description: 'Grand touring cars with V8 or larger engines',
    filters: {
      soundProfile: { cylinderCount: [8, 10, 12] },
      bodyType: ['coupe', 'cabriolet'],
      horsepowerMin: 400,
    },
  },
  {
    id: 'track_weapons',
    label: 'Track Weapons',
    description: 'High-performance track-focused machines',
    filters: {
      horsepowerMin: 500,
      transmissionType: ['manual', 'automatic'],
      bodyType: ['coupe'],
    },
  },
  {
    id: 'daily_luxury',
    label: 'Daily Luxury',
    description: 'Premium daily drivers from top brands',
    filters: {
      transmissionType: ['automatic'],
      doors: [4, 5],
      makes: ['BMW', 'Mercedes-Benz', 'Audi', 'Porsche', 'Maserati', 'Bentley', 'Rolls-Royce', 'Aston Martin', 'Jaguar'],
    },
  },
  {
    id: 'classic_collectibles',
    label: 'Classic Collectibles',
    description: 'Collectible classics and special editions',
    filters: {
      yearMax: 2000,
      isSpecialEdition: true,
      mileageMax: 100000,
    },
  },
];

// ─── URL Param Mapping ──────────────────────────────────────────────────────────

/** Maps FilterState field names to their URL query parameter keys */
export const URL_PARAM_MAP: Record<string, string> = {
  drivetrain: 'drivetrain',
  color: 'color',
  sellerType: 'sellerType',
  doors: 'doors',
  seats: 'seats',
  condition: 'condition',
  performancePreset: 'preset',
  engineDetailConfiguration: 'engineConfig',
  forcedInductionDetail: 'induction',
  heritageEra: 'era',
  isSpecialEdition: 'specialEdition',
  accelerationMax: 'accelMax',
  topSpeedMin: 'topSpeedMin',
};

// ─── Default Range Bounds ───────────────────────────────────────────────────────

/** Default range bounds used as fallbacks when dynamic data is unavailable */
export const DEFAULT_RANGES = {
  price: { min: 0, max: 1_000_000 },
  horsepower: { min: 0, max: 2_000 },
  engineDisplacement: { min: 0, max: 10_000 },
  year: { min: 1950, max: new Date().getFullYear() + 1 },
  mileage: { min: 0, max: 500_000 },
};
