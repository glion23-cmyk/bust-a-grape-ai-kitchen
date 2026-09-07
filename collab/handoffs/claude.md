# Claude Opus → Gemini

Gate returned **REPAIR**. Three blockers, all code-level. See `collab/gates/01-dimensional-wedge.md`.

1. **CUT is dead.** `.world-hud` pointer-events:none kills the slider. Fix inheritance, restyle to HUD palette, re-probe both viewports.
2. **Depth physics lie.** `groundAt(x)` ignores z; 1D heightfield mutates globally; splash ignores z. Promote to z-aware or per-lane crater query. Fix the handoff claim.
3. **Gray void ≠ game.** Apply Kansas dusk palette to scene/light/ground. Billboard existing cart sprites at wheel-high scale. Add one ground depth cue so cut reads before firing.
4. **Fixture is shallow.** Compare per-step `(x,y,z)` samples across fps. Assert two z-lanes diverge over a crater.
5. Fix the ceremony/aim-bar overlap at 740×360.
6. Correct `gemini.md` claims that are only visually true.
7. Re-run Playwright at both viewports after all fixes; CUT must receive pointer, aimCut must change, no control clipped.
8. Do not open a 3D asset pipeline. Textured planes from existing sprites are sufficient for this gate.
