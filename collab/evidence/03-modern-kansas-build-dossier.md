# Round 03 Build Dossier: Modern Kansas

## Outcome

Round 03 is implemented and verified locally on `rebuild/modern-kansas`. The public build and the existing Round 02 Cloudflare preview are unchanged.

The playable slice now uses bright procedural 3D rather than launcher billboards: a compact oxblood Sidewinder with twin flywheels, feed belt, hopper, sensor mast, copper launch ring, and machine markings faces a compact green Bootlegger with pressure vessel, stabilizers, linear ram, raised lariat arm, and catch cup. Both remain harvest-buggy scale.

## What changed

- Replaced tap-anywhere aiming and sliders with a launcher-origin Pull + Shape gesture.
- Added a 64 CSS-pixel grab target, 28-pixel dead zone, reachable phone power curve, pull-derived lift/power, gesture curvature for depth hook, safe cancellation, and haptic thresholds.
- The trajectory preview begins at the real launch ring and fades before revealing the landing point.
- Added distinct procedural 3D Sidewinder, Bootlegger, ammunition, stern wheel-high Pip bunches, four ceremony formations/props, launcher windup, recoil, squash, and ceremony camera push-ins.
- Added bright Kansas sky, sun, grain elevator, windmill, irrigation pivot, wheat, physical lighting, persistent 3D juice stains, crater deformation, impact rings, and shot-follow camera work.
- Reworked the HUD into a bright, phone-readable cream/wine broadcast layer. During a pull it reports juice, lift, and straight/left/right hook; at rest it reports wind.
- Match health is four bottles per side. TABLE, PEA, CLUSTER, and LUG remain mechanically distinct; best-of-three and persistent rivalry history remain intact.
- Removed 5.3 MB of obsolete runtime sprite downloads, bumped the offline cache to `bag-v8`, and rebuilt a 2.0 MB production-only Pages bundle.

## Verification

`npm test`

- Fixed-step trajectory is deterministic across frame rates.
- Z-lane ground collision is independent.
- Dead Lane/Graze/Wide damage multipliers pass.
- Seeded AI depth-spread distribution passes.

`npm run test:browser` at 740×360 and 844×390

- Opponent taps cannot fire.
- Dead-zone releases cancel.
- A strong low shot is reachable by a phone thumb.
- Procedural 3D identity is active: 21,450 triangles; 173 idle draw calls in headless Chromium.
- A valid launcher pull enters ceremony.
- A complete player shot → AI response → player-control loop returns with persistent field damage.
- A deterministic TABLE shot at 45° / 54% scores at x=1037.
- Best-of-three shows a 1–0 Grudge Card and advances into the next playable match.
- Both phone viewports have no document overflow and keep 48-pixel lot targets.
- Post-turn render state measured 117–121 draw calls across final runs; the automated ceiling is 190.

Packaged `dist/` smoke test

- WebGL identity initialized from the packaged files.
- Match entered the aim phase.
- No viewport overflow at 740×360.
- Manifest resolved from the package.

Headless Chromium's software renderer averaged 24.9 ms per animation frame with a 33.4 ms p95 at 740×360. This is a conservative diagnostic, not a substitute for physical iPhone/Android GPU testing.

## Evidence

- `collab/evidence/03-aim-phase.png`
- `collab/evidence/03-table-ceremony.png`
- `collab/evidence/03-impact-comparison.png`
- `collab/evidence/03-launchers.png`

## Remaining release gate

Physical iPhone and Android testing is still required for thumb feel, safe areas, audio resume, thermal/frame pacing, and install/offline behavior. WebGL failure now lacks the old fully playable Canvas renderer; the release should either require WebGL explicitly or add a deliberately maintained low-spec path. No deployment was made in this round.
