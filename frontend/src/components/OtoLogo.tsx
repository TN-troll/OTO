interface OtoLogoProps {
  className?: string;
  /** Unique id suffix to prevent SVG gradient conflicts when multiple logos on page */
  id?: string;
}

/**
 * Premium OTO logo — styled as luxury car exhaust tips.
 * The O's represent dual exhaust pipe openings (viewed from rear),
 * and the T is formed by the center diffuser bridge.
 */
export function OtoLogo({ className = '', id = 'main' }: OtoLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OTO logo"
      role="img"
    >
      <defs>
        {/* Main copper gradient */}
        <linearGradient id={`oto-copper-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B06538" />
          <stop offset="30%" stopColor="#C97B4A" />
          <stop offset="50%" stopColor="#E8A67A" />
          <stop offset="70%" stopColor="#C97B4A" />
          <stop offset="100%" stopColor="#B06538" />
        </linearGradient>
        {/* Metallic highlight for rim */}
        <linearGradient id={`oto-rim-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5D4B8" />
          <stop offset="50%" stopColor="#C97B4A" />
          <stop offset="100%" stopColor="#8F4E2B" />
        </linearGradient>
        {/* Inner pipe darkness */}
        <radialGradient id={`oto-pipe-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1a0f0a" />
          <stop offset="70%" stopColor="#2d1a10" />
          <stop offset="100%" stopColor="#4d2a18" />
        </radialGradient>
        {/* Glow filter */}
        <filter id={`oto-glow-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ═══ LEFT EXHAUST TIP (O) ═══ */}
      {/* Outer chrome rim */}
      <ellipse cx="55" cy="40" rx="30" ry="30" stroke={`url(#oto-rim-${id})`} strokeWidth="5" fill="none" />
      {/* Inner pipe opening (dark) */}
      <ellipse cx="55" cy="40" rx="22" ry="22" fill={`url(#oto-pipe-${id})`} />
      {/* Inner ring detail (exhaust tip inner edge) */}
      <ellipse cx="55" cy="40" rx="22" ry="22" stroke={`url(#oto-copper-${id})`} strokeWidth="2" fill="none" opacity="0.7" />
      {/* Deepest inner ring */}
      <ellipse cx="55" cy="40" rx="14" ry="14" stroke={`url(#oto-copper-${id})`} strokeWidth="1.5" fill="none" opacity="0.35" />
      {/* Chrome highlight spot (top-left reflection) */}
      <ellipse cx="44" cy="30" rx="5" ry="3" fill="#F5D4B8" opacity="0.3" transform="rotate(-30 44 30)" />

      {/* ═══ CENTER BRIDGE / T-SHAPE (diffuser) ═══ */}
      {/* Horizontal bar */}
      <rect x="90" y="30" width="60" height="5" rx="2.5" fill={`url(#oto-copper-${id})`} filter={`url(#oto-glow-${id})`} />
      {/* Vertical stem */}
      <rect x="117" y="30" width="5" height="28" rx="2.5" fill={`url(#oto-copper-${id})`} filter={`url(#oto-glow-${id})`} />
      {/* Subtle T-base accent */}
      <rect x="112" y="55" width="15" height="3" rx="1.5" fill={`url(#oto-copper-${id})`} opacity="0.5" />

      {/* ═══ RIGHT EXHAUST TIP (O) ═══ */}
      {/* Outer chrome rim */}
      <ellipse cx="185" cy="40" rx="30" ry="30" stroke={`url(#oto-rim-${id})`} strokeWidth="5" fill="none" />
      {/* Inner pipe opening (dark) */}
      <ellipse cx="185" cy="40" rx="22" ry="22" fill={`url(#oto-pipe-${id})`} />
      {/* Inner ring detail */}
      <ellipse cx="185" cy="40" rx="22" ry="22" stroke={`url(#oto-copper-${id})`} strokeWidth="2" fill="none" opacity="0.7" />
      {/* Deepest inner ring */}
      <ellipse cx="185" cy="40" rx="14" ry="14" stroke={`url(#oto-copper-${id})`} strokeWidth="1.5" fill="none" opacity="0.35" />
      {/* Chrome highlight spot */}
      <ellipse cx="174" cy="30" rx="5" ry="3" fill="#F5D4B8" opacity="0.3" transform="rotate(-30 174 30)" />

      {/* ═══ HEAT SHIMMER / SMOKE WISPS ═══ */}
      <path
        d="M50 8 C52 5, 55 3, 53 0"
        stroke={`url(#oto-copper-${id})`}
        strokeWidth="1"
        opacity="0.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M58 6 C60 3, 58 1, 60 -2"
        stroke={`url(#oto-copper-${id})`}
        strokeWidth="0.8"
        opacity="0.15"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M180 8 C182 5, 185 3, 183 0"
        stroke={`url(#oto-copper-${id})`}
        strokeWidth="1"
        opacity="0.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M188 6 C190 3, 188 1, 190 -2"
        stroke={`url(#oto-copper-${id})`}
        strokeWidth="0.8"
        opacity="0.15"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
