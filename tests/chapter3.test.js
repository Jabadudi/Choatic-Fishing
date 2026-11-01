import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {damage} from '../src/combat.js';
import {World} from '../src/world.js';
import {neutralInput} from '../src/protocol.js';
import {createStoryNpcs,GUIDE_ROUTE,currentScene,cabinDamaged,storyPrompt} from '../src/story.js';
import {chapter3Route,CHAPTER3_ROUTES,GUARDIAN_SPOT} from '../src/chapter3.js';
import {captureSave,restoreSave,SAVE_VERSION} from '../src/save-format.js';
import {walkable} from '../src/wilds.js';
import {SPRITES} from '../src/sprite-definitions.js';
import {frameRect,frameIndex} from '../src/sprites.js';
import {createVillageResidents,updateVillageResidents} from '../src/village-life.js';
import {drawNpc} from '../src/npcs.js';
const finish=w=>{const scene=w.story.scene;assert.ok(scene);for(let i=0;i<30&&w.story.scene===scene;i++)w.advanceStory();assert.notEqual(w.story.scene,scene);};
function atTrail(){
 const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='chapter3-test';w.areaId='landing';
 w.story={stage:'ch2-complete',scene:null,page:0,lureSeen:true,photoSeen:true,guide:{...GUIDE_ROUTE.at(-1),waypoint:GUIDE_ROUTE.length,areaId:'landing'}};
 w.npcs=createStoryNpcs(w.story);Object.assign(w.player,{x:1390,y:1450});w.inventory.receive({name:'Mysterious Lure',category:'quest-items'});return w;
}
function follow(w,until,max=10000){
 let i=0;while(!until()&&i++<max){const n=w.npcs.find(n=>n.id==='mara');Object.assign(w.player,{x:n.x,y:n.y+20});w.update(1/30,neutralInput());assert.ok(walkable(n.x,n.y,n.areaId),`guide blocked at ${n.areaId} ${n.x},${n.y}`);}
 assert.ok(i<max,'guide must reach the next story milestone');
}
function throughForest(w){
 assert.equal(storyPrompt(w),'Continue toward the village');w.inspect();finish(w);
 follow(w,()=>!!currentScene(w));assert.equal(w.story.scene,'ch3-chimes');finish(w);
 // North up the Landing and Windchime Path, west at the crossroads and along the farm road to the Willowback Gate.
 for(const area of ['landing','windchime','crossroads','village-farm']){
  follow(w,()=>w.story.guide.waypoint===CHAPTER3_ROUTES[area].length);
  if(area==='crossroads'){Object.assign(w.player,{x:1,y:460});w.move(-8,0,false);}
  else if(area==='village-farm'){Object.assign(w.player,{x:1,y:1150});w.move(-8,0,false);}
  else {Object.assign(w.player,{x:area==='landing'?1700:1150,y:1});w.move(0,-8,false);}
  assert.equal(w.story.guide.areaId,w.areaId);assert.ok(walkable(w.player.x,w.player.y,w.areaId));
 }
 follow(w,()=>!!currentScene(w));assert.equal(w.story.scene,'ch3-arrival');finish(w);
}
test('Chapter 3 follows connected maps, discovers the village creatures and ends at the chief’s house',()=>{
 const w=atTrail(),items=structuredClone(w.inventory.allItems);throughForest(w);assert.equal(w.areaId,'village-market');assert.equal(w.story.stage,'ch3-creatures');
 follow(w,()=>w.story.guide.waypoint===chapter3Route(w.story).length);Object.assign(w.player,{x:GUARDIAN_SPOT.x,y:GUARDIAN_SPOT.y+40});assert.equal(storyPrompt(w),'Examine the frost-scaled guardian');w.inspect();finish(w);
 assert.equal(w.story.stage,'ch3-lore');assert.equal(storyPrompt(w),'Ask about shadow walkers');w.inspect();finish(w);
 // She leads him west along the main street to the Town Square, then across the commons to the chief's porch.
 assert.equal(w.story.stage,'ch3-chief');follow(w,()=>w.story.guide.waypoint===chapter3Route(w.story).length);
 Object.assign(w.player,{x:1,y:590});w.move(-8,0,false);assert.equal(w.areaId,'village');assert.equal(w.story.guide.areaId,'village');
 follow(w,()=>!!currentScene(w));assert.equal(w.story.scene,'ch3-end');finish(w);
 assert.equal(w.story.stage,'ch3-complete');assert.deepEqual(w.inventory.allItems,items);assert.equal(w.progression.totalXp,0);assert.ok(cabinDamaged(w.story));
 assert.equal(w.npcs.find(n=>n.id==='mara').name,'The girl');assert.equal(w.npcs.length,1+createVillageResidents().length);
 const restored=restoreSave(captureSave(w));assert.equal(restored.story.stage,'ch3-complete');assert.deepEqual(restored.story.guide,w.story.guide);assert.equal(restored.npcs.length,1+createVillageResidents().length);
});
test('guide waits across exploration detours and forward exits wait for the guide',()=>{
 const w=atTrail();w.inspect();finish(w);Object.assign(w.player,{x:1700,y:1});w.move(0,-8,false);assert.equal(w.areaId,'landing');assert.match(w.message,/guide/);
 const previous=structuredClone(w.story.guide);w.areaId='windchime';w.update(1,neutralInput());assert.deepEqual(w.story.guide,previous);
 w.areaId='landing';Object.assign(w.player,{x:500,y:500});w.update(1,neutralInput());assert.deepEqual(w.story.guide,previous);
});
test('version 3 Chapter 2 checkpoints migrate guide geography without replay or inventory loss',()=>{
 const w=atTrail(),save=captureSave(w);save.version=3;delete save.state.story.guide.areaId;
 const restored=restoreSave(save);assert.equal(captureSave(restored).version,SAVE_VERSION);assert.equal(restored.story.guide.areaId,'landing');assert.equal(restored.journeyId,w.journeyId);
 restored.inspect();assert.equal(restored.story.scene,'ch3-start');assert.equal(restored.inventory.allItems.length,1);
});
test('save/resume preserves each map’s guide, creature scene page and village residents',()=>{
 let w=atTrail();throughForest(w);follow(w,()=>w.story.guide.waypoint===chapter3Route(w.story).length);Object.assign(w.player,{x:GUARDIAN_SPOT.x,y:GUARDIAN_SPOT.y+40});w.inspect();w.advanceStory();
 w=restoreSave(captureSave(w));assert.equal(currentScene(w).art,'blacksmith');assert.equal(w.story.page,1);assert.equal(w.npcs.length,1+createVillageResidents().length);
 const before=w.npcs.filter(n=>n.origin).map(n=>[n.id,n.x,n.y]);const again=restoreSave(captureSave(w));assert.deepEqual(again.npcs.filter(n=>n.origin).map(n=>[n.id,n.x,n.y]),before);
 finish(w);w.inspect();w.advanceStory();assert.equal(restoreSave(captureSave(w)).story.page,1);
});
test('village creatures and residents stay outside hunting, and their patrols remain walkable',()=>{
 const list=createVillageResidents();for(const n of list){assert.equal(n.entityType,'npc');assert.equal(n.huntable,false);assert.equal(damage({},n,999,{},0),false);}
 for(let t=0;t<100;t+=.7){updateVillageResidents(list,t);for(const n of list.filter(n=>!n.creature))assert.ok(walkable(n.x,n.y,n.areaId),`${n.id} patrol blocked`);}
 const cat=list.find(n=>n.spriteId==='flitlynx');assert.ok(cat.sortY>290,'roof creature must draw over the blacksmith roof');
 const c=new Proxy({},{get:()=>()=>{},set:()=>true});const before=JSON.stringify(list);for(const n of list)drawNpc(c,n,10);assert.equal(JSON.stringify(list),before,'drawing cannot move residents');
});
test('creature artwork crops and idle animation mappings fit the supplied sheets',()=>{
 for(const id of ['rimejaw','flitlynx','rimejaw-illustration','flitlynx-illustration']){
  const d=SPRITES[id],png=readFileSync(new URL('../assets/'+d.asset,import.meta.url)),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  for(const i of d.animations?.idle.frames||[0]){const [x,y,w,h]=frameRect(d,i,width,height);assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height,`${id} crop ${i}`);}
  assert.equal(d.chromaKey,'green');assert.equal(frameIndex(d,'idle',0),0);
 }
});
test('invalid Chapter 3 guide areas, scene stages and destinations are rejected',()=>{
 const w=atTrail();throughForest(w);const original=captureSave(w);
 for(const change of [s=>s.guide.areaId='marsh',s=>s.guide.areaId='__proto__',s=>s.guide.x=1e9,s=>s.scene='ch3-history',s=>s.stage='ch3-complete']){
  const bad=structuredClone(original);change(bad.state.story);assert.throws(()=>restoreSave(bad),/story guide|story scene/);
 }
});
