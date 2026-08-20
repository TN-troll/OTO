import { PERFORMANCE_PRESETS } from '@car-ads/shared';
import type { PerformancePresetId } from '@car-ads/shared';
import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';

/** Maps preset IDs to their display icon */
const PRESET_ICONS: Record<PerformancePresetId, string> = {
  v8_grand_tourers: '🏎️',
  track_weapons: '🏁',
  daily_luxury: '💎',
  classic_collectibles: '🕰️',
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
    <div className="grid grid-cols-2 gap-2">
      {PERFORMANCE_PRESETS.map((preset) => {
        const isActive = filters.performancePreset === preset.id;
        const keys = PRESET_LABEL_KEYS[preset.id];

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className={`
              flex min-h-[44px] flex-col items-start gap-1 rounded-xl px-3 py-3
              backdrop-blur-[20px] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
              border text-left
              ${
                isActive
                  ? 'border-brand-accent bg-brand-accent/10 shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.3)] dark:bg-brand-accent/20'
                  : 'border-white/18 bg-white/72 hover:border-brand-accent/40 hover:bg-white/80 dark:border-white/10 dark:bg-[rgba(30,30,30,0.72)] dark:hover:bg-[rgba(30,30,30,0.85)]'
              }
            `}
            aria-pressed={isActive}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {PRESET_ICONS[preset.id]}
            </span>
            <span className={`text-xs font-semibold leading-tight ${isActive ? 'text-brand-accent' : 'text-surface-800 dark:text-surface-200'}`}>
              {t[keys.label]}
            </span>
            <span className="text-[10px] leading-tight text-surface-500 dark:text-surface-400">
              {t[keys.desc]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
