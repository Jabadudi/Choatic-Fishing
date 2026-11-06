# Quarry worksite composition and artwork

The reference-based reconstruction uses a dominant long-boom stone crane on the work terrace, with a cutting bench, short cart rails, cut-block stacks and a small shaft yard. A second crane serves the lower floor. Placements and explicit collision radii live in `src/quarry-elevation.js`; visual scale does not set collision. Tests cover the full descent, floor circuit and crane/stair approaches.

Artwork selection and bounds live in `src/sprite-definitions.js`, with loading/anchoring in `src/sprites.js`. Existing drawn fallbacks remain. The scenery library also includes the reusable quarry gantry below; the reconstruction's focal crane uses the original crane painting at an authored scale. No character animations, rewards or save contracts change.

## Assets and preparation

Built-in image generation was used, with actual transparency. Approved source paintings are saved in `art/sprites/props/quarry/quarry-gantry.png` and `art/sprites/props/quarry/stonecutting-bench.png`. Runtime assets are `assets/props/atlas/quarry-gantry.webp` and `assets/props/atlas/stonecutting-bench.webp`. Run `python scripts/prepare-quarry-props.py` to crop transparent margins and fit each source inside 480 by 480 pixels, preserving alpha. The game fits them to 220 by 195 and 132 by 96 world-pixel visual bounds, independently of collision.

The editor companion PR adds thumbnails for the gantry, default crane, stonecutting bench and reused water bucket. The deployed game's land catalog exposes the new looks on Refresh from game. No bundled world snapshot or live Firebase data is overwritten.

## Generation prompts

Tool: built-in image_gen, transparent_background=true. Reference images were local game sprites, inspected before generation. They are style references, not edit targets.

### Quarry gantry

References: `assets/props/atlas/crane.webp`, `assets/props/atlas/mine.webp`.

Use case: stylized-concept. Asset type: one transparent-background environment prop sprite for a painted 2D top-down RPG. Reference images establish the exact existing game's warm timber, hand-painted pixel-art finish, small dark outlines, weathered mossy stone and elevated three-quarter overhead camera. Create ONE distinctive abandoned quarry lifting gantry: broad two-legged timber A-frame structure, stout crossbeam above, triangular braces, an iron pulley and short rope hanging down, a large manual winding drum fixed at one side, weathered timber feet on small stone pads, a few loose chipped blocks at the foot. Empty central opening, no mine opening behind it. The whole gantry including both feet visible, compact readable silhouette. Show front and top faces with the same near-orthographic camera as the reference, verticals vertical; no isometric diamond perspective. Warm worn ochre wood, grey metal, muted grey stone, sparse moss; daylight from upper left. This is one self-contained structure, no other structures, characters, ground tile, scene, text or labels. Fully transparent background and transparent space inside frame, tightly framed with a small transparent margin. Designed to read at 190 by 170 game pixels, avoid tiny decorative clutter.

### Stonecutting bench

References: `assets/props/atlas/cart.webp`, `assets/props/atlas/quarry-block.webp`.

Use case: stylized-concept. Asset type: one transparent environment prop sprite for the same painted 2D top-down RPG as the reference images. Create ONE abandoned stonecutting workbench, a unified compact working station. Stout weathered timber trestle bench with one half-cut rectangular grey limestone slab resting on top, a mallet and two iron chisels clearly laid on the slab; a simple low rack attached to the back holds one pickaxe and a spare hammer, small stone chips at its feet and one coil of old rope under the bench. Match the reference assets' hand-painted pixel-art edges, small dark outlines, muted warm ochre timber, mossy grey stone and top-left lighting. Elevated three-quarter overhead front camera, verticals vertical and horizontal bench front, no isometric diamond perspective. Entire bench, tools and feet visible, broad low silhouette designed to read at 125 by 90 game pixels. Actual transparent background including gaps under the bench; no floor tile or ground backdrop, no characters, no text, no labels, no extra structures. A single coherent workbench prop, not a sprite sheet.
