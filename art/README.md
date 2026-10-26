# Source artwork

Generated concept art, references, cutscenes and sprite sheets for Volume 1. These are source files: nothing here is loaded by the game or copied into the build, which only ships `assets/`.

| Folder | Contents |
| --- | --- |
| `cutscenes/vol1/` | Story panels by chapter, numbered in the order they play (`ch01_01_…`). `_alts/` keeps earlier takes. |
| `characters/` | Reference sheets (front, side, face) for Mara, Emilia, Eli and Drayfus. |
| `sprites/creatures/` | Rimejaw, Flitlynx and Moonfang: a single pose and an animation sheet each. |
| `sprites/mobs/` | Nightwalker (shadow walker) enemy: reference sheet, pose and animation sheet. |
| `sprites/characters/` | Playable and NPC character sprites: Drayfus so far. |
| `references/` | World and area maps used for the region layouts. |

## Using a sprite sheet in the game

The generated sheets are not on a regular grid yet, and most use a flat green (`#00FF00`) background. Drayfus's sheet already has transparency.

1. Remove the green background and crop each frame onto a consistent grid, aligning frames by the feet.
2. Save the result in `assets/` and add a definition in `src/sprite-definitions.js`, following [docs/ENTITY-SPRITES.md](../docs/ENTITY-SPRITES.md).

Sheet rows are idle, walk or fly, run where present, attack, then extras (howl, guard, jump, flinch, defeat).
