const CACHE_NAME = 'nextarde-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cachenames) => {
            return Promise.all(
                cachenames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    if (url.origin !== location.origin) {
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response('Network unavailable', { status: 503 });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedresponse) => {
            const fetchpromise = fetch(event.request).then((networkresponse) => {
                if (networkresponse && networkresponse.status === 200) {
                    const responseclone = networkresponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseclone);
                    });
                }
                return networkresponse;
            }).catch(() => {
                return cachedresponse || new Response('Offline', { status: 503 });
            });

            return cachedresponse || fetchpromise;
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
