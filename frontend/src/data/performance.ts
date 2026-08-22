/**
 * 0-100 km/h acceleration times for known models.
 * Source: manufacturer specs and independent tests.
 */
export const ACCELERATION_DATA: Record<string, Record<string, number>> = {
  'Ferrari': {
    'SF90 Spider': 2.5,
    'SF90XX': 2.3,
    'F8 Tributo': 2.9,
    'F8 Spider': 2.9,
    '812': 2.9,
    '812 Competizione': 2.8,
    'Purosangue': 3.3,
    '296 GTS': 2.9,
    '296 GTB': 2.9,
    '488 GTB': 3.0,
    'LaFerrari': 2.6,
    '12 Cilindri': 2.9,
    'F40': 4.7,
    'F50': 3.7,
    'Enzo': 3.4,
  },
  'Lamborghini': {
    'Revuelto': 2.5,
    'Huracán': 2.9,
    'Huracán STO': 2.9,
    'Huracán Tecnica': 3.0,
    'Aventador': 2.8,
    'Aventador SVJ': 2.8,
    'Urus': 3.6,
    'Countach': 2.8,
  },
  'Porsche': {
    '911 GT3': 3.4,
    '911 GT3 RS': 3.2,
    '911 GT2 RS': 2.7,
    '911 Turbo S': 2.7,
    '911 Turbo': 3.0,
    '911 Sport Classic': 4.1,
    '911': 3.6,
    'Taycan': 2.8,
    'Cayenne': 3.8,
    'Panamera': 3.1,
    'Carrera GT': 3.5,
    '918 Spyder': 2.5,
    '718': 4.0,
    'Cayman GT4': 4.2,
  },
  'McLaren': {
    '720S': 2.8,
    '750S': 2.8,
    '765LT': 2.7,
    'P1': 2.8,
    'Senna': 2.8,
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
    'AMG GT R': 3.5,
    'AMG GT Black Series': 3.1,
    'AMG ONE': 2.9,
    'G 63 AMG': 4.5,
    'S 63 AMG': 3.5,
    'A 45 AMG': 3.9,
    'C 63 AMG': 3.9,
    'E 63 AMG': 3.4,
  },
  'BMW': {
    'M2': 4.1,
    'M3': 3.9,
    'M3 CS': 3.4,
    'M4': 3.9,
    'M5': 3.4,
    'M8': 3.2,
    'X5 M': 3.8,
    'X6 M': 3.8,
  },
  'Audi': {
    'R8': 3.1,
    'RS5': 3.9,
    'RS6': 3.6,
    'RS7': 3.6,
    'RSQ8': 3.8,
    'RS3': 3.8,
    'RS4': 4.1,
    'RS e-tron GT': 3.3,
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
  'Tesla': {
    'Model S Plaid': 2.1,
    'Model S': 3.2,
    'Model 3 Performance': 3.3,
    'Model X Plaid': 2.5,
  },
  'Rimac': {
    'Nevera': 1.97,
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

/**
 * 0-200 km/h acceleration times for known models.
 */
export const ACCELERATION_0_200: Record<string, Record<string, number>> = {
  'Bugatti': { 'Chiron': 6.1 },
  'Ferrari': { 'SF90 Spider': 6.7, 'LaFerrari': 6.9, '812': 7.9, 'F8 Tributo': 7.8 },
  'Lamborghini': { 'Revuelto': 6.7, 'Aventador': 8.6, 'Huracán': 9.0 },
  'Porsche': { '918 Spyder': 7.2, '911 Turbo S': 8.9, 'Taycan': 9.6, '911 GT3 RS': 10.6 },
  'McLaren': { '720S': 7.8, '750S': 7.2, '600LT': 8.4 },
  'Nissan': { 'GT-R': 8.6 },
  'Mercedes-Benz': { 'AMG ONE': 7.0, 'AMG GT': 10.8 },
  'BMW': { 'M5': 11.1, 'M8': 10.5 },
  'Audi': { 'R8': 9.9, 'e-tron GT': 10.5 },
  'Tesla': { 'Model S': 9.4, 'Model S Plaid': 6.8 },
  'Rimac': { 'Nevera': 4.3 },
};

/**
 * 100-200 km/h acceleration times for known models.
 */
export const ACCELERATION_100_200: Record<string, Record<string, number>> = {
  'Bugatti': { 'Chiron': 4.3 },
  'Ferrari': { 'SF90 Spider': 4.2, 'LaFerrari': 4.3, '812': 5.0, 'F8 Tributo': 4.9 },
  'Lamborghini': { 'Revuelto': 4.2, 'Aventador': 5.8, 'Huracán': 6.1 },
  'Porsche': { '918 Spyder': 4.7, '911 Turbo S': 6.2, 'Taycan': 6.8 },
  'McLaren': { '720S': 5.0, '750S': 4.4, '600LT': 5.5 },
  'Nissan': { 'GT-R': 5.9 },
  'Mercedes-Benz': { 'AMG ONE': 4.1 },
  'BMW': { 'M5': 7.7, 'M8': 7.3 },
  'Audi': { 'R8': 6.8 },
};

/** Get acceleration for a specific category */
export function getAccelerationByCategory(make: string, model: string, category: '0-100' | '0-200' | '100-200'): number | null {
  const dataMap = category === '0-100' ? ACCELERATION_DATA : category === '0-200' ? ACCELERATION_0_200 : ACCELERATION_100_200;
  const makeData = dataMap[make];
  if (!makeData) return null;
  if (makeData[model]) return makeData[model];
  for (const [key, value] of Object.entries(makeData)) {
    if (model.includes(key) || key.includes(model)) return value;
  }
  return null;
}
