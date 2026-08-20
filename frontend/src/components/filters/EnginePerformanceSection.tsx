import type { EngineDetailConfiguration, ForcedInductionDetail } from '@car-ads/shared';
import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { CollapsibleSection } from './CollapsibleSection';

const ENGINE_CONFIG_OPTIONS: { value: EngineDetailConfiguration; labelKey: string }[] = [
  { value: 'inline-4', labelKey: 'engineConfigInline4' },
  { value: 'inline-6', labelKey: 'engineConfigInline6' },
  { value: 'v6', labelKey: 'engineConfigV6' },
  { value: 'v8', labelKey: 'engineConfigV8' },
  { value: 'v10', labelKey: 'engineConfigV10' },
  { value: 'v12', labelKey: 'engineConfigV12' },
  { value: 'flat-4', labelKey: 'engineConfigFlat4' },
  { value: 'flat-6', labelKey: 'engineConfigFlat6' },
  { value: 'w12', labelKey: 'engineConfigW12' },
  { value: 'rotary', labelKey: 'engineConfigRotary' },
];

const INDUCTION_OPTIONS: { value: ForcedInductionDetail; labelKey: string }[] = [
  { value: 'naturally_aspirated', labelKey: 'forcedInductionNaturallyAspirated' },
  { value: 'turbocharged', labelKey: 'forcedInductionTurbocharged' },
  { value: 'supercharged', labelKey: 'forcedInductionSupercharged' },
  { value: 'twin_turbo', labelKey: 'forcedInductionTwinTurbo' },
];

export function EnginePerformanceSection() {
  const {
    filters,
    updateEngineDetailConfiguration,
    updateForcedInductionDetail,
    updateAccelerationMax,
    updateTopSpeedMin,
    clearFilterSection,
  } = useFilterContext();
  const { t } = useLanguage();

  const selectedEngineConfig = filters.engineDetailConfiguration;
  const selectedInduction = filters.forcedInductionDetail;
  const accelerationMax = filters.accelerationMax;
  const topSpeedMin = filters.topSpeedMin;

  const activeCount =
    selectedEngineConfig.length +
    selectedInduction.length +
    (accelerationMax !== undefined ? 1 : 0) +
    (topSpeedMin !== undefined ? 1 : 0);

  const toggleEngineConfig = (value: EngineDetailConfiguration) => {
    const next = selectedEngineConfig.includes(value)
      ? selectedEngineConfig.filter((v) => v !== value)
      : [...selectedEngineConfig, value];
    updateEngineDetailConfiguration(next);
  };

  const toggleInduction = (value: ForcedInductionDetail) => {
    const next = selectedInduction.includes(value)
      ? selectedInduction.filter((v) => v !== value)
      : [...selectedInduction, value];
    updateForcedInductionDetail(next);
  };

  const handleAccelerationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      updateAccelerationMax(undefined);
    } else {
      const num = parseFloat(raw);
      if (!isNaN(num) && num > 0) {
        updateAccelerationMax(num);
      }
    }
  };

  const handleTopSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      updateTopSpeedMin(undefined);
    } else {
      const num = parseInt(raw, 10);
      if (!isNaN(num) && num > 0) {
        updateTopSpeedMin(num);
      }
    }
  };

  return (
    <CollapsibleSection
      title={t.filterSectionEnginePerformance}
      activeCount={activeCount}
      onClear={() => clearFilterSection('enginePerformance')}
    >
      <div className="space-y-4">
        {/* Engine Detail Configuration */}
        <div>
          <span className="mb-2 block text-xs font-medium text-surface-600 dark:text-surface-400">
            {t.engineConfiguration}
          </span>
          <div className="flex flex-wrap gap-2">
            {ENGINE_CONFIG_OPTIONS.map(({ value, labelKey }) => {
              const isSelected = selectedEngineConfig.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleEngineConfig(value)}
                  aria-pressed={isSelected}
                  className={`
                    min-h-[44px] min-w-[44px] rounded-full px-4 py-2
                    text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${
                      isSelected
                        ? 'border border-brand-accent bg-brand-accent/10 text-brand-accent shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.3)] backdrop-blur-[20px] dark:bg-brand-accent/20'
                        : 'border border-glass-border bg-glass-light text-surface-700 hover:border-brand-accent/40 hover:bg-white/80 dark:bg-glass-dark dark:text-surface-300 dark:hover:bg-[rgba(30,30,30,0.85)]'
                    }
                  `}
                >
                  {t[labelKey as keyof typeof t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Forced Induction Detail */}
        <div>
          <span className="mb-2 block text-xs font-medium text-surface-600 dark:text-surface-400">
            {t.forcedInduction}
          </span>
          <div className="flex flex-wrap gap-2">
            {INDUCTION_OPTIONS.map(({ value, labelKey }) => {
              const isSelected = selectedInduction.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleInduction(value)}
                  aria-pressed={isSelected}
                  className={`
                    min-h-[44px] min-w-[44px] rounded-full px-4 py-2
                    text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
                    ${
                      isSelected
                        ? 'border border-brand-accent bg-brand-accent/10 text-brand-accent shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.3)] backdrop-blur-[20px] dark:bg-brand-accent/20'
                        : 'border border-glass-border bg-glass-light text-surface-700 hover:border-brand-accent/40 hover:bg-white/80 dark:bg-glass-dark dark:text-surface-300 dark:hover:bg-[rgba(30,30,30,0.85)]'
                    }
                  `}
                >
                  {t[labelKey as keyof typeof t]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Performance figures: number inputs */}
        <div className="grid grid-cols-2 gap-3">
          {/* Acceleration Max */}
          <div>
            <label
              htmlFor="accel-max-input"
              className="mb-1.5 block text-xs font-medium text-surface-600 dark:text-surface-400"
            >
              {t.accelerationMax}
            </label>
            <input
              id="accel-max-input"
              type="number"
              step="0.1"
              min="0"
              placeholder={t.placeholderMax}
              value={accelerationMax ?? ''}
              onChange={handleAccelerationChange}
              className="min-h-[44px] w-full rounded-xl border border-glass-border bg-glass-light px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:border-brand-accent focus:shadow-glass-glow focus:outline-none focus:ring-1 focus:ring-brand-accent dark:bg-glass-dark dark:text-surface-200 dark:placeholder:text-surface-500"
            />
          </div>

          {/* Top Speed Min */}
          <div>
            <label
              htmlFor="top-speed-min-input"
              className="mb-1.5 block text-xs font-medium text-surface-600 dark:text-surface-400"
            >
              {t.topSpeedMin}
            </label>
            <input
              id="top-speed-min-input"
              type="number"
              step="1"
              min="0"
              placeholder={t.placeholderMin}
              value={topSpeedMin ?? ''}
              onChange={handleTopSpeedChange}
              className="min-h-[44px] w-full rounded-xl border border-glass-border bg-glass-light px-3 py-2 text-sm text-surface-800 placeholder:text-surface-400 focus:border-brand-accent focus:shadow-glass-glow focus:outline-none focus:ring-1 focus:ring-brand-accent dark:bg-glass-dark dark:text-surface-200 dark:placeholder:text-surface-500"
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
