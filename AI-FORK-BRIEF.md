# BUST A GRAPE — AI Fork Brief

## Status

The owner rejected the current build. It is a functioning prototype and test harness, not an approved visual or gameplay target. Do not merely polish it, reskin it, or preserve its current launcher geometry.

## Mission

Fork the game and make a dramatically better, compulsively replayable landscape mobile artillery game. It must feel like a modern dimensional production—not an 1980s arcade mockup, flat browser toy, generic steampunk contraption, or imitation of an existing game.

The identity is Kansas farming badassery crossed with cyberpunk, gangster, and cowboy energy. Favor bright, legible daylight and expressive 3D motion. The two launchers must be compact harvest-buggy-scale farm machines with radically different, mechanically convincing launch actions.

Pips remain stern walking grape bunches with stems, arms, legs, and boots. They are a serious launch crew who happen to be fruit. They are not Minions, rodents, mascots, or edible-cute characters, or human-sized mobsters.

## What is useful in the current package

- Deterministic fixed-step `(x,y,z)` ballistics and z-aware collisions.
- Four ammunition behaviors: TABLE, PEA, CLUSTER, and LUG.
- Player/AI turn loop, four-bottle health, best-of-three rivalry, announcer system, PWA shell, and mobile viewport handling.
- Browser/unit tests and evidence capture scripts.
- Source boards and competing visual lanes under `art/boards/`.
- Opus/Gemini collaboration records under `collab/`.

Keep, rewrite, or delete any implementation as needed. Preserve only what helps the new fork win.

## Non-negotiable experience checks

- A shot must begin from an understandable physical control on the player's launcher.
- Clicking the opponent must never be an aiming shortcut.
- Aiming must reward learned judgment; the preview cannot reveal a guaranteed endpoint.
- The launcher mechanisms, Pip ceremonies, projectiles, hits, and victory need authored 3D animation and satisfying timing.
- The whole match must fit a landscape phone viewport without scrolling or microscopic controls.
- Visual contrast must survive daylight phone use.
- The game must open quickly, recover cleanly from interrupted touch gestures, and remain installable/offline-capable.

## Fork workflow

1. Create a branch named `fork/<model-or-team>/<concept>` from whichever baseline is useful.
2. Record the new player promise and visual thesis before large implementation work.
3. Build a single playable vertical slice that proves aiming, one launcher ceremony, one projectile, one impact, and the rematch impulse.
4. Add or update tests for every new rule. Do not replace evidence with prose.
5. Put fresh phone-sized captures in a branch-specific evidence folder.
6. Do not deploy or change the existing public sites. Submit the branch for comparison.

## Commands

```sh
npm install
npm test
npm run test:browser
./scripts/build-pages.sh
python3 -m http.server 4173 --bind 0.0.0.0
```

The current experimental branch is `rebuild/modern-kansas`. The stable historical baseline is `main`. Both are intentionally available so a fork can salvage systems without inheriting the rejected look.
