import { MultiSelect } from './MultiSelect';
import type { SoundFilterCriteria } from '@car-ads/shared';
import type { EngineConfiguration, ForcedInduction, ExhaustNote } from '@car-ads/shared';

const ENGINE_CONFIGURATION_OPTIONS = [
  { value: 'inline', label: 'Inline' },
  { value: 'v-type', label: 'V-Type' },
  { value: 'flat', label: 'Flat / Boxer' },
  { value: 'rotary', label: 'Rotary' },
];

const CYLINDER_COUNT_OPTIONS = [
  { value: '4', label: '4 Cylinders' },
  { value: '6', label: '6 Cylinders' },
  { value: '8', label: '8 Cylinders' },
  { value: '10', label: '10 Cylinders' },
  { value: '12', label: '12 Cylinders' },
  { value: '16', label: '16 Cylinders' },
];

const FORCED_INDUCTION_OPTIONS = [
  { value: 'naturally_aspirated', label: 'Naturally Aspirated' },
  { value: 'turbocharged', label: 'Turbocharged' },
  { value: 'supercharged', label: 'Supercharged' },
];

const EXHAUST_NOTE_OPTIONS = [
  { value: 'deep_rumble', label: 'Deep Rumble' },
  { value: 'high_pitched_scream', label: 'High-Pitched Scream' },
  { value: 'aggressive_bark', label: 'Aggressive Bark' },
  { value: 'smooth_purr', label: 'Smooth Purr' },
];

export interface SoundFiltersProps {
  value: SoundFilterCriteria;
  onChange: (criteria: SoundFilterCriteria) => void;
}

export function SoundFilters({ value, onChange }: SoundFiltersProps) {
  return (
    <div className="space-y-4">
      <MultiSelect
        label="Engine Configuration"
        options={ENGINE_CONFIGURATION_OPTIONS}
        selected={value.engineConfiguration ?? []}
        onChange={(selected) =>
          onChange({ ...value, engineConfiguration: selected as EngineConfiguration[] })
        }
      />
      <MultiSelect
        label="Cylinder Count"
        options={CYLINDER_COUNT_OPTIONS}
        selected={(value.cylinderCount ?? []).map(String)}
        onChange={(selected) =>
          onChange({ ...value, cylinderCount: selected.map(Number) })
        }
      />
      <MultiSelect
        label="Forced Induction"
        options={FORCED_INDUCTION_OPTIONS}
        selected={value.forcedInduction ?? []}
        onChange={(selected) =>
          onChange({ ...value, forcedInduction: selected as ForcedInduction[] })
        }
      />
      <MultiSelect
        label="Exhaust Note"
        options={EXHAUST_NOTE_OPTIONS}
        selected={value.exhaustNote ?? []}
        onChange={(selected) =>
          onChange({ ...value, exhaustNote: selected as ExhaustNote[] })
        }
      />
    </div>
  );
}
