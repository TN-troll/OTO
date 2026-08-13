/**
 * 0-100 km/h acceleration times for known models.
 * Source: manufacturer specs and independent tests.
 */
export const ACCELERATION_DATA: Record<string, Record<string, number>> = {
  'Ferrari': {
    'SF90 Spider': 2.5,
    'F8 Tributo': 2.9,
    'F8 Spider': 2.9,
    '812': 2.9,
    'Purosangue': 3.3,
    '296 GTS': 2.9,
    '488 GTB': 3.0,
    'LaFerrari': 2.6,
    '12 Cilindri': 2.9,
  },
  'Lamborghini': {
    'Revuelto': 2.5,
    'Huracán': 2.9,
    'Aventador': 2.8,
    'Urus': 3.6,
    'Countach': 2.8,
  },
  'Porsche': {
    '911 GT3': 3.4,
    '911 GT3 RS': 3.2,
    '911 Turbo S': 2.7,
    '911': 3.6,
    'Taycan': 2.8,
    'Cayenne': 3.8,
    'Panamera': 3.1,
    'Carrera GT': 3.5,
    '918 Spyder': 2.5,
    '718': 4.0,
  },
  'McLaren': {
    '720S': 2.8,
    '750S': 2.8,
    '600LT': 2.9,
    '620R': 2.9,
    'Artura': 3.0,
    '570S': 3.1,
  },
  'Bugatti': {
    'Chiron': 2.4,
  },
  'Mercedes-Benz': {
    'AMG GT': 3.2,
    'AMG ONE': 2.9,
    'G 63 AMG': 4.5,
    'S 63 AMG': 3.5,
    'A 45 AMG': 3.9,
  },
  'BMW': {
    'M3': 3.9,
    'M4': 3.9,
    'M5': 3.4,
    'M8': 3.2,
    'X5 M': 3.8,
    'X6 M': 3.8,
  },
  'Audi': {
    'R8': 3.1,
    'RS6': 3.6,
    'RS7': 3.6,
    'RSQ8': 3.8,
    'RS3': 3.8,
    'e-tron GT': 3.3,
  },
  'Rolls-Royce': {
    'Spectre': 4.4,
    'Ghost': 4.8,
    'Phantom': 5.3,
    'Cullinan': 5.2,
  },
  'Bentley': {
    'Continental GT': 3.6,
    'Continental GTC': 3.7,
    'Flying Spur': 3.8,
    'Bentayga': 4.0,
  },
  'Nissan': {
    'GT-R': 2.7,
  },
  'Volkswagen': {
    'Golf R': 4.7,
    'Golf GTI': 6.2,
  },
  'Hyundai': {
    'i30 N': 5.9,
    'Ioniq 5 N': 3.4,
  },
  'Toyota': {
    'GR Yaris': 5.5,
    'Supra': 4.3,
  },
  'Honda': {
    'Civic Type R': 5.4,
  },
};

export function getAcceleration(make: string, model: string): number | null {
  const makeData = ACCELERATION_DATA[make];
  if (!makeData) return null;
  
  // Try exact match first, then partial match
  if (makeData[model]) return makeData[model];
  
  for (const [key, value] of Object.entries(makeData)) {
    if (model.includes(key) || key.includes(model)) return value;
  }
  
  return null;
}
