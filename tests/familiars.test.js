import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {ANIMAL_TYPES} from '../src/entities.js';
import {LOOT_TABLES,LOOT_ITEMS,SHARD_CHANCES} from '../src/loot.js';
import {FAMILIARS,FAMILIAR_TIERS,familiarBonus,familiarPassives,familiarStatus,tierFor,absorbShard,updateFamiliar} from '../src/familiars.js';
import {captureSave,restoreSave,importantProgress} from '../src/save-format.js';
import {damageAnimal,updateWildlife} from '../src/wildlife.js';
import {codexEntry,codexFamiliar,codexLoot} from '../src/codex.js';
import {walkable} from '../src/wilds.js';
import {SPAWN_AREAS} from '../src/spawn-tables.js';
import {rollArea} from '../src/spawns.js';
const fresh=()=>{const w=new World(()=>.2,{adventure:true});w.journeyId='familiar-test';return w;};
const give=(w,id,n)=>{for(let i=0;i<n;i++)absorbShard(w,id);};

test('every creature with a loot table drops its own familiar shard, and none fill the backpack categories by accident',()=>{
 const hunted=Object.entries(FAMILIARS).filter(([,f])=>!f.wellOnly);
 // The shadow walker kinds and the world bosses have no familiar yet (familiar:false).
 const kinds=Object.entries(ANIMAL_TYPES).filter(([,spec])=>spec.familiar===false).map(([id])=>id);
 assert.deepEqual(kinds.sort(),['ash-archer','drowned-captain','drowned-soldier','gloam-boar','greyhorn','hollow-stag','inkeel','mire-walker','stoneshade','whisperer']);
 assert.deepEqual(hunted.map(([id])=>id).sort(),Object.keys(LOOT_TABLES).filter(id=>!kinds.includes(id)).sort());
 for(const [id,f] of hunted){
  const entry=LOOT_TABLES[id].find(e=>e.item===f.shard);assert.ok(entry,`${id} shard is in its table`);
  assert.equal(entry.chance,SHARD_CHANCES[id]);assert.ok(entry.chance>0&&entry.chance<1);
  assert.equal(LOOT_ITEMS[f.shard].familiar,id);
  assert.equal(familiarPassives(id).length,3);
 }
 for(const spec of Object.values(ANIMAL_TYPES))if(spec.familiar!==false)assert.ok(FAMILIARS[spec.loot]);
});

test('tiers unlock at 5, 25 and 100 shards; the second rank replaces the first and the third adds a new passive',()=>{
 assert.deepEqual(FAMILIAR_TIERS,[5,25,100]);
 assert.deepEqual([0,4,5,24,25,99,100,250].map(tierFor),[0,0,1,1,2,2,3,3]);
 assert.equal(familiarBonus('deer',0),null);
 assert.deepEqual({...familiarBonus('deer',1)},{strength:2});
 assert.deepEqual({...familiarBonus('deer',2)},{strength:5});
 assert.deepEqual({...familiarBonus('deer',3)},{strength:5,huntingXp:.25});
 assert.deepEqual({...familiarBonus('shadow-walker',3)},{wisdom:7,strength:2,dexterity:2,luck:2});
 assert.equal(familiarPassives('shadow-walker')[2].description,'+2 to every attribute');
 assert.equal(familiarPassives('turtle')[0].description,'+15 max HP');
});

test('five shards combine into a summoned familiar whose passive raises the character stats, and dismissing it removes them',()=>{
 const w=fresh(),p=w.progression,base={...p.stats};
 give(w,'deer',4);
 assert.equal(familiarStatus(w,'deer').canCombine,false);assert.equal(w.familiarAction('deer','combine'),false);
 give(w,'deer',1);assert.equal(familiarStatus(w,'deer').canCombine,true);
 assert.equal(w.familiarAction('deer','summon'),false,'not bonded yet');
 assert.equal(w.familiarAction('deer','combine'),true);
 assert.equal(w.familiars.active,'deer');assert.ok(w.companion);
 assert.equal(p.stats.strength,base.strength+2);
 give(w,'deer',20);assert.equal(p.stats.strength,base.strength+5,'25 shards upgrades the active passive');
 give(w,'deer',75);
 assert.equal(familiarStatus(w,'deer').tier,3);
 const before=p.skills.hunting.xp;p.train('hunting',20);assert.equal(p.skills.hunting.xp-before,25);
 assert.equal(w.familiarAction('deer','dismiss'),true);
 assert.equal(w.familiars.active,null);assert.equal(w.companion,null);assert.deepEqual(p.stats,base);
 assert.equal(w.familiarAction('deer','combine'),false,'already bonded');
 assert.equal(w.familiarAction('deer','summon'),true);
});

test('one familiar follows at a time, and losing a health passive never leaves health above the new maximum',()=>{
 const w=fresh();give(w,'turtle',25);give(w,'eel',5);
 w.familiarAction('turtle','combine');assert.equal(w.progression.maxHealth,140);
 w.player.health=140;
 w.familiarAction('eel','combine');
 assert.equal(w.familiars.active,'eel');assert.equal(w.progression.maxHealth,100);assert.equal(w.player.health,100);
 assert.equal(w.progression.stats.dexterity,7);
 w.familiarAction('turtle','summon');assert.equal(w.familiars.active,'turtle');assert.equal(w.progression.stats.dexterity,5);
});

test('the third turtle passive cuts damage taken and the third eel passive speeds up fishing',()=>{
 const w=fresh();give(w,'turtle',100);w.familiarAction('turtle','combine');
 assert.ok(Math.abs(w.progression.damageReduction-.15)<1e-9);
 give(w,'eel',100);w.familiarAction('eel','combine');
 const p=w.progression,before=p.skills.fishing.xp;p.train('fishing',20);assert.equal(p.skills.fishing.xp-before,25);
 give(w,'rabbit',100);w.familiarAction('rabbit','combine');assert.ok(Math.abs(p.speedMultiplier-1.12)<1e-9);assert.equal(p.stats.luck,10);
});

test('picking up a shard feeds the familiar instead of the backpack',()=>{
 const w=fresh();const items=w.inventory.allItems.length;
 w.drops.push({id:'drop-90',entityType:'pickup',spriteId:'pickup',areaId:w.areaId,x:w.player.x+10,y:w.player.y,item:{...LOOT_ITEMS['Rabbit Familiar Shard'],id:'loot-drop-90',uses:1}});
 assert.equal(w.inspect(),true);
 assert.equal(w.familiars.shards.rabbit,1);assert.equal(w.inventory.allItems.length,items);assert.equal(w.drops.length,0);
 assert.match(w.message,/Rabbit Familiar Shard · 1 \/ 5/);
});

test('a hunted animal can drop its shard on the ground',()=>{
 const w=fresh(),deer=w.wildlife.find(a=>a.species==='deer');
 // A seed whose artifact roll misses and whose next roll lands under the shard chance.
 for(let seed=1;seed<5000;seed++){
  deer.seed=seed;const rolls=[];let s=seed;for(let i=0;i<4;i++){s^=s<<13;s^=s>>>17;s^=s<<5;s>>>=0;rolls.push(s/4294967296);}
  if(rolls[2]>=.5&&rolls[3]<SHARD_CHANCES.deer){deer.seed=seed;break;}
 }
 w.player.x=deer.x-60;w.player.y=deer.y;damageAnimal(w,deer,1000,w.player,0);
 assert.ok(w.drops.some(d=>d.item.familiar==='deer'),w.drops.map(d=>d.item.name).join());
});

test('every hunted species can come back from its area spawner, so shards can keep dropping',()=>{
 const w=fresh();
 for(const species of ['rabbit','deer','turtle','eel'])assert.ok(Object.values(SPAWN_AREAS).some(area=>Object.keys(area.tables.land||{}).concat(Object.keys(area.tables.water||{})).includes(species)),species);
 const species=new Set();
 for(let round=0;round<15;round++){
  for(const a of w.animals.filter(a=>a.areaId==='landing'&&a.health>0)){w.areaId=a.areaId;w.player.x=a.x-60;w.player.y=a.y;damageAnimal(w,a,1000,w.player,0);assert.equal(a.health,0);a.deathRemaining=0;}
  w.player.x=10;w.player.y=10;for(const a of rollArea(w,'landing'))species.add(a.species);
 }
 for(const kind of ['rabbit','deer','turtle','eel'])assert.ok(species.has(kind),kind);
});

test('the follower trails the player and reappears beside him after changing area',()=>{
 const w=fresh();give(w,'rabbit',5);w.familiarAction('rabbit','combine');
 const c=w.companion;assert.equal(c.areaId,w.areaId);
 w.player.x+=200;for(let i=0;i<120;i++)updateFamiliar(w,1/60);
 assert.ok(Math.hypot(w.companion.x-w.player.x,w.companion.y-w.player.y)<70);
 w.areaId='windchime';Object.assign(w.player,{x:330,y:1120});updateFamiliar(w,1/60);
 assert.equal(w.companion.areaId,'windchime');assert.ok(Math.hypot(w.companion.x-330,w.companion.y-1120)<60);
 assert.ok(walkable(w.companion.x,w.companion.y,'windchime'));
});

test('familiars survive a save round trip, older saves start without them and bad data is rejected',()=>{
 const w=fresh();give(w,'turtle',30);w.familiarAction('turtle','combine');w.player.health=135;
 const before=importantProgress(w);give(w,'eel',1);assert.notEqual(importantProgress(w),before);
 const save=captureSave(w),restored=restoreSave(save);
 assert.deepEqual(restored.familiars,w.familiars);assert.equal(restored.progression.maxHealth,140);assert.equal(restored.player.health,135);
 const old=structuredClone(save);delete old.state.familiars;old.state.player.health=90;
 const legacy=restoreSave(old);assert.deepEqual(legacy.familiars,{shards:{},bonded:[],active:null});assert.equal(legacy.progression.familiar,null);
 for(const bad of [{shards:{dragon:5},bonded:[],active:null},{shards:{deer:4},bonded:['deer'],active:null},{shards:{deer:5},bonded:[],active:'deer'},{shards:{deer:-1},bonded:[],active:null},{shards:{deer:5},bonded:['deer','deer'],active:null}]){
  const broken=structuredClone(save);broken.state.familiars=bad;broken.state.player.health=50;assert.throws(()=>restoreSave(broken),/familiar/i);
 }
});

test('guardian familiars are never hunted: no loot table or ground drop, only the well, and a full set of passives',()=>{
 for(const id of ['moonfang','rimejaw','flitlynx']){
  const f=FAMILIARS[id];assert.ok(f.wellOnly);assert.equal(LOOT_TABLES[id],undefined);assert.equal(SHARD_CHANCES[id],undefined);
  assert.equal(LOOT_ITEMS[f.shard].familiar,id);assert.match(LOOT_ITEMS[f.shard].description,/Wishing Well/);
  assert.equal(familiarPassives(id).length,3);assert.ok(familiarBonus(id,3));
  assert.ok(Object.values(LOOT_TABLES).every(table=>table.every(e=>e.item!==f.shard)));
 }
 const w=fresh();give(w,'rimejaw',5);assert.equal(w.familiarAction('rimejaw','combine'),true);
 assert.equal(w.familiars.active,'rimejaw');assert.equal(w.progression.maxHealth,110);
});

test('the index shows a familiar for every hunted creature and guardian, and labels shards in the loot table',()=>{
 for(const id of ['rabbit','deer','turtle','eel','shadow-walker'])assert.equal(codexFamiliar(codexEntry(id)).id,id);
 for(const id of ['moonfang','rimejaw','flitlynx']){const f=codexFamiliar(codexEntry(id));assert.equal(f.id,id);assert.equal(f.chance,null);}
 for(const id of ['mara','blacksmith','croshelda','elk-spirit','ocelot'])assert.equal(codexFamiliar(codexEntry(id)),null);
 assert.equal(codexLoot(codexEntry('deer')).rows.at(-1).familiar,'deer');
});
test('a newly summoned familiar greets Eli first, then the greeting runs out',()=>{
 const w=fresh();give(w,'deer',5);w.familiarAction('deer','combine');
 const c=w.companion;assert.ok(c.greet>1);
 for(let i=0;i<40;i++)updateFamiliar(w,.05);
 assert.equal(w.companion.greet,0);
});
