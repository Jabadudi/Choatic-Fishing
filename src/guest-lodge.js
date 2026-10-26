// Eli's room in Willowback's guest lodge. Geometry and collision only; story.js decides who stands here.
import {drawRoomShell,roomWalls} from './room-shell.js';
import {drawProp} from './sprites.js';
export const LODGE_DOOR={x:410,y:330};
export const GUEST_LODGE={id:'guest-lodge',name:'The Guest Lodge',width:560,height:400,seed:7357,spawn:{x:280,y:330},exits:[{edge:'south',from:230,to:330,target:'village',entry:{x:LODGE_DOOR.x,y:390},label:'Willowback Village'}]};
export const LODGE_MARA_SPOT={x:330,y:250};
// Outside the lodge door in the village, where Mara waits at sunrise.
export const LODGE_MORNING_SPOT={x:470,y:395};
export const LODGE_BED={x:96,y:205},LODGE_STOOL={x:196,y:150},LODGE_WINDOW={x:300,y:96},LODGE_POT={x:500,y:320};
// Where Eli finds himself after the vision, on the floor beside the stool.
export const LODGE_WAKE_SPOT={x:230,y:200};
export const GUEST_LODGE_PLACES=[];
const ROOM={width:560,height:400,wall:76,door:[236,324]},WALLS=roomWalls(ROOM);
const BLOCKS=[[40,110,152,300],[180,136,212,166],[486,306,516,336],[448,40,532,92]];
export const guestLodgeBlocked=(x,y)=>WALLS.blocked(x,y)||BLOCKS.some(([l,t,r,b])=>x>l-12&&x<r+12&&y>t-12&&y<b+12);
export function drawGuestLodge(c,{night=false,morning=false}={}){
 // Plain pine floor and a back wall of vertical timber boards.
 drawRoomShell(c,ROOM,'lodge',{floor:['#a07a52','#7f5d3c','#b9915f'],wallFill:'#6e4d32',paintWall:(c,x,y,w,h)=>{
  for(let i=x;i<x+w;i+=18){c.fillStyle='#5a3d27';c.fillRect(i,y,2,h);c.fillStyle='#836043';c.fillRect(i+2,y,2,h);}
  c.fillStyle='#4a321f';c.fillRect(x,y,w,6);c.fillRect(x,y+h-8,w,8);c.fillStyle='#9a7650';c.fillRect(x,y+h-8,w,2);
 }});
 // A window with real glass, slightly warped.
 const w=LODGE_WINDOW;c.save();c.translate(0,-18);c.fillStyle='#5f3a26';c.fillRect(w.x-46,36,92,58);
 c.fillStyle=morning?'#f6d48c':night?'#1b2440':'#c58b6a';c.fillRect(w.x-40,42,80,46);
 if(night){c.fillStyle='#e8eefc';for(const [dx,dy] of [[-28,6],[-10,14],[14,4],[26,20],[-20,30]])c.fillRect(w.x+dx,42+dy,2,2);}
 c.fillStyle='#ffffff22';c.fillRect(w.x-36,46,10,38);c.fillRect(w.x+6,48,6,34);
 c.fillStyle='#5f3a26';c.fillRect(w.x-2,42,4,46);c.fillRect(w.x-40,63,80,3);c.restore();
 // Bed: a straw mattress under a heavy wool blanket.
 if(!drawProp(c,'bed-straw-violet',{x:96,y:302,w:116,h:196})){
  c.fillStyle='#4f3523';c.fillRect(40,110,112,190);c.fillStyle='#d9bf72';c.fillRect(46,116,100,178);
  c.fillStyle='#c4a659';for(let y=120;y<290;y+=9)c.fillRect(50+(y%18?0:8),y,40,2);
  c.fillStyle='#ece3cf';c.fillRect(54,122,84,28);c.fillStyle='#6b5a8a';c.fillRect(46,160,100,134);
  c.fillStyle='#57487a';for(let y=168;y<290;y+=14)c.fillRect(46,y,100,4);c.fillStyle='#8a78a8';c.fillRect(46,160,100,4);
 }
 // The stool and Mara's leather waterskin.
 if(!drawProp(c,'stool-waterskin',{x:196,y:170,w:40,h:50})){
  c.fillStyle='#4a3326';c.fillRect(180,150,32,16);c.fillStyle='#7a5133';c.fillRect(178,138,36,14);
  c.fillStyle='#8a5a32';c.beginPath();c.ellipse(196,138,10,7,0,0,Math.PI*2);c.fill();c.fillStyle='#5a3a20';c.fillRect(194,128,4,6);
 }
 // A chest under the shelf, and the chamber pot in its corner.
 if(!drawProp(c,'chest-brass',{x:490,y:96,w:88,h:58})){
  c.fillStyle='#5a3b28';c.fillRect(448,40,84,52);c.fillStyle='#c79a5a';c.fillRect(448,62,84,4);c.fillRect(486,40,8,52);
 }
 if(!drawProp(c,'chamber-pot',{x:LODGE_POT.x,y:LODGE_POT.y+12,w:32,h:28})){
  c.fillStyle='#7d6a5a';c.beginPath();c.ellipse(LODGE_POT.x,LODGE_POT.y,16,11,0,0,Math.PI*2);c.fill();c.fillStyle='#4a3f36';c.beginPath();c.ellipse(LODGE_POT.x,LODGE_POT.y-3,11,6,0,0,Math.PI*2);c.fill();
 }
 // Woven rug.
 if(!drawProp(c,'rug-rust-red',{x:295,y:302,w:154,h:82})){
  c.fillStyle='#7a3b31';c.fillRect(220,220,150,80);c.fillStyle='#c9a46a';for(let x=228;x<364;x+=14)c.fillRect(x,226,7,3),c.fillRect(x,292,7,3);
 }
 // Lamplight in the evening, moonlight at night, sunrise in the morning.
 if(night){c.fillStyle='rgba(10,16,40,.45)';c.fillRect(24,24,512,352);const g=c.createRadialGradient(w.x,96,10,w.x,160,240);g.addColorStop(0,'rgba(150,180,255,.22)');g.addColorStop(1,'rgba(150,180,255,0)');c.fillStyle=g;c.fillRect(24,24,512,352);}
 else{const g=c.createRadialGradient(w.x,96,10,w.x,180,320);g.addColorStop(0,morning?'rgba(255,214,140,.32)':'rgba(255,170,80,.22)');g.addColorStop(1,'rgba(255,170,80,0)');c.fillStyle=g;c.fillRect(24,24,512,352);}
}
