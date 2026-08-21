import { PERFORMANCE_PRESETS } from '@car-ads/shared';
import type { PerformancePresetId } from '@car-ads/shared';
import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  GrandTourerIcon,
  TrackWeaponIcon,
  DailyLuxuryIcon,
  ClassicCollectibleIcon,
} from '../icons/CategoryIcons';

/** Maps preset IDs to their icon components */
const PRESET_ICONS: Record<PerformancePresetId, React.FC<{ className?: string }>> = {
  v8_grand_tourers: GrandTourerIcon,
  track_weapons: TrackWeaponIcon,
  daily_luxury: DailyLuxuryIcon,
  classic_collectibles: ClassicCollectibleIcon,
};

/** Maps preset IDs to their i18n translation keys for label and description */
const PRESET_LABEL_KEYS: Record<PerformancePresetId, { label: keyof ReturnType<typeof useLanguage>['t']; desc: keyof ReturnType<typeof useLanguage>['t'] }> = {
  v8_grand_tourers: { label: 'presetV8GrandTourers', desc: 'presetV8GrandTourersDesc' },
  track_weapons: { label: 'presetTrackWeapons', desc: 'presetTrackWeaponsDesc' },
  daily_luxury: { label: 'presetDailyLuxury', desc: 'presetDailyLuxuryDesc' },
  classic_collectibles: { label: 'presetClassicCollectibles', desc: 'presetClassicCollectiblesDesc' },
};

export function PresetCards() {
  const { filters, applyPreset } = useFilterContext();
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {PERFORMANCE_PRESETS.map((preset) => {
        const isActive = filters.performancePreset === preset.id;
        const keys = PRESET_LABEL_KEYS[preset.id];
        const IconComponent = PRESET_ICONS[preset.id];

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className={`
              group flex min-h-[56px] flex-col items-start gap-1.5 rounded-2xl px-3.5 py-3
              backdrop-blur-[20px] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              border text-left
              ${
                isActive
                  ? 'border-brand-accent/60 bg-gradient-to-br from-brand-accent/15 to-brand-accent/5 shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.2)] dark:from-brand-accent/20 dark:to-brand-accent/5'
                  : 'border-white/[0.15] bg-white/60 hover:border-brand-accent/30 hover:bg-white/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] dark:border-white/[0.08] dark:bg-[rgba(30,30,30,0.60)] dark:hover:border-white/[0.15] dark:hover:bg-[rgba(30,30,30,0.80)]'
              }
            `}
            aria-pressed={isActive}
          >
            <IconComponent
              className={`h-6 w-12 transition-colors duration-200 ${
                isActive
                  ? 'text-brand-accent'
                  : 'text-surface-400 group-hover:text-brand-accent/70 dark:text-surface-500'
              }`}
            />
            <span className={`text-[11px] font-semibold leading-tight tracking-tight ${
              isActive ? 'text-brand-accent' : 'text-surface-800 dark:text-surface-200'
            }`}>
              {t[keys.label]}
            </span>
            <span className="text-[10px] leading-tight text-surface-400 dark:text-surface-500">
              {t[keys.desc]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
