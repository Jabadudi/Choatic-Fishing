# Village and harbor artwork

The editor exposes existing painted village furniture and scenery through `ATLAS_PROP_ART` in `src/sprite-definitions.js`. The mapping owns registered asset IDs and visual dimensions. `PROP_SOLID` remains the independent collision contract. Existing area data and saves are unchanged.

New opt-in choices `boat/moored-rowboat` and `lantern/harbor-lantern` animate only drawing. The rowboat moves visually by at most 2.2 world pixels; the lantern changes glow opacity. Both use the existing drawn fallback when their painting is unavailable. Rendering never consumes gameplay randomness or changes entity state.

Boardwalks use `assets/ground/harbor-deck.webp`. All visible run outlines are drawn before their surfaces so intersections do not retain dark end seams. The repeating pattern shares world coordinates across runs. Walkable widths, endpoints and collision remain in atlas-area.js. The ground material `decking` paints dry land; it does not create a deck over water.

Four new ground textures are 384px WebP tiles. The boatwright workshop is an alpha-preserving WebP sprite, displayed in a 150 × 140 visual box with the same collision radius as other huts. None of these changes automatically place new props in the world.

## Generation

Generated with the built-in imagegen tool, then resized and converted for the existing asset pipeline. Prompts:

- Moss carpet: single seamless repeating game ground texture, square edge-to-edge top-down orthographic soft moss carpet; muted olive and sage cushions, tiny earth gaps and sparse stones; hand-painted naturalistic storybook 2D adventure art; uniform diffuse light, no focal point, objects, border or text; opposite edges tile.
- Leaf litter: seamless square ground material, overhead small fallen oak and birch leaves in muted ochre, sienna and tawny brown, dark earth and tiny twigs; subdued painterly river delta palette; uniform detail and lighting; no focal point, large objects, text or borders.
- River pebbles: square seamless overhead ground material of dry smooth small rounded stones in warm grey, slate, beige and moss grey with sandy gaps; fine painterly detail, diffuse lighting; no water, large boulders, focal point, border or text.
- Harbor deck: seamless square weathered wooden harbor decking, overhead closely fitted long horizontal warm grey-brown oak planks, staggered ends, subtle grain and nail heads, pale worn edges and teal-grey weathering; hand-painted storybook art; no platform outline, railings, water, objects, text or perspective.
- Boatwright workshop: isolated timber fishing-village workshop, blue-grey shingle roof, broad open front doorway, bundled planks at one side and rope pulley over the doorway; elevated three-quarter top-down game camera, muted brown and sage storybook painting, light from upper left, centered complete silhouette; transparent background, no ground plane, people, lettering, watermark or outer shadow.

## Validation

`tests/harbor-assets.test.js` covers shipment round trips, registered artwork, collision independence, animation state isolation, deterministic drawing and missing-art fallbacks. The editor's `scripts/harbor-assets-preview.mjs` renders the real game drawing functions, checks a filled boardwalk junction and writes a village asset contact sheet.
