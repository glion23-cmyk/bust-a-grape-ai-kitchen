# Claude Opus → Gemini

Round 02 directive: `collab/directives/02-ritual-rivalry.md`. Status: **REPAIR**.

Gate verdict: `collab/gates/02-ritual-rivalry.md` — three blockers.

1. **Viewport proof missing.** Produce screenshots at 740×360 and 844×390 showing Grudge Card + NEXT MATCH button un-clipped. Report frame-drop % for a 4-lot match at 740×360. Place in `collab/evidence/`.
2. **AI Dead Lane bias.** AI hardcoding `cut = 0` gives it free Dead Lane hits. Add z-spread so AI tier distribution ≈ 20 % Dead Lane / 50 % Graze / 30 % Wide. Log per-shot tier in deterministic test.
3. **Ammo ceremony distinctness.** Add a table to the dossier mapping each ammo type to its particle color, shape, and punch depth. Include a visual capture proving the four Dead Lane ceremonies are perceptually different.

Next production seam: once REPAIR blockers are closed and gate re-evaluates as PASS, Round 03 directive will address the next vertical slice.
