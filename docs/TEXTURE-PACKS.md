# Texture packs: foundation v1

Settings > UI size > Texture pack imports a .json pack and switches artwork immediately. Use default artwork restores the shipped look. Packs persist in their own IndexedDB database, separate from exploration saves. The current installed pack replaces the previous pack; a library of multiple installed packs is not implemented yet.

## Author a pack

Create a folder whose paths mirror the game's assets folder. Include only replacements, e.g. ground/forest-floor.webp, ground/river-water.webp, ground/quarry-cliff-v2.webp, props/atlas/quarry-gantry.webp. Run:

    node scripts/build-texture-pack.mjs my-art my-pack.json "My art pack"

Install the resulting JSON in Settings. Missing entries use default assets. Use the original sprite-sheet dimensions, frame layout and transparent padding in v1; arbitrary replacement animation layouts are not yet supported. PNG, JPEG and WebP are accepted. SVG, script, external URLs and traversal paths are rejected. Images decode before installation; storage must succeed before switching. Maximum 512 images, 64 MB JSON and 8192 pixels per edge, with 32 megapixels per image.

Coverage is limited to an allowlist of entity appearance, terrain, structures and furniture. Combat effects, projectiles, dedicated weapon attack sheets, pickups, portraits, interface art and other unlisted assets cannot be replaced. Animation metadata and gameplay fields are rejected. Replacement dimensions must match the original images; frame order, timing, anchors and scale remain defined by the game. Entity appearance replacements must redraw the existing poses in their original cells. Procedurally drawn cliffs/edges, effects, UI CSS, title artwork and other direct image loaders do not all have replacement hooks yet. This is an asset replacement foundation, not a full theme engine. Invalid sprite crops use existing drawn fallbacks.

## Matching the visual reference

Use a consistent pixel scale; a controlled grass/earth/stone palette; irregular grass-to-dirt edge tiles; varied vertical rock faces; matching cliff caps/corners; and animated water, waterfall and foam strips. Ground, vertical faces, actors, bridge decks and overhead foliage need separate drawing layers. Artwork should have clean transparent edges, with no baked world collision or height information.

## Elevation and bridges

Current gameplay uses terraces and ramps and a single heightAt(x,y). It is unchanged by texture packs. It cannot represent two traversable floors at the same x/y yet. Over/under bridges require an additional gameplay surface graph: named ground/deck surfaces, actor surface IDs, explicit stair/ramp connections, surface-specific collision and combat, and surface-aware draw ordering and picking. Save migration must preserve the current actor surface. Do not fake this with texture alpha or change the single-height resolver to always select the highest surface: that would prevent passage underneath.

A future elevation milestone should prove one crossing with an upper bridge and lower route, attacks isolated by surface, correct occlusion, and save/load on either route before adding dungeon geometry. This work is distinct from installing artwork packs.
