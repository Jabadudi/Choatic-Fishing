import test from 'node:test';
import assert from 'node:assert/strict';
import {statSync} from 'node:fs';
import {World} from '../src/world.js';
import {neutralInput} from '../src/protocol.js';
import {createStoryNpcs,currentScene,storyPrompt,storyObjective,chapterHeading,SCENES} from '../src/story.js';
import {CHAPTER5_SCENES,CHAPTER5_MARA_GREETING} from '../src/chapter5.js';
import {CHIEF_HOUSE,MARA_SPOT} from '../src/chief-house.js';
import {GUEST_LODGE,LODGE_DOOR,LODGE_MORNING_SPOT,LODGE_BED,LODGE_STOOL,LODGE_WINDOW,LODGE_POT} from '../src/guest-lodge.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {walkable} from '../src/wilds.js';
import {STORY_VIDEO} from '../src/sprite-definitions.js';
import {VILLAGE_BUILDINGS} from '../src/village.js';
const finish=w=>{const scene=w.story.scene;assert.ok(scene);for(let i=0;i<60&&w.story.scene===scene;i++)w.advanceStory();assert.notEqual(w.story.scene,scene);};
// A finished Chapter 4: Eli and Mara by the table in the chief's house.
function afterMeeting(){
 const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='chapter5-test';w.areaId=CHIEF_HOUSE.id;
 w.story={stage:'ch4-complete',scene:null,page:0,lureSeen:true,photoSeen:true,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id}};
 w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:MARA_SPOT.x,y:MARA_SPOT.y+40});w.inventory.receive({name:'Region Core',category:'quest-items'});return w;
}
const npc=(w,id)=>w.npcs.find(n=>n.id===id);
const stand=(w,x,y)=>Object.assign(w.player,{x,y});
test('Mara takes Eli to the guest lodge and gives him the tour',()=>{
 const w=afterMeeting();
 assert.match(storyObjective(w),/Talk to Mara/);assert.equal(storyPrompt(w),'Go to the guest lodge');w.inspect();
 assert.equal(w.areaId,GUEST_LODGE.id);assert.ok(walkable(w.player.x,w.player.y,w.areaId));
 assert.equal(w.story.stage,'ch5-tour');assert.equal(w.story.scene,'ch5-tour');assert.equal(chapterHeading(w.story.scene),'CHAPTER 5 · SUNRISE');
 assert.equal(npc(w,'mara').areaId,GUEST_LODGE.id);assert.equal(npc(w,'mara').name,'Mara');
 assert.ok(CHAPTER5_SCENES['ch5-tour'].some(p=>p.speaker==='Mara'&&p.text==='Bed.'));
 finish(w);
 assert.equal(w.story.stage,'ch5-night');assert.equal(npc(w,'mara').areaId,CHIEF_HOUSE.id,'Mara goes home for the night');
 assert.match(w.message,/Rest in the bed/);
});
test('the room can be explored, and sleeping plays the vision and wakes Eli at sunrise',()=>{
 const w=afterMeeting();w.inspect();finish(w);
 for(const [x,y,prompt] of [[LODGE_STOOL.x,LODGE_STOOL.y+34,'Examine the waterskin'],[LODGE_WINDOW.x,LODGE_WINDOW.y+22,'Look out the window'],[LODGE_POT.x-36,LODGE_POT.y,'Examine the chamber pot']]){
  stand(w,x,y);assert.ok(walkable(x,y,w.areaId),prompt);assert.equal(storyPrompt(w),prompt);w.inspect();assert.equal(w.story.scene,null);assert.ok(w.message);
 }
 stand(w,LODGE_BED.x+76,LODGE_BED.y+30);assert.ok(walkable(w.player.x,w.player.y,w.areaId));assert.equal(storyPrompt(w),'Go to sleep');w.inspect();
 assert.equal(w.story.stage,'ch5-sleep');assert.equal(w.story.scene,'ch5-sleep');
 const pages=SCENES['ch5-sleep'],video=pages.findIndex(p=>p.video);
 assert.ok(video>0&&video<pages.length-1,'the vision plays after Eli falls asleep and before the morning');
 assert.equal(pages[video].video,'eli-vision');assert.ok(pages[video].text,'the video page has readable fallback text');
 assert.ok(pages.slice(video).some(p=>p.speaker==='Mara'&&/Wake up/.test(p.text)),'Mara knocks after the vision');
 const pos={x:w.player.x,y:w.player.y};w.update(1,neutralInput());assert.deepEqual({x:w.player.x,y:w.player.y},pos);
 finish(w);
 assert.equal(w.story.stage,'ch5-morning');assert.equal(w.story.scene,null);assert.equal(w.areaId,GUEST_LODGE.id);assert.ok(walkable(w.player.x,w.player.y,w.areaId));
 assert.match(storyObjective(w),/Mara is waiting outside/);
 assert.equal(w.inventory.allItems[0].name,'Region Core');assert.equal(w.progression.totalXp,0);
});
test('Eli walks out of the lodge and Mara waits outside with the Chapter 6 hook',()=>{
 const w=afterMeeting();w.inspect();finish(w);stand(w,LODGE_BED.x+76,LODGE_BED.y+30);w.inspect();finish(w);
 stand(w,280,392);w.move(0,12,false);assert.equal(w.areaId,'village');assert.ok(walkable(w.player.x,w.player.y,'village'));
 const mara=npc(w,'mara');assert.equal(mara.areaId,'village');assert.deepEqual({x:mara.x,y:mara.y},{x:LODGE_MORNING_SPOT.x,y:LODGE_MORNING_SPOT.y});
 assert.ok(walkable(mara.x,mara.y,'village'));
 stand(w,mara.x,mara.y+40);assert.equal(storyPrompt(w),null);w.inspect();assert.equal(w.dialogue.npcId,'mara');assert.equal(w.dialogue.text,CHAPTER5_MARA_GREETING);
 // The lodge door leads back in.
 stand(w,LODGE_DOOR.x,LODGE_DOOR.y+30);assert.equal(storyPrompt(w),'Enter the guest lodge');w.inspect();assert.equal(w.areaId,GUEST_LODGE.id);
 const restored=restoreSave(captureSave(w));assert.equal(restored.story.stage,'ch5-morning');assert.equal(npc(restored,'mara').areaId,'village');
});
test('the guest lodge stands beside the chief’s house without blocking either door',()=>{
 assert.ok(VILLAGE_BUILDINGS.some(b=>b.id==='guest-lodge'));
 for(const [x,y] of [[LODGE_DOOR.x,LODGE_DOOR.y+30],[780,380],[LODGE_MORNING_SPOT.x,LODGE_MORNING_SPOT.y]])assert.ok(walkable(x,y,'village'),`${x},${y}`);
});
test('saving mid-chapter resumes the scene, and a scene closed before it starts is offered again',()=>{
 let w=afterMeeting();w.inspect();w.advanceStory();const page=w.story.page;
 w=restoreSave(captureSave(w));assert.equal(w.story.scene,'ch5-tour');assert.equal(w.story.page,page);assert.equal(w.areaId,GUEST_LODGE.id);
 w.story.scene=null;w.story.page=0;stand(w,npc(w,'mara').x,npc(w,'mara').y+40);assert.equal(storyPrompt(w),'Continue the tour');w.inspect();assert.equal(w.story.scene,'ch5-tour');
 finish(w);stand(w,LODGE_BED.x+76,LODGE_BED.y+30);w.inspect();
 while(!currentScene(w).video)w.advanceStory();
 w=restoreSave(captureSave(w));assert.equal(currentScene(w).video,'eli-vision');
});
test('invalid Chapter 5 progress is rejected',()=>{
 const w=afterMeeting();w.inspect();finish(w);const original=captureSave(w);
 for(const change of [s=>s.scene='ch5-sleep',s=>s.guide.areaId=GUEST_LODGE.id,s=>s.guide.x=100,s=>s.stage='ch5-morning',s=>s.page=999]){
  const bad=structuredClone(original);change(bad.state.story);assert.throws(()=>restoreSave(bad),/story/);
 }
});
test('the vision video ships with the game as a web-friendly MP4',()=>{
 const size=statSync(new URL('../assets/'+STORY_VIDEO['eli-vision'].asset,import.meta.url)).size;
 assert.ok(size>1e6&&size<15e6,`${size} bytes`);
});
