// CodeNusa Offline Service Worker
// Memberikan kemampuan akses offline dan caching aplikasi pembelajaran

const CACHE_NAME = 'codenusa-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx'
];

// Install Event: Cache essential app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching app shell & essential assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some assets failed to pre-cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Network-first with Cache fallback for navigation, Cache-first / Stale-while-revalidate for assets
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Ignore non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  // Navigation requests (HTML pages): Network-first with cache fallback to /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match('/index.html') || caches.match('/');
          });
        })
    );
    return;
  }

  // Static assets (JS, CSS, Images, Fonts): Stale-While-Revalidate strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (request.url.includes('/assets/') ||
              request.url.includes('.js') ||
              request.url.includes('.css') ||
              request.url.includes('.png') ||
              request.url.includes('.svg') ||
              request.url.includes('.woff') ||
              request.url.includes('fonts.googleapis.com') ||
              request.url.includes('fonts.gstatic.com'))
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch((err) => {
          // Network failed, nothing more to do if we had a cache match
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for custom messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('[ServiceWorker] Cache cleared by request');
    });
  }
});
