# Source artwork

Generated concept art, references, cutscenes and sprite sheets for Volume 1. These are source files: nothing here is loaded by the game or copied into the build, which only ships `assets/`.

| Folder | Contents |
| --- | --- |
| `cutscenes/vol1/` | Story panels by chapter, numbered in the order they play (`ch01_01_…`). `_alts/` keeps earlier takes. |
| `characters/` | Reference sheets (front, side, face) for Mara, Emilia, Eli, Drayfus, Croshelda, Brume and Corvane. |
| `sprites/creatures/` | Rimejaw, Flitlynx and Moonfang: a single pose and an animation sheet each. The talking ocelot: a 4-direction walk sheet and a dissolve strip. |
| `sprites/creatures/fox/`, `boar/`, `elk/` | The first new animals from the Reedwater Delta spawn plan: a pose (the Index portrait), a column-layout walk set and action columns each. |
| `sprites/mobs/` | Nightwalker (shadow walker) enemy: reference sheet, pose and animation sheet. |
| `sprites/characters/` | Playable and NPC character sprites: Eli (walk and throw sheets, the style and walk layout every moving entity follows), 4-direction walk sheets for Mara, Emilia and Drayfus, Drayfus's beckon strip, and his older side-view action sheet. |
| `sprites/props/sheets/` | Six furniture and prop sheets (cabin and lodge, chief's house and shared pieces, village, training yard and blacksmith, inn and homes at 20 pieces each, and the training ground's tree, fences, gates, wall and dirt tiles, glowing sword and buckets at 10) on a green background. |
| `sprites/wishing-well/` | The Wishing Well summon: Eli's single and ten-stone throws, the well and the cavern under it, the five rarity fish, Eli's jump shot for Epic-or-better draws, and the stone, splash and sparkle effects. |
| `sprites/items/sheets/` | Five item icon sheets (tools and weapons, food and wares, materials and trophies, shards and quest items, guardian shards) on a green background. |
| `references/` | World and area maps used for the region layouts. |

Video cutscenes are not kept here: the Chapter 5 vision ships directly as `assets/story/eli-vision.mp4`, so the repository holds one copy.

## Using a sprite sheet in the game

The generated sheets are not on a regular grid yet, and most use a flat green (`#00FF00`) background. Drayfus's sheet already has transparency.

1. Remove the green background and crop each frame onto a consistent grid, aligning frames by the feet.
2. Save the result in `assets/` and add a definition in `src/sprite-definitions.js`, following [docs/ENTITY-SPRITES.md](../docs/ENTITY-SPRITES.md).

Sheet rows are idle, walk or fly, run where present, attack, then extras (howl, guard, jump, flinch, defeat).

## Eli

`scripts/prepare-eli-sprites.py` cuts Eli's walk sheet (4 directions × 8 frames) and throw sheet (6 frames) into `assets/story/eli-sheet.png`. See [docs/ENTITY-SPRITES.md](../docs/ENTITY-SPRITES.md) for the layout new entities should follow.

## Chapter 6 characters

`scripts/prepare-chapter6-sprites.py` cuts the walk sheets for Mara, Emilia, Drayfus and the talking ocelot into `assets/story/<name>-sheet.png`, in the same layout as Eli's. Drayfus's sheet adds his beckon strip as a fifth row (he waits with his arms folded and waves Eli over), and the ocelot's adds its dissolve strip (its first frame is how it sits). The ocelot's side rows have 7 frames. It also cuts Brume's sheets in `sprites/creatures/moonfang/` (the walk set, drawn in the column layout every new walk set uses, and single columns for his bow and lying down to sleep) into `assets/story/brume-sheet.png`. The Moonfang familiar walks on it, bows when summoned and sleeps when Eli stands still. His reference sheet is in `characters/brume/`. Corvane's sheets in `sprites/characters/corvane/` (a column-layout walk set with a ground line under each frame, which the script leaves out, and single columns for his shadows-part entrance and his block) become `assets/story/corvane-sheet.png`. He is staged for Chapter 14 and does not appear in the game yet.

## New animals

`scripts/prepare-animal-sprites.py` cuts the fox, boar and elk art in `sprites/creatures/` into `assets/<id>-sheet.png` (rows 0-3 walk, then one row per action column) and their poses into `assets/codex/<id>.png`. The fox runs away on its run row, the boar rushes Eli on its charge frames once hurt, and the elk grazes when idle and sweeps its antlers. Their Index entries, loot and familiars are in `src/codex.js`, `src/loot.js` and `src/familiars.js`; where they spawn is in `src/world-data.js`.

## Furniture and props

`scripts/prepare-prop-sprites.py OUT_DIR` cuts the six prop sheets into single sprites with the green removed. The pieces the game uses are resized to at most 320 px, saved as WebP in `assets/props/` and listed in `PROPS` in `src/sprite-definitions.js`. Scenes call `drawProp(ctx,id,{x,y,w,h})`, which fits the image inside the box with its bottom centre at `x,y`. Until an image loads, or if it is missing, the scene draws its original shapes, and collision never depends on the artwork. The training yard, blacksmith, inn and home pieces are cut and approved but not used yet.

## Item icons

`scripts/prepare-item-icons.py` cuts the five item sheets into square 128 px WebP icons in `assets/items/`. `ITEM_ART` in `src/item-icons.js` maps each item name to its icon; an item without one falls back to its text symbol. The familiar shard icons also draw the shards lying on the ground, and `reed-mark.webp` is the coin shown beside every price and purse.

## Wishing Well summon

`scripts/prepare-well-summon.py` cuts the sheets in `sprites/wishing-well/` into strips in `assets/well-summon/`: Eli lined up by his feet, each fish by its snout (frames 1-4 swim, frame 5 bites), and the two scenes resized to 960 by 540. It prints the cell sizes and anchors that `SUMMON_ART` in `src/well-summon.js` uses, so paste them in after cutting a new sheet. The village scene sits on top of the cavern, joined by the flooded well shaft, and the camera follows the stones from Eli's hand down into the cavern in one shot. Until the art loads the summon draws its original pixel shapes.
