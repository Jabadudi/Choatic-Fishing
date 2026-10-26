import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../src/world.js';
import {neutralInput} from '../src/protocol.js';
import {createStoryNpcs,currentScene,storyPrompt,storyObjective,chapterHeading,SCENES} from '../src/story.js';
import {CHIEF_ROUTE} from '../src/chapter3.js';
import {CHAPTER4_SEQUENCE,CHAPTER4_SCENES} from '../src/chapter4.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {SPRITES,STORY_ART} from '../src/sprite-definitions.js';
import {frameRect} from '../src/sprites.js';
const finish=w=>{const scene=w.story.scene;assert.ok(scene);for(let i=0;i<30&&w.story.scene===scene;i++)w.advanceStory();assert.notEqual(w.story.scene,scene);};
function atPorch(){
 const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='chapter4-test';w.areaId='village';
 w.story={stage:'ch3-complete',scene:null,page:0,lureSeen:true,photoSeen:true,guide:{...CHIEF_ROUTE.at(-1),waypoint:CHIEF_ROUTE.length,areaId:'village'}};
 w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:780,y:420});w.inventory.receive({name:'Mysterious Lure',category:'quest-items'});return w;
}
test('Chapter 4 meets the chief inside the red house as one checkpointed conversation',()=>{
 const w=atPorch(),items=structuredClone(w.inventory.allItems),girl=()=>w.npcs.find(n=>n.id==='mara');
 assert.match(storyObjective(w),/Chapter 4/);assert.equal(storyPrompt(w),'Go inside with the girl');w.inspect();
 assert.equal(w.story.scene,'ch4-house');assert.equal(chapterHeading(w.story.scene),'CHAPTER 4 · REGION CORE');assert.equal(currentScene(w).art,'hearth');
 for(const scene of CHAPTER4_SEQUENCE){
  assert.equal(w.story.scene,scene);assert.equal(w.story.stage,scene);
  const pos={x:girl().x,y:girl().y};w.update(1,neutralInput());assert.deepEqual({x:girl().x,y:girl().y},pos,'the guide waits on the porch');
  finish(w);
 }
 assert.equal(w.story.scene,null);assert.equal(w.story.stage,'ch4-complete');assert.match(w.message,/Chapter 4 complete/);
 assert.equal(girl().name,'Mara');assert.equal(w.npcs.length,9);assert.equal(storyPrompt(w),null);
 assert.deepEqual(w.inventory.allItems,items);assert.equal(w.progression.totalXp,0);
 const restored=restoreSave(captureSave(w));assert.equal(restored.story.stage,'ch4-complete');assert.equal(restored.npcs.find(n=>n.id==='mara').name,'Mara');
});
test('Mara keeps her name hidden until the introduction',()=>{
 const w=atPorch();w.inspect();assert.equal(w.npcs.find(n=>n.id==='mara').name,'The girl');
 assert.ok(!CHAPTER4_SCENES['ch4-house'].some(p=>p.speaker==='Mara'||/Mara|Emilia/.test(p.text)));
 finish(w);assert.equal(w.npcs.find(n=>n.id==='mara').name,'Mara');
});
test('closing, saving and resuming mid-meeting keeps the page without replaying earlier scenes',()=>{
 let w=atPorch();w.inspect();finish(w);w.advanceStory();w.advanceStory();
 w=restoreSave(captureSave(w));assert.equal(w.story.scene,'ch4-oscar');assert.equal(w.story.page,2);assert.equal(currentScene(w).title,'Look how you’ve grown');
 w.storySuspended=true;Object.assign(w.player,{x:780,y:420});assert.equal(storyPrompt(w),'Resume conversation');w.inspect();assert.equal(w.story.page,2);
 // A checkpoint stage without an open scene offers the meeting again.
 w.story.scene=null;w.story.page=0;assert.equal(storyPrompt(w),'Continue the meeting');w.inspect();assert.equal(w.story.scene,'ch4-oscar');assert.equal(w.story.page,0);
});
test('invalid Chapter 4 scenes and guide positions are rejected',()=>{
 const w=atPorch();w.inspect();finish(w);const original=captureSave(w);
 for(const change of [s=>s.scene='ch4-core',s=>s.stage='ch4-journey',s=>s.guide.areaId='landing',s=>s.guide.x=500,s=>s.page=99]){
  const bad=structuredClone(original);change(bad.state.story);assert.throws(()=>restoreSave(bad),/story/);
 }
});
test('Chapter 4 artwork and Emilia’s portrait crop fit the supplied images',()=>{
 for(const scene of CHAPTER4_SEQUENCE)for(const page of SCENES[scene])assert.ok(page.art===null||STORY_ART[page.art],`${scene} art`);
 const png=readFileSync(new URL('../assets/'+STORY_ART.hearth.asset,import.meta.url));assert.ok(png.readUInt32BE(16)>0);
 const d=SPRITES['emilia-portrait'],sheet=readFileSync(new URL('../assets/'+d.asset,import.meta.url)),width=sheet.readUInt32BE(16),height=sheet.readUInt32BE(20);
 const [x,y,cw,ch]=frameRect(d,0,width,height);assert.ok(x>=0&&y>=0&&x+cw<=width&&y+ch<=height);
});
