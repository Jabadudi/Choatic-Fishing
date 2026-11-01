import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {neutralInput} from '../src/protocol.js';
import {AREAS,walkable,transitionAt,roadDistance,placesFor,regionAt} from '../src/wilds.js';
import {DISTRICTS,VILLAGE_AREAS,MARKET,FARM,WILLOWBACK_GATE} from '../src/village-districts.js';
import {createVillageResidents,updateVillageResidents} from '../src/village-life.js';
import {createStoryNpcs} from '../src/story.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {SPRITES} from '../src/sprite-definitions.js';

test('Willowback is four connected areas: Port, Town Square, Merchant Quarter, Farm & Training Grounds',()=>{
 assert.deepEqual(VILLAGE_AREAS,['village-port','village','village-market','village-farm']);
 // Port ↔ Square (lane), Square ↔ Merchant Quarter (main street), Merchant Quarter ↔ Farm (through the gate), Farm ↔ Crossroads.
 const legs=[['village-port',870,-4,'village'],['village',870,1164,'village-port'],['village',1924,590,'village-market'],['village-market',-4,590,'village'],
  ['village-market',1604,530,'village-farm'],['village-farm',-4,1150,'village-market'],['village-farm',2004,830,'crossroads'],['crossroads',-4,460,'village-farm']];
 for(const [from,x,y,to] of legs){const next=transitionAt(x,y,from);assert.equal(next?.areaId,to,`${from} → ${to}`);assert.ok(walkable(next.x,next.y,to),`${to} entry`);}
 // No way from the Merchant Quarter down to the Port, and nothing north of the square yet.
 assert.ok(!MARKET.exits.some(e=>e.target==='village-port'));assert.deepEqual(AREAS.village.exits.map(e=>e.target).sort(),['village-market','village-port']);
 for(const id of Object.keys(DISTRICTS)){
  const area=AREAS[id];assert.ok(walkable(area.spawn.x,area.spawn.y,id));assert.equal(regionAt(area.spawn.x,area.spawn.y,id),area.name);
  assert.ok(placesFor(id).length>=5);
  for(const b of DISTRICTS[id].buildings){assert.equal(walkable(b.x,b.y-b.h/2,id),false,`${b.id} is solid`);assert.ok(roadDistance(b.x,b.y-b.h/2,id)>29,`${b.id} sits off the lanes`);}
 }
});
test('the Willowback Gate is the only way through the palisade, and the farm river blocks walking',()=>{
 const {x,y}=WILLOWBACK_GATE;assert.ok(walkable(x,y,'village-market'));
 for(const dy of [-200,-90,90,300])assert.equal(walkable(x,y+dy,'village-market'),false,`palisade ${dy}`);
 assert.equal(walkable(600,200,'village-farm'),false,'the river');assert.ok(walkable(1040,420,'village-farm'),'the mill landing');
 const w=new World(()=>.2,{adventure:true});w.areaId='village-farm';Object.assign(w.player,{x:1040,y:400});assert.ok(w.cast({x:1040,y:250}));
 assert.equal(FARM.width,2000);
});
test('every village area has 15 to 20 people, in a spread of looks, on walkable ground',()=>{
 const list=createVillageResidents();
 for(const id of VILLAGE_AREAS){const here=list.filter(n=>n.areaId===id);assert.ok(here.length>=15&&here.length<=20,`${id}: ${here.length}`);}
 assert.ok(new Set(list.map(n=>n.spriteId)).size>=20);
 for(const n of list)assert.ok(SPRITES[n.spriteId],n.spriteId);
 // Nobody lives in the training yard.
 for(const n of list.filter(n=>n.areaId==='village-farm'))assert.ok(!(n.x>880&&n.y>1350),n.id);
 for(let t=0;t<60;t+=.9){updateVillageResidents(list,t);for(const n of list.filter(n=>!n.creature))assert.ok(walkable(n.x,n.y,n.areaId),`${n.id} at ${Math.round(n.x)},${Math.round(n.y)}`);}
});
test('the story keeps each area at 20 people or fewer, and the village sleeps through the dawn run',()=>{
 const base={lureSeen:true,photoSeen:true,scene:null,page:0,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{x:0,y:0,waypoint:0,areaId:'chief-house'}};
 for(const stage of ['ch3-complete','ch5-night','ch6-buckets','ch7-run','ch7-laps','ch7-complete']){
  const npcs=createStoryNpcs({...base,stage,run:0,hold:0},0);
  for(const id of VILLAGE_AREAS)assert.ok(npcs.filter(n=>n.areaId===id).length<=20,`${stage} ${id}`);
  if(stage==='ch7-run')assert.equal(npcs.filter(n=>n.areaId==='village-port'&&!n.id.startsWith('guard-')).length,0);
 }
});
test('walking into the Merchant Quarter and saving there restores in the same place',()=>{
 const w=new World(()=>.2,{adventure:true});w.journeyId='districts-test';w.areaId='village';Object.assign(w.player,{x:1915,y:590,vx:0,vy:0});
 w.update(.2,{...neutralInput(),right:true});assert.equal(w.areaId,'village-market');
 const back=restoreSave(captureSave(w));assert.equal(back.areaId,'village-market');assert.deepEqual([back.player.x,back.player.y],[w.player.x,w.player.y]);
});
