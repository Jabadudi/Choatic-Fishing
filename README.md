# The Wilds

A story-driven fantasy RPG that runs in the browser. You play Eli, a young man who
comes to his late Grandpa Oscar's fishing hut on the Reedwater shore and finds out,
over one stormy night, that he is no longer in his own world. You fish, hunt, cook
and explore the Reedwater Delta while the story unfolds around you.

The writing follows the narration style of *He Who Fights With Monsters*: close
third person on Eli, his dry inner voice running alongside the narration, and game
systems (skills, levels, loot, the Creature Index) that the story treats as real.

**Play it:** https://jabadudi.github.io/Choatic-Fishing/

## The story so far

Chapters 1 to 5 of Volume 1 are playable. Each one continues from the previous
chapter's save, so there is never a need to restart.

1. **The Old Fishing Hut.** Eli explores Grandpa's cabin, finds the photograph and
   the strange lure, catches supper at the dock and hunts deer with Grandpa's bow,
   cooks dinner, then flees a storm and a shadow walker until the wolf Moonfang
   saves him.
2. **Shadow Walker.** Eli wakes by a campfire next to a girl who will not yet give
   her name, learns this is no island, and follows her inland.
3. **The Village.** The road leads to Willowback Village, its residents, the
   blacksmith's Rimejaw and Flitlynx, and the first word of Croshelda.
4. **Region Core.** In the chief's house Eli meets Emilia, learns Mara's name and
   what happened to Grandpa, and finds out the lure is the Region Core of Reedwater.
5. **Sunrise.** Mara shows Eli to the guest lodge. He sleeps, a vision plays as a
   full-screen video, and Mara wakes him at dawn. Chapter 6 picks up outside.

Story scenes use illustrated cutscenes, a dialogue box per speaker (including a
Narrator and a Mysterious voice), and a choreographed night attack on the shore.
The canon chapter text lives in [`story/`](story/README.md), character art and
cutscene sources in [`art/`](art/README.md), and the in-game sequence and save
checkpoints are described in [docs/STORY.md](docs/STORY.md).

## What's in the game

- **A connected world.** Reedwater Landing (beach, dock, Grandpa's cabin), Windchime
  Path, Willowbank Crossroads, Willowback Village and Shellback Marsh, joined by
  walking off the map edge. Press **M** for the area map.
- **Walk-in interiors.** Grandpa's cabin, the chief's house and the guest lodge,
  furnished with hand-made prop sprites on tiled walls and floors.
- **Fishing.** Cast into the water and keep the catch inside the reeling bar.
  For now every catch is a Sardine while the wider fish table is being rebalanced.
- **Hunting and loot.** Rabbits, a turtle and an eel flee; deer fight back when
  hurt. Each creature has its own loot table of meat, hides, trophies and
  materials, and Luck raises the chance of rare drops.
- **Area spawns and shinies.** Each outdoor area has spawn slots, a population
  cap and a weighted table. Empty slots roll when you walk in after time away and
  on the area's own respawn clock; living creatures stay. About 1 in 100 spawns is
  a gold Shiny with four times the odds on every rare drop and shard.
- **Cooking.** Cooking supper at Grandpa's stove in Chapter 1 earns Cooking XP.
  More recipes and stoves are still to come.
- **Skills and main level.** Fishing, Hunting and Cooking level up only from a
  finished success. Every skill point also feeds Eli's main level, which adds max
  health, Strength, Dexterity, Luck and Wisdom (**K**).
- **Skill trees.** Each skill earns its own talent points for a small tree of
  passive talents, opened from the Skills sheet.
- **Creature Index.** An illustrated entry for every creature and villager with a
  description, a map of where it lives and its loot table (**I**). Entries stay
  question marks until Eli meets the creature or the story mentions it.
- **Familiars.** Hunted creatures sometimes drop a familiar shard. Five of one kind
  fuse in the Index into a familiar that follows Eli and grants a passive, which
  grows at 25 shards and gains a stronger one at 100.
- **Side missions.** Once Eli reaches Willowback, villagers with work for him show a
  gold **!** over their heads. Talk to them to hunt rabbits, deer or eels, or to bring
  back hides, eel skin or a lucky rabbit's foot, for reed marks, items and XP. Finished
  missions show a gold **?** until handed in, and some lead to the next job. The quest
  log (**J**) tracks what is under way, and the current mission shows under the story
  objective. The blacksmith also wants shadow walkers dealt with once his harness is mended.
- **Backpack.** Category filters, use, throw, discard and a six-slot hotbar (**B**).
- **Reed marks.** Willowback's copper coin. Sell hunting and fishing goods to the blacksmith, fisher and gardener, find a few marks tangled in a catch, and spend them at the same stalls. The purse shows under the area card and in the backpack.
  The Region Core is a protected quest item.
- **Saves.** Autosaves with three backups, a separate manual save, and JSON
  export/import, all stored locally in the browser.
- **Settings.** Music and sound effect volumes, dialogue box themes and fully
  rebindable keys (**F10** or the ⚙ button).
- **Phones and tablets.** A touch joystick plus Use and Examine/Talk buttons.
  Plays best sideways: the ⛶ button goes full screen and, on Android, locks
  landscape. iPhone can't do either for web pages, so it shows a rotate prompt
  and Add to Home Screen steps instead. `node scripts/landscape-preview.cjs`
  takes phone-size screenshots and checks the landscape HUD for overlaps.

## Controls

These are the default keys. All of them can be rebound in Settings.

| Key | Action |
| --- | --- |
| W A S D | Move |
| Mouse | Aim |
| G | Talk / examine / enter a door / pick up |
| E | Cast the rod, or abandon a cast |
| Space or hold left click | Reel (raise the catch bar) |
| Left click / F | Use the equipped item (shoot the bow, eat, attack) |
| 1 | Fishing rod |
| 2 to 7 | Hotbar shortcuts |
| Left Shift | Dash |
| B | Backpack |
| K | Skills |
| I | Creature Index |
| J | Quest log |
| M | Area map |
| Q / Escape | Cancel the current action or close a menu |
| F10 | Settings |

In dialogue, Space, Enter or the arrow keys turn pages. On touch screens, the
joystick moves, **Use** casts, reels and uses items, and **Examine** becomes
**Talk** or **Pick up** when something is nearby.

## Coming next

- Full-screen play.
- Chapter 6 and Drayfus's training at sunrise.
- Aggressive creatures and shadow walkers you can fight outside the story.
- Cooking outside the story, at any stove or campfire.
- Village interiors for the inn and shops, and more quests.

## Run it locally

Node.js 18 or newer is all you need. There is nothing to install.

```sh
npm start        # serves the game at http://127.0.0.1:5173/
npm test         # runs the simulation tests (node --test)
npm run build    # builds the static site into dist/
```

Choose **New game** on the title screen to start Chapter 1, or **Continue** to pick
up a saved journey. Pushes to `main` run the tests, build and deploy to GitHub
Pages ([DEPLOYMENT.md](DEPLOYMENT.md)).

## Project layout

- `src/` is the game, in plain JavaScript modules on a Canvas. `main.js` wires up
  input, the 120 Hz loop and the HUD. `world.js` runs the simulation and
  `renderer.js` draws it. Story chapters live in `chapter1.js` to `chapter5.js` and
  `story.js`. Interiors are `story-map.js`, `chief-house.js` and `guest-lodge.js`.
  `loot.js`, `spawn-tables.js`, `spawns.js`, `skills.js`, `skill-trees.js`, `familiars.js`, `side-quests.js` and `codex.js` hold the
  RPG systems, and `save-format.js` owns the versioned save contract.
- `assets/` holds sprites, props, cutscene art, music and the vision video.
- `tests/` covers the simulation, story chapters, saves, loot, skills and familiars.
- `story/` and `art/` are the narrative and source artwork. The game does not
  load them.
- [WORLD.md](WORLD.md) describes the world layout.
  [docs/ENTITY-BEHAVIORS.md](docs/ENTITY-BEHAVIORS.md) and
  [docs/ENTITY-SPRITES.md](docs/ENTITY-SPRITES.md) cover creatures and their art.
  [AGENTS.md](AGENTS.md) lists the rules for adding entities and save fields.

## Origins

The project began as *Chaotic Fishing*, a fishing arena brawler. That mode is still
reachable from the title screen (**Practice vs. bot** and online lobbies for 2 to 4
players over PeerJS). It is no longer the focus, and the arena-only items, specials
and bots are kept for it.

Music: *Battle Music* by Paulyudin and *Armageddon* by Alibi Music.
