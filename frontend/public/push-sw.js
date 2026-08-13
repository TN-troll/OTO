// Push Notification Service Worker for OTO
// Handles push events and notification click navigation

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'OTO', body: event.data.text() };
  }

  const { title, body, icon, badge, data } = payload;

  const options = {
    body: body || '',
    icon: icon || '/logo.svg',
    badge: badge || '/logo.svg',
    data: data || {},
    tag: data?.listingId ? `oto-listing-${data.listingId}` : 'oto-notification',
    renotify: true,
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title || 'OTO - New Listing', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { data } = event.notification;
  let targetUrl = '/';

  if (data && data.listingId) {
    targetUrl = `/listing/${data.listingId}`;
  } else if (data && data.url) {
    targetUrl = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to focus an existing window and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // No existing window, open a new one
      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
