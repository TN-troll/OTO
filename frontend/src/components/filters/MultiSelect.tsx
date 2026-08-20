export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  function handleToggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="block text-xs font-medium text-surface-500 dark:text-surface-400">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleToggle(option.value)}
              aria-pressed={isSelected}
              className={`
                min-h-[44px] min-w-[44px] rounded-full px-4 py-2
                text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${
                  isSelected
                    ? 'border border-brand-accent bg-brand-accent/10 text-brand-accent shadow-[0_0_12px_rgba(var(--color-accent-rgb),0.3)] backdrop-blur-[20px] scale-[0.97] dark:bg-brand-accent/20'
                    : 'border border-glass-border bg-glass-light text-surface-700 hover:border-brand-accent/40 hover:bg-white/80 active:scale-95 dark:bg-glass-dark dark:text-surface-300 dark:hover:bg-[rgba(30,30,30,0.85)]'
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
