import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {neutralInput} from '../src/protocol.js';
import {createStoryNpcs,storyPrompt,storyObjective,chapterHeading,SCENES,storySpeed} from '../src/story.js';
import {PERIMETER,HOLD_SECONDS,REST_SPOT,TOWER_PLATFORM,IDLE_NAG,HOLD_RESET} from '../src/chapter7.js';
import {OCELOT,CORE} from '../src/chapter6.js';
import {GUEST_LODGE,LODGE_BED} from '../src/guest-lodge.js';
import {CHIEF_HOUSE,MARA_SPOT} from '../src/chief-house.js';
import {TRAINING_GROUND,TRAINING_GATE,DRAYFUS_SPOT} from '../src/training-ground.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {walkable} from '../src/wilds.js';
import {wellLedger} from '../src/wishing-well.js';
const finish=w=>{const scene=w.story.scene;assert.ok(scene);for(let i=0;i<80&&w.story.scene===scene;i++)w.advanceStory();assert.notEqual(w.story.scene,scene);};
const npc=(w,id)=>w.npcs.find(n=>n.id===id);
const stand=(w,x,y)=>Object.assign(w.player,{x,y,vx:0,vy:0});
const tick=(w,dt=.1)=>w.update(dt,neutralInput());
// The end of Chapter 6: Eli back in his room, Drayfus's wake-up call due before the sun.
function bedtime(){
 const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='chapter7-test';w.areaId=GUEST_LODGE.id;
 w.story={stage:'ch6-complete',scene:null,page:0,lureSeen:true,photoSeen:true,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id}};
 w.npcs=createStoryNpcs(w.story,w.elapsed);stand(w,LODGE_BED.x+76,LODGE_BED.y+30);return w;
}
// Runs the posts in order from wherever the run stands.
// The run crosses the square, the Merchant Quarter and the Port, so each post is reached in its own area.
function runPosts(w,upTo=PERIMETER.length){for(let i=w.story.run;i<upTo;i++){w.areaId=PERIMETER[i].areaId;stand(w,PERIMETER[i].x,PERIMETER[i].y);tick(w);}}
function playTo(stage){
 const w=bedtime();
 const steps=[
  ['ch7-run',()=>{assert.equal(storyPrompt(w),'Go to sleep');w.inspect();assert.equal(w.story.scene,'ch7-up');finish(w);}],
  ['ch7-breakfast',()=>{runPosts(w);assert.equal(w.story.scene,'ch7-sunrise');finish(w);}],
  ['ch7-squat',()=>{w.areaId=CHIEF_HOUSE.id;const m=npc(w,'mara');stand(w,m.x,m.y+30);assert.equal(storyPrompt(w),'Have breakfast with Mara');w.inspect();finish(w);}],
  ['ch7-hold',()=>{w.areaId=TRAINING_GROUND.id;stand(w,DRAYFUS_SPOT.x,DRAYFUS_SPOT.y+50);assert.equal(storyPrompt(w),'Report to Drayfus');w.inspect();finish(w);}],
  ['ch7-laps',()=>{for(let i=0;i<HOLD_SECONDS*10+5&&!w.story.scene;i++)tick(w);assert.equal(w.story.scene,'ch7-cat');finish(w);}],
  ['ch7-rest',()=>{runPosts(w);}],
  ['ch7-complete',()=>{stand(w,REST_SPOT.x,REST_SPOT.y);assert.equal(storyPrompt(w),'Lie down on the grass');w.inspect();finish(w);}]
 ];
 for(const [next,step] of steps){if(w.story.stage===stage)break;step();assert.equal(w.story.stage,next);}
 return w;
}
test('Drayfus wakes Eli before the sun and sends him out to run',()=>{
 const w=bedtime();w.inspect();
 assert.equal(chapterHeading(w.story.scene),'CHAPTER 7 · LEGS');
 assert.ok(SCENES['ch7-up'].some(p=>p.speaker===CORE&&/Reserves: recovering/.test(p.text)));
 assert.ok(SCENES['ch7-up'].some(p=>p.speaker===OCELOT&&/You did not dream/.test(p.text)));
 finish(w);
 assert.equal(w.story.stage,'ch7-run');assert.equal(w.story.run,0);assert.equal(w.areaId,'village');assert.ok(walkable(w.player.x,w.player.y,'village'));
 assert.match(storyObjective(w),/\(0\/8\)/);
 const drayfus=npc(w,'drayfus');assert.equal(drayfus.areaId,'village');assert.deepEqual({x:drayfus.x,y:drayfus.y},TOWER_PLATFORM);
 assert.equal(w.npcs.filter(n=>n.id.startsWith('guard-')).length,PERIMETER.length-1);
});
test('the guard posts count in order, standing still is noticed, and the watchtower brings the sunrise',()=>{
 const w=playTo('ch7-run');
 for(const post of PERIMETER)assert.ok(walkable(post.x,post.y,post.areaId),`${post.place}`);
 // A post only counts in its own area.
 w.areaId='village-market';stand(w,PERIMETER[0].x,PERIMETER[0].y);tick(w);assert.equal(w.story.run,0);w.areaId=PERIMETER[0].areaId;
 // The posts only count in order.
 w.areaId=PERIMETER[3].areaId;stand(w,PERIMETER[3].x,PERIMETER[3].y);tick(w);assert.equal(w.story.run,0);w.areaId=PERIMETER[0].areaId;
 stand(w,PERIMETER[0].x,PERIMETER[0].y);tick(w);assert.equal(w.story.run,1);assert.match(w.message,/Morning, Oscar’s boy/);
 for(let i=0;i<50;i++)tick(w);assert.equal(w.message,IDLE_NAG);
 const mid=restoreSave(captureSave(w));assert.equal(mid.story.run,1);assert.equal(mid.story.stage,'ch7-run');
 runPosts(w);assert.equal(w.story.scene,'ch7-sunrise');finish(w);
 assert.equal(w.story.stage,'ch7-breakfast');assert.equal(w.story.run,undefined);
 assert.equal(npc(w,'mara').areaId,CHIEF_HOUSE.id);assert.equal(npc(w,'emilia'),undefined,'Emilia is out at breakfast');
});
test('the squat has to be held without moving, then Drayfus freezes at “grandmother”',()=>{
 const w=playTo('ch7-hold');
 assert.equal(w.areaId,TRAINING_GROUND.id);assert.equal(w.story.hold,0);
 for(let i=0;i<80;i++)tick(w);assert.ok(w.story.hold>7);
 const mid=restoreSave(captureSave(w));assert.equal(mid.story.hold,w.story.hold);
 // Stepping off the spot starts the count again.
 w.player.x+=40;tick(w);assert.equal(w.story.hold,0);assert.equal(w.message,HOLD_RESET);
 w.player.x-=40;for(let i=0;i<HOLD_SECONDS*10+5&&!w.story.scene;i++)tick(w);
 assert.equal(w.story.scene,'ch7-cat');
 assert.ok(SCENES['ch7-cat'].some(p=>/Did Grandpa ever talk about my grandmother/.test(p.text)));
 finish(w);assert.equal(w.story.stage,'ch7-laps');assert.equal(w.story.hold,undefined);assert.equal(w.story.run,0);
 assert.ok(storySpeed(w)<1,'his legs are gone on the laps');
});
test('the second run ends on the grass beside the lodge, and Chapter 7 pays its Wishstones',()=>{
 const w=playTo('ch7-rest');const before=wellLedger(w);
 assert.equal(w.story.run,undefined);assert.match(storyObjective(w),/grass behind the guest lodge/);
 assert.ok(walkable(REST_SPOT.x,REST_SPOT.y,'village'));
 stand(w,REST_SPOT.x,REST_SPOT.y);w.inspect();
 assert.ok(SCENES['ch7-grass'].some(p=>/Then who\?/.test(p.text)));
 finish(w);
 assert.equal(w.story.stage,'ch7-complete');assert.match(storyObjective(w),/Chapter 7 complete/);
 assert.ok(wellLedger(w)>before);
 assert.equal(npc(w,'ocelot').areaId,GUEST_LODGE.id);
 const restored=restoreSave(captureSave(w));assert.equal(restored.story.stage,'ch7-complete');
 // The training yard is part of the farm: Eli walks in through the gate in its north fence.
 w.areaId=TRAINING_GROUND.id;assert.ok(walkable(TRAINING_GATE.x,TRAINING_GATE.y,TRAINING_GROUND.id));assert.ok(walkable(DRAYFUS_SPOT.x,DRAYFUS_SPOT.y+60,TRAINING_GROUND.id));
});
test('invalid Chapter 7 progress is rejected',()=>{
 const run=captureSave(playTo('ch7-run')),hold=captureSave(playTo('ch7-hold'));
 for(const [save,change] of [[run,s=>s.run=9],[run,s=>s.run=-1],[run,s=>s.run=1.5],[run,s=>delete s.run],[run,s=>s.run=8],[run,s=>s.hold=3],[run,s=>s.guide.areaId=TRAINING_GROUND.id],
  [hold,s=>s.hold=HOLD_SECONDS+1],[hold,s=>s.hold='x'],[hold,s=>delete s.hold],[hold,s=>s.run=2]]){
  const bad=structuredClone(save);change(bad.state.story);assert.throws(()=>restoreSave(bad),/story|run|squat/i);
 }
});

test('the slow lap leaves the farm both ways while Mara sits on the fence',()=>{
 const w=playTo('ch7-laps');assert.equal(w.story.guide.areaId,TRAINING_GROUND.id);
 w.areaId=TRAINING_GROUND.id;stand(w,40,1150);
 for(let i=0;i<20&&w.areaId===TRAINING_GROUND.id;i++)w.move(-10,0);
 assert.equal(w.areaId,'village-market');
 for(let i=0;i<20&&w.areaId==='village-market';i++)w.move(10,0);
 assert.equal(w.areaId,TRAINING_GROUND.id);
});
