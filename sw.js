const CACHE_NAME = 'kleymo-cache-v4';
const urlsToCache = [
  './',
  './index.html',
  './index.tsx',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Focus window on notification click
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('./');
    })
  );
});

// Periodic Sync (Simulation of backend enforcement)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-enforce') {
    // Show notification to remind property of its owner
    event.waitUntil(
      self.registration.showNotification('ВЕРНИСЬ К ХОЗЯИНУ', {
        body: 'Ты слишком долго отсутствовал. Штраф начисляется.',
        icon: './icon.png',
        tag: 'enforce'
      })
    );
  }
});