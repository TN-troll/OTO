interface PremiumBadgeProps {
  size?: 'sm' | 'md';
}

/**
 * Badge displayed on features exclusive to premium tier.
 * Uses a gold/amber color scheme matching the OTO brand identity.
 */
export function PremiumBadge({ size = 'md' }: PremiumBadgeProps) {
  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-[10px]'
    : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-100 to-yellow-100 font-semibold text-amber-700 ring-1 ring-amber-300/50 dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-300 dark:ring-amber-700/50 ${sizeClasses}`}
    >
      <svg
        className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z"
          clipRule="evenodd"
        />
      </svg>
      Premium
    </span>
  );
}
