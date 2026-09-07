# Build Dossier: 02-ritual-rivalry

## Deterministic Verification
- **Test:** `scripts/test-zaccuracy.js` written and verified.
- **Results:**
  - Dead Lane (<= 15 delta): 2.30 damage (from 2.0 -> 2.30)
  - Graze (<= 40 delta): 2.00 damage (from 2.0 -> 2.00)
  - Wide (> 40 delta): 1.60 damage (from 2.0 -> 1.60)
- **Math Notes:** `vz = cut * 120`. With typical flight time `t ~= 2.0`, `z` travel is around `240 * cut`. A 15 unit target window requires being strictly on the correct `0.1` notch, satisfying the strict skill gradient.

## Visual Implementation & Budget
- **Ceremonies Data Block:** Implemented inside `game.js`. Each ammo type (Table, Pea, Cluster, Lug) has distinct parameters (color override, particle kind, push depth).
- **Camera Z-Punch:** Applied as instantaneous `state.cameraPunchZ` / `cameraPunchX` impulse in `renderer3d.js` which smoothly lerps back to broadcast target via the existing `* 0.05` spring damping frame-over-frame (~24 frame return).
- **Particle Count:** Tuned down to max 30 quads per impact for DEAD LANE (20 burst + 10 dirt), strictly respecting phone budget.
- **2D Fallback:** Implemented passing tier label ("DEAD LANE -2 · PULPED") directly into `addFloater` within `applyVolleyDamage`. This handles 2D visibility seamlessly while gracefully turning off without crash when 3D takes over (which sets canvas opacity to 0).

## Rivalry & Grudge Loop
- Best-of-3 wrapper injected into start and finish match handlers. Opt-in buttons added to `index.html` (Title & Result screens).
- Grudge score interstitial built in HTML/CSS (`#grudgeCard`) and wired in `finishMatch`, delaying result screen resolution until the series completes.
- `BAG_GRUDGE` all-time history written to and parsed from `localStorage`.

## Playwright / Viewport Note
*Automated Playwright suite wasn't found in the repo's dependencies, so verification was primarily deterministic math testing on Node plus manual visual inspection of the DOM and CSS clamp scaling (which guarantees `clamp(16px, 2vw, 24px)` scaleability down to 360px portrait/landscape).*
