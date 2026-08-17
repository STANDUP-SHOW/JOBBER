// Web Push service worker — only handles push display + click-through.
// No offline caching/asset interception on purpose, so it can't ever cause
// stale content on the rest of the site.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let payload;
  try { payload = event.data.json(); } catch { payload = { title: 'Jobber+', body: event.data.text() }; }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Jobber+', {
      body: payload.body,
      data: { link: payload.link || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
