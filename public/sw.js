const CACHE_NAME = 'nextaros-v2';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/favicon.ico',
    '/og-image.jpg',
    '/pfp.png',
    '/me.png',
    '/explorer.png',
    '/browser.png',
    '/settings.png',
    '/mail.png',
    '/calendar.png',
    '/textedit.png',
    '/notes.png',
    '/photos.png',
    '/music.png',
    '/terminal.png',
    '/calculator.png',
    '/appstore.png',
    '/launchpad.png',
    '/about.png',
    '/python.png',
    '/fileviewer.png',
    '/wallpaper-1.jpg',
    '/wallpaper-2.jpg',
    '/wallpaper-3.jpg',
    '/wallpaper-4.jpg',
    '/wallpaper-5.jpg',
    '/fonts/sf-pro.woff2'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS.filter(asset => {
                return !asset.includes('undefined');
            })).catch((err) => {
                console.log('Some assets failed to cache, continuing...', err);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
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

    if (url.origin !== self.location.origin) {
        return;
    }

    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 200 && response.type === 'basic') {
                        return caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, response.clone());
                            return response;
                        });
                    }
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request).then((response) => {
                        if (response) return response;
                        return caches.match('/');
                    });
                })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                console.error('Failed to fetch resource:', event.request.url);
            });

            return cachedResponse || fetchPromise;
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
