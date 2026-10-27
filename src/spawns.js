// Area spawner: fills empty spawn slots when Eli walks into an area and whenever that area's respawn timer runs out.
// Gameplay only. All rolls use one seeded generator kept in the save, so reloading cannot reroll a spawn or a shiny.
import {SPAWN_AREAS,SPAWN_PARENT,AWAY_SECONDS,SPAWN_CLEARANCE,SHINY,SLOTS} from './spawn-tables.js';
import {ANIMAL_TYPES,animalTraits} from './entities.js';
import {animalGround} from './wildlife.js';
import {areaFor} from './wilds.js';
export const spawnAreaFor=areaId=>{const id=SPAWN_PARENT[areaId]??areaId;return SPAWN_AREAS[id]?id:null;};
// Only creatures with built behaviour can spawn; the others' weight is shared out to the rest of the table.
export const spawnable=species=>Object.hasOwn(ANIMAL_TYPES,species);
export function spawnWeights(areaId,habitat){
 const table=SPAWN_AREAS[areaId]?.tables[habitat]||{};
 return Object.entries(table).filter(([species,weight])=>spawnable(species)&&weight>0);
}
// The fishing-hut story needs three meadow deer until supper is cooked.
const storyHunt=world=>!!world.story&&['arrival','explore','fish'].includes(world.story.stage);
export function createSpawns(areaId='landing'){
 return {seed:52021,next:1,current:spawnAreaFor(areaId),chimes:0,areas:Object.fromEntries(Object.entries(SPAWN_AREAS).map(([id,area])=>[id,{lastSeen:id===spawnAreaFor(areaId)?0:null,timer:area.respawnSeconds}]))};
}
function random(spawns){let s=spawns.seed;s^=s<<13;s^=s>>>17;s^=s<<5;spawns.seed=s>>>0;return spawns.seed/4294967296;}
function pick(weights,roll){
 const total=weights.reduce((sum,[,w])=>sum+w,0);let at=roll*total;
 for(const [species,weight] of weights){if((at-=weight)<0)return species;}
 return weights.at(-1)?.[0]??null;
}
// Builds a creature for a slot, nudged onto its habitat when the slot point itself is not quite safe.
export function createCreature(slot,species,{id=slot.id,seed=9041,shiny=false,index=0}={}){
 const traits=animalTraits(species);
 if(traits.habitat!==slot.habitat)return null;
 const animal={id,slotId:slot.id,areaId:slot.areaId,x:slot.x,y:slot.y,...traits,state:'idle',time:0,wait:1+index*.5,alert:0,direction:{x:-1,y:0},seed,shiny:false};
 if(species==='rabbit')Object.assign(animal,{wait:1+index*.37,hopDuration:.65,hopDistance:0});
 let found=animalGround(animal,slot.x,slot.y);
 for(let ring=1;ring<14&&!found;ring++)for(let step=0;step<16;step++){
  const angle=step*Math.PI/8,x=slot.x+Math.cos(angle)*ring*12,y=slot.y+Math.sin(angle)*ring*12;
  if(animalGround(animal,x,y)){animal.x=x;animal.y=y;found=true;break;}
 }
 if(!found)return null;
 animal.home={x:animal.x,y:animal.y};
 if(shiny)makeShiny(animal);
 return animal;
}
// A shiny is its normal kind with more health and Hunting XP. Its loot boost is applied when the loot rolls.
export function makeShiny(animal){
 const spec=ANIMAL_TYPES[animal.species],maxHealth=Math.round(spec.maxHealth*SHINY.health);
 return Object.assign(animal,{shiny:true,seen:false,name:`Shiny ${spec.name}`,maxHealth,health:maxHealth,huntXp:spec.huntXp*SHINY.huntXp});
}
export const listFor=(world,species)=>species==='rabbit'?world.rabbits:world.wildlife;
// Carcasses leave once they have faded or once Eli is elsewhere, which frees their slot.
function prune(world){
 const gone=a=>a.health<=0&&(a.areaId!==world.areaId||!(a.deathRemaining>0));
 if(world.rabbits.some(gone))world.rabbits=world.rabbits.filter(a=>!gone(a));
 if(world.wildlife.some(gone))world.wildlife=world.wildlife.filter(a=>!gone(a));
}
// One roll for every empty slot of the area. Living creatures stay; new ones only fill up to the cap.
export function rollArea(world,areaId){
 const area=SPAWN_AREAS[areaId],spawns=world.spawns;if(!area||!spawns)return [];
 prune(world);
 const living=world.animals.filter(a=>a.areaId===areaId),taken=new Set(living.map(a=>a.slotId));
 const story=storyHunt(world),here=spawnAreaFor(world.areaId)===areaId,p=world.player;
 const empty=Object.values(SLOTS).filter(slot=>slot.areaId===areaId&&!taken.has(slot.id));
 // Story slots first so the Chapter 1 deer always fit, then the rest in a seeded order.
 const order=empty.map(slot=>({slot,first:story&&slot.story,key:random(spawns)})).sort((a,b)=>(b.first-a.first)||(a.key-b.key));
 let count=living.length;const born=[];
 for(const {slot,first} of order){
  if(count>=area.cap&&!first)break;
  // Nothing pops into being right beside Eli. A story deer may, so the supper hunt cannot stall.
  if(!first&&here&&world.areaId===areaId&&Math.hypot(slot.x-p.x,slot.y-p.y)<SPAWN_CLEARANCE)continue;
  if(!first&&random(spawns)>=area.chance)continue;
  const species=first?'deer':pick(spawnWeights(areaId,slot.habitat),random(spawns));if(!species)continue;
  const shiny=!first&&random(spawns)<SHINY.chance;
  const creature=createCreature(slot,species,{id:`${slot.id}-${spawns.next}`,seed:Math.floor(random(spawns)*4294967295)||1,shiny});
  if(!creature)continue;
  spawns.next++;listFor(world,species).push(creature);born.push(creature);count++;
 }
 return born;
}
function announce(world,areaId){
 if(!world.animals.some(a=>a.areaId===areaId&&a.shiny&&a.health>0))return;
 const text=`Something glimmers in ${areaFor(areaId).name}…`;
 world.message=world.message&&!world.message.includes(text)?`${world.message} · ${text}`:text;world.spawns.chimes++;
}
export function updateSpawns(world,dt){
 const spawns=world.spawns;if(!world.adventure||!spawns||world.matchState!=='playing')return;
 prune(world);
 const id=spawnAreaFor(world.areaId),state=id&&spawns.areas[id];
 if(id!==spawns.current){
  spawns.current=id;
  if(state){
   if(state.lastSeen===null||world.elapsed-state.lastSeen>=AWAY_SECONDS){rollArea(world,id);state.timer=SPAWN_AREAS[id].respawnSeconds;}
   announce(world,id);
  }
 }
 if(state){
  state.lastSeen=world.elapsed;state.timer-=dt;
  // The area's own clock: one roll for all its empty slots, filling only what the cap allows.
  if(state.timer<=0){state.timer=SPAWN_AREAS[id].respawnSeconds;rollArea(world,id);}
 }
 // The first close look at a shiny gets a burst of sparkles and goes into the Index.
 for(const a of world.animals){
  if(!a.shiny||a.seen||a.health<=0||a.areaId!==world.areaId||Math.hypot(a.x-world.player.x,a.y-world.player.y)>SHINY.seenRange)continue;
  a.seen=true;const seen=world.hunting.shiny.seen;seen[a.species]=(seen[a.species]||0)+1;spawns.chimes++;
  world.effects.push({name:'shiny',label:'',x:a.x,y:a.y-30,angle:0,life:1.4,duration:1.4});
  world.message=`A ${a.name}! Its drops are far more likely to be rare.`;
 }
}
// Accepts only known slots and whole counters; older saves start the spawner as if Eli had just arrived.
export function restoreSpawns(data,world){
 const fail=message=>{throw Error(message);},fine=(n,max=1e12)=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=max;
 world.spawns=createSpawns(world.areaId);
 const here=spawnAreaFor(world.areaId);if(here)world.spawns.areas[here].lastSeen=world.elapsed;
 if(data===undefined||data===null)return;
 if(typeof data!=='object'||!Number.isSafeInteger(data.seed)||data.seed<1||data.seed>4294967295||!Number.isSafeInteger(data.next)||data.next<1||!data.areas||typeof data.areas!=='object')fail('Invalid spawn data.');
 if(data.current!==null&&!SPAWN_AREAS[data.current])fail('Invalid spawn area.');
 Object.assign(world.spawns,{seed:data.seed,next:data.next,current:data.current});
 for(const [id,saved] of Object.entries(data.areas)){
  if(!SPAWN_AREAS[id]||!saved||(saved.lastSeen!==null&&!fine(saved.lastSeen))||!fine(saved.timer,SPAWN_AREAS[id].respawnSeconds))fail('Invalid spawn timers.');
  world.spawns.areas[id]={lastSeen:saved.lastSeen,timer:saved.timer};
 }
}
