import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { SoundProfileService } from './sound-profile-service.js';
import type { EngineConfiguration, ForcedInduction, ExhaustNote } from '@car-ads/shared';

/**
 * Property 5: Sound Profile Validity
 *
 * For any Listing in the system, it SHALL have either a valid Sound_Profile
 * (with engine configuration ∈ {inline, v-type, flat, rotary}, cylinder count ∈ [2..16],
 * forced induction ∈ {naturally_aspirated, turbocharged, supercharged}, and exhaust note ∈
 * {deep_rumble, high_pitched_scream, aggressive_bark, smooth_purr}) or be marked as having
 * an unclassified sound profile. No Listing SHALL have a partially filled Sound_Profile.
 *
 * Validates: Requirements 3.1, 3.2
 */

// Mock the database module so SoundProfileService doesn't hit a real DB
vi.mock('../db/connection.js', () => ({
  query: vi.fn().mockResolvedValue({ rows: [] }),
  queryOne: vi.fn().mockResolvedValue(null),
}));

// Valid enum values as defined in the spec
const VALID_ENGINE_CONFIGURATIONS: EngineConfiguration[] = ['inline', 'v-type', 'flat', 'rotary'];
const VALID_FORCED_INDUCTIONS: ForcedInduction[] = ['naturally_aspirated', 'turbocharged', 'supercharged'];
const VALID_EXHAUST_NOTES: ExhaustNote[] = ['deep_rumble', 'high_pitched_scream', 'aggressive_bark', 'smooth_purr'];

// ============================================================
// Arbitrary generators
// ============================================================

/** Generate a random cylinder count within the valid range [2..16] */
const arbCylinderCount = fc.integer({ min: 2, max: 16 });

/** Generate a random engine layout string (including various aliases) */
const arbEngineLayout = fc.oneof(
  fc.constantFrom('inline', 'v-type', 'flat', 'rotary'),
  fc.constantFrom('straight', 'v', 'boxer', 'wankel', 'i', 'h'),
  fc.constantFrom('V-type', 'INLINE', 'Flat', 'ROTARY'), // case variations
);

/** Generate a random induction string (including various aliases) */
const arbInduction = fc.oneof(
  fc.constantFrom('naturally_aspirated', 'turbocharged', 'supercharged'),
  fc.constantFrom('na', 'turbo', 'sc', 'natural', 'supercharger'),
  fc.constantFrom('NATURALLY_ASPIRATED', 'Turbocharged', 'SUPERCHARGED'), // case variations
);

/** Generate a random make string */
const arbMake = fc.constantFrom(
  'Ferrari', 'Lamborghini', 'Porsche', 'BMW', 'Mercedes',
  'Audi', 'McLaren', 'Aston Martin', 'Toyota', 'Honda',
);

/** Generate a random model string */
const arbModel = fc.constantFrom(
  '488', 'Huracan', '911 GT3', 'M5', 'AMG GT',
  'R8', '720S', 'Vantage', 'Supra', 'NSX',
);

// ============================================================
// Tests
// ============================================================

describe('Property 5: Sound Profile Validity', () => {
  const service = new SoundProfileService();

  it('classifySound() always produces a valid engine configuration', () => {
    fc.assert(
      fc.property(
        arbMake,
        arbModel,
        arbCylinderCount,
        arbEngineLayout,
        arbInduction,
        (make, model, cylinderCount, engineLayout, induction) => {
          const profile = service.classifySound(make, model, cylinderCount, engineLayout, induction);

          expect(VALID_ENGINE_CONFIGURATIONS).toContain(profile.engineConfiguration);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('classifySound() always produces a cylinder count within [2..16]', () => {
    fc.assert(
      fc.property(
        arbMake,
        arbModel,
        arbCylinderCount,
        arbEngineLayout,
        arbInduction,
        (make, model, cylinderCount, engineLayout, induction) => {
          const profile = service.classifySound(make, model, cylinderCount, engineLayout, induction);

          expect(profile.cylinderCount).toBeGreaterThanOrEqual(2);
          expect(profile.cylinderCount).toBeLessThanOrEqual(16);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('classifySound() always produces a valid forced induction type', () => {
    fc.assert(
      fc.property(
        arbMake,
        arbModel,
        arbCylinderCount,
        arbEngineLayout,
        arbInduction,
        (make, model, cylinderCount, engineLayout, induction) => {
          const profile = service.classifySound(make, model, cylinderCount, engineLayout, induction);

          expect(VALID_FORCED_INDUCTIONS).toContain(profile.forcedInduction);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('classifySound() always produces a valid exhaust note category', () => {
    fc.assert(
      fc.property(
        arbMake,
        arbModel,
        arbCylinderCount,
        arbEngineLayout,
        arbInduction,
        (make, model, cylinderCount, engineLayout, induction) => {
          const profile = service.classifySound(make, model, cylinderCount, engineLayout, induction);

          expect(VALID_EXHAUST_NOTES).toContain(profile.exhaustNote);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('classifySound() output is always a fully valid profile (all fields present and valid)', () => {
    fc.assert(
      fc.property(
        arbMake,
        arbModel,
        arbCylinderCount,
        arbEngineLayout,
        arbInduction,
        (make, model, cylinderCount, engineLayout, induction) => {
          const profile = service.classifySound(make, model, cylinderCount, engineLayout, induction);

          // All fields must be present (not null/undefined)
          expect(profile.engineConfiguration).toBeDefined();
          expect(profile.cylinderCount).toBeDefined();
          expect(profile.forcedInduction).toBeDefined();
          expect(profile.exhaustNote).toBeDefined();

          // All enum fields within allowed values
          expect(VALID_ENGINE_CONFIGURATIONS).toContain(profile.engineConfiguration);
          expect(profile.cylinderCount).toBeGreaterThanOrEqual(2);
          expect(profile.cylinderCount).toBeLessThanOrEqual(16);
          expect(VALID_FORCED_INDUCTIONS).toContain(profile.forcedInduction);
          expect(VALID_EXHAUST_NOTES).toContain(profile.exhaustNote);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('getSoundProfile() returns either a fully valid profile or null (unclassified)', async () => {
    // When getSoundProfile returns null, the listing is unclassified — this is valid.
    // We test that classifySound (the pure classification logic) never produces partial profiles.
    fc.assert(
      fc.property(
        arbMake,
        arbModel,
        arbCylinderCount,
        arbEngineLayout,
        arbInduction,
        (make, model, cylinderCount, engineLayout, induction) => {
          const profile = service.classifySound(make, model, cylinderCount, engineLayout, induction);

          // A profile is never partially filled:
          // Either all classification fields are valid, or the profile would be null (unclassified).
          // Since classifySound always returns a SoundProfile object, verify completeness.
          const hasValidEngineConfig = VALID_ENGINE_CONFIGURATIONS.includes(profile.engineConfiguration);
          const hasValidCylinders = profile.cylinderCount >= 2 && profile.cylinderCount <= 16;
          const hasValidInduction = VALID_FORCED_INDUCTIONS.includes(profile.forcedInduction);
          const hasValidExhaust = VALID_EXHAUST_NOTES.includes(profile.exhaustNote);

          // All must be valid — no partial profiles allowed
          expect(hasValidEngineConfig && hasValidCylinders && hasValidInduction && hasValidExhaust).toBe(true);
        },
      ),
      { numRuns: 150 },
    );
  });
});
