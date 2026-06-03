/*
 * Conservative service worker for the Ballet & Yoga Journal PWA.
 *
 * Design goals (in order): never break online behavior, never serve stale
 * authenticated HTML, add an offline fallback for navigations.
 *
 * - Navigations: network-first. Online is always a live fetch (so Supabase auth
 *   redirects and fresh data are never bypassed). Only when the network fails
 *   do we show the cached offline page.
 * - Hashed static assets (/_next/static, /icon.svg): stale-while-revalidate.
 * - Everything else (cross-origin: Supabase, CDNs; non-GET): left untouched.
 */
const CACHE = 'bj-shell-v1';
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // don't touch Supabase / CDNs

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (url.pathname.startsWith('/_next/static') || url.pathname === '/icon.svg') {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});
