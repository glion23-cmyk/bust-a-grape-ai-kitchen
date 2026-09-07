# Round 02 final gate-close dossier

This packet records the repaired Ritual Rivalry candidate. Opus's historical verdict remains `REPAIR`; the outer integration pass closed and independently verified each blocker without spending another Opus call.

## What is playable

- CUT now grades target-plane depth as `DEAD_LANE` (≤15 units), `GRAZE` (≤40), or `WIDE`, applying 1.15×, 1×, or 0.8× damage.
- The AI deliberately samples those tiers, then derives CUT from each solved shot's real horizontal time-to-target. It no longer receives free zero-cut Dead Lanes.
- Each ammo has a wheel-scale launch tableau in the WebGL path: TABLE wipe/weigh (3 Pips), PEA calipers argument (3), CLUSTER pile-on (5), and LUG block-and-tackle (5).
- Dead Lane impacts use a short impact-camera lock, broadcast call, and distinct depth-moving particle silhouette: TABLE drops, PEA sparks, CLUSTER shards, LUG clods.
- The first staged Dead Lane impact is capped at 30 billboard quads; the old damage burst is suppressed once a ceremony owns the impact. Cluster fragments can still overlap later, so a physical low-end-phone profile remains required.
- Best-of-three mode shows a phone-safe Grudge Card between matches and stores the all-time tally in `localStorage`.

## Automated proof

`npm test` passed:

- fixed-step `(x,y,z)` trajectory equality at 60/120 fps;
- z-local crater collision independence;
- damage results: Dead Lane 2.30, Graze 2.00, Wide 1.60 for the 2-damage fixture;
- two identical seeds produced identical 1,000-shot AI tier sequences;
- observed AI distribution: 18.5% Dead Lane, 52.3% Graze, 29.2% Wide.

`npm run evidence` passed from an ephemeral localhost server:

- 740×360 and 844×390: exact document fit, every Grudge element inside the viewport, correct `1 - 0` score, and a real pointer click on `NEXT MATCH` advanced `matchNumber` and returned to aim;
- a completed 2-0 series persisted `BAG_GRUDGE` across reload;
- four real tuned shots—TABLE 50°/50%, PEA 50°/30%, CLUSTER 50°/57%, LUG 50°/78%—each reached its real impact ceremony;
- the Canvas degradation path was forced by blocking Three.js; one visible canvas remained and a real drag/release entered ceremony without runtime errors;
- headless Chromium/SwiftShader sample: 774 frames over 13,213.1 ms, 8 frames over 20 ms (1.03%). This is reproducible comparative evidence, not a physical-phone GPU measurement;
- every launch capture asserted the expected active Pip count; every impact capture asserted `DEAD_LANE`, the ammo-specific particle shape, WebGL identity, and no more than 30 live first-impact particles.

## Visual evidence

- [740×360 Grudge Card](02-ritual-rivalry-740x360.png)
- [844×390 Grudge Card](02-ritual-rivalry-844x390.png)
- [Four launch tableaux and four Dead Lane impacts](02-ceremonies.png)

## Remaining honest risks

- Physical iPhone and Android GPU, safe-area, audio-resume, and thumb-feel testing are still release gates.
- The 15-unit Dead Lane window and best-of-three pacing are instrumented, not yet human-playtested for compulsion or frustration.
- Carts and Pips remain painted billboards inside a true 3D terrain/projectile/camera volume; custom modeled characters remain intentionally out of scope.
