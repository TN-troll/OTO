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
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-all duration-150 ${
              selected.includes(option.value)
                ? 'bg-primary-50 text-surface-900 dark:bg-surface-700 dark:text-white'
                : 'text-surface-700 hover:bg-surface-50 dark:text-surface-300 dark:hover:bg-surface-700'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              className="h-5 w-5 rounded border-surface-300 text-brand-accent focus:ring-brand-accent/50"
            />
            <span className="font-medium">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
