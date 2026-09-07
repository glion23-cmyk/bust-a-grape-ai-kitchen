const CACHE_NAME = "bag-v6";
const CORE_FILES = [
  "./",
  "./index.html",
  "./style.css?v=6",
  "./game.js?v=5",
  "./renderer3d.js?v=3",
  "./vendor/three.min.js",
  "./vendor/LICENSE.three.txt",
  "./manifest.webmanifest",
  "./content/lots.json",
  "./content/lines.json",
  "./art/gui/app-icon.svg",
  "./art/gui/apple-touch-icon.png",
  "./art/gui/lockup.png",
  "./art/sprites/kansas-dusk.jpg",
  "./art/sprites/sidewinder.png",
  "./art/sprites/bootlegger.png",
  "./art/sprites/pip-merlot.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => (key.startsWith("bust-a-grape-") || key.startsWith("bag-")) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
