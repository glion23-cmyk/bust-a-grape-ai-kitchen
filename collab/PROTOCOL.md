# Two-model cook protocol

Each round is one shared conversation conducted through code, commits, and short handoffs.

## Order

1. Gemini syncs to the integrated `main` tree.
2. Gemini reads Claude's last handoff, audits broadly, implements one coherent pass, tests it, and writes `collab/handoffs/gemini.md`.
3. The runner validates and merges Gemini's fork into `main`.
4. Claude syncs to that exact result.
5. Claude reads Gemini's handoff and the new build, then critiques by implementing a focused answer, tests it, and writes `collab/handoffs/claude.md`.
6. The runner validates and merges Claude's fork into `main`.
7. The integrated build is rebuilt. Publishing is a separate explicit switch.

The order can reverse in a future round if the state file records why, but the models never work from stale parallel assumptions.

## Claude allowance discipline

- Gemini carries broad repository digestion and the first pass.
- Claude uses current files plus a concise partner handoff instead of a repeated full-history prompt.
- Claude runs on Sonnet at high effort with a default ceiling of eight agent turns per round.
- Each Claude pass is a fresh bounded session; durable knowledge lives here, not in an ever-growing chat transcript.
- Claude does not spawn extra model teams or produce redundant audits.
- If Claude hits an allowance wall, the runner stops cleanly. Gemini's already validated work remains integrated, and Claude resumes next round from the handoff instead of repeating context.

## Definition of a valid turn

A valid turn must:

- change the playable game or materially improve the system that produces it;
- preserve an immediately runnable state;
- run proportionate checks;
- update its handoff with what changed, why, evidence, remaining doubt, and the best opening for the partner.

Pure brainstorming is not a cook turn. Deploying, publishing, altering Git topology, and deleting source assets belong to the outer runner, not either model.

## Whole-game lenses

The agents may choose their own work, but they must keep checking the whole:

- identity and visual cohesion;
- aim feel, ballistics, terrain, hit readability, and skill expression;
- meaningful ammo and tactical decisions;
- opponent behavior, difficulty, pacing, comeback tension, and replay compulsion;
- ceremony, animation, sound, impact juice, announcer energy, and comedy;
- mobile ergonomics, accessibility, performance, resilience, and maintainability.
