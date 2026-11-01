import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {neutralInput,applyAction} from '../src/protocol.js';
import {sparDown,sparSwing} from '../src/spar.js';
import {createStoryNpcs,currentScene,storyPrompt,storyObjective,chapterHeading,SCENES,storySpeed} from '../src/story.js';
import {BUCKET_TRIPS,CHAPTER6_SCENES,CORE,OCELOT} from '../src/chapter6.js';
import {GUEST_LODGE,LODGE_MORNING_SPOT,LODGE_WAKE_SPOT} from '../src/guest-lodge.js';
import {CHIEF_HOUSE} from '../src/chief-house.js';
import {TRAINING_GROUND,YARD,TRAINING_GATE,RACK_SPOT,CAST_SPOT,YARD_WELL,TROUGH,DRAYFUS_SPOT,FENCE_MARA_SPOT,TRAINING_EMILIA_SPOT} from '../src/training-ground.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {walkable,transitionAt,AREAS} from '../src/wilds.js';
import {wellLedger} from '../src/wishing-well.js';
const finish=w=>{const scene=w.story.scene;assert.ok(scene);for(let i=0;i<80&&w.story.scene===scene;i++)w.advanceStory();assert.notEqual(w.story.scene,scene);};
const npc=(w,id)=>w.npcs.find(n=>n.id===id);
const stand=(w,x,y)=>Object.assign(w.player,{x,y});
// The end of Chapter 5: Eli on the floor of his room, the core already swallowed.
function morning(){
 const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='chapter6-test';w.areaId=GUEST_LODGE.id;
 w.story={stage:'ch5-morning',scene:null,page:0,lureSeen:true,photoSeen:true,rod:true,bow:true,coreIngested:true,callAwakened:false,guide:{...LODGE_MORNING_SPOT,waypoint:0,areaId:'village'}};
 w.npcs=createStoryNpcs(w.story,w.elapsed);stand(w,LODGE_WAKE_SPOT.x,LODGE_WAKE_SPOT.y);return w;
}
// The spar: stand still and let Drayfus knock Eli down ten times, or sidestep a lunge and hit him while he recovers.
function sparUntilScene(w,act=()=>{}){for(let i=0;i<4000&&!w.story.scene;i++){act();w.update(.05,neutralInput());}assert.ok(w.story.scene,'the spar ends');}
function loseSpar(w){const spot={x:DRAYFUS_SPOT.x,y:DRAYFUS_SPOT.y+60};sparUntilScene(w,()=>{if(!sparDown(w))stand(w,spot.x,spot.y);});}
function winSpar(w){
 let dodged=false;
 sparUntilScene(w,()=>{
  const f=w.spar,d=npc(w,'drayfus');if(!f)return;
  // Step well back, away from the lunge, so it falls short.
  if(f.phase==='lunge'&&!dodged){dodged=true;const p=w.player,a=Math.atan2(p.y-d.y,p.x-d.x);stand(w,p.x+Math.cos(a)*110,p.y+Math.sin(a)*110);}
  if(f.phase==='recover'){stand(w,d.x-50,d.y);w.player.angle=0;sparSwing(w);}
 });
}
// Plays Chapter 6 up to (not into) the given stage.
function playTo(stage){
 const w=morning();
 const steps=[
  ['ch6-door',()=>{w.inspect();finish(w);}],
  ['ch6-circle',()=>{const m=npc(w,'mara');stand(w,m.x,m.y-30);w.inspect();finish(w);}],
  ['ch6-spar',()=>{w.areaId=TRAINING_GROUND.id;const d=npc(w,'drayfus');stand(w,d.x,d.y+50);w.inspect();finish(w);}],
  ['ch6-rack',()=>{w.inspect();finish(w);winSpar(w);finish(w);finish(w);}],
  ['ch6-cast',()=>{stand(w,RACK_SPOT.x,RACK_SPOT.y+40);w.inspect();finish(w);}],
  ['ch6-buckets',()=>{stand(w,CAST_SPOT.x,CAST_SPOT.y);w.inspect();finish(w);}]
 ];
 for(const [next,step] of steps){if(w.story.stage===stage)break;step();assert.equal(w.story.stage,next);}
 return w;
}
test('reading the writing introduces the ocelot, and Mara cannot see it',()=>{
 const w=morning();
 assert.equal(npc(w,'ocelot').areaId,GUEST_LODGE.id);assert.ok(npc(w,'ocelot').creature);
 assert.equal(storyPrompt(w),'Read the floating writing');w.inspect();
 assert.equal(w.story.scene,'ch6-wake');assert.equal(chapterHeading(w.story.scene),'CHAPTER 6 · RESONANCE');
 assert.ok(CHAPTER6_SCENES['ch6-wake'].some(p=>p.speaker===CORE&&/Still Water\]: Awakened/.test(p.text)));
 assert.ok(CHAPTER6_SCENES['ch6-wake'].some(p=>p.speaker===OCELOT&&p.text==='It would be a considerable improvement.'));
 finish(w);assert.equal(w.story.stage,'ch6-door');
 const mara=npc(w,'mara');assert.equal(mara.areaId,GUEST_LODGE.id);assert.ok(walkable(mara.x,mara.y-30,GUEST_LODGE.id));
 stand(w,mara.x,mara.y-30);assert.equal(storyPrompt(w),'Answer the door');w.inspect();
 assert.ok(SCENES['ch6-door'].some(p=>p.speaker==='Mara'&&p.text==='What cat?'));
 finish(w);
 assert.equal(w.story.stage,'ch6-circle');assert.equal(npc(w,'ocelot'),undefined,'the ocelot fades into Eli');
 assert.equal(npc(w,'mara').areaId,TRAINING_GROUND.id);assert.match(storyObjective(w),/training yard/);
});
test('the training yard sits on the farm road past the Willowback Gate, with its gate in the north fence',()=>{
 const w=playTo('ch6-circle');
 assert.equal(TRAINING_GROUND.id,'village-farm');
 for(const [x,y] of [[DRAYFUS_SPOT.x,DRAYFUS_SPOT.y+50],[RACK_SPOT.x,RACK_SPOT.y+40],[CAST_SPOT.x,CAST_SPOT.y],[YARD_WELL.x,YARD_WELL.y+50],[TROUGH.x,TROUGH.y-40],[FENCE_MARA_SPOT.x,FENCE_MARA_SPOT.y],[TRAINING_GATE.x,TRAINING_GATE.y]])assert.ok(walkable(x,y,TRAINING_GROUND.id),`${x},${y}`);
 // The rack, the well, the trough and the fences are solid; only the north gate lets Eli in.
 for(const [x,y] of [[RACK_SPOT.x,RACK_SPOT.y],[YARD_WELL.x,YARD_WELL.y],[TROUGH.x,TROUGH.y],[YARD.x+10,YARD.y+300],[YARD.x+100,YARD.y+YARD.h-10],[YARD.x+300,YARD.y+20],[YARD.x+YARD.w-10,YARD.y+400]])assert.equal(walkable(x,y,TRAINING_GROUND.id),false,`${x},${y}`);
 // Walking from the Willowback Gate along the farm road finds the circle.
 const start=AREAS[TRAINING_GROUND.id].spawn,goal=DRAYFUS_SPOT,queue=[[start.x,start.y]],seen=new Set([`${start.x},${start.y}`]);let found=false;
 for(let at=0;at<queue.length&&!found;at++){const [x,y]=queue[at];if(Math.hypot(x-goal.x,y-goal.y)<40)found=true;for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(seen.has(key)||!walkable(nx,ny,TRAINING_GROUND.id))continue;seen.add(key);queue.push([nx,ny]);}}
 assert.ok(found,'the circle can be walked to from the gate');
 assert.equal(npc(w,'drayfus').areaId,TRAINING_GROUND.id);assert.equal(npc(w,'emilia').areaId,TRAINING_GROUND.id);
 assert.deepEqual({x:npc(w,'emilia').x,y:npc(w,'emilia').y},TRAINING_EMILIA_SPOT);
});
test('Drayfus knocks Eli down ten times in a real spar, the confession follows, and Grandpa’s rod wakes Reedwater’s Call',()=>{
 const w=playTo('ch6-spar');
 assert.equal(storyPrompt(w),'Spar with Drayfus');w.inspect();assert.equal(w.story.scene,'ch6-spar');finish(w);
 // The fight: no prompt while it runs, the objective counts knockdowns, and nothing costs Eli health.
 assert.ok(w.spar);assert.equal(storyPrompt(w),null);assert.match(storyObjective(w),/knocked down 0\/10/);
 const health=w.player.health;
 loseSpar(w);
 assert.equal(w.spar,null);assert.equal(w.story.scene,'ch6-spar-ten');assert.equal(w.player.health,health);
 assert.ok(SCENES['ch6-spar-ten'].some(p=>/You stopped flinching/.test(p.text)));
 finish(w);
 assert.equal(w.story.stage,'ch6-confession');assert.equal(w.story.scene,'ch6-confession','the confession follows straight on');
 assert.ok(SCENES['ch6-confession'].some(p=>p.speaker==='Emilia'&&/Oscar used to do that/.test(p.text)));
 finish(w);assert.equal(w.story.stage,'ch6-rack');assert.equal(w.story.callAwakened,false);
 stand(w,RACK_SPOT.x,RACK_SPOT.y+40);assert.equal(storyPrompt(w),'Choose a weapon');w.inspect();finish(w);
 assert.equal(w.story.stage,'ch6-cast');assert.equal(w.story.callAwakened,true);
 const before=w.progression.skills.fishing.xp+w.progression.totalXp;
 stand(w,CAST_SPOT.x,CAST_SPOT.y);assert.equal(storyPrompt(w),'Cast at the sword');w.inspect();
 assert.ok(SCENES['ch6-cast'].some(p=>p.speaker==='Drayfus'&&p.text==='Oscar.'));
 finish(w);
 assert.equal(w.story.stage,'ch6-buckets');assert.ok(w.progression.skills.fishing.xp+w.progression.totalXp>before,'the disarm counts as fishing');
 assert.match(storyObjective(w),/0\/3 trips/);
});
test('three trips from the well to the trough, slower with full buckets, end the day in Eli’s room',()=>{
 const w=playTo('ch6-buckets');
 stand(w,TROUGH.x,TROUGH.y-40);assert.equal(storyPrompt(w),null,'the buckets start empty');
 assert.equal(storySpeed(w),1);
 for(let trip=1;trip<=BUCKET_TRIPS;trip++){
  stand(w,YARD_WELL.x,YARD_WELL.y+50);assert.equal(storyPrompt(w),'Fill the buckets');w.inspect();assert.equal(w.story.carrying,true);
  assert.ok(storySpeed(w)<1);
  stand(w,TROUGH.x,TROUGH.y-40);assert.equal(storyPrompt(w),'Empty the buckets into the trough');w.inspect();
  if(trip===2){const restored=restoreSave(captureSave(w));assert.equal(restored.story.buckets,2);assert.equal(restored.story.carrying,false);}
  if(trip<BUCKET_TRIPS)assert.equal(w.story.buckets,trip);
 }
 assert.equal(w.story.scene,'ch6-forty');
 const mid=restoreSave(captureSave(w));assert.equal(mid.story.scene,'ch6-forty');
 finish(w);
 assert.equal(w.story.stage,'ch6-night');assert.equal(w.story.scene,'ch6-night');assert.equal(w.areaId,GUEST_LODGE.id);
 assert.equal(npc(w,'ocelot').areaId,GUEST_LODGE.id);assert.equal(npc(w,'mara').areaId,CHIEF_HOUSE.id);
 assert.ok(SCENES['ch6-night'].some(p=>p.speaker===OCELOT&&/Strength is not the opposite of power/.test(p.text)));
 finish(w);
 assert.equal(w.story.stage,'ch6-complete');assert.equal(w.story.buckets,undefined);assert.match(storyObjective(w),/Chapter 6 complete/);
 const pos={x:w.player.x,y:w.player.y};w.update(.1,neutralInput());assert.ok(walkable(pos.x,pos.y,w.areaId));
 const restored=restoreSave(captureSave(w));assert.equal(restored.story.stage,'ch6-complete');assert.equal(restored.story.callAwakened,true);
});
test('finishing Chapter 6 pays the chapter Wishstones',()=>{
 const w=playTo('ch6-buckets');const before=wellLedger(w);
 Object.assign(w.story,{stage:'ch6-complete',scene:null,page:0,guide:{x:428,y:300,waypoint:0,areaId:CHIEF_HOUSE.id}});delete w.story.buckets;delete w.story.carrying;
 assert.ok(wellLedger(w)>before);
});
test('saves from before the ingest scene lose the core and gain the flag',()=>{
 const w=morning();w.inventory.receive({name:'Region Core',category:'quest-items'});
 const save=captureSave(w);delete save.state.story.coreIngested;delete save.state.story.callAwakened;
 const restored=restoreSave(save);
 assert.equal(restored.story.coreIngested,true);assert.equal(restored.story.callAwakened,false);assert.equal(restored.inventory.countOf('Region Core'),0);
 // Earlier saves keep the core and the flag stays off.
 const earlier=morning();Object.assign(earlier.story,{stage:'ch5-night',guide:{x:428,y:300,waypoint:0,areaId:CHIEF_HOUSE.id}});earlier.inventory.receive({name:'Region Core',category:'quest-items'});
 const kept=restoreSave(captureSave(earlier));assert.equal(kept.story.coreIngested,false);assert.equal(kept.inventory.countOf('Region Core'),1);
});
test('invalid Chapter 6 progress is rejected',()=>{
 const w=playTo('ch6-buckets');w.story.buckets=1;const original=captureSave(w);
 for(const change of [s=>s.buckets=4,s=>s.buckets=-1,s=>s.carrying='yes',s=>delete s.buckets,s=>s.scene='ch6-forty',s=>{s.stage='ch6-rack';},s=>s.guide.areaId=GUEST_LODGE.id,s=>s.guide.x=500]){
  const bad=structuredClone(original);change(bad.state.story);assert.throws(()=>restoreSave(bad),/story|bucket/i);
 }
 assert.ok(AREAS[TRAINING_GROUND.id]);
});
test('a closed conversation in Chapter 6 can be picked up again',()=>{
 const w=playTo('ch6-spar');w.inspect();finish(w);winSpar(w);assert.equal(w.story.scene,'ch6-spar-touch');finish(w);
 assert.equal(w.story.scene,'ch6-confession');w.story.scene=null;w.story.page=0;
 const d=npc(w,'drayfus');stand(w,d.x,d.y+50);assert.equal(storyPrompt(w),'Continue the conversation');w.inspect();assert.equal(currentScene(w).title,'You what?');
});
test('the ocelot breaks into motes after the door scene, and Drayfus waves Eli over',()=>{
 const w=playTo('ch6-circle');assert.equal(w.areaId,GUEST_LODGE.id);
 const fading=npc(w,'ocelot-vanish');assert.equal(fading.animationState,'vanish');assert.equal(fading.areaId,GUEST_LODGE.id);
 w.elapsed+=2;w.update(.05,neutralInput());assert.equal(npc(w,'ocelot-vanish'),undefined);
 assert.equal(npc(w,'drayfus').animationState,'beckon');
 assert.equal(npc(playTo('ch6-rack'),'drayfus').animationState,'idle');
});
test('the way to the training yard runs east through the Merchant Quarter and out of the Willowback Gate',()=>{
 const w=playTo('ch6-circle');w.areaId='village';stand(w,1915,590);
 w.update(.2,{...neutralInput(),right:true});assert.equal(w.areaId,'village-market');
 stand(w,1595,530);w.update(.2,{...neutralInput(),right:true});assert.equal(w.areaId,TRAINING_GROUND.id);
 assert.ok(walkable(w.player.x,w.player.y,w.areaId));
 // Before Chapter 6 the farm is open too; the yard is simply empty.
 const early=playTo('ch6-door');assert.equal(npc(early,'drayfus'),undefined);
});
test('the use button swings the practice sword while sparring, and full buckets are heavy from the first trip',()=>{
 const w=playTo('ch6-spar');w.inspect();finish(w);assert.ok(w.spar);
 const swings=w.effects.length;assert.equal(applyAction(w,w.player.id,'click',{...neutralInput(),aim:{x:w.player.x+50,y:w.player.y}}),true);
 assert.ok(w.effects.length>swings,'a swing plays');assert.equal(w.fishing.state,'idle','no cast while sparring');
 const b=playTo('ch6-buckets');stand(b,YARD_WELL.x,YARD_WELL.y+50);b.inspect();assert.ok(storySpeed(b)<=.7);
});
