const { chromium } = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const mime = {
  ".css": "text/css",
  ".html": "text/html",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json"
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
    response.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(response);
  });

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

async function waitForGame(page, baseUrl) {
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__BAG__ && [...document.images].every((image) => image.complete));
  await page.waitForFunction(() => document.getElementById("c").style.opacity === "0", null, { timeout: 6000 });
}

function collectPageErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function forcePlayerWin(page) {
  await page.evaluate(() => {
    const game = window.__BAG__;
    game.carts.enemy.hp = 0;
    game.state.phase = "flight";
    game.state.projectiles = [];
    game.state.resolveTimer = 0;
    game.state.volley = {
      shooterId: "player",
      lotId: "table",
      damage: { player: 0, enemy: 0 },
      closest: 0,
      hitDirect: true,
      ceremonyPlayed: true
    };
  });
}

async function verifyGrudgeCard(browser, baseUrl, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = collectPageErrors(page);
  await waitForGame(page, baseUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__BAG__ && document.getElementById("c").style.opacity === "0");

  await page.locator("#startSeriesButton").click();
  const firstMatchNumber = await page.evaluate(() => window.__BAG__.state.matchNumber);
  await forcePlayerWin(page);
  await page.locator("#grudgeCard").waitFor({ state: "visible" });

  const proof = await page.evaluate(() => {
    const card = document.getElementById("grudgeCard");
    const score = document.getElementById("grudgeScore");
    const button = document.getElementById("grudgeNext");
    const pip = document.getElementById("grudgeLeader");
    const bounds = [card, score, button, pip].map((element) => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom };
    });
    return {
      bounds,
      score: score.textContent.trim(),
      overflow: document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight
    };
  });

  if (proof.overflow || proof.score !== "1 - 0") throw new Error(`Invalid Grudge Card state at ${viewport.width}x${viewport.height}`);
  for (const bounds of proof.bounds) {
    if (bounds.left < 0 || bounds.top < 0 || bounds.right > viewport.width || bounds.bottom > viewport.height) {
      throw new Error(`Clipped Grudge Card element at ${viewport.width}x${viewport.height}: ${JSON.stringify(bounds)}`);
    }
  }

  const name = `${viewport.width}x${viewport.height}`;
  const screenshotPath = path.join(root, "collab", "evidence", `02-ritual-rivalry-${name}.png`);
  await page.screenshot({ path: screenshotPath });

  await page.locator("#grudgeNext").click();
  await page.waitForFunction((prior) => {
    const game = window.__BAG__;
    return document.getElementById("grudgeCard").hidden && game.state.mode === "match" && game.state.phase === "aim" && game.state.matchNumber === prior + 1;
  }, firstMatchNumber);

  if (errors.length) throw new Error(`Page errors at ${name}: ${errors.join(" | ")}`);
  await context.close();
  console.log(`PASS viewport ${name}: exact fit, Grudge Card visible, NEXT MATCH started match ${firstMatchNumber + 1}`);
}

async function verifyPersistence(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
  const page = await context.newPage();
  await waitForGame(page, baseUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__BAG__);
  await page.locator("#startSeriesButton").click();
  await forcePlayerWin(page);
  await page.locator("#grudgeNext").waitFor({ state: "visible" });
  await page.locator("#grudgeNext").click();
  await forcePlayerWin(page);
  await page.locator("#resultScreen").waitFor({ state: "visible" });
  const beforeReload = await page.evaluate(() => JSON.parse(localStorage.getItem("BAG_GRUDGE")));
  await page.reload({ waitUntil: "networkidle" });
  const afterReload = await page.evaluate(() => JSON.parse(localStorage.getItem("BAG_GRUDGE")));
  if (beforeReload?.yard !== 2 || afterReload?.yard !== 2) throw new Error("All-time Grudge tally did not survive reload");
  await context.close();
  console.log("PASS persistence: completed 2-0 series retained BAG_GRUDGE after reload");
}

async function verifyCanvasFallback(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 740, height: 360 } });
  const page = await context.newPage();
  const errors = collectPageErrors(page);
  await page.route("**/vendor/three.min.js", (route) => route.abort());
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__BAG__);
  const canvas = page.locator("#c");
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error("Canvas fallback has no pointer surface");

  await page.locator("#startButton").click();
  await page.mouse.move(bounds.x + bounds.width * 0.2, bounds.y + bounds.height * 0.72);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.48, bounds.y + bounds.height * 0.35, { steps: 6 });
  await page.mouse.up();
  await page.waitForFunction(() => window.__BAG__.state.phase === "ceremony");

  const proof = await page.evaluate(() => ({
    canvasOpacity: document.getElementById("c").style.opacity || "1",
    has3DRenderer: Boolean(window.__BAG__.render3D),
    canvases: document.querySelectorAll("canvas").length
  }));
  if (proof.canvasOpacity !== "1" || proof.has3DRenderer || proof.canvases !== 1 || errors.length) {
    throw new Error(`Canvas fallback failed: ${JSON.stringify({ proof, errors })}`);
  }
  await context.close();
  console.log("PASS Canvas fallback: one visible canvas and real drag/release entered ceremony");
}

async function measureFourLotWorkload(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 740, height: 360 } });
  const page = await context.newPage();
  const errors = collectPageErrors(page);
  await waitForGame(page, baseUrl);
  await page.locator("#startButton").click();

  await page.evaluate(() => {
    window.__BAG_PERF__ = { active: true, frames: 0, overBudget: 0, started: performance.now(), last: performance.now() };
    const sample = (now) => {
      const probe = window.__BAG_PERF__;
      if (!probe?.active) return;
      const delta = now - probe.last;
      probe.last = now;
      probe.frames += 1;
      if (delta > 20) probe.overBudget += 1;
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });

  const completed = [];
  const tunedAim = {
    table: { angle: 50, power: 50 },
    pea: { angle: 50, power: 30 },
    cluster: { angle: 50, power: 57 },
    lug: { angle: 50, power: 78 }
  };
  for (const lot of ["table", "pea", "cluster", "lug"]) {
    const craterCount = await page.evaluate(({ lotId, aim }) => {
      const game = window.__BAG__;
      const before = game.state.craters.length;
      game.state.projectiles = [];
      game.state.particles = [];
      game.state.impactFocus = null;
      game.state.volley = null;
      game.state.resolveTimer = -1;
      game.state.turn = "player";
      game.state.phase = "aim";
      game.carts.player.hp = 3;
      game.carts.enemy.hp = 3;
      game.select(lotId);
      game.setAim(aim.angle, aim.power);
      game.state.aimCut = 0;
      game.fire();
      return before;
    }, { lotId: lot, aim: tunedAim[lot] });
    console.log(`PERF firing ${lot} at ${tunedAim[lot].angle}°/${tunedAim[lot].power}%`);
    await page.waitForFunction(({ lotId, before }) => {
      const game = window.__BAG__;
      return game.state.craters.length > before && game.state.volley?.lotId === lotId && game.state.volley.ceremonyPlayed;
    }, { lotId: lot, before: craterCount }, { timeout: 10000 });
    completed.push(lot);
    await page.waitForTimeout(780);
  }

  const result = await page.evaluate((lots) => {
    const probe = window.__BAG_PERF__;
    probe.active = false;
    return { lots, frames: probe.frames, overBudget: probe.overBudget, durationMs: performance.now() - probe.started };
  }, completed);

  if (result.lots.length !== 4 || errors.length) throw new Error(`Four-lot workload failed: ${errors.join(" | ")}`);
  result.overBudgetPercent = Number((result.overBudget / result.frames * 100).toFixed(2));
  await context.close();
  console.log(`PERF ${JSON.stringify(result)} environment=headless-chromium-swiftshader threshold=>20ms`);
  return result;
}

async function run() {
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    await verifyGrudgeCard(browser, baseUrl, { width: 740, height: 360 });
    await verifyGrudgeCard(browser, baseUrl, { width: 844, height: 390 });
    await verifyPersistence(browser, baseUrl);
    await verifyCanvasFallback(browser, baseUrl);
    const performance = await measureFourLotWorkload(browser, baseUrl);
    if (performance.overBudgetPercent > 5) throw new Error(`Frame budget failed: ${performance.overBudgetPercent}%`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
