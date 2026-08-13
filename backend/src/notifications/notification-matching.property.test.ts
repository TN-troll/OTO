import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { matchesPreferences } from './notification-service.js';

/**
 * Property 6: Notification Matching Logic
 *
 * For any new listing and for any push subscription with configured preferences
 * (makes filter and max price), the notification service SHALL send a notification
 * if and only if: (a) the listing's make is in the subscriber's makes list (or the
 * makes list is empty, meaning "all makes"), AND (b) the listing's price is at or
 * below the subscriber's max price threshold (or max price is null, meaning "no limit").
 *
 * Validates: Requirements 4.2, 4.4
 */

// ============================================================
// Generators
// ============================================================

/** Arbitrary car makes used in the platform */
const CAR_MAKES = [
  'Porsche', 'BMW', 'Mercedes-Benz', 'Audi', 'Ferrari',
  'Lamborghini', 'Maserati', 'Aston Martin', 'Bentley',
  'Rolls-Royce', 'Toyota', 'Honda', 'Mazda', 'McLaren',
  'Bugatti', 'Pagani', 'Koenigsegg',
];

/** Arbitrary car make from the known set */
const arbMake = fc.constantFrom(...CAR_MAKES);

/** Arbitrary listing price (positive) */
const arbPrice = fc.double({ min: 1000, max: 1_000_000, noNaN: true, noDefaultInfinity: true });

/** Arbitrary max price threshold (positive) */
const arbMaxPrice = fc.double({ min: 1000, max: 1_000_000, noNaN: true, noDefaultInfinity: true });

/** Arbitrary makes filter list (subset of known makes, possibly empty) */
const arbMakesList = fc.subarray(CAR_MAKES, { minLength: 0, maxLength: CAR_MAKES.length });

/** Arbitrary listing with make and price */
const arbListing = fc.record({
  make: arbMake,
  price: arbPrice,
});

/** Arbitrary subscription preferences */
const arbSubscription = fc.record({
  makes: arbMakesList,
  maxPrice: fc.oneof(fc.constant(null), arbMaxPrice),
});

// ============================================================
// Property tests
// ============================================================

describe('Property 6: Notification Matching Logic', () => {
  it('SHALL match when makes list is empty (all makes) and price is within limit', () => {
    fc.assert(
      fc.property(
        arbListing,
        arbMaxPrice,
        (listing, maxPrice) => {
          // Subscription with empty makes list (all makes) and price at or below maxPrice
          const adjustedListing = { ...listing, price: Math.min(listing.price, maxPrice) };
          const subscription = { makes: [], maxPrice };

          expect(matchesPreferences(adjustedListing, subscription)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('SHALL NOT match when make is not in a non-empty makes list', () => {
    fc.assert(
      fc.property(
        arbPrice,
        fc.constantFrom('Porsche', 'BMW', 'Audi'),
        fc.constantFrom('Ferrari', 'Lamborghini', 'Maserati'),
        (price, listingMake, subscriberMake) => {
          // Ensure listing make is different from subscriber's makes
          fc.pre(listingMake.toLowerCase() !== subscriberMake.toLowerCase());

          const listing = { make: listingMake, price };
          const subscription = { makes: [subscriberMake], maxPrice: null };

          expect(matchesPreferences(listing, subscription)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('SHALL NOT match when price exceeds maxPrice', () => {
    fc.assert(
      fc.property(
        arbMake,
        arbMaxPrice,
        fc.double({ min: 0.01, max: 500_000, noNaN: true, noDefaultInfinity: true }),
        (make, maxPrice, priceExcess) => {
          // Ensure listing price is strictly above maxPrice
          const listing = { make, price: maxPrice + priceExcess + 0.01 };
          const subscription = { makes: [], maxPrice };

          expect(matchesPreferences(listing, subscription)).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('SHALL match when maxPrice is null (no limit) and make matches', () => {
    fc.assert(
      fc.property(
        arbMake,
        arbPrice,
        (make, price) => {
          const listing = { make, price };
          // Subscription with matching make and no price limit
          const subscription = { makes: [make], maxPrice: null };

          expect(matchesPreferences(listing, subscription)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('SHALL perform case-insensitive make matching', () => {
    fc.assert(
      fc.property(
        arbMake,
        arbPrice,
        fc.constantFrom('upper', 'lower', 'mixed') as fc.Arbitrary<'upper' | 'lower' | 'mixed'>,
        (make, price, caseVariant) => {
          // Transform the make in the subscription to a different case
          let transformedMake: string;
          switch (caseVariant) {
            case 'upper':
              transformedMake = make.toUpperCase();
              break;
            case 'lower':
              transformedMake = make.toLowerCase();
              break;
            case 'mixed':
              transformedMake = make
                .split('')
                .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
                .join('');
              break;
          }

          const listing = { make, price };
          const subscription = { makes: [transformedMake], maxPrice: null };

          expect(matchesPreferences(listing, subscription)).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('SHALL match if and only if both make AND price conditions are satisfied', () => {
    /**
     * This is the comprehensive bi-conditional property:
     * matchesPreferences returns true ⟺
     *   (makes is empty OR listing.make ∈ makes, case-insensitive)
     *   AND (maxPrice is null OR listing.price ≤ maxPrice)
     */
    fc.assert(
      fc.property(
        arbListing,
        arbSubscription,
        (listing, subscription) => {
          const result = matchesPreferences(listing, subscription);

          const makeMatches =
            subscription.makes.length === 0 ||
            subscription.makes.some(
              (m) => m.toLowerCase() === listing.make.toLowerCase(),
            );

          const priceMatches =
            subscription.maxPrice === null || listing.price <= subscription.maxPrice;

          const expected = makeMatches && priceMatches;

          expect(result).toBe(expected);
        },
      ),
      { numRuns: 100 },
    );
  });
});
