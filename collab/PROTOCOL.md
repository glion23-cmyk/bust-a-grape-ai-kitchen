# Opus + Gemini cook protocol

Each round is one shared conversation conducted through code, commits, narrow directives, evidence, and short handoffs. Both lanes run through the already-authenticated Antigravity CLI.

## Order

1. **Opus directs.** It syncs to `main`, reads the compact state, and writes one round directive: the player promise, one coherent dimensional/loop advance, explicit non-goals, technical seams, and acceptance checks.
2. The runner merges that directive into `main`.
3. **Gemini produces.** It syncs to the exact directive, inspects the source, implements the playable slice, builds physics/performance diagnostics, tests it, and writes a compact evidence dossier plus a short handoff.
4. The runner validates and merges Gemini's fork into `main`.
5. **Opus gates.** It reads only the directive, compact evidence dossier, short handoffs, and up to two named screenshots. It writes `VERDICT: PASS` or `VERDICT: REPAIR` with no more than three blockers.
6. If repair is required, **Gemini closes the gate** in the same round and leaves fresh evidence.
7. The integrated build is rebuilt. Publishing remains a separate explicit switch.

The models never work from stale parallel assumptions. Gemini may challenge a directive with evidence, but it must leave a coherent playable alternative—not a debate transcript.

## Opus allowance discipline

- Use `claude-opus-4-6-thinking`, not Sonnet.
- Opus decides; Gemini digests and builds. Do not spend Opus on mechanical repository traversal, bulk edits, repeated tests, asset conversion, or boilerplate.
- A director pass emits one compact directive. A gate pass emits one verdict and at most three blockers.
- The director prompt gives Opus only current state/decisions and the two short handoffs. The gate prompt gives it only the directive, Gemini's sub-900-word evidence dossier, handoffs, and up to two screenshots.
- Opus must not traverse source, old run logs, or the board archive. Unknown implementation facts become Gemini acceptance checks.
- Durable reasoning lives in directives, gates, handoffs, and `DECISIONS.md`, not an expanding chat session.
- Every Opus call is a fresh print-mode session. No recursive model teams.

## Definition of a valid turn

A valid Gemini production turn must:

- change the playable game or materially improve the system that produces it;
- preserve an immediately runnable state;
- run proportionate checks;
- update its handoff with what changed, why, evidence, remaining doubt, and the best opening for the partner.

An Opus director/gate turn is valid when it resolves ambiguity into testable constraints or catches a real quality failure without generating design sprawl. Deploying, publishing, altering Git topology, and deleting source assets belong to the outer runner, not either model.

## Whole-game lenses

The agents may choose their own work, but they must keep checking the whole:

- identity, dimensional staging, and visual cohesion;
- aim feel, ballistics, terrain, hit readability, and skill expression;
- meaningful ammo and tactical decisions;
- opponent behavior, difficulty, pacing, comeback tension, and replay compulsion;
- ceremony, animation, sound, impact juice, announcer energy, and comedy;
- mobile ergonomics, accessibility, performance, resilience, and maintainability.
