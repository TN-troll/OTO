interface OtoLogoProps {
  className?: string;
  id?: string;
}

/**
 * OTO Logo — Elegant dual exhaust-pipe outlines with copper gradient.
 * Clean, minimal design: two concentric ellipse rings forming O's,
 * connected by a T-shaped bridge.
 */
export function OtoLogo({ className = '', id = 'main' }: OtoLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OTO logo"
      role="img"
    >
      <defs>
        <linearGradient id={`oto-copper-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C97B4A" />
          <stop offset="50%" stopColor="#E8A67A" />
          <stop offset="100%" stopColor="#C97B4A" />
        </linearGradient>
      </defs>
      {/* Left exhaust pipe (O) */}
      <ellipse cx="50" cy="40" rx="35" ry="28" stroke={`url(#oto-copper-${id})`} strokeWidth="6" />
      <ellipse cx="50" cy="40" rx="22" ry="17" stroke={`url(#oto-copper-${id})`} strokeWidth="2.5" opacity="0.4" />
      {/* Center bridge (T) */}
      <rect x="85" y="28" width="30" height="6" rx="3" fill={`url(#oto-copper-${id})`} />
      <rect x="97" y="28" width="6" height="30" rx="3" fill={`url(#oto-copper-${id})`} />
      {/* Right exhaust pipe (O) */}
      <ellipse cx="150" cy="40" rx="35" ry="28" stroke={`url(#oto-copper-${id})`} strokeWidth="6" />
      <ellipse cx="150" cy="40" rx="22" ry="17" stroke={`url(#oto-copper-${id})`} strokeWidth="2.5" opacity="0.4" />
    </svg>
  );
}
