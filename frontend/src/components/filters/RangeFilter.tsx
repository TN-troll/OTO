import { useState } from 'react';

export interface RangeFilterProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  valueMin?: number;
  valueMax?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}

export function RangeFilter({
  label,
  min,
  max,
  step = 1,
  unit = '',
  valueMin,
  valueMax,
  onChange,
}: RangeFilterProps) {
  const [error, setError] = useState<string | null>(null);

  function handleMinChange(value: string) {
    const parsed = value === '' ? undefined : Number(value);
    const newMin = parsed;
    const currentMax = valueMax;

    if (newMin !== undefined && currentMax !== undefined && newMin > currentMax) {
      setError(`Min must be ≤ max`);
    } else {
      setError(null);
    }
    onChange(newMin, currentMax);
  }

  function handleMaxChange(value: string) {
    const parsed = value === '' ? undefined : Number(value);
    const newMax = parsed;
    const currentMin = valueMin;

    if (currentMin !== undefined && newMax !== undefined && currentMin > newMax) {
      setError(`Min must be ≤ max`);
    } else {
      setError(null);
    }
    onChange(currentMin, newMax);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder={`${min}${unit}`}
          value={valueMin ?? ''}
          onChange={(e) => handleMinChange(e.target.value)}
          aria-label={`${label} minimum`}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <span className="text-xs text-gray-400">–</span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder={`${max}${unit}`}
          value={valueMax ?? ''}
          onChange={(e) => handleMaxChange(e.target.value)}
          aria-label={`${label} maximum`}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
