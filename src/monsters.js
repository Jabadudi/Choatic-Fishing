// Aggressive monsters (shadow walkers) and what happens when one brings Eli down. Gameplay only.
// A monster roams near its home, notices Eli, chases him, winds up and swings. It gives up when he escapes
// or it strays too far from home, walks back and heals. The art reads state, time and direction; it never moves anything.
import {damage} from './combat.js';
import {moveAnimal,animalGround} from './wildlife.js';
import {areaFor,SPAWN} from './wilds.js';
// How long Eli stays down before he wakes at the area's arrival point, and how long monsters then leave him be.
export const DEFEAT_SECONDS=3;
export const RESPAWN_GRACE=4;
function random(a){let s=a.seed;s^=s<<13;s^=s>>>17;s^=s<<5;a.seed=s>>>0;return a.seed/4294967296;}
export const monsterTarget=world=>world.player.health>0&&!(world.respawnGrace>0)&&!world.defeat?world.player:null;
function face(a,x,y){const angle=Math.atan2(y-a.y,x-a.x);a.direction={x:Math.cos(angle),y:Math.sin(angle)};return angle;}
// Straight at the goal, or the nearest side route when scenery is in the way.
function stepToward(a,x,y,speed,dt){
 const angle=Math.atan2(y-a.y,x-a.x);
 for(const offset of [0,.6,-.6,1.2,-1.2,1.8,-1.8]){
  const dx=Math.cos(angle+offset),dy=Math.sin(angle+offset);
  if(!animalGround(a,a.x+dx*14,a.y+dy*14))continue;
  a.direction={x:dx,y:dy};return moveAnimal(a,dx*speed*dt,dy*speed*dt);
 }
 return false;
}
function setState(a,state){a.state=state;a.time=0;}
export function updateMonster(world,a,dt){
 const target=monsterTarget(world),p=world.player;
 const distance=Math.hypot(p.x-a.x,p.y-a.y),fromHome=Math.hypot(a.x-a.home.x,a.y-a.home.y);
 a.attackCooldownRemaining=Math.max(0,(a.attackCooldownRemaining||0)-dt);
 // A swing that has started always finishes; it only lands if Eli is still in reach and not dashing.
 if(a.state==='attack'){
  const angle=face(a,p.x,p.y);a.attackRemaining=Math.max(0,a.attackRemaining-dt);
  if(a.attackRemaining===0){
   if(target&&distance<=a.attackRange)damage(world,target,a.attackDamage,a,angle,160);
   setState(a,'strike');a.recoverRemaining=a.attackRecover;a.attackCooldownRemaining=a.attackCooldown;
  }
  return;
 }
 if(a.state==='strike'){a.recoverRemaining=Math.max(0,a.recoverRemaining-dt);if(a.recoverRemaining===0)setState(a,'chase');return;}
 if(a.state==='notice'||a.state==='chase'){
  if(!target||fromHome>a.leashRange||distance>a.loseRange){setState(a,'return');a.still=false;return;}
  face(a,p.x,p.y);
  if(a.state==='notice'){if(a.time>=a.noticeDelay)setState(a,'chase');return;}
  if(distance<=a.attackRange){
   a.still=true;
   if(a.attackCooldownRemaining===0){setState(a,'attack');a.attackRemaining=a.attackWindup;}
  }else a.still=!stepToward(a,p.x,p.y,a.chaseSpeed,dt);
  return;
 }
 if(a.state==='return'){
  // Hurting it on the way home turns it around, unless it is already near the edge of its range.
  if(target&&a.alert>0&&fromHome<a.leashRange*.8){setState(a,'chase');return;}
  // Back home it shakes off its wounds and settles. 
  if(fromHome<24||!stepToward(a,a.home.x,a.home.y,a.speed*1.6,dt)){a.health=a.maxHealth;a.alert=0;setState(a,'idle');a.wait=1;}
  return;
 }
 // Roaming. Eli coming close, or hurting it from range, starts the hunt.
 if(target&&fromHome<a.leashRange&&(distance<a.noticeRange||a.alert>0)){
  setState(a,'notice');face(a,p.x,p.y);a.still=true;
  world.effects.push({name:'notice',label:'!',x:a.x,y:a.y-70,angle:0,life:.9,duration:.9});
  if(!a.noticed){a.noticed=true;world.message=`A ${a.name} has seen you!`;}
  return;
 }
 if(a.state==='idle'&&a.time>=a.wait){
  const angle=fromHome>160?Math.atan2(a.home.y-a.y,a.home.x-a.x):random(a)*Math.PI*2;
  a.direction={x:Math.cos(angle),y:Math.sin(angle)};setState(a,'walk');a.wait=1.5+random(a)*2;
 }else if(a.state==='walk'){
  const moved=moveAnimal(a,a.direction.x*a.speed*dt,a.direction.y*a.speed*dt);
  if(!moved||a.time>=a.wait){setState(a,'idle');a.wait=2+random(a)*2.5;}
 }else if(!['idle','walk'].includes(a.state))setState(a,'idle');
}
// Eli falls when his health runs out, stays down for a moment, then wakes at the area's arrival point at full health.
// He keeps everything he carries. Monsters ignore him for a few seconds so he is not caught again on waking.
export function updateDefeat(world,dt){
 if(!world.adventure)return;
 world.respawnGrace=Math.max(0,(world.respawnGrace||0)-dt);
 const p=world.player;
 if(p.health>0){world.defeat=null;return;}
 if(!world.defeat){world.defeat={remaining:DEFEAT_SECONDS,total:DEFEAT_SECONDS};world.cancel();p.vx=0;p.vy=0;world.message='Eli collapses…';return;}
 world.defeat.remaining=Math.max(0,world.defeat.remaining-dt);
 if(world.defeat.remaining>0)return;
 const area=areaFor(world.areaId),spot=area.spawn||SPAWN;
 Object.assign(p,{x:spot.x,y:spot.y,vx:0,vy:0,health:p.progression.maxHealth});
 world.defeat=null;world.projectiles=[];world.respawnGrace=RESPAWN_GRACE;
 world.message=`Eli wakes up at ${area.name}, aching but alive. Whatever was chasing him has lost the trail.`;
}
