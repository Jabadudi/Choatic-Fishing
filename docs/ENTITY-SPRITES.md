# Swappable entity artwork

Artwork is configured in `src/sprite-definitions.js`. Simulation stays in the entity's behaviour module. Changing a picture or visual scale does not change its health, movement, hitbox, interaction distance or drops.

## Replace a sprite

1. Put the new PNG, WebP or other browser-supported image in `assets/`.
2. Update the entity's `asset` in the sprite definitions. If replacing the same file with the same layout, no config change is needed.
3. Adjust `frames` or `frameSize`, `animations`, `scale`, `anchor` and `offset` if the sheet layout or appearance changes.
4. Run `node --test`, preview the result, then build and deploy. Image contents contribute to the release version, so replacing an image at the same filename still refreshes it on players' devices.

Eli uses `story/eli-sheet.png` (see below). Mara, the other explorers, eel and projectiles currently use drawn placeholders. Set their `asset` to an image filename to replace that artwork. Set it back to `null` to restore the fallback. Rabbits use the shared sprite loader with the existing 23 crops; deer (`deer-sheet.png`, 64×64 grid) and turtle (`turtle-sheet.png`, 96×64 grid) use regular grid sheets.

## Standard for moving entities: the Eli walk set

Every character, NPC, creature and enemy that moves gets the same art and layout as Eli: 16-bit SNES-style pixel art with clean dark outlines and a limited palette, and a 4-direction walk (right, left, toward the camera, away from the camera) on a flat `#00FF00` background with a shared baseline. Eli's walk has 8 frames per direction; every other character, NPC, creature and enemy has 6. Sheets are packed 8 cells wide either way, and `walkClips(frames, cycle)` in `src/sprite-definitions.js` builds the clips. `cycle` is the seconds one stride loop takes, so a 6-frame and an 8-frame walk move at the same pace, and older 8-frame NPC sheets keep working. Extra actions, such as Eli's throw, go in further rows of the same sheet.

`scripts/prepare-eli-sprites.py` turns the source sheets in `art/sprites/characters/eli/` into `assets/story/eli-sheet.png`: green removed, every frame in a 126×120 cell, feet on the baseline and head centred. Copy it for the next entity.

```js
eli:{asset:'story/eli-sheet.png',frameSize:[126,120],columns:8,scale:.5,anchor:[.5,1],offset:[0,15],
 mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[16]},'idle:up':{frames:[24]},'idle:right':{frames:[37]},
  'walk:right':{frames:[0,1,2,3,4,5,6,7],fps:10},'walk:left':{frames:[8,9,10,11,12,13,14,15],fps:10},
  'walk:down':{frames:[16,17,18,19,20,21,22,23],fps:10},'walk:up':{frames:[24,25,26,27,28,29,30,31],fps:10},
  throw:{frames:[32,33,34,35,36,37],fps:8,loop:false}
 }}
```

Simulation records `facing` (`right`, `left`, `up` or `down`, from `facingFor(dx,dy)` in `src/entities.js`) and `steppedAt` on each step; the renderer passes them as `direction` and plays `walk` for a recent step, `idle` otherwise. A clip named for the direction is drawn as is. A missing one listed in `mirrorDirections` borrows its twin and is flipped, so `idle:left` is the right-facing stand mirrored. Clips without a direction, such as `throw`, fall back to `mirror` and `facingX`.

## Example: deer sprite sheet

```js
deer:{
 asset:'deer-sheet.png',
 frameSize:[64,64], columns:4,
 scale:.75, anchor:[.5,1], offset:[0,20],
 animations:{
  idle:{frames:[0,1],fps:2},
  walk:{frames:[4,5,6,7],fps:8},
  'walk:north':{frames:[8,9,10,11],fps:8},
  hurt:{frames:[12,13],fps:10,loop:false},
  death:{frames:[14,15],fps:6,loop:false}
 }
}
```

This config describes artwork. Hunting now supplies `hurt`, `walk` and `death` for the existing wildlife; the behavior and combat modules control when those states occur. A missing animation uses `idle`, or frame zero if there is no idle clip.

Use `frames:[[x,y,width,height], ...]` instead of `frameSize` for irregular crops. `anchor:[.5,1]` pins the bottom centre; `offset` aligns it with the existing ground position. `scale` changes the artwork only. Set `mirror:'left'` for sheets whose default facing points left. Renderers can provide a named direction to select clips such as `walk:north`; mirror flipping stays a visual decision.

## New entity rendering

```js
const drawn=drawEntitySprite(ctx,entity.spriteId,{
 x:entity.x,y:entity.y,
 state:entity.state,time:entity.animationTime,
 direction:entity.facing,flipX:entity.direction.x>0
});
if(!drawn)drawExistingPlaceholder(ctx,entity);
```

The shared loader caches each image, validates crops against the loaded sheet, and returns `false` for missing images or incompatible frames. It never receives or changes the entity's gameplay state. Names, health bars and dialogue remain separate overlays.

Dropped inventory items use the `pickup` sprite definition and a visible bag fallback. Drop positions, pickup distance, item identity and remaining uses live in simulation, independently of this artwork.
