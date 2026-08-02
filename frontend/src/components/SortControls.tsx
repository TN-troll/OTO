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
      <span className="text-xs text-gray-500">{t.sortBy}</span>
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortField, sortOrder)}
        className="rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {SORT_FIELDS.map((field) => (
          <option key={field.value} value={field.value}>{field.label}</option>
        ))}
      </select>
      <button
        onClick={() => onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc')}
        className="rounded border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sortOrder === 'asc' ? t.ascending : t.descending}
      </button>
    </div>
  );
}
