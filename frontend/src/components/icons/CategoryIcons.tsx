/**
 * Premium filled silhouette icons for vehicle categories and performance presets.
 * Each icon is a recognizable car shape rendered as a solid silhouette.
 * 24x24 viewBox, fill-based for bold visual impact.
 */

interface IconProps {
  className?: string;
}

/** Supercar — low, wide mid-engine wedge (think Lamborghini Countach / Ferrari) */
export function SupercarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M8 24c0-2.2 1.8-4 4-4s4 1.8 4 4H8zm40 0c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zM4 22h4.3c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4h24.6c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4H60c1.1 0 2-.5 2-1.5v-2c0-.5-.2-1-.5-1.2L56 13l-2-2-6-4h-2l-8-2H26l-10 3-6 3-4.5 3.5L3 14c-1 1-1.5 2-1.5 3v3.5c0 1 .7 1.5 2.5 1.5z" />
    </svg>
  );
}

/** Luxury — stately long-wheelbase sedan (Rolls-Royce / Bentley proportions) */
export function LuxuryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M10 24c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zm36 0c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zM4 22h6.3c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4h20.6c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4H60c1.1 0 2-.7 2-1.5V18l-1-2-3-3-2-1.5V9c0-.5-.2-1-.6-1.2L50 5H36l-8-1H20l-6 1.5L9 7.5 6 10 4 12.5 3 15v5.5c0 1 .5 1.5 1 1.5z" />
    </svg>
  );
}

/** Performance Sedan — aggressive four-door (M5 / RS6 / AMG proportions) */
export function PerformanceSedanIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M10 24c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zm34 0c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zM5 22h5.3c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4h20.6c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4H58c1.7 0 3-.7 3-1.5V18l-2-3-3-2V10l-4-3.5L46 5H38l-6-1H24l-7 1.5-5 2L8 10l-2.5 3L4 16v4.5c0 1 .5 1.5 1 1.5z" />
    </svg>
  );
}

/** Hot Hatch — compact, aggressive hatchback (Golf GTI / Civic Type R) */
export function HotHatchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M12 24c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zm30 0c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zM6 22h6.3c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4h16.6c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4H56c1.5 0 3-.6 3-1.5V18l-1.5-2.5-3-2-1.5-2V8l-2-2.5L46 4H36l-4-1H22l-6 1.5-4 2.5-3 3L6 14v6.5c0 1 0 1.5 0 1.5z" />
    </svg>
  );
}

/** Sports Car — classic front-engine coupe (911 / Corvette proportions) */
export function SportsCarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M10 24c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zm36 0c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zM4 22h6.3c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4h20.6c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4H60c1.5 0 2.5-.6 2.5-1.5V18l-1.5-2.5-2.5-2-1.5-2-3-2.5L48 7h-6L34 5.5H26l-8 2-5 2.5L9 13l-3 2.5-2 2v3c0 1 0 1.5 0 1.5z" />
    </svg>
  );
}

/** Performance SUV — tall, muscular stance (Urus / Cayenne) */
export function PerformanceSuvIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M11 26c0-2.8 2.2-5 5-5s5 2.2 5 5h-10zm28 0c0-2.8 2.2-5 5-5s5 2.2 5 5h-10zM5 24h6.4c1-3 3.8-5 7.1-5s6 2 7 5h13c1-3 3.8-5 7.1-5s6 2 7 5H56c2 0 4-1 4-2v-4l-2-3-3-3v-3l-2-3-5-3H38l-4-1H22l-6 1-4 2-3 3-3 3-2 4v3c0 1.5 1 2 1 2z" />
    </svg>
  );
}

/** Electric Performance — sleek EV coupe/sedan shape with aerodynamic lines */
export function ElectricPerformanceIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M10 24c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zm36 0c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zM4 22h6.3c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4h20.6c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4H60c1.5 0 2.5-.5 2.5-1.5V18l-1-2-3-2.5-2-2.5-4-3L46 6H38l-4-.5H24l-8 1.5L11 9.5 7 13l-2.5 3L3 18v2.5c0 1 .5 1.5 1 1.5z" />
      <path d="M30 10l-3 5h4l-3 6" fillRule="evenodd" opacity="0.4" />
    </svg>
  );
}

/** Classic — vintage car with running boards and round forms (E-Type / 300SL era) */
export function ClassicIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M12 25c0-2.5 2-4.5 4.5-4.5S21 22.5 21 25h-9zm28 0c0-2.5 2-4.5 4.5-4.5S49 22.5 49 25h-9zM6 23h6.4c1-2.8 3.6-4.5 6.1-4.5s5 1.7 6 4.5h14.8c1-2.8 3.6-4.5 6.1-4.5s5 1.7 6 4.5H56c2 0 3-.7 3-1.5V20l-1-1.5-2-1.5-1-2-2-2.5-3-2.5-4-2H36l-3-.5H22l-6 1.5-4 2-3 2.5-2 3-1.5 2v1.5c0 1 .5 1.5.5 1.5z" />
      <circle cx="10" cy="14" r="2.5" opacity="0.5" />
      <circle cx="55" cy="15" r="2" opacity="0.5" />
    </svg>
  );
}

/** Grand Tourer — long-hood elegant GT coupe (DB11 / Continental GT) */
export function GrandTourerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M10 24c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zm36 0c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zM4 22h6.3c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4h20.6c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4H60c1.5 0 2.5-.6 2.5-1.5V18l-1-2-2.5-2-2-2.5-2-2L50 7h-4l-6-1.5H30l-6 .5-6 2-4 2.5-3.5 3L8 16l-3 2.5v2c0 1 0 1.5-.5 1.5h-.5z" />
    </svg>
  );
}

/** Track Weapon — aggressive aero-kitted race car (GT3 RS / 765LT) */
export function TrackWeaponIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M9 24c0-2.2 1.8-4 4-4s4 1.8 4 4H9zm38 0c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zM3 22h6.3c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4h22.6c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4H61c1.5 0 2-.5 2-1.5v-1.5l-1-2-3-2.5-2-2-3-2.5L49 7h-5l-7-3H28l-8 2-6 3-4.5 3-3 2.5L4 17l-1.5 2v1.5c0 1 .5 1.5.5 1.5z" />
      <rect x="2" y="12" width="5" height="2" rx="1" opacity="0.5" />
      <rect x="57" y="11" width="5" height="3" rx="1" opacity="0.5" />
    </svg>
  );
}

/** Daily Luxury — premium sedan/GT (S-Class / 7-Series comfort) */
export function DailyLuxuryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M10 24c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zm34 0c0-2.2 1.8-4 4-4s4 1.8 4 4h-8zM5 22h5.3c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4h20.6c.9-2.4 3.2-4 5.7-4s4.8 1.6 5.7 4H58c1.5 0 2.5-.6 2.5-1.5V18l-1-2-2.5-2V11l-3-3-5-2.5H40l-5-.5H24l-6 1L13 8l-3.5 2.5L7 13.5 5 16v4.5c0 1 0 1.5 0 1.5z" />
    </svg>
  );
}

/** Classic Collectible — rare vintage sports car (classic Ferrari / Jaguar E-Type) */
export function ClassicCollectibleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 32" fill="currentColor" aria-hidden="true">
      <path d="M11 25c0-2.5 2-4.5 4.5-4.5S20 22.5 20 25h-9zm30 0c0-2.5 2-4.5 4.5-4.5S50 22.5 50 25h-9zM5 23h6.4c1-2.8 3.6-4.5 6.1-4.5s5 1.7 6 4.5h16.8c1-2.8 3.6-4.5 6.1-4.5s5 1.7 6 4.5H57c2 0 3-.7 3-1.5V20l-1.5-2-2-2-2-2.5-3-2L47 9h-6l-4-2H28l-5.5 1-5 2-4 2.5-3.5 3L8 18l-2 2v1.5c0 1 0 1.5-.5 1.5h-.5z" />
      <circle cx="9" cy="15" r="2" opacity="0.4" />
      <circle cx="56" cy="16" r="1.5" opacity="0.4" />
    </svg>
  );
}
