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
export const SPRITES={
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
