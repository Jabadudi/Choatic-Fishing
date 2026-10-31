# The Wilds — Reedwater Landing

The first version focuses on Reedwater Delta. Reedwater Landing, Windchime Path, Willowbank Crossroads, Willowback Village and Shellback Marsh are playable; the rest of the regional atlas is future work.

## Playable areas

- **Reedwater Landing** (2,800 × 2,200 world units): southern beach, wooden dock and
  boat, submerged road and pillars, three wind chimes, spring, hollow tree, and
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
Space examines landmarks and reels, Left Shift dashes, R and T use the Region Core's powers once the story wakes them, and M opens/closes the area map. On phones the main attack sits in the bottom-right corner with the powers, Examine and Dash ringed around it (`src/core-abilities.js`). Fishing, inventory,
regeneration and timed upgrades remain available. The dock can be walked on.

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

The eastern branch of the crossroads now leads to the atlas wetlands. Six dry islands and a network of 74–86 unit boardwalks connect the Reed Threshold, Shellback Glade, Reedwatch Lookout, Angler's Reach, the Sunken Steps and Lantern Pools. The centre glade contains an ancient empty shell as a landscape relic. Fish from the eastern landing or the smaller western pools. The west edge returns to the crossroads.

The 2,100 × 2,400 area leaves water space below its southern landmarks for portrait camera framing. Wet channels block movement outside timber crossings; fixed tree roots and structures have explicit collision. Marsh art and gameplay data live separately in `src/marsh-art.js` and `src/marsh.js`. The active area map shows islands, crossings and discoveries, and existing save version 1 restores marsh journeys without dropping prior progress.
