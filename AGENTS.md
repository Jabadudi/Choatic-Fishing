# Entity artwork standard

All future characters, animals, enemies, pickups and projectiles must keep artwork separate from gameplay.

- Add artwork definitions to `src/sprite-definitions.js` and files to `assets/`.
- Use `src/sprites.js` for asset loading, crops, animation playback, anchors and visual scaling. Do not hardcode sprite URLs or sheet coordinates in AI, combat, movement or loot code.
- Entity code owns health, movement, collision dimensions, interactions and drops. Sprite dimensions must never determine hitboxes, reach or rewards.
- Entity state may provide an animation name, time and facing to the renderer. Do not advance simulation or consume gameplay randomness while drawing.
- Keep a visible drawn fallback for new entities while artwork is loading, missing or incompatible, wherever one exists.
- An artwork-only change must preserve gameplay. Verify the relevant animation mapping and run the existing behaviour tests.

See `docs/ENTITY-SPRITES.md` for the replacement workflow and examples.
