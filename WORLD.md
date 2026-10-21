# The Wilds — first playable world

This replaces the PvP lobby in the player flow with a solo exploration prototype.
Choose **Enter the Wilds** to begin at Reedwater Landing on the southern delta.

The continent measures 6,400 × 4,800 world units. Its fixed seed creates repeatable
scenery and connected routes, matching the concept atlas's broad geography:

- Frostspire Mountains and Dragon Cave in the north.
- Ember Volcano in the northeast; tar pits farther south.
- Whispering Forest in the west; Verdant Jungle in the southwest.
- Crystal Lakes centrally, joined to the southern delta by Silverflow River.
- Gold Mines in the southeastern foothills.

WASD moves, mouse aims, E casts or abandons fishing, Space reels, Left Shift dashes,
G examines nearby landmarks, and M opens or closes the atlas. The minimap button
also opens the atlas. Old trails bridge rivers and link every landmark. Water,
tar pools and the volcano crater block walking off those trails. Fishable water
uses the same geographic geometry as the world renderer.

The pixel scenery, explorer, wildlife, and atlas are original canvas drawings
with a handheld dungeon-adventure visual influence. No Pokémon sprites or other
commercial game artwork are included. Nearby terrain is cached in 512-unit
sections, capped at 30 sections; the whole continent is never allocated as one
large image. The atlas background is generated once per canvas size.

This is a geography and exploration foundation. Landmarks can be discovered and
examined, but there are no enterable dungeon interiors, mining mechanics, quests,
story illustration checkpoints, or save/load yet. Wildlife is ambient scenery.
Fishing, inventory, regeneration, dashing and timed upgrade choices still work.
Reloading starts a new journey. Internal arena modules/tests remain for the shared
fishing and movement systems, but the old PvP flow is hidden from the game menu.
