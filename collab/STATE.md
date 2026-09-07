# Kitchen state

## Baseline

- Public phone build: `https://bust-a-grape.pages.dev`
- Production branch: `main`
- Co-creator forks: `cook/gemini` and `cook/claude`
- Current integrated round: 2; Ritual Rivalry gate close verified locally
- Current build: The dimensional pivot. The game now renders in true 3D WebGL via Three.js (with a complete 2D fallback), projecting standard deterministic rules across a volume where depth is collision-bearing.

## Current truth

The feature branch has broken out of the flat Canvas prototype. It now carries deterministic `(x,y,z)` projectile state, z-aware terrain and splash queries, a usable CUT control, a narrow 3D terrain stage, a physical broadcast camera, Kansas/cart/Pip billboards, and a working Canvas fallback. The production bundle and offline asset list include the local renderer and its MIT-licensed Three.js dependency.

## Current state — Round 02 locally closed

Gemini completed the Round 02 "Ritual Rivalry" build. Opus returned `REPAIR`; independent integration review then rejected invalid first-pass evidence and closed the three blockers with reproducible localhost fixtures. This candidate is not yet promoted to the public URL.

- `zAccuracy(impactZ, targetZ)` is deterministic and modifies damage.
- AI depth spread derives from each solved shot's actual target-plane travel time.
- The WebGL path carries 3/3/5/5-Pip launch tableaux for wipe/weigh, calipers, pile-on, and block-and-tackle.
- TABLE/PEA/CLUSTER/LUG impacts have distinct calls, silhouettes, depth motion, and camera focus within a 30-quad first-impact budget.
- Best-of-three mode, Grudge Card, real NEXT MATCH transition, and persistent local tally are verified at 740×360 and 844×390.
- Deterministic tests, browser assertions, a four-ammo workload, production build, and visual evidence all pass.

## Open seam

Do not spend the next Opus pass on another rendering migration. Give it human playtest evidence: whether CUT is learnable, whether 15 units feels earned rather than arbitrary, whether ceremony timing interrupts flow, and whether the Grudge Card produces an honest rematch impulse. Physical iPhone/Android GPU, safe-area, audio-resume, and thumb testing remain the release gate.
