const fs = require('fs');
const path = require('path');
const gameJs = fs.readFileSync(path.join(__dirname, '../game.js'), 'utf8');

// Mock DOM
const window = {
  addEventListener: () => {}, setTimeout: (cb) => cb(),
  visualViewport: { addEventListener: () => {} },
  innerWidth: 1280, innerHeight: 720, performance: { now: () => 0 }, devicePixelRatio: 1
};
const document = {
  getElementById: (id) => ({
    getContext: () => ({ setTransform:()=>{}, globalAlpha:1, fillStyle:'', fillRect:()=>{}, save:()=>{}, translate:()=>{}, rotate:()=>{}, scale:()=>{}, textAlign:"", font:"", lineWidth:1, lineJoin:"", lineCap:"", letterSpacing:"", createLinearGradient:()=>({addColorStop:()=>{}}), beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, quadraticCurveTo:()=>{}, measureText:()=>({width:10}), closePath:()=>{}, fill:()=>{}, clip:()=>{}, stroke:()=>{}, arc:()=>{}, ellipse:()=>{}, drawImage:()=>{}, restore:()=>{}, setLineDash:()=>{}, strokeRect:()=>{}, strokeText:()=>{}, fillText:()=>{}, createPattern:()=>({}), setTransform:()=>{} }),
    width: 1280, height: 720, style: {}, classList: { add: ()=>{}, remove: ()=>{}, toggle: ()=>{} }, replaceChildren: ()=>{}, appendChild: ()=>{}, querySelectorAll: ()=>[], addEventListener: () => {}, setTimeout: (cb) => cb(), setAttribute: () => {}
  }),
  documentElement: { style: { setProperty: () => {} } }, body: { classList: { add: () => {} } },
  createElement: () => ({
    classList: { toggle: ()=>{} },
    dataset: {},
    style: { setProperty: ()=>{} },
    addEventListener: ()=>{},
    setAttribute: ()=>{}
  })
};
const navigator = {};
global.window = window; global.document = document; global.navigator = navigator;
global.requestAnimationFrame = () => {}; global.Math.random = () => 0.42; global.console.warn = () => {};
global.Image = function() { this.onload = ()=>{}; }; window.Image = global.Image;
global.Audio = function() { this.play = ()=>{}; };
global.localStorage = window.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

let rAFCallback = null;
global.requestAnimationFrame = (cb) => { rAFCallback = cb; };

const modifiedGameJs = gameJs.replace(
  'setAim(angle, power) {',
  'startAiTurn,\n    zAccuracy,\n    impactProjectile,\n    carts,\n    setAim(angle, power) {'
);

try { eval(modifiedGameJs); } catch (e) { console.error(e); process.exit(1); }
let BAG = window.__BAG__;

function testShot(zDelta) {
  BAG.start();
  BAG.state.volley = {
    lotId: "lug", damage: { player: 0, enemy: 0 }, shooterId: "player", hitDirect: false
  };
  BAG.carts.enemy.hp = 3;
  BAG.carts.enemy.z = 0;

  BAG.impactProjectile({
    owner: "player", lotId: "lug", x: BAG.carts.enemy.x, y: 0, z: zDelta,
    vx: 0, vy: 100, vz: 0, radius: 15, age: 0, trailClock: 0, trail: []
  }, BAG.carts.enemy);

  return 3 - BAG.carts.enemy.hp;
}

const dmgDead = testShot(10);
const dmgGraze = testShot(30);
const dmgWide = testShot(50);

console.log("Dead Lane damage:", dmgDead.toFixed(2));
console.log("Graze damage:", dmgGraze.toFixed(2));
console.log("Wide damage:", dmgWide.toFixed(2));

if (Math.abs(dmgDead - 2.3) > 0.01 || Math.abs(dmgGraze - 2.0) > 0.01 || Math.abs(dmgWide - 1.6) > 0.01) {
  console.error("FAIL: multipliers incorrect");
  process.exit(1);
}
console.log("PASS: zAccuracy multipliers verified.");

function seededRandom(seed) {
  let cursor = seed;
  return () => {
    const value = Math.sin(cursor++) * 10000;
    return value - Math.floor(value);
  };
}

function sampleAiTiers(seed, total) {
  global.Math.random = seededRandom(seed);
  BAG.start();
  const sequence = [];
  for (let i = 0; i < total; i += 1) {
    BAG.state.mode = "match";
    BAG.state.turn = "enemy";
    BAG.startAiTurn();

    const lot = BAG.LOTS[BAG.state.selected];
    const radians = BAG.state.aimAngle * Math.PI / 180;
    const speed = (330 + BAG.state.aimPower * 6.5) * lot.speed;
    const vx = Math.cos(radians) * speed;
    const distance = Math.abs(BAG.carts.player.x - BAG.carts.enemy.x);
    const flightTime = distance / vx;
    const targetPlaneZ = BAG.state.aimCut * 120 * flightTime;
    sequence.push(BAG.zAccuracy(targetPlaneZ, BAG.carts.player.z).tier);
  }
  return sequence;
}

console.log("\nTesting deterministic AI aim z-spread distribution...");
const total = 1000;
const sequenceA = sampleAiTiers(1, total);
const sequenceB = sampleAiTiers(1, total);
if (JSON.stringify(sequenceA) !== JSON.stringify(sequenceB)) {
  console.error("FAIL: Identical seeds produced different AI tier sequences");
  process.exit(1);
}

const tiers = sequenceA.reduce((counts, tier) => {
  counts[tier] += 1;
  return counts;
}, { DEAD_LANE: 0, GRAZE: 0, WIDE: 0 });

console.log(`Distribution over ${total} shots:`);
console.log(`  Dead Lane: ${((tiers.DEAD_LANE / total) * 100).toFixed(1)}%`);
console.log(`  Graze:     ${((tiers.GRAZE / total) * 100).toFixed(1)}%`);
console.log(`  Wide:      ${((tiers.WIDE / total) * 100).toFixed(1)}%`);

if (tiers.DEAD_LANE / total < 0.1 || tiers.DEAD_LANE / total > 0.3) {
  console.error("FAIL: Dead Lane distribution outside 20% +/- 10%");
  process.exit(1);
}
if (tiers.GRAZE / total < 0.4 || tiers.GRAZE / total > 0.6) {
  console.error("FAIL: Graze distribution outside 50% +/- 10%");
  process.exit(1);
}
if (tiers.WIDE / total < 0.2 || tiers.WIDE / total > 0.4) {
  console.error("FAIL: Wide distribution outside 30% +/- 10%");
  process.exit(1);
}
console.log("PASS: AI z-spread distribution meets requirements.");
