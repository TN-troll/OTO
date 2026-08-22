import { PERFORMANCE_PRESETS } from '@car-ads/shared';
import type { PerformancePresetId } from '@car-ads/shared';
import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';

/** Background images for each preset — use high-quality Unsplash photos */
const PRESET_IMAGES: Record<PerformancePresetId, string> = {
  v8_grand_tourers: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop&q=80', // Winding mountain road
  track_weapons: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=200&fit=crop&q=80', // Race track
  daily_luxury: 'https://images.unsplash.com/photo-1615729947596-a598e5de0ab3?w=400&h=200&fit=crop&q=80', // Luxury/diamond
  classic_collectibles: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=200&fit=crop&q=80', // Classic car
};

/** Maps preset IDs to their i18n translation keys */
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
        const bgImage = PRESET_IMAGES[preset.id];

        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => applyPreset(preset.id)}
            className={`
              group relative min-h-[80px] overflow-hidden rounded-2xl
              will-change-transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
              border text-left hover:-translate-y-0.5 active:scale-[0.97]
              ${
                isActive
                  ? 'border-brand-accent/60 ring-2 ring-brand-accent/30 shadow-[0_0_20px_rgba(var(--color-accent-rgb),0.2)]'
                  : 'border-white/[0.15] hover:border-brand-accent/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] dark:border-white/[0.08] dark:hover:border-white/[0.15]'
              }
            `}
            aria-pressed={isActive}
          >
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
              style={{ backgroundImage: `url(${bgImage})` }}
            />

            {/* Dark gradient overlay for text readability */}
            <div className={`absolute inset-0 ${
              isActive
                ? 'bg-gradient-to-t from-black/80 via-black/50 to-brand-accent/20'
                : 'bg-gradient-to-t from-black/80 via-black/50 to-black/20'
            }`} />

            {/* Content */}
            <div className="relative z-10 flex h-full flex-col justify-end p-3">
              <span className={`text-[12px] font-bold leading-tight tracking-tight ${
                isActive ? 'text-brand-accent' : 'text-white'
              }`}>
                {t[keys.label]}
              </span>
              <span className="mt-0.5 text-[10px] leading-tight text-white/70">
                {t[keys.desc]}
              </span>
            </div>

            {/* Active indicator */}
            {isActive && (
              <div className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-brand-accent">
                <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
