import { useState, useEffect } from 'react';
import { usePushNotifications, isPushSupported } from '../hooks/usePushNotifications';
import type { NotificationPreferences as NotificationPrefs } from '../hooks/usePushNotifications';
import { api } from '../api/client';

/** Known car makes available in OTO for notification filter preferences */
const POPULAR_MAKES = [
  'Ferrari', 'Lamborghini', 'McLaren', 'Porsche', 'BMW',
  'Mercedes-Benz', 'Audi', 'Aston Martin', 'Bentley', 'Rolls-Royce',
  'Maserati', 'Jaguar', 'Lotus', 'Bugatti', 'Pagani',
  'Alfa Romeo', 'Nissan', 'Toyota', 'Lexus', 'Koenigsegg',
];

/**
 * Non-intrusive notification permission prompt banner.
 * Requirement 4.3: Display a non-intrusive prompt explaining the notification feature
 * while the user has not granted permission.
 */
export function NotificationPromptBanner() {
  const { permission, subscribe, isLoading } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      const wasDismissed = localStorage.getItem('oto-notification-prompt-dismissed');
      if (wasDismissed) setDismissed(true);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('oto-notification-prompt-dismissed', 'true');
    } catch {
      // Silently ignore
    }
  };

  const handleEnable = async () => {
    await subscribe();
  };

  // Determine visibility — never conditionally return null to avoid React hook issues
  const isVisible = isPushSupported() && permission !== 'granted' && permission !== 'denied' && !dismissed;

  if (!isVisible) {
    return <></>;
  }

  return (
    <div className="mx-auto mb-4 max-w-5xl animate-fade-in rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm dark:border-amber-800 dark:bg-amber-900/20">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">🔔</span>
          <div>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
              Get notified about new listings
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Receive alerts when cars matching your interests are added to OTO.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleEnable}
            disabled={isLoading}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
          >
            {isLoading ? 'Enabling...' : 'Enable'}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-lg p-1.5 text-amber-600 transition-colors hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-800/30"
            aria-label="Dismiss notification prompt"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Full notification preferences panel for the settings/notification page.
 * Implements requirements 4.1, 4.3, 4.5, 4.6
 */
export function NotificationPreferences() {
  const {
    permission,
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    isSupported,
  } = usePushNotifications();

  const [localPrefs, setLocalPrefs] = useState<NotificationPrefs>(preferences);
  const [availableMakes, setAvailableMakes] = useState<string[]>(POPULAR_MAKES);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Fetch available makes from API
  useEffect(() => {
    api.getFilterOptions().then((options) => {
      if (options.makes && options.makes.length > 0) {
        setAvailableMakes(options.makes.sort());
      }
    }).catch(() => {
      // fallback to POPULAR_MAKES
    });
  }, []);

  // Sync local prefs with hook prefs
  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  // Requirement 4.5: Hide all notification-related UI if browser doesn't support
  if (!isSupported) return null;

  const handleSubscribe = async () => {
    const success = await subscribe(localPrefs);
    if (success) {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleUnsubscribe = async () => {
    await unsubscribe();
  };

  const handleSavePreferences = async () => {
    setSaveStatus('saving');
    const success = await updatePreferences(localPrefs);
    setSaveStatus(success ? 'saved' : 'error');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const toggleMake = (make: string) => {
    setLocalPrefs((prev) => ({
      ...prev,
      makes: prev.makes.includes(make)
        ? prev.makes.filter((m) => m !== make)
        : [...prev.makes, make],
    }));
  };

  const handleMaxPriceChange = (value: string) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    setLocalPrefs((prev) => ({
      ...prev,
      maxPrice: numValue && !isNaN(numValue) ? numValue : null,
    }));
  };

  const handleFrequencyChange = (frequency: 'immediate' | 'daily_digest') => {
    setLocalPrefs((prev) => ({ ...prev, frequency }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-surface-900 dark:text-white">
          Push Notifications
        </h2>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Get notified when new cars matching your preferences are listed on OTO.
        </p>
      </div>

      {/* Permission denied notice */}
      {permission === 'denied' && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-900/20">
          <p className="text-sm text-red-700 dark:text-red-300">
            Notifications are blocked by your browser. Please update your browser notification settings for this site to enable push notifications.
          </p>
        </div>
      )}

      {/* Subscribe/Unsubscribe toggle */}
      <div className="flex items-center justify-between rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
        <div>
          <p className="text-sm font-medium text-surface-900 dark:text-white">
            {isSubscribed ? 'Notifications enabled' : 'Notifications disabled'}
          </p>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            {isSubscribed
              ? 'You will receive push notifications based on your preferences below.'
              : 'Enable push notifications to stay updated on new listings.'}
          </p>
        </div>
        <button
          type="button"
          onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
          disabled={isLoading || permission === 'denied'}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
            isSubscribed
              ? 'bg-surface-200 text-surface-700 hover:bg-surface-300 dark:bg-surface-700 dark:text-surface-200 dark:hover:bg-surface-600'
              : 'bg-brand-accent text-brand hover:bg-brand-accent/90'
          }`}
        >
          {isLoading ? 'Processing...' : isSubscribed ? 'Disable' : 'Enable Notifications'}
        </button>
      </div>

      {/* Preferences - only show when subscribed or about to subscribe */}
      <div className={`space-y-6 transition-opacity ${isSubscribed ? 'opacity-100' : 'opacity-60'}`}>
        {/* Make filters */}
        <div className="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
            Car Makes
          </h3>
          <p className="mb-3 text-xs text-surface-500 dark:text-surface-400">
            Select which makes you want to be notified about. Leave empty for all makes.
          </p>
          <div className="flex flex-wrap gap-2">
            {availableMakes.map((make) => (
              <button
                key={make}
                type="button"
                onClick={() => toggleMake(make)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  localPrefs.makes.includes(make)
                    ? 'bg-brand-accent text-brand'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-300 dark:hover:bg-surface-600'
                }`}
              >
                {make}
              </button>
            ))}
          </div>
          {localPrefs.makes.length === 0 && (
            <p className="mt-2 text-xs italic text-surface-400 dark:text-surface-500">
              All makes selected (no filter)
            </p>
          )}
        </div>

        {/* Max price */}
        <div className="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
            Maximum Price
          </h3>
          <p className="mb-3 text-xs text-surface-500 dark:text-surface-400">
            Only notify me about cars at or below this price. Leave empty for no limit.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-surface-500 dark:text-surface-400">€</span>
            <input
              type="number"
              value={localPrefs.maxPrice ?? ''}
              onChange={(e) => handleMaxPriceChange(e.target.value)}
              placeholder="No limit"
              min={0}
              step={5000}
              className="w-40 rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent dark:border-surface-600 dark:bg-surface-700 dark:text-white dark:placeholder:text-surface-500"
            />
          </div>
        </div>

        {/* Frequency */}
        <div className="rounded-lg border border-surface-200 bg-white p-4 dark:border-surface-700 dark:bg-surface-800">
          <h3 className="text-sm font-semibold text-surface-900 dark:text-white">
            Notification Frequency
          </h3>
          <p className="mb-3 text-xs text-surface-500 dark:text-surface-400">
            Choose how often you want to receive notifications.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleFrequencyChange('immediate')}
              className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                localPrefs.frequency === 'immediate'
                  ? 'border-brand-accent bg-amber-50 dark:bg-amber-900/20'
                  : 'border-surface-200 bg-white hover:border-surface-300 dark:border-surface-700 dark:bg-surface-800 dark:hover:border-surface-600'
              }`}
            >
              <p className="text-sm font-medium text-surface-900 dark:text-white">Immediate</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                Notify me as soon as a matching car is listed
              </p>
            </button>
            <button
              type="button"
              onClick={() => handleFrequencyChange('daily_digest')}
              className={`flex-1 rounded-lg border px-4 py-3 text-left transition-colors ${
                localPrefs.frequency === 'daily_digest'
                  ? 'border-brand-accent bg-amber-50 dark:bg-amber-900/20'
                  : 'border-surface-200 bg-white hover:border-surface-300 dark:border-surface-700 dark:bg-surface-800 dark:hover:border-surface-600'
              }`}
            >
              <p className="text-sm font-medium text-surface-900 dark:text-white">Daily Digest</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">
                One summary per day with all new matches
              </p>
            </button>
          </div>
        </div>

        {/* Save button */}
        {isSubscribed && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSavePreferences}
              disabled={saveStatus === 'saving'}
              className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-accent/90 disabled:opacity-50"
            >
              {saveStatus === 'saving' ? 'Saving...' : 'Save Preferences'}
            </button>
            {saveStatus === 'saved' && (
              <span className="text-sm text-green-600 dark:text-green-400">✓ Saved</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-sm text-red-600 dark:text-red-400">Failed to save. Try again.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
