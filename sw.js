// sw.js

const CACHE_NAME = 'pm-poshan-pro-cache-v1';
// This list should contain the "app shell" - the minimal resources needed to get the app UI showing.
const urlsToCache = [
  '/', // This is often aliased to index.html
  '/index.html',
  // Scripts and other assets will be cached on first load via the 'fetch' event handler.
  // Pre-caching only the entry points is a good strategy.
  '/index.tsx', 
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
  // Critical CDNs
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js',
];

// Install a service worker
self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // For cross-origin URLs, creating a Request with 'no-cors' is needed for addAll to succeed,
        // but it results in an opaque response. This is acceptable for caching these assets.
        const requests = urlsToCache.map(url => {
          if (url.startsWith('http')) {
            return new Request(url, { mode: 'no-cors' });
          }
          return url;
        });
        return cache.addAll(requests);
      })
      .catch(err => {
        console.error('Cache addAll failed:', err);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests, use a network-first strategy to ensure users get the latest HTML.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For all other requests, use a cache-first strategy.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - fetch and cache
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            // Opaque responses (from no-cors requests) have status 0, but are valid to cache.
            if (!networkResponse || (networkResponse.status !== 200 && networkResponse.status !== 0)) {
                return networkResponse;
            }

            // We don't cache our own API calls for backup/restore.
            if (event.request.url.includes('vercel.app')) {
                return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});


// Update a service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
