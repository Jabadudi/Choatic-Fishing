# The Wilds — Reedwater Landing

The game covers the whole Reedwater Delta regional atlas (`assets/codex/reedwater-delta-map.jpg`). Every numbered area and sub-area on it is playable. The hand-built areas are below; the rest are described in [Atlas areas](#atlas-areas).

## Playable areas

- **Reedwater Landing** (17, 2,800 × 2,200 world units, built from the atlas in `src/delta-areas.js`): a
  turquoise lagoon in the west with islets and drowned pillars, the old road's causeway west through the
  shallows to the Drowned Road, the trail north past the chime posts to Windchime Path, the warm spring and
  the hollow tree in the east woods, and one long beach in the south that runs on to the pier at Arrival Bay
  (22), where every new journey starts. Grandpa's cabin stands at the top of the beach. The Landing also has
  defensive deer and passive turtle and eel entities with persistent health and movement.
  Five rabbits use the supplied `assets/bunny-sheet.png`: they rest, graze, hop,
  and flee when approached. Their movement respects water, trees, rocks and area
  boundaries. Rabbit state persists when leaving and returning to the landing. Deer retaliate only after injury; other animals remain passive and flee; fished weapons can hunt them for XP. Mara remains a talk-only NPC.
  All 23 sheet poses are mapped using their visible bounds and a shared foot
  anchor; rabbits are ambient wildlife, separate from combat actors and fishing.
- **Windchime Path** (1,200 × 1,800): a short forest trail demonstrating area travel.
  Its north end leads into Willowbank Crossroads.

Walk north through the marked opening at the landing's map edge to enter the path.
Walk south through the path's edge to return. Continue north to reach the crossroads.

- **Willowbank Crossroads** (1,600 × 1,280): the atlas fork, with Willowback Village
  to the west and Shellback Marsh to the east. Explore both approaches, a sheltered
  rest stop, wind chimes and a fishable reed pool. The west edge enters the village, and the south edge returns to Windchime Path.
  The eastern boardwalk enters Shellback Marsh.
  Six examinable landmarks appear on the area map. All inventory and progression
  carry through the journey in either direction. These are movement-triggered area
changes; there is no teleport menu or interaction key. The camera keeps its zoom
and clamps to each area's bounds. Area maps, geography, scenery caches and
discovery counts switch with the active area; prior discoveries remain in memory.

WASD moves, mouse aims, left click uses the equipped item, E casts or abandons fishing,
Space examines landmarks and reels, Left Shift dashes, R and T use the Region Core's powers once the story wakes them, and M opens/closes the area map. On phones the main attack sits in the bottom-right corner with the powers and Dash ringed around it and Examine just to their left (`src/core-abilities.js`). Fishing, inventory,
regeneration and timed upgrades remain available. Piers, boardwalks and fords can be walked on.

Scenery and explorer artwork are original; rabbits use the user-supplied sprite
sheet. Nearby terrain is cached in 512-unit sections,
capped at 30 sections, with separate keys per area. Full-region maps are never
allocated as large images.

Glasswater Pools, the sluice ruins, Heron
Islands, quarry and cave remain planned locations. The larger continent, story illustration checkpoints and interiors are not included in this
pass. Reloading starts a new journey. Internal arena fixtures still test the shared
fishing/combat systems, but the PvP menu is hidden from the player flow.

## Willowback Village

The atlas village (labelled Willowbank in the original reference) is the next playable area, reached by walking west from Willowbank Crossroads. **Willowback Village** is 1,920 × 2,000 world units, with an eastern return path, six solid buildings, a cobbled commons and well, market stalls, a netmaker yard, kitchen gardens and a fishable timber jetty. Six examinable landmarks appear on the area map. Roofs and front walls participate in character/scenery depth sorting. Buildings have exterior details but no enterable interiors or trading yet.

The lower river provides enough camera space for portrait fishing above the touch controls. Water blocks walking except on the dock; save files restore the new area and its discoveries and drops using the existing versioned format. Older saves continue to load.

## Shellback Marsh

Redrawn from the atlas: four natural islands and a reedy west shore, split by the deep Shell Channel. Timber walks of 70 to 86 units, with lantern posts, connect the Reed Threshold (west shore), Shellback Glade and its ancient empty shell (east island), Reedwatch Lookout (north island), Angler's Reach (east tip), the Sunken Steps (south island) and the Lantern Pools (west shore). The road from Willowbank Crossroads arrives on the west shore. The Long Boardwalk runs north-west out to 9.2, and the east walk past Angler's Reach leads to Stilt Reach (13.2). Marsh art and gameplay data live in `src/marsh-art.js` and `src/marsh.js`.

## Atlas areas

The other areas are plain data in `src/delta-areas.js`. Each is traced in atlas pixels on the 720 × 480 atlas: a frame cut out of the atlas, a size in world units, and land and water shapes, ground zones, trails, boardwalks, fords, bridges, cliffs, props, landmarks, edge exits, portals and rowboat crossings. `src/atlas-area.js` scales each one into world units and answers the terrain questions. `src/atlas-area-art.js` paints the decks and props. `tests/delta-areas.test.js` checks three things for every area: each landmark and exit can be reached on foot, each arrival is walkable, and each way in has a way back.

- **North-west forest.** 1.1 Trailhead, 1.2 Deep Trail (the Fallen Giant closes the way deeper for now), 2.1 Listening Glade, 2.2 Elk Run, 3.1 Upper Falls, 3.2 Glasswater Basin, 4.1 Forest Edge, 4.2 Whispering Woods, 4.3 Stone Clearing, 11 Western Falls.
- **Ruins and the river.** 5.1 Aqueduct Ruins, 5.2 Old Roads, 6.1 The Great Bridge, 6.2 Lookout Heights, 7 Springmouth Cave, 8 Abandoned Quarry, 9.1 Falls Channels, 9.2 Long Boardwalk, 10.1 North Shallows, 10.2 Egret Isles.
- **The wetlands and the east.** 13.2 Stilt Reach, 14 Heron Islands, 15 The Broken Watch, 18.3 Chimewood, 26 Stonefall Creek, 19.1 Upper Braids, 19.2 Delta Mouth.
- **The coast and the sea.** 16 The Drowned Road, 20 Tidecave Coast, 21 Outer Shallows, 22 Arrival Bay, 23 Seal Skerries, 24 Sandbar Spits, 25 Heron Point.

Press **M** for the area map. Its Reedwater Delta tab shows the whole atlas with every playable area outlined in green and Eli's own area in gold; click an area to open its map.
