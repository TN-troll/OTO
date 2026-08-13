/**
 * Maintenance cost tier lookup for car makes.
 *
 * Maps car makes to maintenance cost tiers based on industry averages.
 * The lookup is case-insensitive and returns 'unknown' for unrecognized makes.
 */

export type MaintenanceTier = 'low' | 'medium' | 'high';

export interface MaintenanceTierInfo {
  tier: MaintenanceTier | 'unknown';
  color: 'green' | 'amber' | 'red' | 'grey';
  label: string;
  estimatedAnnualRange: string;
}

/**
 * Static lookup mapping car makes to maintenance cost tiers.
 * Keys are stored in their canonical form (mixed case) but lookup is case-insensitive.
 */
export const MAINTENANCE_LOOKUP: Record<string, MaintenanceTier> = {
  // Low maintenance — reliable, affordable parts and service
  'Toyota': 'low',
  'Honda': 'low',
  'Mazda': 'low',
  'Suzuki': 'low',
  'Hyundai': 'low',
  'Kia': 'low',
  'Subaru': 'low',
  'Nissan': 'low',
  'Mitsubishi': 'low',
  'Lexus': 'low',
  'Dacia': 'low',
  'Skoda': 'low',
  'Seat': 'low',

  // Medium maintenance — moderate parts cost, regular service intervals
  'BMW': 'medium',
  'Mercedes-Benz': 'medium',
  'Audi': 'medium',
  'Volkswagen': 'medium',
  'Volvo': 'medium',
  'Peugeot': 'medium',
  'Renault': 'medium',
  'Citroën': 'medium',
  'Opel': 'medium',
  'Ford': 'medium',
  'Jaguar': 'medium',
  'Land Rover': 'medium',
  'Mini': 'medium',
  'Alfa Romeo': 'medium',
  'Infiniti': 'medium',
  'Acura': 'medium',
  'Saab': 'medium',
  'Fiat': 'medium',
  'Dodge': 'medium',
  'Chevrolet': 'medium',
  'Chrysler': 'medium',
  'Jeep': 'medium',
  'Tesla': 'medium',
  'Cupra': 'medium',

  // High maintenance — expensive parts, specialist service required
  'Porsche': 'high',
  'Ferrari': 'high',
  'Lamborghini': 'high',
  'Maserati': 'high',
  'Aston Martin': 'high',
  'Bentley': 'high',
  'Rolls-Royce': 'high',
  'McLaren': 'high',
  'Bugatti': 'high',
  'Pagani': 'high',
  'Koenigsegg': 'high',
  'Lotus': 'high',
  'Morgan': 'high',
  'Maybach': 'high',
  'AMG': 'high',
};

/**
 * Pre-computed case-insensitive lookup map.
 * All keys are stored in lowercase for O(1) case-insensitive lookup.
 */
const LOWERCASE_LOOKUP: Record<string, MaintenanceTier> = Object.fromEntries(
  Object.entries(MAINTENANCE_LOOKUP).map(([make, tier]) => [make.toLowerCase(), tier])
);

const TIER_INFO: Record<MaintenanceTier | 'unknown', Omit<MaintenanceTierInfo, 'tier'>> = {
  low: {
    color: 'green',
    label: 'Low',
    estimatedAnnualRange: '€500 – €1,000',
  },
  medium: {
    color: 'amber',
    label: 'Medium',
    estimatedAnnualRange: '€1,000 – €2,500',
  },
  high: {
    color: 'red',
    label: 'High',
    estimatedAnnualRange: '€2,500 – €5,000+',
  },
  unknown: {
    color: 'grey',
    label: 'Unknown',
    estimatedAnnualRange: 'Not available',
  },
};

/**
 * Looks up the maintenance tier for a given car make.
 * The lookup is case-insensitive and returns 'unknown' for unrecognized makes.
 *
 * @param make - The car make to look up (e.g., "BMW", "toyota", "FERRARI")
 * @returns Full tier info including color, label, and estimated annual cost range
 */
export function getMaintenanceTierInfo(make: string): MaintenanceTierInfo {
  const normalizedMake = make.trim().toLowerCase();
  const tier = Object.hasOwn(LOWERCASE_LOOKUP, normalizedMake)
    ? LOWERCASE_LOOKUP[normalizedMake]
    : 'unknown';
  return {
    tier,
    ...TIER_INFO[tier],
  };
}
