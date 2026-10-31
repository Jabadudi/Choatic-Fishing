import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {neutralInput} from '../src/protocol.js';
import {AREAS,walkable,transitionAt,roadDistance,placesFor,regionAt} from '../src/wilds.js';
import {DISTRICTS,VILLAGE_AREAS} from '../src/village-districts.js';
import {createVillageResidents,updateVillageResidents} from '../src/village-life.js';
import {createStoryNpcs} from '../src/story.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {SPRITES} from '../src/sprite-definitions.js';

test('Willowback spreads over three connected areas',()=>{
 assert.deepEqual(VILLAGE_AREAS,['village','village-north','village-mill']);
 // Commons → Upper Lanes (north) → Millside (east), and back the same way.
 const legs=[['village',1560,-4,'village-north'],['village-north',800,1204,'village'],['village-north',1604,620,'village-mill'],['village-mill',-4,620,'village-north']];
 for(const [from,x,y,to] of legs){const next=transitionAt(x,y,from);assert.equal(next?.areaId,to,`${from} → ${to}`);assert.ok(walkable(next.x,next.y,to),`${to} entry`);}
 for(const id of Object.keys(DISTRICTS)){
  const area=AREAS[id];assert.ok(walkable(area.spawn.x,area.spawn.y,id));assert.equal(regionAt(area.spawn.x,area.spawn.y,id),area.name);
  assert.ok(placesFor(id).length>=3);
  for(const b of DISTRICTS[id].buildings){assert.equal(walkable(b.x,b.y-b.h/2,id),false,`${b.id} is solid`);assert.ok(roadDistance(b.x,b.y-b.h/2,id)>29,`${b.id} sits off the lanes`);}
 }
 // Millside's far bank is reached over the bridge.
 assert.ok(walkable(1160,620,'village-mill'));assert.equal(walkable(1180,800,'village-mill'),false);
});
test('every village area has 15 to 20 people, in a spread of looks, on walkable ground',()=>{
 const list=createVillageResidents();
 for(const id of VILLAGE_AREAS){const here=list.filter(n=>n.areaId===id);assert.ok(here.length>=15&&here.length<=20,`${id}: ${here.length}`);}
 assert.ok(new Set(list.map(n=>n.spriteId)).size>=20);
 for(const n of list)assert.ok(SPRITES[n.spriteId],n.spriteId);
 for(let t=0;t<60;t+=.9){updateVillageResidents(list,t);for(const n of list.filter(n=>!n.creature))assert.ok(walkable(n.x,n.y,n.areaId),`${n.id} at ${Math.round(n.x)},${Math.round(n.y)}`);}
});
test('the story keeps each area at 20 people or fewer, and the village sleeps through the dawn run',()=>{
 const base={lureSeen:true,photoSeen:true,scene:null,page:0,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{x:0,y:0,waypoint:0,areaId:'chief-house'}};
 for(const stage of ['ch3-complete','ch5-night','ch6-buckets','ch7-run','ch7-laps','ch7-complete']){
  const npcs=createStoryNpcs({...base,stage,run:0,hold:0},0);
  for(const id of VILLAGE_AREAS)assert.ok(npcs.filter(n=>n.areaId===id).length<=20,`${stage} ${id}`);
  if(stage==='ch7-run')assert.equal(npcs.filter(n=>n.areaId==='village-north').length,0);
 }
});
test('walking into the Upper Lanes and saving there restores in the same place',()=>{
 const w=new World(()=>.2,{adventure:true});w.journeyId='districts-test';w.areaId='village';Object.assign(w.player,{x:1560,y:10,vx:0,vy:0});
 w.update(.2,{...neutralInput(),up:true});assert.equal(w.areaId,'village-north');
 const back=restoreSave(captureSave(w));assert.equal(back.areaId,'village-north');assert.deepEqual([back.player.x,back.player.y],[w.player.x,w.player.y]);
});
