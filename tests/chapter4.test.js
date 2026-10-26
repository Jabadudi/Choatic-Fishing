import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../src/world.js';
import {neutralInput} from '../src/protocol.js';
import {createStoryNpcs,currentScene,storyPrompt,storyObjective,chapterHeading,SCENES} from '../src/story.js';
import {CHIEF_ROUTE} from '../src/chapter3.js';
import {CHAPTER4_SEQUENCE,CHAPTER4_SCENES} from '../src/chapter4.js';
import {CHIEF_HOUSE,MARA_SPOT,CHIEF_DOOR} from '../src/chief-house.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {walkable} from '../src/wilds.js';
import {SPRITES,STORY_ART} from '../src/sprite-definitions.js';
import {frameRect} from '../src/sprites.js';
const finish=w=>{const scene=w.story.scene;assert.ok(scene);for(let i=0;i<60&&w.story.scene===scene;i++)w.advanceStory();assert.notEqual(w.story.scene,scene);};
function atPorch(){
 const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='chapter4-test';w.areaId='village';
 w.story={stage:'ch3-complete',scene:null,page:0,lureSeen:true,photoSeen:true,guide:{...CHIEF_ROUTE.at(-1),waypoint:CHIEF_ROUTE.length,areaId:'village'}};
 w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:780,y:420});w.inventory.receive({name:'Mysterious Lure',category:'quest-items'});return w;
}
const npc=(w,id)=>w.npcs.find(n=>n.id===id);
test('Chapter 4 goes inside the chief’s house and plays the meeting as checkpointed scenes',()=>{
 const w=atPorch();
 assert.match(storyObjective(w),/Chapter 4/);assert.equal(storyPrompt(w),'Go inside with the girl');w.inspect();
 assert.equal(w.areaId,CHIEF_HOUSE.id);assert.ok(walkable(w.player.x,w.player.y,w.areaId));
 assert.equal(npc(w,'mara').areaId,CHIEF_HOUSE.id);assert.equal(npc(w,'emilia').areaId,CHIEF_HOUSE.id);assert.equal(npc(w,'emilia').name,'The old woman');
 assert.equal(w.story.scene,'ch4-house');assert.equal(chapterHeading(w.story.scene),'CHAPTER 4 · REGION CORE');assert.equal(currentScene(w).art,'hearth');
 for(const scene of CHAPTER4_SEQUENCE){
  assert.equal(w.story.scene,scene);assert.equal(w.story.stage,scene);
  const pos={x:npc(w,'mara').x,y:npc(w,'mara').y};w.update(1,neutralInput());assert.deepEqual({x:npc(w,'mara').x,y:npc(w,'mara').y},pos,'Mara stays put');
  finish(w);
 }
 assert.equal(w.story.scene,null);assert.equal(w.story.stage,'ch4-complete');assert.match(w.message,/Chapter 4 complete/);
 assert.equal(npc(w,'mara').name,'Mara');assert.equal(npc(w,'emilia').name,'Emilia');assert.equal(w.npcs.length,10);assert.equal(storyPrompt(w),null);
 assert.equal(w.progression.totalXp,0);
 const restored=restoreSave(captureSave(w));assert.equal(restored.story.stage,'ch4-complete');assert.equal(restored.areaId,CHIEF_HOUSE.id);assert.equal(npc(restored,'mara').name,'Mara');
});
test('the lure becomes the Region Core once Emilia names it, and stays protected',()=>{
 const w=atPorch();w.inspect();
 while(w.story.scene!=='ch4-journey')w.advanceStory();
 const items=w.inventory.allItems;assert.equal(items.length,1);assert.equal(items[0].name,'Region Core');assert.match(items[0].description,/Reedwater/);
 assert.equal(w.backpackAction(items[0].id,'discard'),false);assert.equal(w.inventory.allItems.length,1);
 const restored=restoreSave(captureSave(w));assert.equal(restored.inventory.allItems[0].name,'Region Core');
});
test('Eli can leave the chief’s house and walk back in after the meeting',()=>{
 const w=atPorch();w.inspect();while(w.story.scene)w.advanceStory();
 Object.assign(w.player,{x:320,y:470});w.move(0,12,false);assert.equal(w.areaId,'village');assert.ok(walkable(w.player.x,w.player.y,'village'));
 assert.equal(npc(w,'mara').areaId,CHIEF_HOUSE.id);assert.match(storyObjective(w),/Chapter 4 complete/);
 Object.assign(w.player,{x:CHIEF_DOOR.x,y:CHIEF_DOOR.y+30});assert.equal(storyPrompt(w),'Enter the chief’s house');w.inspect();assert.equal(w.areaId,CHIEF_HOUSE.id);
});
test('Mara keeps her name hidden until the introduction',()=>{
 const w=atPorch();w.inspect();assert.equal(npc(w,'mara').name,'The girl');
 assert.ok(!CHAPTER4_SCENES['ch4-house'].some(p=>p.speaker==='Mara'||/Mara|Emilia/.test(p.text)));
 finish(w);assert.equal(npc(w,'mara').name,'Mara');assert.equal(npc(w,'emilia').name,'The chief');
});
test('closing, saving and resuming mid-meeting keeps the page without replaying earlier scenes',()=>{
 let w=atPorch();w.inspect();finish(w);while(currentScene(w).title!=='Look how you’ve grown')w.advanceStory();w.advanceStory();const page=w.story.page;
 w=restoreSave(captureSave(w));assert.equal(w.story.scene,'ch4-oscar');assert.equal(w.story.page,page);assert.equal(currentScene(w).title,'Look how you’ve grown');
 w.storySuspended=true;Object.assign(w.player,{x:MARA_SPOT.x,y:MARA_SPOT.y+30});assert.equal(storyPrompt(w),'Resume conversation');w.inspect();assert.equal(w.story.page,page);
 // A checkpoint stage without an open scene offers the meeting again.
 w.story.scene=null;w.story.page=0;assert.equal(storyPrompt(w),'Continue the meeting');w.inspect();assert.equal(w.story.scene,'ch4-oscar');assert.equal(w.story.page,0);
});
test('invalid Chapter 4 scenes and guide positions are rejected',()=>{
 const w=atPorch();w.inspect();finish(w);const original=captureSave(w);
 for(const change of [s=>s.scene='ch4-core',s=>s.stage='ch4-journey',s=>s.guide.areaId='village',s=>s.guide.x=500,s=>s.page=999]){
  const bad=structuredClone(original);change(bad.state.story);assert.throws(()=>restoreSave(bad),/story/);
 }
});
test('Chapter 4 artwork and Emilia’s portrait crop fit the supplied images',()=>{
 for(const scene of CHAPTER4_SEQUENCE)for(const page of SCENES[scene])assert.ok(page.art===null||STORY_ART[page.art],`${scene} art`);
 const png=readFileSync(new URL('../assets/'+STORY_ART.hearth.asset,import.meta.url));assert.ok(png.readUInt32BE(16)>0);
 const d=SPRITES['emilia-portrait'],sheet=readFileSync(new URL('../assets/'+d.asset,import.meta.url)),width=sheet.readUInt32BE(16),height=sheet.readUInt32BE(20);
 const [x,y,cw,ch]=frameRect(d,0,width,height);assert.ok(x>=0&&y>=0&&x+cw<=width&&y+ch<=height);
});
