# ROUND 03 — MODERN KANSAS EXECUTION CONTRACT

This document is the binding architecture and acceptance contract for the vertical slice defined in `03-modern-kansas-rebuild.md`. It resolves every open decision. Gemini implements; Opus gates.

---

## 1. Retained Systems

Keep these modules intact. Do not rewrite, fork, or abstract them.

| System | File | What stays |
|--------|------|------------|
| Game state machine | `game.js` | `state` object, phase FSM (`title → aim → ceremony → flight → intermission`), turn alternation, match/series/grudge flow, `resetMatch`, `finishMatch`, `resolveVolley` |
| Fixed-step physics | `game.js` | `FIXED_STEP = 1/120`, accumulator loop, `updateProjectilesFixed`, gravity/velocity model, `LOTS` table (speed, gravity, radius, damage caps) |
| Ammunition behaviors | `game.js` | `splitCluster` (apex split into 5 children), `impactProjectile` (crater, splash, z-accuracy tiers), all four lot definitions |
| AI solver | `game.js` | `solveAiAim`, `chooseAiLot`, `startAiTurn` |
| Terrain heightfield | `game.js` | `terrain[]`, `baseTerrain[]`, `groundAt()`, `craterAt()`, seeded generation |
| Sound | `game.js` | `SoundBoard` class, all `sound.play()` calls |
| PWA/offline | `sw.js`, `manifest.webmanifest` | Service worker, manifest, offline cache |
| HUD DOM + CSS | `index.html`, `style.css` | Team cards, bottle rack, turn chip, ammo buttons, result/title/grudge screens, all responsive breakpoints including ≤360px landscape |

## 2. Replaced Systems

| What dies | Why | Replacement |
|-----------|-----|-------------|
| Canvas 2D renderer (`render2d` and all `draw*` functions) | Flat sprite planes violate true-3D requirement | Three.js scene rendered by `renderer3d.js` |
| `makePaintedPlane` billboard identity | Sprite planes are explicitly rejected | Procedural Three.js geometry (see §6) |
| Canvas-anywhere drag aiming | A tap anywhere on the canvas fires; directive requires launcher-origin grab | Pointer-capture gesture system on a 3D grab zone (see §4) |
| `aimRail` angle/power/cut HUD panel | Permanent numeric readouts + cut slider are removed by directive | Replaced by in-world visual feedback only: rubber-band line and fading trajectory dots |
| Dark juice-tint scene colors | `scene.background = #5A1638`, `FogExp2(#5A1638)` | Kansas daylight palette (see §7) |

## 3. Module Boundaries

Three files. No bundler. No new dependencies beyond `three.min.js` (already vendored).

**`game.js`** — State, physics, turns, AI, HUD DOM. Exports `window.__BAG__` exactly as today, plus one new field: `gestureState` (see §4). Calls `window.__BAG__.render3D()` each frame as it already does. Never touches `THREE`.

**`renderer3d.js`** — Owns the Three.js scene, camera, lights, all meshes, the procedural launcher/Pip geometry, animation state machine ticks, and the daylight environment. Reads `__BAG__` (state, carts, terrain, projectiles, particles, craters). Writes nothing back to game state except through `__BAG__.gestureState`.

**`index.html` / `style.css`** — DOM structure stays. Remove `aimRail` div, `cutSlider`, angle/power/cut readout elements. Keep everything else. The `<canvas id="c">` remains as the 2D fallback; the WebGL canvas is inserted before it by renderer3d.js (existing pattern).

## 4. Pull + Shape Gesture — Exact Math

### Grab zone
The renderer projects each launcher's chassis bounding box to screen space and expands it to guarantee a minimum **56 CSS px** hit target. `pointerdown` is accepted only if the screen-space point falls inside this expanded rect for the active-turn launcher. A tap anywhere else is ignored (no firing, no state change).

### Dead zone
On each `pointermove`, compute `pullPx = hypot(screenΔx, screenΔy)` from the grab origin. While `pullPx < 28` CSS px, the gesture is in the dead zone: show no preview, do not commit aim values.

### Pull vector → pitch + impulse
Once past the dead zone:
```
pullDir   = normalize(grabOrigin − currentPointer)    // screen coordinates: down-left gives (+x, -y)
pitch     = atan2(-pullDir.y, pullDir.x · cart.facing) // negate screen Y; clamp [18°, 82°]
impulse   = clamp(pullPx / 4.15, 18, 100)            // same scale as existing aimPower
```
These feed directly into the existing `velocityFor()` function with no conversion.

### Shape (curvature → depth spin)
Maintain a ring buffer of the last 8 pointer positions sampled at ≥ 6 px spacing. Compute signed curvature as the average cross-product of consecutive displacement vectors divided by their magnitude product. Map linearly to `cut ∈ [−1, 1]`. A straight pull produces cut ≈ 0. This replaces the cut slider entirely.

### Cancellation (exhaustive)
All of these cancel the gesture without consuming a turn or changing aim:
- `pointerup` or `pointercancel` while `pullPx < 28`
- `orientationchange` event
- Second pointer touches canvas (multi-touch)
- `lostpointercapture` event
- `visibilitychange` to hidden

On cancel: reset `gestureState` to idle, hide preview, keep previous aim memory.

### Preview
While dragging past dead zone, render a rubber-band line from launcher muzzle in the aim direction plus the existing fading trajectory dots (ported from `drawAimPreview`). The preview fades out at 14 dots (or apex+2 for Cluster). No endpoint marker, no hit-lock ring, no numeric readout.

## 5. Deterministic Physics State

The shot specification is a value type: `{ shooterId, lotId, pitch, impulse, cut, seed }`. Given identical specification, `updateProjectilesFixed` at 1/120 s produces bitwise-identical positions. This is already true; preserve it.

Add `seed` (uint32) to the specification. Use it to seed wind per-turn (currently always calm). Wind is a constant `vec2(wx, 0)` acceleration added in `updateProjectilesFixed`. For the vertical slice, wind range is `[−15, 15]` world units/s². Visualize wind by biasing wheat-stub sway and particle drift in `renderer3d.js`; game.js owns the value.

Terrain deformation (`craterAt`) is also deterministic from the shot sequence.

## 6. True-3D Asset Strategy

No imported `.glb` or `.gltf` in the vertical slice. All geometry is procedural Three.js built at init.

### Launchers
Each launcher is a `THREE.Group` of 10–20 primitives: boxes, cylinders, spheres, tori, and extruded shapes. Target polycount: **800–1 400 triangles per launcher**. Materials: `MeshStandardMaterial` with 3–4 flat colors per machine (oxblood/carbon/cyan-diagnostic for Sidewinder; olive-gray/yellow-caution/dark-steel for Bootlegger). No textures. Color blocking reads as graphic-novel 3D.

**Sidewinder** silhouette: low wedge body, two visible drum cylinders at the front-top, a cleat belt (torus segment), hub-motor wheels with visible suspension arms, and a retractable LiDAR mast (thin cylinder + small box).

**Bootlegger** silhouette: boxy hopper body, pressure vessel (horizontal cylinder underneath), horseshoe linear ram + sling arm assembly above hopper, four wheels, two deployable stabilizer feet (animated down during ceremony).

Neither machine exceeds 2.5× its wheel-to-wheel length in any visible dimension.

### Pips
Each Pip: **200–350 triangles**. A cluster of 6–8 spheres (grape berries), one with a flattened-front "face" (two dark-circle eyes, stern line mouth via decal or geometry). Twig limbs (thin cylinders), stem on top, two tiny box boots at bottom. `MeshStandardMaterial`, grape-purple with slight roughness variation. Instantiate via `InstancedMesh` for the 5-Pip ceremony crowds.

### Projectiles
Reuse Pip berry sphere for TABLE. Smaller sphere for PEA. Cluster of 6 small spheres for CLUSTER (pre-split). Box with cross-bracing for LUG. All under 100 triangles.

## 7. Daylight Lighting and Palette

- `scene.background`: gradient sky texture generated on a 512×256 canvas — top `#87CEEB`, horizon `#E8D5B7`, bottom (below terrain) `#C4A882`.
- `HemisphereLight('#FFFDE8', '#8B7355', 1.0)` — warm sky, warm ground.
- `DirectionalLight('#FFF5E1', 1.2)` — position high-left, casting sharp shadows at roughly 10 AM Kansas sun angle.
- `FogExp2('#E8D5B7', 0.00025)` — light atmospheric haze, not darkness.
- Terrain material: `MeshStandardMaterial({ color: '#9B7B5B', roughness: 0.9 })` — sun-bleached dirt.
- No post-processing pass. No bloom. No color grading. No vignette overlay on the WebGL canvas.

## 8. Animation State Machine

Each launcher has a state machine with four states:

```
IDLE → CEREMONY → RECOIL → IDLE
         ↑ (on beginShot)    ↑ (duration elapsed)
```

**IDLE**: subtle suspension breathing (±1 unit Y oscillation at 0.4 Hz). Drums stationary (Sidewinder) or ram retracted (Bootlegger).

**CEREMONY** (lot.ceremony seconds, 0.82–1.18 s):
- *Sidewinder*: belt feeds → drums spin up (rotation acceleration) → chassis squats 4 units → pinch (drums converge 2 units).
- *Bootlegger*: stabilizer feet deploy → compressor pulse (pressure gauge mesh tints) → ram cocks back → sling stretches.

**RECOIL** (0.25 s): chassis kicks back along facing axis 6 units, suspension compresses, then springs back. Drums decelerate (Sidewinder) or ram snaps + vent particle burst (Bootlegger).

**Pip crew**: during CEREMONY, 1–5 Pips (count from existing `crewPose` data) animate from rest positions to load positions using the existing per-lot choreography logic. On RECOIL, Pips jump back (squash-and-stretch Y scale 0.7→1.15→1.0 over 0.3 s). At least one Pip must show a readable load/brace/recoil sequence.

Total ceremony-to-launch time must remain under **700 ms** for TABLE (fastest lot).

## 9. Required Ammunition Behaviors

### TABLE
Standard ballistic arc. On terrain impact: single crater (`craterRadius: 26, craterDepth: 15`), juice particle burst, one ring. Direct hit = 1 damage. Splash within 50 px = 1 damage. Damage cap per volley = 1. Physics values are retained exactly from `LOTS.table`.

### LUG
Slower, heavier arc (speed ×0.8, gravity ×1.02). On terrain impact: large crater (`craterRadius: 82, craterDepth: 52`), heavy dirt + clod burst, pronounced screen shake (18 base). The crater must visibly deform the Three.js terrain mesh (update `terrainGeometry.attributes.position`, recompute normals — the existing `updateTerrainCraters` logic). Direct hit = 2 damage. Splash within 116 px = 1 damage. Damage cap = 2.

Both must produce meaningfully different visual and physical outcomes visible in a side-by-side playtest.

## 10. Phone Performance Budgets

| Metric | Target |
|--------|--------|
| Render resolution | `devicePixelRatio` capped at **1.5** (existing) |
| Triangle budget | **< 12 000** total scene |
| Draw calls | **< 45** per frame |
| Shadow map | **1024×1024**, `BasicShadowMap` (existing) |
| Texture memory | **< 4 MB** (no imported textures; all procedural canvases) |
| JS heap | **< 25 MB** |
| Frame time | **< 16.6 ms** on A15 Bionic at 740×360 |
| First paint | **< 2 s** on 4G connection (no new network assets) |

Test at both **740×360** and **844×390** viewports with coarse-pointer. The game must remain playable (all targets hittable, no layout overflow, no clipped HUD) at both sizes.

## 11. Acceptance Checks

### Automated (run via `npm test` and `npm run test:browser`)
1. **Gesture gate**: Playwright fires `pointerdown` on the opponent cart → assert no shot is produced (phase stays `aim`).
2. **Gesture gate**: Playwright starts inside the launcher grab zone, moves 10 px, then releases → assert dead-zone cancel (no ceremony triggered).
3. **Gesture gate**: Playwright fires valid pull (down+move 60 px+up) starting on launcher → assert ceremony starts.
4. **Determinism**: fire TABLE at (pitch 45, impulse 60, cut 0) twice with same seed → assert `__FIXED_SAMPLES__` arrays are identical.
5. **LUG crater**: fire LUG → assert `state.craters` last entry has `radius ≥ 80` and `depth ≥ 50`.
6. **TABLE vs LUG**: fire TABLE then LUG at same aim → assert LUG crater radius > 2× TABLE crater radius.
7. **Phone layout**: Playwright at 740×360 and 844×390 → assert no element extends beyond viewport, all `.lot-button` elements have `offsetWidth ≥ 48`.

### Visual (manual, captured via `npm run evidence`)
1. Screenshot at aim phase: Kansas field is brighter than `rgb(128,128,128)` average over the sky region.
2. Screenshot of each launcher from a ¾ angle confirms 3D volume, not a flat plane.
3. Screenshot of Pip crew during TABLE ceremony confirms at least one Pip in a recognizable load pose.
4. Side-by-side TABLE vs LUG impact screenshots confirm visually distinct crater and particle scale.

## 12. Strict Non-Goals

Do not implement, plan, or scaffold any of the following during this vertical slice:

- Campaign mode, level select, progression, unlocks
- Online multiplayer, networking, matchmaking
- Additional ammunition types beyond the existing four
- Additional maps or terrain generators
- Imported 3D model files (.glb, .gltf, .obj)
- Post-processing (bloom, SSAO, color grading, film grain)
- Physics engine library (Cannon, Rapier, Ammo)
- Bundler, transpiler, TypeScript, or framework
- Mid-flight steering or gesture modification after release
- Portrait-mode gameplay
- Sound asset files or audio sprites (keep procedural SoundBoard)
- Deployment, hosting changes, or branch operations
