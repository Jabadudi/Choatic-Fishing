import {drawEntitySprite} from './sprites.js';
// Friendly world characters are separate from combat actors and landmark discoveries.
export const createNpcs=()=>[{id:'mara',name:'Mara',areaId:'landing',x:1380,y:1810,npc:true,spriteId:'mara',greeting:'Hello!'}];
export const nearbyNpc=world=>world.adventure?(world.npcs||[]).find(n=>n.areaId===world.areaId&&Math.hypot(n.x-world.player.x,n.y-world.player.y)<=95)||null:null;
export const visibleNpcs=(world,view)=>(world.npcs||[]).filter(n=>n.areaId===world.areaId&&(!view||(n.x>view.left-60&&n.x<view.right+60&&n.y>view.top-40&&n.y<view.bottom+100)));
export function updateDialogue(world,dt){
 const d=world.dialogue;if(!d)return;
 d.remaining-=dt;
 const n=(world.npcs||[]).find(n=>n.id===d.npcId);
 if(d.remaining<=0||!n||n.areaId!==world.areaId||Math.hypot(n.x-world.player.x,n.y-world.player.y)>150)world.dialogue=null;
}
export function drawNpc(c,n,t=0){
 const x=Math.round(n.x),y=Math.round(n.y),bob=Math.sin(t*1.8)*.6;
 if(!drawEntitySprite(c,n.spriteId||'mara',{x:n.x,y:n.y,state:n.animationState||'idle',time:t})){
 c.fillStyle='#20352c55';c.beginPath();c.ellipse(x+2,y+14,15,5,0,0,Math.PI*2);c.fill();
 const r=(color,dx,dy,w,h)=>{c.fillStyle=color;c.fillRect(x+dx,Math.round(y+dy+bob),w,h);};
 r('#443f38',-8,8,6,8);r('#443f38',3,8,6,8);
 r('#3e7772',-12,-8,24,22);r('#6ca39a',-10,-7,6,20);r('#284f50',6,-4,6,18);
 r('#b76c54',-13,-10,27,6);r('#d99c72',-11,-9,10,2);
 r('#8f7861',-9,-26,19,17);r('#dac09a',-7,-23,14,14);
 r('#c4c1a3',-10,-28,20,7);r('#e0d9bc',-10,-26,6,5);r('#c4c1a3',-10,-23,4,12);r('#b5ae94',7,-22,4,12);
 r('#473d34',-3,-18,2,2);r('#473d34',4,-18,2,2);r('#a66e55',0,-12,4,1);
 r('#dbbb95',-14,-3,4,11);r('#dbbb95',11,-2,4,10);
 // A little fishing basket beside the coat.
 r('#765338',13,2,13,12);r('#b88e57',13,2,13,3);r('#d1ae75',16,6,2,6);
 }
 c.textAlign='center';c.font='bold 10px monospace';c.fillStyle='#183c35';c.fillRect(x-23,y+21,46,15);c.fillStyle='#f2e4bf';c.fillText(n.name,x,y+32);
}
export function drawDialogue(c,world){
 const d=world.dialogue;if(!d)return;
 const n=world.npcs.find(n=>n.id===d.npcId);if(!n||n.areaId!==world.areaId)return;
 const w=104,x=n.x-w/2,y=n.y-85;
 c.fillStyle='#20372b66';c.fillRect(x+3,y+3,w,34);c.fillStyle='#624d30';c.fillRect(x-2,y-2,w+4,38);
 c.fillStyle='#fff0cb';c.fillRect(x,y,w,34);c.beginPath();c.moveTo(n.x-7,y+34);c.lineTo(n.x,y+44);c.lineTo(n.x+7,y+34);c.fill();
 c.font='bold 14px monospace';c.textAlign='center';c.fillStyle='#344431';c.fillText(d.text,n.x,y+22);
}
