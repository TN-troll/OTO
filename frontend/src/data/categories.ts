/**
 * Vehicle categories for OTO — defines which makes/models belong to each segment.
 * Models listed here must match EXACTLY what's stored in the database.
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
      // All models from these makes are supercars
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
      models: ['M3', 'M5', 'M8', 'AMG GT', 'AMG ONE', 'RS3', 'RS5', 'RS6', 'RS7', 'S 63 AMG', 'S 65 AMG', 'Giulia', 'Maybach S-Klasse', 'S 580', 'S 450', 'CLS', 'e-tron GT'],
    },
  },
  {
    id: 'hot-hatch',
    label: 'Hot Hatches',
    labelNl: 'Hot Hatches',
    emoji: '🔥',
    filter: {
      makes: ['Volkswagen', 'Honda', 'Hyundai', 'Toyota', 'Ford', 'MINI', 'Renault', 'Peugeot', 'CUPRA', 'SEAT'],
      models: ['Golf', 'Civic', 'i30', 'i20', 'Yaris', 'Focus', 'Cooper', 'Megane', '308', 'Leon', 'Formentor', 'A 35 AMG', 'A 45 AMG', 'CLA 45 AMG', 'S3'],
    },
  },
  {
    id: 'sports-car',
    label: 'Sports Cars',
    labelNl: 'Sportwagens',
    emoji: '🏁',
    filter: {
      makes: ['Porsche', 'Lotus', 'Jaguar', 'Nissan', 'Toyota', 'Chevrolet', 'Dodge', 'Lexus'],
      models: ['911', '991', '992', '997', '718', 'Carrera GT', 'Cayman', 'Boxster', 'Emira', 'Evora', 'Elise', 'Exige', 'F-Type', 'GT-R', 'Supra', 'Corvette', 'Challenger', 'LC 500', 'LC 500h', 'LFA', 'Z4', 'i4', 'M4'],
    },
  },
  {
    id: 'suv',
    label: 'Performance SUVs',
    labelNl: 'Performance SUVs',
    emoji: '🏔️',
    filter: {
      makes: ['Porsche', 'Lamborghini', 'Bentley', 'Aston Martin', 'Maserati', 'BMW', 'Mercedes-Benz', 'Audi'],
      models: ['Cayenne', 'Macan', 'Urus', 'Bentayga', 'DBX', 'Levante', 'Grecale', 'X3 M', 'X4 M', 'X5 M', 'X6 M', 'GLE 53 AMG', 'GLE 63 AMG', 'GLE 450', 'G 63 AMG', 'G 500', 'G 650', 'SQ7', 'SQ8', 'RSQ8'],
    },
  },
  {
    id: 'electric',
    label: 'Electric Performance',
    labelNl: 'Elektrisch',
    emoji: '⚡',
    filter: {
      makes: ['Porsche', 'Audi', 'Lotus', 'Mercedes-Benz', 'BMW', 'Hyundai'],
      models: ['Taycan', 'e-tron GT', 'Eletre', 'Emeya', 'EQS', 'i4', 'iX', 'IONIQ 5', 'Spectre'],
    },
  },
  {
    id: 'classic',
    label: 'Classics',
    labelNl: 'Klassiekers',
    emoji: '🕰️',
    filter: {
      makes: [],
    },
  },
];
