# The Wilds — Visual Polish Pass (Design)

Date: 2026-10-21 · Branch: `visual-polish`

## Goal

Make Reedwater Landing and Windchime Path feel closer to the reference art in
`Desktop/CHAOTIC FISHING` (LOOKS: lush pixel meadow with rock-rimmed ponds; STORY
CHECKPOINT: warm golden-hour light, mist, depth). Approach A: layer polish onto the
existing procedural Canvas renderer. No WebGL, no new painted asset files.

## Constraints

- Terrain stays in the existing 512-unit chunk cache (max 30 chunks). Anything
  static goes into the cache; anything animated is drawn per frame, limited to the
  visible view.
- Game logic, collision (`walkable`, `waterDistance`, `sceneryAt`) and the hidden
  PvP/arena systems are unchanged.
- All 53 existing tests keep passing. Rendering code must still run headless in
  tests (no `document` access outside the existing `typeof document` guards).
- Target 60 fps at the existing DPR cap; per-frame additions must not allocate.

## 1. World atmosphere and depth

New module `src/atmosphere.js`, called from `render()` after world and actors, in
screen space, adventure mode only.

- **Colour grade:** a fixed golden late-afternoon look. A warm `soft-light`/`overlay`
  wash on top plus a cool tint toward the bottom. There is no day/night cycle.
- **Vignette:** radial gradient darkening the screen edges. The gradient is cached
  and rebuilt only on resize.
- **Light shafts:** 3–4 faint diagonal bands drifting slowly from upper left.
- **Particles:** a fixed pool (cap 60) of pollen motes and falling leaves. Fireflies
  (glowing dots) appear only near water or in Forest Approach / Windchime Path.
  Particles live in world space and are wrapped and recycled when they leave the
  view. Their update uses the world's elapsed time, with no per-frame allocation.
- **Shadows:** one consistent soft drop shadow, offset down and right (light from
  the upper left), under trees, rocks and bushes in `plains-art.js`. Ellipse
  shadows under the explorer and the rabbits.
- **Tree sway:** tree crowns are pre-rendered once into a small sprite cache, and
  trunks stay in the chunk. Crowns within view are drawn per frame with a small
  sine offset per tree. Fallback: if crown drawing measurably costs frame time,
  keep crowns static in the cache and apply sway only to nearby trees.

## 2. Water and landmarks

In `wilds.js`:

- **Depth gradient (cached):** light teal shallows → mid → deep blue sea, banded by
  `waterDistance`, replacing the current flat dashes.
- **Live water layer (per frame, visible area only):** a small set of sparkle
  highlights that blink at hashed positions, plus a pulsing foam line along the
  shore. Positions are sampled on a coarse grid within the view so the cost is
  bounded.
- **Lake rims (cached):** rounded stones around lakes, lily pads (some with flowers)
  and reed clumps in the shallows.
- **Landmarks:**
  - Drowned road: mossy, cracked pillars and visible submerged paving.
  - Dock: posts, plank shading, and a lantern with a soft glow.
  - Three Chimes: wooden frame, and chimes that swing (animated).
  - Spring: rising bubbles (animated).
  - Hollow tree: larger shadow.
- **Labels:** landmark names are drawn as a parchment tag that fades in only when
  the player is within ~220 units. The exit signs get the same style.

## 3. HUD declutter

In `index.html`, `style.css` and `main.js`, applied under `body.exploring`:

- **Hidden while exploring:** HP and XP bars, `#alive-text`, Tidal Cannon and
  Whirlpool buttons, `#leave-lobby`, the permanent `.controls` text,
  `#build-summary`. Arena mode keeps everything as it is.
- **Journey card (top left):** translucent, showing region, discovered count, and the
  G prompt only near a landmark.
- **Minimap (top right):** gets a parchment frame.
- **Hotbar:** slimmer slots.
- **Dash:** a small pip and charge indicator beside the hotbar.
- **Upgrade timer:** a thin progress bar. The choice panel appears only when an
  upgrade is pending.
- **Music:** a small ♪ icon button that toggles a popover with mute and volume.
- **Controls hint:** shown for the first 10 seconds of exploring, then fades out.
  Still listed on the title card.
- **Status line:** shows only contextual messages (fishing state, examine text)
  and fades out when there is nothing to say.
- **Type and colour:** monospace for labels, Georgia for headings, a parchment and
  moss palette, and a refreshed title card.

## Testing

- `node --test` passes (53 existing tests).
- New tests:
  - The particle pool never exceeds its cap, and stepping does not grow arrays.
  - `drawAtmosphere` runs headless against a stub context.
  - In exploration mode, the combat HUD elements are hidden by the CSS class rules.
    This is verified as a unit check on the state function that toggles classes
    and visibility.
- Manual: before/after screenshots in the browser, walking the landing, a lake,
  the dock and Windchime Path. Confirm there is no visible stutter.

## Out of scope

Seasons/biomes, day/night cycle, new areas, new creature sprites, sound changes.
