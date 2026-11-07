# Dual-grid tilesets

Terrain edge artwork uses dual-grid tilesets: one square sheet of 4 x 4 cells holding the 15 corner combinations
(plus an empty cell) in SpriteCook's layout. `src/dual-grid.js` samples terrain at the corners of a lattice, builds each
tile's corner mask (1 top-left, 2 top-right, 4 bottom-left, 8 bottom-right) and draws sheet cell `FRAME_BY_MASK[mask]`,
counted left to right, top to bottom. `art/sprites/terrain/dual-grid/dual-grid-template.png` shows the layout
(white = terrain, magenta = empty) and is the template to hand to image generators.

## Layered areas

`src/layered-terrain.js` draws raised ground with two sheets on a 96-unit lattice (one tile per level):

- `assets/ground/dual/cliff-wall.png`: the earth wall, drawn in rows below each raised level (one row per level).
- `assets/ground/dual/plateau-top.png`: the plateau outline. Its shape cuts the area's own painted ground, and its edge
  pieces (rim and grass lip) are drawn over it.

Stairs and the waterfall curtain are still drawn in code over the tiles. Until both sheets load, the earlier polygon
floors and drawn faces are used.

Collision is unchanged: the height field in `src/elevation.js` follows the editor's polygons, while the tiles follow the
96-unit lattice, so a drawn edge can sit up to about 48 units from the true edge.

The sheets in `assets/ground/dual/` are painted 1024 x 1024 sheets (sources in `art/sprites/terrain/dual-grid/`).
`scripts/draw-dual-grid.py` draws the layout template and plain stand-ins. Replacements must keep the same layout;
texture packs can replace them too.
