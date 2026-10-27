import test from 'node:test';
import assert from 'node:assert/strict';
import {CODEX_CATEGORIES,CODEX_ENTRIES,AREA_BOUNDS,codexLocations,codexRegions,codexSpawnRates,codexLoot,codexEntry,atlasPoint,chanceLabel,shinyChance} from '../src/codex.js';
import {SLOTS} from '../src/spawn-tables.js';
import {ANIMAL_TYPES} from '../src/entities.js';
import {LOOT_TABLES,LOOT_ITEMS,rollLoot} from '../src/loot.js';
import {ITEM_CATEGORIES} from '../src/inventory.js';
import {World} from '../src/world.js';
import {damageAnimal} from '../src/wildlife.js';
import {walkable} from '../src/wilds.js';
import {DEFAULT_BINDINGS} from '../src/input-bindings.js';

test('every huntable animal has its own loot table, with one guaranteed drop and rarer extras',()=>{
 for(const [species,spec] of Object.entries(ANIMAL_TYPES)){
  const table=LOOT_TABLES[spec.loot];assert.ok(table,`${species} has a loot table`);
  assert.equal(table.filter(e=>e.chance>=1).length,1,`${species} has one guaranteed drop`);
  for(const entry of table){assert.ok(LOOT_ITEMS[entry.item],entry.item);assert.ok(entry.chance>0&&entry.chance<=1);assert.ok(ITEM_CATEGORIES.some(c=>c.id===LOOT_ITEMS[entry.item].category));}
 }
 assert.deepEqual(rollLoot('rabbit',()=>.99).map(i=>i.name),['Rabbit Meat']);
 assert.deepEqual(rollLoot('turtle',()=>0).map(i=>i.name),['Turtle Meat','Turtle Shell','River Pearl','Turtle Familiar Shard']);
 assert.deepEqual(rollLoot('eel',()=>.3).map(i=>i.name),['Eel Fillet','Eel Skin']);
});

test('hunting a rabbit drops its loot, and water animals drop theirs on walkable ground',()=>{
 const w=new World(()=>.2,{adventure:true});
 const rabbit=w.rabbits[0];w.player.x=rabbit.x-60;w.player.y=rabbit.y;
 assert.equal(damageAnimal(w,rabbit,100,w.player,0),true);
 assert.ok(w.drops.some(d=>d.item.name==='Rabbit Meat'));
 for(const species of ['turtle','eel']){
  const a=w.wildlife.find(x=>x.species===species);w.player.x=a.x;w.player.y=a.y-200;
  damageAnimal(w,a,1000,w.player,0);
  const drops=w.drops.filter(d=>d.item.name===rollLoot(species,()=>1)[0].name);
  assert.equal(drops.length,1);assert.ok(walkable(drops[0].x,drops[0].y,drops[0].areaId),`${species} meat lands on a bank`);
 }
});

test('the index lists every category, and every entry has a description, a map and a loot or wares panel',()=>{
 assert.deepEqual(CODEX_CATEGORIES.map(c=>c.id),['wildlife','monsters','bosses','guardians','villagers']);
 for(const category of CODEX_CATEGORIES)assert.ok(CODEX_ENTRIES.some(e=>e.category===category.id),category.id);
 assert.equal(new Set(CODEX_ENTRIES.map(e=>e.id)).size,CODEX_ENTRIES.length);
 for(const entry of CODEX_ENTRIES){
  assert.ok(entry.name&&entry.title&&entry.description.length>40,entry.id);
  assert.ok(entry.portrait||entry.glyph,entry.id);
  const loot=codexLoot(entry);
  assert.ok(loot.rows.length||entry.lootNote,`${entry.id} explains an empty loot table`);
 }
 for(const species of Object.keys(ANIMAL_TYPES))assert.ok(CODEX_ENTRIES.some(e=>e.species===species),species);
});

test('minimap dots come from real spawn slots and NPC positions',()=>{
 const deer=codexEntry('deer'),dots=codexLocations(deer),land=Object.values(SLOTS).filter(slot=>slot.habitat==='land');
 assert.equal(dots.length,land.length);
 assert.deepEqual(codexRegions(deer),['Reedwater Landing','Windchime Path','Willowbank Crossroads','Shellback Marsh']);
 assert.equal(codexLocations(codexEntry('rabbit')).length,land.length);
 assert.equal(codexLocations(codexEntry('turtle')).length,Object.values(SLOTS).filter(slot=>slot.habitat==='water'&&['landing','marsh'].includes(slot.areaId)).length);
 // Shadow walkers take their share of the land slots: half the marsh, a quarter of the crossroads.
 assert.deepEqual(codexSpawnRates(deer).map(r=>[r.areaId,r.label]),[['landing','common'],['windchime','common'],['crossroads','uncommon'],['marsh','uncommon']]);
 assert.deepEqual(codexSpawnRates(codexEntry('shadow-walker')).map(r=>[r.areaId,r.label]),[['landing','rare'],['windchime','rare'],['crossroads','uncommon'],['marsh','common']]);
 assert.deepEqual(codexSpawnRates(codexEntry('eel')).map(r=>r.areaId),['landing','crossroads','marsh']);
 assert.deepEqual(codexRegions(codexEntry('blacksmith')),['Willowback Village']);
 assert.deepEqual(codexRegions(codexEntry('emilia')),['The Chief’s House']);
 assert.deepEqual(codexLocations(codexEntry('croshelda')),[]);
 for(const entry of CODEX_ENTRIES)for(const dot of codexLocations(entry)){assert.ok(dot.x>=0&&dot.x<=1&&dot.y>=0&&dot.y<=1,entry.id);}
 // Each area's corner maps onto its box on the atlas.
 const [left,top]=AREA_BOUNDS.village;assert.deepEqual([atlasPoint('village',0,0).x,atlasPoint('village',0,0).y],[left,top]);
 assert.equal(atlasPoint('nowhere',0,0),null);
});

test('merchants list wares instead of drops, and drop chances read plainly',()=>{
 const wares=codexLoot(codexEntry('blacksmith'));assert.equal(wares.kind,'wares');assert.ok(wares.rows.every(r=>r.item&&r.price));
 const drops=codexLoot(codexEntry('deer'));assert.equal(drops.kind,'drops');assert.deepEqual(drops.rows.map(r=>chanceLabel(r.chance)),['Always','45%','20%','10%']);
 assert.equal(codexLoot(codexEntry('rimejaw')).kind,'none');
 assert.equal(DEFAULT_BINDINGS.codex,'KeyI');
});

test('loot rows show the shiny chance: four times every uncertain drop, capped at certainty',()=>{
 const rows=codexLoot(codexEntry('deer')).rows,by=name=>rows.find(r=>r.item===name);
 assert.equal(by('Deer Meat').shiny,1);assert.equal(by('Deer Hide').shiny,1);assert.ok(Math.abs(by('Deer Antlers').shiny-.8)<1e-9);assert.ok(Math.abs(by('Deer Familiar Shard').shiny-.4)<1e-9);
 assert.equal(shinyChance(.05),.2);
});
