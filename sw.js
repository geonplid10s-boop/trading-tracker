// Service Worker para Trading Tracker PWA
const CACHE_NAME = 'trading-tracker-v3';
const urlsToCache = [
    '/trading-tracker/',
    '/trading-tracker/index.html',
    '/trading-tracker/style.css',
    '/trading-tracker/app.js',
    '/trading-tracker/manifest.json',
    '/trading-tracker/icons/icon-192.png',
    '/trading-tracker/icons/icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Cache abierto');
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) {
                return response;
            }
            return fetch(event.request).then(response => {
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return response;
            });
        }).catch(() => {
            // Si falla, intentar servir index.html
            return caches.match('/trading-tracker/index.html');
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});
