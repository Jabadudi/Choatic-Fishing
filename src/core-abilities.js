// Powers the Reedwater Region Core gives Eli, shown in the four wheel slots around the main attack.
// Each one wakes from a story flag that a chapter scene sets: Still Water when Eli swallows the core (story.coreIngested),
// Reedwater's Call the first time he fights with Grandpa's rod (story.callAwakened). Slots 3 and 4 stay sealed until
// the core's two sealed powers wake. Levels, slots and scaling live in core-skills.js.
// Gameplay only: the HUD reads coreWheel(world), and the renderer draws world.core and the line projectile.
import {moveAnimal} from './wildlife.js';
import {combatTargets} from './combat.js';
import * as Wilds from './wilds.js';
import {coreSkill,coreStat,coreSkillLevel,coreMaxed,coreSlots,slotOpen,CORE_SLOTS,CORE_TIERS} from './core-skills.js';
export const RESERVES_MAX=100,RESERVES_REGEN=4;
// The two powers the story wakes. Their numbers come from coreStat; these are the story's words for them.
export const CORE_ABILITIES=Object.freeze([
 {id:'still-water',name:'Still Water',flag:'coreIngested'},
 {id:'reeds-call',name:'Reedwater’s Call',flag:'callAwakened'}
]);
const ABILITY=Object.fromEntries(CORE_ABILITIES.map(a=>[a.id,a]));
export const createCore=()=>({reserves:RESERVES_MAX,stillWater:0,steadyCooldown:0,cooldowns:{'still-water':0,'reeds-call':0}});
export const abilityUnlocked=(world,id)=>{const a=ABILITY[id];return a?!!world.story?.[a.flag]:!!world.story?.coreIngested&&coreSkill(id)?.built&&coreSkillLevel(world,id)>0&&world.progression.level>=CORE_TIERS[coreSkill(id).tier-1].from;};
export const nearLivingWater=world=>Wilds.nearWater(world.player.x,world.player.y,world.areaId);
const passive=(world,id,key)=>coreSkillLevel(world,id)>0?coreStat(world,id,key):0;
export const reservesMax=world=>RESERVES_MAX+passive(world,'deep-reserves','reserves');
export const callCost=world=>Math.round(coreStat(world,'reeds-call',nearLivingWater(world)?'waterCost':'cost'));
export const callDamage=world=>Math.round(coreStat(world,'reeds-call','damage'));
export const stillWaterDuration=world=>coreStat(world,'still-water','duration');
export const stillWaterCooldown=world=>coreStat(world,'still-water','cooldown');
// Share of damage Still Water takes off while it holds.
export const stillWaterGuardAmount=world=>coreStat(world,'still-water','guard');
// Damage taken and knockback while Still Water holds. Only Eli's own focus counts.
export const stillWaterGuard=(world,target)=>target===world?.player&&world.core?.stillWater>0;
const cooldownFor=(world,id)=>id==='still-water'?stillWaterCooldown(world):id==='reeds-call'?1.2:coreStat(world,id,'cooldown');
const costFor=(world,id)=>id==='reeds-call'?callCost(world):coreStat(world,id,'cost');
// One row per wheel slot: what the HUD needs to draw it.
export function coreWheel(world){
 const core=world.core||createCore(),slots=coreSlots(world);
 return Array.from({length:CORE_SLOTS,CORE_TIERS},(_,slot)=>{
  const open=slotOpen(world,slot),id=open?slots[slot]:null,skill=id&&coreSkill(id);
  if(!open)return {slot,id:null,name:'???',sealed:true,empty:false,unlocked:false,cooldown:0,cooldownFraction:0,active:false,ready:false,cost:0};
  if(!skill)return {slot,id:null,name:'Empty',sealed:false,empty:true,unlocked:false,cooldown:0,cooldownFraction:0,active:false,ready:false,cost:0};
  const unlocked=coreSkillLevel(world,id)>0&&abilityUnlocked(world,id),cooldown=core.cooldowns[id]||0,max=cooldownFor(world,id),cost=costFor(world,id);
  return {slot,id,name:skill.name,sealed:false,empty:false,unlocked,cooldown,cooldownFraction:max?Math.min(1,cooldown/max):0,
   active:(id==='still-water'&&core.stillWater>0)||(id==='riverstep'&&core.riverstep>0)||core[id]>0,ready:unlocked&&cooldown<=0&&core.reserves>=cost,cost};
 });
}
function nearestFoe(world,range){
 const p=world.player;let best=null,bestScore=Infinity;
 for(const t of combatTargets(world)){if(t===p||t.health<=0||t.entityType==='npc')continue;
  const d=Math.hypot(t.x-p.x,t.y-p.y);if(d>range)continue;
  const turn=Math.abs(Math.atan2(Math.sin(Math.atan2(t.y-p.y,t.x-p.x)-p.angle),Math.cos(Math.atan2(t.y-p.y,t.x-p.x)-p.angle)));
  const score=d+turn*120;if(score<bestScore){best=t;bestScore=score;}}
 return best;
}
const steady=(world,core,duration)=>{
 core.stillWater=Math.max(core.stillWater,duration);
 if(coreMaxed(world,'still-water'))world.player.slowRemaining=0;
 const p=world.player;world.effects.push({name:'still-water',x:p.x,y:p.y,angle:0,life:.8,duration:.8});
};
// Uses whatever sits in a wheel slot (0 to 3).
export function useCoreSlot(world,slot){
 const row=coreWheel(world)[slot];
 if(!row)return {used:false,message:''};
 if(row.sealed)return {used:false,message:'This power hasn’t awakened yet.'};
 if(row.empty)return {used:false,message:'Nothing in this slot. Equip a Core skill from the Skills menu.'};
 return useCoreAbility(world,row.id);
}
// Returns a message for the status line. Uses nothing outside the story, so practice matches never reach it.
export function useCoreAbility(world,id){
 const a=ABILITY[id]||(coreSkill(id)?.built&&coreSkill(id)?.type!=='passive'?coreSkill(id):null),p=world.player,core=world.core||(world.core=createCore());
 if(!a)return {used:false,message:coreSkill(id)?'This power hasn’t awakened yet.':''};
 if(!abilityUnlocked(world,id))return {used:false,message:id==='still-water'?'The Region Core’s power is still out of reach.':'Reedwater’s Call is still asleep inside the core.'};
 if(p.health<=0||world.matchState!=='playing')return {used:false,message:''};
 if(core.cooldowns[id]>0)return {used:false,message:`${a.name} needs ${Math.ceil(core.cooldowns[id])}s more.`};
 if(id==='still-water'){steady(world,core,stillWaterDuration(world));core.cooldowns[id]=stillWaterCooldown(world);return {used:true,message:'Still Water. Panic sinks like a stone.'};}
 if(world.fishing.state!=='idle')return {used:false,message:'Reel in or cancel the line first.'};
 const cost=costFor(world,id);if(core.reserves<cost)return {used:false,message:'Too hollow to cast. Let your reserves refill.'};
 core.reserves-=cost;core.cooldowns[id]=cooldownFor(world,id);
 if(id==='riverstep'){core.riverstep=coreStat(world,id,'duration');return {used:true,message:'Waterstep. Let danger flow past.'};}
 if(id==='undertow'){const duration=coreStat(world,id,'duration');core.undertow={x:p.x+Math.cos(p.angle)*110,y:p.y+Math.sin(p.angle)*110,areaId:world.areaId,life:duration,duration};return {used:true,message:'Undertow. The current gathers.'};}
 if(['core-flare','chosen-of-reedwater'].includes(id)){core[id]=coreStat(world,id,'duration');return {used:true,message:a.name};}
 if(id==='tidewall'){core.wall={x:p.x+Math.cos(p.angle)*70,y:p.y+Math.sin(p.angle)*70,angle:p.angle,life:coreStat(world,id,'duration'),areaId:world.areaId};return {used:true,message:'Tidewall.'};}
 if(id==='reedwater-rising'){world.projectiles.push({x:p.x,y:p.y,angle:p.angle,owner:p,travel:0,kind:'wave',spriteId:'core.wave',name:a.name,speed:300,range:700,damage:coreStat(world,id,'damage'),knockback:240,radius:70,hit:new Set()});return {used:true,message:a.name};}
 if(id==='floodline'){
  const targets=combatTargets(world).filter(t=>t!==p&&t.health>0&&t.entityType!=='npc'&&Math.hypot(t.x-p.x,t.y-p.y)<=600).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
  for(let i=0;i<3;i++)world.projectiles.push({x:p.x,y:p.y,angle:p.angle+(i-1)*.35,owner:p,travel:0,kind:'line',name:a.name,speed:520,range:650,damage:coreStat(world,id,'damage'),knockback:50,coreSkill:id,radius:7,hit:new Set(),homing:targets[i]?.id??null,turn:5,trail:[{x:p.x,y:p.y}]});return {used:true,message:a.name};
 }
 const target=nearestFoe(world,560);
 world.projectiles.push({x:p.x,y:p.y,angle:target?Math.atan2(target.y-p.y,target.x-p.x)*.35+p.angle*.65:p.angle,owner:p,travel:0,kind:'line',name:a.name,speed:520,range:600,damage:id==='set-the-hook'?coreStat(world,id,'damage'):callDamage(world),knockback:id==='set-the-hook'?0:80,coreSkill:id,radius:7,hit:new Set(),homing:target?.id??null,turn:5,pierce:id==='reeds-call'&&coreMaxed(world,'reeds-call')?1:0,trail:[{x:p.x,y:p.y}]});
 return {used:true,message:nearLivingWater(world)?'Reedwater’s Call. The river lends its strength.':'Reedwater’s Call.'};
}
// Steady Heart: a hit that leaves Eli under 35% health fires Still Water by itself, once per cooldown.
export function afterPlayerHit(world){
 const core=world.core,p=world.player;if(!core||p.health<=0||!abilityUnlocked(world,'still-water'))return;
 if(coreSkillLevel(world,'steady-heart')<1||core.steadyCooldown>0||core.stillWater>0)return;
 if(p.health>=p.progression.maxHealth*.35)return;
 steady(world,core,coreStat(world,'steady-heart','duration'));core.steadyCooldown=coreStat(world,'steady-heart','cooldown');
 world.message='Still Water. Passive. This is not a cast.';
}
// Waterstep's small learned bonus stays on; the temporary cast adds to it.
const waterstepLearned=world=>world.adventure&&abilityUnlocked(world,'riverstep');
export const waterstepSpeed=world=>waterstepLearned(world)?1+coreStat(world,'riverstep','passiveSpeed')+(world.core?.riverstep>0?coreStat(world,'riverstep','speed'):0):1;
export const waterstepEvasion=world=>waterstepLearned(world)?coreStat(world,'riverstep','passiveEvasion')+(world.core?.riverstep>0?coreStat(world,'riverstep','evasion'):0):0;
// Compatibility for preview scripts that use the old helper. Dash recharge is no longer buffed.
export const riverstepMultiplier=(world,key)=>key==='speed'?waterstepSpeed(world):1;
export function onCoreLineHit(world,shot,target){
 if(!shot.coreSkill||shot.owner!==world.player)return;
 const core=world.core,p=world.player;
 if(shot.coreSkill==='set-the-hook'&&target.health>0){
  core.hook={target,areaId:world.areaId,remaining:coreStat(world,'set-the-hook','pull')};
 }
 const restore=passive(world,'reading-the-current','restore');
 if(restore){core.reserves=Math.min(reservesMax(world),core.reserves+restore);world.effects.push({name:'current-return',x:target.x,y:target.y,toX:p.x,toY:p.y,angle:0,life:.55,duration:.55});}
}
export const coreLineMultiplier=world=>1+passive(world,'reading-the-current','damage');
// All displacement runs here, through the existing collision-aware movement functions.
export function updateCore(world,dt){
 const core=world.core;if(!core)return;
 updateAdvancedCore(world,dt);
 core.riverstep=Math.max(0,(core.riverstep||0)-dt);
 for(const a of world.animals||[])a.coreMoveMultiplier=advancedSlow(world,a);
 if(world.player.health<=0){core.undertow=null;core.hook=null;core.riverstep=0;}
 const field=core.undertow;
 if(field){
  if(field.areaId!==world.areaId||field.life<=0)core.undertow=null;
  else {const step=Math.min(dt,field.life);field.life-=dt;
   for(const a of combatTargets(world))if(a.entityType==='animal'&&a.health>0){const dx=field.x-a.x,dy=field.y-a.y,d=Math.hypot(dx,dy);if(d<=coreStat(world,'undertow','radius')){a.coreMoveMultiplier=1-coreStat(world,'undertow','slow');if(d>1){const n=Math.min(d,coreStat(world,'undertow','pull')*step);moveAnimal(a,dx/d*n,dy/d*n);}}}
  }
 }
 const hook=core.hook;
 if(hook){const a=hook.target,p=world.player;
  if(hook.areaId!==world.areaId||a.health<=0||!combatTargets(world).includes(a))core.hook=null;
  else {const dx=a.x-p.x,dy=a.y-p.y,d=Math.hypot(dx,dy),step=Math.min(hook.remaining,480*dt,Math.max(0,d-(a.radius||14)-20));
   if(step>0){if(a.radius>=24||a.boss)world.moveActor(p,dx/d*step,dy/d*step,false);else if(a.entityType==='animal')moveAnimal(a,-dx/d*step,-dy/d*step);}
   hook.remaining-=step;if(step<=0||hook.remaining<=0)core.hook=null;
  }
 }
 if(core.riverstep>0&&(world.player.steppedAt===world.elapsed||world.player.dashRemaining>0)){
  core.trailTimer=(core.trailTimer||0)-dt;if(core.trailTimer<=0){core.trailTimer=.09;const p=world.player;world.effects.push({name:'riverstep-trail',x:p.x,y:p.y+8,angle:p.angle,life:.6,duration:.6});}
 }

 core.stillWater=Math.max(0,core.stillWater-dt);core.steadyCooldown=Math.max(0,(core.steadyCooldown||0)-dt);
 if(core.stillWater>0&&coreMaxed(world,'still-water'))world.player.slowRemaining=0;
 for(const id of Object.keys(core.cooldowns))core.cooldowns[id]=Math.max(0,core.cooldowns[id]-dt);
 const regen=RESERVES_REGEN*(1+passive(world,'deep-reserves','regen'))+(core.heronReady?passive(world,'herons-patience','regen'):0);
 if(abilityUnlocked(world,'reeds-call'))core.reserves=Math.min(reservesMax(world),core.reserves+regen*dt*(nearLivingWater(world)?2:1));
}

const advancedPassive=(w,id,key)=>w.adventure&&abilityUnlocked(w,id)?coreStat(w,id,key):0;
export function corePower(w){if(!w.adventure)return 1;return 1+(w.core?.['core-flare']>0?coreStat(w,'core-flare','power'):0)+(w.core?.['chosen-of-reedwater']>0?coreStat(w,'chosen-of-reedwater','power'):0)+(nearLivingWater(w)?advancedPassive(w,'delta-bond','power'):0);}
export function coreGuard(w){if(!w.adventure)return 0;return (w.core?.['chosen-of-reedwater']>0?coreStat(w,'chosen-of-reedwater','guard'):0)+(nearLivingWater(w)?advancedPassive(w,'delta-bond','guard'):0);}
export function preventCoreDefeat(w){if(!abilityUnlocked(w,'land-remembers')||w.core.landCooldown>0)return false;w.core.landCooldown=coreStat(w,'land-remembers','cooldown');w.player.health=1;steady(w,w.core,coreStat(w,'land-remembers','duration'));w.core.rememberFlash=1;return true;}
export function wallBlocks(w,shot,x,y){const wall=w.core?.wall;if(!wall||wall.life<=0||wall.areaId!==w.areaId||!shot.hostile)return false;
 const local=(x,y)=>({x:(x-wall.x)*Math.cos(wall.angle)+(y-wall.y)*Math.sin(wall.angle),y:-(x-wall.x)*Math.sin(wall.angle)+(y-wall.y)*Math.cos(wall.angle)}),a=local(x,y),b=local(shot.x,shot.y),dx=b.x-a.x;
 const t=dx?Math.max(0,Math.min(1,-a.x/dx)):0;return Math.abs(a.x+dx*t)<=12+shot.radius&&Math.abs(a.y+(b.y-a.y)*t)<=100+shot.radius;
}
function updateAdvancedCore(w,dt){const c=w.core,p=w.player;
 for(const key of ['core-flare','chosen-of-reedwater','landCooldown','rememberFlash'])c[key]=Math.max(0,(c[key]||0)-dt);
 if(p.health<=0){c.wall=null;c['core-flare']=c['chosen-of-reedwater']=0;}
 c.heronReady=p.health>0&&abilityUnlocked(w,'herons-patience');
 if(c.wall){c.wall.life-=dt;if(c.wall.life<=0||c.wall.areaId!==w.areaId)c.wall=null;}
}
export function advancedSlow(w,a){const wall=w.core?.wall;if(!wall||wall.areaId!==w.areaId)return 1;const dx=a.x-wall.x,dy=a.y-wall.y;return Math.abs(dx*Math.cos(wall.angle)+dy*Math.sin(wall.angle))<24+(a.radius||14)&&Math.abs(-dx*Math.sin(wall.angle)+dy*Math.cos(wall.angle))<100?1-coreStat(w,'tidewall','slow'):1;}
