/* =========================================
   rePROMPT — Service Worker (PWA)
   ========================================= */

const CACHE_NAME = 'reprompt-v3';

// Derive base path from the service worker's own URL so cached asset
// paths are correct regardless of whether the app is served from the
// domain root (local dev) or a subpath like /rePROMPT/ (GitHub Pages).
const SW_BASE = new URL('./', self.location).pathname;

const ASSETS = [
    SW_BASE,
    `${SW_BASE}index.html`,
    `${SW_BASE}styles.css`,
    `${SW_BASE}app.js`,
    `${SW_BASE}manifest.json`,
    `${SW_BASE}icons/icon.svg`,
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

    // Never cache API calls (backend proxy)
    if (url.pathname.includes('/api/')) {
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
