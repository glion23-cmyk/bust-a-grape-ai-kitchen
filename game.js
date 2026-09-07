(() => {
  "use strict";

  const canvas = document.getElementById("c");
  const W = canvas.width;
  const H = canvas.height;
  const GRAVITY = 620;
  const FIXED_STEP = 1 / 120;

  function syncVisualViewport() {
    const viewport = window.visualViewport;
    const width = Math.round(viewport?.width || window.innerWidth);
    const height = Math.round(viewport?.height || window.innerHeight);
    document.documentElement.style.setProperty("--app-width", `${width}px`);
    document.documentElement.style.setProperty("--app-height", `${height}px`);
  }

  syncVisualViewport();
  window.addEventListener("resize", syncVisualViewport, { passive: true });
  window.visualViewport?.addEventListener("resize", syncVisualViewport, { passive: true });

  const DOM = {
    bootScreen: document.getElementById("bootScreen"),
    line: document.getElementById("line"),
    worldHud: document.getElementById("worldHud"),
    yardCard: document.getElementById("yardCard"),
    lateCard: document.getElementById("lateCard"),
    yardHp: document.getElementById("yardHp"),
    lateHp: document.getElementById("lateHp"),
    lotChip: document.getElementById("lotChip"),
    turnChip: document.getElementById("turnChip"),
    aimTelemetry: document.getElementById("aimTelemetry"),
    aimAngleValue: document.getElementById("aimAngleValue"),
    aimPowerValue: document.getElementById("aimPowerValue"),
    aimLaneValue: document.getElementById("aimLaneValue"),
    protocolBanner: document.getElementById("protocolBanner"),
    protocolLabel: document.getElementById("protocolLabel"),
    protocolText: document.getElementById("protocolText"),
    fieldHint: document.getElementById("fieldHint"),
    titleScreen: document.getElementById("titleScreen"),
    resultScreen: document.getElementById("resultScreen"),
    resultWord: document.getElementById("resultWord"),
    resultCopy: document.getElementById("resultCopy"),
    resultStats: document.getElementById("resultStats"),
    startButton: document.getElementById("startButton"),
    startSeriesButton: document.getElementById("startSeriesButton"),
    rematchButton: document.getElementById("rematchButton"),
    rematchSeriesButton: document.getElementById("rematchSeriesButton"),
    grudgeCard: document.getElementById("grudgeCard"),
    grudgeScore: document.getElementById("grudgeScore"),
    grudgeLeader: document.getElementById("grudgeLeader"),
    grudgeNext: document.getElementById("grudgeNext"),
    soundToggle: document.getElementById("soundToggle"),
    portraitContinue: document.getElementById("portraitContinue"),
    lots: document.getElementById("lots"),
    selectedLotName: document.getElementById("selectedLotName"),
    controlHeadline: document.getElementById("controlHeadline"),
    controlHelp: document.getElementById("controlHelp"),
    fieldStatus: document.getElementById("fieldStatus")
  };

  const bootStartedAt = performance.now();
  let bootRendererReady = false;
  let bootFontsReady = !document.fonts;

  function finishBoot(force = false) {
    if (!DOM.bootScreen || DOM.bootScreen.classList?.contains?.("ready")) return;
    if (!force && (!bootRendererReady || !bootFontsReady)) return;
    const minimumHold = Math.max(0, 260 - (performance.now() - bootStartedAt));
    window.setTimeout(() => DOM.bootScreen?.classList.add("ready"), minimumHold);
  }

  window.addEventListener("bag:renderer-ready", () => {
    bootRendererReady = true;
    finishBoot();
  }, { once: true });

  if (document.fonts) {
    document.fonts.ready.then(() => {
      bootFontsReady = true;
      finishBoot();
    });
  }

  window.setTimeout(() => finishBoot(true), 3200);

  const screenTimers = new WeakMap();

  function revealScreen(element) {
    if (!element) return;
    window.clearTimeout?.(screenTimers.get(element));
    element.classList.remove("is-leaving");
    element.hidden = false;
  }

  function concealScreen(element, immediate = false) {
    if (!element || element.hidden) return;
    window.clearTimeout?.(screenTimers.get(element));
    if (immediate) {
      element.hidden = true;
      element.classList.remove("is-leaving");
      return;
    }
    element.classList.add("is-leaving");
    const timer = window.setTimeout(() => {
      element.hidden = true;
      element.classList.remove("is-leaving");
    }, 190);
    screenTimers.set(element, timer);
  }

  const COLORS = {
    dirt: "#3a2a1c",
    oxblood: "#6b1c2a",
    cream: "#f3e6c8",
    juice: "#5a1638",
    ink: "#1a100c",
    sky: "#8aa7b8",
    horizon: "#c4b49a",
    copper: "#76503b"
  };

  const LOTS = {
    table: {
      id: "table", number: "01", name: "TABLE", fullName: "TABLE BERRY",
      note: "HONEST / MEDIUM", speed: 1, gravity: 1, radius: 8,
      direct: 1, splash: 1, splashRadius: 50, damageCap: 1,
      craterRadius: 26, craterDepth: 15, shake: 7, ceremony: 0.62,
      protocol: "WIPE · WEIGH · NOD · CLEAR THE LIP"
    },
    pea: {
      id: "pea", number: "02", name: "PEA", fullName: "PEA BERRY",
      note: "FAST / DIRECT", speed: 1.19, gravity: 0.92, radius: 4,
      direct: 2, splash: 0, splashRadius: 0, damageCap: 2,
      craterRadius: 10, craterDepth: 5, shake: 3, ceremony: 0.68,
      protocol: "CALIPERS · ARGUE · RE-MEASURE · SEND IT"
    },
    cluster: {
      id: "cluster", number: "03", name: "CLUSTER", fullName: "WHOLE CLUSTER",
      note: "SPLITS / CHAOS", speed: 0.94, gravity: 1, radius: 9,
      direct: 1, splash: 1, splashRadius: 34, damageCap: 2,
      craterRadius: 18, craterDepth: 9, shake: 5, ceremony: 0.82,
      protocol: "FIVE-PIP PILE-ON · COUNT STEMS · HEAVE"
    },
    lug: {
      id: "lug", number: "04", name: "LUG", fullName: "FULL LUG",
      note: "HEAVY / CRATER", speed: 0.8, gravity: 1.02, radius: 15,
      direct: 2, splash: 1, splashRadius: 116, damageCap: 2,
      craterRadius: 82, craterDepth: 52, shake: 18, ceremony: 0.96,
      protocol: "BLOCK-AND-TACKLE · MIND THE ROPE · CUT LOOSE"
    }
  };

  const CEREMONIES = {
    table: { color: [COLORS.juice, COLORS.cream], kind: "juice", shape: "drop", punch: -120, primary: 20, vy: -35, vz: 175, size: 1.65 },
    pea: { color: COLORS.cream, kind: "smoke", shape: "spark", punch: -100, primary: 24, vy: -135, vz: 95, size: 0.9 },
    cluster: { color: [COLORS.oxblood, COLORS.cream], kind: "juice", shape: "shard", punch: -140, primary: 22, vx: 135, vy: -55, vz: 145, size: 1.75 },
    lug: { color: [COLORS.juice, COLORS.oxblood, COLORS.copper, COLORS.ink], kind: "dirt", shape: "clod", punch: -195, primary: 24, vy: -185, vz: 155, size: 1.68 }
  };

  const CEREMONY_CALLS = {
    table: "THUMPER RINGS THE PRESS",
    pea: "ZIPPER THREADS THE EYE",
    cluster: "PULPER OPENS THE WHOLE LOT",
    lug: "WIDOWMAKER FORECLOSES"
  };

  const LOT_ORDER = ["table", "pea", "cluster", "lug"];

  const LINES = {
    start: [
      "You couldn’t bust a grape in a food fight.",
      "Yard and Late are in the ditch. Somebody’s leaving as salad.",
      "Pips on the lip. Dignity behind the chalk line.",
      "One grape, one chance, several avoidable decisions."
    ],
    lot: {
      table: ["Table fruit. Clean line. No alibis.", "They wiped it twice. Try to deserve it."],
      pea: ["A pea berry. Whispering violence across county lines.", "Calipers say legal. Faces say otherwise."],
      cluster: ["Five Pips underneath it and still no union.", "Whole cluster. Finally, a food fight."],
      lug: ["That is not ammunition. That is inventory fraud.", "Signed, hoisted, and regretted in advance."]
    },
    fire: [
      "Fruit airborne. Hide the good glassware.",
      "Gravity has the call from here.",
      "Clean release. Filthy intention.",
      "And the vintage is traveling."
    ],
    hit: [
      "Bottled.",
      "Pressed with prejudice.",
      "Appellation: forehead.",
      "Put that stain in the permanent record.",
      "That berry paid rent."
    ],
    hardHit: [
      "Two bottles gone. That one had paperwork.",
      "That was not a tasting. That was collections.",
      "Somebody call the cooper."
    ],
    near: [
      "Close enough to smell expensive.",
      "Half a boot. The Pips will argue about it all winter.",
      "That miss had intent."
    ],
    miss: [
      "You threw a grape at Kansas and Kansas won.",
      "Notes of dirt. Long finish. No damage.",
      "The hill accepts your donation.",
      "A beautiful arc to nowhere taxable.",
      "Wind was calm. Your hands were not."
    ],
    self: [
      "Harvested himself. Efficient, in a legal sense.",
      "Eat your own inventory.",
      "The only accurate betrayal in the yard."
    ],
    split: ["Cluster opened. Five little lawsuits.", "Bunch broke clean. Everybody gets blamed."],
    playerWin: ["Vinegar. Seal the Late cart and sweep the stems.", "The Yard takes the lot. Try to act surprised."],
    playerLose: ["You couldn’t bust a grape in a food fight.", "Must. The Pips have declined comment."],
    draw: ["Compost. Everybody lost with conviction.", "Mutual pulp. Put the whole lot in the ledger."],
    streak: ["Back-to-back stains. Somebody found the range.", "Two in a row. Now it feels personal."]
  };

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
  const haptic = (pattern) => {
    try { navigator.vibrate?.(pattern); } catch (_) {}
  };
  const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const freshAimMemory = () => ({
    table: { angle: 50, power: 50, cut: 0 },
    pea: { angle: 50, power: 30, cut: 0 },
    cluster: { angle: 50, power: 57, cut: 0 },
    lug: { angle: 50, power: 78, cut: 0 }
  });

  let fieldSeed = 117;
  function seededRandom() {
    fieldSeed = (fieldSeed * 1664525 + 1013904223) >>> 0;
    return fieldSeed / 4294967296;
  }

  class SoundBoard {
    constructor() {
      this.context = null;
      this.output = null;
      this.sampleBuffers = new Map();
      this.sampleLoadPromise = null;
      this.sampleUrls = {
        press: "audio/sfx/ui-press.mp3",
        select: "audio/sfx/ui-select.mp3",
        launcher: "audio/sfx/launcher-clank.mp3",
        impact: "audio/sfx/grape-impact.mp3",
        bottle: "audio/sfx/bottle-break.mp3"
      };
      this.enabled = true;
    }

    wake() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.context = new AudioContext();
          const compressor = this.context.createDynamicsCompressor();
          const master = this.context.createGain();
          compressor.threshold.value = -18;
          compressor.knee.value = 14;
          compressor.ratio.value = 5;
          compressor.attack.value = 0.004;
          compressor.release.value = 0.16;
          master.gain.value = 0.78;
          master.connect(compressor).connect(this.context.destination);
          this.output = master;
          this.loadSamples();
        }
      }
      if (this.context?.state === "suspended") this.context.resume();
    }

    loadSamples() {
      if (this.sampleLoadPromise || !this.context || typeof window.fetch !== "function") return this.sampleLoadPromise;
      this.sampleLoadPromise = Promise.all(Object.entries(this.sampleUrls).map(async ([name, url]) => {
        try {
          const response = await window.fetch(url);
          if (!response.ok) return;
          const audioData = await response.arrayBuffer();
          const buffer = await this.context.decodeAudioData(audioData);
          this.sampleBuffers.set(name, buffer);
        } catch (_) {
          // The synthesized layer keeps every cue functional offline or on old browsers.
        }
      }));
      return this.sampleLoadPromise;
    }

    sample(name, volume = 0.2, playbackRate = 1) {
      if (!this.enabled || !this.context) return;
      const buffer = this.sampleBuffers.get(name);
      if (!buffer) return;
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      gain.gain.value = volume;
      source.connect(gain).connect(this.output || this.context.destination);
      source.start();
    }

    tone(frequency, duration, type = "sine", volume = 0.08, endFrequency = frequency) {
      if (!this.enabled || !this.context) return;
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(Math.max(20, frequency), now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(0.012, duration * 0.18));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(this.output || this.context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration);
    }

    noise(duration = 0.15, volume = 0.05, lowpass = 1100) {
      if (!this.enabled || !this.context) return;
      const frames = Math.max(1, Math.floor(this.context.sampleRate * duration));
      const buffer = this.context.createBuffer(1, frames, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < frames; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
      const source = this.context.createBufferSource();
      const filter = this.context.createBiquadFilter();
      const gain = this.context.createGain();
      filter.type = "lowpass";
      filter.frequency.value = lowpass;
      gain.gain.value = volume;
      source.buffer = buffer;
      source.connect(filter).connect(gain).connect(this.output || this.context.destination);
      source.start();
    }

    play(name, lotId = "table") {
      if (!this.enabled) return;
      this.wake();
      if (name === "press") {
        this.sample("press", 0.24, 0.96);
        this.tone(310, 0.035, "square", 0.018, 210);
        this.noise(0.025, 0.014, 2400);
      } else if (name === "start") {
        this.tone(98, 0.22, "sawtooth", 0.06, 147);
        window.setTimeout(() => this.tone(196, 0.22, "square", 0.035, 247), 110);
      } else if (name === "select") {
        this.sample("select", 0.22, 0.9 + Math.random() * 0.08);
        this.tone(170, 0.055, "square", 0.035, 130);
      } else if (name === "launch") {
        this.sample("launcher", lotId === "lug" ? 0.44 : 0.3, lotId === "pea" ? 1.16 : lotId === "lug" ? 0.78 : 0.96);
        this.tone(980, 0.045, "square", 0.025, 430);
        if (lotId === "pea") this.tone(520, 0.13, "square", 0.055, 240);
        else if (lotId === "lug") {
          this.noise(0.28, 0.12, 640);
          this.tone(74, 0.36, "sawtooth", 0.11, 38);
          window.setTimeout(() => this.noise(0.12, 0.055, 2100), 55);
        } else {
          this.noise(0.16, 0.07, 950);
          this.tone(130, 0.2, "triangle", 0.07, 72);
        }
      } else if (name === "split") {
        this.noise(0.12, 0.055, 1800);
        this.tone(330, 0.09, "square", 0.035, 520);
      } else if (name === "impact") {
        this.sample("impact", lotId === "lug" ? 0.62 : 0.38, lotId === "pea" ? 1.18 : lotId === "lug" ? 0.72 : 0.94);
        this.noise(lotId === "lug" ? 0.36 : 0.2, lotId === "lug" ? 0.16 : 0.09, lotId === "lug" ? 520 : 1200);
        this.tone(lotId === "lug" ? 52 : 92, lotId === "lug" ? 0.38 : 0.22, "sawtooth", 0.08, 34);
        window.setTimeout(() => this.noise(0.11, 0.035, 2600), 28);
      } else if (name === "bottle") {
        this.sample("bottle", 0.42, 0.9 + Math.random() * 0.14);
        this.tone(880, 0.12, "triangle", 0.04, 420);
      } else if (name === "win") {
        [110, 147, 196].forEach((frequency, index) => window.setTimeout(() => this.tone(frequency, 0.34, "sawtooth", 0.055, frequency * 1.35), index * 100));
      }
    }
  }

  const sound = new SoundBoard();
  const COLS = 321;
  const CELL = W / (COLS - 1);
  const terrain = new Float32Array(COLS);
  const baseTerrain = new Float32Array(COLS);
  let terrainMarks = [];

  function resetTerrain() {
    fieldSeed = 117 + Math.floor(Math.random() * 10000);
    for (let i = 0; i < COLS; i += 1) {
      const x = i * CELL;
      const leftRise = -92 * Math.exp(-Math.pow((x - 235) / 178, 2));
      const rightRise = -94 * Math.exp(-Math.pow((x - 1044) / 180, 2));
      const ditch = 29 * Math.exp(-Math.pow((x - 642) / 214, 2));
      const grit = Math.sin(x * 0.021) * 3 + Math.sin(x * 0.057 + 1.4) * 1.5;
      terrain[i] = clamp(543 + leftRise + rightRise + ditch + grit, 420, 604);
      baseTerrain[i] = terrain[i];
    }
    terrainMarks = Array.from({ length: 95 }, () => ({
      x: seededRandom() * W,
      inset: 8 + seededRandom() * 125,
      length: 3 + seededRandom() * 19,
      alpha: 0.08 + seededRandom() * 0.12,
      tilt: (seededRandom() - 0.5) * 7
    }));
  }

  function groundAt(x, z = 0) {
    const position = clamp(x / CELL, 0, COLS - 1);
    const left = Math.floor(position);
    const right = Math.min(COLS - 1, left + 1);
    let baseY = lerp(baseTerrain[left], baseTerrain[right], position - left);
    for (const c of state.craters) {
      const dx = x - c.x;
      const dz = z - (c.z || 0);
      const dist = Math.hypot(dx, dz);
      if (dist <= c.radius) {
        const bowl = Math.pow(Math.cos(dist / c.radius * Math.PI * 0.5), 2);
        baseY += c.depth * bowl;
      }
    }
    return Math.min(H - 22, baseY);
  }

  function craterAt(x, z, radius, depth) {
    state.craters.push({ x, z, radius, depth });
    const start = Math.max(0, Math.floor((x - radius) / CELL));
    const end = Math.min(COLS - 1, Math.ceil((x + radius) / CELL));
    for (let i = start; i <= end; i += 1) {
      const vx = i * CELL;
      const dx = vx - x;
      const dz = 0 - z;
      const dist = Math.hypot(dx, dz);
      if (dist <= radius) {
        const bowl = Math.pow(Math.cos(dist / radius * Math.PI * 0.5), 2);
        terrain[i] = Math.min(H - 22, terrain[i] + depth * bowl);
      }
    }
  }

  const carts = {
    player: { id: "player", side: "YARD", machine: "SIDEWINDER", x: 222, z: 0, facing: 1, hp: 4, maxHp: 4 },
    enemy: { id: "enemy", side: "LATE", machine: "BOOTLEGGER", x: 1058, z: 0, facing: -1, hp: 4, maxHp: 4 }
  };

  const state = {
    mode: "title",
    phase: "idle",
    turn: "player",
    selected: "table",
    playerSelected: "table",
    aimAngle: 50,
    aimPower: 50,
    aimCut: 0,
    windSeed: 12345,
    aimMemory: freshAimMemory(),
    craters: [],
    dragging: false,
    pointerId: null,
    ceremony: null,
    projectiles: [],
    particles: [],
    rings: [],
    floaters: [],
    stains: [],
    impactFocus: null,
    cameraPunchX: 0,
    cameraPunchZ: 0,
    shake: 0,
    resolveTimer: -1,
    intermission: 0,
    volley: null,
    aiTurns: 0,
    elapsed: 0,
    matchNumber: 0,
    firstAim: true,
    stats: null,
    series: false
  };

  const allTimeGrudge = (() => {
    try {
      const data = localStorage.getItem("BAG_GRUDGE");
      if (data) return JSON.parse(data);
    } catch (e) {}
    return { yard: 0, late: 0 };
  })();

  const rivalry = {
    yard: 0,
    late: 0,
    draws: 0,
    playerRun: 0,
    bestRun: 0,
    seriesYard: 0,
    seriesLate: 0,
    allTime: allTimeGrudge
  };

  resetTerrain();

  const recentLines = [];
  let lineSwapToken = 0;

  function pickLine(pool) {
    if (!pool?.length) return "";
    const available = pool.filter((line) => !recentLines.includes(line));
    const source = available.length ? available : pool;
    const chosen = source[Math.floor(Math.random() * source.length)];
    recentLines.push(chosen);
    while (recentLines.length > 7) recentLines.shift();
    return chosen;
  }

  function say(bucket, detail) {
    const pool = bucket === "lot" ? LINES.lot[detail] : LINES[bucket];
    const copy = pickLine(pool);
    if (!copy) return;
    const token = ++lineSwapToken;
    DOM.line.classList.add("swap");
    window.setTimeout(() => {
      if (token !== lineSwapToken) return;
      DOM.line.textContent = copy;
      DOM.line.classList.remove("swap");
    }, 105);
  }

  function makeStats() {
    return {
      shots: 0,
      scoringShots: 0,
      damage: 0,
      selfDamage: 0,
      biggestHit: 0,
      closestMiss: Infinity,
      streak: 0,
      bestStreak: 0,
      lotsUsed: new Set()
    };
  }

  function renderBottles(container, hp, label) {
    container.replaceChildren();
    for (let i = 0; i < 4; i += 1) {
      const bottle = document.createElement("i");
      const fill = clamp(hp - i, 0, 1);
      bottle.className = `bottle${fill <= 0 ? " empty" : fill < 1 ? " partial" : ""}`;
      bottle.style.setProperty("--fill-top", `${Math.round(8 + (1 - fill) * 82)}%`);
      bottle.setAttribute("aria-hidden", "true");
      container.appendChild(bottle);
    }
    container.setAttribute("aria-label", `${label}: ${Math.max(0, hp).toFixed(1)} of 4 bottles`);
  }

  function windReadout() {
    const wind = (state.windSeed / 4294967296) * 30 - 15;
    if (Math.abs(wind) < 1.5) return "WIND CALM";
    return `WIND ${wind < 0 ? "←" : "→"} ${Math.round(Math.abs(wind))}`;
  }

  function updateHud() {
    const lot = LOTS[state.selected];
    if (document.body.dataset) document.body.dataset.gameMode = state.mode;
    const playerCanAim = state.mode === "match" && state.turn === "player" && state.phase === "aim";
    DOM.yardCard.classList.toggle("active", state.mode === "match" && state.turn === "player");
    DOM.lateCard.classList.toggle("active", state.mode === "match" && state.turn === "enemy");
    DOM.lotChip.textContent = `LOT ${lot.number}`;
    DOM.selectedLotName.textContent = lot.fullName;
    DOM.turnChip.textContent = state.turn === "player" ? "PIPS ON THE LIP" : "LATE AT THE LINE";
    DOM.controlHeadline.textContent = state.mode === "result" ? "MATCH RULED" : playerCanAim && state.dragging ? `JUICE ${Math.round(state.aimPower)}%` : playerCanAim ? "YOUR SHOT" : state.phase === "ceremony" ? "CEREMONY ACTIVE" : state.turn === "enemy" ? "LATE SHOOTING" : "FIELD LIVE";
    DOM.controlHelp.textContent = state.mode === "result"
      ? "Run it back. The rivalry remembers."
      : playerCanAim
        ? state.dragging
          ? `${Math.round(state.aimAngle)}° LIFT · ${Math.abs(state.aimCut) < 0.12 ? "STRAIGHT LANE" : `${state.aimCut < 0 ? "LEFT" : "RIGHT"} HOOK ${Math.round(Math.abs(state.aimCut) * 100)}`}`
          : `${windReadout()} · ${state.stats?.shots > 0 ? "THE CHALK REMEMBERS" : "GRAB THE LIT RING"}`
        : state.mode === "title" ? "Enter the ditch to begin." : "Hands clear while the lot is moving.";
    const showAimTelemetry = playerCanAim && state.dragging;
    DOM.aimTelemetry.hidden = !showAimTelemetry;
    if (showAimTelemetry) {
      DOM.aimAngleValue.textContent = `${Math.round(state.aimAngle)}°`;
      DOM.aimPowerValue.textContent = `${Math.round(state.aimPower)}%`;
      DOM.aimLaneValue.textContent = Math.abs(state.aimCut) < 0.12
        ? "STRAIGHT"
        : `${state.aimCut < 0 ? "LEFT" : "RIGHT"} ${Math.round(Math.abs(state.aimCut) * 100)}`;
    }
    renderBottles(DOM.yardHp, carts.player.hp, "Yard health");
    renderBottles(DOM.lateHp, carts.enemy.hp, "Late health");
    DOM.lots.querySelectorAll("button").forEach((button) => {
      button.classList.toggle("selected", button.dataset.lot === state.selected);
      button.disabled = !playerCanAim;
    });
  }

  function buildLotButtons() {
    DOM.lots.replaceChildren();
    LOT_ORDER.forEach((id, index) => {
      const lot = LOTS[id];
      const button = document.createElement("button");
      button.type = "button";
      button.className = "lot-button";
      button.dataset.lot = id;
      button.setAttribute("aria-label", `${lot.name}: ${lot.note}`);
      button.innerHTML = `<span class="lot-mark mark-${id}" aria-hidden="true"></span><b>${index + 1} / ${lot.name}</b><small>${lot.note}</small>`;
      button.addEventListener("click", () => selectLot(id));
      DOM.lots.appendChild(button);
    });
  }

  function selectLot(id, quiet = false) {
    if (!LOTS[id]) return;
    if (state.mode === "match" && (state.turn !== "player" || state.phase !== "aim")) return;
    const recallAim = state.mode === "match" && state.turn === "player" && state.phase === "aim";
    if (recallAim) {
      state.aimMemory[state.playerSelected] = { angle: state.aimAngle, power: state.aimPower, cut: state.aimCut };
      const remembered = state.aimMemory[id];
      state.aimAngle = remembered.angle;
      state.aimPower = remembered.power;
      state.aimCut = remembered.cut;
    }
    state.selected = id;
    if (state.mode !== "match" || state.turn === "player") state.playerSelected = id;
    if (!quiet) sound.play("select");
    updateHud();
  }

  function resetMatch() {
    state.matchNumber += 1;
    state.mode = "match";
    state.phase = "aim";
    state.turn = "player";
    state.selected = "table";
    state.playerSelected = "table";
    state.aimAngle = 50;
    state.aimPower = 50;
    state.aimCut = 0;
    state.windSeed = Math.floor(Math.random() * 4294967296);
    state.aimMemory = freshAimMemory();
    state.dragging = false;
    state.pointerId = null;
    state.ceremony = null;
    state.projectiles = [];
    state.particles = [];
    state.rings = [];
    state.floaters = [];
    state.stains = [];
    state.craters = [];
    state.impactFocus = null;
    state.cameraPunchX = 0;
    state.cameraPunchZ = 0;
    state.rutGhost = null;
    state.shake = 0;
    state.resolveTimer = -1;
    state.intermission = 0;
    state.volley = null;
    state.aiTurns = 0;
    state.elapsed = 0;
    state.firstAim = true;
    state.stats = makeStats();
    carts.player.hp = carts.player.maxHp;
    carts.enemy.hp = carts.enemy.maxHp;
    resetTerrain();
    concealScreen(DOM.titleScreen);
    concealScreen(DOM.resultScreen);
    DOM.worldHud.hidden = false;
    DOM.protocolBanner.hidden = true;
    DOM.fieldHint.hidden = false;
    DOM.fieldStatus.textContent = `THE DITCH / MATCH ${String(state.matchNumber).padStart(2, "0")} / ${windReadout()}`;
    updateHud();
  }

  function startSingle() {
    state.series = false;
    startMatch();
  }

  function startSeries() {
    state.series = true;
    rivalry.seriesYard = 0;
    rivalry.seriesLate = 0;
    startMatch();
  }

  function startMatch() {
    sound.wake();
    sound.play("start");
    resetMatch();
    say("start");
  }

  function finishMatch(winner) {
    state.mode = "result";
    state.phase = "ended";
    state.dragging = false;
    DOM.protocolBanner.hidden = true;
    DOM.fieldHint.hidden = true;
    const playerWon = winner === "player";
    const draw = winner === "draw";
    if (playerWon) {
      rivalry.yard += 1;
      rivalry.allTime.yard += 1;
      if (state.series) rivalry.seriesYard += 1;
      rivalry.playerRun += 1;
      rivalry.bestRun = Math.max(rivalry.bestRun, rivalry.playerRun);
    } else if (draw) {
      rivalry.draws += 1;
      rivalry.playerRun = 0;
    } else {
      rivalry.late += 1;
      rivalry.allTime.late += 1;
      if (state.series) rivalry.seriesLate += 1;
      rivalry.playerRun = 0;
    }

    try {
      localStorage.setItem("BAG_GRUDGE", JSON.stringify(rivalry.allTime));
    } catch(e) {}

    const seriesActive = state.series && rivalry.seriesYard < 2 && rivalry.seriesLate < 2;

    if (seriesActive) {
      DOM.grudgeScore.textContent = `${rivalry.seriesYard} - ${rivalry.seriesLate}`;
      DOM.grudgeLeader.className = `grudge-leader ${rivalry.seriesLate > rivalry.seriesYard ? 'late' : ''}`;
      revealScreen(DOM.grudgeCard);
      DOM.worldHud.hidden = true;
      return;
    }

    revealScreen(DOM.resultScreen);

    if (state.series) {
      const playerSeriesWon = rivalry.seriesYard >= 2;
      DOM.resultWord.textContent = playerSeriesWon ? "SERIES WIN." : "SERIES LOST.";
      DOM.resultCopy.textContent = `You ${playerSeriesWon ? 'took' : 'dropped'} the best-of-3.`;
    } else {
      DOM.resultWord.textContent = draw ? "COMPOST." : playerWon ? "VINEGAR." : "MUST.";
      const ruling = draw ? pickLine(LINES.draw) : playerWon ? pickLine(LINES.playerWin) : pickLine(LINES.playerLose);
      DOM.resultCopy.textContent = ruling;
    }

    lineSwapToken += 1;
    DOM.line.classList.remove("swap");
    DOM.line.textContent = DOM.resultCopy.textContent;
    const accuracy = state.stats.shots ? Math.round(state.stats.scoringShots / state.stats.shots * 100) : 0;
    const closest = Number.isFinite(state.stats.closestMiss) ? `${Math.round(state.stats.closestMiss)} PX CLOSE` : "NO CLEAN MISSES";

    let historyText = "";
    if (rivalry.allTime.yard > rivalry.allTime.late) historyText = `YOU LEAD ALL-TIME RIVALRY ${rivalry.allTime.yard}-${rivalry.allTime.late}`;
    else if (rivalry.allTime.yard < rivalry.allTime.late) historyText = `YOU TRAIL ALL-TIME RIVALRY ${rivalry.allTime.yard}-${rivalry.allTime.late}`;
    else historyText = `ALL-TIME RIVALRY TIED ${rivalry.allTime.yard}-${rivalry.allTime.late}`;

    DOM.resultStats.innerHTML = `<span>${state.stats.shots} SHOTS</span><span>${accuracy}% SCORING SHOTS</span><span>${closest}</span><span>${historyText}</span>`;
    DOM.rematchButton.textContent = `RUN IT BACK · MATCH ${String(state.matchNumber + 1).padStart(2, "0")}`;
    DOM.fieldStatus.textContent = `ALL-TIME ${rivalry.allTime.yard}–${rivalry.allTime.late} / BEST RUN ${rivalry.bestRun}`;
    sound.play(playerWon ? "win" : "impact", "lug");
    updateHud();
  }

  function muzzleFor(cart) {
    const ground = groundAt(cart.x);
    return cart.id === "player"
      ? { x: cart.x + 105, y: ground - 96 }
      : { x: cart.x - 138, y: ground - 174 };
  }

  function velocityFor(cart, lot, angle, power, cut = 0) {
    const radians = angle * Math.PI / 180;
    const speed = (330 + power * 6.5) * lot.speed;
    return {
      x: Math.cos(radians) * speed * cart.facing,
      y: -Math.sin(radians) * speed,
      z: cut * 120
    };
  }

  function beginShot(shooterId, lotId, angle, power, cut = 0) {
    if (state.phase !== "aim" && state.phase !== "intermission") return;
    const lot = LOTS[lotId];
    state.phase = "ceremony";
    state.turn = shooterId;
    state.dragging = false;
    state.ceremony = {
      shooterId,
      lotId,
      angle: clamp(angle, 18, 82),
      power: clamp(power, 18, 100),
      cut: clamp(cut, -1, 1),
      seed: state.windSeed,
      elapsed: 0,
      duration: lot.ceremony
    };
    state.volley = {
      shooterId,
      lotId,
      damage: { player: 0, enemy: 0 },
      closest: Infinity,
      hitDirect: false,
      announcedSplit: false
    };
    DOM.fieldHint.hidden = true;
    DOM.protocolLabel.textContent = `${lot.name} PROTOCOL`;
    DOM.protocolText.textContent = lot.protocol;
    DOM.protocolBanner.hidden = false;
    if (shooterId === "player") {
      state.aimMemory[lotId] = { angle: state.aimAngle, power: state.aimPower, cut: state.aimCut };
      state.stats.shots += 1;
      state.stats.lotsUsed.add(lotId);
    }
    say("lot", lotId);
    sound.play("select");
    updateHud();
  }

  function launchCeremonyShot() {
    const ceremony = state.ceremony;
    if (!ceremony) return;
    const cart = carts[ceremony.shooterId];
    const lot = LOTS[ceremony.lotId];
    const muzzle = muzzleFor(cart);
    const velocity = velocityFor(cart, lot, ceremony.angle, ceremony.power, ceremony.cut);
    state.projectiles = [{
      x: muzzle.x,
      y: muzzle.y,
      z: 0,
      vx: velocity.x,
      vy: velocity.y,
      vz: velocity.z,
      radius: lot.radius,
      rotation: 0,
      age: 0,
      trailClock: 0,
      trail: [],
      owner: ceremony.shooterId,
      lotId: ceremony.lotId,
      child: false,
      split: false
    }];
    state.phase = "flight";
    state.ceremony = null;
    state.resolveTimer = -1;
    DOM.protocolBanner.hidden = true;
    sound.play("launch", lot.id);
    haptic(lot.id === "lug" ? [16, 16, 28] : 12);
    if (Math.random() < 0.74) say("fire");
    burstAt(muzzle.x, muzzle.y, lot.id === "lug" ? 13 : 7, "smoke");
    updateHud();
  }

  function chooseAiLot() {
    if (state.aiTurns === 1) return "table";
    const roll = Math.random();
    if (carts.player.hp === 1 && roll < 0.28) return "pea";
    if (roll < 0.37) return "table";
    if (roll < 0.59) return "cluster";
    if (roll < 0.79) return "pea";
    return "lug";
  }

  function projectileHitsCart(x, y, z = 0, cart) {
    if (Math.abs(z - (cart.z || 0)) > 40) return false;
    const centerY = groundAt(cart.x, cart.z) - (cart.id === "player" ? 70 : 65);
    const rx = cart.id === "player" ? 112 : 104;
    const ry = cart.id === "player" ? 61 : 66;
    return Math.pow((x - cart.x) / rx, 2) + Math.pow((y - centerY) / ry, 2) <= 1;
  }

  function simulateAiShot(cart, target, lot, angle, power) {
    const muzzle = muzzleFor(cart);
    const velocity = velocityFor(cart, lot, angle, power);
    let x = muzzle.x;
    let y = muzzle.y;
    let vx = velocity.x;
    let vy = velocity.y;
    let closest = Infinity;
    for (let time = 0; time < 5.5; time += 1 / 70) {
      vy += GRAVITY * lot.gravity / 70;
      x += vx / 70;
      y += vy / 70;
      closest = Math.min(closest, Math.abs(x - target.x) + Math.abs(y - (groundAt(target.x) - 62)) * 0.35);
      if (projectileHitsCart(x, y, 0, target)) return 0;
      if (x < -60 || x > W + 60 || y > H + 50) break;
      if (y + lot.radius >= groundAt(x, 0)) return Math.min(closest, Math.abs(x - target.x));
    }
    return closest + 250;
  }

  function solveAiAim(lotId) {
    const cart = carts.enemy;
    const target = carts.player;
    const lot = LOTS[lotId];
    let best = { score: Infinity, angle: 48, power: 65 };
    for (let angle = 24; angle <= 78; angle += 3) {
      for (let power = 30; power <= 100; power += 3) {
        const score = simulateAiShot(cart, target, lot, angle, power);
        if (score < best.score) best = { score, angle, power };
      }
    }
    const angleError = Math.max(1.05, 4.4 - state.aiTurns * 0.48);
    const powerError = Math.max(1.7, 7.4 - state.aiTurns * 0.72);
    best.angle = clamp(best.angle + randomBetween(-angleError, angleError), 18, 82);
    best.power = clamp(best.power + randomBetween(-powerError, powerError), 20, 100);
    return best;
  }

  function startAiTurn() {
    if (state.mode !== "match" || state.turn !== "enemy") return;
    state.aiTurns += 1;
    const lotId = chooseAiLot();
    const aim = solveAiAim(lotId);

    let targetZ = 0;
    const rand = Math.random();
    if (rand < 0.20) {
      targetZ = randomBetween(-15, 15);
    } else if (rand < 0.70) {
      targetZ = (Math.random() < 0.5 ? 1 : -1) * randomBetween(16, 40);
    } else {
      targetZ = (Math.random() < 0.5 ? 1 : -1) * randomBetween(41, 70);
    }

    const radians = aim.angle * Math.PI / 180;
    const speed = (330 + aim.power * 6.5) * LOTS[lotId].speed;
    const vx = Math.cos(radians) * speed;
    const distance = Math.abs(carts.player.x - carts.enemy.x);
    const flightTime = distance / vx;
    const cut = targetZ / (120 * flightTime);

    state.selected = lotId;
    state.aimAngle = aim.angle;
    state.aimPower = aim.power;
    state.aimCut = cut;
    state.phase = "intermission";
    beginShot("enemy", lotId, aim.angle, aim.power, cut);
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    if (getComputedStyle(canvas).objectFit === "cover") {
      const scale = Math.max(rect.width / W, rect.height / H);
      const paintedWidth = W * scale;
      const paintedHeight = H * scale;
      const offsetX = (rect.width - paintedWidth) / 2;
      const offsetY = (rect.height - paintedHeight) / 2;
      return {
        x: (event.clientX - rect.left - offsetX) / scale,
        y: (event.clientY - rect.top - offsetY) / scale
      };
    }
    return {
      x: (event.clientX - rect.left) * W / rect.width,
      y: (event.clientY - rect.top) * H / rect.height
    };
  }

  const gestureHistory = [];

  function getCurvature() {
    if (gestureHistory.length < 3) return 0;
    let sumCurve = 0;
    let validPairs = 0;
    for (let i = 0; i < gestureHistory.length - 2; i++) {
      const p1 = gestureHistory[i];
      const p2 = gestureHistory[i + 1];
      const p3 = gestureHistory[i + 2];
      const v1x = p2.x - p1.x;
      const v1y = p2.y - p1.y;
      const v2x = p3.x - p2.x;
      const v2y = p3.y - p2.y;
      const cross = v1x * v2y - v1y * v2x;
      const len1 = Math.hypot(v1x, v1y);
      const len2 = Math.hypot(v2x, v2y);
      if (len1 * len2 > 0) {
        sumCurve += cross / (len1 * len2);
        validPairs++;
      }
    }
    if (validPairs === 0) return 0;
    const avgCross = sumCurve / validPairs;
    const cart = carts.player;
    return clamp(avgCross * 2.5 * cart.facing, -1, 1);
  }

  function handleCancel(event) {
    if (!state.dragging || (event && event.pointerId && event.pointerId !== state.pointerId)) return;
    state.dragging = false;
    state.pointerId = null;
    if (window.__BAG__.gestureState) {
      window.__BAG__.gestureState.state = "idle";
      window.__BAG__.gestureState.valid = false;
    }
    updateHud();
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (state.mode !== "match" || state.turn !== "player" || state.phase !== "aim") return;
    if (!window.__BAG__.getGrabRect) return;
    const rect = window.__BAG__.getGrabRect("player");
    if (!rect) return;

    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
      return;
    }

    event.preventDefault();
    sound.wake();
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.firstAim = false;
    DOM.fieldHint.hidden = true;
    try { canvas.setPointerCapture(event.pointerId); } catch (_) {}

    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    window.__BAG__.gestureState.state = "deadzone";
    window.__BAG__.gestureState.origin = { x: cx, y: cy };
    window.__BAG__.gestureState.current = { x: event.clientX, y: event.clientY };
    window.__BAG__.gestureState.valid = false;

    gestureHistory.length = 0;
    gestureHistory.push({ x: event.clientX, y: event.clientY });
    updateHud();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    event.preventDefault();

    const pt = { x: event.clientX, y: event.clientY };
    window.__BAG__.gestureState.current = pt;

    const origin = window.__BAG__.gestureState.origin;
    const pullPx = Math.hypot(pt.x - origin.x, pt.y - origin.y);

    if (pullPx >= 28) {
      const crossedDeadzone = !window.__BAG__.gestureState.valid;
      window.__BAG__.gestureState.state = "active";
      window.__BAG__.gestureState.valid = true;
      if (crossedDeadzone) haptic(8);

      const pullDirX = origin.x - pt.x;
      const pullDirY = origin.y - pt.y;
      const len = Math.hypot(pullDirX, pullDirY);

      const cart = carts.player;
      let pitch = 45;
      if (len > 0) {
        const nx = pullDirX / len;
        const ny = pullDirY / len;
        pitch = Math.atan2(-ny, nx * cart.facing) * 180 / Math.PI;
      }

      state.aimAngle = clamp(pitch, 18, 82);
      const maxPullPx = clamp(Math.min(canvas.clientWidth * 0.28, canvas.clientHeight * 0.5), 150, 220);
      const pullT = clamp((pullPx - 28) / (maxPullPx - 28), 0, 1);
      state.aimPower = 18 + pullT * 82;

      const last = gestureHistory[gestureHistory.length - 1];
      if (Math.hypot(pt.x - last.x, pt.y - last.y) >= 6) {
        gestureHistory.push(pt);
        if (gestureHistory.length > 8) gestureHistory.shift();
      }

      state.aimCut = getCurvature();
      updateHud();
    } else {
      window.__BAG__.gestureState.state = "deadzone";
      window.__BAG__.gestureState.valid = false;
    }
  });

  function releasePointer(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    event.preventDefault();

    const valid = window.__BAG__.gestureState.valid;
    handleCancel(event);

    if (valid) {
      beginShot("player", state.selected, state.aimAngle, state.aimPower, state.aimCut);
    }
  }

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", handleCancel);
  canvas.addEventListener("lostpointercapture", handleCancel);
  window.addEventListener("orientationchange", handleCancel);
  if(document.addEventListener) document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") handleCancel();
  });

  canvas.addEventListener("touchstart", (event) => {
    if (event.touches.length > 1) handleCancel();
  }, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (state.mode === "title" && (event.code === "Space" || event.code === "Enter")) {
      event.preventDefault();
      startMatch();
      return;
    }
    if (state.mode !== "match" || state.turn !== "player" || state.phase !== "aim") return;
    if (/^Digit[1-4]$/.test(event.code)) {
      selectLot(LOT_ORDER[Number(event.code.slice(-1)) - 1]);
      return;
    }
    if (event.code === "ArrowUp") state.aimAngle = clamp(state.aimAngle + 1, 18, 82);
    else if (event.code === "ArrowDown") state.aimAngle = clamp(state.aimAngle - 1, 18, 82);
    else if (event.code === "ArrowRight") state.aimPower = clamp(state.aimPower + 2, 18, 100);
    else if (event.code === "ArrowLeft") state.aimPower = clamp(state.aimPower - 2, 18, 100);
    else if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      beginShot("player", state.selected, state.aimAngle, state.aimPower, state.aimCut);
      return;
    } else return;
    event.preventDefault();
    state.firstAim = false;
    DOM.fieldHint.hidden = true;
    updateHud();
  });

  DOM.startButton.addEventListener("click", startSingle);
  DOM.startSeriesButton.addEventListener("click", startSeries);
  DOM.rematchButton.addEventListener("click", startSingle);
  DOM.rematchSeriesButton.addEventListener("click", startSeries);
  DOM.grudgeNext.addEventListener("click", () => {
    concealScreen(DOM.grudgeCard);
    startMatch();
  });
  DOM.soundToggle.addEventListener("click", () => {
    sound.enabled = !sound.enabled;
    if (sound.enabled) {
      sound.wake();
      sound.play("select");
    }
    DOM.soundToggle.textContent = sound.enabled ? "SOUND ON" : "SOUND OFF";
    DOM.soundToggle.setAttribute("aria-pressed", String(sound.enabled));
  });
  DOM.portraitContinue.addEventListener("click", () => document.body.classList.add("portrait-accepted"));

  document.addEventListener?.("pointerdown", (event) => {
    const button = event.target.closest?.("button:not(:disabled)");
    if (!button) return;
    haptic(5);
    sound.wake();
    sound.play("press");
  }, { passive: true });

  buildLotButtons();
  DOM.worldHud.hidden = true;
  DOM.soundToggle.setAttribute("aria-pressed", "true");
  updateHud();

  function burstAt(x, y, count, kind = "juice", lotId = "table", options = {}) {
    const lot = LOTS[lotId] || LOTS.table;
    const {
      z = 0,
      vxNudge = 0,
      vyNudge = 0,
      vzNudge = 0,
      colorOverride = null,
      shape = kind,
      sizeScale = 1
    } = options;
    for (let i = 0; i < count; i += 1) {
      const angle = randomBetween(-Math.PI, 0);
      const speed = kind === "smoke" ? randomBetween(18, 75) : randomBetween(80, lotId === "lug" ? 350 : 245);
      const life = randomBetween(kind === "smoke" ? 0.45 : 0.35, kind === "smoke" ? 1.05 : 0.9);
      const palette = colorOverride ? (Array.isArray(colorOverride) ? colorOverride : [colorOverride]) : kind === "dirt"
        ? [COLORS.dirt, COLORS.ink, COLORS.copper]
        : kind === "smoke"
          ? [COLORS.ink, COLORS.dirt, COLORS.horizon]
          : [COLORS.juice, COLORS.oxblood, COLORS.cream];
      state.particles.push({
        x,
        y,
        z,
        vx: Math.cos(angle) * speed + randomBetween(-45, 45) + vxNudge,
        vy: Math.sin(angle) * speed - (kind === "smoke" ? randomBetween(10, 50) : 0) + vyNudge,
        vz: randomBetween(-30, 30) + vzNudge,
        gravity: kind === "smoke" ? -12 : 520,
        size: randomBetween(kind === "smoke" ? 5 : 2, kind === "smoke" ? 13 : lotId === "lug" ? 10 : 6) * sizeScale,
        life,
        maxLife: life,
        color: palette[Math.floor(Math.random() * palette.length)],
        kind,
        shape,
        rotation: randomBetween(-Math.PI, Math.PI),
        spin: randomBetween(-8, 8)
      });
    }
  }

  function addFloater(x, y, copy, strong = false) {
    state.floaters.push({ x, y, copy, life: 1.05, maxLife: 1.05, strong });
  }

  function addRing(x, y, radius, color = COLORS.juice) {
    state.rings.push({ x, y, radius: 4, target: radius, life: 0.42, maxLife: 0.42, color });
  }

  function addStain(x, lotId, size = 1) {
    const y = groundAt(x);
    const drips = 2 + Math.floor(Math.random() * 4);
    state.stains.push({
      x,
      y,
      rx: randomBetween(17, 32) * size,
      ry: randomBetween(4, 9) * size,
      rotation: randomBetween(-0.25, 0.25),
      lotId,
      satellites: Array.from({ length: drips }, (_, index) => {
        const angle = index / drips * Math.PI * 2 + 0.4;
        return {
          x: Math.cos(angle) * randomBetween(0.7, 1.1),
          y: Math.sin(angle) * 1.4,
          radius: 2 + (index % 3)
        };
      })
    });
    if (state.stains.length > 28) state.stains.shift();
  }

  const TIER_DEAD = "DEAD_LANE";
  const TIER_GRAZE = "GRAZE";
  const TIER_WIDE = "WIDE";

  function zAccuracy(impactZ, targetZ) {
    const delta = Math.abs(impactZ - targetZ);
    if (delta <= 15) return { tier: TIER_DEAD, damageMultiplier: 1.15 };
    if (delta <= 40) return { tier: TIER_GRAZE, damageMultiplier: 1.0 };
    return { tier: TIER_WIDE, damageMultiplier: 0.8 };
  }

  function applyVolleyDamage(cart, requested, direct, multiplier = 1, tierName = "") {
    if (!state.volley || requested <= 0 || cart.hp <= 0) return 0;
    const lot = LOTS[state.volley.lotId];
    const already = state.volley.damage[cart.id];
    const cap = lot.damageCap * multiplier;
    const allowed = Math.max(0, cap - already);
    const actual = Math.min(requested * multiplier, allowed, cart.hp);
    if (actual <= 0) return 0;
    cart.hp -= actual;
    state.volley.damage[cart.id] += actual;
    state.volley.hitDirect ||= direct;
    const centerY = groundAt(cart.x) - 92;
    const baseText = actual >= 1.9 ? "-2 · PULPED" : "-1 · BOTTLED";
    const floaterText = tierName ? `${tierName}  ${baseText}` : baseText;
    addFloater(cart.x, centerY, floaterText, actual >= 1.9);
    if (!state.volley.ceremonyPlayed) {
      burstAt(cart.x, centerY + 28, direct ? 19 : 12, "juice", state.volley.lotId);
    }
    state.shake = Math.max(state.shake, LOTS[state.volley.lotId].shake + actual * 3);
    sound.play("bottle");
    if (state.volley.shooterId === "player") {
      if (cart.id === "enemy") state.stats.damage += actual;
      else state.stats.selfDamage += actual;
    }
    updateHud();
    return actual;
  }

  function impactProjectile(projectile, directCart = null) {
    const lot = LOTS[projectile.lotId];
    const impactX = clamp(projectile.x, 0, W);
    const impactY = Math.min(projectile.y, groundAt(impactX, projectile.z));
    const childScale = projectile.child ? 0.58 : 1;
    if (projectile.owner === "player" && !projectile.child) {
      state.rutGhost = { trail: [...projectile.trail], impactX, impactY, z: projectile.z, lotId: projectile.lotId };
    }
    craterAt(impactX, projectile.z || 0, lot.craterRadius * childScale, lot.craterDepth * childScale);
    addStain(impactX, lot.id, lot.id === "lug" ? 2.1 : projectile.child ? 0.62 : 1);
    addRing(impactX, impactY, lot.splashRadius || lot.craterRadius, lot.id === "pea" ? COLORS.cream : COLORS.juice);
    if (lot.id === "lug" && !projectile.child) {
      addRing(impactX, impactY, lot.craterRadius * 1.42, COLORS.cream);
    }
    const targetCart = projectile.owner === "player" ? carts.enemy : carts.player;
    const zAcc = zAccuracy(projectile.z || 0, targetCart.z || 0);
    const pZ = projectile.z || 0;
    const desc = CEREMONIES[lot.id] || CEREMONIES.table;

    const isFirstHit = state.volley && !state.volley.ceremonyPlayed;
    if (isFirstHit) {
      if (state.volley) state.volley.ceremonyPlayed = true;
      haptic(lot.id === "lug" ? [24, 18, 42] : lot.id === "cluster" ? [14, 12, 14] : 16);
      state.impactFocus = {
        x: impactX,
        y: impactY,
        z: pZ,
        life: 0.92,
        maxLife: 0.92,
        radius: Math.max(lot.craterRadius, lot.splashRadius || 0),
        tier: zAcc.tier,
        lotId: lot.id
      };
      lineSwapToken += 1;
      DOM.line.classList.remove("swap");
      DOM.line.textContent = zAcc.tier === TIER_DEAD
        ? `DEAD LANE · ${CEREMONY_CALLS[lot.id]}`
        : zAcc.tier === TIER_GRAZE
          ? `GRAZE · ${lot.name} FOUND THE SHOULDER`
          : `WIDE · ${lot.name} OWES THE DITCH AN APOLOGY`;

      if (zAcc.tier === TIER_DEAD) {
        if (projectile.owner === "player") state.cameraPunchZ = desc.punch;
        const primaryCount = Math.round(desc.primary * childScale);
        const dirtCount = Math.max(0, Math.round((30 - desc.primary) * childScale));
        burstAt(impactX, impactY, primaryCount, desc.kind, lot.id, {
          z: pZ,
          vxNudge: desc.vx || 0,
          vyNudge: desc.vy || 0,
          vzNudge: desc.vz,
          colorOverride: desc.color,
          shape: desc.shape,
          sizeScale: desc.size
        });
        burstAt(impactX, impactY, dirtCount, "dirt", lot.id, {
          z: pZ,
          vyNudge: -45,
          vzNudge: 90,
          shape: "clod"
        });
      } else if (zAcc.tier === TIER_GRAZE) {
        if (projectile.owner === "player") state.cameraPunchX = (Math.random() > 0.5 ? 1 : -1) * 40;
        burstAt(impactX, impactY, Math.round(10 * childScale), "juice", lot.id, { z: pZ, vxNudge: 150 });
        burstAt(impactX, impactY, Math.round(10 * childScale), "juice", lot.id, { z: pZ, vxNudge: -150 });
        burstAt(impactX, impactY, Math.round(8 * childScale), "dirt", lot.id, { z: pZ });
      } else {
        burstAt(impactX, impactY, Math.round(15 * childScale), "dirt", lot.id, { z: pZ });
      }
    } else {
      burstAt(impactX, impactY, Math.round(10 * childScale), "dirt", lot.id, { z: pZ });
      if (zAcc.tier !== TIER_WIDE) {
        burstAt(impactX, impactY, Math.round(12 * childScale), "juice", lot.id, { z: pZ });
      }
    }

    state.shake = Math.max(state.shake, lot.shake * childScale);
    sound.play("impact", lot.id);

    const tierName = zAcc.tier.replace("_", " ");
    if (directCart) applyVolleyDamage(directCart, lot.direct, true, zAcc.damageMultiplier, tierName);

    if (lot.splash > 0) {
      [carts.player, carts.enemy].forEach((cart) => {
        if (cart === directCart) return;
        const centerY = groundAt(cart.x, cart.z) - 62;
        const distance = Math.hypot(impactX - cart.x, impactY - centerY, (projectile.z || 0) - (cart.z || 0));
        if (distance <= lot.splashRadius) applyVolleyDamage(cart, lot.splash, false, zAcc.damageMultiplier, tierName);
      });
    }
  }

  function splitCluster(projectile, spawned) {
    const fan = [-112, -56, 0, 56, 112];
    fan.forEach((spread, index) => {
      spawned.push({
        x: projectile.x + randomBetween(-4, 4),
        y: projectile.y + randomBetween(-4, 4),
        z: (projectile.z || 0) + randomBetween(-10, 10),
        vx: projectile.vx + spread,
        vy: projectile.vy + (index - 2) * 18 - 24,
        vz: (projectile.vz || 0) + randomBetween(-30, 30),
        radius: 5,
        rotation: randomBetween(-1, 1),
        age: 0.26,
        trailClock: 0,
        trail: projectile.trail.slice(-4),
        owner: projectile.owner,
        lotId: "cluster",
        child: true,
        split: true
      });
    });
    burstAt(projectile.x, projectile.y, 16, "juice", "cluster");
    addRing(projectile.x, projectile.y, 35, COLORS.cream);
    sound.play("split");
    if (!state.volley.announcedSplit) {
      state.volley.announcedSplit = true;
      say("split");
    }
  }

  function updateProjectilesFixed(dt) {
    if (state.phase !== "flight") return;
    const survivors = [];
    const spawned = [];
    for (const projectile of state.projectiles) {
      const lot = LOTS[projectile.lotId];
      projectile.age += dt;
            const wind = (state.ceremony ? state.ceremony.seed : state.windSeed) / 4294967296 * 30 - 15;
      projectile.vx += wind * dt;
      projectile.vy += GRAVITY * lot.gravity * dt;
      projectile.x += projectile.vx * dt;
      projectile.y += projectile.vy * dt;
      projectile.z = (projectile.z || 0) + (projectile.vz || 0) * dt;
      projectile.rotation += (projectile.vx / 210) * dt;

      // Hook for deterministic testing
      if (typeof window !== "undefined" && window.__FIXED_SAMPLES__) {
        window.__FIXED_SAMPLES__.push({ x: projectile.x, y: projectile.y, z: projectile.z });
      }

      projectile.trailClock += dt;
      if (projectile.trailClock >= 0.045) {
        projectile.trailClock = 0;
        projectile.trail.push({ x: projectile.x, y: projectile.y, z: projectile.z });
        if (projectile.trail.length > 11) projectile.trail.shift();
      }

      const target = projectile.owner === "player" ? carts.enemy : carts.player;
      const targetCenterY = groundAt(target.x, target.z) - 62;
      state.volley.closest = Math.min(state.volley.closest, Math.hypot(projectile.x - target.x, (projectile.y - targetCenterY) * 0.72, projectile.z - target.z));

      if (projectile.lotId === "cluster" && !projectile.child && !projectile.split && projectile.age > 0.28 && projectile.vy >= 0) {
        projectile.split = true;
        splitCluster(projectile, spawned);
        continue;
      }

      let directCart = null;
      for (const cart of [carts.player, carts.enemy]) {
        if (cart.id === projectile.owner && projectile.age < 0.3) continue;
        if (projectileHitsCart(projectile.x, projectile.y, projectile.z, cart)) {
          directCart = cart;
          break;
        }
      }

      if (directCart) {
        impactProjectile(projectile, directCart);
        continue;
      }

      if (projectile.x >= 0 && projectile.x <= W && projectile.y + projectile.radius >= groundAt(projectile.x, projectile.z)) {
        impactProjectile(projectile);
        continue;
      }

      if (projectile.x < -95 || projectile.x > W + 95 || projectile.y > H + 100 || projectile.age > 6.2) continue;
      survivors.push(projectile);
    }
    state.projectiles = survivors.concat(spawned);
  }

  function resolveVolley() {
    if (!state.volley || state.mode !== "match") return;
    const volley = state.volley;
    const opponentId = volley.shooterId === "player" ? "enemy" : "player";
    const dealt = volley.damage[opponentId];
    const self = volley.damage[volley.shooterId];

    if (volley.shooterId === "player") {
      if (dealt > 0) {
        state.stats.scoringShots += 1;
        state.stats.biggestHit = Math.max(state.stats.biggestHit, dealt);
        state.stats.streak += 1;
        state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
      } else {
        state.stats.streak = 0;
        state.stats.closestMiss = Math.min(state.stats.closestMiss, volley.closest);
      }
    }

    if (carts.enemy.hp <= 0 || carts.player.hp <= 0) {
      const winner = carts.enemy.hp <= 0 && carts.player.hp <= 0 ? "draw" : carts.enemy.hp <= 0 ? "player" : "enemy";
      finishMatch(winner);
      return;
    }

    if (self > 0 && dealt === 0) say("self");
    else if (dealt >= 2) say("hardHit");
    else if (dealt > 0 && volley.shooterId === "player" && state.stats.streak >= 2) say("streak");
    else if (dealt > 0) say("hit");
    else if (volley.closest < 92) say("near");
    else say("miss");

    state.volley = null;
    state.resolveTimer = -1;
    if (volley.shooterId === "player") {
      state.turn = "enemy";
      state.phase = "intermission";
      state.intermission = 0.58;
    } else {
      state.turn = "player";
      state.phase = "aim";
      state.windSeed = Math.floor(Math.random() * 4294967296);
      state.selected = state.playerSelected || "table";
      const remembered = state.aimMemory[state.selected];
      state.aimAngle = remembered.angle;
      state.aimPower = remembered.power;
      state.aimCut = remembered.cut;
      DOM.fieldHint.hidden = true;
      DOM.fieldStatus.textContent = `THE DITCH / MATCH ${String(state.matchNumber).padStart(2, "0")} / ${windReadout()}`;
    }
    updateHud();
  }

  function updateEffects(dt) {
    if (state.impactFocus) {
      state.impactFocus.life -= dt;
      if (state.impactFocus.life <= 0) state.impactFocus = null;
    }
    for (const particle of state.particles) {
      particle.life -= dt;
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.z !== undefined) {
        particle.z += particle.vz * dt;
        particle.vz *= Math.pow(0.36, dt);
      }
      particle.vx *= Math.pow(0.36, dt);
      particle.rotation += particle.spin * dt;
      if (particle.kind === "smoke") particle.size += dt * 10;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);

    for (const ring of state.rings) {
      ring.life -= dt;
      ring.radius = lerp(ring.radius, ring.target, 1 - Math.pow(0.004, dt));
    }
    state.rings = state.rings.filter((ring) => ring.life > 0);

    for (const floater of state.floaters) {
      floater.life -= dt;
      floater.y -= dt * 34;
    }
    state.floaters = state.floaters.filter((floater) => floater.life > 0);
    state.shake = Math.max(0, state.shake - dt * 34);
  }

  function updateGame(dt) {
    state.elapsed += dt;
    updateEffects(dt);
    if (state.mode !== "match") return;

    if (state.phase === "ceremony" && state.ceremony) {
      state.ceremony.elapsed += dt;
      if (state.ceremony.elapsed >= state.ceremony.duration) launchCeremonyShot();
    } else if (state.phase === "intermission") {
      state.intermission -= dt;
      if (state.intermission <= 0 && state.turn === "enemy") startAiTurn();
    } else if (state.phase === "flight" && state.projectiles.length === 0) {
      if (state.resolveTimer < 0) state.resolveTimer = 0.54;
      else {
        state.resolveTimer -= dt;
        if (state.resolveTimer <= 0) resolveVolley();
      }
    }
  }


  let previousTime = performance.now();
  let accumulator = 0;

  function frame(now) {
    const dt = Math.min(0.05, Math.max(0, (now - previousTime) / 1000));
    previousTime = now;
    updateGame(dt);
    if (state.mode === "match" && state.phase === "flight") {
      accumulator += dt;
      let guard = 0;
      while (accumulator >= FIXED_STEP && guard < 12) {
        updateProjectilesFixed(FIXED_STEP);
        accumulator -= FIXED_STEP;
        guard += 1;
      }
    } else {
      accumulator = 0;
    }
    if (window.__BAG__.render3D) {
      window.__BAG__.render3D();
    }
    requestAnimationFrame(frame);
  }

  window.__BAG__ = {
    start: startMatch,
    select: selectLot,
    setAim(angle, power) {
      state.aimAngle = clamp(Number(angle), 18, 82);
      state.aimPower = clamp(Number(power), 18, 100);
      updateHud();
    },
    fire() {
      if (state.mode === "match" && state.turn === "player" && state.phase === "aim") {
        beginShot("player", state.selected, state.aimAngle, state.aimPower, state.aimCut);
      }
    },
    velocityFor,
    muzzleFor,
    state,
    carts,
    terrain,
    baseTerrain,
    W, H, CELL,
    groundAt,
    LOTS,
    COLORS,
    gestureState: { state: "idle", origin: {x:0, y:0}, current: {x:0, y:0}, valid: false },
    getGrabRect: null,
    snapshot() {
      return {
        mode: state.mode,
        phase: state.phase,
        turn: state.turn,
        lot: state.selected,
        angle: Math.round(state.aimAngle * 10) / 10,
        power: Math.round(state.aimPower * 10) / 10,
        yardHp: carts.player.hp,
        lateHp: carts.enemy.hp,
        projectiles: state.projectiles.length
      };
    }
  };

  requestAnimationFrame(frame);

  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // The match remains fully playable if offline support is unavailable.
      });
    });
  }
})();
