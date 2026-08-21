/**
 * Vehicle categories for OTO — broad segment filters based on body type,
 * power output, and fuel type. No specific model restrictions — categories
 * capture everything that fits the segment profile.
 */

export interface CategoryFilter {
  makes?: string[];
  models?: string[];
  bodyType?: string[];
  fuelType?: string[];
  horsepowerMin?: number;
  transmissionType?: string[];
  yearMax?: number;
}

export interface Category {
  id: string;
  label: string;
  labelNl: string;
  filter: CategoryFilter;
}

export const CATEGORIES: Category[] = [
  {
    id: 'hypercar',
    label: 'Hypercars',
    labelNl: 'Hypercars',
    filter: {
      horsepowerMin: 800,
    },
  },
  {
    id: 'supercar',
    label: 'Supercars',
    labelNl: 'Supercars',
    filter: {
      bodyType: ['coupe', 'cabriolet'],
      horsepowerMin: 500,
    },
  },
  {
    id: 'luxury',
    label: 'Luxury',
    labelNl: 'Luxe',
    filter: {
      makes: ['Rolls-Royce', 'Bentley', 'Mercedes-Benz', 'BMW', 'Audi', 'Aston Martin', 'Maserati', 'Jaguar', 'Lexus', 'Genesis', 'Porsche'],
      bodyType: ['sedan'],
    },
  },
  {
    id: 'performance-sedan',
    label: 'Performance Sedans',
    labelNl: 'Performance Sedans',
    filter: {
      bodyType: ['sedan'],
      horsepowerMin: 300,
    },
  },
  {
    id: 'hot-hatch',
    label: 'Hot Hatches',
    labelNl: 'Hot Hatches',
    filter: {
      bodyType: ['hatchback', 'compact'],
    },
  },
  {
    id: 'sports-car',
    label: 'Sports Cars',
    labelNl: 'Sportwagens',
    filter: {
      bodyType: ['coupe', 'cabriolet', 'roadster'],
      horsepowerMin: 200,
    },
  },
  {
    id: 'suv',
    label: 'Performance SUVs',
    labelNl: 'Performance SUVs',
    filter: {
      bodyType: ['suv', 'offroad'],
      horsepowerMin: 300,
    },
  },
  {
    id: 'electric',
    label: 'Electric',
    labelNl: 'Elektrisch',
    filter: {
      fuelType: ['electric'],
    },
  },
  {
    id: 'classic',
    label: 'Classics',
    labelNl: 'Klassiekers',
    filter: {
      yearMax: 2000,
    },
  },
];
