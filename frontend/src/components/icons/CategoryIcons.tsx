/**
 * Premium SVG icon library for vehicle categories and performance presets.
 * Line-art style, 24x24 viewBox, stroke-based (no fill), strokeWidth 1.5.
 */

interface IconProps {
  className?: string;
}

/** Angular mid-engine silhouette with sharp wedge shape */
export function SupercarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15.5h20" />
      <path d="M4 15.5l1.5-4.5h3L10 8.5h6l2 2.5h2.5l1.5 4.5" />
      <path d="M3 15.5v1.5h2.5" />
      <path d="M18.5 17h2.5v-1.5" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="17" cy="17" r="1.5" />
      <path d="M8.5 17h7" />
      <path d="M10 11h4" />
    </svg>
  );
}

/** Elegant crown emblem */
export function LuxuryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 17h16" />
      <path d="M5 17l1-9 3.5 4L12 7l2.5 5L18 8l1 9" />
      <circle cx="5" cy="7" r="1" />
      <circle cx="12" cy="5.5" r="1" />
      <circle cx="19" cy="7" r="1" />
      <path d="M6 19h12" />
    </svg>
  );
}

/** Sleek four-door sedan profile with sport lines */
export function PerformanceSedanIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 14.5h20" />
      <path d="M4 14.5l1-3h3.5l2-3h5l1.5 1.5H19l1.5 1.5h.5l1 3" />
      <path d="M3 14.5v2h2" />
      <path d="M19 16.5h2v-2" />
      <circle cx="6.5" cy="16.5" r="1.5" />
      <circle cx="17.5" cy="16.5" r="1.5" />
      <path d="M8 16.5h9" />
      <path d="M10.5 11.5l1-1.5" />
      <path d="M7 11.5h8" />
    </svg>
  );
}

/** Compact hatchback with aggressive stance */
export function HotHatchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15h20" />
      <path d="M4.5 15l1-3.5h3L10 8h4.5l1.5 1.5 2 2H20l1.5 3.5" />
      <path d="M10 11.5V8" />
      <path d="M3 15v2h2.5" />
      <path d="M18.5 17h2.5v-2" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="17" cy="17" r="1.5" />
      <path d="M8.5 17h7" />
      <path d="M16 8.5l1.5 1" />
    </svg>
  );
}

/** Classic front-engine sports car profile (911-like) */
export function SportsCarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15.5h20" />
      <path d="M4 15.5l1-3h2.5l1.5-2.5h5l2.5 1 2 1.5h2l1.5 3" />
      <path d="M9 10l-1 2.5" />
      <path d="M3 15.5v1.5h2" />
      <path d="M19 17h2v-1.5" />
      <circle cx="6.5" cy="17" r="1.5" />
      <circle cx="17.5" cy="17" r="1.5" />
      <path d="M8 17h8" />
      <path d="M14 10l1.5.5" />
    </svg>
  );
}

/** Muscular SUV silhouette with aggressive fenders */
export function PerformanceSuvIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16h20" />
      <path d="M4 16l.5-3h2l1.5-4h8l2 2.5H20l1.5 1.5v3" />
      <path d="M9 9V7h6v2" />
      <path d="M3 16v2h2.5" />
      <path d="M18.5 18h2.5v-2" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="18" r="2" />
      <path d="M9 18h6" />
    </svg>
  );
}

/** Stylized lightning bolt with speed lines */
export function ElectricPerformanceIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L4.5 13h6L9 22l9.5-12h-6L15 2" />
      <path d="M18 5h3" />
      <path d="M19 8h2.5" />
      <path d="M18.5 11h2" />
    </svg>
  );
}

/** Vintage car silhouette with round headlights */
export function ClassicIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15h20" />
      <path d="M4.5 15l.5-2.5h2l1.5-3h7l1.5 1.5h2l1 1.5h1l.5 2.5" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="19.5" cy="12.5" r="0.75" />
      <path d="M3 15v2.5h2" />
      <path d="M19 17.5h2v-2.5" />
      <circle cx="7" cy="17.5" r="2" />
      <circle cx="17" cy="17.5" r="2" />
      <path d="M9 17.5h6" />
      <path d="M9.5 9.5h4" />
    </svg>
  );
}

/** Long-hood GT coupe profile with elegant proportions */
export function GrandTourerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 15h20" />
      <path d="M4 15l1.5-4h4l1.5-2.5h4L17 10h2.5l1.5 2v3" />
      <path d="M11 8.5l-.5 2.5" />
      <path d="M3 15v2h2.5" />
      <path d="M18.5 17h2.5v-2" />
      <circle cx="7" cy="17" r="1.5" />
      <circle cx="17" cy="17" r="1.5" />
      <path d="M8.5 17h7" />
      <path d="M5.5 11h4" />
    </svg>
  );
}

/** Racing crosshair with precision lines */
export function TrackWeaponIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1" />
      <path d="M12 2v4" />
      <path d="M12 18v4" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
    </svg>
  );
}

/** Five-pointed star with laurel wreath (luxury emblem) */
export function DailyLuxuryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l2 5h5.5l-4.5 3.5 1.5 5.5-4.5-3-4.5 3 1.5-5.5L4.5 8H10l2-5z" />
      <path d="M5 18c1.5 1.5 3.5 3 7 3s5.5-1.5 7-3" />
      <path d="M4 15.5c-.5-.5-1.5-2-2-3.5" />
      <path d="M20 15.5c.5-.5 1.5-2 2-3.5" />
    </svg>
  );
}

/** Vintage steering wheel / classic gauge cluster */
export function ClassicCollectibleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
      <path d="M12 7v-1.5" />
      <path d="M15.5 9l1-1" />
      <path d="M17 12h1.5" />
      <path d="M15.5 15l1 1" />
      <path d="M12 17v1.5" />
      <path d="M8.5 15l-1 1" />
      <path d="M7 12H5.5" />
      <path d="M8.5 9l-1-1" />
    </svg>
  );
}
