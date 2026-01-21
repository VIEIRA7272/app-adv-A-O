// Service Worker para PWA
const CACHE_NAME = 'advocacia-v1';
const urlsToCache = [
    '/',
    '/logo-new.webp',
    '/login-bg.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
