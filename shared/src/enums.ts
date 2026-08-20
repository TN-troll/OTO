/**
 * Type unions for the Exclusive Car Ads Aggregator.
 */

/** Supported Dutch car marketplaces */
export type MarketplaceId = 'autotrack' | 'autoscout24' | 'marktplaats';

/** Status of a listing on its source marketplace */
export type ListingStatus = 'active' | 'inactive' | 'unknown';

/** Fields available for sorting listings */
export type SortField = 'price' | 'horsepower' | 'engineDisplacement' | 'year' | 'dateAdded';

/** Reason a listing was deemed eligible or not by the curation engine */
export type CurationReason = 'horsepower' | 'luxury_brand' | 'exclusive_model' | 'not_eligible';

/** Specific curation criterion that matched */
export type CurationCriterion = 'hp_above_300' | 'luxury_brand_match' | 'exclusive_model_match';

/** Seller type */
export type SellerType = 'dealer' | 'private';

/** Transmission type */
export type TransmissionType = 'manual' | 'automatic';

/** Fuel type */
export type FuelType = 'petrol' | 'diesel' | 'hybrid' | 'electric';

/** Engine configuration for sound profiles */
export type EngineConfiguration = 'inline' | 'v-type' | 'flat' | 'rotary';

/** Forced induction type */
export type ForcedInduction = 'naturally_aspirated' | 'turbocharged' | 'supercharged';

/** Exhaust note category */
export type ExhaustNote = 'deep_rumble' | 'high_pitched_scream' | 'aggressive_bark' | 'smooth_purr';

/** Marketplace health status */
export type MarketplaceStatus = 'healthy' | 'degraded' | 'unreachable';

/** Sort order direction */
export type SortOrder = 'asc' | 'desc';

/** Body type / carrosserie */
export type BodyType = 'sedan' | 'coupe' | 'cabriolet' | 'hatchback' | 'suv' | 'station' | 'mpv' | 'roadster' | 'targa' | 'shooting_brake' | 'other';

/** Drivetrain layout */
export type DrivetrainType = 'rwd' | 'fwd' | 'awd';

/** Vehicle condition */
export type ConditionType = 'new' | 'used' | 'classic';

/** Detailed engine configuration (cylinder layout) */
export type EngineDetailConfiguration = 'inline-4' | 'inline-6' | 'v6' | 'v8' | 'v10' | 'v12' | 'flat-4' | 'flat-6' | 'w12' | 'rotary';

/** Forced induction detail (more granular than ForcedInduction) */
export type ForcedInductionDetail = 'naturally_aspirated' | 'turbocharged' | 'supercharged' | 'twin_turbo';

/** Heritage era classification based on production year */
export type HeritageEra = 'classic' | 'modern_classic' | 'contemporary';

/** Performance preset identifiers for quick-filter cards */
export type PerformancePresetId = 'v8_grand_tourers' | 'track_weapons' | 'daily_luxury' | 'classic_collectibles';
