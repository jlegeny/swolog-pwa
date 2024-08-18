var cacheName = 'hello-pwa';
var filesToCache = [
  '/',
  '/index.html',
  '/vite.svg',
  '/src/swolog-main.ts'
];

/* Start the service worker and cache all of the app's content */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.addAll(filesToCache);
    })
  );
});

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      if (response) {
        return response;
      }
      try {
        return fetch(e.request);
      } catch (e) {
        console.error(e);
      }
    }).catch(function (error) {
      console.error('Cache miss', e);
    })
  );
});