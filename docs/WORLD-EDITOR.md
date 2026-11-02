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

## Land

The same screen has a **Land** mode (or press **Edit land** on an area in the atlas) for reshaping an atlas-built area:
land and water shapes, ponds and streams, ground patches (forest, meadow, clearing, sand, rock, marsh, dirt), cliffs,
trails, boardwalks, fords and bridges, props (including single trees, bushes and rocks), landmarks and exits. The
**Plan** view redraws the terrain as the game reads it while you edit; **Game art** is the picture from the last
snapshot.

Each edited area is one document in the atlas collection `land` (`def` holds the area's terrain as JSON, in atlas
pixels like `src/delta-areas.js`); `land/_shared` holds the `lastEditAt`/`shippedAt` marker. Shipping is a one-file PR:

1. Download the `land` collection into a folder (one JSON file per document, under `land/`).
2. `node scripts/land-editor.mjs export <folder>` rewrites `src/land-data.js` with only the fields that differ from
   `src/delta-areas.js`. Anything malformed is dropped and listed.
3. Run `npm test`. The atlas-area tests check that every landmark and exit can still be reached on foot and that
   every exit has a way back; fix the land in the editor if they fail.
4. Open the PR, then set `land/_shared.shippedAt`. After it merges, re-run the snapshot script so the editor's game
   art matches.

Hand-built areas (Windchime Path, Willowbank Crossroads, Willowback, Shellback Marsh and the rooms) are drawn in code,
so their land is not editable here. A changed area size keeps spawn points, villagers and bosses at the same game
units, so check them after resizing.
