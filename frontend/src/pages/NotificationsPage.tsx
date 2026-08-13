import { NotificationPreferences } from '../components/NotificationPreferences';
import { isPushSupported } from '../hooks/usePushNotifications';

/**
 * Notifications settings page.
 * Requirement 4.5: If the browser does not support the Notification API,
 * the frontend hides all notification-related UI elements.
 */
export function NotificationsPage() {
  if (!isPushSupported()) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="rounded-xl bg-white p-8 text-center shadow-premium dark:bg-surface-800">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-100 dark:bg-surface-700">
            <svg className="h-6 w-6 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-surface-900 dark:text-white">
            Push Notifications Not Supported
          </h2>
          <p className="mt-2 text-sm text-surface-500 dark:text-surface-400">
            Your browser does not support push notifications. Try using a modern browser like Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    );
  }

  return <NotificationPreferences />;
}
