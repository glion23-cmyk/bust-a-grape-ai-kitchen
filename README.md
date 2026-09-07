# BUST A GRAPE

Original side-view artillery food fight. The only ammo is grapes. The only language is disrespect.

## Play

The game is designed for a landscape browser window. From this folder:

```sh
python3 -m http.server 4173 --bind 0.0.0.0
```

Then open `http://127.0.0.1:4173`.

### Play on a phone

The source repository is public at:

`https://github.com/glion23-cmyk/bust-a-grape-ai-kitchen`

The current premium candidate is on `fix/premium-shell`. It is a full-viewport,
phone-first baseline; the stable production alias is deliberately unchanged
until a physical-phone review clears it.

For local development, with the Mac and phone on the same Wi-Fi, open the Mac's LAN address on the phone. For the current network that is:

`http://192.168.40.126:4173/`

The server must remain running and the Mac must remain awake. If the Mac's address changes, run `ipconfig getifaddr en0` and substitute the returned address. Rotate the phone sideways; the game is designed and tuned for landscape play.

The short-landscape layout fills the phone's entire usable browser viewport. To remove an iPhone browser toolbar too, open the link in Safari, choose **Share → Add to Home Screen**, and launch it from the new BUST A GRAPE icon. An embedded browser owns its own toolbar, so the webpage cannot remove that strip itself.

The project is also PWA-ready: when it is served over HTTPS, its service worker caches the core match files for offline rematches.

### Build the permanent phone-hosting bundle

```sh
./scripts/build-pages.sh
```

This creates `dist/` with only the playable game, production art, mobile manifest, offline worker, and hardened Cloudflare Pages headers. Source boards and design documents are intentionally excluded from hosting.

## Forking the game

Any AI or developer can clone the public repository without a GitHub login. Start
from `fix/premium-shell` for the newest complete baseline, or branch from an older
round if you intentionally want to rework the visual thesis. Read
`AI-FORK-BRIEF.md` before changing the physics or launcher interaction.

```sh
git clone https://github.com/glion23-cmyk/bust-a-grape-ai-kitchen.git
cd bust-a-grape-ai-kitchen
git switch fix/premium-shell
npm install
npm test
npm run test:browser
npm run test:pwa
```

- Pick TABLE, PEA, CLUSTER, or LUG.
- Grab the Sidewinder's lit launch ring; pull to set lift and juice, then bend the gesture to shape the depth lane.
- Release to begin the crew ceremony and launch.
- Break all four of the Late cart's HP bottles before it breaks yours.

The first shot shows the full teaching arc. After that, the chalk only shows the climb; each lot remembers its own last angle and power, and old juice stains help you walk the range in.

## Current slice

- Compact procedural-3D Sidewinder twin-flywheel accelerator versus compact Bootlegger pressure-hopper ram
- Current Three.js module pipeline, adaptive Retina resolution, PCF shadows, restrained bloom, environment-lit metals, and rounded industrial bodywork
- True `(x,y,z)` fixed-step ballistics, depth-local craters/splash, a 3D dirt stage, persistent stains, and camera-framed impacts
- Pull + Shape depth control with Dead Lane/Graze/Wide skill tiers
- Four mechanically distinct grape lots, including five-way Cluster breakup
- Four readable 3D Pip crew tableaux using wheel-scale bunches, ceremony props, and camera push-ins
- Ballistic-search AI with target-plane depth error derived from each solved shot
- Contextual broadcast calls, hit streaks, match stats, opt-in best-of-three, and persistent local Grudge tally
- Self-hosted Barlow typography, immediate press states, screen transitions, a boot gate, hybrid sampled/synthesized SFX, and a redesigned install icon
- Touch-first launcher gesture, haptics, mouse/keyboard support, full-bleed phone/desktop layouts, and an offline install shell

Release proof, test scope, and current 844×390 phone captures are indexed in
`collab/evidence/04-premium-shell-dossier.md`.

The approved art direction and source boards live in `art/boards/`. `STATUS.md` is the accumulation index.

Read `STATUS.md` first. That is the accumulation index.

```
bust-a-grape/
  index.html          landscape game shell
  game.js
  style.css
  STATUS.md           have / need / drop rules
  README.md           this file
  content/            lot stats + announcer lines
  docs/               GDD + style prompt + legal
  art/boards/         YOUR boards go here
  art/refs/           cropped references from approved boards
  art/sprites/        production world art
  art/gui/            production HUD art
  audio/sfx/
  audio/music/
  legal/
```
