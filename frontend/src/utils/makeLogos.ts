/**
 * Maps car manufacturer names to their logo image URLs.
 * Uses the free carlogos.org CDN for SVG logos.
 * Falls back to null for unknown makes.
 */
const MAKE_LOGO_MAP: Record<string, string> = {
  'BMW': 'https://www.carlogos.org/car-logos/bmw-logo.png',
  'Mercedes-Benz': 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png',
  'Audi': 'https://www.carlogos.org/car-logos/audi-logo.png',
  'Porsche': 'https://www.carlogos.org/car-logos/porsche-logo.png',
  'Ferrari': 'https://www.carlogos.org/car-logos/ferrari-logo.png',
  'Lamborghini': 'https://www.carlogos.org/car-logos/lamborghini-logo.png',
  'McLaren': 'https://www.carlogos.org/car-logos/mclaren-logo.png',
  'Rolls-Royce': 'https://www.carlogos.org/car-logos/rolls-royce-logo.png',
  'Bentley': 'https://www.carlogos.org/car-logos/bentley-logo.png',
  'Aston Martin': 'https://www.carlogos.org/car-logos/aston-martin-logo.png',
  'Maserati': 'https://www.carlogos.org/car-logos/maserati-logo.png',
  'Volkswagen': 'https://www.carlogos.org/car-logos/volkswagen-logo.png',
  'Toyota': 'https://www.carlogos.org/car-logos/toyota-logo.png',
  'Nissan': 'https://www.carlogos.org/car-logos/nissan-logo.png',
  'Jaguar': 'https://www.carlogos.org/car-logos/jaguar-logo.png',
  'Land Rover': 'https://www.carlogos.org/car-logos/land-rover-logo.png',
  'Lotus': 'https://www.carlogos.org/car-logos/lotus-logo.png',
  'Bugatti': 'https://www.carlogos.org/car-logos/bugatti-logo.png',
  'Pagani': 'https://www.carlogos.org/car-logos/pagani-logo.png',
  'Koenigsegg': 'https://www.carlogos.org/car-logos/koenigsegg-logo.png',
  'Tesla': 'https://www.carlogos.org/car-logos/tesla-logo.png',
  'Alfa Romeo': 'https://www.carlogos.org/car-logos/alfa-romeo-logo.png',
  'MINI': 'https://www.carlogos.org/car-logos/mini-logo.png',
  'Lexus': 'https://www.carlogos.org/car-logos/lexus-logo.png',
  'Honda': 'https://www.carlogos.org/car-logos/honda-logo.png',
  'Ford': 'https://www.carlogos.org/car-logos/ford-logo.png',
  'Chevrolet': 'https://www.carlogos.org/car-logos/chevrolet-logo.png',
  'Dodge': 'https://www.carlogos.org/car-logos/dodge-logo.png',
  'Hyundai': 'https://www.carlogos.org/car-logos/hyundai-logo.png',
  'Volvo': 'https://www.carlogos.org/car-logos/volvo-logo.png',
  'Peugeot': 'https://www.carlogos.org/car-logos/peugeot-logo.png',
  'Renault': 'https://www.carlogos.org/car-logos/renault-logo.png',
  'CUPRA': 'https://www.carlogos.org/car-logos/cupra-logo.png',
  'Genesis': 'https://www.carlogos.org/car-logos/genesis-logo.png',
  'Polestar': 'https://www.carlogos.org/car-logos/polestar-logo.png',
};

/**
 * Get the logo URL for a car make.
 * Returns null for unknown makes.
 */
export function getMakeLogo(make: string): string | null {
  return MAKE_LOGO_MAP[make] ?? null;
}
