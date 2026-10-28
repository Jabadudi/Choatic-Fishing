import {drawEntitySprite,drawProp} from './sprites.js';
import {drawWildlife} from './wildlife-art.js';
import {drawRabbit} from './rabbits.js';
import {FAMILIARS} from './familiars.js';
import {drawVillageCreature} from './village-creature-art.js';
// Familiars reuse their species' artwork, drawn smaller over a spirit glow. Nothing here moves the follower.
const GLOW={rabbit:'#cfe6ff',deer:'#ffe3a0',turtle:'#a8f0c8',eel:'#9ee6ff','shadow-walker':'#b9a0ff',moonfang:'#dde3ff',rimejaw:'#a6e4ff',flitlynx:'#ffbf8a'};
// Guardians run on their sheets' run rows. Stand-ins until each has the standard 4-direction walk set.
const GUARDIAN_RUN={moonfang:'run',rimejaw:'walk',flitlynx:'walk'};
export function drawFamiliar(c,companion,time){
 const f=FAMILIARS[companion.id];if(!f)return;
 const glow=companion.shiny?'#ffd36a':GLOW[companion.id],bob=Math.sin(time*3.2)*2.5,appear=1-companion.summonRemaining/.8;
 c.save();
 // Spirit ring at the feet and a soft halo.
 const halo=c.createRadialGradient(companion.x,companion.y-16,2,companion.x,companion.y-16,40);halo.addColorStop(0,`${glow}88`);halo.addColorStop(.6,`${glow}33`);halo.addColorStop(1,`${glow}00`);
 c.fillStyle=halo;c.beginPath();c.arc(companion.x,companion.y-16,40,0,Math.PI*2);c.fill();
 c.fillStyle=`${glow}44`;c.strokeStyle=`${glow}dd`;c.lineWidth=2;c.beginPath();c.ellipse(companion.x,companion.y+3,20+Math.sin(time*2)*2,6,0,0,Math.PI*2);c.fill();c.stroke();
 c.globalAlpha=.3+.7*Math.min(1,appear);
 c.translate(companion.x,companion.y+bob);c.scale(f.scale,f.scale);
 const pose={...companion,x:0,y:0,health:1,maxHealth:1,hurtRemaining:0,deathRemaining:0,spriteId:f.spriteId,species:companion.id};
 if(companion.id==='rabbit')drawRabbit(c,{...pose,state:companion.state==='walk'?'hop':'idle',hopDuration:.4});
 else if(companion.id==='shadow-walker'){
  if(!drawEntitySprite(c,'nightwalker',{x:0,y:0,state:companion.state==='walk'?'walk':'idle',time:companion.time,facingX:companion.direction.x})){
   c.fillStyle='#1c1820';c.beginPath();c.moveTo(-13,15);c.lineTo(-8,-30);c.lineTo(0,-40);c.lineTo(8,-30);c.lineTo(13,15);c.closePath();c.fill();
  }
 }else if(GUARDIAN_RUN[companion.id]){
  if(!drawEntitySprite(c,f.spriteId,{x:0,y:0,state:companion.state==='walk'?GUARDIAN_RUN[companion.id]:'idle',time:companion.time,facingX:companion.direction.x})){
   if(companion.id!=='moonfang')drawVillageCreature(c,{x:0,y:0,spriteId:f.spriteId},time);
   else{c.fillStyle='#b8bcc4';c.fillRect(-34,-40,56,26);c.fillRect(14,-56,24,24);c.fillStyle='#8d929c';for(const x of [-30,-16,4,14])c.fillRect(x,-14,8,14);c.fillStyle='#e8ebf2';c.fillRect(-44,-40,12,8);}
  }
 }else if(companion.id==='eel'&&!drawEntitySprite(c,'eel',{x:0,y:0,state:'idle',time})){
  // No eel sheet yet: a ribbon of light swimming through the air at chest height.
  const t=time*5;c.scale(companion.direction.x<0?-1:1,1);
  for(let i=0;i<9;i++){const y=-20+Math.sin(t+i*.7)*4;c.fillStyle='#1d4a46';c.fillRect(i*5-22,y-1,7,6);c.fillStyle=i===8?'#e2fbff':'#7fd6cf';c.fillRect(i*5-21,y,5,4);}
  c.fillStyle='#10261d';c.fillRect(19,-20+Math.sin(t+5.6)*4,2,2);
 }else if(companion.id!=='eel')drawWildlife(c,pose);
 c.restore();
 // Sparkles drifting up from the familiar.
 c.save();c.fillStyle=glow;
 for(let i=0;i<3;i++){const t=(time*.7+i/3)%1;c.globalAlpha=(1-t)*.8;c.fillRect(Math.round(companion.x+Math.sin(time*2+i*2.1)*14),Math.round(companion.y-10-t*36),2,2);}
 c.restore();
}
// Shards on the ground glow in their creature's colour so they stand out from ordinary loot.
export function drawShard(c,drop,time){
 const glow=GLOW[drop.item.familiar]||'#e6c77f',y=drop.y-8+Math.sin(time*3+drop.x)*2;
 c.save();
 const halo=c.createRadialGradient(drop.x,y,1,drop.x,y,20);halo.addColorStop(0,`${glow}aa`);halo.addColorStop(1,`${glow}00`);
 c.fillStyle=halo;c.beginPath();c.arc(drop.x,y,20,0,Math.PI*2);c.fill();
 c.fillStyle='#17372c55';c.beginPath();c.ellipse(drop.x,drop.y+5,8,3,0,0,Math.PI*2);c.fill();
 if(drawProp(c,`shard-${drop.item.familiar}`,{x:drop.x,y:y+11,w:24,h:24})){c.restore();return;}
 c.fillStyle=glow;c.strokeStyle='#ffffffcc';c.lineWidth=1.2;
 c.beginPath();c.moveTo(drop.x,y-10);c.lineTo(drop.x+6,y);c.lineTo(drop.x,y+9);c.lineTo(drop.x-6,y);c.closePath();c.fill();c.stroke();
 c.strokeStyle='#ffffff88';c.beginPath();c.moveTo(drop.x,y-10);c.lineTo(drop.x,y+9);c.stroke();
 c.restore();
}
