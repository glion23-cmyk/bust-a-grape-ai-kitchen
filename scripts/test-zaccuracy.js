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
  createElement: () => ({ classList: { toggle: ()=>{} }, dataset: {}, addEventListener: ()=>{}, setAttribute: ()=>{} })
};
const navigator = {};
global.window = window; global.document = document; global.navigator = navigator;
global.requestAnimationFrame = () => {}; global.Math.random = () => 0.42; global.console.warn = () => {};
global.Image = function() { this.onload = ()=>{}; }; window.Image = global.Image;
global.Audio = function() { this.play = ()=>{}; };

let rAFCallback = null;
global.requestAnimationFrame = (cb) => { rAFCallback = cb; };

const modifiedGameJs = gameJs.replace(
  'setAim(angle, power) {',
  'impactProjectile,\n    carts,\n    setAim(angle, power) {'
).replace(
  'return {',
  'return { zAccuracy,' 
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
