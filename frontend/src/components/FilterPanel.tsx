import { useState } from 'react';
import { RangeFilter } from './filters/RangeFilter';
import { MultiSelect } from './filters/MultiSelect';
import { SoundFilters } from './filters/SoundFilters';
import { MakeModelSelector } from './filters/MakeModelSelector';
import { useFilterContext } from '../hooks/FilterContext';
import { useLanguage } from '../i18n';

const CURRENT_YEAR = new Date().getFullYear();

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, count = 0, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-surface-100 py-4 last:border-b-0 dark:border-white/[0.06]">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex min-h-[44px] w-full items-center justify-between text-left"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">{title}</span>
          {count > 0 && (
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand-accent px-1.5 text-[10px] font-bold text-brand">
              {count}
            </span>
          )}
        </div>
        <svg
          className={`h-4 w-4 text-surface-400 transition-transform duration-200 dark:text-surface-500 ${isOpen ? 'rotate-180' : ''}`}
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

export function FilterPanel() {
  const { t } = useLanguage();
  const {
    filters,
    validationErrors,
    isValid,
    filtersActive,
    filterResult,
    isFetching,
    updateRange,
    updateMakes,
    updateModels,
    updateTransmission,
    updateFuelType,
    updateBodyType,
    updateSoundProfile,
    updateShowSold,
    resetFilters,
  } = useFilterContext();

  const TRANSMISSION_OPTIONS = [
    { value: 'manual', label: t.manual },
    { value: 'automatic', label: t.automatic },
  ];

  const FUEL_TYPE_OPTIONS = [
    { value: 'petrol', label: t.petrol },
    { value: 'diesel', label: t.diesel },
    { value: 'hybrid', label: t.hybrid },
    { value: 'electric', label: t.electric },
  ];

  const BODY_TYPE_OPTIONS = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'coupe', label: 'Coupé' },
    { value: 'cabriolet', label: 'Cabriolet' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'suv', label: 'SUV' },
    { value: 'station', label: 'Stationwagon' },
    { value: 'mpv', label: 'MPV' },
    { value: 'roadster', label: 'Roadster' },
    { value: 'targa', label: 'Targa' },
    { value: 'shooting_brake', label: 'Shooting Brake' },
    { value: 'other', label: 'Overig' },
  ];

  // Count active filters per section
  const makesCount = filters.makes.length + filters.models.length;
  const priceCount = (filters.priceMin !== undefined ? 1 : 0) + (filters.priceMax !== undefined ? 1 : 0);
  const mileageCount = (filters.mileageMin !== undefined ? 1 : 0) + (filters.mileageMax !== undefined ? 1 : 0);
  const yearCount = (filters.yearMin !== undefined ? 1 : 0) + (filters.yearMax !== undefined ? 1 : 0);
  const hpCount = (filters.horsepowerMin !== undefined ? 1 : 0) + (filters.horsepowerMax !== undefined ? 1 : 0);
  const displacementCount = (filters.engineDisplacementMin !== undefined ? 1 : 0) + (filters.engineDisplacementMax !== undefined ? 1 : 0);
  const transmissionCount = filters.transmissionType.length;
  const fuelCount = filters.fuelType.length;
  const bodyTypeCount = filters.bodyType.length;
  const soundCount = Object.values(filters.soundProfile).filter((v) => Array.isArray(v) && v.length > 0).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <h2 className="text-base font-bold text-surface-900 dark:text-white">
          {t.filters}
        </h2>
        {filtersActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex min-h-[44px] items-center text-xs font-medium text-brand-accent transition-colors hover:text-primary-600"
          >
            {t.resetAll}
          </button>
        )}
      </div>

      {/* Loading indicator */}
      {isFetching && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-xs font-medium text-primary-700 dark:bg-surface-700 dark:text-surface-200">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {t.filtering}
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300" role="alert">
          {validationErrors.map((err) => (
            <p key={err.field}>{err.message}</p>
          ))}
        </div>
      )}

      {/* Result count */}
      {filtersActive && isValid && filterResult && !isFetching && (
        <div className="mb-4 rounded-lg bg-surface-100 px-3 py-2 text-xs font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-200">
          <span className="font-bold text-brand-accent">{filterResult.totalCount}</span>{' '}
          {filterResult.totalCount === 1 ? t.carFound : t.carsFound}
        </div>
      )}

      {/* Filter sections */}
      <CollapsibleSection title={t.make} defaultOpen count={makesCount}>
        <MakeModelSelector
          selectedMakes={filters.makes}
          selectedModels={filters.models}
          onMakesChange={updateMakes}
          onModelsChange={updateModels}
        />
      </CollapsibleSection>

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
          noThousandsSeparator
        />
      </CollapsibleSection>

      <CollapsibleSection title={t.mileage} count={mileageCount}>
        <RangeFilter
          label={`${t.mileage} (km)`}
          min={0}
          max={300000}
          step={5000}
          unit="km"
          valueMin={filters.mileageMin}
          valueMax={filters.mileageMax}
          onChange={(min, max) => updateRange('mileage', min, max)}
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

      <CollapsibleSection title="Carrosserie" count={bodyTypeCount}>
        <MultiSelect
          label="Carrosserie"
          options={BODY_TYPE_OPTIONS}
          selected={filters.bodyType}
          onChange={updateBodyType}
        />
      </CollapsibleSection>

      <CollapsibleSection title={t.soundProfile} count={soundCount}>
        <SoundFilters
          value={filters.soundProfile}
          onChange={updateSoundProfile}
        />
      </CollapsibleSection>

      {/* Show sold listings toggle — 44px touch target */}
      <div className="border-b border-surface-100 py-4 last:border-b-0 dark:border-white/[0.06]">
        <label className="flex min-h-[44px] cursor-pointer items-center justify-between">
          <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
            {t.showSoldListings}
          </span>
          <div className="relative flex h-11 w-11 items-center justify-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={filters.showSold}
              onChange={(e) => updateShowSold(e.target.checked)}
            />
            <div className="h-6 w-11 rounded-full bg-surface-200 transition-colors peer-checked:bg-brand-accent peer-focus:ring-2 peer-focus:ring-brand-accent/50 dark:bg-surface-600" />
            <div className="absolute left-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
          </div>
        </label>
      </div>
    </div>
  );
}
