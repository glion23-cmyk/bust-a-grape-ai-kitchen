const CACHE_NAME = "bag-v10";
const CORE_FILES = [
  "./",
  "./index.html",
  "./style.css?v=9",
  "./game.js?v=9",
  "./renderer3d.js?v=7",
  "./vendor/three/three.module.min.js",
  "./vendor/three/three.core.min.js",
  "./vendor/three/LICENSE.txt",
  "./vendor/three/addons/postprocessing/EffectComposer.js",
  "./vendor/three/addons/postprocessing/MaskPass.js",
  "./vendor/three/addons/postprocessing/RenderPass.js",
  "./vendor/three/addons/postprocessing/ShaderPass.js",
  "./vendor/three/addons/postprocessing/Pass.js",
  "./vendor/three/addons/postprocessing/UnrealBloomPass.js",
  "./vendor/three/addons/postprocessing/OutputPass.js",
  "./vendor/three/addons/shaders/CopyShader.js",
  "./vendor/three/addons/shaders/LuminosityHighPassShader.js",
  "./vendor/three/addons/shaders/OutputShader.js",
  "./vendor/three/addons/environments/RoomEnvironment.js",
  "./vendor/three/addons/geometries/RoundedBoxGeometry.js",
  "./manifest.webmanifest",
  "./content/lots.json",
  "./content/lines.json",
  "./art/gui/app-icon.svg",
  "./art/gui/apple-touch-icon.png",
  "./art/gui/lockup.webp",
  "./assets/fonts/barlow-condensed-latin-700-normal.woff2",
  "./assets/fonts/barlow-condensed-latin-900-normal.woff2",
  "./assets/fonts/barlow-latin-400-normal.woff2",
  "./assets/fonts/barlow-latin-600-normal.woff2",
  "./audio/sfx/ui-press.mp3",
  "./audio/sfx/ui-select.mp3",
  "./audio/sfx/launcher-clank.mp3",
  "./audio/sfx/grape-impact.mp3",
  "./audio/sfx/bottle-break.mp3"
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
