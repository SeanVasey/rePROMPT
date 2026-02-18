/* =========================================
   rePROMPT — Service Worker (PWA)
   ========================================= */

const CACHE_NAME = 'reprompt-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/icons/icon.svg',
];

// Install — cache shell assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

// Fetch — network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Never cache API calls
    if (url.hostname === 'api.anthropic.com') {
        return;
    }

    // Never cache Google Fonts (let browser handle)
    if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const fetched = fetch(event.request)
                .then((response) => {
                    // Cache successful same-origin responses
                    if (response.ok && url.origin === self.location.origin) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || fetched;
        })
    );
});
