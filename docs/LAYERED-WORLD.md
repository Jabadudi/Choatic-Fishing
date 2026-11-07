# Layered world

Atlas areas with an `elevation` field (other than the Abandoned Quarry, which keeps its hand-built art) are drawn by
`src/layered-terrain.js`: the area's normal painted ground is drawn once per level, shifted up by that level's height
and cut to that level's floor, with earth cliff faces under raised edges and stone stairs over the ramps. It is built
into the cached terrain chunks, so it costs nothing extra per frame. Water glints are drawn on the level they belong to,
and a waterfall on a raised edge pours down the cliff face.

Height, collision and reach still come only from `src/elevation.js`, the same as the quarry. Author terraces and stairs
in the world editor (Tools > Elevation & ramps) or in the area's `elevation` field in `src/delta-areas.js`.

Glasswater Basin is the first layered area: the forest north of the pool is one level up, the Middle Falls pour over the
north cliff, stone stairs bring the Upper Falls trail down to the shore, and the fishing hut sits below the rise.

## Art

`assets/ground/earth-cliff.webp` is a placeholder drawn by `scripts/draw-earth-cliff.py`. Replace it with the painted
tile from the project's layered-world terrain prompts at the same 512 x 512 size (texture packs can replace it too).
The grass lip along cliff tops and the waterfall curtain are drawn in code.

## Painted stairs and plank walks

Stairs in layered areas use `assets/ground/stone-steps.png` (a stack of six steps, repeated down the flight, as wide as
the stairs); the drawn treads give way once it has loaded, and the side walls stay. In dual-grid ground areas the
walkways are laid from `plank-walk.webp` with `plank-walk-start` / `plank-walk-end` post pairs at free ends. Sources:
`art/sprites/terrain/structures/`. The plank-deck and stone-stairs dual-grid sheets are kept in
`art/sprites/terrain/dual-grid/` for wide decks and stairways later.
