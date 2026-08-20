import type { HeritageEra } from '@car-ads/shared';
import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { CollapsibleSection } from './CollapsibleSection';

const HERITAGE_ERA_OPTIONS: { value: HeritageEra; labelKey: string }[] = [
  { value: 'classic', labelKey: 'heritageEraClassic' },
  { value: 'modern_classic', labelKey: 'heritageEraModernClassic' },
  { value: 'contemporary', labelKey: 'heritageEraContemporary' },
];

export function HeritageEditionSection() {
  const {
    filters,
    updateHeritageEra,
    updateIsSpecialEdition,
    clearFilterSection,
  } = useFilterContext();
  const { t } = useLanguage();

  const selectedEras = filters.heritageEra;
  const isSpecialEdition = filters.isSpecialEdition;
  const activeCount = selectedEras.length + (isSpecialEdition ? 1 : 0);

  const toggleEra = (value: HeritageEra) => {
    const next = selectedEras.includes(value)
      ? selectedEras.filter((v) => v !== value)
      : [...selectedEras, value];
    updateHeritageEra(next);
  };

  return (
    <CollapsibleSection
      title={t.filterSectionHeritageEdition}
      activeCount={activeCount}
      onClear={() => clearFilterSection('heritageEdition')}
    >
      <div className="space-y-4">
        {/* Heritage Era Multi-select */}
        <div className="flex flex-wrap gap-2">
          {HERITAGE_ERA_OPTIONS.map(({ value, labelKey }) => {
            const isSelected = selectedEras.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => toggleEra(value)}
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

        {/* Special Edition Toggle */}
        <div className="flex min-h-[44px] items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-surface-800 dark:text-surface-200">
              {t.specialEdition}
            </span>
            <span className="text-xs text-surface-500 dark:text-surface-400">
              {t.specialEditionHint}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isSpecialEdition}
            onClick={() => updateIsSpecialEdition(!isSpecialEdition)}
            className={`
              relative inline-flex h-7 w-12 min-w-[44px] shrink-0 cursor-pointer items-center rounded-full
              transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${
                isSpecialEdition
                  ? 'bg-brand-accent shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.3)]'
                  : 'bg-surface-300 dark:bg-surface-600'
              }
            `}
          >
            <span
              className={`
                pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm
                transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${isSpecialEdition ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>
        </div>
      </div>
    </CollapsibleSection>
  );
}
