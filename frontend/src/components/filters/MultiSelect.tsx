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
      <legend className="block text-sm font-medium text-gray-700">{label}</legend>
      <div className="space-y-1">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => handleToggle(option.value)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
