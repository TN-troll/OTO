import { useState, useEffect, useCallback } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL || '') + '/api';
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export interface NotificationPreferences {
  makes: string[];
  maxPrice: number | null;
  frequency: 'immediate' | 'daily_digest';
}

export type PushPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

/**
 * Converts a base64-encoded VAPID public key to a Uint8Array for use with pushManager.subscribe
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

/**
 * Check if browser supports push notifications
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Hook for managing push notification subscription and preferences.
 * Implements requirements 4.1, 4.3, 4.5, 4.6
 */
export function usePushNotifications() {
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    makes: [],
    maxPrice: null,
    frequency: 'immediate',
  });
  const [subscriptionId, setSubscriptionId] = useState<string | null>(
    () => localStorage.getItem('oto-push-subscription-id')
  );

  // Check support and current permission state
  useEffect(() => {
    if (!isPushSupported()) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as PushPermissionState);

    // Check if already subscribed
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
          }
        });
      });
    }

    // Load saved preferences from localStorage
    const savedPrefs = localStorage.getItem('oto-notification-preferences');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch {
        // ignore invalid stored data
      }
    }
  }, []);

  /**
   * Register service worker and subscribe to push notifications.
   * Requirement 4.1: register service worker and request Notification permission
   */
  const subscribe = useCallback(async (prefs?: NotificationPreferences): Promise<boolean> => {
    if (!isPushSupported() || !VAPID_PUBLIC_KEY) return false;

    setIsLoading(true);
    try {
      // Request notification permission
      const result = await Notification.requestPermission();
      setPermission(result as PushPermissionState);

      if (result !== 'granted') {
        setIsLoading(false);
        return false;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.register('/push-sw.js', {
        scope: '/',
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const subJson = subscription.toJSON();
      const prefsToSend = prefs || preferences;

      // Send subscription to backend
      const response = await fetch(`${API_BASE}/notifications/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh || '',
            auth: subJson.keys?.auth || '',
          },
          preferences: prefsToSend,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe on server');
      }

      const data = await response.json();
      const id = data.subscriptionId || data.id;

      setSubscriptionId(id);
      setIsSubscribed(true);
      setPreferences(prefsToSend);
      localStorage.setItem('oto-push-subscription-id', id);
      localStorage.setItem('oto-notification-preferences', JSON.stringify(prefsToSend));

      return true;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [preferences]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) return false;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
      }

      // Notify backend
      if (subscriptionId) {
        await fetch(`${API_BASE}/notifications/unsubscribe`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscriptionId }),
        });
      }

      setIsSubscribed(false);
      setSubscriptionId(null);
      localStorage.removeItem('oto-push-subscription-id');

      return true;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionId]);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(async (newPrefs: NotificationPreferences): Promise<boolean> => {
    setPreferences(newPrefs);
    localStorage.setItem('oto-notification-preferences', JSON.stringify(newPrefs));

    if (!isSubscribed || !subscriptionId) return true;

    try {
      const response = await fetch(`${API_BASE}/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          preferences: newPrefs,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to update preferences:', error);
      return false;
    }
  }, [isSubscribed, subscriptionId]);

  return {
    permission,
    isSubscribed,
    isLoading,
    preferences,
    subscribe,
    unsubscribe,
    updatePreferences,
    isSupported: isPushSupported(),
  };
}
