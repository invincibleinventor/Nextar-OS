const CACHE_VERSION = 3;
const CACHE_PREFIX = 'nextaros';
const CACHE_NAME = `${CACHE_PREFIX}-v${CACHE_VERSION}`;

const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/bg.jpg',
    '/bg-dark.jpg',
];

const CACHEABLE_ORIGINS = [
    'https://cdn.jsdelivr.net',
    'https://unpkg.com',
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
];

function shouldBypass(url, request) {
    if (request.headers.get('Upgrade') === 'websocket') return true;
    const path = url.pathname;
    if (path.endsWith('.ext2')) return true;
    if (path.includes('/cheerpx/')) return true;
    return false;
}

function isJsOrCss(url) {
    const p = url.pathname;
    return p.endsWith('.js') || p.endsWith('.css') || p.endsWith('.mjs');
}

function isMonacoAsset(url) {
    const p = url.pathname;
    return p.includes('/monaco-editor/') || p.includes('/_next/static/chunks/monaco');
}

function isFontOrIcon(url) {
    const p = url.pathname;
    return (
        p.endsWith('.woff') ||
        p.endsWith('.woff2') ||
        p.endsWith('.ttf') ||
        p.endsWith('.otf') ||
        p.endsWith('.eot') ||
        url.origin === 'https://fonts.gstatic.com' ||
        url.origin === 'https://fonts.googleapis.com'
    );
}

function isImage(url) {
    const p = url.pathname;
    return (
        p.endsWith('.png') ||
        p.endsWith('.jpg') ||
        p.endsWith('.jpeg') ||
        p.endsWith('.gif') ||
        p.endsWith('.svg') ||
        p.endsWith('.ico') ||
        p.endsWith('.webp') ||
        p.endsWith('.avif')
    );
}

function isApiOrData(url) {
    const p = url.pathname;
    return p.startsWith('/api/') || p.startsWith('/api?');
}

function isWasm(url) {
    return url.pathname.endsWith('.wasm');
}

function isPyodideAsset(url) {
    return url.origin === 'https://cdn.jsdelivr.net' && url.pathname.includes('/pyodide/');
}

function isCacheableOrigin(url) {
    if (url.origin === location.origin) return true;
    return CACHEABLE_ORIGINS.some((origin) => url.origin === origin);
}

async function putIfChanged(cache, request, networkResponse) {
    const newETag = networkResponse.headers.get('ETag');
    const newLastModified = networkResponse.headers.get('Last-Modified');

    const existing = await cache.match(request);
    if (existing) {
        const oldETag = existing.headers.get('ETag');
        const oldLastModified = existing.headers.get('Last-Modified');

        if (newETag && oldETag && newETag === oldETag) return;
        if (newLastModified && oldLastModified && newLastModified === oldLastModified) return;

        const path = new URL(request.url).pathname;
        if (/[\.\-_][a-f0-9]{8,}\.(js|css|mjs|woff2?)$/.test(path)) return;
    }

    await cache.put(request, networkResponse);
}

function staleWhileRevalidate(event, request) {
    return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
            const networkFetch = fetch(request)
                .then((networkResponse) => {
                    if (networkResponse && networkResponse.ok) {
                        putIfChanged(cache, request, networkResponse.clone());
                    }
                    return networkResponse;
                })
                .catch(() => {
                    return cached || new Response('Offline', { status: 503 });
                });

            return cached || networkFetch;
        });
    });
}

function networkFirst(event, request) {
    return caches.open(CACHE_NAME).then((cache) => {
        return fetch(request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.ok) {
                    putIfChanged(cache, request, networkResponse.clone());
                }
                return networkResponse;
            })
            .catch(() => {
                return cache.match(request).then((cached) => {
                    return cached || new Response('Offline', { status: 503 });
                });
            });
    });
}

function cacheFirst(event, request) {
    return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cached) => {
            if (cached) return cached;

            return fetch(request).then((networkResponse) => {
                if (networkResponse && networkResponse.ok) {
                    cache.put(request, networkResponse.clone());
                }
                return networkResponse;
            });
        });
    });
}

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith(CACHE_PREFIX + '-') && name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    if (shouldBypass(url, event.request)) return;
    if (!isCacheableOrigin(url)) return;

    if (isWasm(url) || isPyodideAsset(url)) {
        event.respondWith(cacheFirst(event, event.request));
        return;
    }

    if (isApiOrData(url)) {
        event.respondWith(networkFirst(event, event.request));
        return;
    }

    if (isFontOrIcon(url) || isImage(url)) {
        event.respondWith(cacheFirst(event, event.request));
        return;
    }

    if (isMonacoAsset(url)) {
        event.respondWith(cacheFirst(event, event.request));
        return;
    }

    if (isJsOrCss(url)) {
        event.respondWith(staleWhileRevalidate(event, event.request));
        return;
    }

    event.respondWith(staleWhileRevalidate(event, event.request));
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
