import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {SPAWN_AREAS,SLOTS,SHINY,AWAY_SECONDS,SPAWN_CLEARANCE} from '../src/spawn-tables.js';
import {createCreature,rollArea,updateSpawns,spawnWeights,makeShiny,shinyNotice} from '../src/spawns.js';
import {damageAnimal} from '../src/wildlife.js';
import {animalGround} from '../src/wildlife.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {SHARD_CHANCES} from '../src/loot.js';
const fresh=()=>{const w=new World(()=>.2,{adventure:true});w.journeyId='spawn-test';return w;};
const inArea=(w,id)=>w.animals.filter(a=>a.areaId===id);
// Walks into an area the way the world does: change area, then let the simulation tick.
const enter=(w,id,x,y,dt=1/60)=>{w.areaId=id;Object.assign(w.player,{x,y});w.elapsed+=dt;updateSpawns(w,dt);};
const away=(w,seconds)=>{w.areaId='village';Object.assign(w.player,{x:1800,y:530});w.elapsed+=seconds;updateSpawns(w,seconds);};
const kill=(w,a)=>{w.areaId=a.areaId;Object.assign(w.player,{x:a.x-60,y:a.y});damageAnimal(w,a,1e4,w.player,0);a.deathRemaining=0;};

test('every slot is safe ground for each creature its habitat can hold',()=>{
 for(const slot of Object.values(SLOTS)){
  assert.ok(SPAWN_AREAS[slot.areaId],slot.id);
  for(const [species] of spawnWeights(slot.areaId,slot.habitat)){const a=createCreature(slot,species);assert.ok(a,`${species} at ${slot.id}`);assert.ok(animalGround(a,a.x,a.y));}
 }
 assert.equal(new Set(Object.keys(SLOTS)).size,Object.values(SPAWN_AREAS).reduce((n,a)=>n+a.slots.length,0),'slot ids are unique');
});

test('a journey starts with the hand-placed animals, and new areas fill when Eli first walks in',()=>{
 const w=fresh();
 assert.equal(inArea(w,'landing').length,11);assert.equal(inArea(w,'windchime').length,1);assert.equal(inArea(w,'crossroads').length,0);
 enter(w,'crossroads',800,1130);
 assert.ok(inArea(w,'crossroads').length>0);assert.ok(inArea(w,'crossroads').length<=SPAWN_AREAS.crossroads.cap);
});

test('rolls only fill empty slots, living creatures stay, and the cap is never passed',()=>{
 const w=fresh();Object.assign(w.player,{x:10,y:10});
 const before=inArea(w,'landing');
 for(let i=0;i<50;i++){rollArea(w,'landing');const now=inArea(w,'landing');assert.ok(now.length<=SPAWN_AREAS.landing.cap);assert.equal(new Set(now.map(a=>a.slotId)).size,now.length,'one creature per slot');}
 for(const a of before)assert.ok(w.animals.includes(a),`${a.id} stayed`);
});

test('walking back in only rolls after being away for a while, and the cabin door is not a new visit',()=>{
 const w=fresh();for(const a of inArea(w,'landing'))kill(w,a);
 // Into the cabin and straight out: same visit, still empty.
 enter(w,'cabin',320,395,40);enter(w,'landing',1660,1570);assert.equal(inArea(w,'landing').length,0);
 // Over the edge and right back: too soon to roll.
 enter(w,'windchime',600,1510);enter(w,'landing',1400,120,5);assert.equal(inArea(w,'landing').length,0);
 // Away long enough: the landing rolls on entry.
 away(w,AWAY_SECONDS);enter(w,'landing',1400,120);assert.ok(inArea(w,'landing').length>0);
});

test('each area has one respawn clock that tops up every empty slot at once',()=>{
 const w=fresh();for(const a of inArea(w,'landing'))kill(w,a);
 enter(w,'landing',1400,120);const timer=SPAWN_AREAS.landing.respawnSeconds;
 updateSpawns(w,timer-1);assert.equal(inArea(w,'landing').length,0);
 updateSpawns(w,1);const filled=inArea(w,'landing').length;assert.ok(filled>2,`${filled} filled at once`);
 assert.equal(w.spawns.areas.landing.timer,timer);
});

test('nothing appears right beside Eli',()=>{
 const w=fresh();for(const a of inArea(w,'landing'))kill(w,a);
 const slot=SLOTS['deer-landing'];enter(w,'landing',slot.x,slot.y);
 for(let i=0;i<40;i++)rollArea(w,'landing');
 for(const a of inArea(w,'landing'))assert.ok(Math.hypot(SLOTS[a.slotId].x-slot.x,SLOTS[a.slotId].y-slot.y)>=SPAWN_CLEARANCE,a.slotId);
});

test('the same seed rolls the same creatures, so a reload cannot reroll a spawn',()=>{
 const run=()=>{const w=fresh();enter(w,'marsh',140,760);return inArea(w,'marsh').map(a=>[a.slotId,a.species,a.shiny]);};
 assert.deepEqual(run(),run());
});

test('shadow walkers roam the wilder areas, but in the story only after the storm has shown one',()=>{
 assert.deepEqual(spawnWeights('marsh','land').map(([s])=>s),['shadow-walker','rabbit','deer']);
 const roll=w=>{const seen=new Set();Object.assign(w.player,{x:10,y:10});for(let i=0;i<30;i++){for(const a of inArea(w,'marsh'))kill(w,a);w.areaId='marsh';rollArea(w,'marsh');for(const a of inArea(w,'marsh'))seen.add(a.species);}return seen;};
 assert.ok(roll(fresh()).has('shadow-walker'));
 const story=new World(()=>.2,{adventure:true,story:true});story.journeyId='spawn-story';
 assert.ok(!roll(story).has('shadow-walker'),'no shadow walkers before the storm');
 story.story.stage='complete';
 assert.ok(roll(story).has('shadow-walker'),'they roam once the storm has played');
});

test('about one spawn in a hundred is shiny, with more health and double Hunting XP',()=>{
 const w=fresh();Object.assign(w.player,{x:10,y:10});w.areaId='marsh';let shiny=0,total=0;
 for(let i=0;i<1500;i++){for(const a of inArea(w,'marsh'))kill(w,a);w.areaId='marsh';const born=rollArea(w,'marsh');total+=born.length;shiny+=born.filter(a=>a.shiny).length;
  for(const a of born.filter(a=>a.shiny)){assert.match(a.name,/^Shiny /);assert.equal(a.maxHealth,Math.round(createCreature(SLOTS[a.slotId],a.species).maxHealth*SHINY.health));assert.equal(a.health,a.maxHealth);}}
 const rate=shiny/total;assert.ok(rate>.004&&rate<.02,`${shiny}/${total}`);
});

test('a shiny drops rare loot far more often and counts in the Index',()=>{
 const tally=shiny=>{let antlers=0,shards=0;
  for(let seed=1;seed<=2000;seed++){const w=fresh(),a=createCreature(SLOTS['deer-landing'],'deer',{id:'test-deer',seed});if(shiny)makeShiny(a);w.wildlife.push(a);kill(w,a);
   antlers+=w.drops.filter(d=>d.item.name==='Deer Antlers').length;shards+=w.drops.filter(d=>d.item.familiar==='deer').length;
   if(shiny){assert.equal(w.hunting.shiny.hunted.deer,1);assert.match(w.message,/Shiny Deer hunted · \+50 Hunting XP/);}}
  return {antlers:antlers/2000,shards:shards/2000};};
 const normal=tally(false),boosted=tally(true);
 assert.ok(Math.abs(normal.antlers-.2)<.04&&Math.abs(boosted.antlers-.8)<.04,JSON.stringify([normal,boosted]));
 assert.ok(Math.abs(boosted.shards-SHARD_CHANCES.deer*SHINY.loot)<.04);
});

test('walking into an area with a shiny chimes, and the first close look marks it seen',()=>{
 const w=fresh(),a=createCreature(SLOTS['windchime-north'],'deer',{id:'gold',seed:7});makeShiny(a);w.wildlife.push(a);
 away(w,AWAY_SECONDS);w.message='Windchime Path';enter(w,'windchime',600,1510);
 assert.match(w.message,/Something glimmers in Windchime Path/);assert.equal(w.spawns.chimes,1);assert.equal(a.seen,false);
 enter(w,'windchime',a.x,a.y+200);assert.equal(a.seen,true);assert.equal(w.hunting.shiny.seen.deer,1);assert.ok(w.effects.some(e=>e.name==='shiny'));
 enter(w,'windchime',a.x,a.y+200);assert.equal(w.hunting.shiny.seen.deer,1,'seen once');
});

test('hunting a shiny turns a familiar of its kind gold',()=>{
 const w=fresh();w.familiars.shards.deer=5;w.familiarAction('deer','combine');assert.equal(w.companion.shiny,false);
 const a=createCreature(SLOTS['deer-landing'],'deer',{id:'gold',seed:3});makeShiny(a);w.wildlife.push(a);kill(w,a);
 assert.equal(w.companion.shiny,true);w.familiarAction('deer','dismiss');w.familiarAction('deer','summon');assert.equal(w.companion.shiny,true);
});

test('spawns, shinies and timers survive a save, and version 5 saves keep their animals',()=>{
 const w=fresh();enter(w,'crossroads',800,1130);
 const a=createCreature(SLOTS['crossroads-pond'],'eel',{id:'gold-eel',seed:5});makeShiny(a);a.health=10;w.wildlife.push(a);w.hunting.shiny.seen.eel=1;
 const r=restoreSave(captureSave(w));
 assert.deepEqual(r.animals.map(x=>[x.id,x.slotId,x.species,x.shiny,x.health]),w.animals.map(x=>[x.id,x.slotId,x.species,x.shiny,x.health]));
 assert.equal(r.wildlife.find(x=>x.id==='gold-eel').name,'Shiny Eel');assert.deepEqual(r.spawns.areas,w.spawns.areas);assert.equal(r.spawns.seed,w.spawns.seed);assert.equal(r.hunting.shiny.seen.eel,1);
 const old=captureSave(fresh());old.version=5;delete old.state.spawns;for(const x of old.state.animals){delete x.slotId;delete x.species;delete x.shiny;delete x.seen;x.respawnRemaining=10;}
 old.state.animals[0].health=0;
 const migrated=restoreSave(old);assert.equal(migrated.animals.length,12);assert.equal(migrated.animals[0].health,0);assert.equal(migrated.spawns.current,'landing');
 const bad=captureSave(w);bad.state.animals[0].slotId='nowhere';assert.throws(()=>restoreSave(bad),/animal/);
 const water=captureSave(w);water.state.animals.find(x=>x.id==='gold-eel').species='deer';assert.throws(()=>restoreSave(water),/animal/);
});

test('the exploring status line keeps only the shiny notice and drops every other message',()=>{
 assert.equal(shinyNotice("Grandpa's fishing rod is on the weapon rack inside the cabin. · +1 Wishstone"),'');
 assert.equal(shinyNotice('Deer hunted · +10 Hunting XP · Something glimmers in Windchime Path…'),'Something glimmers in Windchime Path…');
 assert.equal(shinyNotice('Something glimmers in Shellback Marsh… · The old well glows'),'Something glimmers in Shellback Marsh…');
 assert.equal(shinyNotice(''),'');assert.equal(shinyNotice(undefined),'');
});
