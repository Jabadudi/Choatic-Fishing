import {damageAnimal} from './wildlife.js';
import {huntableInArea} from './entities.js';
import {artifactBonus,WET_REACH} from './artifacts.js';
import {waterDistance} from './wilds.js';
import {stillWaterGuardAmount,afterPlayerHit} from './core-abilities.js';
export const combatTargets=world=>world.adventure?[...world.actors,...world.animals.filter(a=>huntableInArea(world,a))]:world.actors;
// Swept collision prevents fast shells or harpoons skipping a small animal between steps.
function shotHit(shot,target,startX,startY){
 const dx=shot.x-startX,dy=shot.y-startY,length=dx*dx+dy*dy;
 const t=length?Math.max(0,Math.min(1,((target.x-startX)*dx+(target.y-startY)*dy)/length)):0;
 return Math.hypot(target.x-startX-dx*t,target.y-startY-dy*t)<=shot.radius+(target.radius||14)?t:null;
}
// Shared combat rules for the human player and bots. No fishing physics dependencies.
export const WEAPONS={
 'Reed Spear':{kind:'melee',damage:22,range:110,knockback:90,cooldown:.3},
 'Hunting Knife':{kind:'melee',damage:28,range:72,knockback:110,cooldown:.35},
 'Crab Maul':{kind:'melee',damage:52,range:70,knockback:340,cooldown:1},
 'Shell Sling':{kind:'projectile',damage:18,speed:520,range:460,knockback:70,cooldown:.35},
 'Frying Pan':{kind:'melee',damage:25,range:65,knockback:220,cooldown:.4},
 'Swordfish':{kind:'melee',damage:34,range:85,knockback:130,cooldown:.55},
 'Anchor':{kind:'melee',damage:60,range:76,knockback:300,cooldown:1.2},
 'Harpoon Gun':{kind:'projectile',damage:36,speed:440,range:540,knockback:120,cooldown:.65},
 'Pufferfish Bomb':{kind:'bomb',damage:48,speed:230,range:165,knockback:230,cooldown:.8},
 'Old Boot':{kind:'projectile',damage:5,speed:300,range:260,knockback:75,cooldown:.45},
 'Hunting Bow':{kind:'projectile',damage:22,speed:620,range:560,knockback:60,cooldown:.7},
 // World boss weapons: never break (PERMANENT_ITEMS). arc is the half-angle a swing covers (1.05 when unset), and pose
 // is Eli's sheet for the swing (src/sprite-definitions.js).
 'Captain’s Sabre':{kind:'melee',damage:40,range:95,knockback:150,cooldown:.5,arc:1.6,pose:'eli-sabre'},
 'Greyhorn Spear':{kind:'melee',damage:36,range:130,knockback:200,cooldown:.55,arc:.6,pose:'eli-spear'}
};
// Holding attack with a boss weapon for hold seconds sends Eli rushing forward: time seconds at speed, hitting everything
// on the way once. Each has its own cooldown.
export const WEAPON_RUSHES=Object.freeze({
 'Captain’s Sabre':{name:'Tide Lunge',hold:.45,speed:760,time:.28,damage:56,knockback:240,cooldown:3},
 'Greyhorn Spear':{name:'Antler Charge',hold:.45,speed:620,time:.42,damage:50,knockback:340,cooldown:3}
});
export function damage(world,target,amount,source,angle,knockback=0){
 if(target.entityType==='npc')return false;
 if(target.entityType==='animal')return damageAnimal(world,target,amount,source,angle,knockback);
 if(target.health<=0||world.matchState!=='playing')return false;
 if(target.dashRemaining>0)return false;
 // Still Water (a Region Core power) steadies Eli: less damage and no knockback while it holds.
 const steady=target===world.player&&world.core?.stillWater>0;if(steady)knockback=0;
 // The Drowned Gorget guards Eli in or beside water; the Spire Bell against anything the shadow has taken.
 const wet=world.adventure&&waterDistance(target.x,target.y,world.areaId)<=WET_REACH,shadow=source.entityType==='animal'&&source.behavior==='aggressive';
 const taken=amount*(steady?1-stillWaterGuardAmount(world):1)*(source.progression?.damageMultiplier??1)*(1-target.progression.damageReduction)*(1-artifactBonus(target,'mossback-scute'))*(source.entityType==='animal'?1-target.progression.passive('hunting.hide'):1)*(wet?1-artifactBonus(target,'drowned-gorget'):1)*(shadow?1-artifactBonus(target,'spire-bell'):1);
 target.health=Math.max(0,target.health-taken);
 target.vx+=Math.cos(angle)*knockback;target.vy+=Math.sin(angle)*knockback;
 if(target===world.player&&world.adventure)afterPlayerHit(world);
 if(world.adventure)world.effects.push({name:'player-hit',label:`-${Math.round(taken)}`,x:target.x,y:target.y-40,angle:0,life:.7,duration:.7});
 if(target.health===0){
  target.fishing.cancel();target.bobber=null;
  if(source!==target)source.progression?.recordElimination(target.id);
  world.effects.push({name:'defeat',x:target.x,y:target.y,angle:0,life:.8});
 }
 return true;
}
export function attack(world,actor,item){
 const spec=WEAPONS[item.name];actor.cooldown=(spec?.cooldown||.4)/(actor.progression?.attackSpeed??1);
 world.effects.push({name:item.name,x:actor.x,y:actor.y,angle:actor.angle,life:.55});
 if(item.name==='Sardine'){actor.health=Math.min(actor.progression.maxHealth,actor.health+35*(1+(actor.progression?.passive('food.heal')??0)));return;}
 if(item.name==='Grappling Squid'){world.moveActor(actor,Math.cos(actor.angle)*140,Math.sin(actor.angle)*140,false);return;}
 if(!spec)return;
 if(spec.pose)actor.weaponPose={spriteId:spec.pose,state:'swing',started:world.elapsed,duration:.45};
 if(spec.kind==='melee'){
  for(const target of combatTargets(world)){if(target===actor||target.health<=0)continue;
   const dx=target.x-actor.x,dy=target.y-actor.y,angle=Math.atan2(dy,dx);
   const difference=Math.atan2(Math.sin(angle-actor.angle),Math.cos(angle-actor.angle));
   if(Math.hypot(dx,dy)<=spec.range+(target.radius||14)&&Math.abs(difference)<=(spec.arc??1.05))damage(world,target,spec.damage,actor,angle,spec.knockback);
  }
 }else{
  // The Stag Crown strengthens arrows from the hunting bow.
  const damage=spec.damage*(item.name==='Hunting Bow'?1+artifactBonus(actor,'stag-crown'):1);
  world.projectiles.push({x:actor.x,y:actor.y,angle:actor.angle,owner:actor,travel:0,...spec,damage,name:item.name,hit:new Set(),radius:spec.kind==='bomb'?8:5});
 }
}
export function startRush(world,actor,name){
 const rush=WEAPON_RUSHES[name];if(!rush||actor.rush||actor.rushCooldown>0||actor.health<=0)return false;
 actor.rush={name,angle:actor.angle,remaining:rush.time,hit:new Set()};actor.rushCooldown=rush.cooldown;
 actor.weaponPose={spriteId:WEAPONS[name].pose,state:'rush',started:world.elapsed,duration:rush.time+.2};
 world.effects.push({name:rush.name,x:actor.x,y:actor.y,angle:actor.angle,life:rush.time+.2,duration:rush.time+.2});
 return true;
}
// The rush carries Eli along its heading; scenery stops it. Everything it passes is hit once.
export function updateRush(world,actor,dt){
 actor.rushCooldown=Math.max(0,(actor.rushCooldown||0)-dt);
 const r=actor.rush;if(!r)return;
 const rush=WEAPON_RUSHES[r.name],step=Math.min(dt,r.remaining),x=actor.x,y=actor.y;
 world.moveActor(actor,Math.cos(r.angle)*rush.speed*step,Math.sin(r.angle)*rush.speed*step,false);
 for(const target of combatTargets(world)){
  if(target===actor||target.health<=0||r.hit.has(target.id))continue;
  if(Math.hypot(target.x-actor.x,target.y-actor.y)<=(target.radius||14)+34){r.hit.add(target.id);damage(world,target,rush.damage,actor,r.angle,rush.knockback);}
 }
 r.remaining-=step;
 if(r.remaining<=1e-9||Math.hypot(actor.x-x,actor.y-y)<rush.speed*step*.2)actor.rush=null;
}
export function special(world,actor,kind){
 if(actor.health<=0||actor.fishing.state!=='idle'||actor.cooldown>0||!actor.progression.specials[kind]||world.matchState!=='playing')return false;
 actor.progression.specials[kind]--;actor.cooldown=.8;
 if(kind==='tidal')world.projectiles.push({x:actor.x,y:actor.y,angle:actor.angle,owner:actor,travel:0,kind:'wave',name:'Tidal Cannon',speed:360,range:650,damage:65,knockback:320,radius:25,hit:new Set()});
 else{world.effects.push({name:'Whirlpool Burst',x:actor.x,y:actor.y,angle:0,life:.8});for(const target of combatTargets(world)){if(target!==actor&&Math.hypot(target.x-actor.x,target.y-actor.y)<155)damage(world,target,45,actor,Math.atan2(target.y-actor.y,target.x-actor.x),340);}}
 return true;
}
export function updateProjectiles(world,dt){
 for(const shot of world.projectiles){
  const startX=shot.x,startY=shot.y;
  // Reedwater's Call bends toward the foe it was cast at.
  if(shot.homing!==null&&shot.homing!==undefined){const t=combatTargets(world).find(c=>c.id===shot.homing&&c.health>0);if(t){const want=Math.atan2(t.y-shot.y,t.x-shot.x),diff=Math.atan2(Math.sin(want-shot.angle),Math.cos(want-shot.angle)),max=shot.turn*dt;shot.angle+=Math.max(-max,Math.min(max,diff));}}
  const step=Math.min(shot.speed*dt,shot.range-shot.travel);
  shot.x+=Math.cos(shot.angle)*step;shot.y+=Math.sin(shot.angle)*step;shot.travel+=step;
  if(shot.trail){shot.trail.push({x:shot.x,y:shot.y});if(shot.trail.length>14)shot.trail.shift();}
  if(shot.kind==='bomb'){
   if(shot.travel>=shot.range){world.effects.push({name:'explosion',x:shot.x,y:shot.y,angle:0,life:.55});for(const target of combatTargets(world)){if(target!==shot.owner&&Math.hypot(target.x-shot.x,target.y-shot.y)<100)damage(world,target,shot.damage,shot.owner,Math.atan2(target.y-shot.y,target.x-shot.x),shot.knockback);}shot.done=true;}
  }else{
   // A monster's arrow only ever hits Eli.
   const hits=(shot.hostile?[world.player]:combatTargets(world)).filter(target=>target!==shot.owner&&target.health>0&&!shot.hit.has(target.id)).map(target=>({target,t:shotHit(shot,target,startX,startY)})).filter(hit=>hit.t!==null).sort((a,b)=>a.t-b.t);
   for(const {target} of hits){
    damage(world,target,shot.damage,shot.owner,shot.angle,shot.knockback);shot.hit.add(target.id);if(shot.kind==='wave')continue;
    // A maxed Reedwater's Call passes through its first foe; it then flies on straight.
    if(shot.pierce>0){shot.pierce--;shot.homing=null;break;}
    shot.done=true;break;
   }
  }
  if(shot.travel>=shot.range)shot.done=true;
 }
 world.projectiles=world.projectiles.filter(shot=>!shot.done);
}
