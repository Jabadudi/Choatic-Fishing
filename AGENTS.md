# Entity artwork standard

All future characters, animals, enemies, pickups and projectiles must keep artwork separate from gameplay.

- Add artwork definitions to `src/sprite-definitions.js` and files to `assets/`.
- Use `src/sprites.js` for asset loading, crops, animation playback, anchors and visual scaling. Do not hardcode sprite URLs or sheet coordinates in AI, combat, movement or loot code.
- Entity code owns health, movement, collision dimensions, interactions and drops. Sprite dimensions must never determine hitboxes, reach or rewards.
- Entity state may provide an animation name, time and facing to the renderer. Do not advance simulation or consume gameplay randomness while drawing.
- Keep a visible drawn fallback for new entities while artwork is loading, missing or incompatible, wherever one exists.
- An artwork-only change must preserve gameplay. Verify the relevant animation mapping and run the existing behaviour tests.

See `docs/ENTITY-SPRITES.md` for the replacement workflow and examples.

# Entity behavior standard

- Declare an entity type and gameplay behavior using `src/entities.js`. Keep friendly NPCs separate from huntable animals.
- Current rabbits, turtle and eel are passive; deer are defensive and retaliate only after injury. Mara is talk-only and excluded from damage targets.
- Passive, defensive and aggressive reaction policies are distinct. Attack AI must be implemented and tested before assigning a species a combat category. Deer use bounded pursuit and timed melee retaliation; aggressive AI remains unimplemented.
- Health, hit radius, habitat, movement and hunt rewards live in gameplay definitions, independently of sprites. Hunting XP must be granted only once per animal, with no PvP elimination rewards.
- Keep movement and damage in simulation updates. Renderers must not move animals or consume simulation randomness.

See `docs/ENTITY-BEHAVIORS.md` for current assignments and hunting rules.
