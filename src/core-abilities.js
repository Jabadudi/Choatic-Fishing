// Powers the Reedwater Region Core gives Eli, shown in the four wheel slots around the main attack.
// Each one wakes from a story flag that a chapter scene sets: Still Water when Eli swallows the core (story.coreIngested),
// Reedwater's Call the first time he fights with Grandpa's rod (story.callAwakened). Slots 3 and 4 stay sealed until
// the core's two sealed powers wake. Levels, slots and scaling live in core-skills.js.
// Gameplay only: the HUD reads coreWheel(world), and the renderer draws world.core and the line projectile.
import {combatTargets} from './combat.js';
import * as Wilds from './wilds.js';
import {coreSkill,coreStat,coreSkillLevel,coreMaxed,coreSlots,slotOpen,CORE_SLOTS} from './core-skills.js';
export const RESERVES_MAX=100,RESERVES_REGEN=4;
// The two powers the story wakes. Their numbers come from coreStat; these are the story's words for them.
export const CORE_ABILITIES=Object.freeze([
 {id:'still-water',name:'Still Water',flag:'coreIngested'},
 {id:'reeds-call',name:'Reedwater’s Call',flag:'callAwakened'}
]);
const ABILITY=Object.fromEntries(CORE_ABILITIES.map(a=>[a.id,a]));
export const createCore=()=>({reserves:RESERVES_MAX,stillWater:0,steadyCooldown:0,cooldowns:{'still-water':0,'reeds-call':0}});
export const abilityUnlocked=(world,id)=>{const a=ABILITY[id];return !!a&&!!world.story?.[a.flag];};
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
const cooldownFor=(world,id)=>id==='still-water'?stillWaterCooldown(world):id==='reeds-call'?1.2:0;
const costFor=(world,id)=>id==='reeds-call'?callCost(world):0;
// One row per wheel slot: what the HUD needs to draw it.
export function coreWheel(world){
 const core=world.core||createCore(),slots=coreSlots(world);
 return Array.from({length:CORE_SLOTS},(_,slot)=>{
  const open=slotOpen(world,slot),id=open?slots[slot]:null,skill=id&&coreSkill(id);
  if(!open)return {slot,id:null,name:'???',sealed:true,empty:false,unlocked:false,cooldown:0,cooldownFraction:0,active:false,ready:false,cost:0};
  if(!skill)return {slot,id:null,name:'Empty',sealed:false,empty:true,unlocked:false,cooldown:0,cooldownFraction:0,active:false,ready:false,cost:0};
  const unlocked=coreSkillLevel(world,id)>0,cooldown=core.cooldowns[id]||0,max=cooldownFor(world,id),cost=costFor(world,id);
  return {slot,id,name:skill.name,sealed:false,empty:false,unlocked,cooldown,cooldownFraction:max?Math.min(1,cooldown/max):0,
   active:id==='still-water'&&core.stillWater>0,ready:unlocked&&cooldown<=0&&core.reserves>=cost,cost};
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
 const a=ABILITY[id],p=world.player,core=world.core||(world.core=createCore());
 if(!a)return {used:false,message:coreSkill(id)?'This power hasn’t awakened yet.':''};
 if(!abilityUnlocked(world,id))return {used:false,message:id==='still-water'?'The Region Core’s power is still out of reach.':'Reedwater’s Call is still asleep inside the core.'};
 if(p.health<=0||world.matchState!=='playing')return {used:false,message:''};
 if(core.cooldowns[id]>0)return {used:false,message:`${a.name} needs ${Math.ceil(core.cooldowns[id])}s more.`};
 if(id==='still-water'){steady(world,core,stillWaterDuration(world));core.cooldowns[id]=stillWaterCooldown(world);return {used:true,message:'Still Water. Panic sinks like a stone.'};}
 if(world.fishing.state!=='idle')return {used:false,message:'Reel in or cancel the line first.'};
 const cost=callCost(world);if(core.reserves<cost)return {used:false,message:'Too hollow to cast. Let your reserves refill.'};
 core.reserves-=cost;core.cooldowns[id]=cooldownFor(world,id);
 const target=nearestFoe(world,560);
 world.projectiles.push({x:p.x,y:p.y,angle:target?Math.atan2(target.y-p.y,target.x-p.x)*.35+p.angle*.65:p.angle,owner:p,travel:0,kind:'line',name:a.name,speed:520,range:600,damage:callDamage(world),knockback:80,radius:7,hit:new Set(),homing:target?.id??null,turn:5,pierce:coreMaxed(world,'reeds-call')?1:0,trail:[{x:p.x,y:p.y}]});
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
export function updateCore(world,dt){
 const core=world.core;if(!core)return;
 core.stillWater=Math.max(0,core.stillWater-dt);core.steadyCooldown=Math.max(0,(core.steadyCooldown||0)-dt);
 if(core.stillWater>0&&coreMaxed(world,'still-water'))world.player.slowRemaining=0;
 for(const id of Object.keys(core.cooldowns))core.cooldowns[id]=Math.max(0,core.cooldowns[id]-dt);
 const regen=RESERVES_REGEN*(1+passive(world,'deep-reserves','regen'));
 if(abilityUnlocked(world,'reeds-call'))core.reserves=Math.min(reservesMax(world),core.reserves+regen*dt*(nearLivingWater(world)?2:1));
}
