import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateContactForm, generateMailtoLink } from './contact.js';
import type { Request, Response } from 'express';

// Mock the database connection module
const mockQuery = vi.fn();
const mockQueryOne = vi.fn();
vi.mock('../db/connection.js', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  queryOne: (...args: unknown[]) => mockQueryOne(...args),
}));

describe('Contact Form', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockQueryOne.mockReset();
  });

  describe('validateContactForm', () => {
    it('should return no errors for valid input', () => {
      const errors = validateContactForm({
        name: 'John Doe',
        email: 'john@example.com',
        listingId: '123e4567-e89b-12d3-a456-426614174000',
        listingTitle: 'Porsche 911',
        listingPrice: 85000,
        sourceUrl: 'https://autoscout24.nl/listing/123',
      });
      expect(errors).toEqual([]);
    });

    it('should reject empty name', () => {
      const errors = validateContactForm({
        name: '',
        email: 'john@example.com',
        listingId: '123',
      });
      expect(errors).toContain('Name is required');
    });

    it('should reject missing name', () => {
      const errors = validateContactForm({
        email: 'john@example.com',
        listingId: '123',
      });
      expect(errors).toContain('Name is required');
    });

    it('should reject whitespace-only name', () => {
      const errors = validateContactForm({
        name: '   ',
        email: 'john@example.com',
        listingId: '123',
      });
      expect(errors).toContain('Name is required');
    });

    it('should reject empty email', () => {
      const errors = validateContactForm({
        name: 'John',
        email: '',
        listingId: '123',
      });
      expect(errors).toContain('Email is required');
    });

    it('should reject missing email', () => {
      const errors = validateContactForm({
        name: 'John',
        listingId: '123',
      });
      expect(errors).toContain('Email is required');
    });

    it('should reject invalid email format (no @)', () => {
      const errors = validateContactForm({
        name: 'John',
        email: 'notanemail',
        listingId: '123',
      });
      expect(errors).toContain('Email format is invalid');
    });

    it('should reject invalid email format (no domain)', () => {
      const errors = validateContactForm({
        name: 'John',
        email: 'user@',
        listingId: '123',
      });
      expect(errors).toContain('Email format is invalid');
    });

    it('should reject invalid email format (no TLD)', () => {
      const errors = validateContactForm({
        name: 'John',
        email: 'user@domain',
        listingId: '123',
      });
      expect(errors).toContain('Email format is invalid');
    });

    it('should reject missing listingId', () => {
      const errors = validateContactForm({
        name: 'John',
        email: 'john@example.com',
      });
      expect(errors).toContain('Listing ID is required');
    });

    it('should return multiple errors at once', () => {
      const errors = validateContactForm({});
      expect(errors).toContain('Name is required');
      expect(errors).toContain('Email is required');
      expect(errors).toContain('Listing ID is required');
    });

    it('should accept valid email with subdomain', () => {
      const errors = validateContactForm({
        name: 'John',
        email: 'user@mail.example.com',
        listingId: '123',
      });
      expect(errors).toEqual([]);
    });

    it('should accept submission without optional message', () => {
      const errors = validateContactForm({
        name: 'John',
        email: 'john@example.com',
        listingId: '123',
      });
      expect(errors).toEqual([]);
    });
  });

  describe('generateMailtoLink', () => {
    it('should generate a valid mailto link', () => {
      const link = generateMailtoLink(
        'dealer@cars.nl',
        'Porsche 911 Carrera',
        85000,
        'John Doe',
        'john@example.com',
      );

      expect(link).toContain('mailto:dealer@cars.nl');
      expect(link).toContain('subject=');
      expect(link).toContain('Porsche%20911%20Carrera');
      expect(link).toContain('body=');
      expect(link).toContain('john%40example.com');
    });

    it('should include message when provided', () => {
      const link = generateMailtoLink(
        'dealer@cars.nl',
        'BMW M3',
        65000,
        'Jane',
        'jane@example.com',
        'Is this still available?',
      );

      expect(link).toContain('Is%20this%20still%20available');
    });

    it('should not include message section when message is undefined', () => {
      const link = generateMailtoLink(
        'dealer@cars.nl',
        'BMW M3',
        65000,
        'Jane',
        'jane@example.com',
      );

      expect(link).not.toContain('Message');
    });
  });

  describe('POST /api/contact endpoint logic', () => {
    // These tests verify the database interaction logic
    // by testing the expected DB calls pattern

    it('should store inquiry with dealer email and return mailto link', async () => {
      // Import the router handler logic via a request-like test
      const { contactRouter } = await import('./contact.js');

      // Mock listing lookup - dealer email available
      mockQueryOne.mockResolvedValueOnce({ dealer_email: 'dealer@example.com' });
      // Mock INSERT into contact_inquiries
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      // Create a mock request/response
      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Is this available?',
          listingId: 'listing-123',
          listingTitle: 'Porsche 911',
          listingPrice: 85000,
          sourceUrl: 'https://autoscout24.nl/listing/123',
        },
      } as unknown as Request;

      let responseStatus = 200;
      let responseBody: unknown = null;
      const res = {
        status: (code: number) => {
          responseStatus = code;
          return res;
        },
        json: (body: unknown) => {
          responseBody = body;
        },
      } as unknown as Response;

      // Get the route handler
      const handler = (contactRouter.stack as any)[0].route.stack[0].handle;
      await handler(req, res, () => {});

      expect(responseBody).toMatchObject({
        success: true,
        fallbackUsed: false,
      });
      expect((responseBody as { mailtoLink: string }).mailtoLink).toContain('mailto:dealer@example.com');

      // Verify INSERT into contact_inquiries
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contact_inquiries'),
        ['listing-123', 'John Doe', 'john@example.com', 'Is this available?', 'dealer@example.com', false],
      );
    });

    it('should set fallback_used when no dealer email', async () => {
      const { contactRouter } = await import('./contact.js');

      // Mock listing lookup - no dealer email
      mockQueryOne.mockResolvedValueOnce({ dealer_email: null });
      // Mock INSERT into contact_inquiries
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          listingId: 'listing-123',
          listingTitle: 'Porsche 911',
          listingPrice: 85000,
          sourceUrl: 'https://autoscout24.nl/listing/123',
        },
      } as unknown as Request;

      let responseBody: unknown = null;
      const res = {
        status: () => res,
        json: (body: unknown) => {
          responseBody = body;
        },
      } as unknown as Response;

      const handler = (contactRouter.stack as any)[0].route.stack[0].handle;
      await handler(req, res, () => {});

      expect(responseBody).toMatchObject({
        success: true,
        fallbackUsed: true,
        fallbackUrl: 'https://autoscout24.nl/listing/123',
      });
      expect((responseBody as { mailtoLink?: string }).mailtoLink).toBeUndefined();

      // Verify INSERT with fallback_used = true
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contact_inquiries'),
        ['listing-123', 'John Doe', 'john@example.com', null, null, true],
      );
    });

    it('should return 400 for invalid input', async () => {
      const { contactRouter } = await import('./contact.js');

      const req = {
        body: {
          name: '',
          email: 'not-valid',
          listingId: '',
        },
      } as unknown as Request;

      let responseStatus = 200;
      let responseBody: unknown = null;
      const res = {
        status: (code: number) => {
          responseStatus = code;
          return res;
        },
        json: (body: unknown) => {
          responseBody = body;
        },
      } as unknown as Response;

      const handler = (contactRouter.stack as any)[0].route.stack[0].handle;
      await handler(req, res, () => {});

      expect(responseStatus).toBe(400);
      expect(responseBody).toMatchObject({
        success: false,
      });
      expect((responseBody as { errors: string[] }).errors.length).toBeGreaterThan(0);
    });

    it('should return 404 when listing is not found', async () => {
      const { contactRouter } = await import('./contact.js');

      // Mock listing lookup - not found
      mockQueryOne.mockResolvedValueOnce(null);

      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          listingId: 'nonexistent-listing',
          listingTitle: 'Unknown Car',
          listingPrice: 50000,
          sourceUrl: 'https://autoscout24.nl/listing/unknown',
        },
      } as unknown as Request;

      let responseStatus = 200;
      let responseBody: unknown = null;
      const res = {
        status: (code: number) => {
          responseStatus = code;
          return res;
        },
        json: (body: unknown) => {
          responseBody = body;
        },
      } as unknown as Response;

      const handler = (contactRouter.stack as any)[0].route.stack[0].handle;
      await handler(req, res, () => {});

      expect(responseStatus).toBe(404);
      expect(responseBody).toMatchObject({
        success: false,
        errors: ['Listing not found'],
      });
    });

    it('should look up source_references when no sourceUrl provided and no dealer email', async () => {
      const { contactRouter } = await import('./contact.js');

      // Mock listing lookup - no dealer email
      mockQueryOne
        .mockResolvedValueOnce({ dealer_email: null })
        // Mock source_references lookup
        .mockResolvedValueOnce({ url: 'https://autoscout24.nl/from-db' });
      // Mock INSERT into contact_inquiries
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      const req = {
        body: {
          name: 'John Doe',
          email: 'john@example.com',
          listingId: 'listing-123',
          listingTitle: 'BMW M3',
          listingPrice: 65000,
          sourceUrl: '', // empty sourceUrl
        },
      } as unknown as Request;

      let responseBody: unknown = null;
      const res = {
        status: () => res,
        json: (body: unknown) => {
          responseBody = body;
        },
      } as unknown as Response;

      const handler = (contactRouter.stack as any)[0].route.stack[0].handle;
      await handler(req, res, () => {});

      expect(responseBody).toMatchObject({
        success: true,
        fallbackUsed: true,
        fallbackUrl: 'https://autoscout24.nl/from-db',
      });
    });
  });
});
