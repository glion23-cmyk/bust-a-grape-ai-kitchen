# Kitchen state

## Baseline

- Public phone build: `https://bust-a-grape.pages.dev`
- Dimensional Round 02 preview: `https://dimensional-round-02.bust-a-grape.pages.dev`
- Production branch: `main`
- Co-creator forks: `cook/gemini` and `cook/claude`
- Current integrated round: 3; Modern Kansas vertical slice verified locally on `rebuild/modern-kansas`
- Current build: compact procedural 3D farm-future launchers, wheel-high bunch Pips, launcher-origin Pull + Shape input, bright Kansas daylight, collision-bearing depth, and a phone-readable modern broadcast HUD.

## Current truth

The Round 03 branch replaces tap-anywhere aiming and UI sliders with a 64px launcher-ring grab, 28px dead zone, thumb-reachable power curve, pull-derived lift/power, and gesture curvature for depth hook. Sidewinder, Bootlegger, ammunition, and Pips are procedural meshes rather than billboards. Terrain deformation, juice stains, impact rings, ceremony camera pushes, haptics, wind readout, and four-bottle matches are live. The offline bundle includes local Three.js and cache `bag-v8`.

## Current state — Round 03 locally verified

Round 03 preserves the deterministic rules and rivalry loop from Round 02 while replacing the flat interaction and dark HUD. The public URL and existing Round 02 preview remain untouched.

- Direct opponent taps and field taps cannot fire; pulls must begin on the Sidewinder ring.
- A complete player → AI → player turn loop passes in headless Chromium.
- A zero-wind TABLE shot at 45° / 54% deterministically scores at x=1037.
- 740×360 and 844×390 have no document overflow and retain usable lot targets.
- The packaged Pages bundle initializes the procedural WebGL identity and manifest.

## Prior state — Round 02

Gemini completed the Round 02 "Ritual Rivalry" build. Opus returned `REPAIR`; independent integration review then rejected invalid first-pass evidence and closed the three blockers with reproducible localhost fixtures. This candidate is not yet promoted to the public URL.

The Cloudflare branch preview was deployed from commit `778fc45` and rechecked remotely at 740×360: WebGL identity loaded, the Grudge Card fit without overflow, and a real NEXT MATCH click advanced to Match 2. The stable production alias still serves the prior release.

- `zAccuracy(impactZ, targetZ)` is deterministic and modifies damage.
- AI depth spread derives from each solved shot's actual target-plane travel time.
- The WebGL path carries 3/3/5/5-Pip launch tableaux for wipe/weigh, calipers, pile-on, and block-and-tackle.
- TABLE/PEA/CLUSTER/LUG impacts have distinct calls, silhouettes, depth motion, and camera focus within a 30-quad first-impact budget.
- Best-of-three mode, Grudge Card, real NEXT MATCH transition, and persistent local tally are verified at 740×360 and 844×390.
- Deterministic tests, browser assertions, a four-ammo workload, production build, and visual evidence all pass.

## Open seam

Physical iPhone/Android GPU, safe-area, audio-resume, haptic, install/offline, and thumb-gesture testing remain the release gate. Decide whether WebGL is an explicit minimum requirement or whether to maintain a separate low-spec renderer; the old Canvas fallback is no longer feature-complete.
