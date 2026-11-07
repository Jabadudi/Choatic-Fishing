# Second advancement: Current

Unlocks at level 30. Open Skills > Region Core > Current, learn a skill and equip an active or buff into an open wheel slot. Learning Undertow opens slot three. Set the Hook requires Reedwater's Call level 10; Reading the Current requires Set the Hook level 1.

Values scale linearly from skill level 1 to maximum:

| Skill | Level 1 to maximum |
| --- | --- |
| Undertow (10 levels) | 24 to 18 reserves; 14 to 10s cooldown; 3 to 5s duration; 100 to 140 radius; 55 to 90 pull speed; 25 to 45% slow |
| Set the Hook (10 levels) | 18 to 12 reserves; 8 to 5s cooldown; 20 to 44 damage; 100 to 180 reel distance |
| Waterstep (5 levels) | 20 to 16 reserves; 24 to 18s cooldown; 6 to 10s duration |
| Reading the Current (5 levels) | +8 to 20% Core line damage; 2 to 5 reserves returned per landed hit |

Waterstep's learned passive gives +3 to 6% movement speed and 2 to 5% evasion without occupying a wheel slot. Activating the buff adds +15 to 30% movement speed and 10 to 20% evasion. The bonuses add together: at maximum rank, the active totals are +36% movement and 25% evasion. Dash recharge and immunity duration are unchanged. Evasion rolls once per eligible incoming attack using simulation randomness. An evaded hit deals no damage or knockback and applies no grab or on-hit reaction; a projectile is still consumed. No roll occurs with zero evasion or during dash immunity.

Undertow is control, without periodic damage, and only affects huntable current-area animals. Hook uses a travelling line and collision-aware reeling; gameplay radius 24 or greater, or bosses, pull Eli instead. NPCs cannot be hit. Reading the Current applies to Reedwater's Call and Set the Hook; reserves remain capped.

Artwork lives in assets/core with mappings in sprite-definitions.js, loads through sprites.js, and draws in core-art.js. Effects have drawn fallbacks. Gameplay numbers do not depend on image dimensions. Waterstep reuses the ripple trail; evasion shows EVADE text. These are lightweight effects, not frame-by-frame sprite animations.

Saves retain existing learned levels and wheel slots. Waterstep keeps the internal riverstep ID for compatibility. No save format change is needed. Temporary buffs, fields and hook targets are not saved. Tethers and fields clear on area change or defeat.


## Third and fourth advancements

At level 60: Tidewall blocks hostile projectiles and slows crossing animals; Floodline launches three homing lines; Core Flare is a castable 120-second damage buff (+15 to 35%) with no detection penalty; Heron's Patience continuously adds 2 to 6 reserves per second, including while moving.

At level 100: Reedwater Rising sends a piercing wave (90 to 180 base damage); The Land Remembers prevents a fatal hit once per 180 to 120 seconds, leaving 1 HP and triggering Still Water; Delta Bond grants near-water damage and resistance; Chosen of Reedwater grants temporary damage and resistance. These retain the tier-specific skill points, prerequisites and learned-level save format.

Visuals are an initial code-animated effect pass with SVG assets and visible fallbacks. The concept illustrations are art direction, not finished sprite sheets.
