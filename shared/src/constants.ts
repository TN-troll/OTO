/**
 * Constants and filter range limits for the Exclusive Car Ads Aggregator.
 */

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
