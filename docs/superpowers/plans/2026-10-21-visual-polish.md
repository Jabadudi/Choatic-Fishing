# Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the approved mockup (`mockup/2-after.jpg`) into the real game: golden-hour atmosphere, richer water, shadows, tree sway, landmark polish, and a decluttered exploration HUD.

**Architecture:** Static detail goes into the existing 512-unit chunk cache in `wilds.js`. Animated layers (water shimmer and foam, landmarks, tree crowns, atmosphere) are drawn per frame in world space over the visible view only. Atmosphere lives in a new `src/atmosphere.js`. HUD state comes from a small pure module, `src/hud.js`, so it can be tested without a DOM.

**Tech Stack:** Vanilla JS ES modules, Canvas 2D, `node --test`.

**Spec:** `docs/superpowers/specs/2026-10-21-visual-polish-design.md` (visual reference: `mockup/index.html`, `mockup/2-after.jpg`)

## Global Constraints

- Chunk cache stays 512 units, max 30 chunks. Full-area images are never allocated.
- Collision, `walkable`, `waterDistance`, `sceneryAt` and the arena/PvP flow are unchanged. Arena mode renders exactly as before.
- Rendering must run headless. Touch `document` only behind `typeof document!=='undefined'`.
- The particle pool is capped at 60 and allocates nothing per frame.
- Per-frame water work must not call `waterDistance` per pixel. Use per-chunk cached point lists.
- All 53 existing tests keep passing.
- Light comes from the upper left. Shadows offset down and right.
- Match the existing code style: compact one-line functions, single-space indentation, no new dependencies.

## Review Focus

1. Area transition (landing → Windchime Path): the water and crown caches are keyed per area, so there is no landing water drawn in the forest. Test in Task 3.
2. Window resize or DPR change: atmosphere covers the whole view rect at any zoom, with no uncovered strip. Test in Task 1 (fill rect equals the view).
3. Arena/practice mode: no atmosphere and no HUD hiding. Tests in Tasks 1 and 5.
4. Standing still for a long time: particles keep wrapping inside the view and never escape or NaN. Test in Task 1.
5. Many trees on screen: crown sprites are cached once per tree variant, not per tree per frame. Test in Task 2.

---

### Task 1: Atmosphere layer

**Files:**
- Create: `src/atmosphere.js`
- Modify: `src/renderer.js` (call after the explorer and effects, adventure only)
- Test: `tests/atmosphere.test.js`

**Interfaces:**
- Produces: `createParticles(count=60, random=Math.random) -> Array<{x,y,kind,phase,speed}>`. `x` and `y` are view-relative 0..1. `kind` is one of `'pollen'|'leaf'|'fly'`, split 34/12/14 for count 60 and scaled proportionally otherwise.
- Produces: `stepParticles(list, dt, t) -> void`. Mutates in place and wraps to 0..1.
- Produces: `drawAtmosphere(ctx, world, view) -> void`. `view` is `{left,top,right,bottom}` in world units. Uses a module-level particle pool created lazily, with fireflies drawn only when `nearWater(player)` or the region is Forest Approach or Windchime Path.

- [ ] **Step 1: Write failing tests**

```js
test('particle pool is capped and stepping does not grow or escape',()=>{
 const p=createParticles(60,()=>.5);assert.equal(p.length,60);
 assert.deepEqual(['pollen','leaf','fly'].map(k=>p.filter(q=>q.kind===k).length),[34,12,14]);
 for(let i=0;i<20000;i++)stepParticles(p,1/60,i/60);
 assert.equal(p.length,60);assert.ok(p.every(q=>q.x>=0&&q.x<=1&&q.y>=0&&q.y<=1&&Number.isFinite(q.x)));
});
test('atmosphere draws headless over the full view, and only in adventure',()=>{
 const fills=[],grad={addColorStop(){}};
 const ctx=new Proxy({fillRect(...a){fills.push(a);},createLinearGradient:()=>grad,createRadialGradient:()=>grad},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
 const w=new World(()=>0,{adventure:true}),view={left:100,top:200,right:1060,bottom:920};
 drawAtmosphere(ctx,w,view);assert.ok(fills.some(([x,y,a,b])=>x===100&&y===200&&a===960&&b===720));
 fills.length=0;drawAtmosphere(ctx,new World(()=>0,{botCount:0}),view);assert.equal(fills.length,0);
});
```

- [ ] **Step 2:** Run `node --test tests/atmosphere.test.js`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement `src/atmosphere.js`.** Port the mockup's `atmosphere()` but draw in world space over `view`:
  - Grade: a `soft-light` warm linear gradient (`rgba(255,190,90,.75)` → `rgba(255,140,80,.25)`), then a `multiply` cool bottom gradient (white at 45% height → `rgb(150,165,205)` at the bottom).
  - Shafts: 4 `screen` diagonal bands, rotation −0.5, alpha `.07+.03*sin`.
  - Particles: drawn at `view.left+x*width`.
  - Vignette: radial, inner radius `.38h`, outer `.85h`, edge `rgba(10,20,25,.55)`.
  - Always restore `globalCompositeOperation` to `source-over`.
- [ ] **Step 4:** In `render()`, add `if(world.adventure&&view)drawAtmosphere(ctx,world,view);` as the last line.
- [ ] **Step 5:** Run `node --test`. Expected: all pass (55).
- [ ] **Step 6:** Commit: `git add src/atmosphere.js src/renderer.js tests/atmosphere.test.js && git commit -m "Add golden-hour atmosphere layer"`

### Task 2: Shadows and tree sway

**Files:**
- Modify: `src/plains-art.js` (`leafyTree`, `meadowRock`, `meadowBush`)
- Modify: `src/wilds.js` (`staticArea` scenery loop, `drawWilds`, `drawExplorer`)
- Test: `tests/wilds.test.js` (append)

**Interfaces:**
- Produces: `leafyTree(ctx,x,y,big=false,part='all')`, where `part` is `'all'|'trunk'|'crown'`. The crown is drawn relative to the same origin.
- Produces in `wilds.js`: `crownSprite(big) -> HTMLCanvasElement|null`. Cached in a Map keyed by `big`, and `null` when there is no `document`.
- Produces: `crownCacheSize() -> number` (exported for the test).

- [ ] **Step 1: Write failing test**

```js
test('tree crowns use one cached sprite per variant and leafyTree supports parts',()=>{
 const calls=[];const ctx=new Proxy({fillRect(){calls.push(1);}},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
 leafyTree(ctx,0,0,false,'trunk');const trunk=calls.length;calls.length=0;leafyTree(ctx,0,0,false,'crown');
 assert.ok(trunk>0&&calls.length>trunk);assert.equal(crownCacheSize(),0); // headless: no sprites
});
```

- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Shadows.** Replace each shadow `oval` in `plains-art.js` with one soft shadow offset `(+18,+10)`, colour `#1f3a3550`, sized to the object: tree 34×10, rock 22×7, bush 20×6. Make the `drawExplorer` shadow an ellipse at `(x+5,y+14)`, 15×5, `rgba(30,40,50,.3)`.
- [ ] **Step 4: Sway.** With a `document`:
  - `staticArea` draws trees as `'trunk'` only.
  - `drawWilds` draws crowns per frame, after landmarks and before wildlife, for visible `sceneryAt` trees, using `ctx.drawImage(crownSprite(false), x-48+sway, y-100)`.
  - `sway=Math.round(Math.sin(world.elapsed*1.2+hash(gx,gy,21)*6)*1.5)`.
  - The sprite is 96×112, painted once via `leafyTree(c,48,100,false,'crown')`.
  - Headless keeps `'all'` in `staticArea`.
- [ ] **Step 5:** Run `node --test`. Expected: all pass.
- [ ] **Step 6:** Commit: `"Add consistent shadows and swaying tree crowns"`

### Task 3: Water depth, shore detail, live shimmer

**Files:**
- Modify: `src/wilds.js` (`staticArea` water branch and lake detail loop; new live water pass)
- Test: `tests/wilds.test.js` (append)

**Interfaces:**
- Produces: `shorePoints(id, cx, cy) -> {foam:Array<[x,y]>, sparkle:Array<[x,y,phase]>}`, cached per `${id}:${cx},${cy}`. Foam points are on a 4-unit grid where `-6<waterDistance<0`. Sparkle points are on an 18-unit grid where `waterDistance<-20`, with phase `hash(x,y,11)`.
- Produces: `drawWater(ctx, world, view) -> void`, called inside `drawWilds` right after `drawChunks` (adventure areas with water only).

- [ ] **Step 1: Write failing tests**

```js
test('shore points are cached per area and empty in Windchime Path',()=>{
 const a=shorePoints('landing',1,3);assert.ok(a.foam.length>0);assert.equal(shorePoints('landing',1,3),a);
 assert.equal(shorePoints('windchime',1,3).foam.length,0);
});
```

(Chunk (1,3) covers x 512–1024 and y 1536–2048, which contains the big lake shore.)

- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Cached depth.** In `staticArea`, replace the flat water colours with a 4-band ramp by `wet`: `>-14 '#7cc8bd'`, `>-40 '#3ea6b0'`, `>-110 '#2a86a3'`, else `'#1f6690'`. Sea uses the same ramp, one step darker. Remove the dash marks (`r<.3` strokes).
- [ ] **Step 4: Cached shore detail.** In the 24-unit cluster loop:
  - Lily pads (`-110<wet<-18`, `r>.8`, landing lakes only, not sea), with a pink flower when `r>.93`.
  - Reed clumps (`-16<wet<-2`, `r>.55`): 4 stalks with a cattail, as in the mockup.
  - Drawn static (the reed sway in the mockup is dropped; this keeps it in the cache).
- [ ] **Step 5: Live layer.** `drawWater`:
  - For each visible chunk, take `shorePoints`.
  - Foam: draw 4×2 rects with alpha `.55+.3*sin(t*2+x*.1)`, shown only when `waterDistance` band `> -1-2.5*(1+sin(t*1.6+x*.03))`. Store `d` in the point (`[x,y,d]`) so no per-frame `waterDistance` call is needed.
  - Sparkle: draw a 2×2 or 4×2 cross when `(phase+t*.25)%1<.06`.
- [ ] **Step 6:** Run `node --test`. Expected: all pass.
- [ ] **Step 7:** Commit: `"Add water depth, lily pads, reeds and live shore foam"`

### Task 4: Landmarks and parchment labels

**Files:**
- Modify: `src/wilds.js` (`staticArea` landing block, `chimes`, `drawLandmark`, exit signs in `drawWilds`)
- Test: `tests/wilds.test.js` (append)

**Interfaces:**
- Produces: `labelAlpha(distance) -> number`. Returns 1 at ≤140, 0 at ≥220, and is linear in between.
- Changes: `drawLandmark(ctx, p, t, alpha)`.

- [ ] **Step 1: Write failing test**

```js
test('landmark labels fade in near the player',()=>{
 assert.equal(labelAlpha(100),1);assert.equal(labelAlpha(220),0);assert.equal(labelAlpha(500),0);assert.ok(Math.abs(labelAlpha(180)-.5)<1e-9);
});
```

- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3: Cached art (`staticArea`).**
  - Drowned-road pillars get moss (`#5f8a4a` tufts), a crack line, and a darker waterline. The submerged paving uses `rgba(150,200,190,.35)` tiles, as in the mockup.
  - The dock gets posts under every third plank (`#4a3a28`) and alternate plank shading.
- [ ] **Step 4: Animated (`drawLandmark`).**
  - Chimes swing: each chime is offset by `sin(t*1.8+i)*3` at the bottom (drawn as a short polygon).
  - Spring: 4 bubbles rising on a 2-second loop.
  - Dock lantern at (1292,1730), with a `screen` radial glow of radius 70 (`rgba(255,205,120,.55)`), drawn in `drawWilds` for landing.
  - Labels: a parchment tag (`#f1e3bd` fill, `#6b5530` 2px border, `#2b2a1e` 11px monospace text) with `globalAlpha=labelAlpha(dist to player)`. Exit signs use the same tag, always at alpha 1.
- [ ] **Step 5:** Run `node --test`. Expected: all pass.
- [ ] **Step 6:** Commit: `"Polish landmarks and fade-in parchment labels"`

### Task 5: Exploration HUD

**Files:**
- Create: `src/hud.js`
- Modify: `src/main.js` (`updateUI` exploring branch, injected HUD markup), `style.css` (new `body.exploring` block at the end), `index.html` (only if the markup can't be injected; prefer injecting from `main.js` as existing code does)
- Test: `tests/hud.test.js`

**Interfaces:**
- Produces: `explorationHud(world, exploringSeconds) -> {hintVisible:boolean, dots:boolean[], prompt:string|null, upgradeFraction:number}`.
  - `hintVisible` is `exploringSeconds<10`.
  - `dots` is the discovery state of each place in `placesFor(areaId)`.
  - `prompt` is `` `Examine ${place.name}` `` when `nearestLandmark` finds a place, otherwise `null`.
  - `upgradeFraction` is `1-upgradeRemaining/30`, clamped to 0..1.

- [ ] **Step 1: Write failing test**

```js
test('exploration HUD state: hint timeout, dots, prompt and upgrade bar',()=>{
 const w=new World(()=>0,{adventure:true});
 let s=explorationHud(w,0);assert.equal(s.hintVisible,true);assert.equal(s.dots.length,5);assert.ok(s.dots.every(d=>!d));
 assert.equal(explorationHud(w,10).hintVisible,false);
 Object.assign(w.player,{x:620,y:1640});assert.equal(explorationHud(w,0).prompt,'Examine The Drowned Road');
 w.inspect();assert.equal(explorationHud(w,0).dots.filter(Boolean).length,1);
 const f=explorationHud(w,0).upgradeFraction;assert.ok(f>=0&&f<=1);
});
```

- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement `src/hud.js`.
- [ ] **Step 4: Markup and CSS.** Port the mockup HUD styles.
  - Journey card: a `#exploration-hud` restyle plus a `.dots` row.
  - `.upg` thin bar: restyle `#upgrade-timer` with an inner fill element.
  - Hint pill, shown only while `hintVisible`.
  - Minimap: a parchment frame on `#open-atlas`.
  - Music: `#music-toggle-icon` ♪ round button, which toggles `.music-hud.open`. `.music-hud` is hidden unless open.
  - Examine prompt: parchment, positioned above the player at centre, `top:56%`.
  - Hotbar: slim 56px slots, labels below.
  - Dash pips: one 14×5 pip per charge, inside a `.dash` beside the hotbar.
  - Under `body.exploring`, hide: `.health-hud`, `.progression`, `#alive-text`, `#fire-tidal`, `#fire-whirlpool`, `#leave-lobby`, `.controls`, `#build-summary`, `#buff-text`, and `.status` when the message is empty.
  - Arena mode is untouched (all new rules are scoped to `body.exploring`).
- [ ] **Step 5:** Wire `updateUI` to use `explorationHud(world,(performance.now()-exploreStart)/1000)`. Set `exploreStart` in `$('explore-world').onclick`.
- [ ] **Step 6:** Run `node --test`. Expected: all pass.
- [ ] **Step 7:** Commit: `"Declutter exploration HUD"`

### Task 6: Verify, screenshot, clean up

- [ ] **Step 1:** Run `node --test`. Expected: 53 existing tests plus the new ones, 0 fail.
- [ ] **Step 2:** In the browser at `http://127.0.0.1:5173/`, enter the Wilds. Take screenshots at the spawn/dock, the Drowned Road, the Spring, and Windchime Path. Send them to the user with `SendUserFile`.
- [ ] **Step 3:** Frame-time check: in the console, measure 300 frames via `requestAnimationFrame`. Expected average below 16.7ms. If crowns cost too much, apply the spec's fallback (sway only within 400 units of the player).
- [ ] **Step 4:** Click Practice/arena (if still reachable through internal flow) or trust the tests. Confirm no console errors.
- [ ] **Step 5:** Remove `mockup/` and `.claude/launch.json` from the branch (they were never committed). Commit any final fixes.
