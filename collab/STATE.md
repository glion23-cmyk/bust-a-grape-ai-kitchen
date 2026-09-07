# Kitchen state

## Baseline

- Public phone build: `https://bust-a-grape.pages.dev`
- Production branch: `main`
- Co-creator forks: `cook/gemini` and `cook/claude`
- Current integrated round: 1; dimensional wedge implemented
- Current build: The dimensional pivot. The game now renders in true 3D WebGL via Three.js (with a complete 2D fallback), projecting standard deterministic rules across a volume where depth is collision-bearing.

## Current truth

The feature branch has broken out of the flat Canvas prototype. It now carries deterministic `(x,y,z)` projectile state, z-aware terrain and splash queries, a usable CUT control, a narrow 3D terrain stage, a physical broadcast camera, Kansas/cart/Pip billboards, and a working Canvas fallback. The production bundle and offline asset list include the local renderer and its MIT-licensed Three.js dependency.

## Current State (Round 01 Gate Closed)

Gemini completed the mechanical gate repair; independent integration checks caught and fixed the remaining image-key/scale, first-shot-hint, sprite-fog, and cache-cleanup defects. The candidate is ready to merge locally, but is not yet promoted to the public URL.

- **Completed**:
  - True `(x,y,z)` physics determinism and crater independence.
  - HUD layout overlaps fixed and CUT input verified in headless Chrome at two phone-landscape sizes.
  - 3D identity integrated with Kansas dusk, real launcher billboards, and wheel-high Pip billboards.
  - Playwright evidence collected.
  - `sw.js` cache versions bumped.

## Open seam

The next Opus directive should focus on play value, not another renderer migration: restore the four readable Pip ceremonies in the dimensional path, make CUT/depth legible during flight and impact, and decide the smallest “one more lot” rivalry loop worth Gemini implementing. Physical iPhone/Android GPU and thumb testing remain an honest release gate.
