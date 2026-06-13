// Dear Memory service worker — installable PWA + offline support.
const CACHE = "dear-memory-v1";
const PRECACHE = [
  "/",
  "/photobooth",
  "/scrapbook",
  "/timeline",
  "/capsule",
  "/premium",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/mochi/mochi-face.png",
  "/mochi/mochi-hero.png",
  "/mochi/mochi-happy.png",
  "/mochi/mochi-waving.png",
  "/mochi/mochi-curious.png",
  "/mochi/mochi-excited.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // cache items individually so one 404 can't abort the whole install
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request);
  if (url.origin !== self.location.origin) return;

  // navigations: network-first, fall back to cached page (or home) when offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/")))
    );
    return;
  }

  // assets: cache-first with background fill
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((resp) => {
            const copy = resp.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return resp;
          })
          .catch(() => cached)
    )
  );
});
