# Elevated quarry reconstruction

The Abandoned Quarry layout is authored against the approved concept in `art/reference/abandoned-quarry-approved.png`. `src/quarry-elevation.js` converts reference design points into logical atlas coordinates at the appropriate floor height. This keeps the back wall, crane terrace, western switchbacks, east stair flight, flooded cut, pier and wooded perimeter deliberately composed.

## Real geometry

The four main surfaces are rim 0, work terrace -2, quarry floor -4 and water cut -5. Each elevation unit remains 96 world units. The major cliff drops are 192 units, with intermediate -1/-3 landing surfaces joining the cart descent. Four one-level cart ramps and curved level turns form the western route. A two-level stair flight joins terrace and floor; its actual grade must pass the same swept traversal checks as other slopes.

The pier is a -4 terrace over the -5 cut, with a matching explicit deck footprint. It connects continuously to the dry floor and is walkable. This engine provides one surface per x/y; the pier does not introduce an underwater passage. The river crossing uses a timber deck.

Original 2400 x 1880 map bounds and area/landmark IDs remain intact. All three external connections remain. Save schema, versions and database names are unchanged. Height is derived from position. Existing save restoration moves positions blocked by terrain edits to the area's valid spawn; regression tests cover that fallback.

## Rendering and materials

`src/elevation.js` owns pure height queries and validation; `src/atlas-area.js` compiles atlas geometry; `src/terrain-height.js` supplies simulation queries. Swept movement prevents cliff crossing, and combat, projectiles, drops and interactions use reachable height. The renderer subtracts height from y, draws terrain before scenery and actors, keeps all actors above ledges and draws the local explorer last, and reverses projection for pointer picking.

`src/elevation-art.js` caches aligned terrain strips. `src/cliff-art.js` follows authored polygon outlines with irregular caps, rock ledges, moss and contact shadows. `src/quarry-ground-art.js` blends broad bedrock plates with dust, dirt and sparse debris, and draws submerged green stone shelves. `src/ramp-art.js` renders retaining masonry, stair treads/risers, timber pier boards/piles and the short cart rails.

Runtime materials are `assets/ground/quarry-bedrock-v2.webp` and `assets/ground/quarry-cliff-v2.webp`. They were generated using the built-in image generation tool against the approved concept, then resized to 512 x 512 WebP; the source paintings remain in `art/sprites/terrain/quarry/`. See [Reconstruction material prompts](QUARRY-RECONSTRUCTION-ART.md). Earlier artwork remains available without being overwritten. Entity assets continue through the sprite registry/loader, independently of collision.

## Light and motion

`src/quarry-light.js` supplies upper-left daylight shadows, depth/cliff water tint, sparse ripples, anchored swaying weeds and capped worksite dust. Motion depends only on world coordinates and elapsed time. Drawing does not consume randomness, step simulation or change progress. Still map renders freeze motion. Other areas retain their original atmosphere.

## Preview and checks

Run npm start, then open `/quarry-preview.html`. The preview opens in overview; **Walk view** follows Eli, and **Reference** opens the approved illustration. It uses the real World and renderer, with no Firebase connection or save writes. The preview and reference/source art are excluded from the production build.

Run npm test and npm run build. Tests cover every ramp both ways, the full descent/floor circuit/crane approach, the two-level stairs, pier traversal, cliff collision, combat, canonical exports and save compatibility. The editor repository's `scripts/quarry-elevation-preview.mjs <game-checkout>` checks live keyboard movement, pointer picking and rendering purity while capturing overview/walking views.


Quarry visibility and loading: pooled draw slots clear old entity references before reuse. Scenery sorts by projected feet. Terrain geometry is cached independently from image readiness; only the visible projected row range is built and raster memory retains at most 64 rows or the current overview. The renderer supplies the actual camera viewport separately from the expanded actor culling bounds. scripts/quarry-visibility.cjs checks player visibility, stable scenery when actors enter/leave, lazy row generation and zero geometry resampling on texture repaint in real Chrome.
