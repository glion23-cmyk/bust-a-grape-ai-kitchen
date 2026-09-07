const fs = require('fs');
const path = require('path');

const gameJs = fs.readFileSync(path.join(__dirname, '../game.js'), 'utf8');

// Simple DOM mock
const window = {
  addEventListener: () => {}, setTimeout: (cb) => cb(),
  visualViewport: { addEventListener: () => {} },
  innerWidth: 1280,
  innerHeight: 720,
  performance: { now: () => 0 },
  devicePixelRatio: 1
};
const document = {
  getElementById: (id) => ({
    getContext: () => ({ setTransform:()=>{}, globalAlpha:1, fillStyle:'', fillRect:()=>{}, save:()=>{}, translate:()=>{}, rotate:()=>{}, scale:()=>{}, textAlign:"", font:"", lineWidth:1, lineJoin:"", lineCap:"", letterSpacing:"", globalAlpha:1, createLinearGradient:()=>({addColorStop:()=>{}}), beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, quadraticCurveTo:()=>{}, measureText:()=>({width:10}), closePath:()=>{}, fill:()=>{}, clip:()=>{}, stroke:()=>{}, arc:()=>{}, ellipse:()=>{}, drawImage:()=>{}, restore:()=>{}, setLineDash:()=>{}, strokeRect:()=>{}, strokeText:()=>{}, fillText:()=>{}, createPattern:()=>({}), setTransform:()=>{} }),
    width: 1280, height: 720,
    style: {},
    classList: { add: ()=>{}, remove: ()=>{}, toggle: ()=>{} }, replaceChildren: ()=>{}, appendChild: ()=>{}, querySelectorAll: ()=>[],
    addEventListener: () => {}, setTimeout: (cb) => cb(),
    setAttribute: () => {}
  }),
  documentElement: { style: { setProperty: () => {} } },
  body: { classList: { add: () => {} } },
  createElement: () => ({
    classList: { toggle: ()=>{} },
    dataset: {},
    style: { setProperty: ()=>{} },
    addEventListener: ()=>{},
    setAttribute: ()=>{}
  })
};
const navigator = {};

// Mock globals
global.window = window;
global.document = document;
global.navigator = navigator;
global.requestAnimationFrame = () => {};
global.Math.random = () => 0.42;
global.console.warn = () => {};
global.Image = function() { this.onload = ()=>{}; };
window.Image = global.Image;
global.localStorage = window.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

// Evaluate game.js
try {
  eval(gameJs);
} catch (e) {
  console.error("Syntax or runtime error in game.js:", e);
  process.exit(1);
}

let BAG = window.__BAG__;

function runShot(angle, power, cut) {
  BAG.start(); // reset match
  const p = BAG.snapshot();
  BAG.setAim(angle, power);
  BAG.state.aimCut = cut;
  BAG.fire();
  
  // step for 2 seconds
  for (let i = 0; i < 240; i++) {
    // 120 FPS simulation
    BAG.state.elapsed += 1/120;
    if (BAG.state.phase === "ceremony" && BAG.state.ceremony) {
       BAG.state.ceremony.elapsed += 1/120;
       if (BAG.state.ceremony.elapsed >= BAG.state.ceremony.duration) {
         // This logic is trapped in the closure, so we need to mock it if we can't trigger it.
         // Actually, `frame(performance.now())` is closed over, but we can't easily call `frame()`.
         // Wait! We can't access `frame` directly because it's inside the IIFE and not exported.
       }
    }
  }
}

// Since `frame` is internal and driven by rAF, our mock rAF just captures it.
let rAFCallback = null;
global.requestAnimationFrame = (cb) => { rAFCallback = cb; };

// Reload game.js with captured rAF
eval(gameJs);
BAG = window.__BAG__;

function tick(ms) {
  if (rAFCallback) {
    const cb = rAFCallback;
    rAFCallback = null;
    cb(ms);
  } else {
    console.log("No rAFCallback!");
  }
}

// Test AI turn
BAG.start();
BAG.state.turn = "enemy";
BAG.state.phase = "intermission";
BAG.state.intermission = 0;
BAG.state.aiTurns = 0;
let globalTime = 0;
// Trigger AI aim which uses simulateAiShot
globalTime += 16.666; tick(globalTime);
globalTime += 16.666; tick(globalTime);
if (BAG.state.phase !== "ceremony" || BAG.state.ceremony?.shooterId !== "enemy") {
  console.error("FAIL: AI did not solve an aim and enter its launch ceremony");
  process.exit(1);
}

function runShotAndRecord(fps, cut = 0.5, withCrater = false, craterZ = 0) {
  tick(globalTime); // Sync previousTime
  BAG.start();
  if (withCrater) {
    // Add a huge crater precisely where the shot is going to land
    BAG.state.craters.push({ x: 992, z: craterZ, radius: 100, depth: 80 });
  }
  BAG.setAim(50, 50);
  BAG.state.aimCut = cut;
  
  window.__FIXED_SAMPLES__ = [];
  BAG.fire();

  let impactCrater = null;
  const dt = 1000 / fps;
  let collisionTime = null;
  let t = 0;
  
  // limit to max 8 seconds
  for (let i = 0; i < fps * 8; i++) {
    globalTime += dt;
    t += dt;
    tick(globalTime);
    const currentCraters = BAG.state.craters || [];
    const newCraterCount = withCrater ? 2 : 1;
    if (currentCraters.length >= newCraterCount && !impactCrater) {
      impactCrater = currentCraters[currentCraters.length - 1];
      collisionTime = t;
    }
  }
  
  const samples = window.__FIXED_SAMPLES__;
  window.__FIXED_SAMPLES__ = null;
  return { samples, impactCrater, collisionTime };
}

const res60 = runShotAndRecord(60);
const res120 = runShotAndRecord(120);

// Assert they reached the same impact
if (!res60.impactCrater || !res120.impactCrater) {
  console.error("FAIL: No crater formed in 60/120 comparison");
  process.exit(1);
}

if (res60.samples.length !== res120.samples.length) {
  console.error(`FAIL: Fixed-step sample counts differ (${res60.samples.length} vs ${res120.samples.length})`);
  process.exit(1);
}

for (let i = 0; i < res60.samples.length; i++) {
  const s60 = res60.samples[i];
  const s120 = res120.samples[i];
  if (Math.abs(s60.x - s120.x) > 0.1 || Math.abs(s60.y - s120.y) > 0.1 || Math.abs(s60.z - s120.z) > 0.1) {
    console.error(`FAIL: Trajectory 60fps step ${i} diverged from 120fps`);
    process.exit(1);
  }
}

// Test z-lane independence over a crater
// Shot 1: passes right over the crater (cut 0 => z~=0), crater is at z=0. Should hit crater and take longer to land.
const shotOverCrater = runShotAndRecord(60, 0, true, 0);

// Shot 2: passes far from crater (cut 0 => z~=0), crater is at z=500. Should hit normal ground.
const shotAwayFromCrater = runShotAndRecord(60, 0, true, 500);

if (!shotOverCrater.impactCrater || !shotAwayFromCrater.impactCrater) {
  console.error("FAIL: Missing craters in z-lane test");
  process.exit(1);
}

if (Math.abs(shotOverCrater.collisionTime - shotAwayFromCrater.collisionTime) < 10) {
  console.error(`FAIL: Crater at z=0 and z=500 resulted in the same collision time (${shotOverCrater.collisionTime}ms). Z-lanes are not independent.`);
  console.log("shotOverCrater crater:", shotOverCrater.impactCrater);
  console.log("shotAwayFromCrater crater:", shotAwayFromCrater.impactCrater);
  process.exit(1);
}

console.log("PASS: Deterministic trajectory across frame rates and independent z-lane ground collision verified.");
