/**
 * Service Worker for Budget Buddy PWA
 *
 * Features:
 * - Network-first for HTML navigation (prevents stale bundle crashes)
 * - Cache static hashed assets for offline access
 * - Network-only for API calls
 */

const CACHE_NAME = 'budgetbuddy-v8';

// Install event - activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim clients and clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external resources
  if (url.origin !== self.location.origin) {
    return;
  }

  // API calls - network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => {
      return new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }));
    return;
  }

  // Socket.io - pass through
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.pathname.startsWith('/socket.io')) {
    return;
  }

  // Navigation requests (HTML) - network-first, cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(request).then((cached) => {
          return cached || caches.match('/index.html') || new Response('Offline', { status: 503 });
        });
      })
    );
    return;
  }

  // Static assets (JS/CSS/images) - cache-first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => {
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Handle messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CACHE_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
