/**
 * Engine and sound profile data for known make+model combinations.
 * Used to auto-assign sound_profile_id to listings based on their make/model.
 * 
 * Sources: manufacturer specifications, Wikipedia engine lists, automotive press.
 */

export interface EngineProfile {
  engineConfiguration: 'inline' | 'v-type' | 'flat' | 'rotary';
  cylinderCount: number;
  forcedInduction: 'naturally_aspirated' | 'turbocharged' | 'supercharged';
  exhaustNote: 'deep_rumble' | 'high_pitched_scream' | 'aggressive_bark' | 'smooth_purr';
}

/**
 * Maps make → model → engine profile.
 * For models with multiple engine variants, the most common/iconic is used.
 */
export const ENGINE_PROFILES: Record<string, Record<string, EngineProfile>> = {
  Ferrari: {
    // V12s
    '812': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'F12': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'LaFerrari': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    '12 Cilindri': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'Purosangue': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    '599': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'Monza': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    '365': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'deep_rumble' },
    '250': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'deep_rumble' },
    // V8 twin-turbo
    'F8 Tributo': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'F8 Spider': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'SF90 Spider': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'SF90 Stradale': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    '488': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'Roma': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    // V6 hybrid
    '296 GTS': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    '296 GTB': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
  },
  Lamborghini: {
    'Aventador': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'Revuelto': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'Countach': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'Huracán': { engineConfiguration: 'v-type', cylinderCount: 10, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'Gallardo': { engineConfiguration: 'v-type', cylinderCount: 10, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'Urus': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'Diablo': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'deep_rumble' },
    'Murciélago': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'naturally_aspirated', exhaustNote: 'deep_rumble' },
  },
  Porsche: {
    '911': { engineConfiguration: 'flat', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    '991': { engineConfiguration: 'flat', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    '992': { engineConfiguration: 'flat', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    '997': { engineConfiguration: 'flat', cylinderCount: 6, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    '718': { engineConfiguration: 'flat', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'Carrera GT': { engineConfiguration: 'v-type', cylinderCount: 10, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'Cayenne': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'Macan': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'Panamera': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'Taycan': { engineConfiguration: 'inline', cylinderCount: 0, forcedInduction: 'naturally_aspirated', exhaustNote: 'smooth_purr' }, // Electric
  },
  McLaren: {
    '720S': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    '750S': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    '570S': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    '600LT': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    '620R': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'Artura': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'Senna': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'high_pitched_scream' },
  },
  'Mercedes-Benz': {
    'AMG GT': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'AMG ONE': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'high_pitched_scream' },
    'G 63 AMG': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'G 500': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'S 63 AMG': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'S 65 AMG': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'A 45 AMG': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'CLA 45 AMG': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'GLE 63 AMG': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'EQS': { engineConfiguration: 'inline', cylinderCount: 0, forcedInduction: 'naturally_aspirated', exhaustNote: 'smooth_purr' },
  },
  BMW: {
    'M3': { engineConfiguration: 'inline', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'M4': { engineConfiguration: 'inline', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'M5': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'M8': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'X5 M': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'X6 M': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'Z4': { engineConfiguration: 'inline', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'i4': { engineConfiguration: 'inline', cylinderCount: 0, forcedInduction: 'naturally_aspirated', exhaustNote: 'smooth_purr' },
    'iX': { engineConfiguration: 'inline', cylinderCount: 0, forcedInduction: 'naturally_aspirated', exhaustNote: 'smooth_purr' },
  },
  Audi: {
    'R8': { engineConfiguration: 'v-type', cylinderCount: 10, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'RS6': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'RS7': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'RS3': { engineConfiguration: 'inline', cylinderCount: 5, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'RS5': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'S3': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'e-tron GT': { engineConfiguration: 'inline', cylinderCount: 0, forcedInduction: 'naturally_aspirated', exhaustNote: 'smooth_purr' },
    'RSQ8': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'SQ7': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'SQ8': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
  },
  'Rolls-Royce': {
    'Phantom': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'Ghost': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'Wraith': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'Dawn': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'Cullinan': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'Spectre': { engineConfiguration: 'inline', cylinderCount: 0, forcedInduction: 'naturally_aspirated', exhaustNote: 'smooth_purr' },
  },
  Bentley: {
    'Continental GT': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'Continental GTC': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'Flying Spur': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'Bentayga': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
  },
  Maserati: {
    'MC20': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'GranTurismo': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'Quattroporte': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'Levante': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'Ghibli': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
    'Grecale': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
  },
  Nissan: {
    'GT-R': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
  },
  Volkswagen: {
    'Golf': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr' },
  },
  Honda: {
    'Civic': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
  },
  Hyundai: {
    'i30': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'i20': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'IONIQ 5': { engineConfiguration: 'inline', cylinderCount: 0, forcedInduction: 'naturally_aspirated', exhaustNote: 'smooth_purr' },
  },
  Toyota: {
    'Supra': { engineConfiguration: 'inline', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'Yaris': { engineConfiguration: 'inline', cylinderCount: 3, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
  },
  Lotus: {
    'Emira': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'supercharged', exhaustNote: 'aggressive_bark' },
    'Evora': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'supercharged', exhaustNote: 'aggressive_bark' },
    'Eletre': { engineConfiguration: 'inline', cylinderCount: 0, forcedInduction: 'naturally_aspirated', exhaustNote: 'smooth_purr' },
    'Emeya': { engineConfiguration: 'inline', cylinderCount: 0, forcedInduction: 'naturally_aspirated', exhaustNote: 'smooth_purr' },
    'Exige': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'supercharged', exhaustNote: 'high_pitched_scream' },
    'Elise': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'naturally_aspirated', exhaustNote: 'aggressive_bark' },
  },
  Bugatti: {
    'Chiron': { engineConfiguration: 'v-type', cylinderCount: 16, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
  },
  'Alfa Romeo': {
    'Giulia': { engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
  },
  Jaguar: {
    'F-Type': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'supercharged', exhaustNote: 'deep_rumble' },
  },
  Ford: {
    'Mustang': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'supercharged', exhaustNote: 'deep_rumble' },
    'Focus': { engineConfiguration: 'inline', cylinderCount: 4, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
  },
  Chevrolet: {
    'Corvette': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'naturally_aspirated', exhaustNote: 'deep_rumble' },
  },
  Dodge: {
    'Challenger': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'supercharged', exhaustNote: 'deep_rumble' },
  },
  Lexus: {
    'LC 500': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
    'LFA': { engineConfiguration: 'v-type', cylinderCount: 10, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream' },
  },
  'Aston Martin': {
    'DB12': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'DB11': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'DBS': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'Vantage': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark' },
    'Vanquish': { engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
    'DBX': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble' },
  },
  Koenigsegg: {
    'Jesko': { engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'high_pitched_scream' },
  },
};

/**
 * Look up engine profile for a make+model combination.
 * Uses partial matching for models.
 */
export function getEngineProfile(make: string, model: string): EngineProfile | null {
  const makeData = ENGINE_PROFILES[make];
  if (!makeData) return null;

  // Exact match first
  if (makeData[model]) return makeData[model];

  // Partial match
  for (const [key, profile] of Object.entries(makeData)) {
    if (model.includes(key) || key.includes(model)) return profile;
  }

  return null;
}
