import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { FilterChip } from './FilterChip';
import type {
  DrivetrainType,
  ConditionType,
  EngineDetailConfiguration,
  ForcedInductionDetail,
  HeritageEra,
  SellerType,
} from '@car-ads/shared';
import type { Translations } from '../../i18n/translations';

interface ChipDescriptor {
  key: string;
  label: string;
  onRemove: () => void;
}

/**
 * Abbreviates a number for display in chips.
 * e.g. 50000 → "50k", 1200000 → "1.2M", 200 → "200"
 */
function abbreviateNumber(n: number): string {
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const val = n / 1_000;
    return val % 1 === 0 ? `${val}k` : `${val.toFixed(1)}k`;
  }
  return String(n);
}

/** Maps drivetrain enum values to their i18n translation key */
const DRIVETRAIN_KEYS: Record<DrivetrainType, keyof Translations> = {
  rwd: 'drivetrainRwd',
  fwd: 'drivetrainFwd',
  awd: 'drivetrainAwd',
};

/** Maps condition enum values to their i18n translation key */
const CONDITION_KEYS: Record<ConditionType, keyof Translations> = {
  new: 'conditionNew',
  used: 'conditionUsed',
  classic: 'conditionClassic',
};

/** Maps engine detail configuration values to their i18n translation key */
const ENGINE_CONFIG_KEYS: Record<EngineDetailConfiguration, keyof Translations> = {
  'inline-4': 'engineConfigInline4',
  'inline-6': 'engineConfigInline6',
  v6: 'engineConfigV6',
  v8: 'engineConfigV8',
  v10: 'engineConfigV10',
  v12: 'engineConfigV12',
  'flat-4': 'engineConfigFlat4',
  'flat-6': 'engineConfigFlat6',
  w12: 'engineConfigW12',
  rotary: 'engineConfigRotary',
};

/** Maps forced induction detail values to their i18n translation key */
const FORCED_INDUCTION_KEYS: Record<ForcedInductionDetail, keyof Translations> = {
  naturally_aspirated: 'forcedInductionNaturallyAspirated',
  turbocharged: 'forcedInductionTurbocharged',
  supercharged: 'forcedInductionSupercharged',
  twin_turbo: 'forcedInductionTwinTurbo',
};

/** Maps heritage era values to their i18n translation key */
const HERITAGE_ERA_KEYS: Record<HeritageEra, keyof Translations> = {
  classic: 'heritageEraClassic',
  modern_classic: 'heritageEraModernClassic',
  contemporary: 'heritageEraContemporary',
};

/** Maps seller type values to their i18n translation key */
const SELLER_TYPE_KEYS: Record<SellerType, keyof Translations> = {
  dealer: 'sellerTypeDealer',
  private: 'sellerTypePrivate',
};

/**
 * Horizontal summary bar rendering one FilterChip per active filter.
 * Auto-hides when no filters are active.
 * Uses overflow-x-auto for horizontal scrolling when chips exceed width.
 */
export function FilterSummaryBar() {
  const {
    filters,
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
    updateRange,
    updateMakes,
    updateModels,
    updateTransmission,
    updateFuelType,
    updateBodyType,
  } = useFilterContext();
  const { t } = useLanguage();

  const chips: ChipDescriptor[] = [];

  // ─── Range filters (abbreviated format) ─────────────────────────────────────

  // Price range
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const min = filters.priceMin;
    const max = filters.priceMax;
    let label: string;
    if (min !== undefined && max !== undefined) {
      label = `€${abbreviateNumber(min)}–€${abbreviateNumber(max)}`;
    } else if (min !== undefined) {
      label = `≥ €${abbreviateNumber(min)}`;
    } else {
      label = `≤ €${abbreviateNumber(max!)}`;
    }
    chips.push({
      key: 'price',
      label,
      onRemove: () => updateRange('price', undefined, undefined),
    });
  }

  // Year range
  if (filters.yearMin !== undefined || filters.yearMax !== undefined) {
    const min = filters.yearMin;
    const max = filters.yearMax;
    let label: string;
    if (min !== undefined && max !== undefined) {
      label = `${min}–${max}`;
    } else if (min !== undefined) {
      label = `≥ ${min}`;
    } else {
      label = `≤ ${max}`;
    }
    chips.push({
      key: 'year',
      label,
      onRemove: () => updateRange('year', undefined, undefined),
    });
  }

  // Horsepower range
  if (filters.horsepowerMin !== undefined || filters.horsepowerMax !== undefined) {
    const min = filters.horsepowerMin;
    const max = filters.horsepowerMax;
    let label: string;
    if (min !== undefined && max !== undefined) {
      label = `${min}–${max} HP`;
    } else if (min !== undefined) {
      label = `≥ ${min} HP`;
    } else {
      label = `≤ ${max} HP`;
    }
    chips.push({
      key: 'horsepower',
      label,
      onRemove: () => updateRange('horsepower', undefined, undefined),
    });
  }

  // Engine displacement range
  if (filters.engineDisplacementMin !== undefined || filters.engineDisplacementMax !== undefined) {
    const min = filters.engineDisplacementMin;
    const max = filters.engineDisplacementMax;
    let label: string;
    if (min !== undefined && max !== undefined) {
      label = `${abbreviateNumber(min)}–${abbreviateNumber(max)} cc`;
    } else if (min !== undefined) {
      label = `≥ ${abbreviateNumber(min)} cc`;
    } else {
      label = `≤ ${abbreviateNumber(max!)} cc`;
    }
    chips.push({
      key: 'displacement',
      label,
      onRemove: () => updateRange('engineDisplacement', undefined, undefined),
    });
  }

  // Mileage range
  if (filters.mileageMin !== undefined || filters.mileageMax !== undefined) {
    const min = filters.mileageMin;
    const max = filters.mileageMax;
    let label: string;
    if (min !== undefined && max !== undefined) {
      label = `${abbreviateNumber(min)}–${abbreviateNumber(max)} km`;
    } else if (min !== undefined) {
      label = `≥ ${abbreviateNumber(min)} km`;
    } else {
      label = `≤ ${abbreviateNumber(max!)} km`;
    }
    chips.push({
      key: 'mileage',
      label,
      onRemove: () => updateRange('mileage', undefined, undefined),
    });
  }

  // Acceleration max
  if (filters.accelerationMax !== undefined) {
    chips.push({
      key: 'accelerationMax',
      label: `≤ ${filters.accelerationMax}s 0–100`,
      onRemove: () => updateAccelerationMax(undefined),
    });
  }

  // Top speed min
  if (filters.topSpeedMin !== undefined) {
    chips.push({
      key: 'topSpeedMin',
      label: `≥ ${filters.topSpeedMin} km/h`,
      onRemove: () => updateTopSpeedMin(undefined),
    });
  }

  // ─── Array filters (one chip per selected value) ────────────────────────────

  // Makes
  for (const make of filters.makes) {
    chips.push({
      key: `make-${make}`,
      label: make,
      onRemove: () => updateMakes(filters.makes.filter((m) => m !== make)),
    });
  }

  // Models
  for (const model of filters.models) {
    chips.push({
      key: `model-${model}`,
      label: model,
      onRemove: () => updateModels(filters.models.filter((m) => m !== model)),
    });
  }

  // Transmission
  for (const val of filters.transmissionType) {
    const label = val === 'manual' ? t.manual : t.automatic;
    chips.push({
      key: `transmission-${val}`,
      label,
      onRemove: () => updateTransmission(filters.transmissionType.filter((v) => v !== val)),
    });
  }

  // Fuel type
  for (const val of filters.fuelType) {
    const labelMap: Record<string, string> = {
      petrol: t.petrol,
      diesel: t.diesel,
      hybrid: t.hybrid,
      electric: t.electric,
    };
    chips.push({
      key: `fuel-${val}`,
      label: labelMap[val] || val,
      onRemove: () => updateFuelType(filters.fuelType.filter((v) => v !== val)),
    });
  }

  // Body type
  for (const val of filters.bodyType) {
    chips.push({
      key: `body-${val}`,
      label: val.charAt(0).toUpperCase() + val.slice(1),
      onRemove: () => updateBodyType(filters.bodyType.filter((v) => v !== val)),
    });
  }

  // Drivetrain
  for (const val of filters.drivetrain) {
    chips.push({
      key: `drivetrain-${val}`,
      label: t[DRIVETRAIN_KEYS[val]],
      onRemove: () => updateDrivetrain(filters.drivetrain.filter((v) => v !== val)),
    });
  }

  // Color
  for (const val of filters.color) {
    chips.push({
      key: `color-${val}`,
      label: val.charAt(0).toUpperCase() + val.slice(1),
      onRemove: () => updateColor(filters.color.filter((v) => v !== val)),
    });
  }

  // Seller type
  for (const val of filters.sellerType) {
    chips.push({
      key: `seller-${val}`,
      label: t[SELLER_TYPE_KEYS[val]],
      onRemove: () => updateSellerType(filters.sellerType.filter((v) => v !== val) as SellerType[]),
    });
  }

  // Doors
  for (const val of filters.doors) {
    chips.push({
      key: `doors-${val}`,
      label: `${val} ${t.filterSectionDoors.toLowerCase()}`,
      onRemove: () => updateDoors(filters.doors.filter((v) => v !== val)),
    });
  }

  // Seats
  for (const val of filters.seats) {
    chips.push({
      key: `seats-${val}`,
      label: `${val} ${t.filterSectionSeats.toLowerCase()}`,
      onRemove: () => updateSeats(filters.seats.filter((v) => v !== val)),
    });
  }

  // Condition
  for (const val of filters.condition) {
    chips.push({
      key: `condition-${val}`,
      label: t[CONDITION_KEYS[val]],
      onRemove: () => updateCondition(filters.condition.filter((v) => v !== val)),
    });
  }

  // Engine detail configuration
  for (const val of filters.engineDetailConfiguration) {
    chips.push({
      key: `engineConfig-${val}`,
      label: t[ENGINE_CONFIG_KEYS[val]],
      onRemove: () =>
        updateEngineDetailConfiguration(filters.engineDetailConfiguration.filter((v) => v !== val)),
    });
  }

  // Forced induction detail
  for (const val of filters.forcedInductionDetail) {
    chips.push({
      key: `induction-${val}`,
      label: t[FORCED_INDUCTION_KEYS[val]],
      onRemove: () =>
        updateForcedInductionDetail(filters.forcedInductionDetail.filter((v) => v !== val)),
    });
  }

  // Heritage era
  for (const val of filters.heritageEra) {
    chips.push({
      key: `era-${val}`,
      label: t[HERITAGE_ERA_KEYS[val]],
      onRemove: () => updateHeritageEra(filters.heritageEra.filter((v) => v !== val)),
    });
  }

  // ─── Boolean filter ─────────────────────────────────────────────────────────

  // Special edition
  if (filters.isSpecialEdition) {
    chips.push({
      key: 'specialEdition',
      label: t.specialEdition,
      onRemove: () => updateIsSpecialEdition(false),
    });
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  // Auto-hide when no filters are active
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto py-2 scrollbar-none" role="list" aria-label="Active filters">
      {chips.map((chip) => (
        <div key={chip.key} role="listitem">
          <FilterChip label={chip.label} onRemove={chip.onRemove} />
        </div>
      ))}
    </div>
  );
}
