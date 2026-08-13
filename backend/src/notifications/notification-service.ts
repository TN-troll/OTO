import webPush, { PushSubscription as WebPushSubscription } from 'web-push';
import { query, queryOne } from '../db/connection.js';

export interface NotificationPreferences {
  makes: string[];
  maxPrice: number | null;
  frequency: 'immediate' | 'daily_digest';
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface Listing {
  id: string;
  title: string;
  price: number;
  make: string;
  model: string;
  imageUrls: string[];
  sourceUrl?: string;
}

export interface NotificationResult {
  sent: number;
  failed: number;
  errors: NotificationError[];
}

export interface NotificationError {
  subscriptionId: string;
  statusCode: number | null;
  message: string;
}

export interface DigestResult {
  subscribersNotified: number;
  listingsIncluded: number;
  errors: NotificationError[];
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
  makes: string[];
  max_price: string | null;
  frequency: string;
}

/**
 * Standalone matching logic for notification preferences.
 * Exported separately to enable property-based testing.
 *
 * Match conditions:
 * 1. Subscriber's makes list is empty (all makes) OR listing make is in the subscriber's makes list (case-insensitive)
 * 2. Subscriber's max_price is null (no limit) OR listing price ≤ max_price
 *
 * @param listing - The listing to check (make and price)
 * @param subscription - The subscriber preferences (makes filter and max price)
 * @returns true if the listing matches the subscription preferences
 */
export function matchesPreferences(
  listing: { make: string; price: number },
  subscription: { makes: string[]; maxPrice: number | null }
): boolean {
  const makeMatches =
    subscription.makes.length === 0 ||
    subscription.makes.some((m) => m.toLowerCase() === listing.make.toLowerCase());

  const priceMatches =
    subscription.maxPrice === null || listing.price <= subscription.maxPrice;

  return makeMatches && priceMatches;
}

/**
 * NotificationService manages push notification subscriptions and delivery.
 *
 * Matching logic:
 * - A subscriber is notified if the listing make is in their makes list (or makes list is empty = all makes)
 * - AND the listing price ≤ subscriber's max_price (or max_price is null = no limit)
 */
export class NotificationService {
  constructor() {
    this.configureVapid();
  }

  private configureVapid(): void {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@oto-occasions.nl';

    if (publicKey && privateKey) {
      webPush.setVapidDetails(subject, publicKey, privateKey);
    } else {
      console.warn('[NotificationService] VAPID keys not configured. Push notifications will not work.');
    }
  }

  /**
   * Subscribe a new push subscription with notification preferences.
   * Returns the subscription ID.
   */
  async subscribe(subscription: PushSubscriptionInput, preferences: NotificationPreferences): Promise<string> {
    const result = await queryOne<{ id: string }>(
      `INSERT INTO push_subscriptions (endpoint, p256dh_key, auth_key, makes, max_price, frequency)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (endpoint) DO UPDATE SET
         p256dh_key = EXCLUDED.p256dh_key,
         auth_key = EXCLUDED.auth_key,
         makes = EXCLUDED.makes,
         max_price = EXCLUDED.max_price,
         frequency = EXCLUDED.frequency,
         updated_at = NOW()
       RETURNING id`,
      [
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
        preferences.makes,
        preferences.maxPrice,
        preferences.frequency,
      ]
    );

    return result!.id;
  }

  /**
   * Remove a push subscription by ID.
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    await query('DELETE FROM push_subscriptions WHERE id = $1', [subscriptionId]);
  }

  /**
   * Update notification preferences for an existing subscription.
   */
  async updatePreferences(subscriptionId: string, preferences: NotificationPreferences): Promise<void> {
    await query(
      `UPDATE push_subscriptions
       SET makes = $1, max_price = $2, frequency = $3, updated_at = NOW()
       WHERE id = $4`,
      [preferences.makes, preferences.maxPrice, preferences.frequency, subscriptionId]
    );
  }

  /**
   * Determine if a listing matches a subscriber's preferences.
   * Delegates to the standalone exported matchesPreferences function.
   */
  matchesPreferences(
    listing: { make: string; price: number },
    subscription: { makes: string[]; maxPrice: number | null }
  ): boolean {
    return matchesPreferences(listing, subscription);
  }

  /**
   * Send push notifications to all matching subscribers for a new listing.
   * Only notifies subscribers with frequency = 'immediate'.
   */
  async notifyMatchingSubscribers(listing: Listing): Promise<NotificationResult> {
    const result: NotificationResult = { sent: 0, failed: 0, errors: [] };

    // Query all immediate subscribers
    const { rows } = await query<SubscriptionRow>(
      `SELECT id, endpoint, p256dh_key, auth_key, makes, max_price, frequency
       FROM push_subscriptions
       WHERE frequency = 'immediate'`
    );

    const payload = JSON.stringify({
      title: `New: ${listing.title}`,
      body: `€${listing.price.toLocaleString('nl-NL')} - ${listing.make} ${listing.model}`,
      icon: listing.imageUrls[0] || '/icons/car-icon.png',
      url: `/listing/${listing.id}`,
      listingId: listing.id,
    });

    for (const row of rows) {
      const maxPrice = row.max_price !== null ? parseFloat(row.max_price) : null;

      if (!this.matchesPreferences(listing, { makes: row.makes, maxPrice })) {
        continue;
      }

      const pushSubscription: WebPushSubscription = {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh_key,
          auth: row.auth_key,
        },
      };

      try {
        await webPush.sendNotification(pushSubscription, payload);
        result.sent++;
      } catch (err: any) {
        const statusCode = err.statusCode ?? null;

        if (statusCode === 410 || statusCode === 404) {
          // Subscription expired or no longer valid — remove it
          await this.removeExpiredSubscription(row.id);
        }

        result.failed++;
        result.errors.push({
          subscriptionId: row.id,
          statusCode,
          message: err.message || 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Send a daily digest notification to all subscribers with frequency = 'daily_digest'.
   * Collects listings added in the last 24 hours and notifies matching subscribers.
   */
  async sendDigest(): Promise<DigestResult> {
    const digestResult: DigestResult = { subscribersNotified: 0, listingsIncluded: 0, errors: [] };

    // Get listings added in the last 24 hours
    const { rows: listings } = await query<{
      id: string;
      title: string;
      price: string;
      make: string;
      model: string;
      image_urls: string[];
    }>(
      `SELECT id, title, price, make, model, image_urls
       FROM listings
       WHERE date_added >= NOW() - INTERVAL '24 hours'
         AND status = 'active'`
    );

    if (listings.length === 0) {
      return digestResult;
    }

    // Get all digest subscribers
    const { rows: subscribers } = await query<SubscriptionRow>(
      `SELECT id, endpoint, p256dh_key, auth_key, makes, max_price, frequency
       FROM push_subscriptions
       WHERE frequency = 'daily_digest'`
    );

    for (const subscriber of subscribers) {
      const maxPrice = subscriber.max_price !== null ? parseFloat(subscriber.max_price) : null;

      const matchingListings = listings.filter((listing) =>
        this.matchesPreferences(
          { make: listing.make, price: parseFloat(listing.price) },
          { makes: subscriber.makes, maxPrice }
        )
      );

      if (matchingListings.length === 0) {
        continue;
      }

      digestResult.listingsIncluded = Math.max(digestResult.listingsIncluded, matchingListings.length);

      const payload = JSON.stringify({
        title: `${matchingListings.length} new listing${matchingListings.length > 1 ? 's' : ''} today`,
        body: matchingListings
          .slice(0, 3)
          .map((l) => `${l.make} ${l.model} - €${parseFloat(l.price).toLocaleString('nl-NL')}`)
          .join('\n'),
        icon: '/icons/car-icon.png',
        url: '/',
      });

      const pushSubscription: WebPushSubscription = {
        endpoint: subscriber.endpoint,
        keys: {
          p256dh: subscriber.p256dh_key,
          auth: subscriber.auth_key,
        },
      };

      try {
        await webPush.sendNotification(pushSubscription, payload);
        digestResult.subscribersNotified++;
      } catch (err: any) {
        const statusCode = err.statusCode ?? null;

        if (statusCode === 410 || statusCode === 404) {
          await this.removeExpiredSubscription(subscriber.id);
        }

        digestResult.errors.push({
          subscriptionId: subscriber.id,
          statusCode,
          message: err.message || 'Unknown error',
        });
      }
    }

    return digestResult;
  }

  /**
   * Remove a subscription that has been reported as expired (410 from push service).
   */
  private async removeExpiredSubscription(subscriptionId: string): Promise<void> {
    await query('DELETE FROM push_subscriptions WHERE id = $1', [subscriptionId]);
    console.log(`[NotificationService] Removed expired subscription: ${subscriptionId}`);
  }

  /**
   * Get VAPID public key for client-side subscription.
   */
  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }
}
