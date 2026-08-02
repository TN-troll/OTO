import { useState } from 'react';
import { RangeFilter } from './filters/RangeFilter';
import { MultiSelect } from './filters/MultiSelect';
import { SoundFilters } from './filters/SoundFilters';
import { useFilters } from '../hooks/useFilters';
import { useLanguage } from '../i18n';

const CURRENT_YEAR = new Date().getFullYear();

const TRANSMISSION_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
];

const FUEL_TYPE_OPTIONS = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'electric', label: 'Electric' },
];

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, count = 0, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-surface-100 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-surface-800">{title}</span>
          {count > 0 && (
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-accent px-1.5 text-[10px] font-bold text-brand">
              {count}
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-surface-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'mt-4 max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

export interface FilterPanelProps {
  onResultsChange?: (totalCount: number | null) => void;
}

export function FilterPanel({ onResultsChange }: FilterPanelProps) {
  const { t } = useLanguage();
  const {
    filters,
    validationErrors,
    isValid,
    filtersActive,
    filterResult,
    isFetching,
    updateRange,
    updateTransmission,
    updateFuelType,
    updateSoundProfile,
    resetFilters,
  } = useFilters();

  // Notify parent of result changes
  if (onResultsChange) {
    if (filterResult) {
      onResultsChange(filterResult.totalCount);
    } else if (!filtersActive) {
      onResultsChange(null);
    }
  }

  // Count active filters per section
  const priceCount = (filters.priceMin !== undefined ? 1 : 0) + (filters.priceMax !== undefined ? 1 : 0);
  const yearCount = (filters.yearMin !== undefined ? 1 : 0) + (filters.yearMax !== undefined ? 1 : 0);
  const hpCount = (filters.horsepowerMin !== undefined ? 1 : 0) + (filters.horsepowerMax !== undefined ? 1 : 0);
  const displacementCount = (filters.engineDisplacementMin !== undefined ? 1 : 0) + (filters.engineDisplacementMax !== undefined ? 1 : 0);
  const transmissionCount = filters.transmissionType.length;
  const fuelCount = filters.fuelType.length;
  const soundCount = Object.values(filters.soundProfile).filter((v) => Array.isArray(v) && v.length > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-base font-bold text-surface-900">
          {t.filters}
        </h2>
        {filtersActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-brand-accent transition-colors hover:text-primary-600"
          >
            {t.resetAll}
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isFetching && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t.filtering}
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
          {validationErrors.map((err) => (
            <p key={err.field}>{err.message}</p>
          ))}
        </div>
      )}

      {/* Result count */}
      {filtersActive && isValid && filterResult && !isFetching && (
        <div className="mb-4 rounded-lg bg-surface-100 px-3 py-2 text-xs font-medium text-surface-700">
          <span className="font-bold text-brand-accent">{filterResult.totalCount}</span>{' '}
          {filterResult.totalCount === 1 ? t.carFound : t.carsFound}
        </div>
      )}

      {/* Filter sections */}
      <CollapsibleSection title={t.price} defaultOpen count={priceCount}>
        <RangeFilter
          label={`${t.price} (€)`}
          min={0}
          max={50_000_000}
          step={1000}
          unit="€"
          valueMin={filters.priceMin}
          valueMax={filters.priceMax}
          onChange={(min, max) => updateRange('price', min, max)}
        />
      </CollapsibleSection>

      <CollapsibleSection title={t.year} defaultOpen count={yearCount}>
        <RangeFilter
          label={t.year}
          min={1950}
          max={CURRENT_YEAR}
          step={1}
          valueMin={filters.yearMin}
          valueMax={filters.yearMax}
          onChange={(min, max) => updateRange('year', min, max)}
        />
      </CollapsibleSection>

      <CollapsibleSection title={t.horsepower} defaultOpen count={hpCount}>
        <RangeFilter
          label={`${t.horsepower} (HP)`}
          min={0}
          max={2000}
          step={10}
          unit="HP"
          valueMin={filters.horsepowerMin}
          valueMax={filters.horsepowerMax}
          onChange={(min, max) => updateRange('horsepower', min, max)}
        />
      </CollapsibleSection>

      <CollapsibleSection title={t.engineDisplacement} count={displacementCount}>
        <RangeFilter
          label={`${t.engineDisplacement} (cc)`}
          min={0}
          max={10_000}
          step={100}
          unit="cc"
          valueMin={filters.engineDisplacementMin}
          valueMax={filters.engineDisplacementMax}
          onChange={(min, max) => updateRange('engineDisplacement', min, max)}
        />
      </CollapsibleSection>

      <CollapsibleSection title={t.transmission} count={transmissionCount}>
        <MultiSelect
          label={t.transmission}
          options={TRANSMISSION_OPTIONS}
          selected={filters.transmissionType}
          onChange={updateTransmission}
        />
      </CollapsibleSection>

      <CollapsibleSection title={t.fuelType} count={fuelCount}>
        <MultiSelect
          label={t.fuelType}
          options={FUEL_TYPE_OPTIONS}
          selected={filters.fuelType}
          onChange={updateFuelType}
        />
      </CollapsibleSection>

      <CollapsibleSection title={t.soundProfile} count={soundCount}>
        <SoundFilters
          value={filters.soundProfile}
          onChange={updateSoundProfile}
        />
      </CollapsibleSection>
    </div>
  );
}
