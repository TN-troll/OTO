import type { SortField, SortOrder } from '@car-ads/shared';
import { useLanguage } from '../i18n';

interface SortControlsProps {
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortField, sortOrder: SortOrder) => void;
}

export function SortControls({ sortBy, sortOrder, onSortChange }: SortControlsProps) {
  const { t } = useLanguage();

  const SORT_FIELDS: { value: SortField; label: string }[] = [
    { value: 'dateAdded', label: t.dateAdded },
    { value: 'price', label: t.price },
    { value: 'horsepower', label: t.horsepower },
    { value: 'engineDisplacement', label: t.engineDisplacement },
    { value: 'year', label: t.year },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-surface-500">{t.sortBy}</span>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortField, sortOrder)}
        className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-medium text-surface-700 transition-all duration-200 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
      >
        {SORT_FIELDS.map((field) => (
          <option key={field.value} value={field.value}>{field.label}</option>
        ))}
      </select>
      <button
        onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
        className="rounded-lg border border-surface-200 bg-white px-3 py-2 text-xs font-medium text-surface-700 transition-all duration-200 hover:border-brand-accent hover:text-brand-accent focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sortOrder === 'asc' ? t.ascending : t.descending}
      </button>
    </div>
  );
}
