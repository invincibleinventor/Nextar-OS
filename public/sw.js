// ---------------------------------------------------------------------------
// Intelligent Caching Service Worker
// ---------------------------------------------------------------------------

const CACHE_VERSION = 2;
const CACHE_PREFIX = 'nextarde';
const CACHE_NAME = `${CACHE_PREFIX}-v${CACHE_VERSION}`;

// ---- Pre-cache: critical assets fetched during the install phase ----------
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// ---- Allowed external CDN origins we are willing to cache -----------------
const CACHEABLE_ORIGINS = [
    'https://cdn.jsdelivr.net',       // Pyodide CDN
    'https://unpkg.com',              // isomorphic-git & other libs
    'https://fonts.googleapis.com',   // Google Fonts stylesheets
    'https://fonts.gstatic.com',      // Google Fonts font files
];

// ---- Bypass patterns: never touch these requests --------------------------
function shouldBypass(url, request) {
    // WebSocket upgrade requests
    if (request.headers.get('Upgrade') === 'websocket') return true;

    const path = url.pathname;

    // .ext2 disk images - too large for cache
    if (path.endsWith('.ext2')) return true;

    // CheerpX engine WASM files - need efficient streaming compilation
    if (path.includes('/cheerpx/') && path.endsWith('.wasm')) return true;

    // CheerpX internal asset paths
    if (path.includes('/cheerpx/')) return true;

    return false;
}

// ---- Helpers to classify requests -----------------------------------------

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

function isCacheableOrigin(url) {
    if (url.origin === location.origin) return true;
    return CACHEABLE_ORIGINS.some((origin) => url.origin === origin);
}

// ---- ETag / hash-aware cache writer ---------------------------------------
// Only writes to cache when the response has actually changed, avoiding
// needless disk writes and cache churn.

async function putIfChanged(cache, request, networkResponse) {
    const newETag = networkResponse.headers.get('ETag');
    const newLastModified = networkResponse.headers.get('Last-Modified');

    const existing = await cache.match(request);
    if (existing) {
        const oldETag = existing.headers.get('ETag');
        const oldLastModified = existing.headers.get('Last-Modified');

        // If ETags match, no need to update
        if (newETag && oldETag && newETag === oldETag) return;

        // If Last-Modified headers match, no need to update
        if (newLastModified && oldLastModified && newLastModified === oldLastModified) return;

        // For hashed filenames (e.g. _next/static/chunks/abc123.js) the URL
        // itself is the version key, so a cache hit on the same URL means the
        // content is identical -- skip the write.
        const path = new URL(request.url).pathname;
        if (/[\.\-_][a-f0-9]{8,}\.(js|css|mjs|woff2?)$/.test(path)) return;
    }

    await cache.put(request, networkResponse);
}

// ---- Strategy: Stale-While-Revalidate ------------------------------------
// Returns the cached response immediately (if available) while fetching a
// fresh copy in the background to update the cache.

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
                    // Network failed -- fall back to whatever we have cached
                    return cached || new Response('Offline', { status: 503 });
                });

            // Serve cached version instantly; update happens in the background
            return cached || networkFetch;
        });
    });
}

// ---- Strategy: Network-First ---------------------------------------------
// Tries the network and falls back to cache on failure.

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

// ---- Strategy: Cache-First -----------------------------------------------
// Serves from cache if available; otherwise fetches from network and caches.

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

// ===========================================================================
// Lifecycle Events
// ===========================================================================

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    // Activate immediately without waiting for existing clients to close
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
    // Take control of all open clients immediately
    self.clients.claim();
});

// ===========================================================================
// Fetch Handler -- route requests to the appropriate strategy
// ===========================================================================

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // ---- Bypass list: let the browser handle these natively ---------------
    if (shouldBypass(url, event.request)) return;

    // ---- Reject non-cacheable origins (unknown third parties) -------------
    if (!isCacheableOrigin(url)) return;

    // ---- WASM files (non-CheerpX, e.g. Pyodide) -------------------------
    // These are large but critical; use cache-first so they only download once
    if (isWasm(url)) {
        event.respondWith(cacheFirst(event, event.request));
        return;
    }

    // ---- API / data requests: network-first -------------------------------
    if (isApiOrData(url)) {
        event.respondWith(networkFirst(event, event.request));
        return;
    }

    // ---- Fonts, icon fonts, images: cache-first ---------------------------
    if (isFontOrIcon(url) || isImage(url)) {
        event.respondWith(cacheFirst(event, event.request));
        return;
    }

    // ---- Monaco editor assets: cache-first (they are versioned) -----------
    if (isMonacoAsset(url)) {
        event.respondWith(cacheFirst(event, event.request));
        return;
    }

    // ---- JS / CSS bundles: stale-while-revalidate -------------------------
    if (isJsOrCss(url)) {
        event.respondWith(staleWhileRevalidate(event, event.request));
        return;
    }

    // ---- Everything else from allowed origins: stale-while-revalidate -----
    event.respondWith(staleWhileRevalidate(event, event.request));
});

// ===========================================================================
// Message Handler
// ===========================================================================

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
