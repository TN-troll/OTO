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
  make: string;
  model: string;
  year: number;
  price: number;
  horsepower: number | null;
  engineDisplacementCc: number | null;
  dateAdded: Date;
  /** Listing status — present so the frontend can display badges (e.g. "Sold") */
  status?: 'active' | 'sold' | 'stale';
  /** Whether this listing is featured (pinned to top of browse results) */
  isFeatured?: boolean;
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
