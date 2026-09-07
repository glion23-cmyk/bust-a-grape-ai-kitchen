# STATUS — accumulation index
Updated 2026-09-06

This file is what the rebuilt playable slice actually has versus what a fuller 1.0 still needs.

## Locked (do not reopen without a reason)

- Title: **Bust a Grape**
- Genre costume: artillery hill duel. Always grapes.
- Slice map: The Ditch. No scoot. 3 HP. Wind off.
- Live lots: Table / Pea / Cluster / Lug
- Controls: drag to aim, release to fire (mobile + desktop)
- Pips: walking grape **bunches** with arms, legs, stem, boots, stern face
- Pips are not Minions and not rats
- Mouth: text, PG-13
- Oneshot audio: synth SFX only
- Delivery: mobile-first web/PWA. Engine is not locked; the current prototype is HTML + Canvas.

## Have (in this folder)

| Thing | Where |
|---|---|
| Rebuilt playable slice | `index.html` `game.js` `style.css` |
| Approved middle-ground board | `art/boards/APPROVED-board-J-kansas-buggy-class.jpg` |
| Production world art | `art/sprites/kansas-dusk.jpg`, `sidewinder.png`, `bootlegger.png`, `pip-merlot.png` |
| Production title lockup | `art/gui/lockup.png` |
| Mobile install/offline shell | `manifest.webmanifest`, `sw.js`, `art/gui/app-icon.svg`, `art/gui/apple-touch-icon.png` |
| Hardened hosting bundle | `scripts/build-pages.sh`, `hosting/_headers`, `hosting/robots.txt` |
| Public phone build | `https://bust-a-grape.pages.dev` |
| Claude + Gemini kitchen | `CLAUDE.md`, `GEMINI.md`, `collab/`, `scripts/cook-round.sh` |
| Lot stats (4) | `content/lots.json` |
| Announcer lines | `content/lines.json` |
| Full design bible | `docs/gdd.md` |
| Style-board prompt | `docs/style-prompt.md` |
| Legal fence | `docs/legal.md` |
| Board archive | `art/boards/` (approved middle-ground board plus source explorations) |

## Boards on file

Two lanes. Do not average them.

Lane 1 — slice:
- `art/boards/board-A-poster-cannons.jpg`
- `art/boards/board-B-gui-crates.jpg` — strongest GUI personality
- `art/boards/board-C-playfield-bunches.jpg` — strongest Pips + simple carts
- `art/boards/board-D-gui-enamel.jpg`

Lane 2 — Night Harvest League, park:
- `board-E-bootlegger-blueprint.jpg`
- `board-F-field-hud-nhl.jpg`
- `board-G-yard-office-gui.jpg`
- `board-H-sidewinder-blueprint.jpg`

Middle ground locked: C bodies + B chrome + NHL dirt. See `docs/middle-ground.md`.
Do not build Sidewinder/Bootlegger at full blueprint scale.

## Flat prototype completed 2026-09-06

- One landscape broadcast frame; no split webpage/game presentation
- Correct harvest-buggy scale for Sidewinder and Bootlegger
- Wheel-high Pips and four distinct ceremony choreographies
- Fixed-step artillery, destructible terrain, craters, stains, recoil, particles, and screen shake
- TABLE = honest splash; PEA = fast two-bottle direct snipe; CLUSTER = five-way apex break; LUG = slow heavy crater
- Terrain-solving Late AI with bounded error instead of random angle/power guesses
- Per-lot aim memory, teaching arc on shot one, partial chalk arc afterward
- Context-sensitive non-repeating announcer pool, scoring stats, and fast rivalry rematches
- Synthesized launch, impact, bottle, split, and UI sounds with a mute control
- Browser-sized phone landscape pass at 844 × 390; mouse, pointer/touch, and keyboard input
- Phone-ready app metadata, landscape home-screen mode, and offline core-file cache for HTTPS hosting
- Full-bleed short-landscape layout that uses the live visual viewport, safe-area HUD edges, and crop-aware aiming

## Dimensional pivot commissioned 2026-09-06

- The shipping direction must go meaningfully beyond flat 2D while retaining a mostly side-on artillery read.
- True 3D or mechanically meaningful 2.5D qualifies; decorative parallax alone does not.
- Claude Opus 4.6 is the bounded creative-director/architecture/gate lane.
- Gemini Pro High is the implementation, physics, tuning, testing, and mobile-performance lane.
- The flat Canvas build stays runnable as the behavioral baseline until a thin dimensional slice beats it on aim readability, impact pleasure, and phone frame pacing.

## Need for oneshot 1.0 — not boards

The oneshot is playable with production art and procedural effects. “Oneshot 1.0” here means the slice is tested and authored deeply enough to show people beyond the core team.

### Ready in the slice
- [x] Approved middle-ground style board
- [x] Yard and Late launcher sprites
- [x] Four visibly different ammo behaviors and silhouettes
- [x] Impact pulp, dirt, persistent stain, crater, and shake feedback
- [x] Kansas dusk and painted destructible dirt treatment
- [x] Title lockup, crate lot buttons, juice rail, bottles, broadcast line, and result cards
- [x] Synthesized thump, snap, split, splat, bottle, UI, and result cues
- [x] Browser phone-landscape layout and touch-distance test
- [x] PWA manifest, app icons, and offline rematch shell

### Still worth producing for 1.0
- [ ] Purpose-drawn Pip animation sheet: idle, walk, wipe/weigh, calipers, pile-on, tackle; Merlot/Cab/green
- [ ] Recorded and mixed SFX replacing procedural synthesis
- [ ] One original title hook / reactive score sketch
- [ ] Physical iPhone and Android landscape playtest; tune drag curve from actual thumbs
- [ ] Accessibility options beyond sound and reduced-motion support

### Not needed for the slice — 1.0 after
- Lots 5–12 + numbers
- Heat / ripen-in-the-bucket
- Wind vane that lies
- Houses as passives (Yard / Late / Ice / Wedding)
- Maps 2–6
- Full 7-track interactive score
- Recorded VO
- Online / Daily / hotseat polish
- Hats

## Need that is not art

These block a serious 1.0 more than extra drawings:

1. **Physical-phone feel pass** — browser emulation passes; actual thumb travel still decides whether `dist / 4.15` is final.
2. **Sprite animation** — choreography reads now, but dedicated frames will make the Pips feel authored rather than staged from one pose.
3. **Audio production** — procedural cues are responsive, but the game still needs its own recorded sonic fingerprint and title hook.
4. **Longer balance telemetry** — PEA's two-bottle direct reward and CLUSTER's two-damage cap need a real group playtest.

## How to add things without wrecking the pile

- Boards → `art/boards/`
- “Use this piece” crops → `art/refs/`
- Transparent production PNGs → `art/sprites/` or `art/gui/`
- Wav/mp3 hits → `audio/sfx/`
- Music beds → `audio/music/`
- New lot ideas → new key in `content/lots.json`, do not invent a missile
- New insults → `content/lines.json` under an existing trigger

Do not drop random Midjourney dumps into `sprites/` until a board is approved. That is how the look splits in half.
