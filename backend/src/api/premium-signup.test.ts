import { describe, it, expect } from 'vitest';
import { validatePremiumSignup } from './premium-signup.js';

describe('validatePremiumSignup', () => {
  it('returns no errors for valid input', () => {
    const errors = validatePremiumSignup({
      email: 'user@example.com',
      featureInterests: ['price_alerts'],
    });
    expect(errors).toEqual([]);
  });

  it('returns error when email is missing', () => {
    const errors = validatePremiumSignup({
      email: '',
      featureInterests: ['price_alerts'],
    });
    expect(errors).toContain('Email is required');
  });

  it('returns error when email is invalid format', () => {
    const errors = validatePremiumSignup({
      email: 'not-an-email',
      featureInterests: ['price_alerts'],
    });
    expect(errors).toContain('Email format is invalid');
  });

  it('returns error when featureInterests is not an array', () => {
    const errors = validatePremiumSignup({
      email: 'user@example.com',
      featureInterests: undefined as any,
    });
    expect(errors).toContain('Feature interests must be an array');
  });

  it('returns error when featureInterests is empty', () => {
    const errors = validatePremiumSignup({
      email: 'user@example.com',
      featureInterests: [],
    });
    expect(errors).toContain('At least one feature interest is required');
  });

  it('returns error for invalid feature IDs', () => {
    const errors = validatePremiumSignup({
      email: 'user@example.com',
      featureInterests: ['price_alerts', 'invalid_feature'],
    });
    expect(errors[0]).toContain('Invalid feature interests: invalid_feature');
  });

  it('accepts all valid feature IDs', () => {
    const errors = validatePremiumSignup({
      email: 'user@example.com',
      featureInterests: ['price_alerts', 'saved_searches', 'early_access'],
    });
    expect(errors).toEqual([]);
  });

  it('accepts email with various valid formats', () => {
    const validEmails = ['test@domain.com', 'user+tag@sub.domain.org', 'a@b.co'];
    for (const email of validEmails) {
      const errors = validatePremiumSignup({
        email,
        featureInterests: ['early_access'],
      });
      expect(errors).toEqual([]);
    }
  });
});
