/**
 * Service Worker for Budget Buddy PWA
 *
 * Features:
 * - Cache static assets for offline access
 * - Network-first strategy for API calls
 * - Background sync for offline transactions (future)
 */

const CACHE_NAME = 'budgetbuddy-v4'; // Update version when deploying new code
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
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

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // CRITICAL: Skip ALL external resources (Google Fonts, CDN, etc.)
  // Service worker MUST NOT intercept external requests to avoid CSP violations
  // Just return without calling event.respondWith() - browser will handle it naturally
  if (url.origin !== self.location.origin) {
    return; // Don't intercept - let browser handle it
  }

  // API calls - network only (don't cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request).catch(() => {
      // Return offline response for API calls if network fails
      return new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }));
    return;
  }

  // WebSocket connections - pass through
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Static assets - cache first, network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request).catch(() => {
          // Ignore fetch errors in background update
        }).then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, networkResponse.clone());
            });
          }
        });
        return cachedResponse;
      }

      // Network first
      return fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return offline page if network fails
        return caches.match('/index.html') || new Response('Offline', { status: 503 });
      });
    })
  );
});

// Handle messages from client (for manual updates)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
