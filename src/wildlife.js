import {damage} from './combat.js';
import {walkable,isWater,waterDistance,areaFor} from './wilds.js';
import {animalTraits,reactionFor,huntableInArea} from './entities.js';
import {rollLoot} from './loot.js';
import {practise} from './skills.js';

export function animalGround(animal,x,y){
 const area=areaFor(animal.areaId),margin=animal.species==='rabbit'?80:Math.max(30,animal.radius+10);
 if(x<margin||y<margin||x>area.width-margin||y>area.height-margin)return false;
 if(animal.species==='rabbit'&&(y<110||y>area.height-100||waterDistance(x,y,animal.areaId)<=22))return false;
 return animal.habitat==='water'?isWater(x,y,animal.areaId)&&waterDistance(x,y,animal.areaId)<-animal.radius:walkable(x,y,animal.areaId);
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
 const homes=[['deer-landing','deer','landing',1080,660],['deer-meadow-west','deer','landing',900,1250],['deer-meadow','deer','landing',1120,1060],['deer-meadow-east','deer','landing',1620,1120],['deer-windchime','deer','windchime',850,950],['turtle-landing','turtle','landing',1980,1060],['eel-landing','eel','landing',675,1910]];
 return homes.map(([id,species,areaId,x,y],index)=>{
  const animal={id,areaId,x,y,...animalTraits(species),state:'idle',time:0,wait:1+index*.5,alert:0,direction:{x:-1,y:0},seed:9041+index*311};
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
 const items=rollLoot(animal.loot,()=>random(animal),source.progression?.lootMultiplier??1),names=[];
 items.forEach((item,i)=>{
  let spot={x:animal.x,y:animal.y};
  for(const r of [26,16,0]){const a=i*2.2+.4,x=animal.x+Math.cos(a)*r,y=animal.y+Math.sin(a)*r;if(walkable(x,y,animal.areaId)){spot={x,y};break;}}
  const id=`drop-${world.nextDropId++}`;world.drops.push({id,entityType:'pickup',spriteId:'pickup',areaId:animal.areaId,...spot,item:{...item,id:`loot-${id}`,uses:1}});names.push(item.name);
 });
 return names;
}
export function damageAnimal(world,animal,amount,source,angle,knockback=0){
 if(world.matchState!=='playing'||source.health<=0||!huntableInArea(world,animal)||!Number.isFinite(amount)||amount<=0)return false;
 const taken=amount*(source.progression?.damageMultiplier??1);
 animal.health=Math.max(0,animal.health-taken);animal.hurtRemaining=.25;animal.alert=3;
 if(animal.behavior==='defensive'){animal.attackerId=source.id;animal.anger=6;}animal.threat={x:source.x,y:source.y};animal.vx+=Math.cos(angle)*knockback*.45;animal.vy+=Math.sin(angle)*knockback*.45;
 if(animal.species==='rabbit'){animal.state='idle';animal.time=0;}
 world.effects.push({name:'animal-hit',label:`-${Math.round(taken)}`,x:animal.x,y:animal.y-25,angle:0,life:.6,duration:.6});
 if(animal.health===0){
  animal.state='dead';animal.time=0;animal.deathRemaining=2;animal.vx=0;animal.vy=0;
  world.hunting.total++;world.hunting.bySpecies[animal.species]=(world.hunting.bySpecies[animal.species]||0)+1;
  // Hunting XP lands only on the killing blow, once per life of the animal.
  const trained=source.progression?practise(world,source,'hunting',animal.huntXp,{x:animal.x,y:animal.y-35}):null;
  const loot=animal.loot?dropLoot(world,animal,source):[];
  world.message=`${animal.name} hunted · +${trained?.amount??animal.huntXp} Hunting XP${loot.length?` · Dropped ${loot.join(', ')}`:''}${trained?.text?` · ${trained.text}`:''}`;
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
// Species with respawnSeconds return to their home after a while, so skills can keep growing with use.
function respawn(a,dt){
 if(!a.respawnSeconds)return;
 a.respawnRemaining=Math.max(0,(a.respawnRemaining??a.respawnSeconds)-dt);
 if(a.respawnRemaining>0)return;
 Object.assign(a,{health:a.maxHealth,x:a.home.x,y:a.home.y,vx:0,vy:0,state:'idle',time:0,wait:1,alert:0,anger:0,attackerId:null,attackRemaining:0,attackCooldownRemaining:0,threat:null,hurtRemaining:0,deathRemaining:0,respawnRemaining:undefined});
}
export function updateWildlife(world,dt){
 if(!world.adventure||world.matchState!=='playing')return;
 for(const a of world.wildlife)if(a.health<=0&&(a.areaId!==world.areaId||a.deathRemaining===0))respawn(a,dt);
 for(const a of world.wildlife){
  if(a.areaId!==world.areaId||a.health<=0)continue;
  a.time+=dt;a.alert=Math.max(0,a.alert-dt);
  const distance=Math.hypot(a.x-world.player.x,a.y-world.player.y),disturbed=world.player.health>0&&distance<a.fearRange;
  const reaction=reactionFor(a,{disturbed,provoked:a.behavior==='defensive'?a.anger>0:a.alert>0});
  if(reaction==='retaliate'){
   const target=world.actors.find(actor=>actor.id===a.attackerId),range=target?Math.hypot(target.x-a.x,target.y-a.y):Infinity;
   a.anger=Math.max(0,a.anger-dt);a.attackCooldownRemaining=Math.max(0,(a.attackCooldownRemaining||0)-dt);
   if(!target||target.health<=0||range>a.leashRange||Math.hypot(a.x-a.home.x,a.y-a.home.y)>a.leashRange||a.anger<=0){
    a.anger=0;a.attackerId=null;a.attackRemaining=0;a.state='idle';a.time=0;a.wait=.8;
   }else{
    const angle=Math.atan2(target.y-a.y,target.x-a.x);a.direction={x:Math.cos(angle),y:Math.sin(angle)};
    if(a.attackRemaining>0){
     a.state='attack';a.attackRemaining=Math.max(0,a.attackRemaining-dt);
     if(a.attackRemaining===0){
      if(range<=a.attackRange)damage(world,target,a.attackDamage,a,angle,90);
      a.attackCooldownRemaining=a.attackCooldown;
     }
    }else if(range<=a.attackRange){
     a.state='idle';
     if(a.attackCooldownRemaining===0){a.state='attack';a.time=0;a.attackRemaining=a.attackWindup;}
    }else{a.state='walk';moveAnimal(a,a.direction.x*a.chaseSpeed*dt,a.direction.y*a.chaseSpeed*dt);}
    continue;
   }
  }
  if(reaction==='flee'){
   const threat=disturbed?world.player:a.threat||world.player,angle=Math.atan2(a.y-threat.y,a.x-threat.x);
   a.state='flee';
   // Try side routes when the direct escape is blocked; never cross habitat boundaries.
   for(const offset of [0,.6,-.6,1.2,-1.2,1.8,-1.8,Math.PI]){
    const dx=Math.cos(angle+offset),dy=Math.sin(angle+offset);
    if(!animalGround(a,a.x+dx*18,a.y+dy*18))continue;
    a.direction={x:dx,y:dy};moveAnimal(a,dx*a.fleeSpeed*dt,dy*a.fleeSpeed*dt);break;
   }
   continue;
  }
  if(a.state==='flee'){a.state='idle';a.time=0;a.wait=.8;}
  if(a.state==='idle'&&a.time>=a.wait){
   const angle=Math.hypot(a.x-a.home.x,a.y-a.home.y)>180?Math.atan2(a.home.y-a.y,a.home.x-a.x):random(a)*Math.PI*2;
   a.direction={x:Math.cos(angle),y:Math.sin(angle)};a.state='walk';a.time=0;a.wait=1+random(a)*1.4;
  }else if(a.state==='walk'){
   const moved=moveAnimal(a,a.direction.x*a.speed*dt,a.direction.y*a.speed*dt);
   if(!moved||a.time>=a.wait){a.state='idle';a.time=0;a.wait=1.5+random(a)*2;}
  }
 }
}
export const visibleWildlife=(world,view)=>(world.wildlife||[]).filter(a=>a.areaId===world.areaId&&(a.health>0||a.deathRemaining>0)&&(!view||(a.x>view.left-60&&a.x<view.right+60&&a.y>view.top-60&&a.y<view.bottom+80)));
