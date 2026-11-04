# Terrain elevation

Abandoned Quarry is the first playable elevated map. Its upper rim, work terrace, quarry floor and flooded pit use levels 0, -1, -2 and -3. The original area ID, landmark IDs and three exits remain intact. The old quarry land override is removed so it cannot mask the redesign.

## Model and gameplay

`src/elevation.js` owns pure height queries and validation. Each level is 96 world units. Terrace polygons use atlas coordinates; later polygons override earlier ones. Ramps and stairs interpolate between neighboring levels. `src/atlas-area.js` transforms them into world coordinates. `src/terrain-height.js` supplies area queries without importing simulation initialization.

Movement samples the entire attempted step, preventing dashes and animals from crossing cliffs. Combat, projectiles, nearby drops and NPC interactions check reachable height. Rendering projects ground positions by subtracting height, depth-sorts terrain strips with entities, and reverses that projection for pointer input. Drawing neither updates simulation nor consumes gameplay randomness.

Height is derived from the current area and logical x/y. Player save fields, versions and database names are unchanged. This first implementation supports one surface at each x/y, with continuous ramps and stairs; overlapping floors, jumping and falling are future work.

## Data

An optional `elevation` object contains `base`, `terraces` (`id`, `height`, `points`) and `ramps` (`id`, `from`, `to`, `width`, `fromHeight`, `toHeight`, `kind`). Heights are whole levels from -6 to 6. The exporter validates polygon geometry, ramp endpoints, adjacent levels and traversable grade. Missing or null elevation preserves flat maps. Exported land advertises `elevationVersion: 1` for compatible editor tools.

## Artwork

`assets/ground/quarry-wall.webp` is a new decorative cliff texture loaded through `src/ground-textures.js`; it does not define collision. Cached terrain strips retain drawn colors while textures load or fail. Entity artwork remains in the existing sprite system.

The cliff texture was generated with the built-in image generation tool, referencing the approved quarry concept: front-on seamless quarry cliff face, painted grey stone and ochre strata, moss and cracks, without props, text, floor or sky. The generated raster was resized to 384 pixels and encoded as WebP. Concept: `output/concepts/abandoned-quarry-elevation.png` in the parent workspace.

## Cliff edge refinement

`src/cliff-art.js` derives decorative boundary pieces directly from terrace polygons. Diagonal corners follow the authored outline rather than the coarse terrain grid. Irregular textured caps, sparse chipped overhangs, exposed strata, seams and narrow contact shadows provide the rock edge finish. Top material follows the adjoining ground, avoiding a grass-colored border on bare stone. Ramp openings stay clear and the original terrain mesh closes their side faces.

All geometry is deterministic and cached with the terrain strips. Textured and solid-color fallback rendering use the same silhouette. This is an artwork pass: terrace coordinates, height queries, collision, save data and gameplay remain unchanged.

## Quarry ground surface refinement

`src/quarry-ground-art.js` blends the existing rock and dirt artwork over broad, deterministic mineral and dust patches. Work terraces retain exposed stone while the lower floor uses muted earth rather than a uniform orange fill. Walking routes use a quieter packed surface with feathered shoulders. Small decorative talus fragments collect near terrace boundaries; cracks and sparse weeds break up the remaining floor. Decoration placement excludes water, decks, slopes and the route corridor. These fragments are ground artwork, not pickup entities or obstacles.

This treatment is scoped to Abandoned Quarry. It does not change terrain definitions, collision, interactions, rewards or saves. Ground detail is generated once with the terrain strips, and cached strips align to the same source pixel grid to prevent seams. Existing texture-free drawn fallbacks remain visible.

## Preview and checks

Run `npm start`, then open `/quarry-preview.html`. This development preview uses the real World and renderer, with keyboard movement and overview controls; it does not connect to Firebase or load/write progress. It is excluded from the production build.

Run `npm test` and `npm run build`. Elevation tests cover levels, both ramp routes, stairs, swept cliff collision, wildlife/combat/projectiles, exporter rejection and old save compatibility. The editor repository also contains `scripts/quarry-elevation-preview.mjs <game-checkout>` for headless movement, picking, screenshots and render purity verification.
