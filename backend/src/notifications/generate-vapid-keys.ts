/**
 * Utility script to generate VAPID key pair for Web Push authentication.
 *
 * Usage: npx tsx src/notifications/generate-vapid-keys.ts
 *
 * Copy the output values into your environment variables:
 *   VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 *   VAPID_SUBJECT=mailto:your-email@example.com
 */
import webPush from 'web-push';

const vapidKeys = webPush.generateVAPIDKeys();

console.log('VAPID Key Pair Generated:');
console.log('========================');
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
console.log('');
console.log('Add these to your environment variables (.env file or Railway settings).');
console.log('Also set: VAPID_SUBJECT=mailto:admin@oto-occasions.nl');
