const { chromium } = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..", "dist");
const expectedCache = "bag-v10";
const requiredOfflineFiles = [
  "index.html",
  "game.js?v=9",
  "renderer3d.js?v=7",
  "three.module.min.js",
  "three.core.min.js",
  "EffectComposer.js",
  "MaskPass.js",
  "barlow-condensed-latin-900-normal.woff2",
  "grape-impact.mp3"
];
const mimes = {
  ".css": "text/css",
  ".html": "text/html",
  ".js": "text/javascript",
  ".json": "application/json",
  ".mp3": "audio/mpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff2": "font/woff2"
};

function startServer() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, {
      "Content-Type": mimes[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    fs.createReadStream(filePath).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function waitForGame(page) {
  await page.waitForFunction(() => window.__BAG__?.rendererInfo?.().threeRevision === "185", null, { timeout: 12000 });
  await page.waitForFunction(() => document.getElementById("bootScreen")?.classList.contains("ready"), null, { timeout: 12000 });
}

async function run() {
  if (!fs.existsSync(path.join(root, "index.html"))) throw new Error("Run ./scripts/build-pages.sh before the PWA smoke test.");
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 844, height: 390 }, serviceWorkers: "allow" });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await waitForGame(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 12000 });

    const cacheProof = await page.evaluate(async ({ expected, required }) => {
      const names = await caches.keys();
      const cache = await caches.open(expected);
      const urls = (await cache.keys()).map((request) => request.url);
      return {
        names,
        missing: required.filter((part) => !urls.some((url) => url.includes(part))),
        count: urls.length
      };
    }, { expected: expectedCache, required: requiredOfflineFiles });
    if (!cacheProof.names.includes(expectedCache) || cacheProof.missing.length) {
      throw new Error(`Incomplete install cache: ${JSON.stringify(cacheProof)}`);
    }

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForGame(page);
    const offlineProof = await page.evaluate(() => ({
      controlled: Boolean(navigator.serviceWorker.controller),
      mode: window.__BAG__.rendererInfo().mode,
      fullBleed: document.getElementById("stage").getBoundingClientRect().width === innerWidth
    }));
    if (!offlineProof.controlled || offlineProof.mode !== "procedural-3d" || !offlineProof.fullBleed) {
      throw new Error(`Offline boot contract failed: ${JSON.stringify(offlineProof)}`);
    }
    console.log(`PASS install cache (${cacheProof.count} files) and offline 3D phone boot`);
    await context.close();
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
