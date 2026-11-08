// Field map play (src/field-maps.js holds the data): each map's elite, the map clear goal, its rank banner and the
// first-clear reward. Gameplay only; the renderer reads world.fieldMaps and world.fieldClear.
import {FIELD_MAPS,ELITES,fieldMap,applyLevel,levelAt,fights,rankFor,rankOrder,RANKS} from './field-maps.js';
import {createCreature,monstersAwake} from './spawns.js';
import {earnMarks} from './trade.js';
import {areaFor} from './wilds.js';
import {preloadSprite} from './sprites.js';
import {STONES_LIMIT} from './wishing-well.js';
// An elite never rises right beside Eli.
export const ELITE_CLEARANCE=260;
// How long the clear banner stays up.
export const CLEAR_BANNER_SECONDS=6;
const freshRun=()=>({kills:0,elite:false,startedAt:null,damage:0,combo:0});
export const createFieldMaps=()=>Object.fromEntries(Object.entries(FIELD_MAPS).map(([id,f])=>[id,{...freshRun(),clears:0,best:null,eliteAt:0,...(f.bunches?{elite:!f.elite,defeated:[]}:{})}]));
// A bunch map (Regions 1.1) places its monsters once, in fixed bunches, and they never come back. Each one is named by
// its bunch and place in it, so a save only needs the names of the ones already down.
export function createBunches(world,id){
 const f=fieldMap(id),state=stateFor(world,id);if(!f?.bunches)return [];
 const down=new Set(state?.defeated||[]),out=[],width=areaFor(id).width;
 f.bunches.forEach(([x,y,count],b)=>{
  for(let i=0;i<count;i++){
   const slimeId=`${id}:${b+1}-${i+1}`;if(down.has(slimeId))continue;
   const angle=i/count*Math.PI*2+b*.9,r=count>1?46:0;
   const a=createCreature({id:slimeId,areaId:id,habitat:'land',x:x+Math.cos(angle)*r,y:y+Math.sin(angle)*r*.7},f.species,{id:slimeId,seed:(b*977+i*131+17)>>>0,index:i});
   if(!a)continue;applyLevel(a,levelAt(id,x,width));a.packId=`${id}:${b+1}`;a.bunch=true;out.push(a);
  }
 });
 return out;
}
export const mapCleared=(world,id)=>(stateFor(world,id)?.clears||0)>0;
const stateFor=(world,id)=>world.fieldMaps?.[id]||null;
// The elite: its kind, made bigger, darker and much tougher, at its spot on the map.
export function createElite(spec,world){
 const n=world.nextEliteId=(world.nextEliteId||0)+1;
 const a=createCreature({id:`elite:${spec.id}`,areaId:spec.areaId,habitat:'land',x:spec.x,y:spec.y},spec.species,{id:`elite-${spec.id}-${n}`,seed:(7907*n+spec.x*31+spec.y)>>>0||1});
 if(!a)return null;
 applyLevel(a,spec.level);
 a.maxHealth=a.health=Math.round(a.maxHealth*spec.health);
 if(a.attackDamage)a.attackDamage=Math.round(a.attackDamage*spec.damage);
 a.huntXp=Math.round((a.huntXp||10)*4);
 Object.assign(a,{eliteId:spec.id,elite:true,name:spec.name,scale:spec.scale,tint:spec.tint,armor:spec.armor??1,radius:Math.round(a.radius*Math.min(2,spec.scale*.8))});
 if(a.leashRange)a.leashRange=Math.round(a.leashRange*1.3);
 return a;
}
// Elites, like bosses, are not saved: one rises fresh when Eli comes back and its respawn time has passed.
function clearElite(world,id){if(world.wildlife.some(a=>a.eliteId===id))world.wildlife=world.wildlife.filter(a=>a.eliteId!==id);}
export function updateFieldMaps(world,dt){
 if(!world.adventure||!world.fieldMaps||world.matchState!=='playing')return;
 const p=world.player;
 for(const spec of ELITES){
  const state=stateFor(world,spec.areaId);if(!state)continue;
  if(world.areaId!==spec.areaId){clearElite(world,spec.id);continue;}
  if(world.wildlife.some(a=>a.eliteId===spec.id&&a.health>0)||world.elapsed<state.eliteAt||!monstersAwake(world))continue;
  if(Math.hypot(p.x-spec.x,p.y-spec.y)<ELITE_CLEARANCE)continue;
  const elite=createElite(spec,world);if(elite){world.wildlife.push(elite);preloadSprite(elite.spriteId);}
 }
 // The run on this map remembers its best combo for the rank.
 const here=stateFor(world,world.areaId);if(here)here.combo=Math.max(here.combo,world.combo?.count||0);
 if(world.fieldClear){world.fieldClear.remaining-=dt;if(world.fieldClear.remaining<=0)world.fieldClear=null;}
}
// Damage Eli takes on a field map counts against the rank.
export function notePlayerHurt(world,amount){const state=stateFor(world,world.areaId);if(state&&amount>0)state.damage+=amount;}
// A monster or the elite falls. Returns text for the kill message, if the map was cleared.
export function fieldKill(world,animal){
 const f=fieldMap(animal.areaId),state=stateFor(world,animal.areaId);if(!f||!state||!fights(animal))return '';
 if(state.startedAt===null)state.startedAt=world.elapsed;
 if(animal.eliteId){state.elite=true;state.eliteAt=world.elapsed+(f.elite.respawnSeconds||300);}
 else state.kills++;
 // A bunch map remembers which of its monsters are down; once cleared it stays cleared.
 if(f.bunches){if(!state.defeated.includes(animal.id))state.defeated.push(animal.id);if(state.clears>0)return '';}
 if(state.kills<f.clear.kills||!state.elite)return '';
 return clearMap(world,animal.areaId);
}
function clearMap(world,id){
 const f=fieldMap(id),state=stateFor(world,id),seconds=Math.max(0,world.elapsed-state.startedAt);
 const result=rankFor({seconds,damage:state.damage,combo:state.combo}),first=state.clears===0;
 state.clears++;if(!state.best||rankOrder(result.rank)<rankOrder(state.best))state.best=result.rank;
 let reward=null;
 if(first){
  const {wishstones=0,marks=0}=f.clear.reward;
  if(world.well&&wishstones>0)world.well.stones=Math.min(STONES_LIMIT,(world.well.stones||0)+wishstones);
  reward={wishstones,marks:earnMarks(world,marks)};
 }
 const name=areaFor(id).name;
 world.fieldClear={areaId:id,code:f.code,name,rank:result.rank,seconds,damage:Math.round(state.damage),combo:state.combo,first,reward,remaining:CLEAR_BANNER_SECONDS,duration:CLEAR_BANNER_SECONDS};
 // A field map with respawning monsters starts a fresh run; a bunch map is done and keeps its count.
 if(!f.bunches)Object.assign(state,freshRun());
 return `${f.code} ${name} cleared · Rank ${result.rank}${reward?` · First clear: ${reward.wishstones} Wishstone, ${reward.marks} reed marks`:''}`;
}
// A bunch map's live tracker: each bunch's size and how many of it are down, and the rank the run is on course for.
function liveScore(world,f,state){
 const down=new Set(state.defeated||[]),id=world.areaId;
 const bunches=f.bunches.map(([,,count],b)=>({count,down:Array.from({length:count},(_,i)=>`${id}:${b+1}-${i+1}`).filter(n=>down.has(n)).length}));
 const seconds=state.startedAt===null?0:Math.max(0,world.elapsed-state.startedAt),combo=world.combo?.remaining>0?world.combo.count:0;
 return {bunches,seconds,damage:state.damage,combo,bestCombo:state.combo,live:rankFor({seconds,damage:state.damage,combo:state.combo}).rank,started:state.startedAt!==null};
}
// What the HUD shows for the map Eli is on: progress toward the clear.
export function fieldProgress(world){
 const f=fieldMap(world.areaId),state=stateFor(world,world.areaId);if(!f||!state)return null;
 return {code:f.code,kills:Math.min(state.kills,f.clear.kills),goal:f.clear.kills,elite:state.elite,eliteName:f.elite?.name??null,best:state.best,clears:state.clears,...(f.bunches?{species:f.species,...liveScore(world,f,state)}:{})};
}
// Accepts only known maps and sane numbers; older saves start every map fresh.
export function restoreFieldMaps(data,world,fail=m=>{throw Error(m);}){
 world.fieldMaps=createFieldMaps();if(data===undefined||data===null)return;
 if(typeof data!=='object'||Array.isArray(data))fail('Invalid field map data.');
 const n=(v,max=1e12)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
 for(const [id,saved] of Object.entries(data)){
  if(!world.fieldMaps[id])continue;
  if(!saved||typeof saved!=='object'||!Number.isSafeInteger(saved.kills)||saved.kills<0||saved.kills>1e6||typeof saved.elite!=='boolean'||!(saved.startedAt===null||n(saved.startedAt))||!n(saved.damage)||!Number.isSafeInteger(saved.combo)||saved.combo<0
   ||!Number.isSafeInteger(saved.clears)||saved.clears<0||!(saved.best===null||RANKS.some(([r])=>r===saved.best))||!n(saved.eliteAt))fail('Invalid field map data.');
  world.fieldMaps[id]={kills:saved.kills,elite:saved.elite,startedAt:saved.startedAt,damage:saved.damage,combo:saved.combo,clears:saved.clears,best:saved.best,eliteAt:saved.eliteAt};
  // A bunch map's defeated monsters, by name; a name the map does not place is refused.
  if(FIELD_MAPS[id].bunches){
   const names=new Set(FIELD_MAPS[id].bunches.flatMap(([,,count],b)=>Array.from({length:count},(_,i)=>`${id}:${b+1}-${i+1}`)));
   const down=saved.defeated??[];if(!Array.isArray(down)||down.some(n=>!names.has(n))||new Set(down).size!==down.length)fail('Invalid field map data.');
   world.fieldMaps[id].defeated=[...down];
  }
 }
}
