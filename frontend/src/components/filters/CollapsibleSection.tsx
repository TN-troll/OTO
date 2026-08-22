import { useState, useId } from 'react';

export interface CollapsibleSectionProps {
  /** Section title displayed in the header */
  title: string;
  /** Content rendered inside the collapsible body */
  children: React.ReactNode;
  /** Number of active filters in this section (badge hidden when 0) */
  activeCount: number;
  /** Callback when the user clicks the section clear button */
  onClear: () => void;
  /** Whether the section starts expanded */
  defaultExpanded?: boolean;
}

/**
 * A reusable collapsible filter section with:
 * - Expand/collapse toggle with spring animation (ease-smooth)
 * - Active filter badge (hidden when count is 0)
 * - Section clear button (visible when active filters present)
 * - Glass morphism styling from design tokens
 * - 44px minimum touch targets for accessibility
 *
 * Uses the CSS grid-rows technique for smooth height animation
 * without needing to measure content height in JS.
 */
export function CollapsibleSection({
  title,
  children,
  activeCount,
  onClear,
  defaultExpanded = false,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = useId();
  const headerId = useId();

  return (
    <div className="border-b border-glass-border py-1 last:border-b-0 overflow-visible dark:border-white/[0.06]">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          id={headerId}
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className="flex min-h-touch min-w-touch flex-1 items-center justify-between rounded-button px-2 py-2 text-left transition-colors duration-150 hover:bg-glass-light dark:hover:bg-glass-dark"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-surface-800 dark:text-surface-200">
              {title}
            </span>

            {/* Active filter badge — hidden when count is 0 */}
            {activeCount > 0 && (
              <span
                className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-badge bg-accent-goldMuted px-1.5 text-[10px] font-bold text-brand-accent"
                aria-label={`${activeCount} active filter${activeCount !== 1 ? 's' : ''}`}
              >
                {activeCount}
              </span>
            )}
          </div>

          {/* Chevron icon with spring animation */}
          <svg
            className={`h-4 w-4 text-surface-400 transition-transform duration-300 ease-smooth dark:text-surface-500 ${
              isExpanded ? 'rotate-180' : 'rotate-0'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Section clear button — visible only when active filters present */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex min-h-touch min-w-touch items-center justify-center rounded-button px-2 text-xs font-medium text-brand-accent transition-colors duration-150 hover:bg-accent-goldMuted hover:text-primary-600"
            aria-label={`Clear ${title} filters`}
          >
            Clear
          </button>
        )}
      </div>

      {/* Collapsible content using grid-rows technique for smooth height animation */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={headerId}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-smooth ${
          isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-2 pb-3 pt-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
