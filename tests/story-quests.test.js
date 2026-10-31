import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {createStoryNpcs,STORY_STAGES} from '../src/story.js';
import {storyJournal,storyTarget,trackerLine,unplacedStages,STORY_CHAPTERS} from '../src/story-quests.js';
import {runPosts} from '../src/quest-map.js';
import {PERIMETER,REST_SPOT} from '../src/chapter7.js';
import {CHIEF_HOUSE,CHIEF_DOOR,MARA_SPOT} from '../src/chief-house.js';
import {GUEST_LODGE} from '../src/guest-lodge.js';
import {TRAINING_GROUND,TRAINING_GATE,DRAYFUS_SPOT} from '../src/training-ground.js';
const at=(stage,areaId,x,y,extra={})=>{
 const w=new World(()=>.2,{adventure:true,story:true});w.areaId=areaId;
 w.story={stage,scene:null,page:0,lureSeen:true,photoSeen:true,rod:true,bow:true,coreIngested:true,callAwakened:true,guide:{...MARA_SPOT,waypoint:0,areaId:CHIEF_HOUSE.id},...extra};
 w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x,y});return w;
};
test('every story stage belongs to a chapter in the quest log',()=>{
 assert.deepEqual(unplacedStages(),[]);
 assert.deepEqual(STORY_CHAPTERS.map(c=>c.n),[1,2,3,4,5,6,7]);
 for(const stage of STORY_STAGES){const w=at(stage,'village',900,900,{run:0,hold:0,buckets:0});const j=storyJournal(w);assert.ok(j,stage);assert.ok(j.now.title,stage);assert.ok(j.recap,stage);}
});
test('the dawn run shows its count, the next post and only the steps reached so far',()=>{
 const w=at('ch7-run','village',330,390,{run:1});const j=storyJournal(w);
 assert.equal(j.number,7);assert.equal(j.title,'Legs');
 assert.deepEqual(j.now.progress,{have:1,total:PERIMETER.length,unit:''});
 assert.doesNotMatch(j.now.body,/\(1\/8\)/);
 assert.deepEqual(j.steps.map(s=>s.state),['current']);assert.equal(j.more,true);
 assert.equal(j.target.label,'the guard post at the west lanes');assert.equal(j.target.dir,'south');assert.equal(j.target.here,true);
 assert.equal(trackerLine(j),`Chapter 7 · The dawn run (1/8). Next: the west lanes, ${j.target.paces} paces south.`);
 assert.equal(j.past.length,6);assert.equal(j.past[0].title,'Resonance');
 assert.deepEqual(runPosts(w,'village').map(p=>p.state).slice(0,3),['done','next','ahead']);
});
test('a stop inside a building points to its door from the village',()=>{
 const breakfast=storyTarget(at('ch7-breakfast','village',400,400));
 assert.equal(breakfast.areaId,'village');assert.equal(breakfast.x,CHIEF_DOOR.x);assert.equal(breakfast.inside.areaId,CHIEF_HOUSE.id);
 const inside=storyTarget(at('ch7-breakfast',CHIEF_HOUSE.id,320,400));assert.equal(inside.areaId,CHIEF_HOUSE.id);assert.equal(inside.label,'Mara, in the chief’s kitchen');
 const squat=storyTarget(at('ch7-squat','village',700,300));assert.equal(squat.x,TRAINING_GATE.x);
 assert.equal(storyTarget(at('ch7-squat',TRAINING_GROUND.id,540,700)).x,DRAYFUS_SPOT.x);
 const far=storyTarget(at('ch6-night','landing',900,900));assert.equal(far.here,false);assert.equal(far.areaId,GUEST_LODGE.id);
 assert.equal(storyTarget(at('ch7-rest','village',300,600)).x,REST_SPOT.x);
});
test('a finished chapter ticks off every step',()=>{
 const j=storyJournal(at('ch7-complete','village',300,300));
 assert.equal(j.finished,true);assert.ok(j.steps.every(s=>s.state==='done'));assert.equal(j.steps.length,6);assert.equal(j.more,false);
 assert.match(trackerLine(j),/^Chapter 7 complete · /);
});
