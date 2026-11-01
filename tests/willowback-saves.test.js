import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {createStoryNpcs} from '../src/story.js';
import {captureSave,restoreSave,SAVE_VERSION} from '../src/save-format.js';
import {AREAS,walkable} from '../src/wilds.js';
import {YARD,FENCE_MARA_SPOT,TRAINING_GROUND} from '../src/training-ground.js';
import {CREATURE_ROUTE} from '../src/chapter3.js';
import {CHIEF_HOUSE,MARA_SPOT} from '../src/chief-house.js';
// A save from before the new Willowback maps: version 7, with the old area ids and positions.
function oldSave(areaId,x,y,story=null,edit=()=>{}){
 const w=new World(()=>.3,{adventure:true,story:!!story});w.journeyId='old-willowback';
 if(story){w.story={lureSeen:true,photoSeen:true,scene:null,page:0,rod:true,bow:true,coreIngested:true,callAwakened:true,...story};w.npcs=createStoryNpcs(w.story,0);}
 const save=captureSave(w);save.version=7;Object.assign(save.state,{areaId});Object.assign(save.state.player,{x,y});edit(save.state);return save;
}
test('saves from the old Upper Lanes, Millside and Commons wake up on the new Willowback maps',()=>{
 assert.equal(SAVE_VERSION,8);
 for(const [old,now] of [['village-north','village-market'],['village-mill','village-farm'],['village','village'],['windchime','windchime']]){
  const w=restoreSave(oldSave(old,600,1510));assert.equal(w.areaId,now,old);assert.deepEqual({x:w.player.x,y:w.player.y},{x:AREAS[now].spawn.x,y:AREAS[now].spawn.y},old);
  assert.ok(walkable(w.player.x,w.player.y,w.areaId));assert.equal(captureSave(w).version,SAVE_VERSION);
 }
});
test('the training ground keeps its layout inside the farm, so Eli and Mara stay where they were',()=>{
 const save=oldSave('training-ground',540,600,{stage:'ch6-cast',guide:{x:330,y:720,areaId:'training-ground',waypoint:0}});
 const w=restoreSave(save);assert.equal(w.areaId,TRAINING_GROUND.id);assert.deepEqual({x:w.player.x,y:w.player.y},{x:540+YARD.x,y:600+YARD.y});
 assert.deepEqual({x:w.story.guide.x,y:w.story.guide.y,areaId:w.story.guide.areaId},{...FENCE_MARA_SPOT,areaId:TRAINING_GROUND.id});
});
test('a Chapter 3 guide on the old commons moves to the Merchant Quarter, and dropped items follow their area',()=>{
 const save=oldSave('village',1300,600,{stage:'ch3-creatures',guide:{x:1290,y:580,areaId:'village',waypoint:0}},state=>{
  state.drops=[{id:'drop-1',areaId:'village-mill',x:1460,y:1100,item:{id:'item-90',name:'Sardine',uses:1}}];state.nextDropId=2;
 });
 const w=restoreSave(save);assert.equal(w.story.guide.areaId,'village-market');assert.deepEqual({x:w.story.guide.x,y:w.story.guide.y},CREATURE_ROUTE[0]);
 assert.equal(w.drops[0].areaId,'village-farm');assert.ok(walkable(w.drops[0].x,w.drops[0].y,'village-farm'));
 // Guides indoors are untouched.
 const indoors=restoreSave(oldSave(CHIEF_HOUSE.id,320,410,{stage:'ch4-house',guide:{...MARA_SPOT,areaId:CHIEF_HOUSE.id,waypoint:0}}));
 assert.deepEqual({x:indoors.story.guide.x,y:indoors.story.guide.y},MARA_SPOT);
});
