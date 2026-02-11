/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
// This service worker adds Cross-Origin-Isolation headers to enable SharedArrayBuffer
// which is required by WebContainers (WASM Node.js runtime)
let coepCredentialless = false;
if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

    self.addEventListener("message", (ev) => {
        if (ev.data && ev.data.type === "deregister") {
            self.registration.unregister().then(() => {
                ev.source.postMessage({ type: "deregistered" });
            });
        }
    });

    self.addEventListener("fetch", function (e) {
        if (e.request.cache === "only-if-cached" && e.request.mode !== "same-origin") return;

        e.respondWith(
            fetch(e.request).then((r) => {
                if (r.status === 0) return r;

                const headers = new Headers(r.headers);
                headers.set("Cross-Origin-Embedder-Policy", coepCredentialless ? "credentialless" : "require-corp");
                headers.set("Cross-Origin-Opener-Policy", "same-origin");

                return new Response(r.body, { status: r.status, statusText: r.statusText, headers });
            }).catch((e) => console.error(e))
        );
    });
} else {
    (() => {
        const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
        window.sessionStorage.removeItem("coiReloadedBySelf");
        const coepDegrading = reloadedBySelf === "coepdegrade";

        // If crossOriginIsolated already, nothing to do
        if (window.crossOriginIsolated !== false) return;

        if (!window.isSecureContext) {
            console.log("COOP/COEP Service Worker: Not a secure context, cannot register.");
            return;
        }

        // In a nested browsing context (iframe), cannot register
        if (window.self !== window.top) return;

        navigator.serviceWorker
            .register(window.document.currentScript.src)
            .then(
                (registration) => {
                    if (registration.active && !navigator.serviceWorker.controller) {
                        window.sessionStorage.setItem("coiReloadedBySelf", coepDegrading ? "coepdegrade" : "");
                        window.location.reload();
                    } else if (registration.installing) {
                        registration.installing.addEventListener("statechange", function () {
                            if (this.state === "activated") {
                                window.sessionStorage.setItem("coiReloadedBySelf", coepDegrading ? "coepdegrade" : "");
                                window.location.reload();
                            }
                        });
                    }
                },
                (err) => {
                    console.error("COOP/COEP Service Worker: Registration failed.", err);
                }
            );
    })();
}
