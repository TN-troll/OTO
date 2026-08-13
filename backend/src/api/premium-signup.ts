import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';

export const premiumSignupRouter = Router();

/**
 * Simple email format validation regex.
 * Checks for: non-empty local part, @, domain with at least one dot.
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valid premium feature IDs */
const VALID_FEATURE_IDS = ['price_alerts', 'saved_searches', 'early_access'];

export interface PremiumSignupRequest {
  email: string;
  featureInterests: string[];
}

export interface PremiumSignupResponse {
  success: boolean;
  message?: string;
  errors?: string[];
}

/**
 * Validates the premium signup request data.
 * Returns an array of validation error messages, empty if valid.
 */
export function validatePremiumSignup(data: Partial<PremiumSignupRequest>): string[] {
  const errors: string[] = [];

  if (!data.email || data.email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.push('Email format is invalid');
  }

  if (!data.featureInterests || !Array.isArray(data.featureInterests)) {
    errors.push('Feature interests must be an array');
  } else if (data.featureInterests.length === 0) {
    errors.push('At least one feature interest is required');
  } else {
    const invalid = data.featureInterests.filter((f) => !VALID_FEATURE_IDS.includes(f));
    if (invalid.length > 0) {
      errors.push(`Invalid feature interests: ${invalid.join(', ')}`);
    }
  }

  return errors;
}

/**
 * POST /api/premium-signup
 *
 * Handles premium membership interest signups.
 * - Validates email (required, valid format) and featureInterests (non-empty array of valid IDs)
 * - Upserts into premium_signups table (on conflict email, updates feature_interests)
 * - Returns success response
 */
premiumSignupRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body as Partial<PremiumSignupRequest>;

    // Validate input
    const errors = validatePremiumSignup(data);
    if (errors.length > 0) {
      res.status(400).json({ success: false, errors });
      return;
    }

    const { email, featureInterests } = data as PremiumSignupRequest;

    // Upsert: insert or update feature_interests on duplicate email
    await query(
      `INSERT INTO premium_signups (email, feature_interests)
       VALUES ($1, $2)
       ON CONFLICT (email)
       DO UPDATE SET feature_interests = $2`,
      [email.trim().toLowerCase(), featureInterests],
    );

    res.json({
      success: true,
      message: 'Successfully signed up for premium updates',
    });
  } catch (err) {
    console.error('Error processing premium signup:', err);
    res.status(500).json({ success: false, errors: ['Internal server error'] });
  }
});
