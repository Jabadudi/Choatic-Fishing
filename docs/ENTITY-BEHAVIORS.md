# Entity behavior and hunting

## Current assignments

| Entity | Type | Behavior | Interaction |
| --- | --- | --- | --- |
| Mara | NPC | Friendly, talk-only | Talk; cannot take damage |
| Rabbit (5) | Animal | Passive | Flees; huntable; drops loot; returns 45 s after a hunt |
| Deer (5) | Animal | Defensive | Wanders; retaliates after injury; huntable; drops loot; returns 75 s after a hunt |
| Turtle (1) | Animal | Passive | Swims and flees; huntable; drops loot; returns 90 s after a hunt |
| Eel (1) | Animal | Passive | Swims and flees; huntable; drops loot; returns 60 s after a hunt |
| Shadow walker | Monster (animal entity) | Aggressive | Roams, notices Eli, chases and swings an axe; drops loot; spawned by area |

`src/entities.js` owns type names, behavior names and species stats. `reactionFor` maps passive disturbance to flight, defensive provocation to retaliation, and aggression to pursuit. Deer ignore player proximity. After taking damage, they pursue the attacker at 115 units/second for up to 6 seconds, with a 320-unit leash from home and attacker. Their melee attack deals 12 damage within 52 units after a 0.45-second windup, with a 1.4-second recovery. Moving out of reach or dashing avoids damage. Rabbits scare within 55 units instead of 125.

### Shadow walkers (aggressive)

`src/monsters.js` runs them; their numbers live in `ANIMAL_TYPES['shadow-walker']` and the art (`nightwalker` sheet) only reads state.

- **Roam:** wander near their spawn slot like deer.
- **Notice:** when Eli comes within 240 units, or hurts one from any range, it stops for 0.6 s with a yellow **!** over its head ("A Shadow Walker has seen you!"), then gives chase.
- **Chase:** 122 units/second, slower than Eli's 195, so he can always run. It gives up when he is more than 460 units away or it is 620 units from home, walks home, and heals to full there. Hitting it on the way home turns it around unless it is near the edge of its range.
- **Attack:** within 58 units it raises the axe for 0.55 s (the `raise` clip), then swings (`swing`) for 16 damage and a shove. The blow only lands if Eli is still in reach and not dashing. 0.4 s recovery, 1.5 s between swings.
- **Health 80, 40 Hunting XP.** The kill message says *defeated* rather than *hunted*.

### Eli's fall and wake-up

When Eli's health reaches 0 in exploration he collapses: the view darkens for 3 s ("Eli collapses…") and monsters lose interest. He then wakes at the current area's arrival point with full health and everything he carried, and monsters leave him alone for 4 s. A save made while he is down wakes him on load. Arena matches keep their own elimination rules.

## Hunting

- Existing fishing weapons, projectiles, bombs and specials target living animals in the active area. Mara stays outside the target list and rejects damage directly.
- Melee checks facing and reach. Projectiles use swept collision to hit small moving targets between simulation steps; they can travel over water.
- Rabbits use their existing hop controller; other animals use `src/wildlife.js`. Land animals respect navigable ground; turtles and eels stay in water.
- Injured animals show health and a behavior label. Passive animals flee; defensive deer retaliate only after injury. Death fades the body and grants species XP to the Hunting skill (and the main level) exactly once per life, separately from PvP eliminations. Injuring an animal grants nothing.
- Health, position and hunt counts persist within this journey across area travel.
- Spawning is per area, not per animal. `src/spawn-tables.js` gives each outdoor area its spawn slots (land or water), a population cap, a spawn chance per empty slot, a respawn clock and a weighted table per habitat; `src/spawns.js` runs it with one seeded generator kept in the save.
  - Walking into an area after at least 30 s away rolls every empty slot once. Interiors count as their outside area, so the cabin door is not a new visit.
  - The area's respawn clock (60 to 90 s) rolls every empty slot again while Eli is there. Living creatures always stay; a roll only fills up to the cap, and never within 350 px of Eli.
  - Shadow walkers take their table share: rare on the landing and Windchime Path, uncommon at the crossroads, common in Shellback Marsh. In the story they only spawn once the Chapter 1 storm has shown one; until then their share goes to the animals.
  - During Chapter 1's supper hunt the three meadow deer slots are story slots: always deer, never shiny, refilled on every landing roll.
  - About 1 spawn in 100 is a Shiny: gold tint, glow and sparkles, 50% more health, double Hunting XP and four times every uncertain drop chance (on top of Luck, capped at 100%). Walking into an area with one chimes; the first close look and the hunt are counted in the Index, and hunting one turns a familiar of that kind gold.
- A journey starts with the original hand-placed layout in Reedwater Landing and Windchime Path; the spawner keeps the hunting skill and familiar shards growing with use.
- Loot tables live in `src/loot.js` and are referenced by species (`loot:'deer'`). Every huntable animal has one guaranteed drop plus rarer extras, each rolled on its own:

  | Animal | Always | Extra rolls |
  | --- | --- | --- |
  | Rabbit | Rabbit Meat | Rabbit Pelt 50%, Rabbit’s Foot artifact 4%, Rabbit Familiar Shard 8% |
  | Deer | Deer Meat | Deer Hide 45%, Deer Antlers 20%, Stag Crown artifact 5%, Deer Familiar Shard 10% |
  | Turtle | Turtle Meat | Turtle Shell 40%, River Pearl 5%, Mossback Scute artifact 5%, Turtle Familiar Shard 10% |
  | Eel | Eel Fillet | Eel Skin 35%, Eel Oil 20%, Lodestone artifact 5%, Eel Familiar Shard 8% |
  | Shadow walker | Shadow Ichor | Rusted Axe Head 30%, Black Light Shard 5%, Heart of Black Light artifact 7%, Shadow Walker Familiar Shard 6% |

  Luck scales only the uncertain rolls. Rolls use the animal's seeded generator; drops land as pickups beside the body. Water animals' drops land on the nearest walkable bank so they can be picked up.
- Four deer live on Reedwater Landing (three in the meadow for Chapter 1's supper, one by the Hollow Tree) and one on Windchime Path.
- `world.animals` combines rabbits and other wildlife. `world.hunting` records total hunts and counts per species. Changing areas clears projectiles and old visual effects.

The sprites, frame dimensions, scale and animation clips remain in `src/sprite-definitions.js`. They cannot determine hit radius, health, movement speed or XP.


## Chapter 3 village residents

Willowback’s six residents, the Rimejaw guardian and the rooftop Flitlynx are friendly NPCs declared through `NPC_TYPES` in `src/entities.js`. The creatures use examine interactions; villagers use talk. They are excluded from hunting targets and rewards. The Rimejaw’s territorial nature and freezing bite are lore at this stage; they do not assign an unimplemented combat category.

Mara’s Chapter 3 guide route uses collision-checked movement in simulation, waits for Eli and transfers between connected areas with the player’s crossing. Ambient resident patrols use saved simulation time. Sprite crops, green-matte removal, scales and roof draw order stay in the visual systems. Rendering cannot move NPCs or consume gameplay randomness.

## Skills and character level

`src/skills.js` declares use-based skills: Fishing (landed fish), Hunting (killing blow) and Cooking (finished meal). XP is only granted on success; failed or abandoned attempts teach nothing. Every skill point also feeds the main level through `Progression.train`. In exploration, each main level adds +10 max health and +1 Strength (damage), Dexterity (attack speed), Luck (rare loot) and Wisdom (skill XP). Arena matches keep a flat balance (`characterStats` is off). Press K for the Skills sheet.

## Artifacts

`src/artifacts.js` declares artifacts: drop-only backpack items that work while they sit in one of three artifact slots (the Artifacts tab of the backpack). Each creature carries one artifact. When its roll succeeds, a second roll picks the rarity: Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 1%. Luck raises both rolls. Copies stack by rarity, and three copies of one rarity combine into one copy a rarity higher. Only one copy of each artifact can be slotted.

| Artifact | Dropped by | Common → Legendary |
| --- | --- | --- |
| Lodestone | Eels | Pulls drops into the backpack from 2, 3, 4, 5, 6 steps |
| Stag Crown | Deer | Arrows hit 5%, 10%, 15%, 22%, 30% harder |
| Rabbit’s Foot | Rabbits | Rare drops 5%, 10%, 15%, 22%, 30% more likely |
| Mossback Scute | Turtles | 4%, 8%, 12%, 16%, 20% less damage taken |
| Heart of Black Light | Shadow walkers | Each kill restores 1, 2, 3, 4, 6 health |

Items Eli throws out wait four seconds before a Lodestone pulls them back. Rabbit’s Feet in saves from before artifacts become Common artifacts.

## Familiars

`src/familiars.js` turns shards into companions. Every creature with a loot table drops its own familiar shard (chances in `SHARD_CHANCES`, scaled by Luck like other rare drops). Picking one up adds it to that creature's count in `world.familiars` instead of the backpack. At 5 shards the Creature Index offers **Combine**, which bonds the familiar and summons it; later shards keep counting. Each familiar has three passives:

| Familiar | 5 shards | 25 shards (replaces the first) | 100 shards (added) |
| --- | --- | --- | --- |
| Rabbit | Lucky Paw: +2 Luck | Lucky Paw II: +5 Luck | Warren Dash: +12% movement speed |
| Deer | Antler Might: +2 Strength | Antler Might II: +5 Strength | Herd Sense: +25% Hunting XP |
| Turtle | Shell Ward: +15 max HP | Shell Ward II: +40 max HP | Ancient Shell: 15% less damage taken |
| Eel | Slippery Grip: +2 Dexterity | Slippery Grip II: +5 Dexterity | Current Sense: +25% Fishing XP |
| Shadow walker | Whispers in the Dark: +2 Wisdom | Whispers in the Dark II: +5 Wisdom | Borrowed Power: +2 to every attribute |

One familiar follows at a time; summoning another sends the current one back, and its bonus goes with it. The bonus lives on `Progression.familiar` and feeds the existing stat getters (attributes, max HP, damage reduction, speed, skill XP), so the Skills sheet shows it. The follower (`world.companion`) floats after the player, ignores terrain, and reappears beside him after area travel; `src/familiar-art.js` draws it from the species' own sprite over a spirit glow. Shards, bonds and the active familiar are saved; saves without them start with none.

## Creature index

`src/codex.js` is the in-game index (I, or the Index button): wildlife, monsters, bosses, guardians and spirits, and villagers and merchants. Each entry has a description, a minimap and a loot table, or wares for merchants. Animal stats, loot tables and minimap dots come from the gameplay data (`ANIMAL_TYPES`, `LOOT_TABLES`, spawn homes and NPC positions), so the index follows any change there. `AREA_BOUNDS` places each playable area on the Reedwater Delta atlas. Portraits and minimap images are built by `scripts/prepare-codex-portraits.py`. Merchant wares are planned barter offers; trading itself is not implemented yet.

Entries start hidden as question marks. `src/codex-discovery.js` reveals an entry when Eli comes within 360 units of the animal or character in the same area, when he hunts that species, or when a story scene introduces it (`STORY_REVEALS`: the storm reveals the shadow walker and the Moonfang, the village tour the Rimejaw and Flitlynx, Mara's lesson Croshelda, the chief's house Emilia, and the journey talk the elk spirit and Drayfus). Encounters are saved as `codex` in the journey save. Story reveals and hunt counts are read from saved progress, so saves from before this change catch up on their own.
