# Round 01 — The shot leaves the painting

## PLAYER PROMISE

One thumb wakes an illegal Kansas harvest machine, a wheel-high Pip crew makes a deadly-serious ceremony of loading one grape, and the field suddenly has mass: the launcher bites into the rut, the grape cuts through real depth, the broadcast camera hunts it, and the earth caves in where it lands. The player understands the shot instantly and wants the correction shot before the announcer finishes insulting them.

## THE ONE BUILD

Build one complete dimensional shot cycle on **The Ditch**: aim → ceremony/charge → launch → tracked flight → depth-valid collision → volumetric dirt-and-juice impact → damage → immediate next turn/rematch. Move the world renderer behind that cycle to a true 3D scene while keeping the existing DOM HUD, rules, lots, announcer system, and match state as the proven shell.

Use a narrow 3D broadcast stage, not an open-world camera. Extrude the existing heightfield into a dirt berm with visible near/far faces. Place compact cart and Pip art as temporary textured planes or simple proxy meshes at correct wheel-high scale. A projectile owns `(x, y, z)` position and collides against both terrain volume and target depth, not a painted screen coordinate. A physical mostly-side-on camera may truck, tilt, compress, and kick, but always returns to the canonical aim read.

The thin slice may initially prove TABLE end to end, but the existing four lots and full match must remain runnable. Do not strand the game in a tech demo.

## WHY IT WINS

The launchers are the fantasy and the shot is the repeated verb. Spending dimensionality here buys machinery weight, Pip scale, readable ballistics, violent/comic impacts, and broadcast personality at once. Converting menus, loadout cards, or every character first buys almost no fun.

## DIMENSIONAL MECHANIC

Depth is simulated and collision-bearing. Give each cart/target a shallow z-volume and the projectile a visible, bounded cut across the field's depth during flight. For the first slice, derive cut deterministically from the release gesture's signed cross-axis component or expose one tiny, thumb-reachable CUT control; zero cut remains a valid straight shot. Cut changes whether a grape passes near-side, center-mass, or far-side and changes the crater's z-position. Camera perspective and shadows must make that read learnable. Decorative parallax, CSS perspective, or a 2D projectile merely drawn smaller does not qualify.

Do not let cut overwhelm angle and juice. It is seasoning and high-skill correction, with strong snap-to-center and an obvious neutral state.

## LOOP / RETENTION MOVE

After every miss or graze, leave a short-lived **rut ghost** in world space: the previous grape's 3D flight ribbon and impact divot. It is information, not an auto-aim solution. The next turn begins quickly enough that the player can correct angle, juice, or cut from that evidence. Track the best correction chain during the match and let the announcer recognize a dialed-in follow-up. Rematch remains one action and returns to aim in under two seconds.

## TECHNICAL SEAM

- Preserve existing game rules/state as the authority; introduce a renderer/scene boundary rather than rewriting the match.
- Use a phone-capable WebGL path such as Three.js, locally vendored or bundled so the PWA/offline contract survives. No runtime CDN dependency in the shipping bundle.
- Keep fixed-step simulation deterministic. Extend projectile and collision state with z; do not couple rules to frame rate or camera transforms.
- Build the terrain mesh from the existing heightfield and update only affected vertices around a crater.
- Expose a renderer capability/degradation tier. If WebGL initialization fails, the current Canvas renderer remains a playable fallback during the migration.
- Add a deterministic shot fixture that proves equal inputs produce equal `(x, y, z)` samples and collision results.

## PHONE BUDGET

- Landscape CSS viewport remains the frame; honor safe areas and coarse-pointer input.
- Target stable 60 fps on a recent phone and never design below a stable 30 fps floor.
- Start with one key light, ambient/hemisphere fill, baked/simple shadows, capped particles, no post stack, and a strict pixel-ratio ceiling.
- The canonical aim view and HUD must remain readable at 844×390 and 740×360.
- Touching CUT must not require a second simultaneous finger or a tiny target.
- Effects degrade in order: particle count → dynamic shadows → flight ribbon density → material detail. Physics never degrades.

## ACCEPTANCE CHECKS

1. Default gameplay completes a full turn and rematch with the dimensional renderer active; Canvas fallback still boots when WebGL is unavailable.
2. A player can identify neutral versus near/far cut before firing, and z determines hit/graze/miss rather than serving only as animation.
3. The camera begins and ends in a stable mostly-side-on aim composition; no shot hides either launcher, the arc apex, or the impact.
4. A crater changes visible terrain volume at the actual `(x, z)` impact and persists for the match.
5. Same seed, lot, angle, juice, and cut produce the same trajectory samples and result across frame rates.
6. TABLE works end to end; PEA, CLUSTER, and LUG either retain their current behavior in the dimensional path or explicitly fall back without breaking the match.
7. Automated syntax/data checks pass, and a real browser probe covers 844×390 plus one narrower landscape viewport with no clipped aim control.
8. The first post-impact input opportunity arrives quickly; the previous shot's world-space rut ghost supports a visible correction.

## NON-GOALS

- No wholesale menu redesign, progression economy, online multiplayer, free camera, full 3D character rigging, photoreal farm, neon cyber-city, or replacement of every production sprite.
- No engine-rewrite manifesto and no isolated showroom that cannot play a complete match.
- No depth gimmick that makes the classic angle/juice read ambiguous.

## GEMINI'S FIRST ACTION

Carve the rules from the renderer: document the minimum state/event interface the current loop already provides, create the deterministic z-extended shot fixture, then stand up the narrow 3D field behind one full TABLE turn before polishing materials or adding content.
