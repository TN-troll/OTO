import { PERFORMANCE_PRESETS } from '@car-ads/shared';
import type { PerformancePresetId } from '@car-ads/shared';
import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';

/** Premium SVG icons for each preset — refined line art style */
function GrandTourerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14.5h18M5.5 14.5l1-4h11l1 4M7.5 10.5l.5-2.5h8l.5 2.5" />
      <circle cx="7.5" cy="14.5" r="2" />
      <circle cx="16.5" cy="14.5" r="2" />
      <path d="M9.5 14.5h5" />
      <path d="M4 17.5h1M19 17.5h1" />
    </svg>
  );
}

function TrackWeaponIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v2M12 19v2M5.636 5.636l1.414 1.414M16.95 16.95l1.414 1.414M3 12h2M19 12h2M5.636 18.364l1.414-1.414M16.95 7.05l1.414-1.414" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}

function DailyLuxuryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L9.5 8.5H3l5.25 4L6 19l6-4.5L18 19l-2.25-6.5L21 8.5h-6.5L12 2z" />
    </svg>
  );
}

function ClassicCollectibleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 3h6l1.5 3H7.5L9 3z" />
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 8.5v1M12 14.5v1M8.5 12h1M14.5 12h1" />
      <path d="M12 12l2-2" />
    </svg>
  );
}

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
              className={`h-5 w-5 transition-colors duration-200 ${
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
