# Swappable entity artwork

Artwork is configured in `src/sprite-definitions.js`. Simulation stays in the entity's behaviour module. Changing a picture or visual scale does not change its health, movement, hitbox, interaction distance or drops.

## Replace a sprite

1. Put the new PNG, WebP or other browser-supported image in `assets/`.
2. Update the entity's `asset` in the sprite definitions. If replacing the same file with the same layout, no config change is needed.
3. Adjust `frames` or `frameSize`, `animations`, `scale`, `anchor` and `offset` if the sheet layout or appearance changes.
4. Run `node --test`, preview the result, then build and deploy. Image contents contribute to the release version, so replacing an image at the same filename still refreshes it on players' devices.

Mara, the explorer, eel and projectiles currently use drawn placeholders. Set their `asset` to an image filename to replace that artwork. Set it back to `null` to restore the fallback. Rabbits use the shared sprite loader with the existing 23 crops; deer (`deer-sheet.png`, 64×64 grid) and turtle (`turtle-sheet.png`, 96×64 grid) use regular grid sheets.

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
