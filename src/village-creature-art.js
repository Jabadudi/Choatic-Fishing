import {drawEntitySprite} from './sprites.js';
// Friendly village creatures are scenery NPCs, with drawn loading/missing-art fallbacks.
export function drawVillageCreature(c,n,t){
 if(drawEntitySprite(c,n.spriteId,{x:n.x,y:n.y,state:'idle',time:t}))return;
 c.save();c.translate(n.x,n.y);
 if(n.spriteId==='rimejaw'){
  c.fillStyle='#536a79';c.fillRect(-43,-39,73,32);c.fillStyle='#344756';c.fillRect(19,-53,29,39);
  c.fillStyle='#bdd8df';for(let i=0;i<5;i++){c.beginPath();c.moveTo(-38+i*12,-41);c.lineTo(-27+i*12,-32);c.lineTo(-38+i*12,-25);c.fill();}
  c.fillStyle='#899ca7';for(const x of [-31,-12,18])c.fillRect(x,-10,12,12);c.fillStyle='#a3d8ee';c.fillRect(35,-43,5,3);
 }else{
  c.fillStyle='#73513d';for(const d of [-1,1]){c.beginPath();c.moveTo(0,-23);c.lineTo(d*39,-52);c.lineTo(d*29,-16);c.closePath();c.fill();}
  c.fillStyle='#bf9259';c.fillRect(-19,-23,37,18);c.fillRect(8,-36,21,24);c.fillRect(-15,-7,9,9);c.fillRect(9,-7,9,9);c.fillStyle='#332b25';c.fillRect(22,-29,3,3);
 }
 c.restore();
}
