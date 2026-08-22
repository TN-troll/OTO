import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { createHash } from 'crypto';

export const authRouter = Router();

/**
 * POST /register
 * Link an email to a device token for cross-device sync.
 * Body: { email, deviceToken }
 */
authRouter.post('/register', async (req: Request, res: Response): Promise<void> => {
  const { email, deviceToken } = req.body;

  if (!email || !deviceToken) {
    res.status(400).json({ error: 'Missing email or deviceToken' });
    return;
  }

  // Simple email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  const emailHash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex');

  try {
    // Upsert: link device token to email
    await query(
      `INSERT INTO user_accounts (email_hash, email, device_token, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (email_hash) DO UPDATE SET device_token = $3, updated_at = NOW()`,
      [emailHash, email.toLowerCase().trim(), deviceToken]
    );

    res.json({ success: true, message: 'Account linked' });
  } catch (err) {
    console.error('[OTO] Auth register error:', err);
    res.status(500).json({ error: 'Failed to register' });
  }
});

/**
 * POST /sync
 * Get the device token associated with an email (for cross-device login).
 * Body: { email }
 * Returns the device token so the new device can sync favorites/compare.
 */
authRouter.post('/sync', async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Missing email' });
    return;
  }

  const emailHash = createHash('sha256').update(email.toLowerCase().trim()).digest('hex');

  try {
    const result = await query<{ device_token: string }>(
      `SELECT device_token FROM user_accounts WHERE email_hash = $1`,
      [emailHash]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    res.json({ deviceToken: result.rows[0].device_token });
  } catch (err) {
    console.error('[OTO] Auth sync error:', err);
    res.status(500).json({ error: 'Failed to sync' });
  }
});
