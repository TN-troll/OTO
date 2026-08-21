/**
 * Clean single-path vehicle category silhouettes.
 * Inspired by AutoScout24/Mobile.de body type filter icons.
 * 80x36 viewBox, fill-based, optimized for small sizes (h-5 to h-6).
 * Each shape has dramatically different proportions for instant recognition.
 */

interface IconProps {
  className?: string;
}

/** Supercar — ultra-low wedge, tiny greenhouse pushed far back (Lamborghini Huracán) */
export function SupercarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M2 29 L2 25 C2 24 3 23 5 22 L12 19 C14 18 18 17 22 16 L35 14.5 C40 14 44 13 48 12 C52 11 56 10 60 10 C64 10 67 11 70 12.5 C73 14 75 16 76 18 C77 20 78 22 78 24 L78 29 L70 29 C70 25.7 67.3 23 64 23 C60.7 23 58 25.7 58 29 L22 29 C22 25.7 19.3 23 16 23 C12.7 23 10 25.7 10 29 Z" />
      <circle cx="16" cy="29" r="3.5" />
      <circle cx="64" cy="29" r="3.5" />
    </svg>
  );
}

/** Luxury — tall upright formal greenhouse, long hood, stately (Rolls-Royce Ghost) */
export function LuxuryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M5 29 L5 24 C5 22 6 20 7 18 L10 15 L14 12 C16 11 18 10 20 9 L24 8 L30 7 L38 6.5 L48 7 L54 8 C56 8.5 58 9.5 60 11 L63 13 L65 15 L67 18 C68 20 69 22 70 24 L72 26 L74 28 L74 29 L65 29 C65 25.7 62.3 23 59 23 C55.7 23 53 25.7 53 29 L25 29 C25 25.7 22.3 23 19 23 C15.7 23 13 25.7 13 29 Z" />
      <circle cx="19" cy="29" r="3.5" />
      <circle cx="59" cy="29" r="3.5" />
    </svg>
  );
}

/** Performance Sedan — sporty four-door with trunk step-down at rear (BMW M5) */
export function PerformanceSedanIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M5 29 L5 24 C5 22 6 20 8 18 L11 15 L15 12.5 C18 11 21 10 24 9.5 L30 9 L36 8.5 L42 9 C45 9.5 48 10 50 11 L54 13 L58 15.5 L61 18 C62 19 63 20 64 21 L67 23 C69 24 71 25 73 26 L75 28 L75 29 L65 29 C65 25.7 62.3 23 59 23 C55.7 23 53 25.7 53 29 L27 29 C27 25.7 24.3 23 21 23 C17.7 23 15 25.7 15 29 Z" />
      <circle cx="21" cy="29" r="3.5" />
      <circle cx="59" cy="29" r="3.5" />
    </svg>
  );
}

/** Hot Hatch — short compact body, steep near-vertical rear hatch (VW Golf GTI) */
export function HotHatchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M17 29 L17 24 C17 22 18 20 20 18 L23 15 L27 12.5 C29 11.5 31 10.5 34 10 L38 9.5 L42 9.5 C44 9.5 46 10 48 11 L50 12 L52 14 L54 16 C55 17.5 56 19 57 21 L58 23 L59 25 L60 27 L60 29 L56 29 C56 25.7 53.3 23 50 23 C46.7 23 44 25.7 44 29 L33 29 C33 25.7 30.3 23 27 23 C23.7 23 21 25.7 21 29 Z" />
      <circle cx="27" cy="29" r="3.5" />
      <circle cx="50" cy="29" r="3.5" />
    </svg>
  );
}

/** Sports Car — continuous sloping roofline, round organic curves, wide rear (Porsche 911) */
export function SportsCarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M4 29 L4 25 C4 23 5 21 7 19 L10 17 L14 15 C17 13.5 20 12.5 24 12 L30 11.5 L36 11 C39 11 42 11 45 11.5 C48 12 51 13 54 14.5 C57 16 59 17.5 61 19.5 C63 21.5 65 23 67 24.5 C69 26 72 27.5 75 28.5 L75 29 L67 29 C67 25.7 64.3 23 61 23 C57.7 23 55 25.7 55 29 L25 29 C25 25.7 22.3 23 19 23 C15.7 23 13 25.7 13 29 Z" />
      <circle cx="19" cy="29" r="3.5" />
      <circle cx="61" cy="29" r="3.5" />
    </svg>
  );
}

/** Performance SUV — tall body, ground clearance, large wheels (Porsche Cayenne) */
export function PerformanceSuvIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M8 31 L8 23 C8 20 9 17 11 14 L14 11 L18 8.5 C21 7 24 6 28 5.5 L34 5 L40 5 L46 5.5 C50 6 53 7 56 8.5 L60 11 L63 14 C65 17 66 20 66 23 L67 25 L69 27 L71 29 L71 31 L63 31 C63 26.6 60 23 56 23 C52 23 49 26.6 49 31 L31 31 C31 26.6 28 23 24 23 C20 23 17 26.6 17 31 Z" />
      <circle cx="24" cy="31" r="4.5" />
      <circle cx="56" cy="31" r="4.5" />
      <path d="M22 5 L58 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Electric Performance — smooth aerodynamic teardrop, flush surfaces (Tesla Model S / Taycan) */
export function ElectricPerformanceIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M4 29 C4 27 5 25 7 22.5 C9 20 12 17.5 16 15.5 C20 13.5 24 12 29 11 C34 10 38 9.5 40 9.5 C42 9.5 46 10 51 11 C56 12 60 13.5 64 15.5 C68 17.5 71 20 73 22.5 C75 25 76 27 76 29 L66 29 C66 25.7 63.3 23 60 23 C56.7 23 54 25.7 54 29 L26 29 C26 25.7 23.3 23 20 23 C16.7 23 14 25.7 14 29 Z" />
      <circle cx="20" cy="29" r="3.5" />
      <circle cx="60" cy="29" r="3.5" />
    </svg>
  );
}

/** Classic — very long hood, tiny cabin way back, flowing fenders (Jaguar E-Type / Ferrari 250 GTO) */
export function ClassicIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M3 29 L3 24 C3 22 4 20 5 18.5 L8 16 L12 14 L18 12 L26 10.5 L34 10 L42 10 C46 10 50 10.5 53 11.5 C56 12.5 59 14 61 16 C63 18 65 20 67 22 C69 24 71 26 73 27.5 L74 29 L67 29 C67 24.6 64 21 60.5 21 C57 21 54 24.6 54 29 L22 29 C22 24.6 19 21 15.5 21 C12 21 9 24.6 9 29 Z" />
      <circle cx="15.5" cy="29" r="4.2" />
      <circle cx="60.5" cy="29" r="4.2" />
    </svg>
  );
}

/** Grand Tourer — long elegant fastback, flowing roofline into tail (Aston Martin DB11) */
export function GrandTourerIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M3 29 L3 24 C3 22 4 20 6 18 L9 15.5 L13 13 C16 11.5 20 10.5 24 10 L30 9.5 L36 9.5 L42 10 C46 10.5 49 11 52 12 C55 13 57 14.5 59 16.5 C61 18.5 63 20.5 65 22.5 C67 24.5 70 26.5 73 28 L76 29 L66 29 C66 25.7 63.3 23 60 23 C56.7 23 54 25.7 54 29 L25 29 C25 25.7 22.3 23 19 23 C15.7 23 13 25.7 13 29 Z" />
      <circle cx="19" cy="29" r="3.5" />
      <circle cx="60" cy="29" r="3.5" />
    </svg>
  );
}

/** Track Weapon — sports car with prominent rear wing on pylons (Porsche 911 GT3 RS) */
export function TrackWeaponIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M4 29 L4 25 C4 23 5 21 7 19 L10 17 L14 15 C17 13.5 20 12.5 24 12 L30 11.5 L36 11 C39 11 42 11 45 11.5 C48 12 51 13 54 14.5 C57 16 59 17.5 61 19.5 C63 21.5 65 23 67 24.5 C69 26 72 27.5 75 28.5 L75 29 L67 29 C67 25.7 64.3 23 61 23 C57.7 23 55 25.7 55 29 L25 29 C25 25.7 22.3 23 19 23 C15.7 23 13 25.7 13 29 Z" />
      <circle cx="19" cy="29" r="3.5" />
      <circle cx="61" cy="29" r="3.5" />
      <rect x="57" y="5" width="14" height="2.5" rx="1.2" />
      <rect x="59.5" y="7.5" width="1.5" height="6" />
      <rect x="69" y="7.5" width="1.5" height="6" />
    </svg>
  );
}

/** Daily Luxury — long flowing modern sedan, lower than formal Luxury (Mercedes S-Class) */
export function DailyLuxuryIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M4 29 L4 24 C4 22 5 20 7 17.5 L10 14.5 L14 12 C17 10.5 20 9.5 24 9 L30 8.5 L36 8 L42 8 L48 8.5 C52 9 55 10 58 11.5 L62 14 L65 17 C66.5 19 67.5 21 68 23 L70 25 L73 27 L75 29 L65 29 C65 25.7 62.3 23 59 23 C55.7 23 53 25.7 53 29 L27 29 C27 25.7 24.3 23 21 23 C17.7 23 15 25.7 15 29 Z" />
      <circle cx="21" cy="29" r="3.5" />
      <circle cx="59" cy="29" r="3.5" />
    </svg>
  );
}

/** Classic Collectible — vintage long-hood sports car, same as ClassicIcon (Ferrari 250 GTO) */
export function ClassicCollectibleIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 80 36" fill="currentColor" aria-hidden="true">
      <path d="M3 29 L3 24 C3 22 4 20 5 18.5 L8 16 L12 14 L18 12 L26 10.5 L34 10 L42 10 C46 10 50 10.5 53 11.5 C56 12.5 59 14 61 16 C63 18 65 20 67 22 C69 24 71 26 73 27.5 L74 29 L67 29 C67 24.6 64 21 60.5 21 C57 21 54 24.6 54 29 L22 29 C22 24.6 19 21 15.5 21 C12 21 9 24.6 9 29 Z" />
      <circle cx="15.5" cy="29" r="4.2" />
      <circle cx="60.5" cy="29" r="4.2" />
    </svg>
  );
}
