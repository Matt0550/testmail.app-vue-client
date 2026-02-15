
const CACHE_NAME = 'testmail-dashboard-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/banner.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // remove old caches
      const keys = await caches.keys();
      await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())));
      await self.clients.claim();
    })()
  );
});

async function fetchAndCache(request) {
  try {
    const res = await fetch(request);
    if (!res || res.status !== 200 || res.type === 'opaque') return res;
    const cache = await caches.open(CACHE_NAME);
    // only cache http/https requests (skip chrome-extension, data:, etc.)
    try {
      const u = new URL(request.url);
      if (u.protocol.startsWith('http')) {
        await cache.put(request, res.clone());
      }
    } catch (e) {
      // skip caching for unsupported schemes
      console.warn('sw: skipping cache.put for', request.url);
    }
    return res;
  } catch (err) {
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // ignore non-HTTP(S) schemes (chrome-extension:, about:, data:, etc.) — do not intercept
  let url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return; // unsupported URL (can't handle)
  }
  if (!url.protocol.startsWith('http')) return;

  // Never cache API responses — always network, with graceful offline JSON fallback
  if (url.hostname === 'api.testmail.app' || request.url.includes('/api/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => {
        return new Response(JSON.stringify({ result: 'error', message: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Navigation requests -> try network, fall back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((r) => r).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Static assets (images, styles, scripts, fonts): cache-first with background update
  if (['style', 'script', 'image', 'font'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetchAndCache(request)).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Default: network first, fallback to cache
  event.respondWith(
    fetch(request).then((r) => r).catch(() => caches.match(request))
  );
});
