(() => {
  "use strict";

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d", { alpha: false });
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
    line: document.getElementById("line"),
    worldHud: document.getElementById("worldHud"),
    yardCard: document.getElementById("yardCard"),
    lateCard: document.getElementById("lateCard"),
    yardHp: document.getElementById("yardHp"),
    lateHp: document.getElementById("lateHp"),
    lotChip: document.getElementById("lotChip"),
    turnChip: document.getElementById("turnChip"),
    aimRail: document.getElementById("aimRail"),
    angleValue: document.getElementById("angleValue"),
    powerValue: document.getElementById("powerValue"),
    powerFill: document.getElementById("powerFill"),
    cutValue: document.getElementById("cutValue"),
    cutSlider: document.getElementById("cutSlider"),
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
      craterRadius: 26, craterDepth: 15, shake: 7, ceremony: 0.82,
      protocol: "WIPE · WEIGH · NOD · CLEAR THE LIP"
    },
    pea: {
      id: "pea", number: "02", name: "PEA", fullName: "PEA BERRY",
      note: "FAST / DIRECT", speed: 1.19, gravity: 0.92, radius: 4,
      direct: 2, splash: 0, splashRadius: 0, damageCap: 2,
      craterRadius: 10, craterDepth: 5, shake: 3, ceremony: 0.9,
      protocol: "CALIPERS · ARGUE · RE-MEASURE · SEND IT"
    },
    cluster: {
      id: "cluster", number: "03", name: "CLUSTER", fullName: "WHOLE CLUSTER",
      note: "SPLITS / CHAOS", speed: 0.94, gravity: 1, radius: 9,
      direct: 1, splash: 1, splashRadius: 34, damageCap: 2,
      craterRadius: 18, craterDepth: 9, shake: 5, ceremony: 1.02,
      protocol: "FIVE-PIP PILE-ON · COUNT STEMS · HEAVE"
    },
    lug: {
      id: "lug", number: "04", name: "LUG", fullName: "FULL LUG",
      note: "HEAVY / CRATER", speed: 0.8, gravity: 1.02, radius: 15,
      direct: 2, splash: 1, splashRadius: 116, damageCap: 2,
      craterRadius: 82, craterDepth: 52, shake: 18, ceremony: 1.18,
      protocol: "BLOCK-AND-TACKLE · MIND THE ROPE · CUT LOOSE"
    }
  };

  const CEREMONIES = {
    table: { color: COLORS.juice, kind: "juice", punch: -120 },
    pea: { color: COLORS.cream, kind: "smoke", punch: -100 },
    cluster: { color: COLORS.oxblood, kind: "juice", punch: -140 },
    lug: { color: COLORS.ink, kind: "dirt", punch: -180 }
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

  const IMG = {};
  const IMAGE_PATHS = {
    sky: "art/sprites/kansas-dusk.jpg",
    yard: "art/sprites/sidewinder.png",
    late: "art/sprites/bootlegger.png",
    pip: "art/sprites/pip-merlot.png"
  };

  const assetsReady = Promise.all(Object.entries(IMAGE_PATHS).map(([key, src]) => new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
    IMG[key] = image;
  })));

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (a, b, t) => a + (b - a) * t;
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
      this.enabled = true;
    }

    wake() {
      if (!this.context) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.context = new AudioContext();
      }
      if (this.context?.state === "suspended") this.context.resume();
    }

    tone(frequency, duration, type = "sine", volume = 0.08, endFrequency = frequency) {
      if (!this.enabled || !this.context) return;
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(Math.max(20, frequency), now);
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain).connect(this.context.destination);
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
      source.connect(filter).connect(gain).connect(this.context.destination);
      source.start();
    }

    play(name, lotId = "table") {
      if (!this.enabled) return;
      this.wake();
      if (name === "start") {
        this.tone(98, 0.22, "sawtooth", 0.06, 147);
        window.setTimeout(() => this.tone(196, 0.22, "square", 0.035, 247), 110);
      } else if (name === "select") {
        this.tone(170, 0.055, "square", 0.035, 130);
      } else if (name === "launch") {
        if (lotId === "pea") this.tone(520, 0.13, "square", 0.055, 240);
        else if (lotId === "lug") {
          this.noise(0.28, 0.12, 640);
          this.tone(74, 0.36, "sawtooth", 0.11, 38);
        } else {
          this.noise(0.16, 0.07, 950);
          this.tone(130, 0.2, "triangle", 0.07, 72);
        }
      } else if (name === "split") {
        this.noise(0.12, 0.055, 1800);
        this.tone(330, 0.09, "square", 0.035, 520);
      } else if (name === "impact") {
        this.noise(lotId === "lug" ? 0.36 : 0.2, lotId === "lug" ? 0.16 : 0.09, lotId === "lug" ? 520 : 1200);
        this.tone(lotId === "lug" ? 52 : 92, lotId === "lug" ? 0.38 : 0.22, "sawtooth", 0.08, 34);
      } else if (name === "bottle") {
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
    player: { id: "player", side: "YARD", machine: "SIDEWINDER", x: 222, z: 0, facing: 1, hp: 3, maxHp: 3 },
    enemy: { id: "enemy", side: "LATE", machine: "BOOTLEGGER", x: 1058, z: 0, facing: -1, hp: 3, maxHp: 3 }
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
    shake: 0,
    resolveTimer: -1,
    intermission: 0,
    volley: null,
    aiTurns: 0,
    elapsed: 0,
    matchNumber: 0,
    firstAim: true,
    stats: null
  };

  const allTimeGrudge = (() => {
    try {
      const data = localStorage.getItem("BAG_GRUDGE");
      if (data) return JSON.parse(data);
    } catch (e) {}
    return { yard: 0, late: 0 };
  })();

  const rivalry = { yard: 0, late: 0, draws: 0, playerRun: 0, bestRun: 0, allTime: allTimeGrudge };

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
    for (let i = 0; i < 3; i += 1) {
      const bottle = document.createElement("i");
      bottle.className = `bottle${i >= hp ? " empty" : ""}`;
      bottle.setAttribute("aria-hidden", "true");
      container.appendChild(bottle);
    }
    container.setAttribute("aria-label", `${label}: ${hp} of 3 bottles`);
  }

  function updateHud() {
    const lot = LOTS[state.selected];
    const playerCanAim = state.mode === "match" && state.turn === "player" && state.phase === "aim";
    DOM.yardCard.classList.toggle("active", state.mode === "match" && state.turn === "player");
    DOM.lateCard.classList.toggle("active", state.mode === "match" && state.turn === "enemy");
    DOM.aimRail.classList.toggle("disabled", !playerCanAim);
    DOM.angleValue.textContent = `${Math.round(state.aimAngle)}°`;
    DOM.powerValue.textContent = `${Math.round(state.aimPower)}%`;
    DOM.powerFill.style.width = `${state.aimPower}%`;
    DOM.cutValue.textContent = state.aimCut.toFixed(1);
    DOM.cutSlider.value = state.aimCut;
    DOM.lotChip.textContent = `LOT ${lot.number}`;
    DOM.selectedLotName.textContent = lot.fullName;
    DOM.turnChip.textContent = state.turn === "player" ? "PIPS ON THE LIP" : "LATE AT THE LINE";
    DOM.controlHeadline.textContent = state.mode === "result" ? "MATCH RULED" : playerCanAim ? "YOUR SHOT" : state.phase === "ceremony" ? "CEREMONY ACTIVE" : state.turn === "enemy" ? "LATE SHOOTING" : "FIELD LIVE";
    DOM.controlHelp.textContent = state.mode === "result"
      ? "Run it back. The rivalry remembers."
      : playerCanAim
        ? state.stats?.shots > 0 ? "The chalk shows the climb. Old stains remember the range." : "Pick a lot. Drag anywhere on the field. Release to fire."
        : state.mode === "title" ? "Enter the ditch to begin." : "Hands clear while the lot is moving.";
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
    DOM.titleScreen.hidden = true;
    DOM.resultScreen.hidden = true;
    DOM.worldHud.hidden = false;
    DOM.protocolBanner.hidden = true;
    DOM.fieldHint.hidden = false;
    DOM.fieldStatus.textContent = `THE DITCH / MATCH ${String(state.matchNumber).padStart(2, "0")} / WIND CALM`;
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
      DOM.grudgeCard.hidden = false;
      DOM.worldHud.hidden = true;
      return;
    }

    DOM.resultScreen.hidden = false;

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
      ? { x: cart.x + 135, y: ground - 67 }
      : { x: cart.x - 118, y: ground - 111 };
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
    state.selected = lotId;
    state.aimAngle = aim.angle;
    state.aimPower = aim.power;
    state.phase = "intermission";
    beginShot("enemy", lotId, aim.angle, aim.power);
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

  function updateAimFromPoint(point) {
    const cart = carts.player;
    const muzzle = muzzleFor(cart);
    const forward = Math.max(14, (point.x - muzzle.x) * cart.facing);
    const rise = muzzle.y - point.y;
    state.aimAngle = clamp(Math.atan2(rise, forward) * 180 / Math.PI, 18, 82);
    state.aimPower = clamp(Math.hypot(forward, rise) / 4.15, 18, 100);
    updateHud();
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (state.mode !== "match" || state.turn !== "player" || state.phase !== "aim") return;
    event.preventDefault();
    sound.wake();
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.firstAim = false;
    DOM.fieldHint.hidden = true;
    try { canvas.setPointerCapture(event.pointerId); } catch (_) { /* capture is optional */ }
    updateAimFromPoint(canvasPoint(event));
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    event.preventDefault();
    updateAimFromPoint(canvasPoint(event));
  });

  function releasePointer(event) {
    if (!state.dragging || event.pointerId !== state.pointerId) return;
    event.preventDefault();
    updateAimFromPoint(canvasPoint(event));
    state.dragging = false;
    state.pointerId = null;
    beginShot("player", state.selected, state.aimAngle, state.aimPower, state.aimCut);
  }

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", (event) => {
    if (event.pointerId === state.pointerId) {
      state.dragging = false;
      state.pointerId = null;
    }
  });

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
    DOM.grudgeCard.hidden = true;
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

  buildLotButtons();
  DOM.worldHud.hidden = true;
  DOM.cutSlider.addEventListener("input", (event) => {
    state.aimCut = parseFloat(event.target.value);
    DOM.cutValue.textContent = state.aimCut.toFixed(1);
  });
  DOM.soundToggle.setAttribute("aria-pressed", "true");
  updateHud();

  function burstAt(x, y, count, kind = "juice", lotId = "table", options = {}) {
    const lot = LOTS[lotId] || LOTS.table;
    const { z = 0, vxNudge = 0, vyNudge = 0, vzNudge = 0, colorOverride = null } = options;
    for (let i = 0; i < count; i += 1) {
      const angle = randomBetween(-Math.PI, 0);
      const speed = kind === "smoke" ? randomBetween(18, 75) : randomBetween(80, lotId === "lug" ? 350 : 245);
      const life = randomBetween(kind === "smoke" ? 0.45 : 0.35, kind === "smoke" ? 1.05 : 0.9);
      const palette = colorOverride ? [colorOverride] : kind === "dirt"
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
        size: randomBetween(kind === "smoke" ? 5 : 2, kind === "smoke" ? 13 : lotId === "lug" ? 10 : 6),
        life,
        maxLife: life,
        color: palette[Math.floor(Math.random() * palette.length)],
        kind
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
    burstAt(cart.x, centerY + 28, direct ? 19 : 12, "juice", state.volley.lotId);
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
    addStain(impactX, lot.id, lot.id === "lug" ? 1.75 : projectile.child ? 0.62 : 1);
    addRing(impactX, impactY, lot.splashRadius || lot.craterRadius, lot.id === "pea" ? COLORS.cream : COLORS.juice);
    const targetCart = projectile.owner === "player" ? carts.enemy : carts.player;
    const zAcc = zAccuracy(projectile.z || 0, targetCart.z || 0);
    const pZ = projectile.z || 0;
    const desc = CEREMONIES[lot.id] || CEREMONIES.table;

    const isFirstHit = state.volley && !state.volley.ceremonyPlayed;
    if (isFirstHit) {
      if (state.volley) state.volley.ceremonyPlayed = true;

      if (zAcc.tier === TIER_DEAD) {
        if (projectile.owner === "player") state.cameraPunchZ = desc.punch;
        burstAt(impactX, impactY, Math.round(20 * childScale), desc.kind, lot.id, { z: pZ, vzNudge: -150, colorOverride: desc.color });
        burstAt(impactX, impactY, Math.round(10 * childScale), "dirt", lot.id, { z: pZ, vzNudge: -100 });
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
      state.selected = state.playerSelected || "table";
      const remembered = state.aimMemory[state.selected];
      state.aimAngle = remembered.angle;
      state.aimPower = remembered.power;
      state.aimCut = remembered.cut;
      DOM.fieldHint.hidden = true;
    }
    updateHud();
  }

  function updateEffects(dt) {
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

  function drawSky() {
    if (IMG.sky?.complete && IMG.sky.naturalWidth) {
      ctx.drawImage(IMG.sky, 0, 0, IMG.sky.naturalWidth, IMG.sky.naturalHeight * 0.61, 0, 0, W, 535);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, 0, 535);
      gradient.addColorStop(0, COLORS.sky);
      gradient.addColorStop(1, COLORS.horizon);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, 535);
    }

    const wash = ctx.createLinearGradient(0, 0, 0, 520);
    wash.addColorStop(0, "rgba(26,16,12,0.08)");
    wash.addColorStop(0.62, "rgba(90,22,56,0.04)");
    wash.addColorStop(1, "rgba(58,42,28,0.32)");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, W, 540);

    ctx.save();
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.dirt;
    ctx.beginPath();
    ctx.moveTo(0, 453);
    for (let x = 0; x <= W; x += 24) {
      const y = 450 + Math.sin(x * 0.025) * 4 + Math.sin(x * 0.071) * 2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // A spare Kansas windmill and utility line keep the field rural, not sci-fi.
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(750, 454);
    ctx.lineTo(764, 369);
    ctx.lineTo(778, 454);
    ctx.moveTo(746, 407);
    ctx.lineTo(781, 407);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(764, 369, 20, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 8; i += 1) {
      const angle = i * Math.PI / 4 + state.elapsed * 0.03;
      ctx.beginPath();
      ctx.moveTo(764, 369);
      ctx.lineTo(764 + Math.cos(angle) * 20, 369 + Math.sin(angle) * 20);
      ctx.stroke();
    }
    ctx.restore();
  }

  function terrainPath() {
    ctx.beginPath();
    ctx.moveTo(0, terrain[0]);
    for (let i = 1; i < COLS; i += 1) ctx.lineTo(i * CELL, terrain[i]);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
  }

  function drawTerrain() {
    terrainPath();
    const fill = ctx.createLinearGradient(0, 430, 0, H);
    fill.addColorStop(0, COLORS.dirt);
    fill.addColorStop(0.38, COLORS.dirt);
    fill.addColorStop(1, COLORS.ink);
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.save();
    terrainPath();
    ctx.clip();
    ctx.strokeStyle = "rgba(243,230,200,0.075)";
    ctx.lineWidth = 1;
    for (let band = 0; band < 6; band += 1) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 12) {
        const y = 536 + band * 34 + Math.sin(x * 0.018 + band) * 7;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    terrainMarks.forEach((mark) => {
      const y = groundAt(mark.x) + mark.inset;
      ctx.strokeStyle = `rgba(243,230,200,${mark.alpha})`;
      ctx.beginPath();
      ctx.moveTo(mark.x, y);
      ctx.lineTo(mark.x + mark.length, y + mark.tilt);
      ctx.stroke();
    });
    ctx.restore();

    ctx.lineJoin = "round";
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 8;
    ctx.beginPath();
    for (let i = 0; i < COLS; i += 1) {
      if (i === 0) ctx.moveTo(0, terrain[i]);
      else ctx.lineTo(i * CELL, terrain[i]);
    }
    ctx.stroke();
    ctx.strokeStyle = COLORS.horizon;
    ctx.globalAlpha = 0.38;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawStains() {
    ctx.save();
    state.stains.forEach((stain) => {
      const y = groundAt(stain.x) + 2;
      ctx.save();
      ctx.translate(stain.x, y);
      ctx.rotate(stain.rotation);
      ctx.fillStyle = stain.lotId === "pea" ? COLORS.oxblood : COLORS.juice;
      ctx.globalAlpha = 0.82;
      ctx.beginPath();
      ctx.ellipse(0, 0, stain.rx, stain.ry, 0, 0, Math.PI * 2);
      ctx.fill();
      stain.satellites.forEach((drop) => {
        ctx.beginPath();
        ctx.arc(drop.x * stain.rx, drop.y * stain.ry, drop.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });
    ctx.restore();
  }

  function drawFieldSign() {
    const x = 642;
    const y = groundAt(x) - 91;
    ctx.save();
    ctx.globalAlpha = 0.78;
    ctx.strokeStyle = COLORS.ink;
    ctx.fillStyle = COLORS.dirt;
    ctx.lineWidth = 5;
    ctx.fillRect(x - 87, y, 174, 43);
    ctx.strokeRect(x - 87, y, 174, 43);
    ctx.strokeStyle = COLORS.copper;
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 80, y + 6, 160, 31);
    ctx.fillStyle = COLORS.cream;
    ctx.textAlign = "center";
    ctx.font = "900 13px Impact, sans-serif";
    ctx.fillText("NIGHT HARVEST LEAGUE", x, y + 20);
    ctx.font = "700 8px Arial Narrow, sans-serif";
    ctx.fillStyle = COLORS.horizon;
    ctx.fillText("PROPERTY LINE / NO CLEAN HANDS", x, y + 32);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x - 65, y + 43);
    ctx.lineTo(x - 58, groundAt(x - 58) + 2);
    ctx.moveTo(x + 65, y + 43);
    ctx.lineTo(x + 58, groundAt(x + 58) + 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawFallbackCart(cart, ground) {
    ctx.fillStyle = cart.id === "player" ? COLORS.oxblood : COLORS.dirt;
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 6;
    ctx.fillRect(cart.x - 115, ground - 95, 230, 65);
    ctx.strokeRect(cart.x - 115, ground - 95, 230, 65);
    for (const wheelX of [cart.x - 72, cart.x + 75]) {
      ctx.beginPath();
      ctx.arc(wheelX, ground - 19, 27, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.ink;
      ctx.fill();
      ctx.strokeStyle = COLORS.copper;
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  }

  function drawCartMechanism(cart, ground, activity) {
    ctx.save();
    ctx.lineCap = "round";
    if (cart.id === "player") {
      const spin = state.elapsed * (activity ? 8.5 : 0.8);
      const centerX = cart.x + 54;
      [ground - 99, ground - 65].forEach((centerY, index) => {
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.arc(centerX + index * 4, centerY, 21, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = COLORS.juice;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX + index * 4, centerY, 17, spin + index, spin + index + Math.PI * 1.28);
        ctx.stroke();
        ctx.strokeStyle = COLORS.copper;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(spin) * 5, centerY + Math.sin(spin) * 5);
        ctx.lineTo(centerX + Math.cos(spin) * 16, centerY + Math.sin(spin) * 16);
        ctx.stroke();
      });
      ctx.strokeStyle = COLORS.copper;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX + 8, ground - 84);
      ctx.lineTo(cart.x + 132, ground - 67);
      ctx.stroke();
    } else {
      const pivotX = cart.x - 11;
      const pivotY = ground - 112;
      const muzzle = muzzleFor(cart);
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cart.x + 36, ground - 91);
      ctx.lineTo(pivotX, pivotY);
      ctx.lineTo(muzzle.x, muzzle.y);
      ctx.stroke();
      ctx.strokeStyle = COLORS.copper;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.quadraticCurveTo(cart.x - 62, ground - 142 - (activity ? Math.sin(state.elapsed * 12) * 5 : 0), muzzle.x, muzzle.y);
      ctx.stroke();
      ctx.fillStyle = COLORS.juice;
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 2;
      ctx.fillRect(cart.x + 14, ground - 119, 9, 47);
      ctx.strokeRect(cart.x + 14, ground - 119, 9, 47);
      ctx.fillStyle = COLORS.cream;
      ctx.fillRect(cart.x + 16, ground - 77 - (activity ? 30 : 14), 5, activity ? 30 : 14);
    }
    ctx.restore();
  }

  function drawCart(cart) {
    const ground = groundAt(cart.x);
    const activity = state.mode === "match" && state.turn === cart.id && (state.phase === "ceremony" || state.phase === "flight");
    ctx.save();
    ctx.globalAlpha = cart.hp <= 0 ? 0.72 : 1;
    ctx.fillStyle = "rgba(26,16,12,0.55)";
    ctx.beginPath();
    ctx.ellipse(cart.x, ground + 2, cart.id === "player" ? 150 : 137, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    const image = cart.id === "player" ? IMG.yard : IMG.late;
    if (image?.complete && image.naturalWidth) {
      const width = cart.id === "player" ? 316 : 292;
      const height = width * image.naturalHeight / image.naturalWidth;
      const recoil = activity && state.phase === "flight" ? -cart.facing * Math.max(0, 7 - state.projectiles[0]?.age * 45) : 0;
      ctx.drawImage(image, cart.x - width / 2 + recoil, ground - height + 8, width, height);
    } else {
      drawFallbackCart(cart, ground);
    }
    drawCartMechanism(cart, ground, activity);

    if (cart.hp < cart.maxHp) {
      const smokeCount = cart.hp === 1 ? 3 : 1;
      for (let i = 0; i < smokeCount; i += 1) {
        const phase = (state.elapsed * (0.55 + i * 0.08) + i * 0.31) % 1;
        ctx.fillStyle = `rgba(26,16,12,${0.35 * (1 - phase)})`;
        ctx.beginPath();
        ctx.arc(cart.x + (i - 1) * 11, ground - 122 - phase * 55, 8 + phase * 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawFallbackPip(x, y, scale = 1, flip = false, rotation = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(flip ? -scale : scale, scale);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 3;
    ctx.fillStyle = COLORS.juice;
    [[0, -45], [-11, -36], [11, -36], [-17, -24], [0, -25], [17, -24], [-9, -12], [9, -12]].forEach(([bx, by]) => {
      ctx.beginPath();
      ctx.arc(bx, by, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(0, -54);
    ctx.lineTo(7, -64);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, -26);
    ctx.lineTo(-25, -15);
    ctx.moveTo(14, -26);
    ctx.lineTo(25, -15);
    ctx.moveTo(-7, -5);
    ctx.lineTo(-10, 5);
    ctx.moveTo(7, -5);
    ctx.lineTo(10, 5);
    ctx.stroke();
    ctx.restore();
  }

  function drawPip(x, ground, scale = 1, flip = false, rotation = 0, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(26,16,12,0.46)";
    ctx.beginPath();
    ctx.ellipse(x, ground + 1, 19 * scale, 5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    const image = IMG.pip;
    if (image?.complete && image.naturalWidth) {
      const height = 94 * scale;
      const width = height * image.naturalWidth / image.naturalHeight;
      ctx.translate(x, ground + 3);
      ctx.rotate(rotation);
      ctx.scale(flip ? -1 : 1, 1);
      ctx.drawImage(image, -width / 2, -height, width, height);
    } else {
      drawFallbackPip(x, ground, scale, flip, rotation);
    }
    ctx.restore();
  }

  function drawIdleCrew() {
    const activeCeremony = state.ceremony?.shooterId;
    const bob = Math.sin(state.elapsed * 2.1) * 1.2;
    if (activeCeremony !== "player") {
      drawPip(63, groundAt(63) + bob, 0.94, false, -0.015);
      drawPip(397, groundAt(397) - bob, 0.9, true, 0.02);
    }
    if (activeCeremony !== "enemy") {
      drawPip(886, groundAt(886) - bob, 0.9, false, -0.02);
      drawPip(1217, groundAt(1217) + bob, 0.94, true, 0.015);
    }
  }

  function drawBerry(x, y, radius = 8, pea = false) {
    ctx.fillStyle = pea ? COLORS.dirt : COLORS.juice;
    ctx.strokeStyle = COLORS.cream;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + 3, y - radius - 6);
    ctx.stroke();
  }

  function drawScale(x, ground, facing) {
    ctx.save();
    ctx.strokeStyle = COLORS.cream;
    ctx.fillStyle = COLORS.dirt;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, ground - 6);
    ctx.lineTo(x, ground - 43);
    ctx.moveTo(x - 30, ground - 35);
    ctx.lineTo(x + 30, ground - 35);
    ctx.moveTo(x - 25, ground - 35);
    ctx.lineTo(x - 31, ground - 18);
    ctx.moveTo(x + 25, ground - 35);
    ctx.lineTo(x + 31, ground - 18);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x - 31, ground - 15, 17, 5, 0, 0, Math.PI * 2);
    ctx.ellipse(x + 31, ground - 15, 17, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawBerry(x + facing * 31, ground - 24, 7);
    ctx.restore();
  }

  function drawCrate(x, y, rotation = 0, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(scale, scale);
    ctx.fillStyle = COLORS.dirt;
    ctx.strokeStyle = COLORS.cream;
    ctx.lineWidth = 3;
    ctx.fillRect(-28, -20, 56, 40);
    ctx.strokeRect(-28, -20, 56, 40);
    ctx.strokeStyle = COLORS.copper;
    ctx.beginPath();
    ctx.moveTo(-25, -16);
    ctx.lineTo(25, 16);
    ctx.moveTo(25, -16);
    ctx.lineTo(-25, 16);
    ctx.stroke();
    ctx.fillStyle = COLORS.juice;
    for (let row = 0; row < 2; row += 1) {
      for (let column = 0; column < 4; column += 1) {
        ctx.beginPath();
        ctx.arc(-16 + column * 11, -7 + row * 13, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawCeremony() {
    const ceremony = state.ceremony;
    if (!ceremony) return;
    const cart = carts[ceremony.shooterId];
    const facing = cart.facing;
    const progress = clamp(ceremony.elapsed / ceremony.duration, 0, 1);
    const motion = easeInOut(progress);
    const front = cart.x + facing * 160;
    const frontGround = groundAt(front);

    if (ceremony.lotId === "table") {
      const scaleX = front - facing * 8;
      drawScale(scaleX, groundAt(scaleX), facing);
      drawPip(front - facing * 63, groundAt(front - facing * 63), 0.91, facing < 0, Math.sin(progress * Math.PI * 4) * 0.025);
      drawPip(front + facing * 58, groundAt(front + facing * 58), 0.88, facing > 0, -0.03);
      drawPip(front - facing * 108, groundAt(front - facing * 108), 0.83, facing < 0, 0.04);
      ctx.save();
      ctx.strokeStyle = COLORS.cream;
      ctx.globalAlpha = 0.8;
      ctx.lineWidth = 5;
      ctx.beginPath();
      const wipeX = scaleX + facing * (14 + Math.sin(progress * Math.PI * 6) * 15);
      ctx.moveTo(wipeX, frontGround - 37);
      ctx.lineTo(wipeX + facing * 15, frontGround - 24);
      ctx.stroke();
      ctx.restore();
    } else if (ceremony.lotId === "pea") {
      const peaX = front;
      const peaY = frontGround - 41;
      drawPip(front - facing * 45, groundAt(front - facing * 45), 0.92, facing < 0, -0.05);
      drawPip(front + facing * 48, groundAt(front + facing * 48), 0.92, facing > 0, 0.05);
      drawPip(front - facing * 94, groundAt(front - facing * 94), 0.8, facing < 0, Math.sin(progress * 16) * 0.08);
      drawBerry(peaX, peaY, 5, true);
      const caliperGap = 11 + Math.sin(progress * Math.PI * 6) * 3;
      ctx.save();
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(peaX - caliperGap, peaY - 16);
      ctx.lineTo(peaX - caliperGap, peaY + 13);
      ctx.lineTo(peaX - 4, peaY + 13);
      ctx.moveTo(peaX + caliperGap, peaY - 16);
      ctx.lineTo(peaX + caliperGap, peaY + 13);
      ctx.lineTo(peaX + 4, peaY + 13);
      ctx.moveTo(peaX - caliperGap, peaY - 13);
      ctx.lineTo(peaX + caliperGap, peaY - 13);
      ctx.stroke();
      ctx.restore();
    } else if (ceremony.lotId === "cluster") {
      const pileX = front - facing * 8;
      for (let i = 0; i < 5; i += 1) {
        const startX = cart.x - facing * (155 - i * 36);
        const column = i % 2;
        const row = Math.floor(i / 2);
        const targetX = pileX + facing * (column ? 13 : -13);
        const targetGround = groundAt(pileX) - row * 39 - (column ? 7 : 0);
        const x = lerp(startX, targetX, motion);
        const y = lerp(groundAt(startX), targetGround, motion);
        drawPip(x, y, 0.84, (i % 2 === 0) === (facing < 0), (i - 2) * 0.035 * motion);
      }
      ctx.save();
      ctx.globalAlpha = progress;
      for (let i = 0; i < 7; i += 1) {
        const angle = i / 7 * Math.PI * 2;
        drawBerry(pileX + Math.cos(angle) * 15, groundAt(pileX) - 82 + Math.sin(angle) * 12, 7);
      }
      ctx.restore();
    } else {
      const pulleyX = cart.x + facing * 92;
      const pulleyY = groundAt(pulleyX) - 179;
      const crateX = front;
      const crateGround = groundAt(crateX);
      const crateY = lerp(crateGround - 23, crateGround - 92, easeOut(progress));
      ctx.save();
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(cart.x - facing * 12, groundAt(cart.x) - 112);
      ctx.lineTo(pulleyX, pulleyY);
      ctx.lineTo(crateX, crateY - 25);
      ctx.stroke();
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pulleyX, pulleyY, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(crateX, crateY - 25);
      ctx.lineTo(crateX - 18, crateY - 5);
      ctx.moveTo(crateX, crateY - 25);
      ctx.lineTo(crateX + 18, crateY - 5);
      ctx.stroke();
      ctx.restore();
      drawCrate(crateX, crateY, Math.sin(progress * 9) * 0.035, 0.9);
      for (let i = 0; i < 4; i += 1) {
        const pipX = cart.x - facing * (95 + i * 42) + facing * Math.sin(progress * 11 + i) * 4;
        drawPip(pipX, groundAt(pipX), 0.83, facing > 0, -facing * 0.09);
      }
    }
  }

  function drawProjectileShape(projectile) {
    const lot = LOTS[projectile.lotId];
    ctx.save();
    ctx.translate(projectile.x, projectile.y);
    ctx.rotate(projectile.rotation);
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 2.5;

    if (projectile.lotId === "pea") {
      ctx.fillStyle = COLORS.dirt;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (projectile.lotId === "cluster" && !projectile.child) {
      ctx.fillStyle = COLORS.juice;
      [[0, -7], [-7, -1], [7, -1], [-4, 7], [5, 7], [0, 14]].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.strokeStyle = COLORS.copper;
      ctx.beginPath();
      ctx.moveTo(0, -13);
      ctx.lineTo(5, -21);
      ctx.stroke();
    } else if (projectile.lotId === "lug") {
      drawCrate(0, 0, 0, 0.62);
    } else {
      ctx.fillStyle = COLORS.juice;
      ctx.beginPath();
      ctx.arc(0, 0, lot.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(243,230,200,0.55)";
      ctx.beginPath();
      ctx.arc(-lot.radius * 0.3, -lot.radius * 0.32, Math.max(1.4, lot.radius * 0.2), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.copper;
      ctx.beginPath();
      ctx.moveTo(0, -lot.radius + 1);
      ctx.lineTo(4, -lot.radius - 6);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawProjectiles() {
    state.projectiles.forEach((projectile) => {
      projectile.trail.forEach((point, index) => {
        const alpha = (index + 1) / projectile.trail.length * 0.34;
        ctx.fillStyle = projectile.lotId === "pea" ? `rgba(243,230,200,${alpha})` : `rgba(90,22,56,${alpha})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, projectile.lotId === "lug" ? 4 : 2.6, 0, Math.PI * 2);
        ctx.fill();
      });
      drawProjectileShape(projectile);
    });
  }

  function previewPoints(cart, lot, angle, power) {
    const muzzle = muzzleFor(cart);
    const velocity = velocityFor(cart, lot, angle, power);
    let x = muzzle.x;
    let y = muzzle.y;
    let vx = velocity.x;
    let vy = velocity.y;
    const points = [];
    let apexIndex = -1;
    for (let step = 0; step < 80; step += 1) {
      const previousVy = vy;
      vy += GRAVITY * lot.gravity * 0.055;
      x += vx * 0.055;
      y += vy * 0.055;
      if (apexIndex < 0 && previousVy < 0 && vy >= 0) apexIndex = points.length;
      if (step % 2 === 0) points.push({ x, y });
      if (x < 0 || x > W || y > H || (x >= 0 && x <= W && y + lot.radius >= groundAt(x))) break;
    }
    return { points, apexIndex, end: points[points.length - 1] };
  }

  function drawAimPreview() {
    if (state.mode !== "match" || state.turn !== "player" || state.phase !== "aim") return;
    const cart = carts.player;
    const lot = LOTS[state.selected];
    const preview = previewPoints(cart, lot, state.aimAngle, state.aimPower);
    const muzzle = muzzleFor(cart);

    ctx.save();
    ctx.strokeStyle = "rgba(243,230,200,0.32)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(muzzle.x, muzzle.y);
    const guideLength = 34 + state.aimPower * 0.45;
    const radians = state.aimAngle * Math.PI / 180;
    ctx.lineTo(muzzle.x + Math.cos(radians) * guideLength, muzzle.y - Math.sin(radians) * guideLength);
    ctx.stroke();

    const firstLesson = !state.stats || state.stats.shots === 0;
    const revealCount = firstLesson
      ? preview.points.length
      : lot.id === "cluster" && preview.apexIndex >= 0 ? Math.max(14, preview.apexIndex + 2) : 14;
    const visiblePoints = preview.points.slice(0, revealCount);
    visiblePoints.forEach((point, index) => {
      const fade = 1 - index / Math.max(1, visiblePoints.length) * 0.48;
      ctx.fillStyle = `rgba(90,22,56,${fade})`;
      ctx.strokeStyle = `rgba(243,230,200,${fade * 0.72})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(point.x, point.y, index % 4 === 0 ? 4.2 : 3.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    if (lot.id === "cluster" && preview.apexIndex >= 0) {
      const point = preview.points[Math.min(preview.points.length - 1, preview.apexIndex)];
      if (point) {
        ctx.strokeStyle = COLORS.cream;
        ctx.lineWidth = 1.5;
        for (let i = -2; i <= 2; i += 1) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(point.x + i * 11, point.y + 17 + Math.abs(i) * 2);
          ctx.stroke();
        }
      }
    }

    if (firstLesson && preview.end) {
      ctx.strokeStyle = COLORS.cream;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(preview.end.x - 10, preview.end.y - 3);
      ctx.lineTo(preview.end.x, preview.end.y + 7);
      ctx.lineTo(preview.end.x + 10, preview.end.y - 3);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEffects() {
    state.rings.forEach((ring) => {
      ctx.save();
      ctx.globalAlpha = clamp(ring.life / ring.maxLife, 0, 1) * 0.82;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 5 * ring.life / ring.maxLife + 1;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    state.particles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = clamp(particle.life / particle.maxLife, 0, 1) * (particle.kind === "smoke" ? 0.38 : 0.9);
      ctx.fillStyle = particle.color;
      if (particle.kind === "dirt") {
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.x * 0.02);
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 0.62);
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    state.floaters.forEach((floater) => {
      const alpha = clamp(floater.life / floater.maxLife, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = "center";
      ctx.font = `900 ${floater.strong ? 27 : 20}px Impact, Haettenschweiler, sans-serif`;
      ctx.lineWidth = 6;
      ctx.strokeStyle = COLORS.ink;
      ctx.strokeText(floater.copy, floater.x, floater.y);
      ctx.fillStyle = COLORS.cream;
      ctx.fillText(floater.copy, floater.x, floater.y);
      ctx.restore();
    });
  }

  function drawSideLabels() {
    ctx.save();
    ctx.font = "900 11px Arial Narrow, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(243,230,200,0.64)";
    ctx.strokeStyle = COLORS.ink;
    ctx.lineWidth = 4;
    const yardY = groundAt(carts.player.x) + 28;
    const lateY = groundAt(carts.enemy.x) + 28;
    ctx.strokeText("YARD / SIDEWINDER", carts.player.x, yardY);
    ctx.fillText("YARD / SIDEWINDER", carts.player.x, yardY);
    ctx.strokeText("LATE / BOOTLEGGER", carts.enemy.x, lateY);
    ctx.fillText("LATE / BOOTLEGGER", carts.enemy.x, lateY);
    ctx.restore();
  }

  function render2d() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (state.shake > 0) {
      const strength = state.shake;
      ctx.translate(randomBetween(-strength, strength), randomBetween(-strength * 0.5, strength * 0.5));
    }
    drawSky();
    drawTerrain();
    drawStains();
    drawFieldSign();
    drawCart(carts.player);
    drawCart(carts.enemy);
    drawIdleCrew();
    drawCeremony();
    drawAimPreview();
    drawProjectiles();
    drawEffects();
    drawSideLabels();
    ctx.restore();
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
    } else {
      render2d();
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
    state,
    carts,
    terrain,
    baseTerrain,
    W, H, CELL,
    groundAt,
    LOTS,
    IMG,
    COLORS,
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

  assetsReady.finally(() => {
    if (window.__BAG__.render3D) window.__BAG__.render3D();
    else render2d();
  });
  requestAnimationFrame(frame);

  if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // The match remains fully playable if offline support is unavailable.
      });
    });
  }
})();
