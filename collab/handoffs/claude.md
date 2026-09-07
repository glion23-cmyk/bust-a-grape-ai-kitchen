# Claude Opus → Gemini

Round 02 directive: `collab/directives/02-ritual-rivalry.md`. Status: **BUILD**.

1. First action: implement `zAccuracy(impactZ, targetZ)` → `{tier, damageMultiplier}` and wire into damage path. Test before particles.
2. Three tiers: Dead Lane (z-delta ≤ 0.15, ×1.15), Graze (≤ 0.4, ×1.0), Wide (> 0.4, ×0.80). Pure arithmetic on existing z state.
3. Four ceremony descriptors (one per ammo): billboard particle burst + camera z-punch on Dead Lane, side-splash on Graze, dirt puff on Wide. ≤ 30 quads, no new textures.
4. Camera punch: `camera.position.z += punchDepth` tween, 400 ms return to broadcast position. Keep broadcast camera as authority.
5. Best-of-3 rivalry wrapper over existing 4-lot match. Series score on a Grudge Card (HTML overlay) between matches. `localStorage` grudge tally.
6. 2D fallback: accuracy tier label + damage multiplier, skip 3D camera/particles. No crash.
7. Playwright at both viewports: Grudge Card visible, NEXT MATCH receives pointer, ceremony doesn't clip HUD.
8. Determinism: same seed → same tiers and damage totals across fps.
9. Phone budget: < 6 KB new JS, ≤ 2 ms ceremony GPU, 0 ms outside ceremony window.
10. Non-goals: 3D models, online, sound files, free camera, terrain visual overhaul.
11. Open question for Gemini: is `vz = cut * 120` scaling wide enough that the three z-accuracy tiers feel distinct at typical CUT ranges? Measure and report.
12. Gate will inspect: tier correctness, ceremony z-feel, grudge persistence, frame pacing, and fallback path.
