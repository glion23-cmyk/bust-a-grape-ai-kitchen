# ROUND 03 — MODERN KANSAS REBUILD

## Mission

Replace the current tap-to-hit, dark billboard-diorama prototype with a bright, tactile, true-3D landscape-phone artillery slice. This is a core interaction and presentation rebuild, not a reskin.

## Player Promise

Touch the launcher, pull it under tension, curve the gesture to shape the shot, release, and watch a physically expressive piece of fruit wreck a near-future illegal Kansas farm machine. A tap anywhere else never fires.

## Locked Product Decisions

- Fast tactical duel: two to four minutes, four health bottles, instant rematch, best-of-three retained.
- Pull + Shape only; no mid-flight steering.
- The gesture begins on a launcher-attached grab zone, has a dead zone, and can cancel.
- The preview fades before the target and never provides an exact endpoint or hit lock.
- True 3D launchers and Pips. Flat identity planes are rejected.
- Bright western Kansas daylight. No full-screen wine tint, black crush, or super-dark theme.
- Art lane: sun-bleached Kansas agricultural cyberpunk with graphic-novel 3D color blocking.
- Cyberpunk comes from hacked precision-ag sensors, smart glass, data looms, battery cassettes, bootleg firmware, and field repairs—not a neon city or sci-fi tank HUD.

## Launcher Identity

### Sidewinder

Compact autonomous orchard buggy crossed with a dirt racer: low oxblood wedge, twin carbon-composite accelerator drums, grape cleat conveyor, independent farm suspension, electric hub motors, removable batteries, LiDAR/GPS mast, and tiny cold-cyan diagnostics. Launch animation: feed, belt tension, drum spin, chassis squat, pinch, recoil.

### Bootlegger

Compact pressure seed-tender/irrigation contraband: short wheelbase, faded green-gray composite hopper, low pressure vessel, horseshoe linear ram, smart-fiber sling, accumulators, electric compressor, and deployable stabilizers. Launch animation: plant feet, pressure pulse, cock ram, stretch sling, vent, hop.

Neither machine may look like a Victorian boiler, locomotive, decorative pipe collage, military tank, or giant dragster. Maximum visual length is roughly 2.5 wheelbases.

## Pips and Animation

Pips are wheel-high walking grape bunches: many grape spheres, one stern front-berry face, stem, twig limbs, and tiny work boots. They are not humanoid mobsters.

Every shot visibly uses anticipation, windup, release overshoot, secondary motion, flight deformation, impact reaction, and fast payoff. Borrow the tactile timing and foreground reward pop of premium modern mobile board games without copying any existing game's characters, board, interface, landmarks, or trade dress. Ceremony-to-launch must stay under about 700 ms.

## Physics and Input Contract

- Minimum launcher grab target: 56 CSS px.
- Minimum valid pull: 28 CSS px; shorter release cancels without consuming a turn.
- Pull vector controls pitch and impulse.
- Signed curvature of sampled pointer history controls limited depth yaw/spin; a straight pull has zero shape.
- Pointer cancel, orientation change, multitouch interruption, or loss of capture cancels safely.
- Deterministic fixed-step simulation; the same shot specification and seed produce the same path independent of render rate.
- Wind is fixed for a turn and legible in wheat/dust/world motion.
- TABLE remains reliable; PEA is fast/direct; CLUSTER splits; LUG is heavy and deforms terrain.

## Phone and HUD Contract

- Exact landscape targets: 740x360 and 844x390, including safe areas.
- Battlefield dominates the frame.
- Four large bottle markers per side, one compact turn callout, four thumb-size ammo buttons, pause/sound only.
- Remove permanent angle, percentage, cut slider, giant tutorial card, opaque broadcast frame, and tiny prose.
- Essential targets are at least 48 CSS px and essential text meets 4.5:1 contrast.
- Preserve PWA/offline behavior and provide reduced-motion and left-handed options.

## Visual References

- `art/boards/modern-kansas-launchers.png` — approved launcher engineering direction.
- `art/boards/modern-kansas-animation.png` — approved animation energy and sequencing.

These are composition and design references, not texture plates or assets to paste into the game.

## First Deliverable

Build the smallest coherent vertical slice that proves all of the following together:

1. A tap on the opponent cannot fire.
2. A real launcher-origin pull gesture aims, shapes, cancels, and releases cleanly.
3. Sidewinder and Bootlegger are true 3D, mechanically distinct, compact machines with animated launch mechanisms.
4. At least one true 3D Pip crew performs a readable load/recoil reaction.
5. The Kansas field is substantially brighter and clearer than the existing build.
6. TABLE and LUG demonstrate meaningfully different physical behavior and impact payoff.
7. The slice fits and remains playable at both phone target sizes.

Keep the existing public deployment untouched. Do not deploy.

## Rejection Conditions

- Absolute-position or click-target aiming survives.
- Sprite planes remain the primary launcher/Pip representation.
- The solution is merely parallax, bloom, color grading, or HUD restyling.
- The machines drift back toward steampunk.
- The battlefield becomes dark, muddy, or visually obstructed.
- The work expands into campaign, online play, additional maps, or a large weapon roster before the vertical slice passes.
