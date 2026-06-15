const CACHE = 'tasksa-v1';
const OFFLINE_URL = '/';

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.add(OFFLINE_URL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  if(e.request.url.indexOf('tasksa-backend-production') >= 0) return;
  e.respondWith(
    fetch(e.request).catch(function(){
      return caches.match(e.request).then(function(r){ return r || caches.match(OFFLINE_URL); });
    })
  );
});
