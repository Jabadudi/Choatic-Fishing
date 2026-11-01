import {drawEntitySprite} from './sprites.js';
import {BEHAVIOR_LABELS,facingFor} from './entities.js';
import {SPRITES} from './sprite-definitions.js';
import {drawShiny,SHINY_GOLD} from './shiny-art.js';
// Monsters: the axe goes up through the windup and comes down on the strike; a chase walks unless it is standing in reach.
const MONSTER_STATES={attack:'raise',strike:'swing',chase:'walk',return:'walk',notice:'idle'};
export function animalPose(a){
 const t=a.time||0;
 if(a.health<=0)return {state:'death',time:t};
 if(a.behavior==='aggressive'){
  if(a.state==='attack')return {state:'raise',time:t,duration:a.attackWindup};
  // The swing clip starts with the two raised frames, so the strike begins on its third.
  if(a.state==='strike')return {state:'swing',time:.25+t};
  const clips=SPRITES[a.spriteId]?.animations||{},roaming=['idle','walk','return'].includes(a.state);
  // A Mire Walker roams as a ripple under the water and rises as it notices Eli; a Whisperer fades in.
  if(a.hidden&&roaming)return {state:'submerged',time:t};
  if(a.state==='notice'&&clips.appear)return {state:'appear',time:t,duration:a.noticeDelay};
  if(a.backing&&clips.back)return {state:'back',time:t};
  let state=a.state==='chase'&&a.still?'idle':MONSTER_STATES[a.state]||a.state;
  // The Hollow Stag gallops after Eli; a Drowned Soldier in the water wades.
  if(a.state==='chase'&&state==='walk'&&clips['run:right'])state='run';
  if(a.wading&&clips['wade:right'])state=state==='walk'||state==='run'?'wade':state==='idle'?'wade-idle':state;
  return {state,time:t};
 }
 if(a.hurtRemaining>0)return {state:'hurt',time:.25-a.hurtRemaining};
 // A sheet with a run row (the fox, the boar) runs away, or after Eli once it is angry; the others walk.
 const clips=SPRITES[a.spriteId]?.animations||{};
 if(a.state==='flee'||a.state==='walk'&&a.anger>0)return {state:clips['run:right']?'run':'walk',time:t};
 // An attack clip, where there is one, plays across the windup so the hit lands on its last frame.
 // The bear's roar plays across its rearing time.
 if(a.state==='roar')return clips.roar?{state:'roar',time:t,duration:a.roar}:{state:'idle',time:t};
 if(a.state==='attack')return clips.attack?{state:'attack',time:t,duration:a.attackWindup}:{state:'idle',time:t};
 return {state:a.state,time:t};
}
export function drawWildlife(c,a){
 if(a.shiny&&!a.plain){drawShiny(c,a,(globalThis.performance?.now()??0)/1000,l=>drawWildlife(l,{...a,plain:true}));return;}
 const {x,y}=a,t=a.time||0;
 c.save();if(a.health<=0)c.globalAlpha=Math.min(1,a.deathRemaining);else if(a.hurtRemaining>0)c.globalAlpha=.55;
 // A Whisperer is faint until it hunts.
 if(a.visibility!==undefined&&a.health>0)c.globalAlpha*=a.visibility;
 if(drawEntitySprite(c,a.spriteId,{x,y,...animalPose(a),facingX:a.direction.x,direction:facingFor(a.direction.x,a.direction.y)})){c.restore();return;}
 c.translate(Math.round(x),Math.round(y));if(a.species==='turtle'?a.direction.x>0:a.direction.x<0)c.scale(-1,1);
 if(a.health<=0){c.scale(1,.35);c.translate(0,10);}
 const r=(color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
 if(a.species==='deer'){
  const step=a.state==='walk'||a.state==='flee'?Math.sin(t*16)*3:0;
  if(a.state==='attack')c.rotate(a.direction.x<0?-.15:.15);
  r('#a58d64',-14,-5,28,16);r('#bea781',-10,-5,17,5);r('#a58d64',9,-19,11,20);
  r('#735e43',-11,8+step,4,12);r('#735e43',8,8-step,4,12);r('#e7d4a8',14,-16,5,4);
  r('#88704e',8,-32,3,15);r('#88704e',19,-32,3,15);r('#88704e',4,-29,7,3);r('#88704e',20,-27,6,3);r('#283d34',17,-17,2,2);
 }else if(a.spriteId==='nightwalker'){
  // Hooded silhouette with an axe that rises in the windup.
  c.fillStyle='#1c1820';c.beginPath();c.moveTo(-13,15);c.lineTo(-8,-30);c.lineTo(0,-40);c.lineTo(8,-30);c.lineTo(13,15);c.closePath();c.fill();
  c.strokeStyle='#8d8a86';c.lineWidth=3;c.beginPath();c.moveTo(4,-4);c.lineTo(a.state==='attack'?10:20,a.state==='attack'?-36:8);c.stroke();
 }else if(a.species==='turtle'){
  r('#bac69c',-21,-4,9,10);r('#3e7058',-14,-12,29,27);r('#7aa576',-10,-9,20,19);
  r('#bed198',-3,-9,2,19);r('#bed198',-10,-1,20,2);r('#bac69c',-9,13,6,5);r('#bac69c',7,13,6,5);
 }else{for(let i=0;i<7;i++)r(i===6?'#d3efdc':'#90c6b4',i*4-12,Math.sin(t*5+i*.7)*4,5,3);r('#243b37',13,Math.sin(t*5+4.2)*4,1,1);}
 c.restore();
}
// How high the health bar sits above each shadow walker kind's feet.
const STATUS_HEIGHT={'hollow-stag':98,'gloam-boar':42,stoneshade:96,whisperer:76,'mire-walker':64,'drowned-soldier':64,'ash-archer':62,inkeel:44};
export function drawAnimalStatus(c,world){
 for(const a of world.animals){
  if(a.health<=0||a.areaId!==world.areaId)continue;
  const near=Math.hypot(a.x-world.player.x,a.y-world.player.y)<150;
  // A hidden Mire Walker or a faded Whisperer shows no tag until it is hunting.
  if((a.hidden||a.fade)&&['idle','walk','return'].includes(a.state)&&a.health===a.maxHealth)continue;
  if(a.health===a.maxHealth&&!a.shiny&&!['notice','chase','attack','strike','roar'].includes(a.state)&&(!near||world.inventory.selected===1))continue;
  const y=a.y-(STATUS_HEIGHT[a.species]??(a.spriteId==='nightwalker'?66:a.species==='deer'?51:a.species==='rabbit'?42:a.species==='fox'?40:a.species==='boar'?46:a.species==='elk'?96:a.species==='bear'?62:a.species==='heron'?56:a.species==='crab'?30:a.species==='goat'?48:a.species==='otter'?30:a.species==='duck'?38:a.species==='pike'?28:a.species==='seal'?40:33));
  c.fillStyle='#19362de8';c.fillRect(a.x-23,y,46,6);c.fillStyle='#c8d78a';c.fillRect(a.x-22,y+1,44*a.health/a.maxHealth,4);
  c.font='12px monospace';c.textAlign='center';const tag=`${a.name} · ${BEHAVIOR_LABELS[a.behavior]||a.behavior}`;
  // A shiny's tag is gold with a dark edge so it reads on bright grass.
  if(a.shiny){c.lineWidth=3;c.strokeStyle='#10261d';c.strokeText(tag,a.x,y-5);}
  c.fillStyle=a.shiny?SHINY_GOLD:'#fff0cd';c.fillText(tag,a.x,y-5);
 }
}
