import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {neutralInput} from '../src/protocol.js';
import {captureSave,restoreSave,SAVE_VERSION,importantProgress} from '../src/save-format.js';
import {createStoryNpcs,currentScene,cabinDamaged,GUIDE_ROUTE,inlandUnlocked,storyPrompt} from '../src/story.js';
import {walkable} from '../src/wilds.js';
import {NPC_TYPES,reactionFor} from '../src/entities.js';
import {frameRect} from '../src/sprites.js';
import {SPRITES} from '../src/sprite-definitions.js';
import {readFileSync} from 'node:fs';
const finish=w=>{const scene=w.story.scene;assert.ok(scene);for(let i=0;i<30&&w.story.scene===scene;i++)w.advanceStory();assert.notEqual(w.story.scene,scene);};
function atCamp(){
 const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='chapter2-test';w.areaId='landing';
 w.story={stage:'complete',lureSeen:true,photoSeen:true,scene:null,page:0,guide:null};
 w.npcs=createStoryNpcs(w.story);Object.assign(w.player,{x:1770,y:1660});
 w.inventory.receive({name:'Mysterious Lure',category:'quest-items'});return w;
}
function conversations(w){
 assert.equal(storyPrompt(w),'Talk about last night');w.inspect();assert.equal(w.story.scene,'ch2-shadow');finish(w);
 assert.equal(w.story.stage,'ch2-cabin');w.inspect();assert.equal(w.story.scene,'ch2-cabin');finish(w);
 assert.equal(w.story.stage,'ch2-home');w.inspect();assert.equal(w.story.scene,'ch2-island');finish(w);
 assert.equal(w.story.stage,'ch2-ready');
}
test('Chapter 2 conversations preserve the mystery, leave time to explore and grant no duplicate items or XP',()=>{
 const w=atCamp(),before=captureSave(w);conversations(w);
 assert.equal(w.npcs[0].name,'The girl');assert.equal(w.npcs[0].huntable,false);
 assert.deepEqual(w.inventory.allItems,before.state.inventory.items);assert.equal(w.progression.totalXp,0);
 assert.ok(cabinDamaged(w.story));assert.equal(inlandUnlocked(w.story),false);
 const stage=w.story.stage;Object.assign(w.player,{x:1630,y:1560});w.inspect();assert.equal(w.story.stage,stage);assert.match(w.message,/blackened beams/);
 Object.assign(w.player,{x:1250,y:1810});w.inspect();assert.match(w.message,/This is no island/);assert.equal(w.story.stage,stage);
 // Replaying the earlier awakening must never rewind Chapter 2.
 Object.assign(w.player,{x:1730,y:1640});w.inspect();assert.equal(w.story.scene,'awakening');finish(w);assert.equal(w.story.stage,stage);
 assert.equal(w.inventory.allItems.length,1);
});
test('guide waits for Eli, pauses while fishing, walks on land and finishes at the inland trail',()=>{
 const w=atCamp();conversations(w);w.inspect();finish(w);assert.equal(w.story.stage,'ch2-follow');
 assert.equal(NPC_TYPES.mara.entityType,'npc');assert.equal(reactionFor(w.npcs[0],{provoked:true}),'none');
 const start={...w.story.guide};Object.assign(w.player,{x:1250,y:1650});w.update(.1,neutralInput());assert.deepEqual(w.story.guide,start);
 Object.assign(w.player,{x:1770,y:1660});w.fishing.state='waiting';w.update(.1,neutralInput());assert.deepEqual(w.story.guide,start);w.cancel();
 let steps=0;
 while(!currentScene(w)&&steps++<2500){const girl=w.npcs[0];Object.assign(w.player,{x:girl.x,y:girl.y});w.update(1/120,neutralInput());assert.ok(walkable(girl.x,girl.y,'landing'));}
 assert.ok(steps<2500,'the guide route must be reachable');assert.equal(w.story.scene,'ch2-end');assert.equal(w.story.guide.waypoint,GUIDE_ROUTE.length);
 finish(w);assert.equal(w.story.stage,'ch2-complete');assert.ok(inlandUnlocked(w.story));
 const restored=restoreSave(captureSave(w));assert.equal(restored.story.stage,'ch2-complete');assert.equal(restored.npcs[0].x,w.npcs[0].x);assert.equal(restored.npcs[0].areaId,'landing');
});
test('all Chapter 2 dialogue pages resume exactly; guide progress roundtrips through current class instances',()=>{
 let w=atCamp();w.inspect();
 for(let i=0;i<6;i++)w.advanceStory();const mid=captureSave(w);w=restoreSave(mid);assert.equal(currentScene(w).title,'The Moonfang');assert.equal(w.story.page,6);
 finish(w);w.inspect();finish(w);w.inspect();finish(w);w.inspect();finish(w);
 for(let i=0;i<100;i++){Object.assign(w.player,{x:w.npcs[0].x,y:w.npcs[0].y});w.update(1/120,neutralInput());}
 const saved=captureSave(w),restored=restoreSave(saved);assert.equal(saved.version,SAVE_VERSION);assert.deepEqual(restored.story,w.story);assert.equal(restored.npcs[0].x,w.npcs[0].x);
 const previous=importantProgress(restored);restored.update(.1,neutralInput());assert.notEqual(importantProgress(restored),previous);
 assert.equal(restored.inventory.constructor.name,'Inventory');assert.equal(restored.inventory.allItems.filter(i=>i.name==='Mysterious Lure').length,1);
});
test('version 2 completed Chapter 1 saves unlock Chapter 2 without replaying or replacing the journey',()=>{
 const w=atCamp(),old=captureSave(w);old.version=2;delete old.state.story.guide;
 const restored=restoreSave(old);assert.equal(restored.journeyId,old.journeyId);assert.equal(restored.story.stage,'complete');assert.equal(restored.story.guide,null);
 restored.inspect();assert.equal(restored.story.scene,'ch2-shadow');assert.equal(restored.inventory.allItems.length,1);
});
test('invalid guide and scene states are rejected before replacing a save',()=>{
 const w=atCamp();conversations(w);w.inspect();finish(w);const save=captureSave(w);
 for(const guide of [{x:Infinity,y:1640,waypoint:0},{x:1600,y:1430,waypoint:1},{x:1850,y:1640,waypoint:90},null]){
  const bad=structuredClone(save);bad.state.story.guide=guide;assert.throws(()=>restoreSave(bad),/story guide/);
 }
 const bad=structuredClone(save);bad.state.story.scene='ch2-island';assert.throws(()=>restoreSave(bad),/story scene/);
 bad.state.story.scene=null;bad.state.story.stage='ch2-complete';assert.throws(()=>restoreSave(bad),/destination/);
});
test('the rescuer portrait crop fits its reference without affecting NPC interaction distance',()=>{
 const def=SPRITES['mara-portrait'],png=readFileSync(new URL('../assets/'+def.asset,import.meta.url)),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 const [x,y,w,h]=frameRect(def,0,width,height);assert.ok(x+w<=width&&y+h<=height);assert.equal(NPC_TYPES.mara.talkRange,95);
});
