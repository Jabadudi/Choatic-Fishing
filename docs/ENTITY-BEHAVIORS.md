# Entity behavior and hunting

## Current assignments

| Entity | Type | Behavior | Interaction |
| --- | --- | --- | --- |
| Mara | NPC | Friendly, talk-only | Talk; cannot take damage |
| Rabbit (5) | Animal | Passive | Flees; huntable |
| Deer (2) | Animal | Defensive | Wanders; retaliates after injury; huntable |
| Turtle (1) | Animal | Passive | Swims and flees; huntable |
| Eel (1) | Animal | Passive | Swims and flees; huntable |

`src/entities.js` owns type names, behavior names and species stats. `reactionFor` maps passive disturbance to flight, defensive provocation to retaliation, and aggression to pursuit. Deer ignore player proximity. After taking damage, they pursue the attacker at 115 units/second for up to 6 seconds, with a 320-unit leash from home and attacker. Their melee attack deals 12 damage within 52 units after a 0.45-second windup, with a 1.4-second recovery. Moving out of reach or dashing avoids damage. Rabbits scare within 55 units instead of 125. Aggressive AI is reserved for future work.

## Hunting

- Existing fishing weapons, projectiles, bombs and specials target living animals in the active area. Mara stays outside the target list and rejects damage directly.
- Melee checks facing and reach. Projectiles use swept collision to hit small moving targets between simulation steps; they can travel over water.
- Rabbits use their existing hop controller; other animals use `src/wildlife.js`. Land animals respect navigable ground; turtles and eels stay in water.
- Injured animals show health and a behavior label. Passive animals flee; defensive deer retaliate only after injury. Death fades the body and grants species hunting XP exactly once, separately from PvP eliminations.
- Health, position and hunt counts persist within this journey across area travel. Animals do not respawn until a new game/reload. No crafting loot or harvesting inventory exists yet.
- `world.animals` combines rabbits and other wildlife. `world.hunting` records total hunts and counts per species. Changing areas clears projectiles and old visual effects.

The sprites, frame dimensions, scale and animation clips remain in `src/sprite-definitions.js`. They cannot determine hit radius, health, movement speed or XP.


## Chapter 3 village residents

Willowback’s six residents, the Rimejaw guardian and the rooftop Flitlynx are friendly NPCs declared through `NPC_TYPES` in `src/entities.js`. The creatures use examine interactions; villagers use talk. They are excluded from hunting targets and rewards. The Rimejaw’s territorial nature and freezing bite are lore at this stage; they do not assign an unimplemented combat category.

Mara’s Chapter 3 guide route uses collision-checked movement in simulation, waits for Eli and transfers between connected areas with the player’s crossing. Ambient resident patrols use saved simulation time. Sprite crops, green-matte removal, scales and roof draw order stay in the visual systems. Rendering cannot move NPCs or consume gameplay randomness.
