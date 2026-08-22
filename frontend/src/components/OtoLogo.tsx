interface OtoLogoProps {
  className?: string;
  /** Unique id suffix to prevent SVG gradient conflicts when multiple logos on page */
  id?: string;
}

/**
 * OTO Logo — Premium dual exhaust tips with brushed-metal T nameplate.
 * Designed to evoke the rear view of a luxury performance car.
 */
export function OtoLogo({ className = '', id = 'main' }: OtoLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 260 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="OTO logo"
      role="img"
    >
      <defs>
        {/* Brushed metal gradient — outer rim */}
        <linearGradient id={`oto-metal-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E8C9A8" />
          <stop offset="20%" stopColor="#C97B4A" />
          <stop offset="40%" stopColor="#F0D4B0" />
          <stop offset="60%" stopColor="#C97B4A" />
          <stop offset="80%" stopColor="#8F4E2B" />
          <stop offset="100%" stopColor="#B06538" />
        </linearGradient>
        {/* Inner bevel gradient */}
        <linearGradient id={`oto-bevel-${id}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C97B4A" />
          <stop offset="50%" stopColor="#6E3C22" />
          <stop offset="100%" stopColor="#C97B4A" />
        </linearGradient>
        {/* Deep pipe interior */}
        <radialGradient id={`oto-deep-${id}`} cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#0a0604" />
          <stop offset="60%" stopColor="#1a0f0a" />
          <stop offset="100%" stopColor="#3d2215" />
        </radialGradient>
        {/* T-bar metallic */}
        <linearGradient id={`oto-tbar-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8F4E2B" />
          <stop offset="20%" stopColor="#C97B4A" />
          <stop offset="50%" stopColor="#E8C9A8" />
          <stop offset="80%" stopColor="#C97B4A" />
          <stop offset="100%" stopColor="#8F4E2B" />
        </linearGradient>
      </defs>

      {/* ═══ LEFT EXHAUST TIP (O) ═══ */}
      {/* Outer machined rim — thick beveled ring */}
      <ellipse cx="62" cy="36" rx="32" ry="28" fill={`url(#oto-metal-${id})`} />
      {/* Bevel cut — creates depth illusion */}
      <ellipse cx="62" cy="36" rx="26" ry="22" fill={`url(#oto-bevel-${id})`} />
      {/* Inner pipe opening — deep black with radial fade */}
      <ellipse cx="62" cy="36" rx="20" ry="17" fill={`url(#oto-deep-${id})`} />
      {/* Inner tip ring — thin machined edge */}
      <ellipse cx="62" cy="36" rx="20" ry="17" stroke="#C97B4A" strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* Highlight reflection — top-left (studio light catch) */}
      <ellipse cx="50" cy="26" rx="8" ry="4" fill="#F0D4B0" opacity="0.25" transform="rotate(-20 50 26)" />
      {/* Secondary highlight — bottom-right rim catch */}
      <ellipse cx="74" cy="46" rx="5" ry="2.5" fill="#E8C9A8" opacity="0.15" transform="rotate(20 74 46)" />

      {/* ═══ CENTER T — Brushed metal nameplate ═══ */}
      {/* Horizontal bar — thin elegant plate */}
      <rect x="99" y="29" width="62" height="4" rx="2" fill={`url(#oto-tbar-${id})`} />
      {/* Vertical stem */}
      <rect x="127" y="29" width="4" height="22" rx="2" fill={`url(#oto-tbar-${id})`} />
      {/* Top edge highlight */}
      <rect x="101" y="29" width="58" height="1" rx="0.5" fill="#F0D4B0" opacity="0.4" />
      {/* Stem center highlight */}
      <rect x="128.5" y="31" width="1" height="18" rx="0.5" fill="#F0D4B0" opacity="0.3" />

      {/* ═══ RIGHT EXHAUST TIP (O) ═══ */}
      {/* Outer machined rim */}
      <ellipse cx="198" cy="36" rx="32" ry="28" fill={`url(#oto-metal-${id})`} />
      {/* Bevel cut */}
      <ellipse cx="198" cy="36" rx="26" ry="22" fill={`url(#oto-bevel-${id})`} />
      {/* Inner pipe opening */}
      <ellipse cx="198" cy="36" rx="20" ry="17" fill={`url(#oto-deep-${id})`} />
      {/* Inner tip ring */}
      <ellipse cx="198" cy="36" rx="20" ry="17" stroke="#C97B4A" strokeWidth="0.8" fill="none" opacity="0.6" />
      {/* Highlight reflection */}
      <ellipse cx="186" cy="26" rx="8" ry="4" fill="#F0D4B0" opacity="0.25" transform="rotate(-20 186 26)" />
      {/* Secondary highlight */}
      <ellipse cx="210" cy="46" rx="5" ry="2.5" fill="#E8C9A8" opacity="0.15" transform="rotate(20 210 46)" />
    </svg>
  );
}
