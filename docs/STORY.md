# Story progression

New Game starts Chapter 1, **The Old Fishing Hut**, after the captain leaves Eli on the shore. Existing version 1 saves migrate as exploration journeys without replaying the opening or losing quest progress. Version 2 story saves continue into Chapter 2 from their existing checkpoints; version 3 checkpoints continue into Chapter 3. The current format is version 4.

## Playable sequence

1. Advance the arrival dialogue, then follow the branch from the dock to Grandpa’s cabin. Press G / Examine at the door to enter.
2. Walk around the cabin and examine the blue lure box on the upper-right shelf and the photograph on the left. Their illustrations accompany the discoveries.
3. Leave through the southern doorway. Fish at the dock using the existing fishing controls. While the dinner objective is active, successful catches supply a Sardine so the opening does not depend on loot luck.
4. Return to the stove in the upper-left corner with a Sardine. Cooking consumes exactly one fish and advances the dinner scene. Approach the left side of the bed and Examine when ready for night.
5. Advance the illustrated storm sequence: the voice, lightning, escape, Moonfang rescue, blackout and campfire awakening. Movement and combat pause during scenes.
   On the shore the night attack plays out in the world before the rescue illustration: the shadow walker steps out in front of the cabin as Eli flees, closes in on him after he collapses (ten feet, eight, six) and lifts the axe. Moonfang charges in from the east, leaps over Eli into the walker, and the walker dissolves into smoke, leaving the axe in the mud. Moonfang howls, then the illustration and blackout follow. The choreography lives in `src/story-action.js` (`NIGHT_ATTACK` timings, `nightAttackActors` poses) and the renderer only draws it.
6. The same shore now contains the damaged cabin and campfire. The area map reflects the damage. The rescuer appears beside the fire; her name is withheld to preserve the later introduction. Talk to her to begin Chapter 2. The north exit opens after the Chapter 2 departure walk.

The mysterious lure is a protected quest item. The opening grants ordinary fishing XP, but catch powers and timed upgrades stay dormant pending the later Region Core storyline. Eli and the rescuer use centralized drawn sprite fallbacks; their gameplay dimensions are independent of their appearance.

## Chapter 2 — Shadow Walker

From a completed Chapter 1 journey, use Continue, return to the Reedwater campfire if you previously traveled elsewhere, approach the girl and press G / Talk. Her name remains **The girl** until the later Chapter 4 introduction.

1. **Talk about last night** begins the campfire conversation: the shadow walker, the village attack, the Moonfang and why Eli was targeted. The lure remains hidden in his pocket.
2. **Ask about the cabin** continues the conversation about her grandmother’s old home and Eli’s inheritance. Between conversations, the damaged cabin and dock offer optional reflections. These do not gate progress or award items.
3. **Ask how to get home** leads to the boat conversation, “This is no island,” and the invitation to meet someone who might help.
4. **Leave with the girl** is the player’s explicit decision to leave the campfire. She walks around the south of the cabin to the inland trail. She waits beyond 240 world units, pauses while Eli fishes, and waits at the destination until Eli catches up. She stays a friendly, untargetable NPC.
5. The closing scene completes Chapter 2 before the forest walk in Chapter 3. The north exit opens for exploration. Talk to the girl on the inland trail to continue into Chapter 3.

Dialogue uses the supplied campfire illustration, a portrait crop from the Mara reference sheet and the Moonfang idle animation. Morning mist, a blanket, and the rod set across the campfire stones reinforce the aftermath. The guide has a cyan marker on the area map. Her movement is simulated with gameplay speed and collision checks; rendering never advances it.

## Chapter 3 — The Village

Continue from a completed Chapter 2 checkpoint and talk to the girl on Reedwater Landing’s inland trail. Choose **Continue toward the village**. Existing journeys remain in their saved area; return to her if you explored elsewhere.

1. Follow her to the three wooden chimes. After the short scene, continue north through Reedwater Landing and Windchime Path. Take the western village road at Willowbank Crossroads.
2. The guide walks the actual connected paths, waits at area exits until Eli catches up, and joins the next area when Eli crosses. She waits through fishing and detours. The cyan map marker follows her saved area and coordinates.
3. At Willowback, the arrival scene introduces the well, houses, eastern gardens and southern docks. Six residents carry baskets, mend nets, work or play around the square. Their ambient patrols are derived from saved simulation time.
4. Follow the girl to the blacksmith and Examine the frost-scaled guardian from the lane. The Rimejaw rests outside the door and a Flitlynx grooms on the roof. The supplied sprite sheets animate these friendly scene NPCs; the matching pose artwork illustrates the discoveries.
5. Ask the girl about shadow walkers. The conversation introduces Croshelda, Goldanir’s disappearance four hundred years ago, infection amplifying a host’s power, and the village’s loss of one Rimejaw.
6. Follow her around the inn to the larger red house with white trim. Chapter 3 ends at the chief’s porch. The Chapter 4 meeting and introduction of Mara’s name remain ahead.

`src/chapter3.js` supplies dialogue and routes. `src/village-life.js` owns friendly village residents and their simulation updates; their appearance is configured in the sprite registry. Creature art has no effect on collisions, health or rewards. The tamed Rimejaw and Flitlynx are inspectable NPCs, separate from huntable wildlife and combat AI.

## State and rendering

`src/story.js` owns milestones, scene pages, interactions and validation. `src/story-map.js` owns cabin geometry, interior furniture, campfire drawings and map overlays. `src/story-ui.js` presents read-paced illustrations; `src/story-weather.js` draws the visual weather. The base terrain stays cached separately from the cabin’s story-dependent appearance.

`src/save-format.js` captures the story stage, discoveries and current scene page, with explicit version 1 → 2 → 3 → 4 migrations. Version 4 gives each saved guide an explicit area ID, preserving earlier guide routes and conversation pages. Version 3 adds validated guide coordinates and waypoint progress. The historical `complete` stage still means Chapter 1 is finished; it remains unchanged for version 2 save compatibility. Saving during dinner or rescue resumes that scene without consuming another fish or duplicating the lure. Character placement is reconstructed from validated story state, including the guide’s exact route progress. Replaying the morning memory never rewinds a later chapter. Existing atomic save transactions, manual saves and three autosave backups are retained.

## Artwork provenance

Files in `assets/story/` were downloaded from the user’s Drive folder **The Wilds / volume1-art**:

| Local file | Source | Usage |
| --- | --- | --- |
| `photo.png` | `cutscenes/vol1/ch01/ch01_01_grandpa-photo.png` | Photograph discovery and dinner |
| `lure.png` | `cutscenes/vol1/ch01/ch01_02_lure.png` | Discovery and storm voice |
| `rescue.png` | `cutscenes/vol1/ch01/ch01_03_moonfang-vs-shadow-walker.png` | Wolf rescue |
| `campfire.png` | `cutscenes/vol1/ch02/ch02_01_mara-campfire.png` | Closing awakening shared with Chapter 2 |
| `moonfang.png` | `sprites/creatures/moonfang/moonfang_sheet.png` | Animated rescue vignette |
| `moonfang-charge.png` | `art/sprites/creatures/moonfang/moonfang_sheet.png` | Night attack: run, leap, land and howl |
| `nightwalker-sheet.png` | `art/sprites/mobs/nightwalker/nightwalker_sheet.png` | Night attack: walk, raised axe and smoke death |
| `rimejaw-sheet.png`, `rimejaw-pose.png` | `sprites/creatures/rimejaw/` | Blacksmith guardian animation and discovery artwork |
| `flitlynx-sheet.png`, `flitlynx-pose.png` | `sprites/creatures/flitlynx/` | Roof creature animation and discovery artwork |
| `mara.png` | `characters/mara/mara_reference-sheet.png` | Character reference and Chapter 2 dialogue portrait |

All artwork mappings are in `src/sprite-definitions.js`. The Moonfang sheet is irregularly cropped and has a green matte; `src/sprites.js` removes that matte once in a cached canvas. Missing images retain readable scene text and a visible sprite fallback. The night attack sheets are prepared ahead of time by `python3 scripts/prepare-cutscene-sprites.py`, which removes the matte and puts every frame's feet on one baseline in a regular grid; rerun it after changing the source art.

## Verification

Run `node --test` for behavior, saves, migration, duplicate prevention, collision and sprite mapping checks. `scripts/story-preview.cjs` uses Playwright to preview the full sequence, reload mid-rescue through Continue, and check desktop/mobile presentation. Install Playwright or set `NODE_PATH` to the local runtime packages; set `CHROME_PATH` if using an installed browser. The preview uses an isolated browser profile and writes screenshots under `screenshots/chapter1-*`.

`tests/chapter2.test.js` covers the conversations, old story saves, optional reflections, guide waiting/fishing pauses, land collision, mid-walk saves, completion and invalid imports. `scripts/chapter2-preview.cjs` exercises a real version 2 Continue checkpoint, dialogue/portrait presentation, mobile layout and mid-walk reload in an isolated browser profile. The screenshots use `screenshots/chapter2-*`.

`tests/chapter3.test.js` verifies the connected guide route, version 3 migration, village patrol collision, friendly creature classification, sprite crops, scene-page resume and invalid guide imports. `scripts/chapter3-preview.cjs` checks a real older Continue checkpoint, the three map crossings, forest reload, creature illustrations, roof layering, mobile layout and the chief’s porch. Screenshots use `screenshots/chapter3-*`.

## Dialogue, cutscenes and device preferences

Open Settings from the title screen, in the world, or from the conversation toolbar (F10 also opens/closes it). Audio has independent music and sound-effect sliders and mute buttons, plus a test effect. Effects cover UI, dialogue pages, fishing, dashing and damage. Dialogue UI provides Hearthwood, Mossy Stone, Field Journal, Lantern Night, Meadow Banner and Quiet HUD, with a working preview. Changing a skin updates an open conversation immediately.

Preferences use the stable `the-wilds-settings-v1` localStorage key, independently of journey saves. Invalid fields fall back to defaults; storage failures keep session changes and display a status message. The default is Hearthwood, music 30%, effects 70%.

Conversations show a portrait or sprite with the speaker's name beneath, creature-name highlights, page count, Previous, Next, Close and End conversation. Previous reviews earlier pages without rewinding authoritative quest progress. Closing a story conversation preserves its current page; press G to resume. An unfinished saved scene reopens on Continue. NPC conversations pause local simulation while visible.

A new cutscene image fades in over 1 second, remains clear for 3 seconds, dims over 1.4 seconds to 86% black, then reveals dialogue over 0.45 seconds. Reusing the same art does not repeat the hold. Show dialogue skips only this presentation delay. Settings pauses the presentation clock. Missing artwork falls back to readable dialogue. Artwork and portraits use the shared sprite pipeline and do not change gameplay hitboxes or rewards.

### Chapter 1 physical action and keybinds

Dinner now stays in the cabin view rather than opening the photograph illustration. Storm pages keep their existing save indices, but the strike, collapse, rescue and blackout now play automatically. A fixed-step story controller moves Eli along a land-checked cabin exit and shore route; the camera follows the player, input stays locked, and Settings pauses playback. The collapse uses a rendered fallen pose, the rescue uses the existing artwork without a dialogue panel, and the blackout leads into the unchanged wake-up narration. Restoring during the sequence continues its saved beat and position; transient playback clocks do not alter the journey save contract. The damaged cabin appears during the escape, while the girl and camp appear after the rescue.

Settings now has a Keybinds tab. Click an action and press a letter, digit, arrow, Shift, Space, or punctuation key. Conflicts swap actions; Escape cancels capture. Restore default keys resets only keyboard bindings. Device preferences retain bindings across reloads, and HUD prompts update immediately. Escape, F10, Ctrl/Cmd+S manual save, Enter to restart, and dialogue navigation remain fixed so menus remain reachable.
