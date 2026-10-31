import {drawEntitySprite} from './sprites.js';
// Friendly village creatures are scenery NPCs, with drawn loading/missing-art fallbacks.
export function drawVillageCreature(c,n,t){
 // A one-off clip such as the ocelot's dissolve plays from animationStart.
 const state=n.animationState||'idle',clock=n.animationStart==null?t:t-n.animationStart;
 if(drawEntitySprite(c,n.spriteId,{x:n.x,y:n.y,state,time:clock,direction:n.direction}))return;
 // Without the sheet, the drawn creature fades out instead.
 if(state==='vanish'){if(clock<1.2){c.save();c.globalAlpha=1-clock/1.2;drawVillageCreature(c,{...n,animationState:'idle',animationStart:null},t);c.restore();}return;}
 c.save();c.translate(n.x,n.y);
 if(n.spriteId==='ocelot'){
  // Golden-brown, dark rosettes, cheek stripes and core-blue eyes. Sits with its tail around its paws.
  const glow=.6+.4*Math.sin(t*2.2);
  c.fillStyle='#20352c55';c.beginPath();c.ellipse(0,1,18,5,0,0,Math.PI*2);c.fill();
  c.fillStyle='#b9853f';c.fillRect(-12,-22,22,22);c.fillRect(-9,-30,16,10);c.fillStyle='#d8a75a';c.fillRect(-6,-18,10,16);
  c.fillStyle='#b9853f';c.fillRect(-10,-40,18,14);c.fillRect(-10,-44,5,5);c.fillRect(3,-44,5,5);c.fillStyle='#2c1f16';c.fillRect(-9,-43,3,2);c.fillRect(4,-43,3,2);
  c.fillStyle='#e8d0a0';c.fillRect(-5,-32,8,5);c.fillStyle='#2c1f16';c.fillRect(-2,-31,2,2);
  c.fillStyle='#3a2616';for(const [dx,dy] of [[-10,-18],[-4,-14],[4,-20],[-8,-8],[5,-8],[-12,-24],[2,-26]])c.fillRect(dx,dy,3,3);
  c.fillRect(-9,-34,1,4);c.fillRect(-7,-33,1,4);c.fillRect(5,-34,1,4);c.fillRect(7,-33,1,4);
  c.fillStyle=`rgba(143,227,255,${glow})`;c.fillRect(-7,-37,3,2);c.fillRect(2,-37,3,2);
  // Axolotl gill fronds behind the ears, coral pink with glowing blue tips.
  for(const d of [-1,1])for(let i=0;i<3;i++){const gx=d<0?-12-i*3:8+i*3,gy=-42+i*4,sway=Math.round(Math.sin(t*2+i)*1);c.fillStyle='#e58f9a';c.fillRect(gx+d*sway,gy,3,2);c.fillStyle=`rgba(143,227,255,${glow})`;c.fillRect(gx+d*(3+sway),gy-1,2,2);}
  c.fillStyle='#b9853f';c.fillRect(-14,-2,26,4);c.fillStyle='#3a2616';c.fillRect(-14,-2,3,4);c.fillRect(-6,-2,3,4);
  c.restore();return;
 }
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
