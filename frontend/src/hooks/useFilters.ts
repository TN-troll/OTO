import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type {
  FilterCriteria,
  SoundFilterCriteria,
  FilterResult,
  ValidationError,
  FilterOptionsResponse,
  PerformancePreset,
} from '@car-ads/shared';
import type {
  TransmissionType,
  FuelType,
  BodyType,
  SortField,
  SortOrder,
  DrivetrainType,
  ConditionType,
  EngineDetailConfiguration,
  ForcedInductionDetail,
  HeritageEra,
  PerformancePresetId,
  SellerType,
} from '@car-ads/shared';
import { PERFORMANCE_PRESETS, serializeFilters, deserializeFilters } from '@car-ads/shared';
import { useDebouncedValue } from './useDebouncedValue';

export interface FilterState {
  // Existing range fields
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
  // Existing array fields
  makes: string[];
  models: string[];
  transmissionType: TransmissionType[];
  fuelType: FuelType[];
  bodyType: BodyType[];
  soundProfile: SoundFilterCriteria;
  showSold: boolean;
  // New filter fields
  drivetrain: DrivetrainType[];
  color: string[];
  sellerType: SellerType[];
  doors: number[];
  seats: number[];
  condition: ConditionType[];
  // Premium filters
  performancePreset: PerformancePresetId | null;
  engineDetailConfiguration: EngineDetailConfiguration[];
  forcedInductionDetail: ForcedInductionDetail[];
  heritageEra: HeritageEra[];
  isSpecialEdition: boolean;
  accelerationMax?: number;
  topSpeedMin?: number;
  location?: string;
}

export const INITIAL_FILTER_STATE: FilterState = {
  engineDisplacementMin: undefined,
  engineDisplacementMax: undefined,
  horsepowerMin: undefined,
  horsepowerMax: undefined,
  yearMin: undefined,
  yearMax: undefined,
  priceMin: undefined,
  priceMax: undefined,
  mileageMin: undefined,
  mileageMax: undefined,
  makes: [],
  models: [],
  transmissionType: [],
  fuelType: [],
  bodyType: [],
  soundProfile: {},
  showSold: false,
  // New fields defaults
  drivetrain: [],
  color: [],
  sellerType: [],
  doors: [],
  seats: [],
  condition: [],
  performancePreset: null,
  engineDetailConfiguration: [],
  forcedInductionDetail: [],
  heritageEra: [],
  isSpecialEdition: false,
  accelerationMax: undefined,
  topSpeedMin: undefined,
  location: undefined,
};

/**
 * Defines which fields belong to each filter section, for section clear logic.
 */
export const FILTER_SECTIONS: Record<string, (keyof FilterState)[]> = {
  price: ['priceMin', 'priceMax'],
  year: ['yearMin', 'yearMax'],
  mileage: ['mileageMin', 'mileageMax'],
  make: ['makes', 'models'],
  engine: ['engineDisplacementMin', 'engineDisplacementMax', 'horsepowerMin', 'horsepowerMax'],
  transmission: ['transmissionType'],
  fuelType: ['fuelType'],
  bodyType: ['bodyType'],
  sound: ['soundProfile'],
  drivetrain: ['drivetrain'],
  color: ['color'],
  sellerType: ['sellerType'],
  doorsSeats: ['doors', 'seats'],
  condition: ['condition'],
  enginePerformance: ['engineDetailConfiguration', 'forcedInductionDetail', 'accelerationMax', 'topSpeedMin'],
  heritageEdition: ['heritageEra', 'isSpecialEdition'],
  presets: ['performancePreset'],
};

/**
 * Validates the filter state for inverted ranges.
 */
export function validateFilters(state: FilterState): ValidationError[] {
  const errors: ValidationError[] = [];

  if (
    state.engineDisplacementMin !== undefined &&
    state.engineDisplacementMax !== undefined &&
    state.engineDisplacementMin > state.engineDisplacementMax
  ) {
    errors.push({
      field: 'engineDisplacement',
      message: 'Minimum engine displacement must be ≤ maximum',
    });
  }

  if (
    state.horsepowerMin !== undefined &&
    state.horsepowerMax !== undefined &&
    state.horsepowerMin > state.horsepowerMax
  ) {
    errors.push({
      field: 'horsepower',
      message: 'Minimum horsepower must be ≤ maximum',
    });
  }

  if (
    state.yearMin !== undefined &&
    state.yearMax !== undefined &&
    state.yearMin > state.yearMax
  ) {
    errors.push({
      field: 'year',
      message: 'Minimum year must be ≤ maximum',
    });
  }

  if (
    state.priceMin !== undefined &&
    state.priceMax !== undefined &&
    state.priceMin > state.priceMax
  ) {
    errors.push({
      field: 'price',
      message: 'Minimum price must be ≤ maximum',
    });
  }

  if (
    state.mileageMin !== undefined &&
    state.mileageMax !== undefined &&
    state.mileageMin > state.mileageMax
  ) {
    errors.push({
      field: 'mileage',
      message: 'Minimum mileage must be ≤ maximum',
    });
  }

  // Performance figure range validations
  if (state.accelerationMax !== undefined && state.accelerationMax <= 0) {
    errors.push({
      field: 'accelerationMax',
      message: 'Maximum acceleration time must be > 0',
    });
  }

  if (state.topSpeedMin !== undefined && state.topSpeedMin <= 0) {
    errors.push({
      field: 'topSpeedMin',
      message: 'Minimum top speed must be > 0',
    });
  }

  return errors;
}

/**
 * Builds a FilterCriteria from the current FilterState for the API.
 */
export function buildCriteria(
  state: FilterState,
  sorting?: { sortBy: SortField; sortOrder: SortOrder; page: number; pageSize: number }
): FilterCriteria {
  const criteria: FilterCriteria = {};

  // Existing range fields
  if (state.engineDisplacementMin !== undefined) criteria.engineDisplacementMin = state.engineDisplacementMin;
  if (state.engineDisplacementMax !== undefined) criteria.engineDisplacementMax = state.engineDisplacementMax;
  if (state.horsepowerMin !== undefined) criteria.horsepowerMin = state.horsepowerMin;
  if (state.horsepowerMax !== undefined) criteria.horsepowerMax = state.horsepowerMax;
  if (state.yearMin !== undefined) criteria.yearMin = state.yearMin;
  if (state.yearMax !== undefined) criteria.yearMax = state.yearMax;
  if (state.priceMin !== undefined) criteria.priceMin = state.priceMin;
  if (state.priceMax !== undefined) criteria.priceMax = state.priceMax;
  if (state.mileageMin !== undefined) criteria.mileageMin = state.mileageMin;
  if (state.mileageMax !== undefined) criteria.mileageMax = state.mileageMax;

  // Existing arrays
  if (state.makes.length > 0) criteria.makes = state.makes;
  if (state.models.length > 0) criteria.models = state.models;
  if (state.transmissionType.length > 0) criteria.transmissionType = state.transmissionType;
  if (state.fuelType.length > 0) criteria.fuelType = state.fuelType;
  if (state.bodyType.length > 0) criteria.bodyType = state.bodyType;

  // Sound profile
  const sp = state.soundProfile;
  const hasSoundFilters =
    (sp.engineConfiguration && sp.engineConfiguration.length > 0) ||
    (sp.cylinderCount && sp.cylinderCount.length > 0) ||
    (sp.forcedInduction && sp.forcedInduction.length > 0) ||
    (sp.exhaustNote && sp.exhaustNote.length > 0);
  if (hasSoundFilters) {
    criteria.soundProfile = sp;
  }

  if (state.showSold) {
    criteria.showSold = true;
  }

  // New filter fields
  if (state.drivetrain.length > 0) criteria.drivetrain = state.drivetrain;
  if (state.color.length > 0) criteria.color = state.color;
  if (state.sellerType.length > 0) criteria.sellerType = state.sellerType;
  if (state.doors.length > 0) criteria.doors = state.doors;
  if (state.seats.length > 0) criteria.seats = state.seats;
  if (state.condition.length > 0) criteria.condition = state.condition;
  if (state.engineDetailConfiguration.length > 0) criteria.engineDetailConfiguration = state.engineDetailConfiguration;
  if (state.forcedInductionDetail.length > 0) criteria.forcedInductionDetail = state.forcedInductionDetail;
  if (state.heritageEra.length > 0) criteria.heritageEra = state.heritageEra;
  if (state.isSpecialEdition) criteria.isSpecialEdition = true;
  if (state.accelerationMax !== undefined) criteria.accelerationMax = state.accelerationMax;
  if (state.topSpeedMin !== undefined) criteria.topSpeedMin = state.topSpeedMin;
  if (state.location) criteria.location = state.location;

  // Sorting
  if (sorting) {
    criteria.sortBy = sorting.sortBy;
    criteria.sortOrder = sorting.sortOrder;
    criteria.page = sorting.page;
    criteria.pageSize = sorting.pageSize;
  }

  return criteria;
}

/**
 * Checks if any filter is active (non-default).
 */
export function hasActiveFilters(state: FilterState): boolean {
  return (
    state.engineDisplacementMin !== undefined ||
    state.engineDisplacementMax !== undefined ||
    state.horsepowerMin !== undefined ||
    state.horsepowerMax !== undefined ||
    state.yearMin !== undefined ||
    state.yearMax !== undefined ||
    state.priceMin !== undefined ||
    state.priceMax !== undefined ||
    state.mileageMin !== undefined ||
    state.mileageMax !== undefined ||
    state.makes.length > 0 ||
    state.models.length > 0 ||
    state.transmissionType.length > 0 ||
    state.fuelType.length > 0 ||
    state.bodyType.length > 0 ||
    state.showSold ||
    Object.values(state.soundProfile).some((v) => Array.isArray(v) && v.length > 0) ||
    state.drivetrain.length > 0 ||
    state.color.length > 0 ||
    state.sellerType.length > 0 ||
    state.doors.length > 0 ||
    state.seats.length > 0 ||
    state.condition.length > 0 ||
    state.engineDetailConfiguration.length > 0 ||
    state.forcedInductionDetail.length > 0 ||
    state.heritageEra.length > 0 ||
    state.isSpecialEdition ||
    state.accelerationMax !== undefined ||
    state.topSpeedMin !== undefined ||
    state.location !== undefined
  );
}

/**
 * Applies a performance preset by expanding its filter values into state.
 * Clears existing filter state before applying preset filters.
 */
export function applyPreset(presetId: PerformancePresetId): FilterState {
  const preset = PERFORMANCE_PRESETS.find((p) => p.id === presetId);
  if (!preset) return { ...INITIAL_FILTER_STATE };

  const newState: FilterState = { ...INITIAL_FILTER_STATE, performancePreset: presetId };
  const f = preset.filters;

  // Expand preset filters into state
  if (f.horsepowerMin !== undefined) newState.horsepowerMin = f.horsepowerMin;
  if (f.horsepowerMax !== undefined) newState.horsepowerMax = f.horsepowerMax;
  if (f.yearMin !== undefined) newState.yearMin = f.yearMin;
  if (f.yearMax !== undefined) newState.yearMax = f.yearMax;
  if (f.priceMin !== undefined) newState.priceMin = f.priceMin;
  if (f.priceMax !== undefined) newState.priceMax = f.priceMax;
  if (f.mileageMin !== undefined) newState.mileageMin = f.mileageMin;
  if (f.mileageMax !== undefined) newState.mileageMax = f.mileageMax;
  if (f.makes) newState.makes = [...f.makes];
  if (f.models) newState.models = [...f.models];
  if (f.transmissionType) newState.transmissionType = [...f.transmissionType];
  if (f.fuelType) newState.fuelType = [...f.fuelType];
  if (f.bodyType) newState.bodyType = [...f.bodyType];
  if (f.soundProfile) newState.soundProfile = { ...f.soundProfile };
  if (f.drivetrain) newState.drivetrain = [...f.drivetrain];
  if (f.color) newState.color = [...f.color];
  if (f.sellerType) newState.sellerType = [...f.sellerType];
  if (f.doors) newState.doors = [...f.doors];
  if (f.seats) newState.seats = [...f.seats];
  if (f.condition) newState.condition = [...f.condition];
  if (f.engineDetailConfiguration) newState.engineDetailConfiguration = [...f.engineDetailConfiguration];
  if (f.forcedInductionDetail) newState.forcedInductionDetail = [...f.forcedInductionDetail];
  if (f.heritageEra) newState.heritageEra = [...f.heritageEra];
  if (f.isSpecialEdition !== undefined) newState.isSpecialEdition = f.isSpecialEdition;
  if (f.accelerationMax !== undefined) newState.accelerationMax = f.accelerationMax;
  if (f.topSpeedMin !== undefined) newState.topSpeedMin = f.topSpeedMin;
  if (f.showSold !== undefined) newState.showSold = f.showSold;

  return newState;
}

/**
 * Clears models that do not belong to any of the selected makes.
 * If modelsByMake is not provided, all models are cleared when makes change.
 */
export function clearInvalidModels(
  models: string[],
  newMakes: string[],
  modelsByMake: Record<string, string[]> | undefined
): string[] {
  if (newMakes.length === 0) {
    // No make selected: keep all models (they'll see all available)
    return models;
  }
  if (!modelsByMake) {
    // No model map available: clear all models on make change
    return [];
  }
  const validModels = new Set(newMakes.flatMap((make) => modelsByMake[make] || []));
  return models.filter((model) => validModels.has(model));
}

/**
 * Resets a named filter section to defaults without affecting other sections.
 */
export function clearSection(state: FilterState, section: string): FilterState {
  const fields = FILTER_SECTIONS[section];
  if (!fields) return state;

  const newState = { ...state };
  for (const field of fields) {
    (newState as Record<string, unknown>)[field] = INITIAL_FILTER_STATE[field];
  }
  // If any field was part of a preset, deactivate the preset
  if (newState.performancePreset !== null && section !== 'presets') {
    newState.performancePreset = null;
  }
  return newState;
}

export interface UseFiltersOptions {
  sortBy?: SortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
  /** Available models grouped by make, for dependent make-model logic */
  modelsByMake?: Record<string, string[]>;
}

export function useFilters(options: UseFiltersOptions = {}) {
  const { sortBy = 'price', sortOrder = 'desc', page = 1, pageSize = 50, modelsByMake } = options;

  // Initialize from URL params on mount
  const [filters, setFilters] = useState<FilterState>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const deserialized = deserializeFilters(params);

      // Map deserialized FilterCriteria fields to FilterState
      const initial: FilterState = { ...INITIAL_FILTER_STATE };

      // Standard fields from URL
      if (deserialized.engineDisplacementMin !== undefined) initial.engineDisplacementMin = deserialized.engineDisplacementMin;
      if (deserialized.engineDisplacementMax !== undefined) initial.engineDisplacementMax = deserialized.engineDisplacementMax;
      if (deserialized.horsepowerMin !== undefined) initial.horsepowerMin = deserialized.horsepowerMin;
      if (deserialized.horsepowerMax !== undefined) initial.horsepowerMax = deserialized.horsepowerMax;
      if (deserialized.yearMin !== undefined) initial.yearMin = deserialized.yearMin;
      if (deserialized.yearMax !== undefined) initial.yearMax = deserialized.yearMax;
      if (deserialized.priceMin !== undefined) initial.priceMin = deserialized.priceMin;
      if (deserialized.priceMax !== undefined) initial.priceMax = deserialized.priceMax;
      if (deserialized.mileageMin !== undefined) initial.mileageMin = deserialized.mileageMin;
      if (deserialized.mileageMax !== undefined) initial.mileageMax = deserialized.mileageMax;
      if (deserialized.makes) initial.makes = deserialized.makes;
      if (deserialized.models) initial.models = deserialized.models;
      if (deserialized.transmissionType) initial.transmissionType = deserialized.transmissionType;
      if (deserialized.fuelType) initial.fuelType = deserialized.fuelType;
      if (deserialized.bodyType) initial.bodyType = deserialized.bodyType;
      if (deserialized.showSold) initial.showSold = deserialized.showSold;

      // New fields from URL — validate enum values, discard invalid ones
      if (deserialized.drivetrain) {
        const validDrivetrains: DrivetrainType[] = ['rwd', 'fwd', 'awd'];
        initial.drivetrain = (deserialized.drivetrain as string[]).filter(
          (v): v is DrivetrainType => validDrivetrains.includes(v as DrivetrainType)
        );
      }
      if (deserialized.color) initial.color = deserialized.color;
      if (deserialized.sellerType) {
        const validSellerTypes: SellerType[] = ['dealer', 'private'];
        initial.sellerType = (deserialized.sellerType as string[]).filter(
          (v): v is SellerType => validSellerTypes.includes(v as SellerType)
        );
      }
      if (deserialized.doors) initial.doors = deserialized.doors;
      if (deserialized.seats) initial.seats = deserialized.seats;
      if (deserialized.condition) {
        const validConditions: ConditionType[] = ['new', 'used', 'classic'];
        initial.condition = (deserialized.condition as string[]).filter(
          (v): v is ConditionType => validConditions.includes(v as ConditionType)
        );
      }
      if (deserialized.performancePreset !== undefined) {
        const validPresets: PerformancePresetId[] = ['v8_grand_tourers', 'track_weapons', 'daily_luxury', 'classic_collectibles'];
        initial.performancePreset = validPresets.includes(deserialized.performancePreset as PerformancePresetId)
          ? (deserialized.performancePreset as PerformancePresetId)
          : null;
      }
      if (deserialized.engineDetailConfiguration) {
        const validEngineConfigs: EngineDetailConfiguration[] = ['inline-4', 'inline-6', 'v6', 'v8', 'v10', 'v12', 'flat-4', 'flat-6', 'w12', 'rotary'];
        initial.engineDetailConfiguration = (deserialized.engineDetailConfiguration as string[]).filter(
          (v): v is EngineDetailConfiguration => validEngineConfigs.includes(v as EngineDetailConfiguration)
        );
      }
      if (deserialized.forcedInductionDetail) {
        const validInduction: ForcedInductionDetail[] = ['naturally_aspirated', 'turbocharged', 'supercharged', 'twin_turbo'];
        initial.forcedInductionDetail = (deserialized.forcedInductionDetail as string[]).filter(
          (v): v is ForcedInductionDetail => validInduction.includes(v as ForcedInductionDetail)
        );
      }
      if (deserialized.heritageEra) {
        const validEras: HeritageEra[] = ['classic', 'modern_classic', 'contemporary'];
        initial.heritageEra = (deserialized.heritageEra as string[]).filter(
          (v): v is HeritageEra => validEras.includes(v as HeritageEra)
        );
      }
      if (deserialized.isSpecialEdition) initial.isSpecialEdition = deserialized.isSpecialEdition;
      if (deserialized.accelerationMax !== undefined && deserialized.accelerationMax > 0) {
        initial.accelerationMax = deserialized.accelerationMax;
      }
      if (deserialized.topSpeedMin !== undefined && deserialized.topSpeedMin > 0) {
        initial.topSpeedMin = deserialized.topSpeedMin;
      }

      // Also read legacy params not covered by the shared serializer
      const legacyMakes = params.get('makes')?.split(',').filter(Boolean);
      const legacyModels = params.get('models')?.split(',').filter(Boolean);
      if (legacyMakes && legacyMakes.length > 0 && initial.makes.length === 0) initial.makes = legacyMakes;
      if (legacyModels && legacyModels.length > 0 && initial.models.length === 0) initial.models = legacyModels;

      // Location param (from map "View all listings" link)
      const locationParam = params.get('location');
      if (locationParam) initial.location = locationParam;

      // Legacy range params — discard NaN values
      const legacyNumber = (key: string) => {
        const v = params.get(key);
        if (!v) return undefined;
        const num = Number(v);
        return Number.isNaN(num) ? undefined : num;
      };
      if (initial.priceMin === undefined) initial.priceMin = legacyNumber('priceMin');
      if (initial.priceMax === undefined) initial.priceMax = legacyNumber('priceMax');
      if (initial.mileageMin === undefined) initial.mileageMin = legacyNumber('mileageMin');
      if (initial.mileageMax === undefined) initial.mileageMax = legacyNumber('mileageMax');
      if (initial.yearMin === undefined) initial.yearMin = legacyNumber('yearMin');
      if (initial.yearMax === undefined) initial.yearMax = legacyNumber('yearMax');
      if (initial.horsepowerMin === undefined) initial.horsepowerMin = legacyNumber('horsepowerMin');
      if (initial.horsepowerMax === undefined) initial.horsepowerMax = legacyNumber('horsepowerMax');

      // Legacy arrays
      const legacyArray = (key: string) => params.get(key)?.split(',').filter(Boolean) || [];
      if (initial.transmissionType.length === 0) {
        const t = legacyArray('transmissionType');
        if (t.length > 0) initial.transmissionType = t as TransmissionType[];
      }
      if (initial.fuelType.length === 0) {
        const f = legacyArray('fuelType');
        if (f.length > 0) initial.fuelType = f as FuelType[];
      }
      if (initial.bodyType.length === 0) {
        const b = legacyArray('bodyType');
        if (b.length > 0) initial.bodyType = b as BodyType[];
      }
      if (!initial.showSold && params.get('showSold') === 'true') {
        initial.showSold = true;
      }

      return initial;
    } catch (e) {
      // If URL param deserialization fails entirely, start with clean defaults
      console.warn('[useFilters] Failed to parse URL params, using defaults:', e);
      return { ...INITIAL_FILTER_STATE };
    }
  });

  // ─── URL Sync ─────────────────────────────────────────────────────────────────
  // Sync filter state to URL on every change via history.replaceState
  const isFirstRender = useRef(true);
  useEffect(() => {
    // Skip the first render (state was initialized FROM URL)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const criteria = buildCriteria(filters);
    const params = serializeFilters(criteria);

    // Also serialize legacy fields that the shared serializer doesn't handle
    if (filters.makes.length > 0) params.set('makes', filters.makes.join(','));
    if (filters.models.length > 0) params.set('models', filters.models.join(','));
    if (filters.priceMin !== undefined) params.set('priceMin', String(filters.priceMin));
    if (filters.priceMax !== undefined) params.set('priceMax', String(filters.priceMax));
    if (filters.mileageMin !== undefined) params.set('mileageMin', String(filters.mileageMin));
    if (filters.mileageMax !== undefined) params.set('mileageMax', String(filters.mileageMax));
    if (filters.yearMin !== undefined) params.set('yearMin', String(filters.yearMin));
    if (filters.yearMax !== undefined) params.set('yearMax', String(filters.yearMax));
    if (filters.horsepowerMin !== undefined) params.set('horsepowerMin', String(filters.horsepowerMin));
    if (filters.horsepowerMax !== undefined) params.set('horsepowerMax', String(filters.horsepowerMax));
    if (filters.engineDisplacementMin !== undefined) params.set('displacementMin', String(filters.engineDisplacementMin));
    if (filters.engineDisplacementMax !== undefined) params.set('displacementMax', String(filters.engineDisplacementMax));
    if (filters.transmissionType.length > 0) params.set('transmissionType', filters.transmissionType.join(','));
    if (filters.fuelType.length > 0) params.set('fuelType', filters.fuelType.join(','));
    if (filters.bodyType.length > 0) params.set('bodyType', filters.bodyType.join(','));
    if (filters.showSold) params.set('showSold', 'true');
    if (filters.location) params.set('location', filters.location);

    const search = params.toString();
    const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [filters]);

  // ─── Validation ───────────────────────────────────────────────────────────────
  const validationErrors = useMemo(() => validateFilters(filters), [filters]);
  const isValid = validationErrors.length === 0;
  const filtersActive = hasActiveFilters(filters);

  // ─── Debounce for range values ────────────────────────────────────────────────
  // Extract range values to debounce
  const rangeValues = useMemo(
    () => ({
      priceMin: filters.priceMin,
      priceMax: filters.priceMax,
      horsepowerMin: filters.horsepowerMin,
      horsepowerMax: filters.horsepowerMax,
      yearMin: filters.yearMin,
      yearMax: filters.yearMax,
      engineDisplacementMin: filters.engineDisplacementMin,
      engineDisplacementMax: filters.engineDisplacementMax,
      mileageMin: filters.mileageMin,
      mileageMax: filters.mileageMax,
      accelerationMax: filters.accelerationMax,
      topSpeedMin: filters.topSpeedMin,
    }),
    [
      filters.priceMin, filters.priceMax,
      filters.horsepowerMin, filters.horsepowerMax,
      filters.yearMin, filters.yearMax,
      filters.engineDisplacementMin, filters.engineDisplacementMax,
      filters.mileageMin, filters.mileageMax,
      filters.accelerationMax, filters.topSpeedMin,
    ]
  );

  const debouncedRangeValues = useDebouncedValue(rangeValues, 400);

  // Build a "debounced" version of filters for the query key
  const debouncedFilters = useMemo<FilterState>(
    () => ({
      ...filters,
      ...debouncedRangeValues,
    }),
    [filters, debouncedRangeValues]
  );

  // Build criteria using debounced state for the query
  const criteria = useMemo(
    () => buildCriteria(debouncedFilters, { sortBy, sortOrder, page, pageSize }),
    [debouncedFilters, sortBy, sortOrder, page, pageSize]
  );

  // ─── TanStack Query ───────────────────────────────────────────────────────────
  const {
    data: filterResult,
    isLoading,
    error: queryError,
    isFetching,
  } = useQuery<FilterResult>({
    queryKey: ['filteredListings', criteria],
    queryFn: () => api.filterListings(criteria),
    enabled: isValid && filtersActive,
    staleTime: 30_000,
  });

  // ─── Preset Logic ─────────────────────────────────────────────────────────────
  const applyPresetAction = useCallback((presetId: PerformancePresetId) => {
    setFilters(applyPreset(presetId));
  }, []);

  const deactivatePreset = useCallback(() => {
    setFilters((prev) => ({ ...prev, performancePreset: null }));
  }, []);

  // ─── Update helpers ───────────────────────────────────────────────────────────

  /**
   * Generic state updater that deactivates active preset when user manually
   * modifies filters.
   */
  const updateState = useCallback((updater: (prev: FilterState) => FilterState) => {
    setFilters((prev) => {
      const next = updater(prev);
      // Deactivate preset if any filter was manually changed while preset is active
      if (prev.performancePreset !== null && next.performancePreset !== null) {
        return { ...next, performancePreset: null };
      }
      return next;
    });
  }, []);

  const updateRange = useCallback(
    (field: 'engineDisplacement' | 'horsepower' | 'year' | 'price' | 'mileage', min: number | undefined, max: number | undefined) => {
      updateState((prev) => ({
        ...prev,
        [`${field}Min`]: min,
        [`${field}Max`]: max,
      }));
    },
    [updateState]
  );

  const updateTransmission = useCallback((selected: string[]) => {
    updateState((prev) => ({
      ...prev,
      transmissionType: selected as TransmissionType[],
    }));
  }, [updateState]);

  const updateMakes = useCallback((selected: string[]) => {
    updateState((prev) => {
      const validModels = clearInvalidModels(prev.models, selected, modelsByMake);
      return {
        ...prev,
        makes: selected,
        models: validModels,
      };
    });
  }, [updateState, modelsByMake]);

  const updateModels = useCallback((selected: string[]) => {
    updateState((prev) => ({
      ...prev,
      models: selected,
    }));
  }, [updateState]);

  const setCategory = useCallback((categoryFilter: { makes?: string[]; models?: string[]; bodyType?: string[]; fuelType?: string[]; horsepowerMin?: number; transmissionType?: string[]; yearMax?: number }) => {
    updateState((prev) => ({
      ...prev,
      makes: categoryFilter.makes ?? [],
      models: categoryFilter.models ?? [],
      bodyType: (categoryFilter.bodyType ?? []) as BodyType[],
      fuelType: (categoryFilter.fuelType ?? []) as FuelType[],
      horsepowerMin: categoryFilter.horsepowerMin,
      yearMax: categoryFilter.yearMax,
      transmissionType: (categoryFilter.transmissionType ?? []) as TransmissionType[],
    }));
  }, [updateState]);

  const updateFuelType = useCallback((selected: string[]) => {
    updateState((prev) => ({
      ...prev,
      fuelType: selected as FuelType[],
    }));
  }, [updateState]);

  const updateBodyType = useCallback((selected: string[]) => {
    updateState((prev) => ({
      ...prev,
      bodyType: selected as BodyType[],
    }));
  }, [updateState]);

  const updateSoundProfile = useCallback((soundProfile: SoundFilterCriteria) => {
    updateState((prev) => ({
      ...prev,
      soundProfile,
    }));
  }, [updateState]);

  const updateShowSold = useCallback((showSold: boolean) => {
    updateState((prev) => ({
      ...prev,
      showSold,
    }));
  }, [updateState]);

  // New filter update functions
  const updateDrivetrain = useCallback((selected: DrivetrainType[]) => {
    updateState((prev) => ({ ...prev, drivetrain: selected }));
  }, [updateState]);

  const updateColor = useCallback((selected: string[]) => {
    updateState((prev) => ({ ...prev, color: selected }));
  }, [updateState]);

  const updateSellerType = useCallback((selected: SellerType[]) => {
    updateState((prev) => ({ ...prev, sellerType: selected }));
  }, [updateState]);

  const updateDoors = useCallback((selected: number[]) => {
    updateState((prev) => ({ ...prev, doors: selected }));
  }, [updateState]);

  const updateSeats = useCallback((selected: number[]) => {
    updateState((prev) => ({ ...prev, seats: selected }));
  }, [updateState]);

  const updateCondition = useCallback((selected: ConditionType[]) => {
    updateState((prev) => ({ ...prev, condition: selected }));
  }, [updateState]);

  const updateEngineDetailConfiguration = useCallback((selected: EngineDetailConfiguration[]) => {
    updateState((prev) => ({ ...prev, engineDetailConfiguration: selected }));
  }, [updateState]);

  const updateForcedInductionDetail = useCallback((selected: ForcedInductionDetail[]) => {
    updateState((prev) => ({ ...prev, forcedInductionDetail: selected }));
  }, [updateState]);

  const updateHeritageEra = useCallback((selected: HeritageEra[]) => {
    updateState((prev) => ({ ...prev, heritageEra: selected }));
  }, [updateState]);

  const updateIsSpecialEdition = useCallback((enabled: boolean) => {
    updateState((prev) => ({ ...prev, isSpecialEdition: enabled }));
  }, [updateState]);

  const updateAccelerationMax = useCallback((value: number | undefined) => {
    updateState((prev) => ({ ...prev, accelerationMax: value }));
  }, [updateState]);

  const updateTopSpeedMin = useCallback((value: number | undefined) => {
    updateState((prev) => ({ ...prev, topSpeedMin: value }));
  }, [updateState]);

  const updateLocation = useCallback((location: string | undefined) => {
    updateState((prev) => ({ ...prev, location }));
  }, [updateState]);

  // ─── Section Clear ────────────────────────────────────────────────────────────
  const clearFilterSection = useCallback((section: string) => {
    setFilters((prev) => clearSection(prev, section));
  }, []);

  // ─── Reset All ────────────────────────────────────────────────────────────────
  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTER_STATE);
  }, []);

  return {
    filters,
    validationErrors,
    isValid,
    filtersActive,
    filterResult,
    isLoading: isLoading && filtersActive,
    isFetching,
    queryError,
    // Range & existing
    updateRange,
    updateMakes,
    updateModels,
    setCategory,
    updateTransmission,
    updateFuelType,
    updateBodyType,
    updateSoundProfile,
    updateShowSold,
    // New filter updaters
    updateDrivetrain,
    updateColor,
    updateSellerType,
    updateDoors,
    updateSeats,
    updateCondition,
    updateEngineDetailConfiguration,
    updateForcedInductionDetail,
    updateHeritageEra,
    updateIsSpecialEdition,
    updateAccelerationMax,
    updateTopSpeedMin,
    updateLocation,
    // Presets
    applyPreset: applyPresetAction,
    deactivatePreset,
    // Section clear
    clearFilterSection,
    // Reset all
    resetFilters,
    // Expose debounced state for consumers that need to know
    debouncedFilters,
  };
}
