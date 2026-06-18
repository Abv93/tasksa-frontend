// TaskSA Service Worker
// Enables PWA install, offline fallback and caching

var CACHE_NAME = 'tasksa-v2';
var OFFLINE_URL = '/';

var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ── INSTALL ──────────────────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// ── FETCH ────────────────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip API requests — always go to network
  if (event.request.url.includes('/api/')) return;

  // Network first, fall back to cache, then offline page
  event.respondWith(
    fetch(event.request).then(function(response) {
      // Cache successful responses for the main page
      if (response && response.status === 200) {
        var responseClone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(function() {
      // Offline — serve from cache
      return caches.match(event.request).then(function(cachedResponse) {
        if (cachedResponse) return cachedResponse;
        // Last resort — serve the home page
        return caches.match(OFFLINE_URL);
      });
    })
  );
});
