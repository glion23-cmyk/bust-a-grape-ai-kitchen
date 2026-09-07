# Directive 02 — Ritual Rivalry

## PLAYER PROMISE

Every lot ends with a moment you want to show someone. Every match ends with a score you want to avenge.

## THE ONE BUILD

Add **Pip Ceremonies that use the z-axis** and a **Best-of-3 Rivalry Loop** with a persistent grudge score. The ceremonies reward skillful depth play; the rivalry loop converts a single match into a compulsive series. Together they are the smallest unit of "one more lot" pressure.

## WHY IT WINS

Round 01 proved the dimensional engine works. But right now nothing *happens* when a shot lands—no payoff, no punctuation, no reason to care about CUT accuracy. The four ammo ceremonies (Thumper, Zipper, Pulper, Widowmaker) were authored for the flat prototype and are currently absent from the 3D path. Restoring them *into depth* is the cheapest high-leverage move: it makes CUT matter, it gives the broadcast camera something to frame, and it turns a physics demo into a game with moments.

The rivalry loop is the retention backbone. A single lot is too short to bond with; a best-of-3 with a grudge ticker ("Bootlegger leads 2-1") creates stakes, a comeback arc, and a natural rematch prompt.

## DIMENSIONAL MECHANIC

**Depth-Staged Ceremonies.** Each ammo type's impact ceremony plays differently depending on how accurately the shot's z matched the target cart's z-lane:

| Accuracy | Name | Visual | Gameplay |
|---|---|---|---|
| z-delta ≤ 0.15 | **Dead Lane** | Full ceremony: juice geyser erupts toward camera, terrain crater rings in 3D, camera punches forward into the blast | +15 % bonus damage |
| z-delta ≤ 0.4 | **Graze** | Partial ceremony: side-splash along terrain, lateral camera nudge | Standard damage |
| z-delta > 0.4 | **Wide** | Dirt puff only, camera holds, crowd murmur | −20 % damage penalty |

This is one mechanic, not three features. It makes CUT the high-skill axis and gives every shot a legible z-outcome without requiring the player to rotate a camera.

## LOOP / RETENTION MOVE

**Best-of-3 Rivalry Series.**

1. Match = 4 lots (one per ammo type, alternating fire, as today).
2. Series = best-of-3 matches. Winner declared after 2 match wins.
3. Between matches: **Grudge Card** — a full-screen 2-second interstitial showing series score, leading Pip's taunt pose (billboarded, lit), and a single "NEXT MATCH" thumb tap.
4. After series: **Rematch prompt** with grudge history ("You trail the all-time rivalry 3-5"). Stored in `localStorage`.
5. A single match is still playable; the series wrapper is opt-in from the title/rematch screen.

Zero server dependency. Zero account. The retention hook is local pride against the AI opponent.

## TECHNICAL SEAM

Gemini already owns `(x,y,z)` projectile state and `projectileHitsCart` with z-aware splash. The ceremony system needs:

- A `zAccuracy(impactZ, targetZ)` function returning `DEAD_LANE | GRAZE | WIDE` — pure arithmetic on existing state.
- Four ceremony descriptors (one per ammo) specifying particles, camera punch, and sound cue per accuracy tier. These are data, not new engine.
- Camera punch: a brief `camera.position.z += punchDepth` tween on Dead Lane hits, returning to broadcast position over 400 ms. The broadcast camera already exists.
- The rivalry loop is match-state bookkeeping above the existing lot/turn layer. No physics or renderer changes.

The 2D Canvas fallback should display the same accuracy tier text and damage modifier but skip the 3D camera punch and particle depth.

## PHONE BUDGET

- Ceremony particles: ≤ 30 billboard quads per impact, shader-free, opacity-faded over 600 ms. No new textures; reuse terrain color and juice palette.
- Camera punch tween: single `lerp` per frame for ≤ 24 frames. No post-processing.
- Grudge Card: HTML overlay, not a rendered scene. Loads no new assets.
- Target: 0 ms added to per-frame budget outside of the ≤ 600 ms ceremony window. During ceremony, ≤ 2 ms additional GPU on Adreno 610-class hardware.
- Total new JS: < 6 KB minified for ceremonies + rivalry state combined.

## ACCEPTANCE CHECKS

1. **Dead Lane ceremony fires** when a Thumper shot lands with z-delta ≤ 0.15 of opponent cart. Camera visibly punches toward impact. Damage is 15 % above baseline.
2. **Wide penalty applies** when z-delta > 0.4. Damage is 20 % below baseline. No ceremony plays; only a dirt puff.
3. **Graze is the default middle**. Side-splash visible. Standard damage.
4. **All four ammo types** have distinct ceremony visuals at Dead Lane tier (different particle color/pattern per ammo).
5. **Best-of-3 wrapper** completes: after 2 match wins, series ends with winner declaration. Grudge Card appears between matches with correct series score.
6. **Rematch stores grudge** in `localStorage`. Reloading the page and rematching shows the historical series tally.
7. **2D fallback** displays accuracy tier label and applies damage modifier. No crash, no missing text.
8. **Playwright at 844×390 and 740×360**: Grudge Card is fully visible, "NEXT MATCH" button receives pointer, no overflow. Ceremony does not obscure HUD controls.
9. **Frame pacing**: a 4-lot match with ceremonies completes with ≤ 5 % frame drops at 60 fps in headless Chrome at 740×360 (same measurement method as Round 01 fixture).
10. **Determinism**: two runs of the same seed produce identical accuracy tiers and damage totals.

## NON-GOALS

- Custom 3D Pip models, skeletal animation, or new sprite art.
- Online multiplayer, accounts, or server-side storage.
- Tournament brackets, seasons, or progression systems beyond the grudge tally.
- Terrain destruction visual overhaul (Round 01's craters are sufficient).
- Sound asset creation (ceremony hooks should exist as named calls; actual audio files are a future round).
- Free-camera or player-controlled camera rotation.

## GEMINI'S FIRST ACTION

Implement `zAccuracy(impactZ, targetZ)` → `{tier, damageMultiplier}` and wire it into the existing `projectileHitsCart` damage path. Write a deterministic test that fires one shot per accuracy tier and asserts the correct multiplier. This is ≤ 40 lines of game logic and ≤ 30 lines of test. Ship it before touching particles or camera.
