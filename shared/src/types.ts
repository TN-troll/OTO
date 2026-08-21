/**
 * Shared TypeScript interfaces for the Exclusive Car Ads Aggregator.
 */

import type {
  MarketplaceId,
  CurationReason,
  CurationCriterion,
  SortField,
  SellerType,
  TransmissionType,
  FuelType,
  BodyType,
  EngineConfiguration,
  ForcedInduction,
  ExhaustNote,
  MarketplaceStatus,
  SortOrder,
  DrivetrainType,
  ConditionType,
  EngineDetailConfiguration,
  ForcedInductionDetail,
  HeritageEra,
  PerformancePresetId,
} from './enums';

/** Raw advertisement data as scraped from a marketplace before curation */
export interface RawAdvertisement {
  title: string;
  price: number | null;
  mileage: number | null;
  year: number | null;
  make: string | null;
  model: string | null;
  engineDisplacementCc: number | null;
  horsepower: number | null;
  location: string | null;
  sellerType: SellerType | null;
  sourceUrl: string;
  imageUrls: string[];
  transmissionType: TransmissionType | null;
  fuelType: FuelType | null;
  bodyType: BodyType | null;
}

/** A fully qualified listing stored on the platform */
export interface Listing {
  id: string;
  title: string;
  price: number;
  mileage: number | null;
  year: number;
  make: string;
  model: string;
  engineDisplacementCc: number | null;
  horsepower: number | null;
  location: string | null;
  sellerType: SellerType | null;
  transmissionType: TransmissionType | null;
  fuelType: FuelType | null;
  bodyType: BodyType | null;
  imageUrls: string[];
  sourceUrls: SourceReference[];
  soundProfileId: string | null;
  drivetrain: DrivetrainType | null;
  exteriorColor: string | null;
  doorCount: number | null;
  seatCount: number | null;
  condition: ConditionType | null;
  engineDetailConfig: EngineDetailConfiguration | null;
  forcedInductionDetail: ForcedInductionDetail | null;
  zeroToHundredSeconds: number | null;
  topSpeedKmh: number | null;
  isSpecialEdition: boolean;
  status: 'active' | 'sold' | 'stale' | 'inactive';
  curationCriteria: CurationCriterion[];
  dateAdded: Date;
  lastVerified: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Reference to the original advertisement on a source marketplace */
export interface SourceReference {
  marketplace: MarketplaceId;
  url: string;
  externalId: string;
  lastChecked: Date;
  isActive: boolean;
}

/** Sound profile associated with a car model/engine configuration */
export interface SoundProfile {
  id: string;
  engineConfiguration: EngineConfiguration;
  cylinderCount: number;
  forcedInduction: ForcedInduction;
  exhaustNote: ExhaustNote;
  audioClipUrl: string | null;
  audioClipDurationSeconds: number | null;
}

/** User-supplied filter criteria for querying listings */
export interface FilterCriteria {
  engineDisplacementMin?: number;
  engineDisplacementMax?: number;
  horsepowerMin?: number;
  horsepowerMax?: number;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMin?: number;
  mileageMax?: number;
  makes?: string[];
  models?: string[];
  transmissionType?: TransmissionType[];
  fuelType?: FuelType[];
  bodyType?: BodyType[];
  soundProfile?: SoundFilterCriteria;
  searchQuery?: string;
  sortBy?: SortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
  /** When true, include sold listings alongside active ones in results */
  showSold?: boolean;
  // New filter fields
  drivetrain?: DrivetrainType[];
  color?: string[];
  /** Filter listings by city/location name (exact match, case-insensitive) */
  location?: string;
  sellerType?: SellerType[];
  doors?: number[];
  seats?: number[];
  condition?: ConditionType[];
  performancePreset?: PerformancePresetId | null;
  engineDetailConfiguration?: EngineDetailConfiguration[];
  forcedInductionDetail?: ForcedInductionDetail[];
  heritageEra?: HeritageEra[];
  isSpecialEdition?: boolean;
  accelerationMax?: number;
  topSpeedMin?: number;
}

/** Sound-specific filter criteria */
export interface SoundFilterCriteria {
  engineConfiguration?: EngineConfiguration[];
  cylinderCount?: number[];
  forcedInduction?: ForcedInduction[];
  exhaustNote?: ExhaustNote[];
}

/** Paginated result set from the filter engine */
export interface FilterResult {
  listings: ListingSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Result of the curation engine evaluating an advertisement */
export interface CurationResult {
  eligible: boolean;
  reason: CurationReason;
  matchedCriteria: CurationCriterion[];
}

/** Health status of a connected marketplace */
export interface MarketplaceHealth {
  marketplace: MarketplaceId;
  status: MarketplaceStatus;
  lastSuccessfulContact: Date;
  consecutiveFailures: number;
  unreachableSince: Date | null;
}

/** Summary view of a listing for the browse overview */
export interface ListingSummary {
  id: string;
  title: string;
  primaryImageUrl: string | null;
  /** First 4 image URLs for card carousel (subset of full gallery) */
  imageUrls: string[];
  make: string;
  model: string;
  year: number;
  price: number;
  horsepower: number | null;
  engineDisplacementCc: number | null;
  mileage: number | null;
  fuelType: string | null;
  location: string | null;
  sellerType: string | null;
  /** Market average price for similar cars (null if unavailable) */
  marketAvgPrice: number | null;
  dateAdded: Date;
  /** Listing status — present so the frontend can display badges (e.g. "Sold") */
  status?: 'active' | 'sold' | 'stale';
  /** Whether this listing is featured (pinned to top of browse results) */
  isFeatured?: boolean;
  /** Whether this listing has an audio clip available */
  hasSoundClip?: boolean;
  /** Short snippet from the ad description (first ~150 chars) */
  snippet: string | null;
}

/** Result of validating filter criteria or other input */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/** A single validation error */
export interface ValidationError {
  field: string;
  message: string;
}

/** Entry in the exclusive models list */
export interface ExclusiveModelEntry {
  make: string;
  model: string;
}

// ─── Map Types ──────────────────────────────────────────────────────────────────

/** A location on the dealer map with aggregated listing data */
export interface MapLocation {
  city: string;
  latitude: number;
  longitude: number;
  totalCount: number;
  dealerCount: number;
  privateCount: number;
  previews: MapListingPreview[];
}

/** Preview of a listing shown in map marker popups */
export interface MapListingPreview {
  id: string;
  title: string;
  price: number;
  primaryImageUrl: string | null;
  make: string;
  model: string;
}

/** API Response for the map locations endpoint */
export interface MapLocationsResponse {
  locations: MapLocation[];
  totalListings: number;
  generatedAt: string; // ISO timestamp
}

// ─── Performance Presets ────────────────────────────────────────────────────────

/** A performance preset that expands into a set of filter criteria */
export interface PerformancePreset {
  id: PerformancePresetId;
  label: string;
  description: string;
  filters: Partial<FilterCriteria>;
}

// ─── Filter Options ─────────────────────────────────────────────────────────────

/** Response from the GET /api/filter-options endpoint with dynamic filter values */
export interface FilterOptionsResponse {
  ranges: {
    price: { min: number; max: number };
    horsepower: { min: number; max: number };
    engineDisplacement: { min: number; max: number };
    year: { min: number; max: number };
    mileage: { min: number; max: number };
  };
  drivetrains: DrivetrainType[];
  colors: string[];
  sellerTypes: SellerType[];
  doorCounts: number[];
  seatCounts: number[];
  conditions: ConditionType[];
  engineDetailConfigurations: EngineDetailConfiguration[];
  forcedInductionDetails: ForcedInductionDetail[];
  heritageEraDistribution: Record<HeritageEra, number>;
  specialEditionCount: number;
  makes: string[];
  modelsByMake: Record<string, string[]>;
}
