# The Wilds — Reedwater Landing

The first version focuses on Reedwater Delta. Reedwater Landing, Windchime Path and Willowbank Crossroads are playable; the rest of the regional atlas is future work.

## Playable areas

- **Reedwater Landing** (2,800 × 2,200 world units): southern beach, wooden dock and
  boat, submerged road and pillars, three wind chimes, spring, hollow tree, and
  ambient deer, turtle and eel sprites.
  Five rabbits use the supplied `assets/bunny-sheet.png`: they rest, graze, hop,
  and flee when approached. Their movement respects water, trees, rocks and area
  boundaries. Rabbit state persists when leaving and returning to the landing.
  All 23 sheet poses are mapped using their visible bounds and a shared foot
  anchor; rabbits are ambient wildlife, separate from combat actors and fishing.
- **Windchime Path** (1,200 × 1,800): a short forest trail demonstrating area travel.
  Its north end leads into Willowbank Crossroads.

Walk north through the marked opening at the landing's map edge to enter the path.
Walk south through the path's edge to return. Continue north to reach the crossroads.

- **Willowbank Crossroads** (1,600 × 1,280): the atlas fork, with Willowbank Village
  to the west and Shellback Marsh to the east. Explore both approaches, a sheltered
  rest stop, wind chimes and a fishable reed pool. Destination ropes mark the
  unfinished village and marsh boundaries; only the south edge changes areas.
  Six examinable landmarks appear on the area map. All inventory and progression
  carry through the journey in either direction. These are movement-triggered area
changes; there is no teleport menu or interaction key. The camera keeps its zoom
and clamps to each area's bounds. Area maps, geography, scenery caches and
discovery counts switch with the active area; prior discoveries remain in memory.

WASD moves, mouse aims, E casts or abandons fishing, Space reels, Left Shift dashes,
G examines landmarks, and M opens/closes the area map. Fishing, inventory,
regeneration and timed upgrades remain available. The dock can be walked on.

Scenery and explorer artwork are original; rabbits use the user-supplied sprite
sheet. Nearby terrain is cached in 512-unit sections,
capped at 30 sections, with separate keys per area. Full-region maps are never
allocated as large images.

Willowbank Village, Shellback Marsh, Glasswater Pools, the sluice ruins, Heron
Islands, quarry and cave remain planned locations. The larger continent, quests,
story illustration checkpoints, interiors and save/load are not included in this
pass. Reloading starts a new journey. Internal arena fixtures still test the shared
fishing/combat systems, but the PvP menu is hidden from the player flow.
