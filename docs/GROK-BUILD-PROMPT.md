# GROK BUILD PROMPT — BUST A GRAPE
Paste everything below the line into Grok Build. Do not summarize it first. Build the game.

---

You are Grok Build. Your job is to produce a complete, playable browser game called **BUST A GRAPE** from this spec. Do not invent a different game. Do not add rockets, guns, or non-grape ammo. Do not copy ShellShock Live, Worms, Angry Birds, or Minions art, UI, names, or audio.

If project files already exist under `bust-a-grape/`, improve that codebase. If not, create a new static web game that can be opened via `index.html`.

## 1. What you are making

Turn-based artillery duel on a dirt hill. Two buggy-class farm machines lob fruit at each other. The only ammo is grapes. Variety comes from grape size, pack, and how the lot flies — never from unlocking a missile.

Tone: playground insult + farm filth + wine snobbery + sports announcer. Adult, mean, funny. Not cute farm-app. Not tasting-room brochure. Not sci-fi tank HUD.

Log line: *You couldn’t bust a grape in a food fight.*

Setting lock: **Kansas Night Harvest League, Buggy Class.** The League is broadcasting a yard fight. It is not a 25-foot vehicle sim and not a lightning stadium shooter.

Working subtitle on the title card: `Kansas Night Harvest · Buggy Class`

## 2. Non-negotiable locks

- Title is **Bust a Grape**. No “ShellShock” in title, repo, or UI.
- Always grapes. No grenades, rockets, tanks-as-tanks, or bottles-as-weapons.
- Side-view 2D. Browser first. Desktop + phone.
- Controls: **drag to aim, release to fire.** Direction from the firing muzzle to the finger/cursor = angle. Distance = power. Tiny tap does not fire.
- No movement/scoot in v1. Carts stay planted.
- No online, no accounts, no shop, no hats.
- 3 HP bottles per side. First to 0 loses.
- Wind OFF in v1.
- Player is left = **Yard / The Sidewinder**. AI is right = **Late / The Bootlegger**.
- Crew are **Pips**: walking bunches of grapes with arms, legs, a stem, tiny boots, and a stern face on the front berry. They run an ornate 1.1s launch ceremony before every shot.
- Pips are NOT Minions (no yellow, no goggles, no overalls, no banana, no stolen faces/names).
- Pips are NOT rats or rodents.
- Pips scale: top of the bunch ≈ top of the cart wheel. Never human-height next to a semi.
- Voice: text announcer, PG-13. No TTS required.
- Audio v1: short synthesized or original SFX only (thump, air whistle, splat, cork, UI tick). No licensed music required. Leave a hook-in point for a title sting later.

## 3. Visual style (approved)

Match this look, do not drift:

Palette only:
- Dirt `#3A2A1C`
- Oxblood `#6B1C2A`
- Cream `#F3E6C8`
- Juice purple `#5A1638`
- Ink `#1A100C`
- Dusk sky `#8AA7B8` → `#C4B49A`
- Trim only: blackened steel, oxidized copper, juice on metal
- Not identity: cyan, chartreuse, neon, sci-fi panel glow

World: dusk Kansas lane, stained dirt mound, distant grain elevator / NHL Co-op, radio tower, windmill, utility poles, juice already on the ground.

Carts (buggy-class, cart-sized):
- **Sidewinder (Yard):** compact oxblood/blackened sprayer-accelerator. Tank, hopper of grapes, twin flywheels, mean snout facing inward. Attitude of an illegal orchard accelerator, scale of a harvest buggy.
- **Bootlegger (Late):** compact dark pressure hopper with a short lariat/crane arm and cup. Attitude of a fermentation-pressure thrower, scale of a harvest buggy.

GUI:
- Title lockup: condensed cream sports gothic on torn oxblood; a smashed bursting grape sits in GRAPE.
- Lot buttons look like wooden crates with metal corners: TABLE / PEA / CLUSTER / LUG.
- Power is a juice stain in a metal rail, not a sci-fi battery.
- Chip: **PIPS ON THE LIP**
- Win card: **VINEGAR.**
- HP: three small juice bottles that empty.
- Announcer line in cream on wine-dark, optional mic glyph.
- Stamp somewhere: PROPERTY OF NIGHT HARVEST LEAGUE

If image assets already exist, USE THEM:
- `art/sprites/kansas-dusk.jpg`
- `art/sprites/sidewinder.png`
- `art/sprites/bootlegger.png`
- `art/sprites/pip-merlot.png`
- `art/gui/lockup.png`
- Style boards in `art/boards/APPROVED-board-J-kansas-buggy-class.jpg`
- GUI reference: `art/boards/board-L-gui-crate-sheet.jpg` and `art/boards/board-K-gui-rivet-sheet.jpg`

Do not rebuild 25-foot blueprint machines from the Night Harvest League cutaway boards. Those are mythos only.

## 4. Gameplay loop

1. Title card. Tap/click to start.
2. Player turn. Choose lot (buttons or 1–4). Drag on the field. Dotted arc updates. Release.
3. 1.1 second Pip ceremony with protocol subtitle, then the grape leaves.
4. Projectile flies with gravity. Camera can follow. Impact slams slightly.
5. Juice stain + optional crater in the heightmap. Damage if a cart is in blast.
6. Announcer line (one line, never two stacked).
7. If someone is at 0 HP: cork SFX, kill line, then win/lose card.
8. Else AI aims with noisy ballistics, same ceremony, fires.
9. Repeat.
10. R or tap on results = new match.

Session target: 3–6 minutes.

## 5. Lots (the entire gun lab for v1)

Exactly these four. Data-driven in `content/lots.json`.

| id | name | feel | mass | velMul | split | splash | dmgDirect | dmgSplash | crater | radius |
|---|---|---|---|---|---|---|---|---|---|---|
| table | TABLE | honest berry | 1 | 1.00 | 0 | 18 | 1 | 1 | 2 | 7 |
| pea | PEA | sniper, rude | 0.55 | 1.22 | 0 | 0 | 1 | 0 | 1 | 4 |
| cluster | CLUSTER | food fight | 0.80 | 0.96 | 5 | 12 | 1 | 1 | 1 | 6 |
| lug | LUG | freight, bowls the hill | 2.4 | 0.72 | 0 | 46 | 2 | 1 | 6 | 13 |

Colors approx: table `#6B1C4A`, pea `#2F6B3A`, cluster `#4A1458`, lug `#3B0D2A`.

Cluster: one projectile that splits into 5 at apex (when vy crosses from up to down), with lateral spread. Kids can each crater 1 and deal 1.

Lug: heavy, short-ish arc, big crater, splash. Near-miss should still chew dirt.

Do not add lots 5–12 in this build.

## 6. Physics

- Canvas ~1280×720 logical. Scale CSS to screen width. `touch-action: none` on the canvas.
- Terrain = column heightfield (~160 columns). Carts snap to ground Y after craters.
- Gravity ≈ 0.18 px/frame² at 60fps (tune so a mid-power Table can cross the mound).
- Power 20–100 maps to velocity. Drag distance on mobile must be able to reach ~90 power without leaving the canvas. Tune the `dist → power` scalar on a phone.
- Angle clamp about 8°–82° from the firing side.
- Player faces right, AI faces left. Angle is mirrored for the AI.
- Off-map = miss.
- Self-hit is allowed and mocked.
- Preview: 8–12 wine-dark dots along the un-split Table-like arc. Preview does not simulate Cluster breakup. That is the joke.
- While dragging, draw a dashed cream line from muzzle to finger plus the dotted arc.

## 7. Pips and ceremony

Before every shot, spawn 3–5 Pips at the firing cart for ~1.1s.

Protocols (subtitle, all caps, centered):
- TABLE: `WIPE · WEIGH · NOD · CLEAR THE LIP`
- PEA: `CALIPERS · ARGUE · HOLD HIM · FIRE`
- CLUSTER: `PILE ON · COUNT OFF · DO NOT EAT IT · FIRE`
- LUG: `BLOCK AND TACKLE · SIGN FOR IT · STEM, GET OFF`

If you can animate distinct poses, do: wipe/scale, two Pips arguing with calipers, five-Pip pile-on, block-and-tackle on a crate. If not, Pips walking to the muzzle with the subtitle is acceptable for v1 — but keep the 1.1s beat. Do not skip it.

Use `art/sprites/pip-merlot.png` if present.

## 8. Mouth (announcer)

One line per event. No repeats in the same match until the bucket is exhausted. ~12 words max except the north-star sentence.

Triggers and seed lines (also live in `content/lines.json` if present — use and extend, do not replace with generic roast-GPT):

START
- You couldn't bust a grape in a food fight.
- Estate vs estate. Only one of you has fruit.
- Pips are on the lip. Try not to embarrass them.
- If shame fermented, you'd be a reserve.
- Kansas Night Harvest. Buggy class. Try to hit something.

LOT TABLE
- Table fruit. Honest. Boring. Fine.
- Pips wiped that. Don't waste a clean berry.

LOT PEA
- Cute. Send a raisin when you grow up.
- A pea. He's whispering at a hill.

LOT CLUSTER
- Finally. A food fight.
- Pips piled on. That's a committee.

LOT LUG
- That's not ammo. That's a cry for help.
- Somebody signed for this lug.

FIRE
- Fruit's in the air. Look alive.
- Pips clear. Gravity is undefeated.

HIT
- That's a stain you'll introduce as a cousin.
- Pressed.
- Bottled.
- Appellation: your forehead.
- Put it on the label. Defeated, 2026.

MISS
- You threw a grape at dirt and lost.
- The hill is undefeated.
- Notes of nothing.
- Gravity sends its regards.

SELF
- Harvested himself.
- The only accurate shot of his life.
- Eat your own inventory.

KILL
- Vinegar.
- That's the vintage.
- Closed the tasting.
- House folded. Fold the chairs.

WIN
- You busted a grape. Don't let it go to your head.
- The Pips will file this under 'adequate.'

LOSE
- You couldn't bust a grape in a food fight.
- The Pips looked away. Professional courtesy.

Display the live line under the canvas in large cream type.

## 9. AI

Dummy is fine. After the player shot resolves:
- Pick lot by distance (far = Lug, close = Pea, else Table or Cluster).
- Angle 42–64 with noise. Power 48–86 with noise.
- Run the same ceremony, then fire.
- AI may miss. That is comedy.

## 10. Screens

TITLE: lockup image or painted title, Kansas Night Harvest line, north-star insult, “TAP · drag to aim · release to fire”

PLAY: dusk field, heightmap hill, two named carts, HP bottles, lot buttons, power/angle readout, PIPS ON THE LIP during ritual, drag preview, juice stains.

OVER: **VINEGAR.** if player wins. **YOU COULDN’T.** if player loses. Tap to rematch.

## 11. Tech

- Static HTML + Canvas + JS. No backend. No build step required. Optional tiny CSS.
- `index.html`, `game.js`, `style.css`, `content/lots.json`, `content/lines.json`.
- Viewport: `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover`
- Prevent page scroll while dragging on the canvas (`preventDefault` on touchmove).
- Lot buttons min-height 44px.
- Keyboard optional: 1–4 lots, R restart. Do not require keyboard to play.
- Deterministic-enough hill is fine. Refresh = new duel. No save.

Suggested layout:

```
bust-a-grape/
  index.html
  game.js
  style.css
  content/lots.json
  content/lines.json
  art/sprites/...
  art/gui/...
```

## 12. What NOT to build in this pass

- Lots 5–12, heat/ripen-in-the-bucket, lying wind
- Online, ranked, Daily, hotseat-as-required-mode (hotseat is optional extra)
- Full 7-track interactive score
- Recorded VO
- Sidewinder/Bootlegger as 25-foot cutaway vehicles
- 6'2" grape mobsters, dusters, cyan cables
- Shot clock, PSI stack, cart-select RPG, League menu
- Hats, crates-as-microtransaction

## 13. Acceptance tests

The build is done when all of these are true:

1. Opening `index.html` shows the title and the game runs in a phone browser and a desktop browser.
2. Drag-release fires a grape. Angle and power visibly change with the drag.
3. Table, Pea, Cluster, Lug all fly differently. Cluster breaks. Lug bites a bowl in the hill.
4. Pips appear and a protocol line plays before the shot.
5. Two painted carts are recognizable as Sidewinder and Bootlegger, not colored rectangles (use existing sprites if present).
6. Announcer prints a unique-enough line on start, lot, miss, hit, kill.
7. A match can end. Tap restarts.
8. No ShellShock/Worms/Minions assets or names.
9. A stranger watching 8 seconds with sound/SFX on can say: tank-hill game, only grapes, I want that announcer line.

## 14. If you have extra time after the slice is solid

In this order only:
1. Tune drag-to-power so a phone thumb can both pea-snipe and lug.
2. Distinct Pip ceremony blocking for the four lots.
3. Swap lot HTML buttons to crate art.
4. Title-hook audio sting on the title card.
5. 20 more announcer lines in the existing buckets.

Do not start a new art world. The look is locked.

Build it now.
