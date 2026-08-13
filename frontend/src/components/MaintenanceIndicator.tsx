import { useState } from 'react';
import { getMaintenanceTierInfo } from '../utils/maintenanceLookup';

export interface MaintenanceIndicatorProps {
  make: string;
}

const COLOR_CLASSES = {
  green: {
    badge: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    dot: 'bg-green-500',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  red: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    dot: 'bg-red-500',
  },
  grey: {
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-700/30 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
} as const;

/**
 * Maintenance cost indicator badge component.
 *
 * Displays a color-coded badge showing the estimated annual maintenance cost tier
 * for a car make. Includes a tooltip with tier explanation and cost range on hover/tap.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */
export function MaintenanceIndicator({ make }: MaintenanceIndicatorProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const tierInfo = getMaintenanceTierInfo(make);
  const colors = COLOR_CLASSES[tierInfo.color];

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
    >
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${colors.badge}`}
        aria-label={`Maintenance cost: ${tierInfo.label}`}
        aria-describedby={showTooltip ? 'maintenance-tooltip' : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowTooltip((prev) => !prev);
        }}
      >
        <span className={`h-2 w-2 rounded-full ${colors.dot}`} aria-hidden="true" />
        <span>{tierInfo.label}</span>
        <svg className="h-3 w-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      </button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          id="maintenance-tooltip"
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-56 -translate-x-1/2 rounded-lg bg-surface-900 p-3 text-xs text-white shadow-lg dark:bg-surface-700"
        >
          <div className="font-semibold">Maintenance Cost: {tierInfo.label}</div>
          <div className="mt-1 text-surface-300">
            Estimated annual maintenance: {tierInfo.estimatedAnnualRange}
          </div>
          <div className="mt-1.5 text-surface-400">
            {tierInfo.tier === 'low' && 'Reliable with affordable parts and service costs.'}
            {tierInfo.tier === 'medium' && 'Moderate parts cost with regular service intervals.'}
            {tierInfo.tier === 'high' && 'Expensive parts and specialist service required.'}
            {tierInfo.tier === 'unknown' && 'Maintenance data not available for this make.'}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-surface-900 dark:border-t-surface-700" />
        </div>
      )}
    </div>
  );
}
