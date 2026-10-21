# The Wilds — Reedwater Landing

The first version focuses on Reedwater Delta. Only Reedwater Landing and its first
connecting path are implemented so far; the rest of the regional atlas is future work.

## Playable areas

- **Reedwater Landing** (2,800 × 2,200 world units): southern beach, wooden dock and
  boat, submerged road and pillars, three wind chimes, spring, hollow tree, and
  ambient deer, turtle and eel sprites.
- **Windchime Path** (1,200 × 1,800): a short forest trail demonstrating area travel.
  Its north end is closed until the next area is built.

Walk north through the marked opening at the landing's map edge to enter the path.
Walk south through the path's edge to return. These are movement-triggered area
changes; there is no teleport menu or interaction key. The camera keeps its zoom
and clamps to each area's bounds. Area maps, geography, scenery caches and
discovery counts switch with the active area; prior discoveries remain in memory.

WASD moves, mouse aims, E casts or abandons fishing, Space reels, Left Shift dashes,
G examines landmarks, and M opens/closes the area map. Fishing, inventory,
regeneration and timed upgrades remain available. The dock can be walked on.

All pixel artwork is original. Nearby terrain is cached in 512-unit sections,
capped at 30 sections, with separate keys per area. Full-region maps are never
allocated as large images.

Willowbank Village, Shellback Marsh, Glasswater Pools, the sluice ruins, Heron
Islands, quarry and cave remain planned locations. The larger continent, quests,
story illustration checkpoints, interiors and save/load are not included in this
pass. Reloading starts a new journey. Internal arena fixtures still test the shared
fishing/combat systems, but the PvP menu is hidden from the player flow.
