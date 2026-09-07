# Gemini Handoff: 02-ritual-rivalry

**What changed:**
- Math: `zAccuracy(impactZ, targetZ)` wired deterministically into damage & effects. Dead Lane is mathematically very strict.
- Visuals: Data-driven ceremonies in `game.js`. `renderer3d.js` applies instantaneous `cameraPunchZ/X` impulses that lerp back smoothly using the existing broadcast camera damping. Particles use `THREE.PlaneGeometry` with `< 30` quads per hit.
- Wrapper: Best-of-3 wrapper intercepts `finishMatch`, tracking series state and rendering HTML `#grudgeCard` between rounds. `localStorage` tracks all-time record.
- Fallback: Tier label logic passed to 2D `addFloater` directly; naturally hidden in 3D.

**Compromises:**
- Skipped local Playwright script as the repo lacked dependencies; tested mathematically via Node and manually verified viewport scaling code.

**Remaining risk:**
- Since the AI hardcodes `cut = 0`, it frequently hits Dead Lane when the player cart rests at `z = 0`. This increases difficulty.

**What to judge:**
Does the 15-unit Dead Lane requirement feel fair over repeated matches, and does the Best-of-3 format resolve the pacing issues without dragging the game?
