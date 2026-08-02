import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { FilterCriteria, SoundFilterCriteria, FilterResult, ValidationError } from '@car-ads/shared';
import type { TransmissionType, FuelType } from '@car-ads/shared';

export interface FilterState {
  engineDisplacementMin?: number;
  engineDisplacementMax?: number;
  horsepowerMin?: number;
  horsepowerMax?: number;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
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

function buildCriteria(state: FilterState): FilterCriteria {
  const criteria: FilterCriteria = {};

  if (state.engineDisplacementMin !== undefined) criteria.engineDisplacementMin = state.engineDisplacementMin;
  if (state.engineDisplacementMax !== undefined) criteria.engineDisplacementMax = state.engineDisplacementMax;
  if (state.horsepowerMin !== undefined) criteria.horsepowerMin = state.horsepowerMin;
  if (state.horsepowerMax !== undefined) criteria.horsepowerMax = state.horsepowerMax;
  if (state.yearMin !== undefined) criteria.yearMin = state.yearMin;
  if (state.yearMax !== undefined) criteria.yearMax = state.yearMax;
  if (state.priceMin !== undefined) criteria.priceMin = state.priceMin;
  if (state.priceMax !== undefined) criteria.priceMax = state.priceMax;
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
    state.transmissionType.length > 0 ||
    state.fuelType.length > 0 ||
    Object.values(state.soundProfile).some((v) => Array.isArray(v) && v.length > 0)
  );
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);

  const validationErrors = useMemo(() => validateFilters(filters), [filters]);
  const isValid = validationErrors.length === 0;
  const filtersActive = hasActiveFilters(filters);

  const criteria = useMemo(() => buildCriteria(filters), [filters]);

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
    (field: 'engineDisplacement' | 'horsepower' | 'year' | 'price', min: number | undefined, max: number | undefined) => {
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
    updateTransmission,
    updateFuelType,
    updateSoundProfile,
    resetFilters,
  };
}
