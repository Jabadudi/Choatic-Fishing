import {damage} from './combat.js';
import {walkable,isWater,waterDistance,areaFor} from './wilds.js';
import {animalTraits,reactionFor,huntableInArea} from './entities.js';
import {rollLoot} from './loot.js';
import {artifactBonus,itemLabel} from './artifacts.js';
import {practise} from './skills.js';
import {huntProgress} from './side-quests.js';
import {startingSlots,SHINY} from './spawn-tables.js';
import {updateMonster} from './monsters.js';
import {updateBoss,bossDefeated} from './bosses.js';

export function animalGround(animal,x,y){
 const area=areaFor(animal.areaId),margin=animal.species==='rabbit'?80:Math.max(30,animal.radius+10);
 if(x<margin||y<margin||x>area.width-margin||y>area.height-margin)return false;
 if(animal.species==='rabbit'&&(y<110||y>area.height-100||waterDistance(x,y,animal.areaId)<=22))return false;
 if(animal.habitat==='water')return isWater(x,y,animal.areaId)&&waterDistance(x,y,animal.areaId)<-animal.radius;
 // A wader (the Drowned Soldier) can also walk out into the water, up to its reach from the shore.
 return walkable(x,y,animal.areaId)||!!animal.wades&&isWater(x,y,animal.areaId)&&waterDistance(x,y,animal.areaId)>-animal.wades;
}
export function moveAnimal(animal,dx,dy){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4)),sx=dx/steps,sy=dy/steps;
 let moved=false;
 for(let i=0;i<steps;i++){
  if(animalGround(animal,animal.x+sx,animal.y)){animal.x+=sx;moved||=sx!==0;}
  if(animalGround(animal,animal.x,animal.y+sy)){animal.y+=sy;moved||=sy!==0;}
 }
 return moved;
}
export function createWildlife(){
 // The starting layout. Later creatures come from the area spawner (spawns.js).
 return startingSlots(species=>species!=='rabbit').map(({id,start:species,areaId,x,y},index)=>{
  const animal={id,slotId:id,areaId,x,y,...animalTraits(species),state:'idle',time:0,wait:1+index*.5,alert:0,direction:{x:-1,y:0},seed:9041+index*311,shiny:false};
  let found=animalGround(animal,x,y);
  for(let ring=1;ring<14&&!found;ring++)for(let step=0;step<16;step++){
   const angle=step*Math.PI/8,nx=x+Math.cos(angle)*ring*12,ny=y+Math.sin(angle)*ring*12;
   if(animalGround(animal,nx,ny)){animal.x=nx;animal.y=ny;found=true;break;}
  }
  if(!found)throw Error(`No safe spawn for ${id}`);
  animal.home={x:animal.x,y:animal.y};return animal;
 });
}
function random(a){let s=a.seed;s^=s<<13;s^=s>>>17;s^=s<<5;a.seed=s>>>0;return a.seed/4294967296;}
// Loot falls around the body as pickups; the animal's own seeded generator keeps rolls reproducible.
function dropLoot(world,animal,source){
 const luck=(source.progression?.lootMultiplier??1)*(1+(source.progression?.passive('hunting.loot')??0))*(1+artifactBonus(source,'rabbits-foot'))*(animal.shiny?SHINY.loot:1);
 // A boss's first defeat makes its weapon certain.
 const first=!!animal.boss&&!(world.bosses?.[animal.bossId]?.defeats>0);
 const items=rollLoot(animal.loot,()=>random(animal),luck,{first}),names=[];
 items.forEach((item,i)=>{
  let spot={x:animal.x,y:animal.y};
  // Water animals sink out of reach, so their drops wash up on the nearest walkable bank.
  search:for(const r of [26,16,0,...Array.from({length:12},(_,n)=>48+n*36)])for(let k=0;k<(r>26?16:1);k++){const a=i*2.2+.4+k*Math.PI/8,x=animal.x+Math.cos(a)*r,y=animal.y+Math.sin(a)*r;if(walkable(x,y,animal.areaId)){spot={x,y};break search;}}
  const id=`drop-${world.nextDropId++}`;world.drops.push({id,entityType:'pickup',spriteId:'pickup',areaId:animal.areaId,...spot,item:{...item,id:`loot-${id}`,uses:1}});names.push(itemLabel(item));
 });
 return names;
}
// "Shadow Ichor ×3, Drowned Brass" rather than the same name three times.
const tally=names=>[...new Set(names)].map(n=>{const k=names.filter(m=>m===n).length;return k>1?`${n} ×${k}`:n;}).join(', ');
export function damageAnimal(world,animal,amount,source,angle,knockback=0){
 if(world.matchState!=='playing'||source.health<=0||!huntableInArea(world,animal)||!Number.isFinite(amount)||amount<=0)return false;
 const taken=amount*(source.progression?.damageMultiplier??1)*(1+(source.progression?.passive('hunting.damage')??0));
 animal.health=Math.max(0,animal.health-taken);animal.hurtRemaining=.25;animal.alert=3;
 // A defensive animal that is already fighting stands its ground: hits do not push it back, so they cannot spoil its swing.
 const fighting=animal.behavior==='defensive'&&animal.anger>0;
 if(animal.behavior==='defensive'){
  // A bear rears and roars the first time it is hurt, before it comes after its attacker.
  if(animal.roar&&!fighting&&animal.health>0){animal.roarRemaining=animal.roar;animal.time=0;}
  animal.attackerId=source.id;animal.anger=1;
 }animal.threat={x:source.x,y:source.y};
 // A boss is far too heavy to be shoved far.
 if(!fighting){const shove=knockback*(animal.boss?.08:.45);animal.vx+=Math.cos(angle)*shove;animal.vy+=Math.sin(angle)*shove;}
 if(animal.species==='rabbit'){animal.state='idle';animal.time=0;}
 world.effects.push({name:'animal-hit',label:`-${Math.round(taken)}`,x:animal.x,y:animal.y-25,angle:0,life:.6,duration:.6});
 if(animal.health===0){
  animal.state='dead';animal.time=0;animal.deathRemaining=2;animal.vx=0;animal.vy=0;
  world.hunting.total++;world.hunting.bySpecies[animal.species]=(world.hunting.bySpecies[animal.species]||0)+1;
  // Hunting XP lands only on the killing blow, once per life of the animal.
  const trained=source.progression?practise(world,source,'hunting',animal.huntXp,{x:animal.x,y:animal.y-35}):null;
  const heal=(source.progression?.passive('hunting.heal')??0)+artifactBonus(source,'black-light-heart');if(heal>0)source.health=Math.min(source.progression.maxHealth,source.health+heal);
  const loot=animal.loot?dropLoot(world,animal,source):[];
  if(animal.shiny){
   const hunted=world.hunting.shiny.hunted;hunted[animal.species]=(hunted[animal.species]||0)+1;
   world.effects.push({name:'shiny',label:'',x:animal.x,y:animal.y-20,angle:0,life:1.2,duration:1.2});
   // A familiar of the same kind takes on the shiny's gold for good.
   if(world.companion?.id===animal.loot)world.companion.shiny=true;
  }
  const quest=huntProgress(world,animal.species),boss=animal.boss?bossDefeated(world,animal):'';
  world.message=`${boss||`${animal.name} ${animal.behavior==='aggressive'?'defeated':'hunted'}`} · +${trained?.amount??animal.huntXp} Hunting XP${loot.length?` · Dropped ${tally(loot)}`:''}${quest?` · ${quest}`:''}${trained?.text?` · ${trained.text}`:''}`;
 }
 return true;
}
export function updateAnimalCombat(world,dt){
 if(!world.adventure||world.matchState!=='playing')return;
 for(const a of world.animals){
  if(a.areaId!==world.areaId)continue;
  if(a.health<=0){a.time+=dt;a.deathRemaining=Math.max(0,a.deathRemaining-dt);continue;}
  a.hurtRemaining=Math.max(0,a.hurtRemaining-dt);
  if(a.vx||a.vy){moveAnimal(a,a.vx*dt,a.vy*dt);a.vx*=Math.exp(-10*dt);a.vy*=Math.exp(-10*dt);}
 }
}
// Passive animals notice Eli at their fear range and keep an eye on him, but only bolt when he comes close, rushes
// straight at them, or hurts them. Skittish kinds startle sooner and at a gentler approach.
const SKITTISH=new Set(['fox','heron','duck','otter','eel']);
export function startleRange(a){return Math.max(a.radius+26,a.fearRange*(SKITTISH.has(a.species)?.55:.4));}
// How fast (px/s) Eli has to close in, inside the fear range, before the animal runs. Eli walks at 195.
export const rushSpeed=a=>SKITTISH.has(a.species)?110:165;
const turnToward=(from,to,max)=>{const d=Math.atan2(Math.sin(to-from),Math.cos(to-from));return from+Math.max(-max,Math.min(max,d));};
function startFlee(a,threat){
 a.fleeAngle=Math.atan2(a.y-threat.y,a.x-threat.x)+(random(a)-.5)*.7;
 a.fleeRemaining=1.1+random(a)*.7;a.state='flee';a.time=0;
}
// A flight commits to a heading and turns smoothly, instead of sliding to keep an exact distance from Eli.
function runAway(world,a,dt,threat){
 if(threat)a.fleeAngle=turnToward(a.fleeAngle,Math.atan2(a.y-threat.y,a.x-threat.x),3*dt);
 a.fleeRemaining=Math.max(0,a.fleeRemaining-dt);
 // Try side routes when the direct escape is blocked; never cross habitat boundaries.
 for(const offset of [0,.6,-.6,1.2,-1.2,1.8,-1.8,Math.PI]){
  const angle=a.fleeAngle+offset,dx=Math.cos(angle),dy=Math.sin(angle);
  if(!animalGround(a,a.x+dx*18,a.y+dy*18))continue;
  if(offset)a.fleeAngle=turnToward(a.fleeAngle,angle,6*dt);
  a.direction={x:dx,y:dy};moveAnimal(a,dx*a.fleeSpeed*dt,dy*a.fleeSpeed*dt);break;
 }
 // Safe again: stop, look back at Eli, and settle down before wandering off.
 if(a.fleeRemaining===0){
  const p=world.player;a.state='idle';a.time=0;a.wait=1.4+random(a)*1.6;a.calm=2.5;
  const look=Math.atan2(p.y-a.y,p.x-a.x);a.direction={x:Math.cos(look),y:Math.sin(look)};
 }
}
function calmDown(a){a.anger=0;a.attackerId=null;a.attackRemaining=0;a.roarRemaining=0;a.state='idle';a.time=0;a.wait=.8;}
export function updateWildlife(world,dt){
 if(!world.adventure||world.matchState!=='playing')return;
 const p=world.player;
 for(const a of world.wildlife){
  // Escaping to another area ends a fight; the animal has settled by the time Eli comes back.
  if(a.areaId!==world.areaId&&a.anger>0)calmDown(a);
  if(a.areaId!==world.areaId||a.health<=0)continue;
  a.time+=dt;a.alert=Math.max(0,a.alert-dt);a.calm=Math.max(0,(a.calm||0)-dt);
  const distance=Math.hypot(a.x-p.x,a.y-p.y),alive=p.health>0;
  // Eli's closing speed, smoothed. A jump (an area change, a respawn) counts as no approach.
  if(dt>0){const raw=a.gap===undefined?0:(a.gap-distance)/dt;a.closing=(a.closing||0)+((Math.abs(raw)>600?0:raw)-(a.closing||0))*Math.min(1,dt*8);}
  a.gap=distance;
  const near=alive&&distance<a.fearRange,close=alive&&distance<startleRange(a),rushed=near&&!(a.calm>0)&&a.closing>rushSpeed(a);
  const reaction=reactionFor(a,{disturbed:close||rushed,provoked:a.behavior==='defensive'?a.anger>0:a.alert>0});
  if(a.boss){updateBoss(world,a,dt);continue;}
  if(reaction==='pursue'){updateMonster(world,a,dt);continue;}
  if(reaction==='retaliate'){
   const target=world.actors.find(actor=>actor.id===a.attackerId),range=target?Math.hypot(target.x-a.x,target.y-a.y):Infinity;
   a.attackCooldownRemaining=Math.max(0,(a.attackCooldownRemaining||0)-dt);
   // Once provoked it fights to the end: it only lets go when its attacker falls or leaves the area.
   if(!target||target.health<=0||(target.areaId??world.areaId)!==a.areaId){
    calmDown(a);
   }else{
    const angle=Math.atan2(target.y-a.y,target.x-a.x);a.direction={x:Math.cos(angle),y:Math.sin(angle)};
    if(a.roarRemaining>0){a.state='roar';a.roarRemaining=Math.max(0,a.roarRemaining-dt);continue;}
    if(a.attackRemaining>0){
     a.state='attack';a.attackRemaining=Math.max(0,a.attackRemaining-dt);
     if(a.attackRemaining===0){
      if(range<=a.attackRange)damage(world,target,a.attackDamage,a,angle,a.knockback??90);
      a.attackCooldownRemaining=a.attackCooldown;
     }
    }else if(range<=a.attackRange){
     a.state='idle';
     if(a.attackCooldownRemaining===0){a.state='attack';a.time=0;a.attackRemaining=a.attackWindup;}
    }else{a.state='walk';moveAnimal(a,a.direction.x*a.chaseSpeed*dt,a.direction.y*a.chaseSpeed*dt);}
    continue;
   }
  }
  const threat=close||rushed?p:a.alert>0?a.threat||p:null;
  if(reaction==='flee'&&!(a.state==='flee'&&a.fleeRemaining>0))startFlee(a,threat||p);
  if(a.state==='flee'){
   // An old save can hold a flight with no time left on it.
   if(!(a.fleeRemaining>0))startFlee(a,threat||p);
   runAway(world,a,dt,threat||(near?p:null));continue;
  }
  // Eli in sight but no threat: a passive animal stops walking his way and watches him for a moment.
  const watching=near&&a.behavior==='passive';
  if(watching&&!a.watching){a.watching=true;const look=Math.atan2(p.y-a.y,p.x-a.x);a.direction={x:Math.cos(look),y:Math.sin(look)};if(a.state==='walk'){a.state='idle';a.time=0;}a.wait=Math.max(a.wait-a.time,0)+1+random(a)*1.5;}
  else if(!near)a.watching=false;
  if(a.state==='walk'&&watching&&a.direction.x*(p.x-a.x)+a.direction.y*(p.y-a.y)>.3*distance){a.state='idle';a.time=0;a.wait=1+random(a)*1.5;}
  if(a.state==='idle'&&a.time>=a.wait){
   const away=Math.atan2(a.y-p.y,a.x-p.x);
   // Wandering drifts home, or, with Eli close by, loosely away from him; otherwise anywhere.
   const angle=Math.hypot(a.x-a.home.x,a.y-a.home.y)>180?Math.atan2(a.home.y-a.y,a.home.x-a.x):alive&&a.behavior==='passive'&&distance<a.fearRange*1.5?away+(random(a)-.5)*2.2:random(a)*Math.PI*2;
   a.direction={x:Math.cos(angle),y:Math.sin(angle)};a.state='walk';a.time=0;a.wait=1+random(a)*1.4;
  }else if(a.state==='walk'){
   const moved=moveAnimal(a,a.direction.x*a.speed*dt,a.direction.y*a.speed*dt);
   if(!moved||a.time>=a.wait){a.state='idle';a.time=0;a.wait=1.5+random(a)*2;}
  }
 }
}
export const visibleWildlife=(world,view)=>(world.wildlife||[]).filter(a=>a.areaId===world.areaId&&(a.health>0||a.deathRemaining>0)&&(!view||(a.x>view.left-60&&a.x<view.right+60&&a.y>view.top-60&&a.y<view.bottom+80)));
