import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { validateContactForm } from './contact.js';
import type { ContactFormData } from './contact.js';

/**
 * Property 7: Contact Form Validation
 *
 * For any contact form submission, the system SHALL reject the submission if the name
 * field is empty or the email field is empty/invalid. For any submission with a valid
 * name and valid email, the system SHALL accept it regardless of whether the optional
 * message field is filled.
 *
 * **Validates: Requirements 5.2**
 */

// Arbitrary for valid non-empty name strings
const validNameArb = fc.string({ minLength: 1, maxLength: 200 }).filter(
  (s) => s.trim().length > 0
);

// Arbitrary for valid email addresses
const validEmailArb = fc
  .tuple(
    fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes('@') && !s.includes(' ') && s.length > 0),
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes('@') && !s.includes(' ') && !s.includes('.') && s.length > 0),
    fc.string({ minLength: 2, maxLength: 6 }).filter((s) => !s.includes('@') && !s.includes(' ') && !s.includes('.') && s.length >= 2)
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

// Arbitrary for invalid email addresses (missing @, missing dot, etc.)
const invalidEmailArb = fc.oneof(
  // No @ sign at all
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes('@') && s.trim().length > 0),
  // Nothing before @
  fc.string({ minLength: 1, maxLength: 20 }).map((s) => `@${s}.com`),
  // Nothing after @
  fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes('@')).map((s) => `${s}@`),
  // No dot in domain
  fc.tuple(
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes('@') && !s.includes(' ')),
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes('@') && !s.includes(' ') && !s.includes('.'))
  ).map(([local, domain]) => `${local}@${domain}`)
);

// Arbitrary for a valid listingId (non-empty UUID-like string)
const validListingIdArb = fc.uuid();

// Arbitrary for optional message field (can be undefined, empty, or filled)
const optionalMessageArb = fc.oneof(
  fc.constant(undefined),
  fc.constant(''),
  fc.string({ minLength: 1, maxLength: 500 })
);

describe('Property 7: Contact Form Validation', () => {
  it('should reject submissions with empty or missing name', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(''), fc.constant('   '), fc.constant(undefined)),
        validEmailArb,
        validListingIdArb,
        optionalMessageArb,
        (name, email, listingId, message) => {
          const data: Partial<ContactFormData> = {
            name: name as any,
            email,
            listingId,
            message,
            listingTitle: 'Test Listing',
            listingPrice: 50000,
            sourceUrl: 'https://example.com/listing',
          };

          const errors = validateContactForm(data);

          // Must produce at least one error related to name
          expect(errors.length).toBeGreaterThan(0);
          expect(errors.some((e) => e.toLowerCase().includes('name'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject submissions with empty or missing email', () => {
    fc.assert(
      fc.property(
        validNameArb,
        fc.oneof(fc.constant(''), fc.constant('   '), fc.constant(undefined)),
        validListingIdArb,
        optionalMessageArb,
        (name, email, listingId, message) => {
          const data: Partial<ContactFormData> = {
            name,
            email: email as any,
            listingId,
            message,
            listingTitle: 'Test Listing',
            listingPrice: 50000,
            sourceUrl: 'https://example.com/listing',
          };

          const errors = validateContactForm(data);

          // Must produce at least one error related to email
          expect(errors.length).toBeGreaterThan(0);
          expect(errors.some((e) => e.toLowerCase().includes('email'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject submissions with invalid email format', () => {
    fc.assert(
      fc.property(
        validNameArb,
        invalidEmailArb,
        validListingIdArb,
        optionalMessageArb,
        (name, email, listingId, message) => {
          const data: Partial<ContactFormData> = {
            name,
            email,
            listingId,
            message,
            listingTitle: 'Test Listing',
            listingPrice: 50000,
            sourceUrl: 'https://example.com/listing',
          };

          const errors = validateContactForm(data);

          // Must produce at least one error related to email
          expect(errors.length).toBeGreaterThan(0);
          expect(errors.some((e) => e.toLowerCase().includes('email'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept submissions with valid name, valid email, and any message (including empty/undefined)', () => {
    fc.assert(
      fc.property(
        validNameArb,
        validEmailArb,
        validListingIdArb,
        optionalMessageArb,
        (name, email, listingId, message) => {
          const data: Partial<ContactFormData> = {
            name,
            email,
            listingId,
            message,
            listingTitle: 'Test Listing',
            listingPrice: 50000,
            sourceUrl: 'https://example.com/listing',
          };

          const errors = validateContactForm(data);

          // Must produce zero errors
          expect(errors).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject submissions with missing listingId', () => {
    fc.assert(
      fc.property(
        validNameArb,
        validEmailArb,
        optionalMessageArb,
        (name, email, message) => {
          const data: Partial<ContactFormData> = {
            name,
            email,
            message,
            listingTitle: 'Test Listing',
            listingPrice: 50000,
            sourceUrl: 'https://example.com/listing',
            // listingId intentionally omitted
          };

          const errors = validateContactForm(data);

          // Must produce at least one error related to listing
          expect(errors.length).toBeGreaterThan(0);
          expect(errors.some((e) => e.toLowerCase().includes('listing'))).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
