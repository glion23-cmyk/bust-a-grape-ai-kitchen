# Round 01 gate — dimensional wedge

VERDICT: REPAIR

## WHAT LANDED

Real structural progress. Three.js is vendored and bundled with MIT compliance. A `renderer3d.js` stands up a WebGL scene behind the existing DOM HUD and match state. The projectile carries `(x, y, z)` and `vz` is generated from CUT. Target hit-testing includes z. The Canvas fallback boots when WebGL fails. The deterministic fixture confirms equal final crater `(x, z)` across 60/120 fps. The build pipeline, service worker, and offline contract survive. TABLE reaches ceremony via drag-to-aim at both tested phone viewports. The rules/renderer seam exists and the match is not stranded. This is a genuine renderer proof.

## EVIDENCE CHECKED

- `collab/directives/01-dimensional-wedge.md` — the round contract and eight acceptance checks.
- `collab/evidence/01-dimensional-gate-dossier.md` — automated results, Playwright browser probe at 844×390 and 740×360, physics audit, visual audit.
- `collab/evidence/01-dimensional-844x390.png` — pale void, gray proxy boxes, overlapping controls, stock slider.
- `collab/evidence/01-dimensional-740x360.png` — same defects, tighter.
- `collab/handoffs/gemini.md` — Gemini's claims. Two are overstated (see below).

**Handoff honesty notes.** The claim "True Depth-Local Terrain Deformation" is only visually true; the simulation still mutates a shared 1D heightfield and `groundAt(x)` ignores z. The claim of a "rigorous" fixture is overstated; trajectory samples are recorded but never compared, and the AI assertion checks only a broad phase set. These must be corrected in the handoff alongside the code fixes.

## BLOCKERS

### B1 — CUT control is dead; fix pointer-events and layout overlap

The `.world-hud` container applies `pointer-events: none`, which the CUT range input inherits. `elementFromPoint` at the slider thumb returns the transparent input canvas; an actual click leaves `aimCut` at zero. The ceremony banner and aim readouts overlap severely at both 844×390 and 740×360, burying the control even if pointer-events were fixed.

**Repair scope:**
- Give the CUT slider (or its immediate wrapper) `pointer-events: auto` so it receives touch/click.
- Reflow the aim-control bar so ANGLE, JUICE, CUT, and the ceremony banner do not overlap at 740×360. One thumb must reach CUT without a second simultaneous finger (directive §PHONE BUDGET).
- Re-run the Playwright probe at both viewports and confirm `elementFromPoint` hits the slider, `aimCut` changes from zero, and no aim control is clipped.

**Acceptance checks addressed:** 2 (player can identify/use cut), 7 (no clipped aim control).

### B2 — Terrain collision and splash are z-blind; make the physics honest

`groundAt(x)` does not accept z; every depth lane hits the same ground height. `craterAt(x, z, ...)` records z for the visual mesh but mutates the shared 1D heightfield, so subsequent shots collide with that crater across all z lanes. Splash/damage distance ignores both impact z and cart z. The directive requires "a projectile owns `(x, y, z)` position and collides against both terrain volume and target depth, not a painted screen coordinate" and that "z determines hit/graze/miss."

**Repair scope:**
- Make ground-collision z-aware: either promote `groundAt` to `groundAt(x, z)` backed by per-lane crater storage, or accumulate crater depth offsets and query them during collision. A projectile at z = 30 must not fall into a crater at z = −20.
- Include z-distance in splash/damage radius so a near-side impact does not damage a far-side cart at the same x.
- Extend the fixture to compare per-step `(x, y, z)` trajectory samples (not just final crater position) across frame rates, and assert that two shots at different z values produce different ground-collision times when one passes over a crater and the other does not.
- Correct the handoff claim to match the actual state.

**Acceptance checks addressed:** 4 (crater at actual x,z), 5 (deterministic trajectory), the dimensional-mechanic contract.

### B3 — Restore game identity to the 3D scene; add one depth read

The screenshots show a pale blue-gray void with two untextured gray-purple boxes and a stock browser slider. The production Kansas dusk palette, cart silhouettes, Pip scale, ceremony character art, and the mean painted-flat identity are all absent when WebGL is active. The directive permits "temporary textured planes or simple proxy meshes" but requires them at "correct wheel-high scale" in a field that "suddenly has mass." Gray boxes in a featureless void fail the player-promise test: nobody looks at this and wants the correction shot.

**Repair scope (smallest viable, no 3D asset pipeline):**
- Set the scene clear color and a single hemisphere light to the Kansas dusk warm/cool gradient so the 3D field reads as the same world the 2D game lives in.
- Tint the ground mesh to the existing dirt brown; add a subtle near/far ground-lane stripe, shadow, or value shift so the player can read cut depth before firing.
- Replace each cart proxy box with a textured plane (billboard) carrying the existing 2D cart sprite at wheel-high scale, or at minimum tint and shape the proxy so it reads as Sidewinder/Bootlegger rather than an anonymous cube.
- Style the CUT slider to match the existing HUD palette (dark background, cream/gold text, maroon accents) instead of the browser default.
- Confirm at 844×390 and 740×360 that the field, carts, and depth cue are distinguishable and that the scene does not regress to a gray void.

**Acceptance checks addressed:** 2 (identify cut before firing), 3 (camera composition that doesn't hide launchers), 7 (readable at phone viewports), player promise (the field has mass).
