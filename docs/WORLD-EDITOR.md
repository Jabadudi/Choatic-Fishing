# World editor

Spawn points, spawn rates, villagers and planned boss spots are edited in the **Reedwater Delta Atlas** artifact:
pick an area and press **Edit world**. The editor keeps its data in the atlas's shared database (collections
`spawnAreas`, `spawnSlots`, `npcs` and `bosses`; `spawnAreas/_shared` holds the game-wide settings and the
`shippedAt`/`lastEditAt` marker). The atlas's own `areas` collection is separate.

The game reads all of it from one generated file, `src/world-data.js`. Shipping editor changes is a one-file PR:

1. Download the four collections from the atlas database into one folder (one JSON file per document).
2. `node scripts/world-editor.mjs export <folder>` rewrites `src/world-data.js`. Anything the game cannot use
   (an unknown area, a habitat other than land or water) is dropped and listed.
3. Run `npm test`. The spawn tests check that every spawn point can hold every creature its area can spawn there.
4. Open the PR, then set `spawnAreas/_shared.shippedAt` to the time of the export so the editor shows
   "Everything here is in the game".

`node scripts/world-editor.mjs seed <folder>` goes the other way, writing the shipped data as editor documents.

When areas are added or redrawn, refresh the editor's pictures and ground grids with
`OUT=<folder> node scripts/world-editor-snapshot.cjs` and publish the folder's contents to the atlas under `world/`.

Saves stay loadable whatever the editor changes: a creature whose spawn point was removed, or no longer suits it,
leaves; spawn timers for removed areas are dropped and long timers shrink to a shortened respawn time.

Villagers only appear in Willowback's areas, and boss spots are saved but not used by the game until a boss fight is
built.
