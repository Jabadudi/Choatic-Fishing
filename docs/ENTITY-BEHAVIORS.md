# Entity behavior and hunting

## Current assignments

| Entity | Type | Behavior | Interaction |
| --- | --- | --- | --- |
| Mara | NPC | Friendly, talk-only | Talk; cannot take damage |
| Rabbit (5) | Animal | Passive | Flees; huntable; drops loot |
| Deer (5) | Animal | Defensive | Wanders; retaliates after injury; huntable; drops loot; returns 75 s after a hunt |
| Turtle (1) | Animal | Passive | Swims and flees; huntable; drops loot |
| Eel (1) | Animal | Passive | Swims and flees; huntable; drops loot |

`src/entities.js` owns type names, behavior names and species stats. `reactionFor` maps passive disturbance to flight, defensive provocation to retaliation, and aggression to pursuit. Deer ignore player proximity. After taking damage, they pursue the attacker at 115 units/second for up to 6 seconds, with a 320-unit leash from home and attacker. Their melee attack deals 12 damage within 52 units after a 0.45-second windup, with a 1.4-second recovery. Moving out of reach or dashing avoids damage. Rabbits scare within 55 units instead of 125. Aggressive AI is reserved for future work.

## Hunting

- Existing fishing weapons, projectiles, bombs and specials target living animals in the active area. Mara stays outside the target list and rejects damage directly.
- Melee checks facing and reach. Projectiles use swept collision to hit small moving targets between simulation steps; they can travel over water.
- Rabbits use their existing hop controller; other animals use `src/wildlife.js`. Land animals respect navigable ground; turtles and eels stay in water.
- Injured animals show health and a behavior label. Passive animals flee; defensive deer retaliate only after injury. Death fades the body and grants species XP to the Hunting skill (and the main level) exactly once per life, separately from PvP eliminations. Injuring an animal grants nothing.
- Health, position and hunt counts persist within this journey across area travel. Species with `respawnSeconds` (deer) return to their home spot that long after a hunt, so the hunting skill keeps growing with use; other animals do not respawn until a new game.
- Loot tables live in `src/loot.js` and are referenced by species (`loot:'deer'`). Every huntable animal has one guaranteed drop plus rarer extras, each rolled on its own:

  | Animal | Always | Extra rolls |
  | --- | --- | --- |
  | Rabbit | Rabbit Meat | Rabbit Pelt 50%, Rabbit’s Foot 5% |
  | Deer | Deer Meat | Deer Hide 45%, Deer Antlers 20% |
  | Turtle | Turtle Meat | Turtle Shell 40%, River Pearl 5% |
  | Eel | Eel Fillet | Eel Skin 35%, Eel Oil 20% |
  | Shadow walker (planned) | Shadow Ichor | Rusted Axe Head 30%, Black Light Shard 5% |

  Luck scales only the uncertain rolls. Rolls use the animal's seeded generator; drops land as pickups beside the body. Water animals' drops land on the nearest walkable bank so they can be picked up.
- Four deer live on Reedwater Landing (three in the meadow for Chapter 1's supper, one by the Hollow Tree) and one on Windchime Path.
- `world.animals` combines rabbits and other wildlife. `world.hunting` records total hunts and counts per species. Changing areas clears projectiles and old visual effects.

The sprites, frame dimensions, scale and animation clips remain in `src/sprite-definitions.js`. They cannot determine hit radius, health, movement speed or XP.


## Chapter 3 village residents

Willowback’s six residents, the Rimejaw guardian and the rooftop Flitlynx are friendly NPCs declared through `NPC_TYPES` in `src/entities.js`. The creatures use examine interactions; villagers use talk. They are excluded from hunting targets and rewards. The Rimejaw’s territorial nature and freezing bite are lore at this stage; they do not assign an unimplemented combat category.

Mara’s Chapter 3 guide route uses collision-checked movement in simulation, waits for Eli and transfers between connected areas with the player’s crossing. Ambient resident patrols use saved simulation time. Sprite crops, green-matte removal, scales and roof draw order stay in the visual systems. Rendering cannot move NPCs or consume gameplay randomness.

## Skills and character level

`src/skills.js` declares use-based skills: Fishing (landed fish), Hunting (killing blow) and Cooking (finished meal). XP is only granted on success; failed or abandoned attempts teach nothing. Every skill point also feeds the main level through `Progression.train`. In exploration, each main level adds +10 max health and +1 Strength (damage), Dexterity (attack speed), Luck (rare loot) and Wisdom (skill XP). Arena matches keep a flat balance (`characterStats` is off). Press K for the Skills sheet.

## Creature index

`src/codex.js` is the in-game index (I, or the Index button): wildlife, monsters, bosses, guardians and spirits, and villagers and merchants. Each entry has a description, a minimap and a loot table, or wares for merchants. Animal stats, loot tables and minimap dots come from the gameplay data (`ANIMAL_TYPES`, `LOOT_TABLES`, spawn homes and NPC positions), so the index follows any change there. `AREA_BOUNDS` places each playable area on the Reedwater Delta atlas. Portraits and minimap images are built by `scripts/prepare-codex-portraits.py`. Merchant wares are planned barter offers; trading itself is not implemented yet.
