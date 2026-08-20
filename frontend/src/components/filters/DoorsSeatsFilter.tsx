import { useFilterContext } from '../../hooks/FilterContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { CollapsibleSection } from './CollapsibleSection';

const DOOR_OPTIONS = [2, 3, 4, 5];
const SEAT_OPTIONS = [
  { value: 2, label: '2' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7+' },
];

export function DoorsSeatsFilter() {
  const { filters, updateDoors, updateSeats, clearFilterSection } = useFilterContext();
  const { t } = useLanguage();

  const selectedDoors = filters.doors;
  const selectedSeats = filters.seats;
  const activeCount = selectedDoors.length + selectedSeats.length;

  const toggleDoor = (value: number) => {
    const next = selectedDoors.includes(value)
      ? selectedDoors.filter((v) => v !== value)
      : [...selectedDoors, value];
    updateDoors(next);
  };

  const toggleSeat = (value: number) => {
    const next = selectedSeats.includes(value)
      ? selectedSeats.filter((v) => v !== value)
      : [...selectedSeats, value];
    updateSeats(next);
  };

  return (
    <CollapsibleSection
      title={`${t.filterSectionDoors} & ${t.filterSectionSeats}`}
      activeCount={activeCount}
      onClear={() => clearFilterSection('doorsSeats')}
    >
      <div className="space-y-4">
        {/* Doors */}
        <div>
          <span className="mb-2 block text-xs font-medium text-surface-600 dark:text-surface-400">
            {t.filterSectionDoors}
          </span>
          <div className="flex flex-wrap gap-2">
            {DOOR_OPTIONS.map((value) => {
              const isSelected = selectedDoors.includes(value);
              return (
                <button
                  key={`door-${value}`}
                  type="button"
                  onClick={() => toggleDoor(value)}
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
                  {value}
                </button>
              );
            })}
          </div>
        </div>

        {/* Seats */}
        <div>
          <span className="mb-2 block text-xs font-medium text-surface-600 dark:text-surface-400">
            {t.filterSectionSeats}
          </span>
          <div className="flex flex-wrap gap-2">
            {SEAT_OPTIONS.map(({ value, label }) => {
              const isSelected = selectedSeats.includes(value);
              return (
                <button
                  key={`seat-${value}`}
                  type="button"
                  onClick={() => toggleSeat(value)}
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
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
