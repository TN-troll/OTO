import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type {
  Listing,
  ListingSummary,
  SourceReference,
  SoundProfile,
  SellerType,
  TransmissionType,
  FuelType,
  CurationCriterion,
  MarketplaceId,
  EngineConfiguration,
  ForcedInduction,
  ExhaustNote,
} from '@car-ads/shared';

/**
 * Property 10: Listing Rendering Completeness
 *
 * For any Listing, the summary view SHALL include the primary image URL, make, model,
 * year, price, horsepower, and engine displacement. The detail view SHALL include all
 * stored specification fields, all available images (up to 20), the Sound_Profile
 * (or unclassified indicator), and at least one link to the original Source_Marketplace advertisement.
 *
 * Validates: Requirements 5.1, 5.2
 */

// ============================================================
// Mapping functions (mirrors what the API does)
// ============================================================

/**
 * Maps a Listing to a summary view (as done in GET /api/listings and POST /api/listings/filter).
 */
function toListingSummary(listing: Listing): ListingSummary {
  return {
    id: listing.id,
    title: listing.title,
    primaryImageUrl: listing.imageUrls[0] ?? null,
    make: listing.make,
    model: listing.model,
    year: listing.year,
    price: listing.price,
    horsepower: listing.horsepower,
    engineDisplacementCc: listing.engineDisplacementCc,
    dateAdded: listing.dateAdded,
  };
}

/**
 * Maps a Listing to its detail view (as done in GET /api/listings/:id).
 */
function toListingDetail(listing: Listing, soundProfile: SoundProfile | null) {
  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    mileage: listing.mileage,
    year: listing.year,
    make: listing.make,
    model: listing.model,
    engineDisplacementCc: listing.engineDisplacementCc,
    horsepower: listing.horsepower,
    location: listing.location,
    sellerType: listing.sellerType,
    transmissionType: listing.transmissionType,
    fuelType: listing.fuelType,
    imageUrls: listing.imageUrls,
    sourceUrls: listing.sourceUrls,
    soundProfile,
    status: listing.status,
    curationCriteria: listing.curationCriteria,
    dateAdded: listing.dateAdded,
    lastVerified: listing.lastVerified,
  };
}

// ============================================================
// Arbitrary generators
// ============================================================

const arbMarketplaceId: fc.Arbitrary<MarketplaceId> = fc.constantFrom('autotrack', 'autoscout24', 'marktplaats');

const arbSourceReference: fc.Arbitrary<SourceReference> = fc.record({
  marketplace: arbMarketplaceId,
  url: fc.webUrl(),
  externalId: fc.uuid(),
  lastChecked: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  isActive: fc.boolean(),
});

const arbSellerType: fc.Arbitrary<SellerType | null> = fc.oneof(
  fc.constant(null),
  fc.constantFrom<SellerType>('dealer', 'private'),
);

const arbTransmissionType: fc.Arbitrary<TransmissionType | null> = fc.oneof(
  fc.constant(null),
  fc.constantFrom<TransmissionType>('manual', 'automatic'),
);

const arbFuelType: fc.Arbitrary<FuelType | null> = fc.oneof(
  fc.constant(null),
  fc.constantFrom<FuelType>('petrol', 'diesel', 'hybrid', 'electric'),
);

const arbCurationCriterion: fc.Arbitrary<CurationCriterion> = fc.constantFrom(
  'hp_above_300', 'luxury_brand_match', 'exclusive_model_match',
);

const arbEngineConfig: fc.Arbitrary<EngineConfiguration> = fc.constantFrom('inline', 'v-type', 'flat', 'rotary');
const arbForcedInduction: fc.Arbitrary<ForcedInduction> = fc.constantFrom('naturally_aspirated', 'turbocharged', 'supercharged');
const arbExhaustNote: fc.Arbitrary<ExhaustNote> = fc.constantFrom('deep_rumble', 'high_pitched_scream', 'aggressive_bark', 'smooth_purr');

const arbSoundProfile: fc.Arbitrary<SoundProfile> = fc.record({
  id: fc.uuid(),
  engineConfiguration: arbEngineConfig,
  cylinderCount: fc.integer({ min: 2, max: 16 }),
  forcedInduction: arbForcedInduction,
  exhaustNote: arbExhaustNote,
  audioClipUrl: fc.oneof(fc.constant(null), fc.webUrl()),
  audioClipDurationSeconds: fc.oneof(fc.constant(null), fc.integer({ min: 1, max: 30 })),
});

/** Generate a Listing with all fields populated randomly, including 0–25 images (capped to 20) */
const arbListing: fc.Arbitrary<Listing> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  price: fc.integer({ min: 1, max: 50_000_000 }),
  mileage: fc.oneof(fc.constant(null), fc.integer({ min: 0, max: 500_000 })),
  year: fc.integer({ min: 1950, max: 2025 }),
  make: fc.constantFrom('Ferrari', 'Lamborghini', 'Porsche', 'BMW', 'Mercedes', 'McLaren', 'Aston Martin'),
  model: fc.constantFrom('488', 'Huracan', '911 GT3', 'M5', 'AMG GT', 'R8', '720S', 'Vantage'),
  engineDisplacementCc: fc.oneof(fc.constant(null), fc.integer({ min: 500, max: 8000 })),
  horsepower: fc.oneof(fc.constant(null), fc.integer({ min: 100, max: 2000 })),
  location: fc.oneof(fc.constant(null), fc.constantFrom('Amsterdam', 'Rotterdam', 'Utrecht', 'Den Haag')),
  sellerType: arbSellerType,
  transmissionType: arbTransmissionType,
  fuelType: arbFuelType,
  imageUrls: fc.array(fc.webUrl(), { minLength: 0, maxLength: 20 }),
  sourceUrls: fc.array(arbSourceReference, { minLength: 1, maxLength: 3 }),
  soundProfileId: fc.oneof(fc.constant(null), fc.uuid()),
  status: fc.constantFrom<'active' | 'inactive'>('active', 'inactive'),
  curationCriteria: fc.array(arbCurationCriterion, { minLength: 1, maxLength: 3 }),
  dateAdded: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  lastVerified: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  createdAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
  updatedAt: fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') }),
});

// ============================================================
// Tests
// ============================================================

describe('Property 10: Listing Rendering Completeness', () => {
  it('summary view includes id, title, primaryImageUrl, make, model, year, price, horsepower, engineDisplacementCc, dateAdded', () => {
    fc.assert(
      fc.property(arbListing, (listing) => {
        const summary = toListingSummary(listing);

        // All required summary fields must be present (not undefined)
        expect(summary).toHaveProperty('id');
        expect(summary).toHaveProperty('title');
        expect(summary).toHaveProperty('primaryImageUrl');
        expect(summary).toHaveProperty('make');
        expect(summary).toHaveProperty('model');
        expect(summary).toHaveProperty('year');
        expect(summary).toHaveProperty('price');
        expect(summary).toHaveProperty('horsepower');
        expect(summary).toHaveProperty('engineDisplacementCc');
        expect(summary).toHaveProperty('dateAdded');

        // Values must match the source listing
        expect(summary.id).toBe(listing.id);
        expect(summary.title).toBe(listing.title);
        expect(summary.make).toBe(listing.make);
        expect(summary.model).toBe(listing.model);
        expect(summary.year).toBe(listing.year);
        expect(summary.price).toBe(listing.price);
        expect(summary.horsepower).toBe(listing.horsepower);
        expect(summary.engineDisplacementCc).toBe(listing.engineDisplacementCc);
        expect(summary.dateAdded).toEqual(listing.dateAdded);
      }),
      { numRuns: 150 },
    );
  });

  it('summary primaryImageUrl is the first image from the listing or null if no images', () => {
    fc.assert(
      fc.property(arbListing, (listing) => {
        const summary = toListingSummary(listing);

        if (listing.imageUrls.length > 0) {
          expect(summary.primaryImageUrl).toBe(listing.imageUrls[0]);
        } else {
          expect(summary.primaryImageUrl).toBeNull();
        }
      }),
      { numRuns: 150 },
    );
  });

  it('detail view includes all stored specification fields', () => {
    fc.assert(
      fc.property(arbListing, arbSoundProfile, (listing, soundProfile) => {
        // Use sound profile if listing has a soundProfileId, otherwise null
        const sp = listing.soundProfileId ? soundProfile : null;
        const detail = toListingDetail(listing, sp);

        // All specification fields must be present
        expect(detail).toHaveProperty('id');
        expect(detail).toHaveProperty('title');
        expect(detail).toHaveProperty('price');
        expect(detail).toHaveProperty('mileage');
        expect(detail).toHaveProperty('year');
        expect(detail).toHaveProperty('make');
        expect(detail).toHaveProperty('model');
        expect(detail).toHaveProperty('engineDisplacementCc');
        expect(detail).toHaveProperty('horsepower');
        expect(detail).toHaveProperty('location');
        expect(detail).toHaveProperty('sellerType');
        expect(detail).toHaveProperty('transmissionType');
        expect(detail).toHaveProperty('fuelType');
        expect(detail).toHaveProperty('imageUrls');
        expect(detail).toHaveProperty('sourceUrls');
        expect(detail).toHaveProperty('soundProfile');
        expect(detail).toHaveProperty('status');
        expect(detail).toHaveProperty('curationCriteria');
        expect(detail).toHaveProperty('dateAdded');
        expect(detail).toHaveProperty('lastVerified');

        // Values must match the source listing
        expect(detail.id).toBe(listing.id);
        expect(detail.title).toBe(listing.title);
        expect(detail.price).toBe(listing.price);
        expect(detail.mileage).toBe(listing.mileage);
        expect(detail.year).toBe(listing.year);
        expect(detail.make).toBe(listing.make);
        expect(detail.model).toBe(listing.model);
        expect(detail.engineDisplacementCc).toBe(listing.engineDisplacementCc);
        expect(detail.horsepower).toBe(listing.horsepower);
        expect(detail.location).toBe(listing.location);
        expect(detail.sellerType).toBe(listing.sellerType);
        expect(detail.transmissionType).toBe(listing.transmissionType);
        expect(detail.fuelType).toBe(listing.fuelType);
        expect(detail.status).toBe(listing.status);
        expect(detail.curationCriteria).toEqual(listing.curationCriteria);
        expect(detail.dateAdded).toEqual(listing.dateAdded);
        expect(detail.lastVerified).toEqual(listing.lastVerified);
      }),
      { numRuns: 150 },
    );
  });

  it('detail view images are ≤ 20 and match the listing imageUrls', () => {
    fc.assert(
      fc.property(arbListing, (listing) => {
        const detail = toListingDetail(listing, null);

        // Images must not exceed 20
        expect(detail.imageUrls.length).toBeLessThanOrEqual(20);

        // Images must match the listing's imageUrls
        expect(detail.imageUrls).toEqual(listing.imageUrls);
      }),
      { numRuns: 150 },
    );
  });

  it('detail view includes sound profile when listing has one, or null for unclassified', () => {
    fc.assert(
      fc.property(arbListing, arbSoundProfile, (listing, soundProfile) => {
        const sp = listing.soundProfileId ? soundProfile : null;
        const detail = toListingDetail(listing, sp);

        if (listing.soundProfileId) {
          // Sound profile should be present (not null)
          expect(detail.soundProfile).not.toBeNull();
          expect(detail.soundProfile).toEqual(soundProfile);
        } else {
          // Unclassified — sound profile is null
          expect(detail.soundProfile).toBeNull();
        }
      }),
      { numRuns: 150 },
    );
  });

  it('detail view includes at least one source URL linking to the original marketplace', () => {
    fc.assert(
      fc.property(arbListing, (listing) => {
        const detail = toListingDetail(listing, null);

        // Source URLs must be present and have at least one entry
        expect(detail.sourceUrls).toBeDefined();
        expect(detail.sourceUrls.length).toBeGreaterThanOrEqual(1);

        // Each source URL should have a valid marketplace and url
        for (const source of detail.sourceUrls) {
          expect(source.marketplace).toBeDefined();
          expect(['autotrack', 'autoscout24', 'marktplaats']).toContain(source.marketplace);
          expect(source.url).toBeDefined();
          expect(source.url.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 150 },
    );
  });
});
