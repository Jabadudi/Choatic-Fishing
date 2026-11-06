# Terrain loading

Blended ground still samples the same two-pixel cells and applies the same
3.5-pixel coverage blur. Textures, collision and simulation are unchanged.

`TerrainCoverageCache` retains material coverage as horizontal runs independently
of image readiness. Late texture/prop loads still invalidate painted chunks, but
repainting no longer repeats the geometry sampling. The cache uses 64 bounded,
least-recently-used entries; explicit `clearTerrainCache()` clears both caches.
Material patterns are resolved once per kind per blend tile, masks are painted
in runs, and a single temporary composition layer is reused across materials.
Blend tiles fit the 516-pixel live chunk including its seam gutters, avoiding
four separate sets of padded masks for one chunk.

Validation includes exact old/new terrain pixel hashes for all 42 flat outdoor
areas, desktop/mobile screenshots, chunk seam comparisons and cache eviction
tests. Elevated quarry rendering uses its separate renderer and is unaffected.

To reproduce the browser comparison, extract the previous revision's
`src/wilds.js` to a local file, set `TERRAIN_BASELINE` to that path, and run
`node scripts/terrain-performance.cjs` with Playwright available. Set
`TERRAIN_SIZE=516` to measure full-size chunks (default: 320 by 240 viewport).
The report is saved under `screenshots/terrain-performance/report.json`.
Times measure terrain generation, not downloads or complete area transitions;
results depend on the device and browser load.
