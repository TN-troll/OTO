import { useState } from 'react';

interface DealerContactFormProps {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  sourceUrl: string;
  onClose: () => void;
}

interface FormState {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';

/**
 * Dealer Contact Form component.
 * Displays a modal form pre-filled with listing context, validates name/email client-side,
 * and submits to POST /api/contact. Handles dealer email and fallback (opens AutoScout24).
 *
 * Validates: Requirements 5.1, 5.2
 */
export function DealerContactForm({
  listingId,
  listingTitle,
  listingPrice,
  sourceUrl,
  onClose,
}: DealerContactFormProps) {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitStatus('submitting');
    setSubmitError(null);

    try {
      const response = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          message: form.message.trim() || undefined,
          listingId,
          listingTitle,
          listingPrice,
          sourceUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0] || 'Failed to send inquiry');
      }

      // If fallback is used (no dealer email), open AutoScout24 in a new tab
      if (data.fallbackUsed && data.fallbackUrl) {
        window.open(data.fallbackUrl, '_blank', 'noopener,noreferrer');
      }

      // If a mailto link is available, open it
      if (data.mailtoLink) {
        window.location.href = data.mailtoLink;
      }

      setSubmitStatus('success');
    } catch (err) {
      setSubmitStatus('error');
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    }
  }

  function handleInputChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for the field being edited
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  // Success state
  if (submitStatus === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <div
          className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-surface-800"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-surface-900 dark:text-white">Inquiry Sent!</h3>
            <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
              Your inquiry about this listing has been submitted successfully.
            </p>
            <button
              onClick={onClose}
              className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-surface-800"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="contact-form-title"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 id="contact-form-title" className="text-lg font-bold text-surface-900 dark:text-white">
            Request Info
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-300"
            aria-label="Close contact form"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Listing context (pre-filled) */}
        <div className="mt-4 rounded-lg bg-surface-50 p-3 dark:bg-surface-700">
          <p className="text-sm font-medium text-surface-900 dark:text-white">{listingTitle}</p>
          <p className="mt-0.5 text-sm font-bold text-brand dark:text-brand-accent">
            €{Math.round(listingPrice).toLocaleString('nl-NL')}
          </p>
          <p className="mt-1 truncate text-xs text-surface-400 dark:text-surface-500">{sourceUrl}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
          {/* Name field */}
          <div>
            <label htmlFor="contact-name" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              value={form.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Your full name"
              className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900 placeholder-surface-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent dark:bg-surface-700 dark:text-white dark:placeholder-surface-500 ${
                errors.name
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200 dark:border-red-600'
                  : 'border-surface-200 focus:border-brand-accent dark:border-surface-600'
              }`}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'contact-name-error' : undefined}
            />
            {errors.name && (
              <p id="contact-name-error" className="mt-1 text-xs text-red-500" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email field */}
          <div>
            <label htmlFor="contact-email" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="your@email.com"
              className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm text-surface-900 placeholder-surface-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent dark:bg-surface-700 dark:text-white dark:placeholder-surface-500 ${
                errors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200 dark:border-red-600'
                  : 'border-surface-200 focus:border-brand-accent dark:border-surface-600'
              }`}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
            />
            {errors.email && (
              <p id="contact-email-error" className="mt-1 text-xs text-red-500" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          {/* Message field (optional) */}
          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium text-surface-700 dark:text-surface-300">
              Message <span className="text-xs text-surface-400 dark:text-surface-500">(optional)</span>
            </label>
            <textarea
              id="contact-message"
              value={form.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Any additional questions or comments..."
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-surface-200 px-3 py-2.5 text-sm text-surface-900 placeholder-surface-400 transition-colors focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent dark:border-surface-600 dark:bg-surface-700 dark:text-white dark:placeholder-surface-500"
            />
          </div>

          {/* Submit error */}
          {submitStatus === 'error' && submitError && (
            <div className="rounded-lg bg-red-50 p-3 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-400">{submitError}</p>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitStatus === 'submitting'}
            className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitStatus === 'submitting' ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Sending...
              </span>
            ) : (
              'Send Inquiry'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
