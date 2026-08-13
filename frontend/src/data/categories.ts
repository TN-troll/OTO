/**
 * Vehicle categories for OTO — defines which makes/models belong to each segment.
 * Used for quick-filter buttons and for the scraper to know what to fetch.
 */

export interface CategoryFilter {
  makes?: string[];
  models?: string[];
}

export interface Category {
  id: string;
  label: string;
  labelNl: string;
  emoji: string;
  filter: CategoryFilter;
}

export const CATEGORIES: Category[] = [
  {
    id: 'supercar',
    label: 'Supercars',
    labelNl: 'Supercars',
    emoji: '🏎️',
    filter: {
      makes: ['Ferrari', 'Lamborghini', 'McLaren', 'Bugatti', 'Pagani', 'Koenigsegg'],
    },
  },
  {
    id: 'luxury',
    label: 'Luxury',
    labelNl: 'Luxe',
    emoji: '👑',
    filter: {
      makes: ['Rolls-Royce', 'Bentley', 'Aston Martin', 'Maserati'],
    },
  },
  {
    id: 'performance-sedan',
    label: 'Performance Sedans',
    labelNl: 'Performance Sedans',
    emoji: '💨',
    filter: {
      makes: ['BMW', 'Mercedes-Benz', 'Audi', 'Alfa Romeo'],
      models: ['M3', 'M5', 'M8', 'AMG GT', 'RS6', 'RS7', 'Giulia', 'S 63 AMG', 'RS3', 'RS5'],
    },
  },
  {
    id: 'hot-hatch',
    label: 'Hot Hatches',
    labelNl: 'Hot Hatches',
    emoji: '🔥',
    filter: {
      makes: ['Volkswagen', 'Honda', 'Hyundai', 'Toyota', 'Ford', 'Mini', 'Renault', 'Peugeot', 'Audi', 'Mercedes-Benz', 'BMW'],
      models: ['Golf GTI', 'Golf R', 'Civic Type R', 'i30 N', 'i20 N', 'Ioniq 5 N', 'Ioniq 6 N', 'GR Yaris', 'GR Corolla', 'Focus ST', 'Focus RS', 'Fiesta ST', 'Cooper S', 'JCW', 'Megane RS', 'Mégane RS', '308 GTi', 'A 45 AMG', 'A45', 'CLA 45', 'RS3', 'S3', 'M135i', 'M235i', '128ti'],
    },
  },
  {
    id: 'sports-car',
    label: 'Sports Cars',
    labelNl: 'Sportwagens',
    emoji: '🏁',
    filter: {
      makes: ['Porsche', 'Lotus', 'Jaguar', 'Nissan', 'Toyota', 'Chevrolet', 'Dodge'],
      models: ['911', 'Cayman', '718', 'Boxster', 'Emira', 'Evora', 'F-Type', 'GT-R', 'Supra', 'Corvette', 'Challenger'],
    },
  },
  {
    id: 'suv',
    label: 'Performance SUVs',
    labelNl: 'Performance SUVs',
    emoji: '🏔️',
    filter: {
      makes: ['Porsche', 'Lamborghini', 'Bentley', 'Aston Martin', 'Maserati', 'BMW', 'Mercedes-Benz', 'Audi'],
      models: ['Cayenne', 'Urus', 'Bentayga', 'DBX', 'Levante', 'Grecale', 'X5 M', 'X6 M', 'GLE', 'G 63 AMG', 'G 500', 'G 650', 'RSQ8'],
    },
  },
  {
    id: 'electric',
    label: 'Electric Performance',
    labelNl: 'Elektrisch',
    emoji: '⚡',
    filter: {
      makes: ['Porsche', 'Audi', 'Lotus', 'Mercedes-Benz', 'BMW', 'Hyundai'],
      models: ['Taycan', 'e-tron GT', 'Eletre', 'Emeya', 'EQS', 'EQE', 'i4 M50', 'iX M60', 'Ioniq 5 N', 'Ioniq 6 N'],
    },
  },
  {
    id: 'classic',
    label: 'Classics',
    labelNl: 'Klassiekers',
    emoji: '🕰️',
    filter: {
      // Classics are filtered by year, not make/model
      makes: [],
    },
  },
];
