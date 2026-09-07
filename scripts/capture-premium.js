const { chromium } = require("playwright");
const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const evidence = path.join(root, "collab", "evidence");
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
    response.writeHead(200, { "Content-Type": mimes[path.extname(filePath)] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(response);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` }));
  });
}

async function waitForField(page, baseUrl) {
  await page.goto(`${baseUrl}/?evidence=1`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => typeof window.__BAG__?.getGrabRect === "function");
  await page.waitForFunction(() => document.getElementById("bootScreen")?.classList.contains("ready"));
}

async function freezeFrame(page) {
  await page.evaluate(() => {
    window.__BAG__._evidenceRenderer = window.__BAG__.render3D;
    window.__BAG__.render3D = null;
  });
  await page.waitForTimeout(120);
}

async function thawFrame(page) {
  await page.evaluate(() => {
    window.__BAG__.render3D = window.__BAG__._evidenceRenderer;
    delete window.__BAG__._evidenceRenderer;
  });
  await page.waitForTimeout(120);
}

async function run() {
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await waitForField(page, baseUrl);
    await freezeFrame(page);
    await page.screenshot({ path: path.join(evidence, "04-premium-title.png") });
    await thawFrame(page);

    await page.locator("#startButton").click();
    await page.waitForFunction(() => window.__BAG__.state.phase === "aim");
    await page.waitForTimeout(260);
    await freezeFrame(page);
    await page.screenshot({ path: path.join(evidence, "04-premium-field.png") });
    await thawFrame(page);

    // Stage a deterministic live pull. Gesture mechanics are exercised by the
    // browser suite; direct state avoids Chromium's pointer/WebGL screenshot
    // compositing bug while preserving the exact frame players see.
    await page.evaluate(() => {
      const game = window.__BAG__;
      const grab = game.getGrabRect("player");
      const cx = grab.left + grab.width / 2;
      const cy = grab.top + grab.height / 2;
      game.state.dragging = false;
      game.state.pointerId = null;
      game.state.firstAim = false;
      game.state.aimAngle = 23;
      game.state.aimPower = 73;
      game.state.aimCut = 0;
      game.gestureState.state = "active";
      game.gestureState.origin = { x: cx, y: cy };
      game.gestureState.current = { x: cx - 98, y: cy + 86 };
      game.gestureState.valid = true;
      document.getElementById("fieldHint").hidden = true;
      document.getElementById("aimTelemetry").hidden = false;
      document.getElementById("aimAngleValue").textContent = "23°";
      document.getElementById("aimPowerValue").textContent = "73%";
      document.getElementById("aimLaneValue").textContent = "STRAIGHT";
      document.getElementById("controlHeadline").textContent = "JUICE 73%";
      document.getElementById("controlHelp").textContent = "23° LIFT · STRAIGHT LANE";
    });
    await page.waitForTimeout(160);
    await page.screenshot({ path: path.join(evidence, "04-premium-aim.png") });

    // Capture the strongest deterministic contact frame instead of hoping a
    // freehand evidence pull happens to land on the opponent.
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForFunction(() => typeof window.__BAG__?.getGrabRect === "function");
    await page.evaluate(() => {
      const game = window.__BAG__;
      game.start();
      game.select("lug");
      game.state.projectiles = [];
      game.state.particles = [];
      game.state.rings = [];
      game.state.impactFocus = null;
      game.state.volley = {
        lotId: "lug",
        shooterId: "player",
        damage: { player: 0, enemy: 0 },
        closest: Infinity,
        hitDirect: false,
        announcedSplit: false,
        ceremonyPlayed: false
      };
      game.state.phase = "flight";
      document.getElementById("fieldHint").hidden = true;
      const target = game.carts.enemy;
      game.state.projectiles = [{
        owner: "player",
        lotId: "lug",
        x: target.x - 12,
        y: game.groundAt(target.x, target.z) - 88,
        z: target.z,
        vx: 32,
        vy: 132,
        vz: 0,
        radius: game.LOTS.lug.radius,
        age: 0.45,
        trailClock: 0,
        trail: [],
        child: false,
        split: false
      }];
    });
    await page.waitForFunction(() => window.__BAG__.state.impactFocus?.lotId === "lug", null, { timeout: 10000 });
    await page.waitForTimeout(115);
    await page.evaluate(() => {
      const state = window.__BAG__.state;
      const holdLife = (item) => {
        const ratio = item.life / item.maxLife;
        item.maxLife = 100000;
        item.life = ratio * item.maxLife;
      };
      if (state.impactFocus) holdLife(state.impactFocus);
      state.rings.forEach(holdLife);
      state.particles.forEach((particle) => {
        holdLife(particle);
        particle.vx = 0;
        particle.vy = 0;
        particle.vz = 0;
        particle.gravity = 0;
      });
      state.shake = 0;
      state.resolveTimer = 100000;
      document.querySelector(".masthead").style.visibility = "hidden";
      document.getElementById("worldHud").style.visibility = "hidden";
    });
    await page.waitForTimeout(480);
    await page.screenshot({ path: path.join(evidence, "04-premium-impact.png") });

    if (errors.length) throw new Error(`Evidence capture page errors: ${errors.join(" | ")}`);
    console.log("PASS premium title, field, aim, and impact evidence captured");
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
