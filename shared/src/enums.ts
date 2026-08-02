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
