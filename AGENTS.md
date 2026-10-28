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
- Passive, defensive and aggressive reaction policies are distinct. Attack AI must be implemented and tested before assigning a species a combat category. Deer use bounded pursuit and timed melee retaliation. Shadow walkers are aggressive: `src/monsters.js` runs their notice, chase, windup and leash, and Eli's fall and wake-up.
- Health, hit radius, habitat, movement and hunt rewards live in gameplay definitions, independently of sprites. Hunting XP must be granted only once per animal, with no PvP elimination rewards.
- Keep movement and damage in simulation updates. Renderers must not move animals or consume simulation randomness.

See `docs/ENTITY-BEHAVIORS.md` for current assignments and hunting rules.

# Saved progress

- `src/save-format.js` owns the versioned exploration save contract. Preserve save compatibility when adding quests, items, progression or world state; add a deliberate migration when changing the contract. Never derive save versions or database names from asset/build hashes.
- Restore into current class instances and reconnect hotbar references to backpack items. Never assign imported arbitrary objects onto gameplay prototypes. Validate before replacing stored progress.
- Save writes use one IndexedDB transaction for current/backup/manual data. Keep manual saves separate, retain three older autosaves, and test failed writes and duplicate rewards.

# Shared world

- `src/hub.js` owns multiplayer presence; `src/hub-backend.js` is the only file that knows Realtime Database paths, and `database.rules.json` must allow exactly what it writes.
- Share presence only (nickname, area, AFK, position). Story, animals, drops, quests and saves stay local until a referee server exists; never trust another player's data for rewards.
- Read other players' entries through `readPresence`/`readPosition`, which drop unknown areas and bad values. Show only nicknames, never Google names or emails.
- Run `scripts/hub-preview.cjs` against the database emulator after changing the hub or its rules.
