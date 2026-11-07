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

Walking follows the same grid. For these areas `compileElevation` samples the editor's terraces at the lattice corners
and gives each spot the highest level whose corners cover it with the tiles' own rule (bilinear weight over one half),
so the edge Eli stops at is the edge on screen. Inside the plateau outline only an 18-unit rim comes from the plateau
tiles; further in, the area's own ground shows. The world editor snaps terrace corners to the same grid and marks the
raised lattice points.

The sheets in `assets/ground/dual/` are painted 1024 x 1024 sheets (sources in `art/sprites/terrain/dual-grid/`).
`scripts/draw-dual-grid.py` draws the layout template and plain stand-ins. Replacements must keep the same layout;
texture packs can replace them too.

## Dual-grid ground

Areas listed in `DUAL_GROUND` (`src/dual-grid.js`; Glasswater for now) build their ground from layers on a 48-unit
lattice: the base sheet (`forest-floor.png`, whose fully filled cell repeats under everything), then `sand.png` (sand zones and the shore band), `dirt-path.png` (trails)
and `water.png` (water). Decks, props, reeds, rocks and scenery are drawn over the tiles as before. In these areas
the water's walking edge uses the same lattice rule as the water tiles (`atlas-area.js`), so the shoreline Eli stops at
is the drawn one. Until every sheet has loaded the blended ground painter is used. The four ground sheets are
stand-ins drawn by `scripts/draw-dual-grid.py` until the painted ones arrive.
