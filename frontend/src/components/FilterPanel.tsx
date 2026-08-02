import { useState } from 'react';
import { RangeFilter } from './filters/RangeFilter';
import { MultiSelect } from './filters/MultiSelect';
import { SoundFilters } from './filters/SoundFilters';
import { useFilters } from '../hooks/useFilters';

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
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
}

export interface FilterPanelProps {
  onResultsChange?: (totalCount: number | null) => void;
}

export function FilterPanel({ onResultsChange }: FilterPanelProps) {
  const {
    filters,
    validationErrors,
    isValid,
    filtersActive,
    filterResult,
    isLoading,
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

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
          Filters
        </h2>
        {filtersActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-primary-600 hover:text-primary-800"
          >
            Reset all
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isFetching && (
        <div className="flex items-center gap-2 rounded bg-blue-50 px-2 py-1.5 text-xs text-blue-700">
          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Filtering...
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded bg-red-50 px-2 py-1.5 text-xs text-red-700" role="alert">
          {validationErrors.map((err) => (
            <p key={err.field}>{err.message}</p>
          ))}
        </div>
      )}

      {/* Result count */}
      {filtersActive && isValid && filterResult && !isFetching && (
        <div className="rounded bg-gray-50 px-2 py-1.5 text-xs text-gray-600">
          {filterResult.totalCount} {filterResult.totalCount === 1 ? 'car' : 'cars'} found
        </div>
      )}

      {/* Price Range */}
      <CollapsibleSection title="Price" defaultOpen>
        <RangeFilter
          label="Price (€)"
          min={0}
          max={50_000_000}
          step={1000}
          unit="€"
          valueMin={filters.priceMin}
          valueMax={filters.priceMax}
          onChange={(min, max) => updateRange('price', min, max)}
        />
      </CollapsibleSection>

      {/* Year Range */}
      <CollapsibleSection title="Year" defaultOpen>
        <RangeFilter
          label="Year"
          min={1950}
          max={CURRENT_YEAR}
          step={1}
          valueMin={filters.yearMin}
          valueMax={filters.yearMax}
          onChange={(min, max) => updateRange('year', min, max)}
        />
      </CollapsibleSection>

      {/* Horsepower Range */}
      <CollapsibleSection title="Horsepower" defaultOpen>
        <RangeFilter
          label="Horsepower (HP)"
          min={0}
          max={2000}
          step={10}
          unit="HP"
          valueMin={filters.horsepowerMin}
          valueMax={filters.horsepowerMax}
          onChange={(min, max) => updateRange('horsepower', min, max)}
        />
      </CollapsibleSection>

      {/* Engine Displacement Range */}
      <CollapsibleSection title="Engine Displacement">
        <RangeFilter
          label="Displacement (cc)"
          min={0}
          max={10_000}
          step={100}
          unit="cc"
          valueMin={filters.engineDisplacementMin}
          valueMax={filters.engineDisplacementMax}
          onChange={(min, max) => updateRange('engineDisplacement', min, max)}
        />
      </CollapsibleSection>

      {/* Transmission Type */}
      <CollapsibleSection title="Transmission">
        <MultiSelect
          label="Transmission Type"
          options={TRANSMISSION_OPTIONS}
          selected={filters.transmissionType}
          onChange={updateTransmission}
        />
      </CollapsibleSection>

      {/* Fuel Type */}
      <CollapsibleSection title="Fuel Type">
        <MultiSelect
          label="Fuel Type"
          options={FUEL_TYPE_OPTIONS}
          selected={filters.fuelType}
          onChange={updateFuelType}
        />
      </CollapsibleSection>

      {/* Sound Profile */}
      <CollapsibleSection title="Sound Profile">
        <SoundFilters
          value={filters.soundProfile}
          onChange={updateSoundProfile}
        />
      </CollapsibleSection>
    </div>
  );
}
