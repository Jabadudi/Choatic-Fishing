import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {createStoryNpcs} from '../src/story.js';
import {MARA_SPOT,CHIEF_HOUSE} from '../src/chief-house.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {QUEST_DATA} from '../src/quest-data.js';
import {questFor,questMarker,acceptQuest,turnInQuest,objectiveProgress,visitFor,sideObjective} from '../src/side-quests.js';
// A delivery and a word passed on, on a quest added to the list for these tests only.
const ERRAND={id:'errand-test',giver:'baker',giverName:'Baker',title:'Morning rounds',objectives:[
 {type:'deliver',item:'Parcel',count:2,to:'miller',toName:'Miller',line:'Flour money. About time.'},{type:'talk',count:1,to:'herbalist',toName:'Herbalist'}],
 rewards:{marks:7,xp:30,items:[]},lore:'x',where:'x',offer:'Run these to the mill?',thought:'x',reminder:'x',done:'x'};
test.before(()=>QUEST_DATA.push(ERRAND));
test.after(()=>QUEST_DATA.splice(QUEST_DATA.indexOf(ERRAND),1));
function village(){
 const w=new World(()=>.5,{adventure:true,story:true});w.journeyId='errands';
 Object.assign(w.story,{stage:'ch4-complete',scene:null,page:0,lureSeen:true,photoSeen:true,rod:true,bow:true,guide:{...MARA_SPOT,areaId:CHIEF_HOUSE.id,waypoint:0}});
 w.npcs=createStoryNpcs(w.story,w.elapsed);w.quests[ERRAND.id]={status:'available'};return w;
}
const goTo=(w,id)=>{const n=w.npcs.find(n=>n.id===id);w.areaId=n.areaId;Object.assign(w.player,{x:n.x+20,y:n.y});return n;};
test('a delivery hands Eli the goods, the recipient takes them, a talk ticks off, and the giver pays',()=>{
 const w=village();goTo(w,'baker');
 assert.equal(questFor(w,'baker').quest.id,'errand-test');assert.ok(acceptQuest(w,'errand-test'));
 assert.equal(w.inventory.countOf('Parcel'),2,'the giver hands over the parcels');
 const miller=goTo(w,'miller');assert.equal(questMarker(w,miller),'visit');
 w.dialogue=null;assert.ok(w.inspect());assert.equal(w.dialogue.text,'Flour money. About time.');
 assert.equal(w.inventory.countOf('Parcel'),0);assert.equal(visitFor(w,'miller'),null);
 assert.match(sideObjective(w),/Talk to the herbalist 0\/1/);
 const save=restoreSave(captureSave(w));assert.deepEqual(save.quests['errand-test'].done,[0],'errands are saved');
 goTo(w,'baker');assert.equal(turnInQuest(w,'errand-test'),false,'not before the herbalist');
 goTo(w,'herbalist');w.inspect();assert.ok(objectiveProgress(w,ERRAND).every(o=>o.done));assert.match(w.message,/Return to the baker/);
 goTo(w,'baker');assert.equal(questFor(w,'baker').state,'ready');const marks=w.inventory.marks;
 assert.ok(turnInQuest(w,'errand-test'));assert.equal(w.inventory.marks,marks+7);
});
test('a recipient without the goods asks for them, and nothing is ticked off',()=>{
 const w=village();goTo(w,'baker');acceptQuest(w,'errand-test');w.inventory.removeName('Parcel',1);
 goTo(w,'miller');w.inspect();assert.match(w.dialogue.text,/Parcel ×2/);assert.equal(objectiveProgress(w,ERRAND)[0].done,false);
 const bad=captureSave(w);bad.state.quests['errand-test']={status:'active',done:[5]};assert.throws(()=>restoreSave(bad),/Invalid quest progress/);
});
