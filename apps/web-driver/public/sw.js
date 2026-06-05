/*
 * Livraison Driver service worker.
 *
 * Strategy:
 *  - Precache the app shell and offline fallback on install.
 *  - Network-first for navigations (so drivers get fresh data when online),
 *    falling back to the cached shell / offline page when offline.
 *  - Stale-while-revalidate for static assets (_next/static, icons).
 *  - Never cache API/BFF responses (they are user- and tenant-specific and
 *    mutations are handled by the IndexedDB outbox, not the SW).
 */
const VERSION = 'v1';
const SHELL_CACHE = `lv-driver-shell-${VERSION}`;
const ASSET_CACHE = `lv-driver-assets-${VERSION}`;
const OFFLINE_URL = '/offline';
const SHELL_URLS = ['/offline', '/dashboard', '/shipments'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== ASSET_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') {
    return;
  }
  const url = new URL(request.url);

  // Never cache API/BFF traffic.
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))),
    );
    return;
  }

  if (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons')) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((response) => {
            cache.put(request, response.clone());
            return response;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
