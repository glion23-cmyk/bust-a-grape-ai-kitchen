# BUST A GRAPE

Original side-view artillery food fight. The only ammo is grapes. The only language is disrespect.

## Play

The game is designed for a landscape browser window. From this folder:

```sh
python3 -m http.server 4173 --bind 0.0.0.0
```

Then open `http://127.0.0.1:4173`.

### Play on a phone

The current dimensional candidate is online at:

`https://dimensional-round-02.bust-a-grape.pages.dev`

Rotate the phone sideways. It is a Cloudflare branch preview, so it stays available when this Mac is asleep and does not replace the stable production build at `https://bust-a-grape.pages.dev`.

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

## Opus + Gemini kitchen

The game has a two-model iteration rig with separate Git worktrees. Claude Opus makes compact creative/architecture calls and quality gates; Gemini Pro carries implementation, physics, tuning, tests, and phone-performance work. Both use the already-signed-in Antigravity model supply. See `collab/MANDATE.md` and `collab/PROTOCOL.md`.

```sh
./scripts/kitchen-doctor.sh
./scripts/setup-kitchen.sh
./scripts/cook-round.sh 03-next-seam
```

Cook rounds do not publish by default. Set `BAG_DEPLOY_AFTER_COOK=1` only when an integrated round should replace the public build.

- Pick TABLE, PEA, CLUSTER, or LUG.
- Drag on the field to set angle and juice.
- Release to begin the crew ceremony and launch.
- Break all three of the Late cart's HP bottles before it breaks yours.

The first shot shows the full teaching arc. After that, the chalk only shows the climb; each lot remembers its own last angle and power, and old juice stains help you walk the range in.

## Current slice

- Compact Sidewinder twin-flywheel accelerator versus compact Bootlegger pressure-lariat thrower
- True `(x,y,z)` fixed-step ballistics, depth-local craters/splash, a 3D dirt stage, and Canvas degradation
- CUT-driven Dead Lane/Graze/Wide skill tiers with distinct camera-framed impacts
- Four mechanically distinct grape lots, including five-way Cluster breakup
- Four readable 3D Pip crew tableaux using wheel-scale painted bunches
- Ballistic-search AI with target-plane depth error derived from each solved shot
- Contextual broadcast calls, hit streaks, match stats, opt-in best-of-three, and persistent local Grudge tally
- Mouse, touch, and keyboard controls; phone-landscape layout

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
