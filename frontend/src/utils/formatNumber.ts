import type { Locale } from '../i18n/translations';

/**
 * Locale mapping for Intl.NumberFormat.
 * - 'nl' → 'nl-NL' (dots as thousands separator, comma as decimal: 33.225,00)
 * - 'en' → 'en-IE' (commas as thousands separator, dot as decimal: 33,225.00)
 *   Using en-IE because it uses € as default currency with comma grouping.
 */
const LOCALE_MAP: Record<Locale, string> = {
  nl: 'nl-NL',
  en: 'en-IE',
};

/**
 * Formats a price with thousand separators (no decimal places).
 * - NL: €33.225
 * - EN: €33,225
 */
export function formatPrice(amount: number, locale: Locale): string {
  const intlLocale = LOCALE_MAP[locale];
  return `€${Math.round(amount).toLocaleString(intlLocale)}`;
}

/**
 * Formats a number with thousand separators (no decimal places).
 * Used for mileage, horsepower totals, listing counts, etc.
 * - NL: 33.225
 * - EN: 33,225
 */
export function formatNumber(value: number, locale: Locale): string {
  const intlLocale = LOCALE_MAP[locale];
  return value.toLocaleString(intlLocale);
}

/**
 * Formats a number with thousand separators and specified decimal places.
 * - NL: 33.225,50
 * - EN: 33,225.50
 */
export function formatDecimal(value: number, locale: Locale, decimals: number = 2): string {
  const intlLocale = LOCALE_MAP[locale];
  return value.toLocaleString(intlLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
