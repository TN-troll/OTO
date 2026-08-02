/**
 * In-memory mock data for development without PostgreSQL/Redis.
 * Provides realistic sample listings for the Exclusive Car Ads Aggregator.
 */

export interface MockListing {
  id: string;
  title: string;
  price: number;
  mileage: number | null;
  year: number;
  make: string;
  model: string;
  engineDisplacementCc: number | null;
  horsepower: number | null;
  location: string | null;
  sellerType: string | null;
  transmissionType: string | null;
  fuelType: string | null;
  imageUrls: string[];
  soundProfileId: string | null;
  status: 'active' | 'inactive';
  curationCriteria: string[];
  dateAdded: string;
  lastVerified: string;
  sourceUrls: { marketplace: string; url: string; externalId: string; lastChecked: string; isActive: boolean }[];
  soundProfile: {
    id: string;
    engineConfiguration: string;
    cylinderCount: number;
    forcedInduction: string;
    exhaustNote: string;
    audioClipUrl: string | null;
    audioClipDurationSeconds: number | null;
  } | null;
}

export const MOCK_LISTINGS: MockListing[] = [
  {
    id: '1a2b3c4d-0001-4000-8000-000000000001',
    title: 'Ferrari 488 GTB 3.9 V8 Twin-Turbo',
    price: 189900,
    mileage: 24500,
    year: 2017,
    make: 'Ferrari',
    model: '488 GTB',
    engineDisplacementCc: 3902,
    horsepower: 670,
    location: 'Amsterdam',
    sellerType: 'dealer',
    transmissionType: 'automatic',
    fuelType: 'petrol',
    imageUrls: [
      'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600',
      'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600',
    ],
    soundProfileId: 'sp-001',
    status: 'active',
    curationCriteria: ['hp_above_300', 'luxury_brand_match'],
    dateAdded: '2024-11-15T10:30:00Z',
    lastVerified: '2024-12-01T08:00:00Z',
    sourceUrls: [{ marketplace: 'autotrack', url: 'https://www.autotrack.nl/auto/ferrari/488-gtb/12345', externalId: 'AT-12345', lastChecked: '2024-12-01T08:00:00Z', isActive: true }],
    soundProfile: { id: 'sp-001', engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble', audioClipUrl: null, audioClipDurationSeconds: null },
  },
  {
    id: '1a2b3c4d-0002-4000-8000-000000000002',
    title: 'Lamborghini Huracán EVO 5.2 V10',
    price: 279000,
    mileage: 12000,
    year: 2020,
    make: 'Lamborghini',
    model: 'Huracán EVO',
    engineDisplacementCc: 5204,
    horsepower: 640,
    location: 'Rotterdam',
    sellerType: 'dealer',
    transmissionType: 'automatic',
    fuelType: 'petrol',
    imageUrls: [
      'https://images.unsplash.com/photo-1621135802920-133df287f89c?w=600',
      'https://images.unsplash.com/photo-1580414057403-c5f451f30e1c?w=600',
    ],
    soundProfileId: 'sp-002',
    status: 'active',
    curationCriteria: ['hp_above_300', 'luxury_brand_match'],
    dateAdded: '2024-11-20T14:00:00Z',
    lastVerified: '2024-12-01T09:30:00Z',
    sourceUrls: [{ marketplace: 'autoscout24', url: 'https://www.autoscout24.nl/aanbod/lamborghini-huracan-evo/67890', externalId: 'AS-67890', lastChecked: '2024-12-01T09:30:00Z', isActive: true }],
    soundProfile: { id: 'sp-002', engineConfiguration: 'v-type', cylinderCount: 10, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream', audioClipUrl: null, audioClipDurationSeconds: null },
  },
  {
    id: '1a2b3c4d-0003-4000-8000-000000000003',
    title: 'Porsche 911 GT3 4.0 Flat-6',
    price: 219500,
    mileage: 8200,
    year: 2022,
    make: 'Porsche',
    model: '911 GT3',
    engineDisplacementCc: 3996,
    horsepower: 510,
    location: 'Den Haag',
    sellerType: 'dealer',
    transmissionType: 'manual',
    fuelType: 'petrol',
    imageUrls: [
      'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600',
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600',
    ],
    soundProfileId: 'sp-003',
    status: 'active',
    curationCriteria: ['hp_above_300', 'exclusive_model_match'],
    dateAdded: '2024-10-05T09:00:00Z',
    lastVerified: '2024-12-01T07:15:00Z',
    sourceUrls: [{ marketplace: 'autotrack', url: 'https://www.autotrack.nl/auto/porsche/911-gt3/33333', externalId: 'AT-33333', lastChecked: '2024-12-01T07:15:00Z', isActive: true }],
    soundProfile: { id: 'sp-003', engineConfiguration: 'flat', cylinderCount: 6, forcedInduction: 'naturally_aspirated', exhaustNote: 'deep_rumble', audioClipUrl: null, audioClipDurationSeconds: null },
  },
  {
    id: '1a2b3c4d-0004-4000-8000-000000000004',
    title: 'BMW M5 CS 4.4 V8 Twin-Turbo',
    price: 145000,
    mileage: 18500,
    year: 2022,
    make: 'BMW',
    model: 'M5 CS',
    engineDisplacementCc: 4395,
    horsepower: 635,
    location: 'Utrecht',
    sellerType: 'private',
    transmissionType: 'automatic',
    fuelType: 'petrol',
    imageUrls: [
      'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600',
    ],
    soundProfileId: 'sp-004',
    status: 'active',
    curationCriteria: ['hp_above_300', 'exclusive_model_match'],
    dateAdded: '2024-09-28T16:45:00Z',
    lastVerified: '2024-12-01T10:00:00Z',
    sourceUrls: [{ marketplace: 'marktplaats', url: 'https://www.marktplaats.nl/auto/bmw/m5-cs/44444', externalId: 'MP-44444', lastChecked: '2024-12-01T10:00:00Z', isActive: true }],
    soundProfile: { id: 'sp-004', engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark', audioClipUrl: null, audioClipDurationSeconds: null },
  },
  {
    id: '1a2b3c4d-0005-4000-8000-000000000005',
    title: 'Mercedes-AMG GT Black Series 4.0 V8',
    price: 395000,
    mileage: 3200,
    year: 2021,
    make: 'Mercedes-Benz',
    model: 'AMG GT Black Series',
    engineDisplacementCc: 3982,
    horsepower: 730,
    location: 'Eindhoven',
    sellerType: 'dealer',
    transmissionType: 'automatic',
    fuelType: 'petrol',
    imageUrls: [
      'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=600',
    ],
    soundProfileId: 'sp-005',
    status: 'active',
    curationCriteria: ['hp_above_300', 'exclusive_model_match'],
    dateAdded: '2024-12-01T11:00:00Z',
    lastVerified: '2024-12-01T11:00:00Z',
    sourceUrls: [{ marketplace: 'autoscout24', url: 'https://www.autoscout24.nl/aanbod/mercedes-amg-gt-black-series/55555', externalId: 'AS-55555', lastChecked: '2024-12-01T11:00:00Z', isActive: true }],
    soundProfile: { id: 'sp-005', engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark', audioClipUrl: null, audioClipDurationSeconds: null },
  },
  {
    id: '1a2b3c4d-0006-4000-8000-000000000006',
    title: 'McLaren 720S 4.0 V8 Twin-Turbo',
    price: 225000,
    mileage: 9800,
    year: 2019,
    make: 'McLaren',
    model: '720S',
    engineDisplacementCc: 3994,
    horsepower: 720,
    location: 'Amsterdam',
    sellerType: 'dealer',
    transmissionType: 'automatic',
    fuelType: 'petrol',
    imageUrls: [
      'https://images.unsplash.com/photo-1600712242805-5f78671b24da?w=600',
    ],
    soundProfileId: 'sp-006',
    status: 'active',
    curationCriteria: ['hp_above_300', 'luxury_brand_match'],
    dateAdded: '2024-08-15T13:30:00Z',
    lastVerified: '2024-12-01T06:00:00Z',
    sourceUrls: [{ marketplace: 'autotrack', url: 'https://www.autotrack.nl/auto/mclaren/720s/66666', externalId: 'AT-66666', lastChecked: '2024-12-01T06:00:00Z', isActive: true }],
    soundProfile: { id: 'sp-006', engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'high_pitched_scream', audioClipUrl: null, audioClipDurationSeconds: null },
  },
  {
    id: '1a2b3c4d-0007-4000-8000-000000000007',
    title: 'Aston Martin Vantage V8',
    price: 159000,
    mileage: 21000,
    year: 2020,
    make: 'Aston Martin',
    model: 'Vantage',
    engineDisplacementCc: 3982,
    horsepower: 510,
    location: 'Groningen',
    sellerType: 'dealer',
    transmissionType: 'automatic',
    fuelType: 'petrol',
    imageUrls: [
      'https://images.unsplash.com/photo-1596994836226-ad4e3ff6a73c?w=600',
    ],
    soundProfileId: 'sp-007',
    status: 'active',
    curationCriteria: ['hp_above_300', 'luxury_brand_match'],
    dateAdded: '2024-07-20T10:00:00Z',
    lastVerified: '2024-12-01T05:30:00Z',
    sourceUrls: [{ marketplace: 'autoscout24', url: 'https://www.autoscout24.nl/aanbod/aston-martin-vantage/77777', externalId: 'AS-77777', lastChecked: '2024-12-01T05:30:00Z', isActive: true }],
    soundProfile: { id: 'sp-007', engineConfiguration: 'v-type', cylinderCount: 8, forcedInduction: 'turbocharged', exhaustNote: 'deep_rumble', audioClipUrl: null, audioClipDurationSeconds: null },
  },
  {
    id: '1a2b3c4d-0008-4000-8000-000000000008',
    title: 'Nissan GT-R Nismo 3.8 V6 Twin-Turbo',
    price: 175000,
    mileage: 15500,
    year: 2021,
    make: 'Nissan',
    model: 'GT-R Nismo',
    engineDisplacementCc: 3799,
    horsepower: 600,
    location: 'Breda',
    sellerType: 'private',
    transmissionType: 'automatic',
    fuelType: 'petrol',
    imageUrls: [
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600',
    ],
    soundProfileId: 'sp-008',
    status: 'active',
    curationCriteria: ['hp_above_300', 'exclusive_model_match'],
    dateAdded: '2024-06-10T08:00:00Z',
    lastVerified: '2024-12-01T04:00:00Z',
    sourceUrls: [{ marketplace: 'marktplaats', url: 'https://www.marktplaats.nl/auto/nissan/gt-r-nismo/88888', externalId: 'MP-88888', lastChecked: '2024-12-01T04:00:00Z', isActive: true }],
    soundProfile: { id: 'sp-008', engineConfiguration: 'v-type', cylinderCount: 6, forcedInduction: 'turbocharged', exhaustNote: 'aggressive_bark', audioClipUrl: null, audioClipDurationSeconds: null },
  },
  {
    id: '1a2b3c4d-0009-4000-8000-000000000009',
    title: 'Bentley Continental GT W12 6.0',
    price: 185000,
    mileage: 32000,
    year: 2019,
    make: 'Bentley',
    model: 'Continental GT',
    engineDisplacementCc: 5998,
    horsepower: 635,
    location: 'Maastricht',
    sellerType: 'dealer',
    transmissionType: 'automatic',
    fuelType: 'petrol',
    imageUrls: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?w=600',
    ],
    soundProfileId: 'sp-009',
    status: 'active',
    curationCriteria: ['hp_above_300', 'luxury_brand_match'],
    dateAdded: '2024-05-01T12:00:00Z',
    lastVerified: '2024-12-01T03:00:00Z',
    sourceUrls: [{ marketplace: 'autotrack', url: 'https://www.autotrack.nl/auto/bentley/continental-gt/99999', externalId: 'AT-99999', lastChecked: '2024-12-01T03:00:00Z', isActive: true }],
    soundProfile: { id: 'sp-009', engineConfiguration: 'v-type', cylinderCount: 12, forcedInduction: 'turbocharged', exhaustNote: 'smooth_purr', audioClipUrl: null, audioClipDurationSeconds: null },
  },
  {
    id: '1a2b3c4d-0010-4000-8000-000000000010',
    title: 'Audi R8 V10 Performance 5.2 FSI',
    price: 198000,
    mileage: 19000,
    year: 2020,
    make: 'Audi',
    model: 'R8 V10 Performance',
    engineDisplacementCc: 5204,
    horsepower: 620,
    location: 'Tilburg',
    sellerType: 'dealer',
    transmissionType: 'automatic',
    fuelType: 'petrol',
    imageUrls: [
      'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600',
      'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600',
    ],
    soundProfileId: 'sp-010',
    status: 'active',
    curationCriteria: ['hp_above_300', 'exclusive_model_match'],
    dateAdded: '2024-04-20T15:00:00Z',
    lastVerified: '2024-12-01T02:00:00Z',
    sourceUrls: [{ marketplace: 'autoscout24', url: 'https://www.autoscout24.nl/aanbod/audi-r8-v10-performance/10101', externalId: 'AS-10101', lastChecked: '2024-12-01T02:00:00Z', isActive: true }],
    soundProfile: { id: 'sp-010', engineConfiguration: 'v-type', cylinderCount: 10, forcedInduction: 'naturally_aspirated', exhaustNote: 'high_pitched_scream', audioClipUrl: null, audioClipDurationSeconds: null },
  },
];
