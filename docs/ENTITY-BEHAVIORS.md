# Entity behavior and hunting

## Current assignments

| Entity | Type | Behavior | Interaction |
| --- | --- | --- | --- |
| Mara | NPC | Friendly, talk-only | Talk; cannot take damage |
| Rabbit (5) | Animal | Passive | Flees; huntable |
| Deer (2) | Animal | Passive | Wanders and flees; huntable |
| Turtle (1) | Animal | Passive | Swims and flees; huntable |
| Eel (1) | Animal | Passive | Swims and flees; huntable |

`src/entities.js` owns type names, behavior names and species stats. `reactionFor` maps passive disturbance to flight, defensive provocation to retaliation, and aggression to pursuit. Only passive movement is implemented for the current animals. Defensive or aggressive species need their own attack/pursuit simulation when added.

## Hunting

- Existing fishing weapons, projectiles, bombs and specials target living animals in the active area. Mara stays outside the target list and rejects damage directly.
- Melee checks facing and reach. Projectiles use swept collision to hit small moving targets between simulation steps; they can travel over water.
- Rabbits use their existing hop controller; other animals use `src/wildlife.js`. Land animals respect navigable ground; turtles and eels stay in water.
- Injured animals show health and a behavior label. They flee instead of retaliating. Death fades the body and grants species hunting XP exactly once, separately from PvP eliminations.
- Health, position and hunt counts persist within this journey across area travel. Animals do not respawn until a new game/reload. No crafting loot or harvesting inventory exists yet.
- `world.animals` combines rabbits and other wildlife. `world.hunting` records total hunts and counts per species. Changing areas clears projectiles and old visual effects.

The sprites, frame dimensions, scale and animation clips remain in `src/sprite-definitions.js`. They cannot determine hit radius, health, movement speed or XP.
