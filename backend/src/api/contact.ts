import { Router, Request, Response } from 'express';
import { query, queryOne } from '../db/connection.js';

export const contactRouter = Router();

/**
 * Simple email format validation regex.
 * Checks for: non-empty local part, @, domain with at least one dot.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ContactFormData {
  name: string;
  email: string;
  message?: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  sourceUrl: string;
}

export interface ContactInquiry {
  id: string;
  listingId: string;
  senderName: string;
  senderEmail: string;
  message: string | null;
  dealerEmail: string | null;
  fallbackUsed: boolean;
  createdAt: Date;
}

/**
 * Validates the contact form submission data.
 * Returns an array of validation error messages, empty if valid.
 */
export function validateContactForm(data: Partial<ContactFormData>): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!data.email || data.email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.push('Email format is invalid');
  }

  if (!data.listingId) {
    errors.push('Listing ID is required');
  }

  return errors;
}

/**
 * Generates a mailto link for contacting a dealer about a listing.
 */
export function generateMailtoLink(
  dealerEmail: string,
  listingTitle: string,
  listingPrice: number,
  senderName: string,
  senderEmail: string,
  message?: string,
): string {
  const subject = encodeURIComponent(`Inquiry about: ${listingTitle}`);
  const bodyParts = [
    `Hello,`,
    ``,
    `I am interested in the ${listingTitle} listed at €${listingPrice.toLocaleString('nl-NL')}.`,
    ``,
  ];

  if (message) {
    bodyParts.push(`Message: ${message}`, ``);
  }

  bodyParts.push(
    `Contact me at: ${senderEmail}`,
    `Name: ${senderName}`,
  );

  const body = encodeURIComponent(bodyParts.join('\n'));
  return `mailto:${dealerEmail}?subject=${subject}&body=${body}`;
}

/**
 * POST /api/contact
 *
 * Handles dealer contact form submissions.
 * - Validates name (required) and email (required, valid format)
 * - Looks up dealer email from the listing
 * - If dealer email exists: generates mailto link
 * - If no dealer email: sets fallback_used = true, returns sourceUrl
 * - Stores inquiry in contact_inquiries table
 */
contactRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Partial<ContactFormData>;

    // Validate input
    const errors = validateContactForm(data);
    if (errors.length > 0) {
      res.status(400).json({ success: false, errors });
      return;
    }

    const { name, email, message, listingId, listingTitle, listingPrice, sourceUrl } = data as ContactFormData;

    // Look up dealer email from the listing
    const listing = await queryOne<{ dealer_email: string | null }>(
      `SELECT dealer_email FROM listings WHERE id = $1`,
      [listingId],
    );

    if (!listing) {
      res.status(404).json({ success: false, errors: ['Listing not found'] });
      return;
    }

    const dealerEmail = listing.dealer_email;
    const fallbackUsed = !dealerEmail;

    let mailtoLink: string | undefined;
    let fallbackUrl: string | undefined;

    if (dealerEmail) {
      // Generate mailto link for the dealer
      mailtoLink = generateMailtoLink(
        dealerEmail,
        listingTitle || '',
        listingPrice || 0,
        name.trim(),
        email.trim(),
        message,
      );
    } else {
      // Fallback: use the AutoScout24 listing URL
      fallbackUrl = sourceUrl || undefined;

      // If no sourceUrl was provided in the request, try to look it up
      if (!fallbackUrl) {
        const sourceRef = await queryOne<{ url: string }>(
          `SELECT url FROM source_references
           WHERE listing_id = $1 AND is_active = TRUE
           ORDER BY last_checked DESC
           LIMIT 1`,
          [listingId],
        );
        fallbackUrl = sourceRef?.url || undefined;
      }
    }

    // Store inquiry in contact_inquiries table for analytics
    await query(
      `INSERT INTO contact_inquiries (listing_id, sender_name, sender_email, message, dealer_email, fallback_used)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [listingId, name.trim(), email.trim(), message || null, dealerEmail, fallbackUsed],
    );

    res.json({
      success: true,
      mailtoLink,
      fallbackUrl,
      fallbackUsed,
    });
  } catch (err) {
    console.error('Error processing contact form:', err);
    res.status(500).json({ success: false, errors: ['Internal server error'] });
  }
});
