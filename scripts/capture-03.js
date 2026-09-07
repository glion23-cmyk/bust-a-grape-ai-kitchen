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
    if (!fs.existsSync(filePath)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { "Content-Type": mimes[path.extname(filePath)] || "text/plain" });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise(resolve => server.listen(0, () => resolve({ server, baseUrl: `http://localhost:${server.address().port}` })));
}

async function run() {
  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 844, height: 390 } });
    const page = await context.newPage();
    
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__BAG__?.state);
    
    // 1. Aim phase
    await page.locator("#startButton").click();
    await page.waitForFunction(() => window.__BAG__.state.phase === "aim");
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(root, "collab", "evidence", "03-aim-phase.png") });
    console.log("Captured 03-aim-phase.png");
    
    // 2. Launchers 3/4 angle
    await page.evaluate(() => {
       const game = window.__BAG__;
       game.carts.player.x = game.W / 2 - 100;
       game.carts.enemy.x = game.W / 2 + 100;
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(root, "collab", "evidence", "03-launchers.png") });
    console.log("Captured 03-launchers.png");
    
    // 3. TABLE ceremony
    await page.evaluate(() => {
       const game = window.__BAG__;
       game.carts.player.x = 222;
       game.carts.enemy.x = 1058;
       game.start();
       game.select("table");
       game.setAim(45, 50);
       game.fire();
    });
    await page.waitForTimeout(520);
    await page.screenshot({ path: path.join(root, "collab", "evidence", "03-table-ceremony.png") });
    console.log("Captured 03-table-ceremony.png");
    
    // 4. Live LUG impact, captured while the camera punch and juice are active.
    await page.goto(`${baseUrl}/index.html`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.__BAG__?.state);
    await page.evaluate(() => {
       const game = window.__BAG__;
       game.start();
       game.select("lug");
       game.setAim(34, 58);
       game.fire();
    });
    await page.waitForFunction(() => window.__BAG__.state.impactFocus, { timeout: 8000 });
    await page.waitForTimeout(70);
    await page.screenshot({ path: path.join(root, "collab", "evidence", "03-impact-comparison.png") });
    console.log("Captured 03-impact-comparison.png");
    
    await context.close();
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
run().catch(console.error);
