import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { CollapsibleSection } from './CollapsibleSection';

export function ColorFilter() {
  const { filters, updateColor, clearFilterSection, filterOptions } = useFilterContext();
  const { t } = useLanguage();

  const selected = filters.color;
  const availableColors = filterOptions?.colors ?? [];

  const toggle = (color: string) => {
    const next = selected.includes(color)
      ? selected.filter((v) => v !== color)
      : [...selected, color];
    updateColor(next);
  };

  if (availableColors.length === 0) {
    return null;
  }

  return (
    <CollapsibleSection
      title={t.filterSectionColor}
      activeCount={selected.length}
      onClear={() => clearFilterSection('color')}
    >
      <div className="flex flex-wrap gap-2">
        {availableColors.map((color) => {
          const isSelected = selected.includes(color);
          return (
            <button
              key={color}
              type="button"
              onClick={() => toggle(color)}
              aria-pressed={isSelected}
              className={`
                min-h-[44px] min-w-[44px] rounded-full px-4 py-2
                text-sm font-medium capitalize transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${
                  isSelected
                    ? 'border border-brand-accent bg-brand-accent/10 text-brand-accent shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.3)] backdrop-blur-[20px] dark:bg-brand-accent/20'
                    : 'border border-glass-border bg-glass-light text-surface-700 hover:border-brand-accent/40 hover:bg-white/80 dark:bg-glass-dark dark:text-surface-300 dark:hover:bg-[rgba(30,30,30,0.85)]'
                }
              `}
            >
              {color}
            </button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
