# The Wilds — an exploration world

The first playable area is Reedwater Landing: explore its beach, dock, drowned
road, spring and forest approach. Walk north into Windchime Path, then continue north to Willowbank Crossroads.
The fork leads west toward the village approach and east to the marsh boardwalk
and a fishable pool. The village and marsh maps remain closed beyond their approach
ropes. Walk south to return through Windchime Path to Reedwater Landing.
Press **M** for the current area map and **G** to examine a nearby landmark.
See [WORLD.md](WORLD.md) for the world layout, controls, art approach and current limits.
The earlier PvP lobby is no longer part of the player flow. The notes below describe
the shared fishing/combat systems and their earlier arena implementation.

JavaScript and Canvas, with vendored PeerJS for online connections. Node.js 18+ serves and tests the project; no package installation required.

## Run

Run `node server.mjs` (or `npm start`) in this folder, then open http://127.0.0.1:5173/.
Run `node --test` for the simulation tests.

## Controls

- WASD: move; mouse: aim.
- Left Shift: dash in your movement direction, or toward aim when stationary. Travels up to 136 units over 0.16 seconds, then recharges for 2 seconds. Invulnerable to damage and new knockback during the 0.16-second dash; vulnerability returns during recharge. Reeling dashes stay in the shoreline; dashing is unavailable during the bite wait or countdown.
- 1: rod; 2–7 or hotbar buttons: equip a caught item.
- E: cast to the exact water point under the cursor, or abandon an active cast.
- Left click: cast with the rod, use an equipped item, or hold to reel.
- Space held: raise the fishing bar; release to lower it.
- F: use the equipped caught item. Escape/Q: abandon fishing.
- R: fire a Tidal Cannon charge toward the mouse.
- T: trigger a Whirlpool Burst charge around the player.
- Enter or Play again after victory/death: start a fresh match.

## Match and enemies

Choose Practice vs. bot to face Brine. Online lobbies support 2–4 human players; see DEPLOYMENT.md for publishing and invitations. Each new or restarted match opens with a five-second countdown. Movement, fishing, attacks, and bot AI stay frozen until it ends, so both players begin together. Everyone starts with a rod, 100 health, and no combat item. Bots fish through the same reeling simulation using an automated input controller, receive random loot and catch buffs, then approach and attack the nearest living opponent.  Empty bots return to shore; unarmed bots can abandon a catch and retreat from a nearby opponent. Bot decisions use distance, health, and equipment, not whether an opponent is fishing. The last living player wins. Losing stops the match and offers a restart.

Living players and bots regenerate 1 HP per second during the match, including while fishing or fighting, capped at their current maximum health. Regeneration does not run during the countdown or after the match and cannot revive eliminated actors.

Fishing gives no protection from damage. Attacks apply health damage and knockback without changing fishing controls, catch movement, or progress. There are no approaching-enemy warnings or camera shakes. Water remains an impassable boundary.

## Backpack and combat

The permanent rod uses key **1**. In exploration, catches go to independent backpack storage. Assign items to the six hotbar shortcuts **2–7**, then click a shortcut or press its number to equip it. Click or press **F** to use the equipped item. A full hotbar never blocks exploration fishing. Legacy arena fixtures retain their six catch slots.

New fishable weapons: **Reed Spear** (5 uses, 22 damage, 110 reach, 0.3s cooldown), **Crab Maul** (3 uses, 52 damage, heavy knockback, 1s cooldown), and **Shell Sling** (6 uses, 18 damage per projectile, 0.35s cooldown).

| Item | Uses | Effect before buffs |
| --- | --- | --- |
| Frying Pan | 3 | 25 melee damage, strong knockback, 0.4s cooldown |
| Swordfish | 3 | 34 melee damage, longer reach, 0.55s cooldown |
| Anchor | 2 | 60 melee damage, heavy knockback, 1.2s cooldown |
| Harpoon Gun | 3 | 36 damage on projectile impact |
| Pufferfish Bomb | 1 | Travels then explodes for 48 area damage |
| Grappling Squid | 1 | Dash up to 140 units toward aim, constrained to land |
| Sardine | 1 | Heal 35, capped at maximum health |
| Old Boot | 1 | Throw for 5 damage and light knockback |

Melee requires range and facing. Projectiles exclude their owner. Item uses are consumed on attack, including misses. Attacks and specials require leaving fishing first. Health and enemy equipment are visible in the world/HUD.

## Fishing and shoreline movement

The sandy shoreline extends 110 units inland on all sides. Cast anywhere in this band into water. Movement is locked during the bite wait. While reeling, WASD allows movement around the sandy band but blocks entry into the grassy center. The bobber stays at the cast point. Completing or abandoning the catch restores unrestricted land movement.

After the bite, hold Space or left mouse to raise the bar with momentum, release to fall. Contact with the diamond gains progress; losing contact reduces it. Zero escapes, 100% samples and reveals an item. Every catch uses the same predictable trajectory, independent of nearby enemies and passive buffs.

## Catch buffs and special-only leveling

Every successful catch, including junk, automatically awards one random, stacking passive buff:

- Fleet Footed: +5% base movement speed.
- Heavy Hitter: +8% base damage.
- Hardy: +10 maximum health and +10 current health.
- Tough Scales: damage resistance with diminishing returns, approaching 50%. First stack grants 5%.

Failed/abandoned catches grant no buffs or XP. Bots receive the same buffs.

Catches grant 30 XP; confirmed eliminations grant 90 XP once per opponent. Level 2 requires 90 XP, and each subsequent threshold increases by 45. Overflow carries forward. Every level queues a choice of **special attack only**:

- Tidal Cannon: one R charge; aimed piercing wave, 65 damage, strong knockback.
- Whirlpool Burst: one T charge; radial blast within 155 units, 45 damage, strong knockback.

Passive damage and armor apply to specials as well. Specials consume one charge and share attack recovery. They cannot fire during fishing. Charges are abilities shown separately from the two equipment slots. Choice panels do not pause gameplay. All health, items, buffs, XP, and charges reset on restart/reload.

## HUD and architecture

The canvas fills the viewport with no scrolling. The hotbar, backpack button, health, XP, and abilities overlay gameplay. The compact reeling meter appears on the right only after a bite, without shifting the camera. Mouse aiming uses the same camera transform as rendering.

- `src/fishing.js`: catch state machine and loot pool.
- `src/inventory.js`: permanent rod, one finite-use item.
- `src/progression.js`: random catch passives, XP, special choices and charges.
- `src/combat.js`: shared damage, melee, projectiles, healing, specials.
- `src/bots.js`: autonomous equipment acquisition and combat decisions.
- `src/world.js`: actors, match lifecycle, movement, shoreline rules, simulation events.
- `src/renderer.js`: arena, actors, health bars, fishing lines, projectiles and effects.
- `src/main.js`: inputs, fixed 120 Hz loop, HUD, restart.
- `tests/`: simulation coverage for fishing, inventory, shoreline movement, buffs, combat, bots, and victory/death.

## Limits

This is a prototype with basic AI and initial balance values. Online play uses PeerJS and the host browser. No persistence or environmental damage yet. Desktop keyboard and mouse are required. Bots use automated fishing input and simple nearest-opponent targeting; combat tuning and richer AI are next.





## Soundtrack

`assets/battle-music.mp3` is the user-provided paulyudin-battle-battle-music-491417 track (2:42). Background music loops at 30% default volume after the first click or keypress. The in-game music controls support mute and volume adjustment. `src/music.js` owns a single audio instance so match restarts do not interrupt playback. Reloading the page resets audio settings. Browsers may require another user gesture to resume playback after interruption.


The playlist now alternates Battle Music (Paulyudin, 2:42) and Armageddon (Alibi Music, 3:32), then repeats. Volume and mute apply to both tracks.

## Mobile controls

On phones, a joystick at the bottom right controls movement and facing. The bottom-left **Use** button uses the selected item; with the rod selected it casts, becomes **Cancel** while waiting, and becomes **Reel** during the catch. Hold Reel to raise the fishing bar and release it to lower the bar. Tap water to aim before casting. Tap **Examine** near a landmark, the hotbar to select an item, and the map to open or close it. The inventory sits above the controls in portrait mode. Both thumbs work independently, and input releases on interruption or when opening the map.

## First NPC

Mara stands on the shore beside the broken boat at Reedwater Landing. Walk close
and press **G**, or tap the mobile **Talk** button (which replaces Examine nearby).
She says **Hello!** in a speech bubble. The greeting can be repeated and fades
after five seconds or when you walk away. She is a friendly character, separate
from combat, fishing rewards and landmark discovery counts.

## Entity sprites

New entities use a shared artwork registry. Replace files in `assets/` and adjust
`src/sprite-definitions.js` for different frames, animations or visual scale;
behaviour, health, collision sizes and drops stay separate. Existing rabbits,
Mara, the explorer, wildlife and projectiles are connected, with drawn fallbacks
where no image is configured. See [the replacement guide](docs/ENTITY-SPRITES.md).

## Entity categories and passive hunting

Mara is a friendly **NPC** with talk interaction only. Weapons and specials cannot target or harm her.

Five rabbits, one turtle and one eel are **passive** and flee from disturbance or injury. The two deer are **defensive**: they ignore nearby players and retaliate only after being hurt, with dodgeable attacks and bounded pursuit. The turtle and eel swim within water; land animals stay on navigable land. Health and positions persist when moving between areas.

Equip a weapon caught while fishing, aim at an animal, and click or use the mobile **Use** button. Melee needs facing and reach; projectiles can hit swimming animals. Injured animals show health and category labels. A successful hunt awards XP once and records the species in the journey's hunt tally. Defeated animals fade out and stay hunted for this journey; a new game resets them. Mara and landmark discovery counts stay separate from hunting.

`src/entities.js` defines **passive**, **defensive** (retaliates when provoked) and **aggressive** (initiates pursuit) reaction policies. Passive animal AI and defensive deer retaliation are active; aggressive AI is a future addition. Species health, hit radius, habitat, speeds and hunting XP are configured independently of `src/sprite-definitions.js`. No crafting drops or harvesting economy have been added yet.

## Mara's first quest

Talk to Mara by the broken boat to accept **Mara's supper**: catch and bring her one Sardine. Talk again with a Sardine anywhere in your backpack to hand over exactly one and earn **15 XP**, in addition to the normal fishing catch XP. The objective beneath the upgrade timer shows whether you have a Sardine ready. Eating it removes readiness. Mara thanks you on later visits and never repeats the reward. Quest progress persists across area travel within a journey; starting a new journey or reloading resets it, like inventory and hunting progress.

## Backpack

The backpack icon above the hotbar (or **B**) opens inventory. Catches go directly to backpack storage and do not fill the hotbar. Backpack storage has no item limit in exploration; filling all six hotbar shortcuts does not block fishing. Each item keeps its own remaining uses.

Filter by Consumables, Weapons, Armor, Quest items, Trophies, or Upgrade materials. Selecting an item offers Use, Throw into world, Discard, and Add to hotbar. Add to hotbar lets you choose slot 2–7; replacing a shortcut keeps the old item in your backpack. Using or removing an item updates all shortcuts to that item. Use activates one charge in your current facing direction without assigning a shortcut. Armor and materials without a gameplay use have Use disabled.

Thrown items land on nearby walkable ground. Approach and Examine (G, or mobile Pick up) to recover them with their remaining uses. Drops persist in their area during the current journey. Discard removes the item permanently. Mara can accept a sardine directly from backpack storage. Escape, Close, or tapping outside dismisses the panel. Exploration pauses while it is open; finish or abandon fishing before item actions. Starting a new journey or reloading resets inventory and dropped items. New items declare a category using the IDs in `src/inventory.js`.
