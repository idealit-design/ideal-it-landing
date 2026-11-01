const CACHE_NAME = "osma-inspecciones-v0.2.0";
const APP_SHELL = ["/", "/manifest.webmanifest", "/osma-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  const removeOldCaches = caches.keys().then((keys) =>
    Promise.all(
      keys
        .filter((key) => key.startsWith("osma-inspecciones-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key)),
    ),
  );
  event.waitUntil(Promise.all([removeOldCaches, self.clients.claim()]));
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname.startsWith("/api/")
  ) {
    return;
  }

  if (event.request.mode === "navigate") {
    const networkResponse = fetch(event.request);
    event.respondWith(
      networkResponse
        .catch(async () => {
          const cachedShell = await caches.match("/");
          return cachedShell ?? Response.error();
        }),
    );
    event.waitUntil(
      networkResponse
        .then((response) => {
          if (!response.ok) return undefined;
          return caches.open(CACHE_NAME).then((cache) => cache.put("/", response.clone()));
        })
        .catch(() => undefined),
    );
    return;
  }

  const cachedResponse = caches.match(event.request);
  const networkResponse = fetch(event.request);
  event.respondWith(
    cachedResponse.then((cached) => cached ?? networkResponse),
  );
  event.waitUntil(
    networkResponse
      .then((response) => {
        if (!response.ok || response.type === "opaque") return undefined;
        return caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
      })
      .catch(() => undefined),
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag !== "osma-inspecciones-sync") return;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      clients.forEach((client) => client.postMessage({ type: "OSMA_SYNC_REQUEST" }));
    }),
  );
});
