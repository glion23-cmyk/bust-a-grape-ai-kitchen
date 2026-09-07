const { chromium } = require("playwright");
const path = require("path");
const http = require("http");
const fs = require("fs");

const root = path.resolve(__dirname, "..");
const mimes = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png" };

async function startServer() {
  const server = http.createServer((req, res) => {
    let urlPath = req.url.split("?")[0];
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = path.join(root, urlPath);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, { "Content-Type": mimes[path.extname(filePath)] || "text/plain" });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, () => resolve({ server, baseUrl: `http://localhost:${server.address().port}` }));
  });
}

function collectPageErrors(page) {
  const errors = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

async function waitForGame(page, baseUrl) {
  await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__BAG__?.state);
  return page;
}

async function run() {
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 740, height: 360 } });
    const page = await context.newPage();
    const errors = collectPageErrors(page);
    await waitForGame(page, baseUrl);

    await page.locator("#startButton").click();
    await page.waitForFunction(() => window.__BAG__.state.phase === "aim");

    const getGrabRect = async (shooterId) => {
      return await page.evaluate((id) => window.__BAG__.getGrabRect(id), shooterId);
    };

    const enemyRect = await getGrabRect("enemy");
    if (!enemyRect) throw new Error("enemy grab rect not found");
    await page.mouse.move(enemyRect.left + enemyRect.width / 2, enemyRect.top + enemyRect.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    let phase = await page.evaluate(() => window.__BAG__.state.phase);
    if (phase !== "aim") throw new Error("Gesture gate failed: tapping opponent fired shot");
    console.log("PASS 1. Gesture gate: opponent tap ignored");

    const playerRect = await getGrabRect("player");
    if (!playerRect) throw new Error("player grab rect not found");
    await page.mouse.move(playerRect.left + playerRect.width / 2, playerRect.top + playerRect.height / 2);
    await page.mouse.down();
    await page.mouse.move(playerRect.left + playerRect.width / 2, playerRect.top + playerRect.height / 2 + 10, { steps: 5 });
    await page.mouse.up();
    phase = await page.evaluate(() => window.__BAG__.state.phase);
    if (phase !== "aim") throw new Error("Gesture gate failed: dead-zone cancel triggered shot");
    console.log("PASS 2. Gesture gate: dead-zone cancel");

    await page.mouse.move(playerRect.left + playerRect.width / 2, playerRect.top + playerRect.height / 2);
    await page.mouse.down();
    await page.mouse.move(Math.max(2, playerRect.left - 145), playerRect.top + playerRect.height / 2 + 70, { steps: 12 });
    const strongPull = await page.evaluate(() => ({
      power: window.__BAG__.state.aimPower,
      angle: window.__BAG__.state.aimAngle,
      valid: window.__BAG__.gestureState.valid
    }));
    if (!strongPull.valid || strongPull.power < 88 || strongPull.angle > 38) {
      throw new Error(`Phone pull range failed: ${JSON.stringify(strongPull)}`);
    }
    await page.locator("#c").dispatchEvent("pointercancel", { pointerId: 1 });
    await page.mouse.up();
    console.log("PASS 3. Strong low pull is reachable by a phone thumb");

    const renderProof = await page.evaluate(() => ({
      info: window.__BAG__.rendererInfo(),
      yardBottles: document.querySelectorAll("#yardHp .bottle").length,
      lateBottles: document.querySelectorAll("#lateHp .bottle").length,
      canvasOpacity: document.getElementById("c").style.opacity
    }));
    if (renderProof.info.mode !== "procedural-3d" || renderProof.info.playerParts < 1 || renderProof.info.enemyParts < 1 || renderProof.info.pipCount !== 10 || renderProof.canvasOpacity !== "0") {
      throw new Error(`True-3D identity proof failed: ${JSON.stringify(renderProof)}`);
    }
    if (renderProof.yardBottles !== 4 || renderProof.lateBottles !== 4) throw new Error("Four-bottle match contract failed");
    console.log(`PASS 4. True-3D identity active (${renderProof.info.triangles} triangles, ${renderProof.info.calls} calls)`);

    await page.mouse.move(playerRect.left + playerRect.width / 2, playerRect.top + playerRect.height / 2);
    await page.mouse.down();
    await page.mouse.move(playerRect.left + playerRect.width / 2 - 40, playerRect.top + playerRect.height / 2 + 50, { steps: 5 });
    await page.mouse.up();
    await page.waitForFunction(() => window.__BAG__.state.phase === "ceremony");
    console.log("PASS 5. Gesture gate: valid pull triggers ceremony");

    await page.waitForFunction(() => {
      const state = window.__BAG__.state;
      return state.aiTurns >= 1 && state.turn === "player" && state.phase === "aim";
    }, { timeout: 20000 });
    const completedLoop = await page.evaluate(() => ({
      craters: window.__BAG__.state.craters.length,
      stains: window.__BAG__.state.stains.length,
      calls: window.__BAG__.rendererInfo().calls,
      mode: window.__BAG__.state.mode
    }));
    if (completedLoop.mode !== "match" || completedLoop.craters < 1 || completedLoop.stains < 1) {
      throw new Error(`Complete turn loop failed: ${JSON.stringify(completedLoop)}`);
    }
    if (completedLoop.calls > 190) throw new Error(`Render-call budget exceeded: ${completedLoop.calls}`);
    console.log(`PASS 6. Player/AI turn loop returns control with persistent field damage (${completedLoop.calls} calls)`);

    const skillContext = await browser.newContext({ viewport: { width: 740, height: 360 } });
    const skillPage = await skillContext.newPage();
    await waitForGame(skillPage, baseUrl);
    await skillPage.evaluate(() => {
      window.__BAG__.start();
      window.__BAG__.state.windSeed = 2147483648;
      window.__BAG__.select("table");
      window.__BAG__.setAim(45, 54);
      window.__BAG__.fire();
    });
    await skillPage.waitForFunction(() => window.__BAG__.state.turn === "enemy" && window.__BAG__.state.phase === "intermission", { timeout: 10000 });
    const skillShot = await skillPage.evaluate(() => ({
      lateHp: window.__BAG__.carts.enemy.hp,
      impactX: window.__BAG__.state.rutGhost?.impactX,
      stains: window.__BAG__.state.stains.length
    }));
    if (!(skillShot.lateHp < 4) || !Number.isFinite(skillShot.impactX) || skillShot.stains < 1) {
      throw new Error(`Deterministic skill shot failed: ${JSON.stringify(skillShot)}`);
    }
    console.log(`PASS 7. Deterministic 45°/54% skill shot scores at x=${Math.round(skillShot.impactX)}`);
    await skillContext.close();

    const seriesContext = await browser.newContext({ viewport: { width: 740, height: 360 } });
    const seriesPage = await seriesContext.newPage();
    await waitForGame(seriesPage, baseUrl);
    await seriesPage.locator("#startSeriesButton").click();
    await seriesPage.evaluate(() => {
      window.__BAG__.carts.enemy.hp = 0.2;
      window.__BAG__.state.windSeed = 2147483648;
      window.__BAG__.setAim(45, 54);
      window.__BAG__.fire();
    });
    await seriesPage.waitForFunction(() => !document.getElementById("grudgeCard").hidden, { timeout: 10000 });
    const seriesScore = await seriesPage.locator("#grudgeScore").textContent();
    if (seriesScore.trim() !== "1 - 0") throw new Error(`Series score failed: ${seriesScore}`);
    await seriesPage.locator("#grudgeNext").click();
    const secondMatch = await seriesPage.evaluate(() => window.__BAG__.snapshot());
    if (secondMatch.mode !== "match" || secondMatch.phase !== "aim" || secondMatch.turn !== "player") {
      throw new Error(`Series next-match transition failed: ${JSON.stringify(secondMatch)}`);
    }
    console.log("PASS 8. Best-of-three Grudge Card advances to the next match");
    await seriesContext.close();

    for (const vp of [{ width: 740, height: 360 }, { width: 844, height: 390 }]) {
      const pContext = await browser.newContext({ viewport: vp });
      const p = await pContext.newPage();
      await waitForGame(p, baseUrl);
      await p.locator("#startButton").click();
      await p.waitForFunction(() => window.__BAG__.state.phase === "aim");

      const layoutPass = await p.evaluate(() => {
        const overflow = document.documentElement.scrollWidth > window.innerWidth || document.documentElement.scrollHeight > window.innerHeight;
        const buttons = Array.from(document.querySelectorAll('.lot-button'));
        const sizePass = buttons.every(b => b.offsetWidth >= 48);
        return !overflow && sizePass;
      });
      if (!layoutPass) throw new Error(`Phone layout failed at ${vp.width}x${vp.height}`);
      console.log(`PASS 9. Phone layout at ${vp.width}x${vp.height}`);
      await pContext.close();
    }

    if (errors.length) throw new Error(`Page errors: ${errors.join(" | ")}`);
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
