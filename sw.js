/* Vua Sieu Thi Pho — PWA v7.2 | sw.js — cache-first, offline ve index.html */
var CACHE = 'vua-sieu-thi-v7.2';
var ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './css/ui.css',
  './js/data.js',
  './js/state.js',
  './js/audio.js',
  './js/game.js',
  './js/render.js',
  './js/ui.js',
  './js/main.js',
  './assets/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/sprites/walk-manager.png',
  './assets/sprites/walk-cashier.png',
  './assets/sprites/walk-customer1.png',
  './assets/sprites/walk-idle-manager.png',
  './assets/sprites/walk-idle-cashier.png',
  './assets/sprites/walk-idle-customer1.png',
  './assets/img/bg-store.jpg',
  './assets/img/icon-apple.png',
  './assets/img/icon-banana.png',
  './assets/img/icon-carrot.png',
  './assets/img/icon-milk.png',
  './assets/img/icon-bread.png',
  './assets/img/icon-snack.png',
  './assets/img/shelf-groceries.jpg',
  './assets/img/stall-fruit.jpg',
  './assets/img/counter-pos.jpg',
  './assets/img/preview-store-2.jpg',
  './assets/img/preview-landscape.webp'
];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});
