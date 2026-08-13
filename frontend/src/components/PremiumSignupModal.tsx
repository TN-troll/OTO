import { useState, useEffect } from 'react';
import { PREMIUM_FEATURES } from './PremiumSection';

interface PremiumSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PremiumSignupModal({ isOpen, onClose }: PremiumSignupModalProps) {
  const [email, setEmail] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId) ? prev.filter((f) => f !== featureId) : [...prev, featureId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/premium-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          featureInterests: selectedFeatures.length > 0 ? selectedFeatures : PREMIUM_FEATURES.map((f) => f.id),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setErrorMessage(data.errors?.join(', ') || 'Something went wrong');
        return;
      }

      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('Network error. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-surface-800">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 dark:hover:bg-surface-700 dark:hover:text-surface-200"
          aria-label="Close modal"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <svg className="h-7 w-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-bold text-surface-900 dark:text-white">
              You're on the list!
            </h3>
            <p className="text-sm text-surface-600 dark:text-surface-300">
              We'll notify you as soon as premium features become available.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 rounded-lg bg-surface-100 px-4 py-2 text-sm font-medium text-surface-700 transition-colors hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-200 dark:hover:bg-surface-600"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <h2 id="premium-modal-title" className="text-lg font-bold text-surface-900 dark:text-white">
                🚀 Premium — Coming Soon
              </h2>
              <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
                Sign up to be notified when premium features launch. Select the features you're most interested in.
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Email input */}
              <div className="mb-4">
                <label htmlFor="premium-email" className="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">
                  Email address
                </label>
                <input
                  id="premium-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-white dark:placeholder:text-surface-500 dark:focus:border-amber-400"
                />
              </div>

              {/* Feature interest selection */}
              <div className="mb-5">
                <p className="mb-2 text-sm font-medium text-surface-700 dark:text-surface-300">
                  I'm interested in: <span className="text-xs text-surface-400">(optional)</span>
                </p>
                <div className="space-y-2">
                  {PREMIUM_FEATURES.map((feature) => (
                    <label
                      key={feature.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
                        selectedFeatures.includes(feature.id)
                          ? 'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-900/20'
                          : 'border-surface-200 hover:border-surface-300 dark:border-surface-600 dark:hover:border-surface-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFeatures.includes(feature.id)}
                        onChange={() => toggleFeature(feature.id)}
                        className="h-4 w-4 rounded border-surface-300 text-amber-500 focus:ring-amber-500 dark:border-surface-600"
                      />
                      <div>
                        <span className="text-sm font-medium text-surface-900 dark:text-white">
                          {feature.title}
                        </span>
                        <p className="text-xs text-surface-500 dark:text-surface-400">
                          {feature.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Error display */}
              {status === 'error' && (
                <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {errorMessage}
                </p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-yellow-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition-all hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-surface-800"
              >
                {status === 'loading' ? 'Signing up...' : 'Notify Me'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
