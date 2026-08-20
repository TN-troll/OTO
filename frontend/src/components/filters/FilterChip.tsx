export interface FilterChipProps {
  /** Human-readable label displayed on the chip */
  label: string;
  /** Callback when the user clicks the remove (×) button */
  onRemove: () => void;
}

/**
 * A removable filter pill with glass morphism styling.
 * Used in the FilterSummaryBar to display one active filter value.
 *
 * - Frosted glass appearance (backdrop-blur, translucent bg, glass-border)
 * - 44px minimum touch target on the remove button for accessibility
 * - Smooth transitions on hover/press
 */
export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-glass-border bg-white/72 px-3 py-1.5 text-xs font-medium text-surface-800 backdrop-blur-[20px] transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-white/90 dark:border-white/10 dark:bg-[rgba(30,30,30,0.72)] dark:text-surface-200 dark:hover:bg-[rgba(30,30,30,0.85)]">
      <span className="whitespace-nowrap">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex min-h-[44px] min-w-[44px] -mr-2 items-center justify-center rounded-full text-surface-400 transition-colors duration-150 hover:text-surface-800 dark:text-surface-500 dark:hover:text-surface-200"
        aria-label={`Remove filter: ${label}`}
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}
