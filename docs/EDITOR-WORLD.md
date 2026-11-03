# Deployed world reference for the editor

The Pages build renders every outdoor area using the game renderer and generates public design data for the separate world editor. `scripts/editor-world.mjs` serializes effective terrain, spawn/NPC/boss documents, quests and story text; the existing snapshot renderer supplies area artwork, dimensions and gameplay ground grids. Player saves, auth tokens and multiplayer state are never read.

The deployment artifact contains `editor-world/latest.json` with the exact game commit and `editor-world/<commit>/world.json` plus `areas/*.jpg`. The pointer and snapshot are uploaded in the same Pages artifact as the game. A failed renderer fails the build rather than publishing an incomplete reference.

The editor's manual **Refresh from game** button fetches these deployed files. Its protected Firebase database remains the draft store; this endpoint is a read-only reference. The editor compares against the previous reference, preserves newer drafts and conflicts, and updates atlas statuses only after reconciliation. Shipping remains a game pull request that the owner merges.

The publisher's round-trip test feeds all generated collections through the normal game exporters and requires them to reproduce deployed design data without exporter notes. Run `node --test` and `node build.mjs`. To regenerate images locally, install Playwright and Chromium, then run `OUT=dist/editor-world/<commit> node scripts/world-editor-snapshot.cjs` from the game root. On Windows, `EDITOR_TEST_CHROME` may point to an installed Chrome executable.
