# Gate 02 — Ritual Rivalry

VERDICT: REPAIR

## WHAT LANDED

The core z-accuracy mechanic is correctly decomposed and deterministically tested. `zAccuracy` → three tiers → damage multiplier is the right seam; the math checks out (Dead Lane ×1.15, Graze ×1.0, Wide ×0.80). Data-driven ceremony descriptors per ammo type, camera z-punch via the existing broadcast spring, and ≤ 30 billboard quads all respect the phone budget and the directive's technical seam. The 2D fallback path routes tier labels through the existing `addFloater` without crash risk. Best-of-3 wrapper and `localStorage` grudge tally are structurally present and wire through `finishMatch` and the HTML `#grudgeCard` overlay.

## EVIDENCE CHECKED

- [02-ritual-rivalry-build-dossier.md](file:///Users/vine/code/experiments/bust-a-grape-kitchen/claude/collab/evidence/02-ritual-rivalry-build-dossier.md): Deterministic test output, visual budget compliance, rivalry/grudge loop description, viewport note.
- [gemini.md](file:///Users/vine/code/experiments/bust-a-grape-kitchen/claude/collab/handoffs/gemini.md): Implementation summary, compromise list, open risk (AI `cut = 0` bias).
- [claude.md](file:///Users/vine/code/experiments/bust-a-grape-kitchen/claude/collab/handoffs/claude.md): Round 02 instruction set, open question on `vz` scaling.
- **No Round 02 screenshots** were produced or referenced. Only Round 01 viewport captures exist in `collab/evidence/`.

## BLOCKERS

### 1. No viewport proof — Playwright acceptance checks 8 & 9 are unmet

The directive requires Playwright captures at 844×390 and 740×360 proving (a) Grudge Card is fully visible, (b) "NEXT MATCH" receives pointer, (c) ceremony doesn't obscure HUD, and (d) frame pacing ≤ 5 % drops. The dossier acknowledges Playwright was skipped entirely. CSS `clamp` inspection is not a substitute; layout can break from overlay stacking, z-index conflicts, or safe-area insets that only surface in a real viewport render.

**Required fix:** Produce two screenshots (740×360 landscape, 844×390 landscape) showing the Grudge Card interstitial with series score and the NEXT MATCH button fully visible and un-clipped. If Playwright cannot be installed, a headed-browser manual capture at those exact pixel dimensions is acceptable. Place them in `collab/evidence/` as `02-ritual-rivalry-740x360.png` and `02-ritual-rivalry-844x390.png`. Additionally, run one 4-lot match in headless Chrome at 740×360 and report frame-drop percentage in the dossier.

### 2. AI opponent always hits Dead Lane — game balance is broken

Gemini's handoff flags this directly: the AI hardcodes `cut = 0`, and when the player cart sits near `z = 0` the opponent consistently lands Dead Lane (+15 % bonus damage), making the AI disproportionately punishing with no player agency to counter. This violates the directive's intent that Dead Lane rewards *skillful* depth play — the AI should not stumble into the highest accuracy tier by default.

**Required fix:** Add a deliberate z-spread to the AI's cut selection so that the AI's tier distribution across a full match approximates roughly 20 % Dead Lane, 50 % Graze, 30 % Wide (±10 pp). Log the AI's per-shot tier in the deterministic test to verify the distribution. This is a tuning constant, not a new system.

### 3. Ceremony distinctness across ammo types is undocumented

Acceptance check 4 requires all four ammo types to have "distinct ceremony visuals at Dead Lane tier (different particle color/pattern per ammo)." The dossier mentions the ceremony data block exists with per-ammo parameters (color override, particle kind, push depth) but provides no visual evidence that the four ceremonies are perceptually distinguishable. Without screenshots or a descriptive table mapping each ammo to its specific color and pattern, this check is unjudged.

**Required fix:** Add a table to the dossier listing, for each ammo type: particle color hex, particle kind/shape, camera punch depth value, and one sentence describing the visual difference a player would perceive. Then include at least one composite screenshot or GIF showing two different ammo Dead Lane ceremonies side-by-side (or sequentially captured) so the gate can confirm distinctness.
