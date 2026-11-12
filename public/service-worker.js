const CACHE_NAME = 'sanatanmarga-v5.0.2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Never cache development, Vite, HMR, or prebundled dependency assets
  if (
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/.vite/') ||
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('/@id/') ||
    url.pathname.includes('/src/') ||
    url.search.includes('v=') ||
    url.search.includes('t=') ||
    url.hostname === 'localhost' ||
    url.hostname === '127.0.0.1' ||
    url.hostname.includes('ais-dev-') ||
    url.pathname.endsWith('.ts') ||
    url.pathname.endsWith('.tsx')
  ) {
    return;
  }

  // Never cache live streaming endpoints or API/snapshot endpoints as cache-first
  if (
    (url.pathname.includes('/live/') && !url.pathname.endsWith('.json')) ||
    (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/notifications/')) ||
    url.pathname.startsWith('/snapshots/') ||
    url.pathname === '/manifest.json'
  ) {
    return;
  }

  // Network-first for notifications API with safe JSON fallback
  if (url.pathname.startsWith('/api/notifications/')) {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        return new Response(JSON.stringify({ success: true, items: [] }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached && !event.request.headers.get('accept')?.includes('text/html')) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const toCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, toCache);
        });
        return response;
      }).catch(async () => {
        if (cached) return cached;
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const indexFallback = (await caches.match('/')) || (await caches.match('/index.html'));
          if (indexFallback) return indexFallback;
        }
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});

// Generic Push Event Listener
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const payload = event.data.json();
    const title = payload.title || 'SanatanMarga 5.0';
    const canonicalUrl = payload.canonicalUrl || payload.url || payload.link || '/target-unavailable?reason=UNRESOLVED_TARGET';
    
    event.waitUntil(
      self.registration.showNotification(title, {
        body: payload.body || '',
        icon: payload.image || '/logo.png',
        badge: '/icons/icon-192.png',
        data: {
          ...payload,
          canonicalUrl
        }
      })
    );
  } catch (err) {
    console.warn('[service-worker.js] Push parse error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const canonicalUrl = event.notification.data?.canonicalUrl || '/target-unavailable?reason=UNRESOLVED_TARGET';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(canonicalUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(canonicalUrl);
      }
    })
  );
});
