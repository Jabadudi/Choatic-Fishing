# Source artwork

Generated concept art, references, cutscenes and sprite sheets for Volume 1. These are source files: nothing here is loaded by the game or copied into the build, which only ships `assets/`.

| Folder | Contents |
| --- | --- |
| `cutscenes/vol1/` | Story panels by chapter, numbered in the order they play (`ch01_01_…`). `_alts/` keeps earlier takes. |
| `characters/` | Reference sheets (front, side, face) for Mara, Emilia, Eli, Drayfus and Croshelda. |
| `sprites/creatures/` | Rimejaw, Flitlynx and Moonfang: a single pose and an animation sheet each. |
| `sprites/mobs/` | Nightwalker (shadow walker) enemy: reference sheet, pose and animation sheet. |
| `sprites/characters/` | Playable and NPC character sprites: Eli (walk and throw sheets, the style and walk layout every moving entity follows) and Drayfus. |
| `sprites/props/sheets/` | Five furniture and prop sheets (cabin and lodge, chief's house and shared pieces, village, training yard and blacksmith, inn and homes), 20 pieces each on a green background. |
| `sprites/items/sheets/` | Four item icon sheets (tools and weapons, food and wares, materials and trophies, shards and quest items) on a green background. |
| `references/` | World and area maps used for the region layouts. |

Video cutscenes are not kept here: the Chapter 5 vision ships directly as `assets/story/eli-vision.mp4`, so the repository holds one copy.

## Using a sprite sheet in the game

The generated sheets are not on a regular grid yet, and most use a flat green (`#00FF00`) background. Drayfus's sheet already has transparency.

1. Remove the green background and crop each frame onto a consistent grid, aligning frames by the feet.
2. Save the result in `assets/` and add a definition in `src/sprite-definitions.js`, following [docs/ENTITY-SPRITES.md](../docs/ENTITY-SPRITES.md).

Sheet rows are idle, walk or fly, run where present, attack, then extras (howl, guard, jump, flinch, defeat).

## Eli

`scripts/prepare-eli-sprites.py` cuts Eli's walk sheet (4 directions × 8 frames) and throw sheet (6 frames) into `assets/story/eli-sheet.png`. See [docs/ENTITY-SPRITES.md](../docs/ENTITY-SPRITES.md) for the layout new entities should follow.

## Furniture and props

`scripts/prepare-prop-sprites.py OUT_DIR` cuts the five prop sheets into single sprites with the green removed. The pieces the game uses are resized to at most 320 px, saved as WebP in `assets/props/` and listed in `PROPS` in `src/sprite-definitions.js`. Scenes call `drawProp(ctx,id,{x,y,w,h})`, which fits the image inside the box with its bottom centre at `x,y`. Until an image loads, or if it is missing, the scene draws its original shapes, and collision never depends on the artwork. The training yard, blacksmith, inn and home pieces are cut and approved but not used yet.

## Item icons

`scripts/prepare-item-icons.py` cuts the four item sheets into square 128 px WebP icons in `assets/items/`. `ITEM_ART` in `src/item-icons.js` maps each item name to its icon; an item without one falls back to its text symbol. The familiar shard icons also draw the shards lying on the ground, and `reed-mark.webp` is the coin shown beside every price and purse.
