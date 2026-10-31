// Artwork only. Behaviour, health, collisions and rewards belong to entity systems.
// Files live in assets/. Use null to keep the existing drawn placeholder.
export const RABBIT_FRAMES=[
 [15,14,33,54],[70,14,33,54],[125,14,33,54],[178,17,35,51],
 [12,96,36,46],[66,108,37,37],[121,108,37,37],[176,107,37,37],
 [6,178,42,41],[61,175,46,44],[119,178,35,44],[175,179,36,42],
 [11,252,37,43],[63,260,42,35],[124,261,34,32],[179,261,34,32],
 [14,335,34,32],[70,310,33,54],[126,306,32,58],[183,303,30,61],
 [23,373,25,65],[78,373,25,65],[133,373,25,65]
];
// Walk clips for a sheet in the house layout: rows right, left, toward the camera, away, 8 columns wide.
// frames is how many frames each direction holds (8 for every walker), and a side can hold fewer than the others.
// cycle is the seconds per stride loop, so the pace stays the same whatever the frame count.
// layout 'columns' reads a sheet used as drawn from now on: 4 columns wide, one direction per column, frames top to bottom.
// The prep scripts turn column sheets into the row layout, so cut sheets keep the default.
export function walkClips(frames,cycle,{layout='rows'}={}){
 const counts=Array.isArray(frames)?frames:[frames,frames,frames,frames];
 const at=(d,i)=>layout==='columns'?i*4+d:d*8+i;
 return Object.fromEntries(['right','left','down','up'].map((dir,d)=>[`walk:${dir}`,{frames:Array.from({length:counts[d]},(_,i)=>at(d,i)),cycle}]));
}
export const SPRITES={
 // The second rows are runs, used by the guardian familiars. Both sheets face right; the village creatures stay on idle.
 rimejaw:{asset:'story/rimejaw-sheet.png',chromaKey:'green',frames:[[45,35,410,270],[475,35,410,270],[900,35,410,270],[1320,35,440,270],[10,330,292,225],[302,330,292,225],[598,330,292,225],[886,330,292,225],[1174,330,292,225],[1468,330,292,225]],scale:.27,anchor:[.5,1],offset:[0,12],mirror:'right',animations:{idle:{frames:[0,1,2,3],fps:2},walk:{frames:[4,5,6,7,8,9],fps:9}}},
 flitlynx:{asset:'story/flitlynx-sheet.png',chromaKey:'green',frames:[[70,25,330,300],[420,25,330,300],[765,25,330,300],[1110,25,330,300],...[0,1,2,3,4,5].map(i=>[i*256,340,256,290])],scale:.22,anchor:[.5,1],offset:[0,3],mirror:'right',animations:{idle:{frames:[0,1,2,3],fps:3},walk:{frames:[4,5,6,7,8,9],fps:10}}},
 'rimejaw-illustration':{asset:'story/rimejaw-pose.png',chromaKey:'green',frames:[[0,180,1254,900]],scale:.45,anchor:[.5,1]},
 'flitlynx-illustration':{asset:'story/flitlynx-pose.png',chromaKey:'green',scale:.42,anchor:[.5,1]},
 'villager-net':{asset:null,fallback:{coat:'#527a84',hair:'#33251f',skin:'#ae7855'}},
 'villager-basket':{asset:null,fallback:{coat:'#b38653',hair:'#503629',skin:'#e6bd94'}},
 'villager-smith':{asset:null,fallback:{coat:'#734a39',hair:'#252420',skin:'#ad7959'}},
 'villager-fisher':{asset:null,fallback:{coat:'#747d51',hair:'#b3afa0',skin:'#ddaa80'}},
 'villager-child-one':{asset:null,fallback:{coat:'#b26b58',hair:'#392b24',skin:'#d4a27a',visualScale:.7}},
 'villager-child-two':{asset:null,fallback:{coat:'#69849e',hair:'#503f2b',skin:'#e4c4a1',visualScale:.7}},
 // A portrait crop, not a gameplay actor or hitbox.
 'mara-portrait':{asset:'story/mara.webp',frames:[[850,130,500,620]],scale:.12,anchor:[.5,0],offset:[0,0]},
 'emilia-portrait':{asset:'story/emilia.png',frames:[[930,60,500,620]],scale:.12,anchor:[.5,0],offset:[0,0]},
 'drayfus-portrait':{asset:'codex/drayfus.png',frames:[[88,18,100,124]],scale:1,anchor:[.5,0],offset:[0,0]},
 // Made by scripts/prepare-eli-sprites.py from art/sprites/characters/eli/. Rows: walk right, left, toward the camera, away, then the throw.
 // This 4-direction, 8-frame walk is the standard layout for every moving entity.
 eli:{asset:'story/eli-sheet.png',frameSize:[126,120],columns:8,scale:.5,anchor:[.5,1],offset:[0,15],mirror:'right',mirrorDirections:{left:'right'},fallback:{hat:false,hair:'#49382d',shirt:'#b6ad8f'},animations:{
  idle:{frames:[16]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},'idle:right':{frames:[37]},
  'walk:right':{frames:[0,1,2,3,4,5,6,7],fps:10},'walk:left':{frames:[8,9,10,11,12,13,14,15],fps:10},
  'walk:down':{frames:[16,17,18,19,20,21,22,23],fps:10},'walk:up':{frames:[24,25,26,27,28,29,30,31],fps:10},
  throw:{frames:[32,33,34,35,36,37],fps:8,loop:false}
 }},
 // Made by scripts/prepare-chapter6-sprites.py from art/sprites/. Rows 0-3: walk right, left, toward the camera, away (the house layout).
 'emilia-story':{asset:'story/emilia-sheet.png',frameSize:[72,109],columns:8,scale:.5,anchor:[.5,1],offset:[0,15],fallback:{coat:'#3d5a8a',hair:'#d8d4cc',skin:'#c08a63'},animations:{
  idle:{frames:[16]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},'idle:right':{frames:[0]},'idle:left':{frames:[8]},
  ...walkClips(8,1.1)
 }},
 'mara-story':{asset:'story/mara-sheet.png',frameSize:[88,113],columns:8,scale:.5,anchor:[.5,1],offset:[0,15],fallback:{hair:'#3d2b24',coat:'#6b4b35'},animations:{
  idle:{frames:[16]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},'idle:right':{frames:[0]},'idle:left':{frames:[8]},
  ...walkClips(8,.8)
 }},
 // Row 4 is the beckon strip: arms at his sides (32), folded (34-36), then a come-here wave (37-39). He waits with his arms folded.
 'drayfus-story':{asset:'story/drayfus-sheet.png',frameSize:[114,132],columns:8,scale:.5,anchor:[.5,1],offset:[0,16],fallback:{coat:'#3b3430',hair:'#5d5650',skin:'#b5805e',sword:true},animations:{
  idle:{frames:[35]},'idle:down':{frames:[35]},'idle:up':{frames:[24]},'idle:right':{frames:[0]},'idle:left':{frames:[8]},
  beckon:{frames:[35,36,37,38,39,38,39,38,37,36,35,35,35,35,35,35],fps:6},
  ...walkClips(8,1)
 }},
 // The side rows have 7 frames. Row 4 is the dissolve: sitting with its tail round its paws (32), then breaking into blue motes.
 ocelot:{asset:'story/ocelot-sheet.png',frameSize:[142,77],columns:8,scale:.5,anchor:[.5,1],offset:[0,2],animations:{
  idle:{frames:[32]},'idle:down':{frames:[32]},'idle:up':{frames:[24]},'idle:right':{frames:[0]},'idle:left':{frames:[8]},
  vanish:{frames:[32,33,34,35,36,37,38,39],fps:6,loop:false},
  ...walkClips([7,7,8,8],.8)
 }},
 // Brume, the Moonfang wolf. Cut by scripts/prepare-chapter6-sprites.py from his column-layout walk sheet in art/sprites/creatures/moonfang/.
 brume:{asset:'story/brume-sheet.png',frameSize:[198,147],columns:8,scale:.5,anchor:[.5,1],offset:[0,15],animations:{
  idle:{frames:[0]},'idle:right':{frames:[0]},'idle:left':{frames:[8]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(8,1)
 }},
 // Original Drive sheet has a green matte. The shared loader removes it once.
 moonfang:{asset:'story/moonfang.png',chromaKey:'green',frames:[[145,10,320,250],[450,10,310,250],[750,10,310,250],[1060,10,330,250],[5,290,255,190],[260,290,255,190],[515,290,255,190],[770,290,255,190],[1020,290,255,190],[1270,290,265,190]],scale:.36,anchor:[.5,1],offset:[0,0],mirror:'right',animations:{idle:{frames:[0,1,2,3],fps:3},run:{frames:[4,5,6,7,8,9],fps:9}}},
 // Night cutscene artwork. Processed from art/sprites/ by scripts/prepare-cutscene-sprites.py: matte removed, feet on a shared baseline.
 nightwalker:{asset:'story/nightwalker-sheet.png',frameSize:[325,124],columns:6,scale:.46,anchor:[.5,1],offset:[0,15],mirror:'right',fallback:{body:'#1c1820',axe:'#8d8a86'},animations:{
  idle:{frames:[0,1,2,3],fps:3},walk:{frames:[4,5,6,7,8,9],fps:8},
  raise:{frames:[10,11],fps:4,loop:false},swing:{frames:[10,11,12,13],fps:8,loop:false},death:{frames:[14,15,16,17],fps:3,loop:false}
 }},
 'moonfang-charge':{asset:'story/moonfang-charge.png',frameSize:[200,141],columns:6,scale:.42,anchor:[.5,1],offset:[0,15],mirror:'right',fallback:{fur:'#b8bcc4'},animations:{
  idle:{frames:[0,1,2,3],fps:3},run:{frames:[4,5,6,7,8,9],fps:12},
  leap:{frames:[10,11,12],loop:false},land:{frames:[13]},howl:{frames:[14,15,16],fps:4,loop:false}
 }},
 pickup:{asset:null,scale:1,anchor:[.5,1],offset:[0,5]},
 rabbit:{asset:'bunny-sheet.png',frames:RABBIT_FRAMES,scale:.5,anchor:[.5,1],offset:[0,0],mirror:'left',animations:{
  idle:{frames:[0,0,0,1,2,3,1,0],fps:4},graze:{frames:[4,5,6,7],fps:5},
  hop:{frames:[8,9,10,11,12,13,14,15],fps:12,loop:false},settle:{frames:[16,17,18,19,20,21,22],fps:10,loop:false}
 }},
 player:{asset:null,scale:1,anchor:[.5,1],offset:[0,15]},
 mara:{asset:null,scale:1,anchor:[.5,1],offset:[0,14]},
 // 4×4 grid of 64px cells: stand, walk, leap, graze. Cells keep ~5px below the hooves.
 deer:{asset:'deer-sheet.png',frameSize:[64,64],columns:4,scale:1,anchor:[.5,1],offset:[0,25],mirror:'left',animations:{
  idle:{frames:[0,1,2,3],fps:3},walk:{frames:[4,5,6,7],fps:8},
  hurt:{frames:[8,9,10,11],fps:16,loop:false},death:{frames:[12,13,14,15],fps:4,loop:false}
 }},
 // 4×3 grid of 96×64 cells: idle, paddle, retreat into shell. Cells keep ~15px below the shell.
 turtle:{asset:'turtle-sheet.png',frameSize:[96,64],columns:4,scale:.75,anchor:[.5,1],offset:[0,26],mirror:'left',animations:{
  idle:{frames:[0,1,2,3],fps:3},walk:{frames:[4,5,6,7],fps:6},
  hurt:{frames:[8,9,10,11],fps:16,loop:false},death:{frames:[11]}
 }},
 eel:{asset:null,scale:1,anchor:[.5,.5],offset:[12,0]},
 'projectile.projectile':{asset:null,scale:1,anchor:[.5,.5],offset:[0,0]},
 'projectile.bomb':{asset:null,scale:1,anchor:[.5,.5],offset:[0,0]},
 'projectile.wave':{asset:null,scale:1,anchor:[.5,.5],offset:[0,0]}
};
// Video cutscenes play full screen as one story page, with the same versioned asset resolution as artwork.
export const STORY_VIDEO={
 'eli-vision':{asset:'story/eli-vision.mp4',label:'Eli’s vision: a white-haired girl crying in the dark, black light bursting from her, and Eli torn up into the sky.'}
};
// Cutscene and portrait artwork uses the same local, versioned asset resolution.
export const STORY_ART={
 photo:{asset:'story/photo.png',alt:'An old photograph of Oscar, a dark-haired woman, and a huge gray wolf on the dock.'},
 lure:{asset:'story/lure.png',alt:'A luminous blue lure inside a small wooden box in the cabin.'},
 rescue:{asset:'story/rescue.png',alt:'A gray Moonfang wolf tackles the shadowy attacker beside the cabin during the storm.'},
 campfire:{asset:'story/campfire.png',alt:'Eli’s rescuer cooks fish beside a campfire with the ruined cabin behind her.'},
 mara:{asset:'story/mara.webp',alt:'Mara, with dark hair, a leather vest, and a scratch across her cheek.'},
 blacksmith:{asset:'story/blacksmith.png',alt:'A frost-scaled Rimejaw guards the blacksmith’s doorway while a winged Flitlynx licks its paw on the roof and the smith hammers at his anvil.'},
 hearth:{asset:'story/emilia-hearth.png',alt:'Emilia pours tea at the hearth of the red house while a scarred swordsman sits by the round table.'}
};
// Furniture and props, cut from the AI sheets in art/sprites/props/ by scripts/prepare-prop-sprites.py.
// Each scene keeps its drawn shape as the fallback, and collision never depends on this artwork.
export const PROPS=Object.fromEntries(['cook-stove','lure-box-shelf','photo-side-table','dining-table','chair','bed-green','fishing-rod-rack','oil-lamp','door-mat','rain-barrel','firewood-stack','bed-straw-violet','stool-waterskin','chest-brass','chamber-pot','rug-rust-red','stone-hearth','pot-herb-shelf','carved-post','window-evening','rug-red-blue','round-table','fur-stool','wall-bench','chief-cabinet','tea-set','barrel','lantern-post','well','produce-stall','fish-stall','plank-bench','bench-backrest','net-rack','rope-coils','rowing-boat','rest-shelter','fire-ring-cold','apple-crate','fishing-seat','fish-trap','flower-box','campfire','training-dummy','training-dummy-worn','archery-target','weapon-rack','weapon-barrel','water-trough','water-bucket','hay-bale','spear-crate','willow-tree','log-fence','log-fence-side','training-gate-posts','fence-corner-post','training-wall','dirt-ground','glowing-sword','water-bucket-full','training-gate-arch',...['cabin','chief','lodge'].flatMap(room=>['floor','wall','wall-top','wall-side'].map(part=>`${room}-${part}`))].map(id=>[id,`props/${id}.webp`]));
// Familiar shards on the ground reuse their inventory icons.
for(const id of ['rabbit','deer','turtle','eel','shadow-walker','moonfang','rimejaw','flitlynx'])PROPS[`shard-${id}`]=`items/shard-${id}.webp`;
