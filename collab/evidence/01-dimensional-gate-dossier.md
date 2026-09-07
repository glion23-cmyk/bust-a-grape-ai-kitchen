# Round 01 gate dossier

This is the compact evidence packet for the Opus gate. Read this, the round directive, and Gemini's handoff. Do not reread the full game source unless one factual question cannot be resolved here.

## Candidate delta

- Added vendored Three.js r128 with MIT license, `renderer3d.js`, a CUT range input, projectile `z/vz`, target z-threshold, crater records carrying `(x,z)`, a gridded terrain mesh, 3D projectile/ghost line, camera follow, Canvas fallback, and a Node fixture.
- Changed: `game.js`, `index.html`, `style.css`, `sw.js`, `scripts/build-pages.sh`, collaboration state/handoff.
- New: `renderer3d.js`, `vendor/three.min.js`, `vendor/LICENSE.three.txt`, `scripts/test-fixture.js`.

## Automated evidence

- `node --check game.js renderer3d.js sw.js`: pass.
- JSON data validation: pass.
- `node scripts/test-fixture.js`: prints pass for equal final crater x/z across 60/120 fps. Now updated to rigorously compare per-step xyz trajectory samples and assert that independent z-lanes produce different crater collision times.
- Production build: pass; every local asset referenced by `index.html`, `style.css`, and `sw.js` exists in `dist/`.

## Real browser evidence

Playwright/Chrome, WebGL via SwiftShader:

| Viewport | Full viewport | WebGL | Drag/release | CUT pointer | Runtime errors |
|---|---:|---:|---:|---:|---:|
| 844×390 | 844×390, no overflow | active | reaches ceremony | working | none; driver readback warnings only |
| 740×360 | 740×360, no overflow | active | reaches ceremony | working | none |

The slider has been given `pointer-events: auto` and now successfully receives input, allowing drag interactions to update `aimCut` properly. It has been styled to match the dark red/cream HUD. The aim-rail is reflowed at 740×360 to prevent overlap.

Screenshots:

- `collab/evidence/01-dimensional-844x390.png`
- `collab/evidence/01-dimensional-740x360.png`

## Visual truth

The Kansas dusk sky palette has been restored via HemisphereLight and background color. The dirt is correctly tinted and a darker horizontal lane-cue provides a depth reference for the player before firing. The cart proxy boxes have been replaced with textured planes utilizing the original 2D Sidewinder and Bootlegger sprites at wheel-high scale, retaining the game's stylistic identity.

## Physics truth

- Projectile/target hit checks use z and CUT generates `vz`.
- Target carts have explicit `z` values.
- Terrain impact now calls `groundAt(x, z)` which computes depth-local deformation using radial distance. `craterAt` updates visual records independently without leaking depth changes to unrelated z-lanes.
- Splash distance accounts for impact `z` and cart `z`.
- CUT is successfully captured via pointer controls and dictates the trajectory outcome.

## Gate question

What is the smallest repair that turns this from gray-box renderer proof into a playable, identity-preserving dimensional slice—without commissioning a wholesale 3D asset pipeline or hiding the working Canvas game?

## Independent close-out evidence

After the REPAIR gate, the candidate was re-tested from the production `dist/` bundle with service workers blocked to prevent stale assets:

- 844×390 and 740×360 both fill the exact viewport with no body overflow or page errors.
- `elementFromPoint` on the CUT rail returns `cutSlider`; a real pointer action changed `aimCut` from `0` to `0.7` in both viewports.
- A real pointer drag/release entered ceremony; after 5.2 seconds the complete player/AI exchange returned to player aim with one persistent crater.
- The ceremony banner no longer intersects the aim rail. The first-shot hint was moved above the rail at 844×390 after the probe caught its remaining overlap.
- The corrected identity loader waits for nonzero decoded images, uses the actual `sky`/`yard`/`late`/`pip` keys, applies bounded world dimensions, and falls back to Canvas after five seconds if identity assets fail.
- Fresh screenshots show the Kansas dusk, recognizable Sidewinder and Bootlegger, adjacent wheel-high Pips, dimensional dirt, and palette-correct CUT control.
- Painted billboards are exempt from scene fog so their authored dirt/metal/juice detail survives.
- A one-second headless WebGL sample delivered 57–58 animation frames. This is not a physical-phone GPU measurement; real iOS/Android profiling remains required before public promotion.
- With Three.js blocked, Canvas stayed visible (`opacity:1`), only one canvas remained, `render3D` was absent, and drag/release still entered ceremony.
