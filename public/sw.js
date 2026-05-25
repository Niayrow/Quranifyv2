const CACHE_NAME = 'quranify-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/icons.svg'
];

// Install Event: cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell...');
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((asset) => cache.add(asset))
      );
    })
  );
  self.skipWaiting();
});

// Activate Event: purge obsolete cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache version:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Stale-While-Revalidate pattern for HTML/JS/CSS; bypass audio streams
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') {
    return;
  }

  // Bypass cache entirely for official external Mp3Quran API audio tracks or telemetry
  if (url.hostname.includes('mp3quran.net')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh updates in the background to refresh cache silently
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => { /* Silence network drop exceptions in offline environments */ });
          
        return cachedResponse;
      }
      
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse.status === 200 && url.origin === self.location.origin) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
