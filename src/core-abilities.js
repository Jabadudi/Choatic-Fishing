// Powers the Reedwater Region Core gives Eli, shown around the main attack on the action wheel.
// Each one wakes from a story flag that a chapter scene sets: Still Water when Eli swallows the core (story.coreIngested),
// Reedwater's Call the first time he fights with Grandpa's rod (story.callAwakened). Slots 3 and 4 are still sealed.
// Gameplay only: the HUD reads coreWheel(world), and the renderer draws world.core and the line projectile.
import {combatTargets} from './combat.js';
import * as Wilds from './wilds.js';
export const RESERVES_MAX=100,RESERVES_REGEN=4;
export const CORE_ABILITIES=Object.freeze([
 {id:'still-water',name:'Still Water',flag:'coreIngested',cooldown:18,duration:5,
  description:'Your mind is a lake. Panic is a stone. Let it sink. For 5 seconds Eli takes 25% less damage and hits cannot knock him off his feet.'},
 {id:'reeds-call',name:'Reedwater’s Call',flag:'callAwakened',cooldown:1.2,cost:30,waterCost:10,
  description:'Casts a line of core-light that bends toward the nearest foe. Costs 30 reserves, or only 10 beside living water.'},
 {id:'sealed-3',name:'???',sealed:true,description:'This power hasn’t awakened yet.'},
 {id:'sealed-4',name:'???',sealed:true,description:'This power hasn’t awakened yet.'}
]);
const ABILITY=Object.fromEntries(CORE_ABILITIES.map(a=>[a.id,a]));
export const createCore=()=>({reserves:RESERVES_MAX,stillWater:0,cooldowns:{'still-water':0,'reeds-call':0}});
export const abilityUnlocked=(world,id)=>{const a=ABILITY[id];return !!a&&!a.sealed&&!!world.story?.[a.flag];};
export const nearLivingWater=world=>Wilds.nearWater(world.player.x,world.player.y,world.areaId);
export const callCost=world=>nearLivingWater(world)?ABILITY['reeds-call'].waterCost:ABILITY['reeds-call'].cost;
// Damage taken and knockback while Still Water holds. Only Eli's own focus counts.
export const stillWaterGuard=(world,target)=>target===world?.player&&world.core?.stillWater>0;
// One row per wheel slot: what the HUD needs to draw it.
export function coreWheel(world){
 const core=world.core||createCore();
 return CORE_ABILITIES.map(a=>{
  const unlocked=abilityUnlocked(world,a.id),cooldown=core.cooldowns[a.id]||0;
  const cost=a.id==='reeds-call'?callCost(world):0;
  return {id:a.id,name:a.name,sealed:!!a.sealed,unlocked,cooldown,cooldownFraction:a.cooldown?Math.min(1,cooldown/a.cooldown):0,
   active:a.id==='still-water'&&core.stillWater>0,ready:unlocked&&cooldown<=0&&core.reserves>=cost,cost};
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
// Returns a message for the status line. Uses nothing outside the story, so practice matches never reach it.
export function useCoreAbility(world,id){
 const a=ABILITY[id],p=world.player,core=world.core||(world.core=createCore());
 if(!a)return {used:false,message:''};
 if(!abilityUnlocked(world,id))return {used:false,message:a.sealed?'This power hasn’t awakened yet.':id==='still-water'?'The Region Core’s power is still out of reach.':'Reedwater’s Call is still asleep inside the core.'};
 if(p.health<=0||world.matchState!=='playing')return {used:false,message:''};
 if(core.cooldowns[id]>0)return {used:false,message:`${a.name} needs ${Math.ceil(core.cooldowns[id])}s more.`};
 if(id==='still-water'){core.stillWater=a.duration;core.cooldowns[id]=a.cooldown;world.effects.push({name:'still-water',x:p.x,y:p.y,angle:0,life:.8,duration:.8});return {used:true,message:'Still Water. Panic sinks like a stone.'};}
 if(world.fishing.state!=='idle')return {used:false,message:'Reel in or cancel the line first.'};
 const cost=callCost(world);if(core.reserves<cost)return {used:false,message:'Too hollow to cast. Let your reserves refill.'};
 core.reserves-=cost;core.cooldowns[id]=a.cooldown;
 const target=nearestFoe(world,560);
 world.projectiles.push({x:p.x,y:p.y,angle:target?Math.atan2(target.y-p.y,target.x-p.x)*.35+p.angle*.65:p.angle,owner:p,travel:0,kind:'line',name:a.name,speed:520,range:600,damage:30,knockback:80,radius:7,hit:new Set(),homing:target?.id??null,turn:5,trail:[{x:p.x,y:p.y}]});
 return {used:true,message:cost<a.cost?'Reedwater’s Call. The river lends its strength.':'Reedwater’s Call.'};
}
export function updateCore(world,dt){
 const core=world.core;if(!core)return;
 core.stillWater=Math.max(0,core.stillWater-dt);
 for(const id of Object.keys(core.cooldowns))core.cooldowns[id]=Math.max(0,core.cooldowns[id]-dt);
 if(abilityUnlocked(world,'reeds-call'))core.reserves=Math.min(RESERVES_MAX,core.reserves+RESERVES_REGEN*dt*(nearLivingWater(world)?2:1));
}
