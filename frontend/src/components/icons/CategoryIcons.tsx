/**
 * Premium filled silhouette icons for vehicle categories and performance presets.
 * Each icon has dramatically different proportions for instant recognition at small sizes.
 * 64x32 viewBox, fill-based for bold visual impact.
 * Enhanced with luxury detailing: chrome accents, wheel spokes, glass reflections,
 * body sculpting lines, and ground shadows.
 */

interface IconProps {
  className?: string;
}

/** Supercar — extremely low angular wedge, barely any cabin height (Lamborghini Aventador) */
export function SupercarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="28.5" rx="28" ry="2" opacity="0.1" />
      {/* Main body */}
      <path d="M2 26h6.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h25c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H62v-3l-1.5-1.5-1-1.5-2-1.5L54 21l-3-2-1-3-2-2.5-4-1.5H38l-6-1H22l-5 .5-4 1.5-3 2-2.5 2.5L5 20l-2 2.5L2 24v2z" />
      <path d="M56 17l6 2v-2l-2-2-4-1v3zM2 22l4-1.5v-2L3 20l-1 1v1z" opacity="0.6" />
      {/* Chrome beltline accent */}
      <path d="M8 20.5h48" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Glass reflection */}
      <path d="M36 14l-4 4" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M12 22h40" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.2" />
      {/* Air intake scoops */}
      <path d="M24 18l2-1.5v1.5h-2z" opacity="0.35" />
      <path d="M40 17l2-1v1.5l-2-.5z" opacity="0.35" />
      {/* Exhaust tips */}
      <ellipse cx="3.5" cy="25" rx="1" ry="0.6" opacity="0.4" />
      <ellipse cx="6" cy="25" rx="1" ry="0.6" opacity="0.4" />
      {/* Wheel detailing - front */}
      <circle cx="14" cy="26" r="3.8" opacity="0.15" />
      <circle cx="14" cy="26" r="2.2" opacity="0.2" />
      <line x1="14" y1="23.5" x2="14" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="12.2" y1="24.8" x2="13" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="15.8" y1="24.8" x2="15" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="12.5" y1="27.2" x2="13.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="15.5" y1="27.2" x2="14.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="50" cy="26" r="3.8" opacity="0.15" />
      <circle cx="50" cy="26" r="2.2" opacity="0.2" />
      <line x1="50" y1="23.5" x2="50" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="48.2" y1="24.8" x2="49" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="51.8" y1="24.8" x2="51" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="48.5" y1="27.2" x2="49.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="51.5" y1="27.2" x2="50.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/** Luxury — very long body with tall formal upright greenhouse (Rolls-Royce Phantom) */
export function LuxuryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="33" cy="28.5" rx="26" ry="2" opacity="0.1" />
      {/* Main body */}
      <path d="M6 26h5.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h22c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H60v-4l-1-1.5V14l-.5-1.5-1-1L56 10V7.5L54 6h-6l-3-.5H22l-4 .5-3 1-2 1.5-1.5 2L10 13v3l-1 1.5-1 2v2L6 24v2z" />
      <path d="M20 6v5.5h8V5.5L20 6zM36 5.5v6h8V6l-8-.5z" opacity="0.15" />
      {/* Chrome beltline accent */}
      <path d="M10 14h48" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.4" />
      {/* Glass reflection */}
      <path d="M24 7l-3 4.5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      <path d="M40 7l-3 4.5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M12 18h44" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" />
      {/* Spirit of Ecstasy hood ornament */}
      <rect x="12.5" y="9.5" width="0.8" height="3" rx="0.4" opacity="0.5" />
      <path d="M12.2 9.5l.7-1.5.7 1.5h-1.4z" opacity="0.45" />
      {/* Chrome grille lines */}
      <line x1="9" y1="19" x2="9" y2="22" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
      <line x1="10" y1="19" x2="10" y2="22" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
      <line x1="11" y1="19" x2="11" y2="22" stroke="currentColor" strokeWidth="0.4" opacity="0.35" />
      {/* Wheel detailing - front */}
      <circle cx="17" cy="26" r="3.8" opacity="0.15" />
      <circle cx="17" cy="26" r="2.2" opacity="0.2" />
      <line x1="17" y1="23.5" x2="17" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="15.2" y1="24.8" x2="16" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="18.8" y1="24.8" x2="18" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="15.5" y1="27.2" x2="16.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="18.5" y1="27.2" x2="17.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="50" cy="26" r="3.8" opacity="0.15" />
      <circle cx="50" cy="26" r="2.2" opacity="0.2" />
      <line x1="50" y1="23.5" x2="50" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="48.2" y1="24.8" x2="49" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="51.8" y1="24.8" x2="51" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="48.5" y1="27.2" x2="49.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="51.5" y1="27.2" x2="50.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/** Performance Sedan — aggressive four-door, wide arches, lower than luxury (BMW M5) */
export function PerformanceSedanIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="28.5" rx="26" ry="2" opacity="0.1" />
      {/* Main body */}
      <path d="M5 26h5.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h21c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H59v-3.5l-1-2-2-2V15l-1.5-2-2-1.5L49 10l-2-1.5L44 8h-4l-3-1H24l-4 1h-3l-3 1.5L11 11l-2 1.5L7.5 15v3.5l-1 2-1 2v3.5z" />
      <path d="M18 8l2-1.5h5V9l-7-1zM40 6.5h5L47 8l-7 1V6.5z" opacity="0.15" />
      {/* Chrome beltline accent */}
      <path d="M10 15h44" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Glass reflection */}
      <path d="M28 7.5l-3 5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M10 19h44" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" />
      {/* Aggressive lip spoiler */}
      <path d="M52 12h7l.5.8H52v-.8z" opacity="0.35" />
      {/* Quad exhaust tips */}
      <ellipse cx="4.2" cy="25" rx="0.8" ry="0.5" opacity="0.4" />
      <ellipse cx="6" cy="25" rx="0.8" ry="0.5" opacity="0.4" />
      <ellipse cx="58" cy="25" rx="0.8" ry="0.5" opacity="0.4" />
      <ellipse cx="59.8" cy="25" rx="0.8" ry="0.5" opacity="0.4" />
      {/* Wheel detailing - front */}
      <circle cx="16" cy="26" r="3.8" opacity="0.15" />
      <circle cx="16" cy="26" r="2.2" opacity="0.2" />
      <line x1="16" y1="23.5" x2="16" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="14.2" y1="24.8" x2="15" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="17.8" y1="24.8" x2="17" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="14.5" y1="27.2" x2="15.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="17.5" y1="27.2" x2="16.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="48" cy="26" r="3.8" opacity="0.15" />
      <circle cx="48" cy="26" r="2.2" opacity="0.2" />
      <line x1="48" y1="23.5" x2="48" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="46.2" y1="24.8" x2="47" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="49.8" y1="24.8" x2="49" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="46.5" y1="27.2" x2="47.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="49.5" y1="27.2" x2="48.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/** Hot Hatch — SHORT body (~70% width), steep vertical rear hatchback (Golf GTI) */
export function HotHatchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="28.5" rx="20" ry="1.8" opacity="0.1" />
      {/* Main body */}
      <path d="M12 26h5.5c.8-2.3 2.8-3.8 5-3.8s4.2 1.5 5 3.8h10c.8-2.3 2.8-3.8 5-3.8s4.2 1.5 5 3.8H51v-3l-1-2V17l.5-3-1-2-1.5-1.5-2-1L43 8h-4l-2-1H27l-4 1-3 1.5-2.5 2-1.5 2.5-1 2.5v3l-1 2v4.5z" />
      <path d="M48 11l3 3v4l-1-1v-3l-2-3z" opacity="0.3" />
      {/* Chrome beltline accent */}
      <path d="M17 14h32" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Glass reflection */}
      <path d="M30 9l-2.5 4" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M17 18h32" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" />
      {/* Roof-mounted spoiler lip */}
      <path d="M47 9.5h4.5l.5.5v.5h-5v-1z" opacity="0.35" />
      {/* Sporty exhaust */}
      <ellipse cx="14" cy="25.2" rx="1.2" ry="0.7" opacity="0.4" />
      {/* Wheel detailing - front */}
      <circle cx="22.5" cy="26" r="3.4" opacity="0.15" />
      <circle cx="22.5" cy="26" r="2" opacity="0.2" />
      <line x1="22.5" y1="23.8" x2="22.5" y2="25" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="20.9" y1="25" x2="21.6" y2="25.7" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="24.1" y1="25" x2="23.4" y2="25.7" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="21.2" y1="27" x2="21.8" y2="26.4" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="23.8" y1="27" x2="23.2" y2="26.4" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="42.5" cy="26" r="3.4" opacity="0.15" />
      <circle cx="42.5" cy="26" r="2" opacity="0.2" />
      <line x1="42.5" y1="23.8" x2="42.5" y2="25" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="40.9" y1="25" x2="41.6" y2="25.7" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="44.1" y1="25" x2="43.4" y2="25.7" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="41.2" y1="27" x2="41.8" y2="26.4" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="43.8" y1="27" x2="43.2" y2="26.4" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/** Sports Car — 911 proportions: long hood, small cabin pushed back, rounded fastback */
export function SportsCarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="28.5" rx="27" ry="2" opacity="0.1" />
      {/* Main body */}
      <path d="M4 26h6c.8-2.5 3-4.2 5.5-4.2S20 23.5 20.8 26h22.4c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H60v-3l-1-2-1.5-1.5-1.5-2-2-2-2.5-1.5-3-1.5L44 16l-4-2-3-1.5-4-1H26l-6 1-4 1.5-3.5 2L9 18.5 7 20.5l-1.5 2L4 24.5v1.5z" />
      <path d="M42 11c3 1.5 5 3 7 5l2 2-1-.5-3-2.5-3-2.5-2-1.5V11z" opacity="0.2" />
      {/* Chrome beltline accent */}
      <path d="M9 18.5h46" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Glass reflection */}
      <path d="M44 13l-3 4" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M12 21h42" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" />
      {/* Side vents */}
      <path d="M26 18l3-.5v.8l-3-.3z" opacity="0.35" />
      <path d="M26 19.2l3-.5v.8l-3-.3z" opacity="0.3" />
      {/* Curved fender highlight */}
      <path d="M48 20c2 .5 4 1.5 5.5 2.5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - front */}
      <circle cx="15.5" cy="26" r="3.8" opacity="0.15" />
      <circle cx="15.5" cy="26" r="2.2" opacity="0.2" />
      <line x1="15.5" y1="23.5" x2="15.5" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="13.7" y1="24.8" x2="14.5" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="17.3" y1="24.8" x2="16.5" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="14" y1="27.2" x2="14.7" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="17" y1="27.2" x2="16.3" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="48.7" cy="26" r="3.8" opacity="0.15" />
      <circle cx="48.7" cy="26" r="2.2" opacity="0.2" />
      <line x1="48.7" y1="23.5" x2="48.7" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="46.9" y1="24.8" x2="47.7" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="50.5" y1="24.8" x2="49.7" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="47.2" y1="27.2" x2="47.9" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="50.2" y1="27.2" x2="49.5" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/** Performance SUV — TALL, boxy, high ground clearance, large wheels (Urus / Cayenne) */
export function PerformanceSuvIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="30.5" rx="24" ry="1.8" opacity="0.1" />
      {/* Main body */}
      <path d="M8 28h5c1-3 3.5-5 6.5-5s5.5 2 6.5 5h14c1-3 3.5-5 6.5-5s5.5 2 6.5 5H57v-4l-1-2-1-2V12l-1-2-1.5-1.5L50 7l-3-1.5L44 4.5H36l-4-.5H22l-4 .5-3 1.5L12 8l-2 2-1.5 2.5V18l-1 3v3l.5 2v2z" />
      <path d="M8 22v-3h2v3H8zM54 21v-3h2v3h-2z" opacity="0.3" />
      {/* Chrome beltline accent */}
      <path d="M12 12h42" fill="none" stroke="currentColor" strokeWidth="0.7" opacity="0.4" />
      {/* Glass reflection */}
      <path d="M28 5.5l-3 5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M12 17h42" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" />
      {/* Roof rails */}
      <path d="M18 4h26" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.35" />
      {/* Running board accent */}
      <path d="M22 25h16" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.25" />
      {/* Wheel detailing - front */}
      <circle cx="19.5" cy="28" r="4.5" opacity="0.15" />
      <circle cx="19.5" cy="28" r="2.8" opacity="0.2" />
      <line x1="19.5" y1="25" x2="19.5" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="17.3" y1="26.5" x2="18.2" y2="27.4" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="21.7" y1="26.5" x2="20.8" y2="27.4" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="17.5" y1="29.5" x2="18.4" y2="28.7" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="21.5" y1="29.5" x2="20.6" y2="28.7" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="46.5" cy="28" r="4.5" opacity="0.15" />
      <circle cx="46.5" cy="28" r="2.8" opacity="0.2" />
      <line x1="46.5" y1="25" x2="46.5" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="44.3" y1="26.5" x2="45.2" y2="27.4" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="48.7" y1="26.5" x2="47.8" y2="27.4" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="44.5" y1="29.5" x2="45.4" y2="28.7" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="48.5" y1="29.5" x2="47.6" y2="28.7" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/** Electric Performance — smooth teardrop/bubble aero shape, flush surfaces (Tesla/Taycan) */
export function ElectricPerformanceIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="28.5" rx="26" ry="2" opacity="0.1" />
      {/* Main body */}
      <path d="M6 26h5.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h20c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H58c2 0 3-1 3-2l-.5-2-1.5-2.5-2-2-3-2-3.5-2-4-1.5L42 13l-4-.5H24l-5 .5-4 1.5-3.5 2-3 2-2 2.5-1.5 2.5-.5 1.5c0 1 .5 2 1.5 2z" />
      <path d="M30 15l-2.5 4.5h4L28 25" opacity="0.5" fill="currentColor" />
      {/* Chrome beltline accent */}
      <path d="M10 16.5h44" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.35" />
      {/* Glass reflection */}
      <path d="M34 13l-3 5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M10 20h44" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.2" />
      {/* Rear light bar */}
      <path d="M5 23h4" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      {/* Flush door handle indicators (no break — just subtle marks) */}
      <rect x="25" y="17.5" width="2.5" height="0.5" rx="0.25" opacity="0.2" />
      <rect x="36" y="17.5" width="2.5" height="0.5" rx="0.25" opacity="0.2" />
      {/* Wheel detailing - front */}
      <circle cx="17" cy="26" r="3.8" opacity="0.15" />
      <circle cx="17" cy="26" r="2.2" opacity="0.2" />
      <line x1="17" y1="23.5" x2="17" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="15.2" y1="24.8" x2="16" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="18.8" y1="24.8" x2="18" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="15.5" y1="27.2" x2="16.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="18.5" y1="27.2" x2="17.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="48" cy="26" r="3.8" opacity="0.15" />
      <circle cx="48" cy="26" r="2.2" opacity="0.2" />
      <line x1="48" y1="23.5" x2="48" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="46.2" y1="24.8" x2="47" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="49.8" y1="24.8" x2="49" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="46.5" y1="27.2" x2="47.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="49.5" y1="27.2" x2="48.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/** Classic — high waistline, separate fender bulges, round headlights, upright windshield (E-Type / 300SL) */
export function ClassicIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="28.5" rx="24" ry="2" opacity="0.1" />
      {/* Main body */}
      <path d="M8 26h4c.6-2.8 3-5 6-5s5.4 2.2 6 5h14c.6-2.8 3-5 6-5s5.4 2.2 6 5h4v-3l-1-2v-2l-2-2-2-1.5-1-2-2-2-3-1.5H38l-3-1H22l-4 1h-3l-3 1.5-2 2-1.5 2-1 1.5-1 2v2.5l-.5 2v2z" />
      <circle cx="10" cy="16" r="2.5" opacity="0.5" />
      <circle cx="10" cy="16" r="1.2" opacity="0.3" />
      {/* Chrome beltline accent */}
      <path d="M12 15h40" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Glass reflection */}
      <path d="M28 10l-2.5 4" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M14 19h34" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" />
      {/* Chrome bumper bars */}
      <rect x="6" y="22.5" width="4" height="1" rx="0.5" opacity="0.4" />
      <rect x="52" y="22.5" width="4" height="1" rx="0.5" opacity="0.4" />
      {/* Hood louvers */}
      <line x1="13" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="13" y1="14" x2="16" y2="14" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="13" y1="15" x2="16" y2="15" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      {/* Wheel detailing - front */}
      <circle cx="18" cy="26" r="5" opacity="0.2" />
      <circle cx="18" cy="26" r="3" opacity="0.15" />
      <circle cx="18" cy="26" r="1.5" opacity="0.25" />
      <line x1="18" y1="22.5" x2="18" y2="24" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="15.5" y1="24" x2="16.5" y2="25" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="20.5" y1="24" x2="19.5" y2="25" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="15.5" y1="28" x2="16.5" y2="27" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="20.5" y1="28" x2="19.5" y2="27" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="44" cy="26" r="5" opacity="0.2" />
      <circle cx="44" cy="26" r="3" opacity="0.15" />
      <circle cx="44" cy="26" r="1.5" opacity="0.25" />
      <line x1="44" y1="22.5" x2="44" y2="24" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="41.5" y1="24" x2="42.5" y2="25" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="46.5" y1="24" x2="45.5" y2="25" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="41.5" y1="28" x2="42.5" y2="27" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      <line x1="46.5" y1="28" x2="45.5" y2="27" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
    </svg>
  );
}

/** Grand Tourer — elegant, longest hood of all, smooth flowing fastback (Aston Martin DB11) */
export function GrandTourerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="28.5" rx="28" ry="2" opacity="0.1" />
      {/* Main body */}
      <path d="M3 26h6.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h23c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H60v-3l-1-1.5-.5-2-1-1.5-1.5-1.5-2-1.5-2.5-1.5L48 13l-3-1.5-3-1-3.5-1H32l-8 .5-6 1-4.5 1.5-4 2-3 2.5L5 19.5 4 22l-.5 2L3 25.5v.5z" />
      <path d="M6 21c1-2.5 3-4.5 5.5-6l4-2.5 5-1.5-3 1.5-4 2.5-4 3.5L6 21z" opacity="0.15" />
      {/* Chrome beltline accent */}
      <path d="M8 17h48" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Glass reflection */}
      <path d="M40 11l-3 5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease / fender crease */}
      <path d="M10 20h46" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" />
      {/* Side strake/gill vent */}
      <path d="M24 16l3-.3v.6l-3-.3z" opacity="0.35" />
      <path d="M24 17l3-.3v.6l-3-.3z" opacity="0.3" />
      <path d="M24 18l3-.3v.6l-3-.3z" opacity="0.25" />
      {/* Refined fender highlight curve */}
      <path d="M48 19c2 .8 4 2 5.5 3.5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - front */}
      <circle cx="15" cy="26" r="3.8" opacity="0.15" />
      <circle cx="15" cy="26" r="2.2" opacity="0.2" />
      <line x1="15" y1="23.5" x2="15" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="13.2" y1="24.8" x2="14" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="16.8" y1="24.8" x2="16" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="13.5" y1="27.2" x2="14.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="16.5" y1="27.2" x2="15.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="50" cy="26" r="3.8" opacity="0.15" />
      <circle cx="50" cy="26" r="2.2" opacity="0.2" />
      <line x1="50" y1="23.5" x2="50" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="48.2" y1="24.8" x2="49" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="51.8" y1="24.8" x2="51" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="48.5" y1="27.2" x2="49.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="51.5" y1="27.2" x2="50.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/** Track Weapon — prominent TALL rear wing on pylons above body, front splitter (GT3 RS) */
export function TrackWeaponIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="28.5" rx="27" ry="2" opacity="0.1" />
      {/* Main body */}
      <path d="M5 26h5.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h22c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H60v-3l-1-2-1.5-1.5-2-2-2-1.5-2.5-1.5-3-1L44 13l-3-1.5-3-1H28l-5 1-4 1.5-3.5 2-3 2L10 20l-2 1.5-1.5 2-1 2v.5z" />
      <rect x="48" y="4" width="10" height="2.5" rx="1" />
      <rect x="49" y="6.5" width="1.5" height="7" />
      <rect x="56" y="6.5" width="1.5" height="7" />
      <rect x="1" y="22" width="6" height="2" rx="1" opacity="0.6" />
      {/* Chrome beltline accent */}
      <path d="M10 17h44" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Glass reflection */}
      <path d="M36 12l-3 4.5" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M12 20h42" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" />
      {/* NACA ducts */}
      <path d="M20 16l2.5-.8.5 1.2-3-.4z" opacity="0.35" />
      <path d="M33 15l2.5-.8.5 1.2-3-.4z" opacity="0.35" />
      {/* Canards on front */}
      <path d="M58 19l3-1.5v1l-3 .5z" opacity="0.4" />
      <path d="M58 21l3-1v.8l-3 .2z" opacity="0.35" />
      {/* Wheel detailing - front */}
      <circle cx="16" cy="26" r="3.8" opacity="0.15" />
      <circle cx="16" cy="26" r="2.2" opacity="0.2" />
      <line x1="16" y1="23.5" x2="16" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="14.2" y1="24.8" x2="15" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="17.8" y1="24.8" x2="17" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="14.5" y1="27.2" x2="15.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="17.5" y1="27.2" x2="16.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="49" cy="26" r="3.8" opacity="0.15" />
      <circle cx="49" cy="26" r="2.2" opacity="0.2" />
      <line x1="49" y1="23.5" x2="49" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="47.2" y1="24.8" x2="48" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="50.8" y1="24.8" x2="50" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="47.5" y1="27.2" x2="48.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="50.5" y1="27.2" x2="49.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/** Daily Luxury — S-Class proportions: long, sleek modern sedan, sportier than formal Luxury */
export function DailyLuxuryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="28.5" rx="26" ry="2" opacity="0.1" />
      {/* Main body */}
      <path d="M5 26h5.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h22c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H59v-3.5l-1-2-1.5-1.5-1.5-2-1-1.5L52 13.5l-2-1.5-2.5-1-3-.5H36l-4-.5H24l-4 .5-3 1-2.5 1.5-2 2-1.5 2L9 19.5l-1.5 2-1 1.5-1 2v1z" />
      <path d="M22 10.5l3-1h7v1.5h-7l-3-.5zM37 9.5h6l3 1-.5.5H37V9.5z" opacity="0.12" />
      {/* Chrome beltline accent */}
      <path d="M10 14h44" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Chrome window surround */}
      <path d="M20 10.5c3-1 6-1.2 9-1.2h6c3 0 6 .3 9 1.2l2 1-1-.2c-3-.8-6-1-10-1h-6c-3 0-7 .2-10 1l1-.8z" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.3" />
      {/* Glass reflection */}
      <path d="M30 10l-3 4" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M10 18h44" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" />
      {/* Subtle pinstripe */}
      <path d="M12 21h40" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.15" />
      {/* Wheel detailing - front */}
      <circle cx="16" cy="26" r="3.8" opacity="0.15" />
      <circle cx="16" cy="26" r="2.2" opacity="0.2" />
      <line x1="16" y1="23.5" x2="16" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="14.2" y1="24.8" x2="15" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="17.8" y1="24.8" x2="17" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="14.5" y1="27.2" x2="15.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="17.5" y1="27.2" x2="16.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      {/* Wheel detailing - rear */}
      <circle cx="48" cy="26" r="3.8" opacity="0.15" />
      <circle cx="48" cy="26" r="2.2" opacity="0.2" />
      <line x1="48" y1="23.5" x2="48" y2="24.8" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="46.2" y1="24.8" x2="47" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="49.8" y1="24.8" x2="49" y2="25.6" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="46.5" y1="27.2" x2="47.2" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="49.5" y1="27.2" x2="48.8" y2="26.5" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/** Classic Collectible — vintage sports car: extremely long nose, tiny cabin way back (Ferrari 250 GTO) */
export function ClassicCollectibleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      {/* Ground shadow */}
      <ellipse cx="32" cy="28.5" rx="28" ry="2" opacity="0.1" />
      {/* Main body */}
      <path d="M4 26h5c.7-2.5 2.8-4.2 5.5-4.2s4.8 1.7 5.5 4.2h26c.7-2.5 2.8-4.2 5.5-4.2s4.8 1.7 5.5 4.2H61v-3l-.5-1.5-1-1.5-1.5-1.5-2-1.5-2-1-2.5-1-3-.5H44l-6-1.5-5-1-5.5-.5h-4l-5 .5-4 1-3 1.5-2.5 2-2 2-1.5 2L4 24v2z" />
      <circle cx="7" cy="17" r="2.5" opacity="0.5" />
      <circle cx="7" cy="17" r="1.2" opacity="0.3" />
      {/* Chrome beltline accent */}
      <path d="M10 16h44" fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.4" />
      {/* Glass reflection */}
      <path d="M40 12l-2.5 4" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.18" />
      {/* Body sculpting crease */}
      <path d="M12 20h42" fill="none" stroke="currentColor" strokeWidth="0.4" opacity="0.22" />
      {/* Racing stripe hint */}
      <path d="M16 12v10" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.12" />
      <path d="M18 12v10" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.12" />
      {/* Wire wheel spokes - front */}
      <circle cx="14.5" cy="26" r="4.2" opacity="0.2" />
      <circle cx="14.5" cy="26" r="2.5" opacity="0.15" />
      <circle cx="14.5" cy="26" r="1" opacity="0.3" />
      <line x1="14.5" y1="22.5" x2="14.5" y2="24" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="14.5" y1="28" x2="14.5" y2="29.5" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="11" y1="26" x2="12.5" y2="26" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="16.5" y1="26" x2="18" y2="26" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="12" y1="23.5" x2="13.2" y2="24.7" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="17" y1="23.5" x2="15.8" y2="24.7" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="12" y1="28.5" x2="13.2" y2="27.3" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="17" y1="28.5" x2="15.8" y2="27.3" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      {/* Wire wheel spokes - rear */}
      <circle cx="51.5" cy="26" r="4.2" opacity="0.2" />
      <circle cx="51.5" cy="26" r="2.5" opacity="0.15" />
      <circle cx="51.5" cy="26" r="1" opacity="0.3" />
      <line x1="51.5" y1="22.5" x2="51.5" y2="24" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="51.5" y1="28" x2="51.5" y2="29.5" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="48" y1="26" x2="49.5" y2="26" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="53.5" y1="26" x2="55" y2="26" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="49" y1="23.5" x2="50.2" y2="24.7" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="54" y1="23.5" x2="52.8" y2="24.7" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="49" y1="28.5" x2="50.2" y2="27.3" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
      <line x1="54" y1="28.5" x2="52.8" y2="27.3" stroke="currentColor" strokeWidth="0.35" opacity="0.3" />
    </svg>
  );
}
