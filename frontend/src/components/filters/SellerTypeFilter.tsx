import type { SellerType } from '@car-ads/shared';
import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { CollapsibleSection } from './CollapsibleSection';

const SELLER_TYPE_OPTIONS: { value: SellerType; labelKey: 'sellerTypeDealer' | 'sellerTypePrivate' }[] = [
  { value: 'dealer', labelKey: 'sellerTypeDealer' },
  { value: 'private', labelKey: 'sellerTypePrivate' },
];

export function SellerTypeFilter() {
  const { filters, updateSellerType, clearFilterSection } = useFilterContext();
  const { t } = useLanguage();

  const selected = filters.sellerType;

  const toggle = (value: SellerType) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    updateSellerType(next);
  };

  return (
    <CollapsibleSection
      title={t.filterSectionSellerType}
      activeCount={selected.length}
      onClear={() => clearFilterSection('sellerType')}
    >
      <div className="flex flex-wrap gap-2">
        {SELLER_TYPE_OPTIONS.map(({ value, labelKey }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => toggle(value)}
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
              {t[labelKey]}
            </button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
