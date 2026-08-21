import { useState, useCallback } from 'react';
import { useLanguage } from '../../i18n';
import { formatNumber as formatLocaleNumber } from '../../utils/formatNumber';

export interface RangeFilterProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  valueMin?: number;
  valueMax?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
  /** When true, display numbers without thousands separator (e.g. for years) */
  noThousandsSeparator?: boolean;
}

/** Format number with locale-aware thousands separator */
function formatNumber(n: number, plain = false, locale: 'nl' | 'en' = 'nl'): string {
  if (plain) return String(n);
  return formatLocaleNumber(n, locale);
}

/** Parse a formatted string back to a number (removes locale separators) */
function parseFormattedNumber(s: string): number | undefined {
  // Remove both dots and commas used as thousands separators, keep decimal separator
  const cleaned = s.replace(/\./g, '').replace(/,/g, '.');
  if (cleaned === '') return undefined;
  const n = Number(cleaned);
  return isNaN(n) ? undefined : n;
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
  noThousandsSeparator = false,
}: RangeFilterProps) {
  const { locale } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [minInput, setMinInput] = useState(valueMin !== undefined ? formatNumber(valueMin, noThousandsSeparator, locale) : '');
  const [maxInput, setMaxInput] = useState(valueMax !== undefined ? formatNumber(valueMax, noThousandsSeparator, locale) : '');
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);

  const handleMinBlur = useCallback(() => {
    setMinFocused(false);
    const parsed = parseFormattedNumber(minInput);
    const formatted = parsed !== undefined ? formatNumber(parsed, noThousandsSeparator, locale) : '';
    setMinInput(formatted);

    if (parsed !== undefined && valueMax !== undefined && parsed > valueMax) {
      setError('Min must be ≤ max');
    } else {
      setError(null);
    }
    onChange(parsed, valueMax);
  }, [minInput, valueMax, onChange, locale]);

  const handleMaxBlur = useCallback(() => {
    setMaxFocused(false);
    const parsed = parseFormattedNumber(maxInput);
    const formatted = parsed !== undefined ? formatNumber(parsed, noThousandsSeparator, locale) : '';
    setMaxInput(formatted);

    if (valueMin !== undefined && parsed !== undefined && valueMin > parsed) {
      setError('Min must be ≤ max');
    } else {
      setError(null);
    }
    onChange(valueMin, parsed);
  }, [maxInput, valueMin, onChange, locale]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-surface-500 dark:text-surface-400">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder={`${formatNumber(min, noThousandsSeparator, locale)}${unit ? ` ${unit}` : ''}`}
          value={minFocused ? minInput : (valueMin !== undefined ? formatNumber(valueMin, noThousandsSeparator, locale) : minInput)}
          onChange={(e) => setMinInput(e.target.value)}
          onFocus={() => { setMinFocused(true); setMinInput(valueMin !== undefined ? String(valueMin) : ''); }}
          onBlur={handleMinBlur}
          aria-label={`${label} minimum`}
          className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-base lg:text-sm text-surface-800 placeholder-surface-400 transition-all duration-200 focus:border-brand-accent focus:shadow-glass-glow focus:outline-none focus:ring-2 focus:ring-brand-accent/20 dark:bg-surface-700 dark:border-surface-600 dark:text-white dark:placeholder-surface-500"
        />
        <span className="text-xs font-medium text-surface-300">–</span>
        <input
          type="text"
          inputMode="numeric"
          placeholder={`${formatNumber(max, noThousandsSeparator, locale)}${unit ? ` ${unit}` : ''}`}
          value={maxFocused ? maxInput : (valueMax !== undefined ? formatNumber(valueMax, noThousandsSeparator, locale) : maxInput)}
          onChange={(e) => setMaxInput(e.target.value)}
          onFocus={() => { setMaxFocused(true); setMaxInput(valueMax !== undefined ? String(valueMax) : ''); }}
          onBlur={handleMaxBlur}
          aria-label={`${label} maximum`}
          className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2.5 text-base lg:text-sm text-surface-800 placeholder-surface-400 transition-all duration-200 focus:border-brand-accent focus:shadow-glass-glow focus:outline-none focus:ring-2 focus:ring-brand-accent/20 dark:bg-surface-700 dark:border-surface-600 dark:text-white dark:placeholder-surface-500"
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
