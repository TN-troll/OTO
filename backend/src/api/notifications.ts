import { Router, Request, Response } from 'express';
import { NotificationService } from '../notifications/notification-service.js';

export const notificationsRouter = Router();

const notificationService = new NotificationService();

/**
 * GET /api/notifications/vapid-public-key
 *
 * Returns the VAPID public key for client-side push subscription.
 */
notificationsRouter.get('/vapid-public-key', (_req: Request, res: Response): void => {
  const key = notificationService.getVapidPublicKey();
  if (!key) {
    res.status(503).json({ error: 'Push notifications are not configured' });
    return;
  }
  res.json({ publicKey: key });
});

/**
 * POST /api/notifications/subscribe
 *
 * Register a new push subscription with notification preferences.
 * Body: {
 *   subscription: { endpoint, keys: { p256dh, auth } },
 *   preferences: { makes: string[], maxPrice: number | null, frequency: 'immediate' | 'daily_digest' }
 * }
 */
notificationsRouter.post('/subscribe', async (req: Request, res: Response): Promise<void> => {
  try {
    const { subscription, preferences } = req.body;

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      res.status(400).json({ error: 'Invalid subscription. Required: endpoint, keys.p256dh, keys.auth' });
      return;
    }

    if (!preferences) {
      res.status(400).json({ error: 'Preferences are required' });
      return;
    }

    const validFrequencies = ['immediate', 'daily_digest'];
    if (preferences.frequency && !validFrequencies.includes(preferences.frequency)) {
      res.status(400).json({ error: 'Invalid frequency. Must be "immediate" or "daily_digest"' });
      return;
    }

    const normalizedPreferences = {
      makes: Array.isArray(preferences.makes) ? preferences.makes : [],
      maxPrice: preferences.maxPrice !== undefined ? preferences.maxPrice : null,
      frequency: preferences.frequency || 'immediate',
    };

    const subscriptionId = await notificationService.subscribe(subscription, normalizedPreferences);

    res.status(201).json({ subscriptionId });
  } catch (err) {
    console.error('Error subscribing to notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/notifications/unsubscribe/:id
 *
 * Remove a push subscription by ID.
 */
notificationsRouter.delete('/unsubscribe/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (!id) {
      res.status(400).json({ error: 'Subscription ID is required' });
      return;
    }

    await notificationService.unsubscribe(id);
    res.status(204).send();
  } catch (err) {
    console.error('Error unsubscribing from notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/notifications/preferences/:id
 *
 * Update notification preferences for an existing subscription.
 * Body: { makes: string[], maxPrice: number | null, frequency: 'immediate' | 'daily_digest' }
 */
notificationsRouter.put('/preferences/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const preferences = req.body;

    if (!id) {
      res.status(400).json({ error: 'Subscription ID is required' });
      return;
    }

    if (!preferences) {
      res.status(400).json({ error: 'Preferences are required' });
      return;
    }

    const validFrequencies = ['immediate', 'daily_digest'];
    if (preferences.frequency && !validFrequencies.includes(preferences.frequency)) {
      res.status(400).json({ error: 'Invalid frequency. Must be "immediate" or "daily_digest"' });
      return;
    }

    const normalizedPreferences = {
      makes: Array.isArray(preferences.makes) ? preferences.makes : [],
      maxPrice: preferences.maxPrice !== undefined ? preferences.maxPrice : null,
      frequency: preferences.frequency || 'immediate',
    };

    await notificationService.updatePreferences(id, normalizedPreferences);

    res.json({ success: true });
  } catch (err) {
    console.error('Error updating notification preferences:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/notifications/send-digest
 *
 * Trigger sending daily digest notifications. Typically called by a cron job.
 */
notificationsRouter.post('/send-digest', async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await notificationService.sendDigest();
    res.json(result);
  } catch (err) {
    console.error('Error sending digest notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export the service instance for use by other modules (e.g., scraper on new listing)
export { notificationService };
