import {drawEntitySprite} from './sprites.js';
import {BEHAVIOR_LABELS} from './entities.js';
export function drawWildlife(c,a){
 const {x,y}=a,t=a.time||0;
 c.save();if(a.health<=0)c.globalAlpha=Math.min(1,a.deathRemaining);else if(a.hurtRemaining>0)c.globalAlpha=.55;
 if(drawEntitySprite(c,a.spriteId,{x,y,state:a.health<=0?'death':a.hurtRemaining>0?'hurt':a.state==='flee'?'walk':a.state,time:a.hurtRemaining>0?.25-a.hurtRemaining:t,facingX:a.direction.x})){c.restore();return;}
 c.translate(Math.round(x),Math.round(y));if(a.species==='turtle'?a.direction.x>0:a.direction.x<0)c.scale(-1,1);
 if(a.health<=0){c.scale(1,.35);c.translate(0,10);}
 const r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 if(a.species==='deer'){
  const step=a.state==='walk'||a.state==='flee'?Math.sin(t*16)*3:0;
  r('#a58d64',-14,-5,28,16);r('#bea781',-10,-5,17,5);r('#a58d64',9,-19,11,20);
  r('#735e43',-11,8+step,4,12);r('#735e43',8,8-step,4,12);r('#e7d4a8',14,-16,5,4);
  r('#88704e',8,-32,3,15);r('#88704e',19,-32,3,15);r('#88704e',4,-29,7,3);r('#88704e',20,-27,6,3);r('#283d34',17,-17,2,2);
 }else if(a.species==='turtle'){
  r('#bac69c',-21,-4,9,10);r('#3e7058',-14,-12,29,27);r('#7aa576',-10,-9,20,19);
  r('#bed198',-3,-9,2,19);r('#bed198',-10,-1,20,2);r('#bac69c',-9,13,6,5);r('#bac69c',7,13,6,5);
 }else{for(let i=0;i<7;i++)r(i===6?'#d3efdc':'#90c6b4',i*4-12,Math.sin(t*5+i*.7)*4,5,3);r('#243b37',13,Math.sin(t*5+4.2)*4,1,1);}
 c.restore();
}
export function drawAnimalStatus(c,world){
 for(const a of world.animals){
  if(a.health<=0||a.areaId!==world.areaId)continue;
  const near=Math.hypot(a.x-world.player.x,a.y-world.player.y)<150;
  if(a.health===a.maxHealth&&(!near||world.inventory.selected===1))continue;
  const y=a.y-(a.species==='deer'?51:a.species==='rabbit'?42:33);
  c.fillStyle='#19362de8';c.fillRect(a.x-23,y,46,6);c.fillStyle='#c8d78a';c.fillRect(a.x-22,y+1,44*a.health/a.maxHealth,4);
  c.font='12px monospace';c.textAlign='center';c.fillStyle='#fff0cd';c.fillText(`${a.name} · ${BEHAVIOR_LABELS[a.behavior]||a.behavior}`,a.x,y-5);
 }
}
