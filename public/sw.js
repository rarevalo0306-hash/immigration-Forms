/*
 * Camino's service worker: the app keeps working without internet.
 * - On install it caches the app itself (every file listed in precache.json, written at build time).
 * - Pages load from the network when there is one, and from the cache when not.
 * - Built files (hashed names) and fonts come from the cache first.
 * - Official PDFs are cached the first time a form is opened, so it can be filled and downloaded offline.
 * Answers never pass through here: they stay in the browser's storage.
 */
const VERSION = 'camino-v1';
const APP = `${VERSION}-app`;
const PDFS = `${VERSION}-pdfs`;
const FONTS = `${VERSION}-fonts`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP);
      const list = await fetch('precache.json', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
      await cache.addAll(['./', ...list]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (!key.startsWith(VERSION)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

const cacheFirst = async (cacheName, request) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
  return response;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    // The newest app when online; the cached one offline.
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          const cache = await caches.open(APP);
          cache.put('./', response.clone());
          return response;
        } catch {
          return (await caches.match('./')) || Response.error();
        }
      })(),
    );
    return;
  }
  if (url.origin === self.location.origin && url.pathname.includes('/forms/') && url.pathname.endsWith('.pdf')) {
    event.respondWith(cacheFirst(PDFS, request));
    return;
  }
  if (url.origin === self.location.origin && url.pathname.includes('/assets/')) {
    event.respondWith(cacheFirst(APP, request));
    return;
  }
  if (url.origin === self.location.origin && url.pathname.includes('/icons/')) {
    // The newest logo when online; the one saved at install offline.
    event.respondWith(fetch(request).catch(async () => (await caches.match(request)) || Response.error()));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(FONTS, request).catch(() => Response.error()));
  }
});
