const CACHE_VERSION = 'quranify-pwa-v101-20260526';
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = '/offline.html';

const APP_SHELL_ASSETS = [
  '/',
  '/index.html',
  OFFLINE_URL,
  '/favicon.svg',
  '/apple-touch-icon.png',
  '/site.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-512.png',
  '/og-image.png'
];

const isMp3QuranRequest = (url) => (
  url.hostname.includes('mp3quran.net')
);

const isStaticAsset = (request) => (
  ['style', 'script', 'worker', 'image', 'font'].includes(request.destination)
);

const putRuntimeCache = async (request, response) => {
  if (!response || response.status !== 200 || response.type === 'opaque') {
    return;
  }

  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(request, response.clone());
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (isMp3QuranRequest(url)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          putRuntimeCache('/index.html', response.clone());
          return response;
        })
        .catch(async () => (
          await caches.match('/index.html') ||
          await caches.match(OFFLINE_URL)
        ))
    );
    return;
  }

  if (url.origin === self.location.origin && isStaticAsset(request)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const networkFetch = fetch(request)
          .then((networkResponse) => {
            putRuntimeCache(request, networkResponse.clone());
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetch;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (url.origin === self.location.origin) {
          putRuntimeCache(request, response.clone());
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
