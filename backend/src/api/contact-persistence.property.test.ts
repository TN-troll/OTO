import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import type { Request, Response } from 'express';

/**
 * Property 15: Contact Inquiry Persistence
 *
 * For any successfully validated contact form submission, the system SHALL create a
 * record in the contact_inquiries table containing the listing_id, sender name, sender
 * email, and message (if provided). If no dealer email is available, the `fallback_used`
 * flag SHALL be set to true.
 *
 * **Validates: Requirements 5.5**
 */

// ============================================================
// Mock setup
// ============================================================

const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

vi.mock('../config/env.js', () => ({
  env: {
    DATABASE_URL: 'postgresql://localhost:5432/car_ads_test',
    REDIS_URL: 'redis://localhost:6379',
    PORT: 3000,
    NODE_ENV: 'test',
  },
}));

import { contactRouter } from './contact.js';

// ============================================================
// Generators
// ============================================================

/** Arbitrary valid non-empty name strings (trimmed length > 0) */
const arbValidName = fc
  .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')), {
    minLength: 1,
    maxLength: 50,
  })
  .filter((s) => s.trim().length > 0);

/** Arbitrary valid email addresses */
const arbValidEmail = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
      minLength: 1,
      maxLength: 15,
    }),
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
      minLength: 1,
      maxLength: 10,
    }),
    fc.constantFrom('com', 'nl', 'org', 'net', 'io'),
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

/** Arbitrary valid listing ID (UUID format) */
const arbListingId = fc.uuid();

/** Arbitrary optional message: either a non-empty string or undefined/empty */
const arbOptionalMessage = fc.oneof(
  fc.constant(undefined),
  fc.constant(''),
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz .!?0123456789'.split('')), {
    minLength: 1,
    maxLength: 200,
  }),
);

/** Arbitrary dealer email (present) */
const arbDealerEmail = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), {
      minLength: 1,
      maxLength: 10,
    }),
    fc.constantFrom('dealer.com', 'cars.nl', 'auto.eu'),
  )
  .map(([local, domain]) => `${local}@${domain}`);

/** Arbitrary listing title */
const arbListingTitle = fc
  .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.split('')), {
    minLength: 1,
    maxLength: 50,
  })
  .filter((s) => s.trim().length > 0);

/** Arbitrary listing price */
const arbListingPrice = fc.integer({ min: 1000, max: 500000 });

/** Arbitrary source URL */
const arbSourceUrl = fc
  .stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')), {
    minLength: 3,
    maxLength: 30,
  })
  .map((slug) => `https://autoscout24.nl/listing/${slug}`);

// ============================================================
// Helper: execute the POST /api/contact handler
// ============================================================

async function executeContactHandler(body: Record<string, unknown>): Promise<{
  status: number;
  body: Record<string, unknown>;
}> {
  const req = { body } as unknown as Request;

  let responseStatus = 200;
  let responseBody: Record<string, unknown> = {};
  const res = {
    status: (code: number) => {
      responseStatus = code;
      return res;
    },
    json: (data: unknown) => {
      responseBody = data as Record<string, unknown>;
    },
  } as unknown as Response;

  const handler = (contactRouter.stack as any)[0].route.stack[0].handle;
  await handler(req, res, () => {});

  return { status: responseStatus, body: responseBody };
}

// ============================================================
// Property tests
// ============================================================

describe('Property 15: Contact Inquiry Persistence', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockQueryOne.mockReset();
  });

  it('every valid submission creates a record with correct listing_id, sender_name, sender_email, and message fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbValidName,
        arbValidEmail,
        arbListingId,
        arbOptionalMessage,
        arbDealerEmail,
        arbListingTitle,
        arbListingPrice,
        arbSourceUrl,
        async (name, email, listingId, message, dealerEmail, listingTitle, listingPrice, sourceUrl) => {
          mockQuery.mockReset();
          mockQueryOne.mockReset();

          // Mock listing lookup - dealer email available
          mockQueryOne.mockResolvedValueOnce({ dealer_email: dealerEmail });
          // Mock INSERT into contact_inquiries
          mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

          const result = await executeContactHandler({
            name,
            email,
            message,
            listingId,
            listingTitle,
            listingPrice,
            sourceUrl,
          });

          // Submission must succeed
          expect(result.body.success).toBe(true);

          // Verify a record was inserted into contact_inquiries
          expect(mockQuery).toHaveBeenCalledWith(
            expect.stringContaining('INSERT INTO contact_inquiries'),
            expect.arrayContaining([
              listingId,
              name.trim(),
              email.trim(),
            ]),
          );

          // Verify message is stored correctly (null if empty/undefined, value otherwise)
          const insertParams = mockQuery.mock.calls.find(
            (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO contact_inquiries'),
          );
          expect(insertParams).toBeDefined();
          const params = insertParams![1] as unknown[];

          // params: [listingId, name, email, message, dealerEmail, fallbackUsed]
          expect(params[0]).toBe(listingId);
          expect(params[1]).toBe(name.trim());
          expect(params[2]).toBe(email.trim());

          // Message should be stored as provided or null when empty/undefined
          const expectedMessage = message || null;
          expect(params[3]).toBe(expectedMessage);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when no dealer email is available, fallback_used flag SHALL be set to true', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbValidName,
        arbValidEmail,
        arbListingId,
        arbOptionalMessage,
        arbListingTitle,
        arbListingPrice,
        arbSourceUrl,
        async (name, email, listingId, message, listingTitle, listingPrice, sourceUrl) => {
          mockQuery.mockReset();
          mockQueryOne.mockReset();

          // Mock listing lookup - NO dealer email
          mockQueryOne.mockResolvedValueOnce({ dealer_email: null });
          // Mock INSERT into contact_inquiries
          mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

          const result = await executeContactHandler({
            name,
            email,
            message,
            listingId,
            listingTitle,
            listingPrice,
            sourceUrl,
          });

          // Submission must succeed
          expect(result.body.success).toBe(true);
          expect(result.body.fallbackUsed).toBe(true);

          // Verify the INSERT has fallback_used = true
          const insertParams = mockQuery.mock.calls.find(
            (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO contact_inquiries'),
          );
          expect(insertParams).toBeDefined();
          const params = insertParams![1] as unknown[];

          // params: [listingId, name, email, message, dealerEmail, fallbackUsed]
          expect(params[4]).toBeNull(); // dealer_email is null
          expect(params[5]).toBe(true); // fallback_used is true
        },
      ),
      { numRuns: 100 },
    );
  });

  it('message field is stored when provided and null when not provided', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbValidName,
        arbValidEmail,
        arbListingId,
        fc.oneof(
          // Case 1: message provided (non-empty string)
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz .!?'.split('')), {
            minLength: 1,
            maxLength: 200,
          }),
          // Case 2: message not provided (undefined or empty)
          fc.constant(undefined),
          fc.constant(''),
        ),
        arbDealerEmail,
        arbListingTitle,
        arbListingPrice,
        arbSourceUrl,
        async (name, email, listingId, message, dealerEmail, listingTitle, listingPrice, sourceUrl) => {
          mockQuery.mockReset();
          mockQueryOne.mockReset();

          // Mock listing lookup
          mockQueryOne.mockResolvedValueOnce({ dealer_email: dealerEmail });
          // Mock INSERT into contact_inquiries
          mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

          const result = await executeContactHandler({
            name,
            email,
            message,
            listingId,
            listingTitle,
            listingPrice,
            sourceUrl,
          });

          expect(result.body.success).toBe(true);

          // Find the INSERT call
          const insertParams = mockQuery.mock.calls.find(
            (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO contact_inquiries'),
          );
          expect(insertParams).toBeDefined();
          const params = insertParams![1] as unknown[];

          // params[3] is the message field
          if (message && message.length > 0) {
            // When message is provided, it should be stored as-is
            expect(params[3]).toBe(message);
          } else {
            // When message is undefined or empty, it should be stored as null
            expect(params[3]).toBeNull();
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('when dealer email IS available, fallback_used flag SHALL be set to false', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbValidName,
        arbValidEmail,
        arbListingId,
        arbOptionalMessage,
        arbDealerEmail,
        arbListingTitle,
        arbListingPrice,
        arbSourceUrl,
        async (name, email, listingId, message, dealerEmail, listingTitle, listingPrice, sourceUrl) => {
          mockQuery.mockReset();
          mockQueryOne.mockReset();

          // Mock listing lookup - dealer email IS available
          mockQueryOne.mockResolvedValueOnce({ dealer_email: dealerEmail });
          // Mock INSERT into contact_inquiries
          mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

          const result = await executeContactHandler({
            name,
            email,
            message,
            listingId,
            listingTitle,
            listingPrice,
            sourceUrl,
          });

          expect(result.body.success).toBe(true);
          expect(result.body.fallbackUsed).toBe(false);

          // Verify the INSERT has fallback_used = false and dealerEmail present
          const insertParams = mockQuery.mock.calls.find(
            (call) => typeof call[0] === 'string' && call[0].includes('INSERT INTO contact_inquiries'),
          );
          expect(insertParams).toBeDefined();
          const params = insertParams![1] as unknown[];

          // params: [listingId, name, email, message, dealerEmail, fallbackUsed]
          expect(params[4]).toBe(dealerEmail); // dealer_email is present
          expect(params[5]).toBe(false); // fallback_used is false
        },
      ),
      { numRuns: 100 },
    );
  });
});
