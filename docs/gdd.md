# BUST A GRAPE
## Game Design Bible — planning only, not a build
**Working title:** Bust a Grape  
**Also-rans:** Lug, Brix Angle, Food Fight, Clusterfuck (too much), Canister, Yard Lot  
**Log line:** ShellShock-style artillery. The only ammo is grapes. The only language is disrespect.

Pitch (store / X):  
Two estates, one hill, weather for wind. You lob fruit. Size, ripeness, pack, and faults change the shot — never rockets. Between volleys the announcer and the other house try to end you socially. If you miss, you hear it for the rest of the vintage.

North-star diss (do not lose this voice):  
> You couldn’t bust a grape in a food fight.

---

## 1. Fantasy & tone

You are not a tank commander. You are the worst person at a harvest party who also happens to be accurate.

Tone stack:
- Playground insult
- Farm filth
- Wine snobbery used as a weapon
- Sports-announcer cruelty (NBA Jam / Worms / old arcade)
- A little adult, never cute, never tasting-room brochure

What it is not:
- Educational viticulture
- A farm sim
- A drinking game that requires drinking
- A ShellShock Live skin
- A game that unlocks a missile on level 8 and pretends it’s a “cabernet warhead”

The camera should always be able to see both the joke and the arc.

---

## 2. Player fantasy in one loop

1. Look at the hill.
2. Pick a lot (the “weapon”).
3. Set angle + power.
4. Eat a diss while you aim.
5. Fire a grape that behaves like fruit.
6. Juice, crater, or humiliation.
7. Hear a better diss if you missed, a kill line if you didn’t.
8. Heat/weather ticks. The fruit you didn’t fire gets riper (worse / different).
9. Repeat until one cart is vinegar.

Session target: 3–6 minutes per duel. Best-of-3 if anyone has pride left.

---

## 3. Platforms & scope philosophy

- Browser first. Desktop is the real home. Touch later.
- No required online for 1.0. Hotseat + AI.
- Online duel is a post-1.0 mode, not the spine.
- One human + AI orchestration. No 400-weapon lab.

Pillars, in order:
1. Fruit is the only ammo, and it plays different.
2. Disrespect is a system, not flavor text.
3. Soundtrack is a character.
4. Readable 1-second silhouette (hill, dotted arc, purple shot).

---

## 4. Core mechanics

### 4.1 The cart
Stand-in for the tank. A converted sprayer / harvest buggy.
- 3 pips of structure (hearts). Optional armor as “oak” that soaks one splat.
- Cannot move on the tutorial map. On full maps: limited scoot (2–3 body lengths) instead of SSL’s full roam, so aim stays the sport.
- Face left/right. Angle is 0–90 from the facing.

### 4.2 The shot
Every turn:
- Choose **lot**
- Set **angle**
- Set **power** (velocity)
- Confirm

Power is not a separate weapon. Power is how hard the crew yeeted this particular fruit. Some lots punish full power (ripe fruit detonates at the lip of the bucket).

### 4.3 Ballistics (design, not code)

Base projectile is a point mass with wind.

- Gravity is constant and slightly mean. Fruit should feel heavier than a cartoon bullet.
- Wind is a single number posted on a weather vane. Smoke-fault lots lie about it.
- Mass comes from size. Lugs drop. Peas hold a line.
- Drag is real enough to feel. Frozen ignores some drag. Must ignores some wind.

The player-facing fantasy: *I am throwing food.* If it ever feels like a tracer round, the lot is wrong.

### 4.4 The five knobs (the whole gun lab)

Every lot is a preset of:

| Knob | Values | Play effect |
|---|---|---|
| Size | pea / berry / cluster / lug | Hitbox, split, crater, self-chip on lug miss-near |
| Velocity cap | timid / normal / stupid | Some lots cannot take full power |
| Ripeness | green / pick / late / raisin | Bounce / honest / smear+DoT / sinker |
| Pack | loose / stem-on / frozen / must | Shed / flail / bank / blob |
| Fault | clean / rot / smoke | None / delayed cloud / false wind ribbon |

12 lots at 1.0. No more until those 12 are funny in the hands.

### 4.5 Named lots (1.0 roster)

1. **Pea** — small, fast, rude. The jab.
2. **Table** — default honest berry.
3. **Cluster** — breaks at apex into five. The food-fight shot.
4. **Lug** — freight. Crater. Near-miss still hurts the hill. Miss completely and the announcer files you under “groceries.”
5. **Verjus** — green. Two bounces. Mean on a back slope.
6. **Raisin** — low arc, high shame if you aimed like it was Table.
7. **Icebox** — frozen. Banks off posts and hardpan.
8. **Slipskin** — smear. Next fruit on that dirt slides. Setup tool.
9. **Noble** — tiny impact, then a one-beat-late rot fog. Worms-cluster energy without being a grenade.
10. **Smoke Lot** — dirty plume. Wind ribbon on the next turn is a liar.
11. **Stem-On** — holds together, then slaps as a flail if it clips dirt first.
12. **The Wedding** — one beautiful berry. Direct cart hit is brutal. Dirt hit does 1 and triggers the critic laugh.

Unlock order for the campaign / first hour: Table, Pea, Cluster, Verjus, Lug, Icebox, Slipskin, Raisin, Stem-On, Smoke Lot, Noble, The Wedding.

### 4.6 Terrain
Column heightfield. A lug bites several columns. A pea bites one. Juice stains persist as cosmetics + Slipskin physics.

Props (not another sim):
- Trellis posts (thin bounce)
- Irrigation ditch (shots die wet)
- Frost cloth (eats one hit, then gone)
- Wedding tent (funny to ruin, light HP)
- Parking-lot “estate” sign (extra diss if you hit it)

Maps are 2–3 screens wide, camera eases to follow the arc, slams on impact.

### 4.7 Weather & heat (the grape-only meta)

Each turn ticks a little heat.
- Table sitting in the bucket three turns becomes Late.
- Icebox in sun becomes Table with a lawsuit.
- A frost event can re-freeze a Late into Icebox for one shot.
- Wind cards: still, breeze, gust, “liar’s gust” (display ≠ truth, only if Smoke is in play).

This replaces SSL’s enormous weapon menu with a living pantry.

### 4.8 Damage
- Direct cart: pip(s) by mass.
- Splash: falloff in column-widths.
- Self-hit: always mocked.
- Terrain kill (cart falls into a crater): “you harvested yourself.”
- DoT smear: half-pip at turn start if parked in Late juice.

Three pips keeps duels short enough for the soundtrack to finish a thought.

---

## 5. Diss system (a real system)

Disrespect is not a random subtitle. It has triggers, targets, memory, and a house style.

### 5.1 Voices
- **Announcer** — sports bastard in a linen jacket. Talks like a harvest festival hired the wrong DJ.
- **Your house** — short barks from the cart. Cocky or wounded.
- **Their house** — the opponent. AI has a mouth. Hotseat is two mouths.
- **The critic** — only appears for The Wedding and for perfect misses. Quiet, lethal.

### 5.2 Trigger table

| Event | Who speaks | Job |
|---|---|---|
| Match start | Announcer | Name both houses + one insult each |
| Lot select | Opponent | Mock the lot (“a lug? you packing lunch?”) |
| Long aim (idle) | Announcer | Hurry-up diss |
| Full power + ripe lot | Announcer | Warn / mock the wet-bag muzzle burst |
| Clean hit | Your house | Short flex |
| Clean hit | Announcer | Call the shot like a dunk |
| Near miss | Opponent | The knife |
| Total miss (off map) | Announcer | Famous line territory |
| Self-hit | Everyone | Pile-on |
| Terrain collapse | Announcer | Eulogy |
| Pip lost | Hurt house | Wounded pride, not whining |
| Last pip | Announcer | “Vinegar range.” |
| Kill | Announcer + critic chance | Signature line + sting |
| Win match | Winner house | One sentence. Sit down. |
| Heat-ripe change | Announcer | “That lot is late now. Like your career.” |

### 5.3 Memory
The game remembers 3 facts per match:
- Biggest miss distance
- Whether you used Lug
- Whether you self-hit

Later lines reference them. “Man who missed with a lug wants respect.” That is the Worms trick. Use it.

### 5.4 Line bible (seed set — write 10× this before ship)

Schoolyard × fruit × wine. Never meme-dated. Never TikTok voice.

Start / general
- You couldn’t bust a grape in a food fight.
- This isn’t a duel. It’s a picnic with poor judgment.
- Estate vs estate. Only one of you has fruit.
- If shame fermented, you’d be a reserve.

Lot select
- Pea: “Cute. Send a raisin when you grow up.”
- Cluster: “Finally. A food fight.”
- Lug: “That’s not ammo. That’s a cry for help.”
- Verjus: “Green fruit, green hands.”
- Raisin: “Sun already beat you up.”
- Icebox: “He’s throwing groceries now.”
- Slipskin: “Coward’s jam.”
- Noble: “Rot with a publicist.”
- Smoke Lot: “Can’t aim, so he’ll lie to the wind.”
- Stem-On: “Throwing the whole plant. Agronomy of fear.”
- Wedding: “Oh we dressing up.”

Misses
- You threw a grape at dirt and lost.
- The hill is undefeated.
- That arc was a eulogy.
- Notes of nothing.
- Call the coop. Tell them the fruit went sightseeing.
- You launched lunch into another zip code.
- Gravity sends its regards.
- That’s not wind. That’s you.

Hits
- That’s a stain you’ll introduce as a cousin.
- Bottled.
- Pressed.
- He felt that in last year’s barrels.
- Appellation: your forehead.
- Put it on the label. “Defeated, 2026.”

Self-hit / suicide crater
- Harvested himself.
- The only accurate shot of his life.
- Eat your own inventory.
- Food fight’s over. You were the food.

Kills
- Vinegar.
- That’s the vintage.
- Closed the tasting.
- Don’t decant him. He’s done.
- House folded. Fold the chairs.
- You could bust a grape. Look at that.

Comebacks (when the hurt house still has pips)
- Lucky dirt.
- Try it without the wind doing your job.
- One stain doesn’t make a critic.

Critic (sparse)
- “87. Rustic.”
- “A finish of embarrassment.”
- “I wouldn’t pair this with anything alive.”

### 5.5 Cadence rules
- One line per event. Never two announcer sentences stacked.
- No line longer than ~12 words unless it is the north-star sentence.
- Repeat protection: a line cannot play twice in one match.
- Profanity: sparse. The clean insult hits harder. PG-13 default, optional “cellar mouth” toggle that swaps in sharper cuts without becoming a slur machine.
- Never punch down on real regions, real families, real trauma. Invent houses. Mock aim, pride, ripeness, lying, grocery fruit.

### 5.6 Presentation
- Subtitle in a tasteful ugly sports gothic, cream on wine-dark.
- Optional bark without text for repeat players.
- Kill line stays up one extra beat so the sting can land with the downbeat.

---

## 6. Soundtrack (a character, not a menu loop)

Goal: people remember the *song* attached to a Lug connect. Killer means hooky, mean, physical. Not “epic trailer.” Not lofi vines.

### 6.1 Score identity
Working score name: **FOOD FIGHT IN C MINOR**  
Palette:
- Dirty brass (baritone horn, bent trumpet)
- Dry breakbeats / truck-bed percussion (stomps, crate lids, a destemmer as shaker)
- Bass that sits on the power meter
- A choir that is clearly three hungover guys
- Zero pretty acoustic guitar
- Zero generic “indie game piano”

Influences to steal *energy* from, not notes: NBA Jam cabinets, late-90s Worms menus, Dust Brothers / early Beastie instrumental swagger, a marching band that got lost at a metal show, Ennio if he was angry at a wedding.

### 6.2 Interactive layers (the actual design)

| Stem | When it lives |
|---|---|
| Bed (drums + bass) | Always in a match |
| Brass hook | After first decent hit, or from go in Food Fight mode |
| Charge layer | Power meter moving — snare rolls, bass climbs |
| Hang layer | Projectile in air — bed ducks, a whistle of air + one held horn note |
| Impact sting | Hit — full kit + brass stab + squish as percussion |
| Shame sting | Miss off-map — brass falls over, rimshot |
| Vinegar fanfare | Kill — 4-bar hook, then cut to silence for the line |
| Heat tick | Soft triangle / ice-in-glass when a lot ripens |

The hang layer is sacred. Midair should feel like the room leaned in.

### 6.3 Diegetic pieces
- Weather vane squeak doubles as the wind instrument.
- Crowd at the wedding map: they gasp on a tent hit.
- A single cork pop is the kill confirm. Do not overuse. Once per death.

### 6.4 Menu / meta music
- Title: the full hook, loud, 20 seconds before a skip. Make the title screen a place people leave on.
- Lot draft / garage: drum-and-brass groove, lower heat.
- Results: instrumental of the hook with the winner’s house stinger.
- Loss: same hook, detuned a notch, announcer still talking.

### 6.5 Track list (1.0, short on purpose)

1. **Couldn’t Bust a Grape** — title / identity. The one that has to slap.
2. **Yard Lot** — default duel bed.
3. **Late Harvest** — heat is high, lots are ripening, slightly nastier drums.
4. **Wedding Crash** — map theme, choir in the wrong key.
5. **Vinegar Range** — last-pip bed, more space, more brass.
6. **Tombstone** — results.
7. **Practice Lug** — training, drums only, so you can hear UI.

That’s seven. Do not ship a 40-track OST of beige loops. Seven that are loud enough to clip on X.

### 6.6 Production plan (still not building)
- Hum / Suno / live-ish sketch the title hook first. If the hook is weak, nothing else matters.
- Build the rest as arrangements of that hook so the game feels like one record.
- SFX pack original: squish, crate, post clang, vane, cork. No stock “explosion 17.”
- Mix: fruit impact should read on a phone speaker. Brass hook should read on a laptop tin.

Suno-style north star (for later, not now):  
*dirty brass fight anthem, breakbeat, harvest-stomp percussion, mean choir, no lyrics in the bed, a shouted title drop only on the fanfare, cinematic but street, 110 BPM, C minor.*

Lyrics belong on the title drop and maybe the vinegar fanfare. In-match beds stay instrumental so disses can sit on top.

Title-drop lyric seed:
- Couldn’t bust a grape / in a food fight
- Press it / stain it / say it on the label
- Vinegar range

---

## 7. Houses (not tanks with skins)

Four houses at 1.0. They change VO flavor and a tiny passive, not a new movelist.

1. **House Yard** — default. Loud. Passive: +a hair of power on Cluster.
2. **House Late** — smug. Passive: lots ripen one tick slower.
3. **House Ice** — cold. Passive: Icebox keeps freeze one extra turn of sun.
4. **House Wedding** — dressed up, broke. Passive: The Wedding shot is in the opening pantry.

AI personalities are the houses with aim styles:
- Yard: aggressive power, bad angle
- Late: waits, lets your fruit rot, annoying
- Ice: banks everything
- Wedding: hunts highlight shots, misses a lot, talks the most

---

## 8. Modes

### 1.0
- **Duel** — 1v1 AI or hotseat. Best of 1 / 3.
- **Food Fight** — all 12 lots, faster turn clock, announcer unhinged.
- **Yard** — the first three maps as a tiny ladder vs AI houses. Not an RPG.
- **Practice** — frozen wind, infinite fruit, no mouth. For labbing banks.

### Explicitly later
- Online ranked. Only when the 12 lots are good.
- Daily hill + daily wind + shared seed so X can compare screenshots.
- Workshop lots (still grapes-only; knobs sandbox). Dangerous. After 1.0.

No campaign cutscenes. A title card and a hill.

---

## 9. Maps (1.0 set)

1. **The Ditch** — tutorial slope, one post, one ditch.
2. **East Block** — classic two-hump SSL read.
3. **Frost Cloth** — cover that dies in one lug.
4. **Wedding Lawn** — tent in the middle. Hitting it is a lifestyle.
5. **Parking Napa** — flat, ugly, signage. Wind is a liar here more often.
6. **Cellar Roof** — short, brutal, fall-off into dark.

Six maps. If a seventh is not funnier than Wedding Lawn, don’t.

---

## 10. UI / HUD

Steal the *job* of an artillery HUD, not the face of ShellShock Live.

Always on:
- Angle number + power meter as a vertical stain, not a sci-fi bar
- Wind vane (object in world, not just a widget)
- Current lot as a little crate sticker
- Pips as bottle silhouettes that empty
- Turn name: “House Yard is throwing”

On aim:
- Dotted trajectory in wine-dark purple, short, not a full solve
- Opponent can talk over this

After shot:
- Camera follows fruit
- Impact freeze 3 frames
- Line + sting

Menus:
- Big type. Cream / oxblood / dirt.
- Lot select looks like a crate stencil, not an armory.

Pause: the song ducks, not dies.

---

## 11. Visual direction

Inexpensive, distinctive, screenshot-native.
- Side view, chunky silhouettes, no 3D cameras
- Dirt chalk hills, wire, juice not fire
- Carts readable at 64px
- Fruit reads at 8–16px; lugs are comic
- Stains accumulate so a long match looks like a crime
- No chibi. No “fun farm” vector mascots
- VFX: pulp, pips, a stupid little leaf that hangs in the air after a Cluster

Title lockup: **BUST A GRAPE** in condensed sports gothic, one smashed berry as the O or the A.

---

## 12. Progression & economy (keep thin)

Unlock lots by winning, not by gold sinks.
- First duel: Table, Pea, Cluster
- Rest arrive on wins / first time you get hit by them (learn by shame)

No hats at 1.0. If cosmetics happen later: crate stickers, vane flags, announcer alt packs. Never ammo that isn’t grapes.

---

## 13. Onboarding (five shots, not a lecture)

1. Fire Table at a dummy crate.  
2. Get dissed for the power.  
3. Fire Cluster. See the breakup.  
4. Eat a Verjus bounce.  
5. Real duel vs House Yard on The Ditch.

Text during this is announcer, not UI paragraphs.

---

## 14. Technical plan (still not building)

Recommended: Godot 4 web export **or** Phaser / Canvas. Godot wins if terrain bite + camera slam feel better faster. Phaser wins if you want a dead-simple web page.

Systems to keep isolated:
- `ballistics` — pure function
- `lots` — data
- `terrain` — columns
- `heat` — ripen rules
- `mouth` — trigger → line picker with memory
- `score` — stems in/out

Audio: layered stems with simple state (bed / hang / sting). Do not build a full interactive-music middleware novel.

Netcode: absent in 1.0. Hotseat is two pointers on one machine. AI is the same input pipe with a delay so it feels like a person aiming.

Determinism: seed the hill and the wind so a Daily can exist later without rewriting.

---

## 15. Content budgets (so this does not become SSL)

| Thing | 1.0 count | Hard cap until post |
|---|---|---|
| Lots | 12 | 16 |
| Maps | 6 | 8 |
| Houses | 4 | 6 |
| Announcer lines | ~120 | 200 |
| House barks / each | ~25 | 40 |
| Critic lines | 8 | 12 |
| Music beds | 7 | 9 |
| SFX one-shots | ~30 | 40 |

If someone wants “just one more weapon,” make them argue which knob the 13th lot expresses that 1–12 don’t.

---

## 16. Modes of funny that are banned

- Poop fruit
- Drunk-driving jokes
- Real brand counterfeiting as a mechanic
- Real appellations dragged as punchlines
- Slurs, identity cheap shots
- “Grape nuts” more than once in the entire bible
- Announcer talking over the brass sting

---

## 17. Legal / inspiration fence

Inspiration: artillery duels as a *genre* (Scorched Earth / Worms / ShellShock Live as loop ancestors).

Do not take:
- ShellShock names, tanks, weapon list, UI chrome, replay wrapper, shop, soundtrack
- Worms voice lines or character silhouettes
- Anyone’s map art

Name, hills, fruit, mouth, and record are original.

Pitch language that is safe: “turn-based artillery. the only ammo is grapes.”  
Unsafe: their title in *your* title.

---

## 18. Marketing, X, the clip

The game is also a clip factory.

Daily post formats:
1. 8s connect with Lug + vinegar sting + one line
2. A miss so bad the announcer line *is* the post
3. Wedding tent funeral
4. “Line of the day” as a still with the lockup

Account voice = the announcer. Not a dev log first.

Hero clip storyboard:
1. Title sting, brass
2. “You couldn’t bust a grape in a food fight.”
3. Pea miss
4. Opponent laugh
5. Lug
6. Hill becomes a bowl
7. Cork pop
8. Lockup

Store page first paragraph is the log line plus three bullets:
- Always grapes. Size, ripeness, pack, faults.
- An announcer who hates you personally.
- A brass record that slams when the fruit lands.

---

## 19. Accessibility

- Color not the only lot ID (stencil names)
- Screen-shake off
- Diss text always available if VO is on
- Aim assist toggle for angle (not a full auto-solve)
- Turn timer off in Practice and optional in Duel
- Cellar-mouth language toggle

---

## 20. Business

Ship as a small paid browser/itch game or a free web slice + paid desktop extras. Do not wrap this in live-ops crates. The pantry is the catalog.

If it pops: announcer pack and a new record, not a battle pass.

---

## 21. Phase plan (still not building)

**Phase 0 — paper (this doc)**  
Freeze knobs, 12 lots, diss triggers, 7-track list.

**Phase 1 — mute physics slice**  
Hill, two carts, Table/Pea/Cluster/Lug, no mouth, no music.

**Phase 2 — juice + heat**  
Stains, ripen, wind, Verjus bounce, Icebox bank.

**Phase 3 — mouth**  
Trigger table + 40 announcer lines + memory of one miss.

**Phase 4 — record**  
Title hook + duel bed + hang duck + cork pop.

**Phase 5 — houses & maps 1–4 + Food Fight**  
Then stop and play it until the 12 lots are actually different.

Do not staff cosmetics before Phase 4. The song and the mouth *are* the skin.

---

## 22. Open questions to freeze later (not now)

- Exact gravity / power curve so Lug is delightful not random
- Whether carts scoot in 1.0 or stand still
- Whether Daily hill ships day-one
- Human announcer vs well-directed synth VO vs text-first + a few recorded hero lines

Default answers if nobody decides:
- Stand still on first two maps
- No Daily at launch
- Text + a handful of recorded hero lines (north-star, kill, title) so the record can still be the star

---

## 23. Success test

The game works if a stranger can watch eight seconds with the sound on and say all three:

1. It’s that tank-hill game.
2. They’re only throwing grapes.
3. I want the announcer to say that to my friend.

If they only get (1), it is a clone.  
If they only get (2), it is a skin.  
If they only get (3), it is a soundboard.  
All three or keep planning.

---

## 24. LOCKED FOR ONESHOT — 2026-09-06

Status: **LOCKED. Build the slice.**

- Title: **Bust a Grape**
- Engine: static HTML + Canvas
- Slice: The Ditch. No scoot. 3 pips HP. Wind off. Lots: Table / Pea / Cluster / Lug
- Preview: short dotted arc. No auto-aim
- Mouth: text, PG-13
- Audio: synthesized SFX (thump, whistle, splat, cork)
- Play: player left vs dummy AI right
- Save / net: none

### Pips — locked pillar

Launch crew. Walking bunches of grapes with arms, legs, and a serious face. Solemn as a naval gun team. Hilarious because the ceremony is ornate and they are throwing family.

**Not Minions. Not rats.** No yellow, no goggles, no banana, no rodent bodies, no borrowed names. They are **Pips**: merlot / cab / green clusters, tiny boots, one stern brow.

Ceremony (1.1s pre-fire, then the grape leaves):
- Table: wipe, weigh, nod, clear the lip
- Pea: calipers, argument, fire
- Cluster: pile-on, count off, fire
- Lug: block-and-tackle; one Pip almost becomes ammo; fire
