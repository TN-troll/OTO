import { DEFAULT_RANGES } from '@car-ads/shared';
import { RangeFilter } from './filters/RangeFilter';
import { MultiSelect } from './filters/MultiSelect';
import { SoundFilters } from './filters/SoundFilters';
import { MakeModelSelector } from './filters/MakeModelSelector';
import { CollapsibleSection } from './filters/CollapsibleSection';
import { PresetCards } from './filters/PresetCards';
import { FilterSummaryBar } from './filters/FilterSummaryBar';
import { DrivetrainFilter } from './filters/DrivetrainFilter';
import { ColorFilter } from './filters/ColorFilter';
import { SellerTypeFilter } from './filters/SellerTypeFilter';
import { DoorsSeatsFilter } from './filters/DoorsSeatsFilter';
import { ConditionFilter } from './filters/ConditionFilter';
import { EnginePerformanceSection } from './filters/EnginePerformanceSection';
import { HeritageEditionSection } from './filters/HeritageEditionSection';
import { MobileFilterDrawer } from './filters/MobileFilterDrawer';
import { useFilterContext } from '../hooks/FilterContext';
import { useIsMobile } from '../hooks/useIsMobile';
import { useLanguage } from '../i18n';

/**
 * The core filter content rendered in both mobile drawer and desktop sidebar.
 * Contains all filter sections in the correct order:
 * 1. Quick Presets (top)
 * 2. Existing filters (Make/Model, Price, Year, HP, Displacement, Mileage, Transmission, Fuel, Body, Sound)
 * 3. New filters (Drivetrain, Color, Seller Type, Doors & Seats, Condition, Engine & Performance, Heritage & Edition)
 */
export function FilterContent() {
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
    clearFilterSection,
    filterOptions,
  } = useFilterContext();

  // Dynamic range bounds from filter options, fallback to shared constants
  const ranges = filterOptions?.ranges ?? DEFAULT_RANGES;

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

  // Count active filters per section for existing filters
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
    <>
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

      {/* Result count — shimmer animation while loading */}
      <div aria-live="polite" aria-atomic="true">
        {filtersActive && isValid && isFetching && (
          <div className="mb-4 rounded-lg bg-surface-100 px-3 py-2 dark:bg-surface-700">
            <div className="h-4 w-32 animate-shimmer rounded bg-gradient-to-r from-surface-200 via-surface-100 to-surface-200 bg-[length:200%_100%] dark:from-surface-600 dark:via-surface-700 dark:to-surface-600" />
          </div>
        )}
        {filtersActive && isValid && filterResult && !isFetching && (
          <div className="mb-4 rounded-lg bg-surface-100 px-3 py-2 text-xs font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-200">
            <span className="font-bold text-brand-accent">{filterResult.totalCount}</span>{' '}
            {filterResult.totalCount === 1 ? t.carFound : t.carsFound}
          </div>
        )}
      </div>

      {/* Filter Summary Bar — shows active filter chips above results */}
      <FilterSummaryBar />

      {/* ══════════════════════════════════════════════════════════════════════════
          1. Quick Presets (top)
         ══════════════════════════════════════════════════════════════════════════ */}
      <div className="border-b border-glass-border py-3 dark:border-white/[0.06]">
        <span className="mb-2 block text-sm font-semibold text-surface-800 dark:text-surface-200">
          {t.filterSectionPresets}
        </span>
        <PresetCards />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          2. Existing filters (Make/Model, Price, Year, HP, Displacement, Mileage,
             Transmission, Fuel Type, Body Type, Sound Profile)
         ══════════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-20">
        <CollapsibleSection
          title={t.make}
          defaultExpanded={true}
          activeCount={makesCount}
          onClear={() => clearFilterSection('make')}
        >
          <MakeModelSelector
            selectedMakes={filters.makes}
            selectedModels={filters.models}
            onMakesChange={updateMakes}
            onModelsChange={updateModels}
          />
        </CollapsibleSection>
      </div>

      <CollapsibleSection
        title={t.price}
        defaultExpanded={true}
        activeCount={priceCount}
        onClear={() => clearFilterSection('price')}
      >
        <RangeFilter
          label={`${t.price} (€)`}
          min={ranges.price.min}
          max={ranges.price.max}
          step={1000}
          unit="€"
          valueMin={filters.priceMin}
          valueMax={filters.priceMax}
          onChange={(min, max) => updateRange('price', min, max)}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t.year}
        defaultExpanded={false}
        activeCount={yearCount}
        onClear={() => clearFilterSection('year')}
      >
        <RangeFilter
          label={t.year}
          min={ranges.year.min}
          max={ranges.year.max}
          step={1}
          valueMin={filters.yearMin}
          valueMax={filters.yearMax}
          onChange={(min, max) => updateRange('year', min, max)}
          noThousandsSeparator
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t.horsepower}
        defaultExpanded={false}
        activeCount={hpCount}
        onClear={() => clearFilterSection('engine')}
      >
        <RangeFilter
          label={`${t.horsepower} (HP)`}
          min={ranges.horsepower.min}
          max={ranges.horsepower.max}
          step={10}
          unit="HP"
          valueMin={filters.horsepowerMin}
          valueMax={filters.horsepowerMax}
          onChange={(min, max) => updateRange('horsepower', min, max)}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t.engineDisplacement}
        defaultExpanded={false}
        activeCount={displacementCount}
        onClear={() => clearFilterSection('engine')}
      >
        <RangeFilter
          label={`${t.engineDisplacement} (cc)`}
          min={ranges.engineDisplacement.min}
          max={ranges.engineDisplacement.max}
          step={100}
          unit="cc"
          valueMin={filters.engineDisplacementMin}
          valueMax={filters.engineDisplacementMax}
          onChange={(min, max) => updateRange('engineDisplacement', min, max)}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t.mileage}
        defaultExpanded={false}
        activeCount={mileageCount}
        onClear={() => clearFilterSection('mileage')}
      >
        <RangeFilter
          label={`${t.mileage} (km)`}
          min={ranges.mileage.min}
          max={ranges.mileage.max}
          step={5000}
          unit="km"
          valueMin={filters.mileageMin}
          valueMax={filters.mileageMax}
          onChange={(min, max) => updateRange('mileage', min, max)}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t.transmission}
        defaultExpanded={false}
        activeCount={transmissionCount}
        onClear={() => clearFilterSection('transmission')}
      >
        <MultiSelect
          label={t.transmission}
          options={TRANSMISSION_OPTIONS}
          selected={filters.transmissionType}
          onChange={updateTransmission}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t.fuelType}
        defaultExpanded={false}
        activeCount={fuelCount}
        onClear={() => clearFilterSection('fuelType')}
      >
        <MultiSelect
          label={t.fuelType}
          options={FUEL_TYPE_OPTIONS}
          selected={filters.fuelType}
          onChange={updateFuelType}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Carrosserie"
        defaultExpanded={false}
        activeCount={bodyTypeCount}
        onClear={() => clearFilterSection('bodyType')}
      >
        <MultiSelect
          label="Carrosserie"
          options={BODY_TYPE_OPTIONS}
          selected={filters.bodyType}
          onChange={updateBodyType}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title={t.soundProfile}
        defaultExpanded={false}
        activeCount={soundCount}
        onClear={() => clearFilterSection('sound')}
      >
        <SoundFilters
          value={filters.soundProfile}
          onChange={updateSoundProfile}
        />
      </CollapsibleSection>

      {/* ══════════════════════════════════════════════════════════════════════════
          3. New filter sections
         ══════════════════════════════════════════════════════════════════════════ */}
      <DrivetrainFilter />
      <ColorFilter />
      <SellerTypeFilter />
      <DoorsSeatsFilter />
      <ConditionFilter />
      <EnginePerformanceSection />
      <HeritageEditionSection />

      {/* Show sold listings toggle — 44px touch target */}
      <div className="border-b border-glass-border py-4 last:border-b-0 dark:border-white/[0.06]">
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
    </>
  );
}

/**
 * FilterPanel — renders the full filter interface.
 *
 * Responsive behavior:
 * - Mobile (<768px): Renders FilterContent inside MobileFilterDrawer (slide-up overlay)
 * - Desktop (≥768px): Renders FilterContent inline with glass morphism panel styling
 *
 * Section order:
 * 1. Quick Presets (top)
 * 2. Existing filters (Make/Model, Price, Year, HP, Displacement, Mileage, Transmission, Fuel, Body, Sound)
 * 3. New filters (Drivetrain, Color, Seller Type, Doors & Seats, Condition, Engine & Performance, Heritage & Edition)
 *
 * Make and Price sections are expanded by default (defaultExpanded={true}).
 * FilterSummaryBar is shown above filter sections when filters are active.
 */
export function FilterPanel() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <MobileFilterDrawer>
        <FilterContent />
      </MobileFilterDrawer>
    );
  }

  return (
    <div className="rounded-card border border-glass-border bg-glass-light p-4 backdrop-blur-glass dark:bg-glass-dark dark:border-white/[0.08]">
      <FilterContent />
    </div>
  );
}
