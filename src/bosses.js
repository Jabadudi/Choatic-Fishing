// World bosses. Gameplay only; the art reads state, time and direction (src/wildlife-art.js).
// Each boss spot in the world data (WORLD_DATA.bosses, placed in the world editor) holds one boss. It rises when Eli is in
// its area and its respawn time has passed, fights inside its arena, and resets (full health, adds gone) if Eli leaves
// the arena or the area. A defeat starts the spot's respawn clock, which is saved with the journey.
import {WORLD_DATA} from './world-data.js';
import {ANIMAL_TYPES,animalTraits} from './entities.js';
import {animalGround,moveAnimal} from './wildlife.js';
import {damage} from './combat.js';
import {monsterTarget,stepToward} from './monsters.js';
import {monstersAwake} from './spawns.js';
import {isWater} from './wilds.js';
import {BOSS_MARKS} from './loot.js';
import {earnMarks,marksLabel} from './trade.js';
export const BOSS_SPOTS=Object.freeze(WORLD_DATA.bosses.filter(b=>ANIMAL_TYPES[b.species]?.boss));
// How close to its spot Eli can be when a boss rises, so it never appears on top of him.
export const RISE_CLEARANCE=220;
export const RISE_SECONDS=1.4;
export const createBosses=()=>Object.fromEntries(BOSS_SPOTS.map(b=>[b.id,{nextAt:0,defeats:0}]));
const spotFor=id=>BOSS_SPOTS.find(b=>b.id===id);
function random(a){let s=a.seed;s^=s<<13;s^=s>>>17;s^=s<<5;a.seed=s>>>0;return a.seed/4294967296;}
function face(a,x,y){const angle=Math.atan2(y-a.y,x-a.x);a.direction={x:Math.cos(angle),y:Math.sin(angle)};return angle;}
function setState(a,state){a.state=state;a.time=0;}
// A creature on the nearest safe ground to (x, y), or null.
function place(a,x,y){
 if(animalGround(a,x,y)){a.x=x;a.y=y;return a;}
 for(let ring=1;ring<16;ring++)for(let step=0;step<16;step++){
  const angle=step*Math.PI/8,nx=x+Math.cos(angle)*ring*12,ny=y+Math.sin(angle)*ring*12;
  if(animalGround(a,nx,ny)){a.x=nx;a.y=ny;return a;}
 }
 return null;
}
// The spot's health and damage multipliers apply to the shadow walker kind the boss grew from.
export function createBoss(spot,world){
 const spec=ANIMAL_TYPES[spot.species],base=ANIMAL_TYPES[spec.base]||spec,n=world.nextBossId=(world.nextBossId||0)+1;
 const a={id:`boss-${spot.id}-${n}`,slotId:`boss:${spot.id}`,bossId:spot.id,areaId:spot.areaId,x:spot.x,y:spot.y,...animalTraits(spot.species),
  state:'rise',time:0,wait:1,alert:0,direction:{x:-1,y:0},seed:(7919*n+spot.x*31+spot.y)>>>0||1,shiny:false};
 a.maxHealth=a.health=Math.round(base.maxHealth*spot.health);a.attackDamage=Math.round(base.attackDamage*spot.damage);
 Object.assign(a,{name:spot.name,arena:spot.arena,leashRange:spot.arena,calls:[2/3,1/3],empowered:false,rushCooldown:2});
 if(!place(a,spot.x,spot.y))return null;
 a.home={x:a.x,y:a.y};return a;
}
const bossesHere=(world,id)=>world.wildlife.filter(a=>a.bossId===id);
// Leaving the area or the arena clears the fight: the boss and its adds go, and it rises fresh next time.
function clear(world,id){if(world.wildlife.some(a=>a.bossId===id))world.wildlife=world.wildlife.filter(a=>a.bossId!==id);}
export function updateBosses(world,dt){
 if(!world.adventure||world.matchState!=='playing'||!world.bosses)return;
 const p=world.player;
 for(const spot of BOSS_SPOTS){
  const state=world.bosses[spot.id];if(!state)continue;
  if(world.areaId!==spot.areaId){clear(world,spot.id);continue;}
  if(bossesHere(world,spot.id).some(a=>a.boss)||world.elapsed<state.nextAt||!monstersAwake(world))continue;
  if(Math.hypot(p.x-spot.x,p.y-spot.y)<RISE_CLEARANCE)continue;
  const boss=createBoss(spot,world);if(boss)world.wildlife.push(boss);
 }
}
// Two of the boss's kind come out of the water or the trees beside it, already hunting.
function callAdds(world,a){
 const kind=ANIMAL_TYPES[a.adds];if(!kind)return;
 const facing=Math.atan2(a.direction.y,a.direction.x);
 for(const side of [-1,1]){
  const n=world.nextBossId=(world.nextBossId||0)+1,add={id:`${a.id}-add-${n}`,slotId:`boss:${a.bossId}:add`,bossId:a.bossId,areaId:a.areaId,x:a.x,y:a.y,...animalTraits(a.adds),
   state:'idle',time:0,wait:.5,alert:3,direction:{...a.direction},seed:(a.seed^(n*2654435761))>>>0||1,shiny:false};
  if(!place(add,a.x+Math.cos(facing+side*1.9)*110,a.y+Math.sin(facing+side*1.9)*110))continue;
  add.home={x:add.x,y:add.y};world.wildlife.push(add);
  world.effects.push({name:'notice',label:'!',x:add.x,y:add.y-70,angle:0,life:.9,duration:.9});
 }
}
// The rush move: the Captain's Tide Lunge or Greyhorn's Antler Charge. Shadow antlers make Greyhorn's longer and wider.
export const rushMove=a=>a.moves?.lunge?'lunge':a.moves?.charge?'charge':null;
const reach=a=>a.empowered?a.moves.antlers?.reach??1:1;
// A swing lands: the Captain's sabre sweeps a wide arc in front of him; Greyhorn's stomp rings all the way round.
function strike(world,a,target){
 const p=world.player,distance=Math.hypot(p.x-a.x,p.y-a.y),angle=Math.atan2(p.y-a.y,p.x-a.x);
 if(a.moves?.charge){
  const radius=a.attackRange*reach(a);
  world.effects.push({name:'stomp',x:a.x,y:a.y,angle:0,radius,life:.6,duration:.6});
  if(target&&distance<=radius)damage(world,target,a.attackDamage,a,angle,a.knockback);
  return;
 }
 const facing=Math.atan2(a.direction.y,a.direction.x),off=Math.abs(Math.atan2(Math.sin(angle-facing),Math.cos(angle-facing)));
 world.effects.push({name:'sabre-sweep',x:a.x,y:a.y-20,angle:facing,life:.35,duration:.35});
 if(target&&distance<=a.attackRange+(target.radius||14)&&off<=1.4)damage(world,target,a.attackDamage,a,angle,a.knockback);
}
export function updateBoss(world,a,dt){
 const target=monsterTarget(world),p=world.player,move=a.moves||{};
 const distance=Math.hypot(p.x-a.x,p.y-a.y),fromHome=Math.hypot(a.x-a.home.x,a.y-a.home.y);
 // Once the fight is on, Eli has to get well clear of the arena (a fifth again) before the boss gives up.
 const fighting=!['idle','walk','rise','return'].includes(a.state),inArena=!!target&&Math.hypot(p.x-a.home.x,p.y-a.home.y)<a.arena*(fighting?1.2:1);
 a.attackCooldownRemaining=Math.max(0,(a.attackCooldownRemaining||0)-dt);a.rushCooldown=Math.max(0,(a.rushCooldown||0)-dt);
 if(a.wades)a.wading=isWater(a.x,a.y,a.areaId);
 const rush=move[rushMove(a)];
 switch(a.state){
  case 'rise':if(a.time>=RISE_SECONDS)setState(a,'idle');return;
  case 'call':
   if(!a.called&&a.time>=move.call.time*.5){a.called=true;callAdds(world,a);}
   if(a.time>=move.call.time){a.called=false;setState(a,'chase');}
   return;
  case 'antlers':
   if(a.time>=move.antlers.time){a.empowered=true;setState(a,'chase');world.message=`${a.name}’s antlers grow wide and black!`;}
   return;
  case 'attack':
   face(a,p.x,p.y);
   if(a.time>=a.attackWindup){strike(world,a,target);setState(a,'strike');a.attackCooldownRemaining=a.attackCooldown;}
   return;
  case 'strike':if(a.time>=a.attackRecover)setState(a,'chase');return;
  case 'rush-raise':
   // It keeps turning toward Eli through the windup, then commits to that line.
   a.rushAngle=face(a,p.x,p.y);
   if(a.time>=rush.windup){setState(a,'rush');a.rushHit=false;}
   return;
  case 'rush':{
   const step=rush.speed*dt,moved=moveAnimal(a,Math.cos(a.rushAngle)*step,Math.sin(a.rushAngle)*step);
   if(!a.rushHit&&target&&Math.hypot(p.x-a.x,p.y-a.y)<=a.radius+30*reach(a)){a.rushHit=true;damage(world,target,a.attackDamage*rush.damage,a,a.rushAngle,rush.knockback);}
   if(!moved||a.time>=rush.time*reach(a)||Math.hypot(a.x-a.home.x,a.y-a.home.y)>a.arena){setState(a,'skid');a.rushCooldown=rush.cooldown;}
   return;
  }
  case 'skid':if(a.time>=.45)setState(a,'chase');return;
  case 'return':
   if(inArena){setState(a,'chase');return;}
   // Back on its spot it shakes off the fight: full health, its phases again, and the adds gone.
   if(fromHome<24||!stepToward(a,a.home.x,a.home.y,a.speed*2,dt)){
    Object.assign(a,{health:a.maxHealth,calls:[2/3,1/3],empowered:false,alert:0,wait:1});setState(a,'idle');
    world.wildlife=world.wildlife.filter(b=>b===a||b.bossId!==a.bossId);
   }
   return;
 }
 if(!inArena){
  if(['notice','chase'].includes(a.state)){setState(a,'return');return;}
  // Waiting at its spot: a few steps about, then back.
  if(a.state==='idle'&&a.time>=a.wait){
   const angle=fromHome>90?Math.atan2(a.home.y-a.y,a.home.x-a.x):random(a)*Math.PI*2;
   a.direction={x:Math.cos(angle),y:Math.sin(angle)};setState(a,'walk');a.wait=1.2+random(a)*1.5;
  }else if(a.state==='walk'){
   const moved=moveAnimal(a,a.direction.x*a.speed*dt,a.direction.y*a.speed*dt);
   if(!moved||a.time>=a.wait){setState(a,'idle');a.wait=2.5+random(a)*2.5;}
  }
  return;
 }
 if(a.state==='idle'||a.state==='walk'){
  setState(a,'notice');face(a,p.x,p.y);
  world.effects.push({name:'notice',label:'!',x:a.x,y:a.y-110,angle:0,life:.9,duration:.9});
  world.message=a.freed?`${a.name} lowers his blackened antlers at you.`:`The ${a.name} rises to meet you!`;
  return;
 }
 if(a.state==='notice'){face(a,p.x,p.y);if(a.time>=a.noticeDelay)setState(a,'chase');return;}
 // Chasing. Health thresholds first: a call for adds at two thirds and one third, Greyhorn's antlers at half.
 const share=a.health/a.maxHealth;
 if(a.calls.length&&share<=a.calls[0]&&move.call){a.calls.shift();setState(a,'call');face(a,p.x,p.y);return;}
 if(move.antlers&&!a.empowered&&share<=move.antlers.at){setState(a,'antlers');return;}
 face(a,p.x,p.y);
 if(distance<=a.attackRange*reach(a)*.9){
  a.still=true;
  if(a.attackCooldownRemaining===0)setState(a,'attack');
  return;
 }
 if(rush&&a.rushCooldown===0&&distance>=rush.min&&distance<=rush.max*reach(a)){setState(a,'rush-raise');a.still=true;return;}
 // It never follows Eli out of its arena; at the edge it stands and waits for him to come back in reach.
 const ahead={x:a.x+(p.x-a.x)/distance*20,y:a.y+(p.y-a.y)/distance*20};
 a.still=Math.hypot(ahead.x-a.home.x,ahead.y-a.home.y)>a.arena&&Math.hypot(ahead.x-a.home.x,ahead.y-a.home.y)>fromHome||!stepToward(a,p.x,p.y,a.chaseSpeed,dt);
}
// Called once the killing blow lands, after the loot has rolled.
export function bossDefeated(world,a){
 const spot=spotFor(a.bossId),state=world.bosses?.[a.bossId];if(!spot||!state)return '';
 state.defeats++;state.nextAt=world.elapsed+spot.respawnMinutes*60;
 // The fall plays out longer than a shadow walker's; Greyhorn stands up freed before he fades into the trees.
 a.deathRemaining=a.freed?5:3;
 const [least,most]=BOSS_MARKS[a.species]||[0,0],marks=earnMarks(world,least+Math.floor(random(a)*(most-least+1)));
 const news=a.freed?`The shadow pours out of ${a.name}. He is free, for now`:`The ${a.name} sinks back into the water`;
 return `${news}${marks?` · ${marksLabel(marks)}`:''}`;
}
// Saved spot clocks. Unknown spots are dropped and missing ones start ready.
export function restoreBosses(data,world){
 world.bosses=createBosses();if(data===undefined||data===null)return;
 if(typeof data!=='object'||Array.isArray(data))throw Error('Invalid boss data.');
 for(const [id,saved] of Object.entries(data)){
  if(!saved||typeof saved!=='object'||typeof saved.nextAt!=='number'||!Number.isFinite(saved.nextAt)||saved.nextAt<0||saved.nextAt>1e12||!Number.isSafeInteger(saved.defeats)||saved.defeats<0)throw Error('Invalid boss data.');
  if(world.bosses[id])world.bosses[id]={nextAt:saved.nextAt,defeats:saved.defeats};
 }
}
