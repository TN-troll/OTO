import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { FilterCriteria, SoundFilterCriteria, FilterResult, ValidationError } from '@car-ads/shared';
import type { TransmissionType, FuelType, SortField, SortOrder } from '@car-ads/shared';

export interface FilterState {
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
  makes: string[];
  models: string[];
  transmissionType: TransmissionType[];
  fuelType: FuelType[];
  soundProfile: SoundFilterCriteria;
}

const INITIAL_FILTER_STATE: FilterState = {
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
  soundProfile: {},
};

function validateFilters(state: FilterState): ValidationError[] {
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

  return errors;
}

function buildCriteria(state: FilterState, sorting?: { sortBy: SortField; sortOrder: SortOrder; page: number; pageSize: number }): FilterCriteria {
  const criteria: FilterCriteria = {};

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
  if (state.makes.length > 0) criteria.makes = state.makes;
  if (state.models.length > 0) criteria.models = state.models;
  if (state.transmissionType.length > 0) criteria.transmissionType = state.transmissionType;
  if (state.fuelType.length > 0) criteria.fuelType = state.fuelType;

  const sp = state.soundProfile;
  const hasSoundFilters =
    (sp.engineConfiguration && sp.engineConfiguration.length > 0) ||
    (sp.cylinderCount && sp.cylinderCount.length > 0) ||
    (sp.forcedInduction && sp.forcedInduction.length > 0) ||
    (sp.exhaustNote && sp.exhaustNote.length > 0);

  if (hasSoundFilters) {
    criteria.soundProfile = sp;
  }

  if (sorting) {
    criteria.sortBy = sorting.sortBy;
    criteria.sortOrder = sorting.sortOrder;
    criteria.page = sorting.page;
    criteria.pageSize = sorting.pageSize;
  }

  return criteria;
}

function hasActiveFilters(state: FilterState): boolean {
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
    Object.values(state.soundProfile).some((v) => Array.isArray(v) && v.length > 0)
  );
}

export interface UseFiltersOptions {
  sortBy?: SortField;
  sortOrder?: SortOrder;
  page?: number;
  pageSize?: number;
  initialFiltersFromParams?: {
    makes?: string[];
    models?: string[];
    priceMin?: number;
    priceMax?: number;
    mileageMin?: number;
    mileageMax?: number;
    yearMin?: number;
    yearMax?: number;
    horsepowerMin?: number;
    horsepowerMax?: number;
    transmissionType?: string[];
    fuelType?: string[];
  };
}

export function useFilters(options: UseFiltersOptions = {}) {
  const [filters, setFilters] = useState<FilterState>(() => {
    const init = options.initialFiltersFromParams;
    if (!init) return INITIAL_FILTER_STATE;
    return {
      ...INITIAL_FILTER_STATE,
      makes: init.makes ?? [],
      models: init.models ?? [],
      priceMin: init.priceMin,
      priceMax: init.priceMax,
      mileageMin: init.mileageMin,
      mileageMax: init.mileageMax,
      yearMin: init.yearMin,
      yearMax: init.yearMax,
      horsepowerMin: init.horsepowerMin,
      horsepowerMax: init.horsepowerMax,
      transmissionType: (init.transmissionType ?? []) as TransmissionType[],
      fuelType: (init.fuelType ?? []) as FuelType[],
    };
  });

  const { sortBy = 'dateAdded', sortOrder = 'desc', page = 1, pageSize = 50 } = options;

  const validationErrors = useMemo(() => validateFilters(filters), [filters]);
  const isValid = validationErrors.length === 0;
  const filtersActive = hasActiveFilters(filters);

  const criteria = useMemo(
    () => buildCriteria(filters, { sortBy, sortOrder, page, pageSize }),
    [filters, sortBy, sortOrder, page, pageSize]
  );

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

  const updateRange = useCallback(
    (field: 'engineDisplacement' | 'horsepower' | 'year' | 'price' | 'mileage', min: number | undefined, max: number | undefined) => {
      setFilters((prev) => ({
        ...prev,
        [`${field}Min`]: min,
        [`${field}Max`]: max,
      }));
    },
    []
  );

  const updateTransmission = useCallback((selected: string[]) => {
    setFilters((prev) => ({
      ...prev,
      transmissionType: selected as TransmissionType[],
    }));
  }, []);

  const updateMakes = useCallback((selected: string[]) => {
    setFilters((prev) => ({
      ...prev,
      makes: selected,
      // Clear models when make changes
      models: [],
    }));
  }, []);

  const updateModels = useCallback((selected: string[]) => {
    setFilters((prev) => ({
      ...prev,
      models: selected,
    }));
  }, []);

  const updateFuelType = useCallback((selected: string[]) => {
    setFilters((prev) => ({
      ...prev,
      fuelType: selected as FuelType[],
    }));
  }, []);

  const updateSoundProfile = useCallback((soundProfile: SoundFilterCriteria) => {
    setFilters((prev) => ({
      ...prev,
      soundProfile,
    }));
  }, []);

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
    updateRange,
    updateMakes,
    updateModels,
    updateTransmission,
    updateFuelType,
    updateSoundProfile,
    resetFilters,
  };
}
