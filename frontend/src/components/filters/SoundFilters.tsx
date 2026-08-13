import { MultiSelect } from './MultiSelect';
import type { SoundFilterCriteria } from '@car-ads/shared';
import type { EngineConfiguration, ForcedInduction, ExhaustNote } from '@car-ads/shared';
import { useLanguage } from '../../i18n';

export interface SoundFiltersProps {
  value: SoundFilterCriteria;
  onChange: (criteria: SoundFilterCriteria) => void;
}

export function SoundFilters({ value, onChange }: SoundFiltersProps) {
  const { t } = useLanguage();

  const ENGINE_CONFIGURATION_OPTIONS = [
    { value: 'inline', label: t.inline },
    { value: 'v-type', label: t.vType },
    { value: 'flat', label: t.flatBoxer },
    { value: 'rotary', label: t.rotary },
  ];

  const CYLINDER_COUNT_OPTIONS = [
    { value: '4', label: `4 ${t.cylinders}` },
    { value: '6', label: `6 ${t.cylinders}` },
    { value: '8', label: `8 ${t.cylinders}` },
    { value: '10', label: `10 ${t.cylinders}` },
    { value: '12', label: `12 ${t.cylinders}` },
    { value: '16', label: `16 ${t.cylinders}` },
  ];

  const FORCED_INDUCTION_OPTIONS = [
    { value: 'naturally_aspirated', label: t.naturallyAspirated },
    { value: 'turbocharged', label: t.turbocharged },
    { value: 'supercharged', label: t.supercharged },
  ];

  const EXHAUST_NOTE_OPTIONS = [
    { value: 'deep_rumble', label: t.deepRumble },
    { value: 'high_pitched_scream', label: t.highPitchedScream },
    { value: 'aggressive_bark', label: t.aggressiveBark },
    { value: 'smooth_purr', label: t.smoothPurr },
  ];

  return (
    <div className="space-y-4">
      <MultiSelect
        label={t.engineConfiguration}
        options={ENGINE_CONFIGURATION_OPTIONS}
        selected={value.engineConfiguration ?? []}
        onChange={(selected) =>
          onChange({ ...value, engineConfiguration: selected as EngineConfiguration[] })
        }
      />
      <MultiSelect
        label={t.cylinderCount}
        options={CYLINDER_COUNT_OPTIONS}
        selected={(value.cylinderCount ?? []).map(String)}
        onChange={(selected) =>
          onChange({ ...value, cylinderCount: selected.map(Number) })
        }
      />
      <MultiSelect
        label={t.forcedInduction}
        options={FORCED_INDUCTION_OPTIONS}
        selected={value.forcedInduction ?? []}
        onChange={(selected) =>
          onChange({ ...value, forcedInduction: selected as ForcedInduction[] })
        }
      />
      <MultiSelect
        label={t.exhaustNote}
        options={EXHAUST_NOTE_OPTIONS}
        selected={value.exhaustNote ?? []}
        onChange={(selected) =>
          onChange({ ...value, exhaustNote: selected as ExhaustNote[] })
        }
      />
    </div>
  );
}
