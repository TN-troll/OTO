/**
 * Premium filled silhouette icons for vehicle categories and performance presets.
 * Each icon has dramatically different proportions for instant recognition at small sizes.
 * 64x32 viewBox, fill-based for bold visual impact.
 */

interface IconProps {
  className?: string;
}

/** Supercar — extremely low angular wedge, barely any cabin height (Lamborghini Aventador) */
export function SupercarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M2 26h6.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h25c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H62v-3l-1.5-1.5-1-1.5-2-1.5L54 21l-3-2-1-3-2-2.5-4-1.5H38l-6-1H22l-5 .5-4 1.5-3 2-2.5 2.5L5 20l-2 2.5L2 24v2z" />
      <path d="M56 17l6 2v-2l-2-2-4-1v3zM2 22l4-1.5v-2L3 20l-1 1v1z" opacity="0.6" />
    </svg>
  );
}

/** Luxury — very long body with tall formal upright greenhouse (Rolls-Royce Phantom) */
export function LuxuryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M6 26h5.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h22c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H60v-4l-1-1.5V14l-.5-1.5-1-1L56 10V7.5L54 6h-6l-3-.5H22l-4 .5-3 1-2 1.5-1.5 2L10 13v3l-1 1.5-1 2v2L6 24v2z" />
      <path d="M20 6v5.5h8V5.5L20 6zM36 5.5v6h8V6l-8-.5z" opacity="0.15" />
    </svg>
  );
}

/** Performance Sedan — aggressive four-door, wide arches, lower than luxury (BMW M5) */
export function PerformanceSedanIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M5 26h5.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h21c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H59v-3.5l-1-2-2-2V15l-1.5-2-2-1.5L49 10l-2-1.5L44 8h-4l-3-1H24l-4 1h-3l-3 1.5L11 11l-2 1.5L7.5 15v3.5l-1 2-1 2v3.5z" />
      <path d="M18 8l2-1.5h5V9l-7-1zM40 6.5h5L47 8l-7 1V6.5z" opacity="0.15" />
    </svg>
  );
}

/** Hot Hatch — SHORT body (~70% width), steep vertical rear hatchback (Golf GTI) */
export function HotHatchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M12 26h5.5c.8-2.3 2.8-3.8 5-3.8s4.2 1.5 5 3.8h10c.8-2.3 2.8-3.8 5-3.8s4.2 1.5 5 3.8H51v-3l-1-2V17l.5-3-1-2-1.5-1.5-2-1L43 8h-4l-2-1H27l-4 1-3 1.5-2.5 2-1.5 2.5-1 2.5v3l-1 2v4.5z" />
      <path d="M48 11l3 3v4l-1-1v-3l-2-3z" opacity="0.3" />
    </svg>
  );
}

/** Sports Car — 911 proportions: long hood, small cabin pushed back, rounded fastback */
export function SportsCarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M4 26h6c.8-2.5 3-4.2 5.5-4.2S20 23.5 20.8 26h22.4c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H60v-3l-1-2-1.5-1.5-1.5-2-2-2-2.5-1.5-3-1.5L44 16l-4-2-3-1.5-4-1H26l-6 1-4 1.5-3.5 2L9 18.5 7 20.5l-1.5 2L4 24.5v1.5z" />
      <path d="M42 11c3 1.5 5 3 7 5l2 2-1-.5-3-2.5-3-2.5-2-1.5V11z" opacity="0.2" />
    </svg>
  );
}

/** Performance SUV — TALL, boxy, high ground clearance, large wheels (Urus / Cayenne) */
export function PerformanceSuvIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M8 28h5c1-3 3.5-5 6.5-5s5.5 2 6.5 5h14c1-3 3.5-5 6.5-5s5.5 2 6.5 5H57v-4l-1-2-1-2V12l-1-2-1.5-1.5L50 7l-3-1.5L44 4.5H36l-4-.5H22l-4 .5-3 1.5L12 8l-2 2-1.5 2.5V18l-1 3v3l.5 2v2z" />
      <path d="M8 22v-3h2v3H8zM54 21v-3h2v3h-2z" opacity="0.3" />
    </svg>
  );
}

/** Electric Performance — smooth teardrop/bubble aero shape, flush surfaces (Tesla/Taycan) */
export function ElectricPerformanceIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M6 26h5.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h20c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H58c2 0 3-1 3-2l-.5-2-1.5-2.5-2-2-3-2-3.5-2-4-1.5L42 13l-4-.5H24l-5 .5-4 1.5-3.5 2-3 2-2 2.5-1.5 2.5-.5 1.5c0 1 .5 2 1.5 2z" />
      <path d="M30 15l-2.5 4.5h4L28 25" opacity="0.5" fill="currentColor" />
    </svg>
  );
}

/** Classic — high waistline, separate fender bulges, round headlights, upright windshield (E-Type / 300SL) */
export function ClassicIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M8 26h4c.6-2.8 3-5 6-5s5.4 2.2 6 5h14c.6-2.8 3-5 6-5s5.4 2.2 6 5h4v-3l-1-2v-2l-2-2-2-1.5-1-2-2-2-3-1.5H38l-3-1H22l-4 1h-3l-3 1.5-2 2-1.5 2-1 1.5-1 2v2.5l-.5 2v2z" />
      <circle cx="10" cy="16" r="2.5" opacity="0.5" />
      <circle cx="10" cy="16" r="1.2" opacity="0.3" />
      <circle cx="18" cy="26" r="5" opacity="0.2" />
      <circle cx="18" cy="26" r="3" opacity="0.15" />
      <circle cx="44" cy="26" r="5" opacity="0.2" />
      <circle cx="44" cy="26" r="3" opacity="0.15" />
    </svg>
  );
}

/** Grand Tourer — elegant, longest hood of all, smooth flowing fastback (Aston Martin DB11) */
export function GrandTourerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M3 26h6.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h23c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H60v-3l-1-1.5-.5-2-1-1.5-1.5-1.5-2-1.5-2.5-1.5L48 13l-3-1.5-3-1-3.5-1H32l-8 .5-6 1-4.5 1.5-4 2-3 2.5L5 19.5 4 22l-.5 2L3 25.5v.5z" />
      <path d="M6 21c1-2.5 3-4.5 5.5-6l4-2.5 5-1.5-3 1.5-4 2.5-4 3.5L6 21z" opacity="0.15" />
    </svg>
  );
}

/** Track Weapon — prominent TALL rear wing on pylons above body, front splitter (GT3 RS) */
export function TrackWeaponIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M5 26h5.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h22c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H60v-3l-1-2-1.5-1.5-2-2-2-1.5-2.5-1.5-3-1L44 13l-3-1.5-3-1H28l-5 1-4 1.5-3.5 2-3 2L10 20l-2 1.5-1.5 2-1 2v.5z" />
      <rect x="48" y="4" width="10" height="2.5" rx="1" />
      <rect x="49" y="6.5" width="1.5" height="7" />
      <rect x="56" y="6.5" width="1.5" height="7" />
      <rect x="1" y="22" width="6" height="2" rx="1" opacity="0.6" />
    </svg>
  );
}

/** Daily Luxury — S-Class proportions: long, sleek modern sedan, sportier than formal Luxury */
export function DailyLuxuryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M5 26h5.5c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2h22c.8-2.5 3-4.2 5.5-4.2s4.7 1.7 5.5 4.2H59v-3.5l-1-2-1.5-1.5-1.5-2-1-1.5L52 13.5l-2-1.5-2.5-1-3-.5H36l-4-.5H24l-4 .5-3 1-2.5 1.5-2 2-1.5 2L9 19.5l-1.5 2-1 1.5-1 2v1z" />
      <path d="M22 10.5l3-1h7v1.5h-7l-3-.5zM37 9.5h6l3 1-.5.5H37V9.5z" opacity="0.12" />
    </svg>
  );
}

/** Classic Collectible — vintage sports car: extremely long nose, tiny cabin way back (Ferrari 250 GTO) */
export function ClassicCollectibleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M4 26h5c.7-2.5 2.8-4.2 5.5-4.2s4.8 1.7 5.5 4.2h26c.7-2.5 2.8-4.2 5.5-4.2s4.8 1.7 5.5 4.2H61v-3l-.5-1.5-1-1.5-1.5-1.5-2-1.5-2-1-2.5-1-3-.5H44l-6-1.5-5-1-5.5-.5h-4l-5 .5-4 1-3 1.5-2.5 2-2 2-1.5 2L4 24v2z" />
      <circle cx="7" cy="17" r="2.5" opacity="0.5" />
      <circle cx="7" cy="17" r="1.2" opacity="0.3" />
      <circle cx="14.5" cy="26" r="4.2" opacity="0.2" />
      <circle cx="14.5" cy="26" r="2.5" opacity="0.15" />
      <circle cx="51.5" cy="26" r="4.2" opacity="0.2" />
      <circle cx="51.5" cy="26" r="2.5" opacity="0.15" />
    </svg>
  );
}
