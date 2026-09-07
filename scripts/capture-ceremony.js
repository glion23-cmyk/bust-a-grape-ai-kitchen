const { chromium } = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const expectedShapes = { table: "drop", pea: "spark", cluster: "shard", lug: "clod" };
const expectedCrew = { table: 3, pea: 3, cluster: 5, lug: 5 };

function startServer() {
  const server = http.createServer((request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(`${root}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      response.writeHead(404).end();
      return;
    }
    const types = { ".css": "text/css", ".html": "text/html", ".jpg": "image/jpeg", ".js": "text/javascript", ".png": "image/png", ".svg": "image/svg+xml" };
    response.writeHead(200, { "Content-Type": types[path.extname(filePath)] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function triggerLaunchCeremony(page, lotId) {
  await page.evaluate((lot) => {
    const game = window.__BAG__;
    game.start();
    game.select(lot);
    game.fire();
  }, lotId);
  await page.waitForFunction(({ lot, count }) => {
    const pose = window.__BAG__.state.crewPose;
    return pose?.lotId === lot && pose.count === count;
  }, { lot: lotId, count: expectedCrew[lotId] }, { timeout: 6000 });
  await page.waitForTimeout(220);
  return page.screenshot();
}

async function triggerDeadLane(page, lotId) {
  await page.evaluate((lot) => {
    const game = window.__BAG__;
    game.start();
    game.state.projectiles = [];
    game.state.particles = [];
    game.state.impactFocus = null;
    game.state.volley = {
      lotId: lot,
      shooterId: "player",
      damage: { player: 0, enemy: 0 },
      closest: Infinity,
      hitDirect: false,
      announcedSplit: false,
      ceremonyPlayed: false
    };
    game.state.selected = lot;
    game.state.phase = "flight";
    document.getElementById("fieldHint").hidden = true;
    const target = game.carts.enemy;
    game.state.projectiles = [{
      owner: "player",
      lotId: lot,
      x: target.x - 18,
      y: game.groundAt(target.x, target.z) - 92,
      z: target.z,
      vx: 26,
      vy: 125,
      vz: 0,
      radius: game.LOTS[lot].radius,
      age: 0.4,
      trailClock: 0,
      trail: [],
      child: false,
      split: lot === "cluster"
    }];
  }, lotId);
  await page.waitForFunction((lot) => window.__BAG__.state.impactFocus?.lotId === lot, lotId, { timeout: 10000 });
  await page.waitForTimeout(150);
  const proof = await page.evaluate(() => ({
    focus: window.__BAG__.state.impactFocus,
    shapes: [...new Set(window.__BAG__.state.particles.map((particle) => particle.shape))],
    count: window.__BAG__.state.particles.length,
    canvasOpacity: document.getElementById("c").style.opacity
  }));
  if (proof.focus?.tier !== "DEAD_LANE" || !proof.shapes.includes(expectedShapes[lotId]) || proof.count > 30 || proof.canvasOpacity !== "0") {
    throw new Error(`Invalid ${lotId} ceremony proof: ${JSON.stringify(proof)}`);
  }
  return page.screenshot();
}

async function run() {
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    const launches = {};
    const impacts = {};
    for (const lot of Object.keys(expectedShapes)) {
      await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__BAG__ && [...document.images].every((image) => image.complete));
      await page.waitForFunction(() => document.getElementById("c").style.opacity === "0", null, { timeout: 6000 });
      launches[lot] = (await triggerLaunchCeremony(page, lot)).toString("base64");
      await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
      await page.waitForFunction(() => window.__BAG__ && document.getElementById("c").style.opacity === "0");
      impacts[lot] = (await triggerDeadLane(page, lot)).toString("base64");
    }
    if (pageErrors.length) throw new Error(`Ceremony page errors: ${pageErrors.join(" | ")}`);

    await page.setViewportSize({ width: 1720, height: 1780 });
    await page.setContent(`<!doctype html>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; padding: 18px; background: #1a100c; color: #f3e6c8; font-family: Impact, sans-serif; }
        header { display: flex; justify-content: space-between; align-items: baseline; margin: 0 4px 14px; }
        h1 { margin: 0; letter-spacing: .06em; font-size: 30px; }
        header span { color: #c4b49a; letter-spacing: .12em; font-size: 15px; }
        main { display: grid; gap: 12px; }
        section { border: 2px solid #6b1c2a; background: #3a2a1c; }
        h2 { margin: 0; padding: 6px 10px; letter-spacing: .14em; font-size: 19px; border-bottom: 2px solid #6b1c2a; }
        .pair { display: grid; grid-template-columns: 1fr 1fr; }
        figure { position: relative; margin: 0; }
        figure + figure { border-left: 2px solid #6b1c2a; }
        figcaption { position: absolute; z-index: 2; top: 6px; left: 8px; padding: 5px 8px; color: #f3e6c8; background: rgba(26,16,12,.88); font-size: 14px; letter-spacing: .12em; }
        img { display: block; width: 100%; height: 375px; object-fit: cover; }
      </style>
      <header><h1>FOUR LOT RITUALS / CREW TO IMPACT</h1><span>REAL 3D FRAMES · 844×390</span></header>
      <main>${Object.keys(expectedShapes).map((lot) => `<section><h2>${lot.toUpperCase()} · ${expectedShapes[lot].toUpperCase()} · ${expectedCrew[lot]}-PIP TABLEAU</h2><div class="pair"><figure><figcaption>LAUNCH CEREMONY</figcaption><img src="data:image/png;base64,${launches[lot]}"></figure><figure><figcaption>DEAD LANE IMPACT</figcaption><img src="data:image/png;base64,${impacts[lot]}"></figure></div></section>`).join("")}</main>`);
    await page.waitForFunction(() => [...document.images].every((image) => image.complete));
    const destination = path.join(root, "collab", "evidence", "02-ceremonies.png");
    await page.screenshot({ path: destination });
    console.log(`PASS ceremony contact sheet: ${destination}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
