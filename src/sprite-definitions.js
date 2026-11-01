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
// A shadow walker kind's sheet: walk rows 0-3, then the attack and hurt rows (first frame index of each).
function shadowKind(id,frameSize,offset,{attack,hurt,cycle,extra={}}){
 return {asset:`${id}-sheet.png`,frameSize,columns:8,scale:.5,anchor:[.5,1],offset:[0,offset],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[0]},'idle:right':{frames:[0]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(8,cycle),
  raise:{frames:[attack,attack+1,attack+2,attack+3],loop:false},swing:{frames:[attack+2,attack+3,attack+4,attack+5,attack+6,attack+7],fps:8,loop:false},
  hurt:{frames:[hurt,hurt+1],fps:8,loop:false},death:{frames:[hurt+1,hurt+2,hurt+3,hurt+4,hurt+5,hurt+6,hurt+7],fps:6,loop:false},
  ...extra
 }};
}
// How long Brume's bow and lying down take, in seconds. The familiar times them from these.
export const BRUME_TIMING=Object.freeze({bow:1.6,lieDown:2.4,restBeforeSleep:6});
export const VILLAGER_LOOKS=[
 ['baker','#c9b48a','#6a4a2c','#e3b48c'],['weaver','#5c6f8a','#2b2522','#9c6a4a'],['herbalist','#557a3e','#a8a090','#d9b08a'],['carpenter','#8a6640','#3a2a20','#c08a62'],
 ['miller','#d8d0b8','#7a6a58','#e6c29c'],['farmer','#7a8a4a','#4a3020','#b07850'],['shepherd','#a89a7a','#202020','#8a5a3a'],['tanner','#6f5134','#5a3a28','#d0a07a'],
 ['washer','#6c8fb0','#9a3a2a','#f0c8a0'],['lamplighter','#4a4a5a','#c8c0b0','#c89878'],['potter','#b86b4c','#2a2a2a','#7a4a30'],['cooper','#734a39','#8a7a5a','#e0b890'],
 ['elder','#7a6a9a','#e8e4dc','#d8b090'],['elder-two','#5a7a6a','#d0ccc4','#a87050'],['guard','#5a5a4a','#3a2a20','#c89070'],['trader','#a45543','#4a3a2a','#e8c0a0'],
 ['child-three','#d8a040','#6a4a2c','#c8906a',.7],['child-four','#8fae74','#2a2020','#8a5a3a',.7],['child-five','#c99aa8','#a06030','#f0d0b0',.7]
];
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
 // The rest of Willowback: drawn villagers in a spread of coats, hair and skin, so a crowd doesn't look like one family.
 ...Object.fromEntries(VILLAGER_LOOKS.map(([id,coat,hair,skin,visualScale])=>[`villager-${id}`,{asset:null,fallback:{coat,hair,skin,...(visualScale?{visualScale}:{})}}])),
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
 // Brume, the Moonfang wolf. Cut by scripts/prepare-chapter6-sprites.py from his column-layout walk, bow and sleep sheets in
 // art/sprites/creatures/moonfang/. Rows 0-3 walk; row 4 a slow bow; row 5 circling and lying down, ending in a breathing sleep. Both face right.
 // Corvane, general of Croshelda's shadow army (Chapter 14). Rows 0-3 walk; row 4 the shadows-part entrance, facing
 // the camera (he lifts a hand and the shadow walkers step aside); row 5 blocking Emilia's ice, facing right, with the
 // frost cracks staying on his armor afterwards ('blocked').
 corvane:{asset:'story/corvane-sheet.png',frameSize:[194,144],columns:8,scale:.5,anchor:[.5,1],offset:[0,15],fallback:{coat:'#141416',hair:'#1c1a1c',skin:'#d9d2cc',sword:true},animations:{
  idle:{frames:[16]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},'idle:right':{frames:[0]},'idle:left':{frames:[8]},
  ...walkClips(8,1.3),
  shadowsPart:{frames:[32,33,34,35,36,37,38,39],cycle:2.4,loop:false},
  block:{frames:[40,41,42,43,44,45,46,47],cycle:1.4,loop:false},
  blocked:{frames:[47]}
 }},
 brume:{asset:'story/brume-sheet.png',frameSize:[246,146],columns:8,scale:.5,anchor:[.5,1],offset:[0,15],animations:{
  idle:{frames:[0]},'idle:right':{frames:[0]},'idle:left':{frames:[8]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(8,1),
  bow:{frames:[32,33,34,35,36,37,38,39],cycle:BRUME_TIMING.bow,loop:false},
  sleep:{frames:[40,41,42,43,44,45,46,47],cycle:BRUME_TIMING.lieDown,loop:false},sleeping:{frames:[46,47],fps:.8}
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
 // Red fox, cut by scripts/prepare-animal-sprites.py from art/sprites/creatures/fox/. Rows 0-3 walk; row 4 the flee run;
 // row 5 sitting and sniffing; row 6 hurt (48-49) then lying down (50-55). The run, sniff and hurt strips face right.
 // Running away up or down the screen plays the walk faster.
 fox:{asset:'fox-sheet.png',frameSize:[118,65],columns:8,scale:.5,anchor:[.5,1],offset:[0,3],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[40,41,42,43,44,45,46,47],cycle:4},'idle:right':{frames:[40,41,42,43,44,45,46,47],cycle:4},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(8,.9),
  'run:right':{frames:[32,33,34,35,36,37,38,39],cycle:.5},'run:down':{frames:[16,17,18,19,20,21,22,23],cycle:.45},'run:up':{frames:[24,25,26,27,28,29,30,31],cycle:.45},
  hurt:{frames:[48,49],fps:8,loop:false},death:{frames:[50,51,52,53,54,55],fps:6,loop:false}
 }},
 // Bristleback boar, cut by the same script from art/sprites/creatures/boar/. Rows 0-3 walk (7 frames a side); row 4 the
 // charge: scraping a hoof (32-33), the rush (34-37), the tusk toss (38) and a skid (39); row 5 hurt (40-42) then down (43-47).
 // An angry boar chasing Eli rushes on the charge frames; the attack scrapes, then tosses its tusks as it lands.
 boar:{asset:'boar-sheet.png',frameSize:[178,70],columns:8,scale:.5,anchor:[.5,1],offset:[0,3],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[0]},'idle:right':{frames:[0]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(7,1.1),
  'run:right':{frames:[34,35,36,37],cycle:.4},'run:down':{frames:[16,17,18,19,20,21,22],cycle:.5},'run:up':{frames:[24,25,26,27,28,29,30],cycle:.5},
  attack:{frames:[32,33,32,33,38],loop:false},
  hurt:{frames:[41,42],fps:8,loop:false},death:{frames:[43,44,45,46,47],fps:6,loop:false}
 }},
 // Grey elk, cut by the same script from art/sprites/creatures/elk/. Rows 0-3 walk; row 4 the antler swing (head down
 // 32-34, the sweep 35-37); row 5 grazing, its idle side-on; row 6 hurt (48-49) then sinking down to lie still (50-55).
 elk:{asset:'elk-sheet.png',frameSize:[280,174],columns:8,scale:.5,anchor:[.5,1],offset:[0,3],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[40,41,42,43,44,45,46,47],cycle:5},'idle:right':{frames:[40,41,42,43,44,45,46,47],cycle:5},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(8,1.2),
  attack:{frames:[32,33,34,35,36,37],loop:false},
  hurt:{frames:[48,49],fps:8,loop:false},death:{frames:[50,51,52,53,54,55],fps:5,loop:false}
 }},
 // Brown bear, cut by the same script from art/sprites/creatures/bear/. Rows 0-3 walk; row 4 rearing up to roar (the roar
 // itself 35-37); row 5 the claw swipe (paw up 41-42, the sweep 43-45); row 6 hurt (48-49) then slumping onto its side (50-55).
 // A bear that has just been hurt rears and roars before it comes after Eli; the attack lifts the paw and lands on the sweep.
 bear:{asset:'bear-sheet.png',frameSize:[208,140],columns:8,scale:.5,anchor:[.5,1],offset:[0,3],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[0]},'idle:right':{frames:[0]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(8,1.4),
  roar:{frames:[32,33,34,35,36,37,38,39],loop:false},
  attack:{frames:[40,41,42,43,44],loop:false},
  hurt:{frames:[48,49],fps:8,loop:false},death:{frames:[50,51,52,53,54,55],fps:5,loop:false}
 }},
 // Grey heron, cut by the same script from art/sprites/creatures/heron/. Rows 0-3 walk; row 4 taking off (32-35) and flying
 // (36-39), drawn above the ground; row 5 spearing a fish, its idle side-on; row 6 hurt (48-50) then falling (51-55).
 // A startled heron flies away whichever way it goes.
 heron:{asset:'heron-sheet.png',frameSize:[188,115],columns:8,scale:.5,anchor:[.5,1],offset:[0,2],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[40,41,42,43,44,45,46,47],cycle:5},'idle:right':{frames:[40,41,42,43,44,45,46,47],cycle:5},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(8,1.6),
  'run:right':{frames:[36,37,38,39],cycle:.5},'run:down':{frames:[36,37,38,39],cycle:.5},'run:up':{frames:[36,37,38,39],cycle:.5},
  hurt:{frames:[48,49,50],fps:12,loop:false},death:{frames:[51,52,53,54,55],fps:6,loop:false}
 }},
 // Shore crab, cut by the same script from art/sprites/creatures/crab/. Rows 0-3 the scuttle (it moves sideways facing the
 // camera, so right and left are both drawn); row 4 the pinch (claws up 32-33, snaps 34-37); row 5 hurt (40-41) then flipped.
 crab:{asset:'crab-sheet.png',frameSize:[84,52],columns:8,scale:.5,anchor:[.5,1],offset:[0,3],animations:{
  idle:{frames:[16]},'idle:right':{frames:[0]},'idle:left':{frames:[8]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(8,.6),
  attack:{frames:[32,33,34,35,36,37],loop:false},
  hurt:{frames:[40,41],fps:8,loop:false},death:{frames:[42,43,44,45,46,47],fps:6,loop:false}
 }},
 // Crag goat. Rows 0-3 walk; row 4 rearing (32-33) and the headbutt (34-36), then shaking its head; row 5 hurt then down.
 goat:{asset:'goat-sheet.png',frameSize:[130,83],columns:8,scale:.5,anchor:[.5,1],offset:[0,2],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[0]},'idle:right':{frames:[0]},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(8,.9),
  attack:{frames:[32,33,34,35,36],loop:false},
  hurt:{frames:[40,41],fps:8,loop:false},death:{frames:[42,43,44,45,46,47],fps:6,loop:false}
 }},
 // River otter. Rows 0-3 swimming (its walk, since it lives in the water); rows 4-7 the land lope; row 8 the dive; row 9
 // hurt then still. A startled otter swims off fast.
 otter:{asset:'otter-sheet.png',frameSize:[104,61],columns:8,scale:.5,anchor:[.5,1],offset:[0,4],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[0,1,2,3,4,5,6,7]},'idle:right':{frames:[0,1,2,3,4,5,6,7],cycle:1.6},'idle:down':{frames:[16,17,18,19,20,21,22,23],cycle:1.6},'idle:up':{frames:[24]},
  ...walkClips(8,1),
  'run:right':{frames:[0,1,2,3,4,5,6,7],cycle:.45},'run:down':{frames:[16,17,18,19,20,21,22,23],cycle:.45},'run:up':{frames:[24,25,26,27,28,29,30,31],cycle:.45},
  hurt:{frames:[72,73],fps:8,loop:false},death:{frames:[74,75,76,77,78,79],fps:6,loop:false}
 }},
 // Reed duck. Rows 0-3 paddling; row 4 taking off (32-35) and flying (36-39), drawn above the water; row 5 hurt then floating.
 duck:{asset:'duck-sheet.png',frameSize:[98,79],columns:8,scale:.5,anchor:[.5,1],offset:[0,3],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[0,1,2,3,4,5,6,7],cycle:2},'idle:right':{frames:[0,1,2,3,4,5,6,7],cycle:2},'idle:down':{frames:[16]},'idle:up':{frames:[24]},
  ...walkClips(8,1.2),
  'run:right':{frames:[36,37,38,39],cycle:.4},'run:down':{frames:[36,37,38,39],cycle:.4},'run:up':{frames:[36,37,38,39],cycle:.4},
  hurt:{frames:[40,41,42],fps:10,loop:false},death:{frames:[43,44,45,46,47],fps:6,loop:false}
 }},
 // Silver pike, seen from above under the surface. Rows 0-3 swimming; row 4 the lunge (coil 32-33, strike 34-36); row 5 hurt
 // then belly up.
 pike:{asset:'pike-sheet.png',frameSize:[152,58],columns:8,scale:.5,anchor:[.5,1],offset:[0,8],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[0,1,2,3,4,5,6,7],cycle:2},'idle:right':{frames:[0,1,2,3,4,5,6,7],cycle:2},'idle:down':{frames:[16,17,18,19,20,21,22,23],cycle:2},'idle:up':{frames:[24,25,26,27,28,29,30,31],cycle:2},
  ...walkClips(8,1),
  attack:{frames:[32,33,34,35,36],loop:false},
  hurt:{frames:[40,41,42],fps:10,loop:false},death:{frames:[43,44,45,46,47],fps:5,loop:false}
 }},
 // Grey seal. Rows 0-3 swimming; rows 4-7 hauling along on land; row 8 sliding into the sea; row 9 hurt then still.
 seal:{asset:'seal-sheet.png',frameSize:[164,80],columns:8,scale:.5,anchor:[.5,1],offset:[0,4],mirror:'right',mirrorDirections:{left:'right'},animations:{
  idle:{frames:[0,1,2,3,4,5,6,7],cycle:2.2},'idle:right':{frames:[0,1,2,3,4,5,6,7],cycle:2.2},'idle:down':{frames:[16,17,18,19,20,21,22,23],cycle:2.2},'idle:up':{frames:[24]},
  ...walkClips(8,1.3),
  'run:right':{frames:[0,1,2,3,4,5,6,7],cycle:.6},'run:down':{frames:[16,17,18,19,20,21,22,23],cycle:.6},'run:up':{frames:[24,25,26,27,28,29,30,31],cycle:.6},
  hurt:{frames:[72,73,74],fps:10,loop:false},death:{frames:[75,76,77,78,79],fps:5,loop:false}
 }},
 // The shadow walker kinds, cut by scripts/prepare-shadow-walker-sprites.py from art/sprites/mobs/<id>/. Rows 0-3 walk; then one
 // row of 8 per action, facing right. raise plays across the windup and swing starts on the windup's last two frames (the
 // strike begins .25 s in, src/wildlife-art.js); the defeat row is the hit (its first frame) and then breaking up into ash.
 'hollow-stag':shadowKind('hollow-stag',[560,214],12,{attack:32,hurt:48,cycle:1.1,extra:{'run:right':{frames:[40,41,42,43,44,45,46,47],cycle:.6}}}),
 'gloam-boar':shadowKind('gloam-boar',[248,103],10,{attack:32,hurt:40,cycle:.9}),
 stoneshade:shadowKind('stoneshade',[394,209],14,{attack:32,hurt:40,cycle:1.6}),
 // The Whisperer's row 4 fades out and back in; it fades in (36-39) as it notices Eli.
 whisperer:shadowKind('whisperer',[548,187],20,{attack:40,hurt:48,cycle:1.3,extra:{appear:{frames:[36,37,38,39],loop:false}}}),
 // The Mire Walker lies under the water as a ripple (32) and rises (32-39) when it notices Eli; row 5 the grab.
 'mire-walker':shadowKind('mire-walker',[278,130],6,{attack:40,hurt:48,cycle:1.3,extra:{submerged:{frames:[32]},appear:{frames:[32,33,34,35,36,37,38,39],loop:false}}}),
 // The Drowned Soldier's rows 4-7 are the wading walk, used while it stands in water.
 'drowned-soldier':shadowKind('drowned-soldier',[248,131],5,{attack:64,hurt:72,cycle:1.2,extra:{
  ...Object.fromEntries(Object.entries(walkClips(8,1.4)).map(([k,c])=>[k.replace('walk','wade'),{...c,frames:c.frames.map(f=>f+32)}])),
  'wade-idle':{frames:[32]},'wade-idle:right':{frames:[32]},'wade-idle:down':{frames:[48]},'wade-idle:up':{frames:[56]}}}),
 // The Ash Archer draws (32-35) and looses (36-39); row 5 stepping back, played while it backs away from Eli.
 'ash-archer':shadowKind('ash-archer',[232,134],7,{attack:32,hurt:48,cycle:1.1,extra:{back:{frames:[40,41,42,43,44,45,46,47],cycle:.9}}}),
 // The atlas waterfall loop (scripts/prepare-atlas-props.py): a ledge pouring into a pool, 8 frames.
 waterfall:{asset:'waterfall-sheet.png',frameSize:[129,84],columns:8,scale:.6,anchor:[.5,.78],offset:[0,0],animations:{idle:{frames:[0,1,2,3,4,5,6,7],fps:10}}},
 // The arrow's 4 flight frames, pointing right; the renderer turns it to its heading.
 'ash-arrow':{asset:'ash-arrow.png',frameSize:[56,23],columns:4,scale:.5,anchor:[.5,.5],offset:[0,0],animations:{idle:{frames:[0,1,2,3],fps:12}}},
 // The Inkeel's walk set is its swim; row 4 the strike up out of the water.
 inkeel:shadowKind('inkeel',[268,167],28,{attack:32,hurt:40,cycle:1.2}),
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
// The Reedwater Delta atlas props, trees, plants and rocks (scripts/prepare-atlas-props.py).
for(const id of ['listening-tree','fallen-giant','hollow-tree','goldleaf-tree','chime-tree','oak','pine','birch','dead-tree','bush','fern','reeds',
 'marsh-shrub','mossy-boulder','rock-cluster','mossy-log','sea-rock','tower','ruin-wall','arch','pillar','pillar-water','statue','shrine','standing-stone',
 'cairn','aqueduct','ring-stone','stilt-hut','fisher-hut','jetty','raft','wreck','dinghy','crane','water-wheel','lighthouse','lookout-hut','cave','mine',
 'tent','cart','log-stack','signpost','heron-nest','turtle-shell','gate','chimes-post','quarry-block','walk-h','walk-v','walk-platform','stone-bridge-h',
 'stone-bridge-v','stepping-stones','stepping-stone','rope-bridge','broken-watch','grey-spire','great-bridge','spring-pool','hollow-rock','drowned-colonnade'])PROPS[`atlas/${id}`]=`props/atlas/${id}.webp`;
for(const id of ['rabbit','fox','deer','boar','elk','bear','heron','crab','goat','otter','duck','pike','seal','turtle','eel','shadow-walker','moonfang','rimejaw','flitlynx'])PROPS[`shard-${id}`]=`items/shard-${id}.webp`;
