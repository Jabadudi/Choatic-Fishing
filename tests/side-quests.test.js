import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {createStoryNpcs} from '../src/story.js';
import {MARA_SPOT,CHIEF_HOUSE} from '../src/chief-house.js';
import {damageAnimal} from '../src/wildlife.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {explorationHud} from '../src/hud.js';
import {SIDE_QUESTS,sideQuest,questFor,questMarker,acceptQuest,turnInQuest,questLog,sideObjective,objectiveProgress,unlocked} from '../src/side-quests.js';
import {ANIMAL_TYPES} from '../src/entities.js';
import {MERCHANTS} from '../src/trade.js';
import {createVillageResidents} from '../src/village-life.js';
import {createCreature,listFor} from '../src/spawns.js';
import {SLOTS} from '../src/spawn-tables.js';
// Willowback the evening after Chapter 4, when every villager is about.
function village(){
 const w=new World(()=>.5,{adventure:true,story:true});w.journeyId='quests';
 Object.assign(w.story,{stage:'ch4-complete',scene:null,page:0,lureSeen:true,photoSeen:true,rod:true,bow:true,guide:{...MARA_SPOT,areaId:CHIEF_HOUSE.id,waypoint:0}});
 w.areaId='village';Object.assign(w.player,{x:1300,y:800});w.npcs=createStoryNpcs(w.story,w.elapsed);return w;
}
const goTo=(w,id)=>{const n=w.npcs.find(n=>n.id===id);w.areaId=n.areaId;Object.assign(w.player,{x:n.x+20,y:n.y});return n;};
function hunt(w,species,times){
 for(let i=0;i<times;i++){
  // The same creature stands in for a fresh one each time; respawning is the spawner's business, not this test's.
  const animal=w.animals.find(a=>a.species===species);Object.assign(animal,{health:animal.maxHealth,state:'idle'});w.areaId=animal.areaId;
  assert.ok(damageAnimal(w,animal,9999,w.player,0));
 }
}
test('every mission is given by a real villager and asks for creatures and goods that exist',()=>{
 const residents=new Set(createVillageResidents().map(n=>n.id));
 for(const q of SIDE_QUESTS){
  assert.ok(residents.has(q.giver),q.id);assert.ok(q.objectives.length&&q.rewards.xp>0,q.id);
  for(const r of q.requires||[])assert.ok(sideQuest(r),`${q.id} requires ${r}`);
  for(const text of [q.offer,q.thought,q.reminder,q.done,q.where])assert.ok(text.length>10,q.id);
 }
 assert.equal(new Set(SIDE_QUESTS.map(q=>q.id)).size,SIDE_QUESTS.length);
});
test('villagers offer work only once Eli has reached Willowback in the story',()=>{
 const w=village();const n=goTo(w,'basket-carrier');
 assert.equal(questMarker(w,n),'offer');
 w.story.stage='ch3-travel';assert.equal(questFor(w,'basket-carrier'),null);
 const legacy=new World(()=>.5,{adventure:true});legacy.npcs=createVillageResidents();legacy.areaId='village';
 assert.equal(questFor(legacy,'basket-carrier'),null,'exploration journeys without the story keep the old trading');
});
test('talking to a giver asks the interface for the quest sheet, even at a merchant stall',()=>{
 const w=village();goTo(w,'basket-carrier');assert.ok(w.inspect());
 assert.equal(w.questRequest,'basket-carrier');assert.equal(w.tradeRequest,undefined);assert.match(w.message,/cabbages/);
 assert.match(explorationHud(w,99).prompt,/Side mission/);
});
test('a hunting mission counts only hunts made after accepting, then pays out once',()=>{
 const w=village();hunt(w,'rabbit',1);goTo(w,'basket-carrier');
 assert.equal(acceptQuest(w,'garden-raiders'),true);assert.match(w.message,/Quest accepted: Garden raiders/);
 assert.equal(acceptQuest(w,'garden-raiders'),false);
 assert.equal(objectiveProgress(w,sideQuest('garden-raiders'))[0].have,0,'the rabbit hunted before accepting does not count');
 assert.equal(questMarker(w,w.npcs.find(n=>n.id==='basket-carrier')),'active');
 hunt(w,'rabbit',2);assert.match(w.message,/Garden raiders 2\/4/);
 assert.match(sideObjective(w),/Hunt Rabbits 2\/4/);
 goTo(w,'basket-carrier');assert.equal(turnInQuest(w,'garden-raiders'),false,'not finished yet');
 hunt(w,'rabbit',3);
 goTo(w,'village-smith');assert.equal(turnInQuest(w,'garden-raiders'),false,'only the giver takes it back');
 goTo(w,'basket-carrier');assert.equal(questFor(w,'basket-carrier').state,'ready');assert.match(sideObjective(w),/Return to the basket carrier/);
 const xp=w.progression.totalXp,marks=w.inventory.marks;
 assert.equal(turnInQuest(w,'garden-raiders'),true);assert.match(w.message,/Quest complete: Garden raiders/);
 assert.equal(w.progression.totalXp,xp+40);assert.equal(w.inventory.marks,marks+10);assert.equal(w.inventory.countOf('Willow Apples'),4);
 assert.equal(turnInQuest(w,'garden-raiders'),false);assert.equal(w.progression.totalXp,xp+40);
 assert.equal(questFor(w,'basket-carrier').quest.id,'deer-in-the-beans','the next mission from the same villager opens');
});
test('a collecting mission takes exactly the goods asked for and leaves the rest',()=>{
 const w=village();goTo(w,'village-smith');assert.equal(questFor(w,'village-smith').quest.id,'harness-hides');
 acceptQuest(w,'harness-hides');w.inventory.receive({name:'Deer Hide',count:3});w.inventory.receive({name:'Deer Meat'});
 assert.equal(questFor(w,'village-smith').state,'ready');
 assert.ok(turnInQuest(w,'harness-hides'));
 assert.equal(w.inventory.countOf('Deer Hide'),1);assert.equal(w.inventory.countOf('Deer Meat'),1);assert.equal(w.inventory.countOf('Whetstone'),1);
});
test('selling or eating the goods before handing them in takes the mission back to under way',()=>{
 const w=village();goTo(w,'net-carrier');acceptQuest(w,'net-mending');w.inventory.receive({name:'Eel Skin',count:2});
 assert.equal(questFor(w,'net-carrier').state,'ready');w.inventory.removeName('Eel Skin',1);
 assert.equal(questFor(w,'net-carrier').state,'active');assert.equal(turnInQuest(w,'net-mending'),false);
 w.dialogue=null;assert.ok(w.inspect());assert.equal(w.questRequest,undefined);assert.match(w.dialogue.text,/eel skins/,'a reminder in the speech bubble');
});
test('a merchant with a job under way opens the stall as before',()=>{
 const w=village();goTo(w,'village-fisher');acceptQuest(w,'tangled-nets');w.inspect();
 assert.equal(w.tradeRequest,MERCHANTS['village-fisher']);
});
test('once the hides are in, the blacksmith sends Eli after shadow walkers',()=>{
 const w=village(),q=sideQuest('walker-iron');
 assert.equal(unlocked(w,q),false,'not before the harness');w.quests['harness-hides'].status='complete';
 assert.ok(Object.hasOwn(ANIMAL_TYPES,'shadow-walker'));goTo(w,'village-smith');
 assert.equal(questFor(w,'village-smith').quest.id,'walker-iron');assert.ok(acceptQuest(w,'walker-iron'));
 const walker=createCreature(SLOTS['marsh-island'],'shadow-walker',{id:'qa-walker'});listFor(w,'shadow-walker').push(walker);
 hunt(w,'shadow-walker',3);assert.match(w.message,/Ash and iron 3\/3/);
 goTo(w,'village-smith');assert.equal(questFor(w,'village-smith').state,'ready');
 assert.ok(turnInQuest(w,'walker-iron'));assert.equal(w.inventory.countOf('Hunting Knife'),1);
});
test('missions are saved with their hunt progress and restored without a second reward',()=>{
 const w=village();goTo(w,'basket-carrier');acceptQuest(w,'garden-raiders');hunt(w,'rabbit',2);
 goTo(w,'village-smith');acceptQuest(w,'harness-hides');w.inventory.receive({name:'Deer Hide',count:2});turnInQuest(w,'harness-hides');
 const restored=restoreSave(captureSave(w));
 assert.equal(restored.quests['garden-raiders'].status,'active');assert.equal(objectiveProgress(restored,sideQuest('garden-raiders'))[0].have,2);
 assert.equal(restored.quests['harness-hides'].status,'complete');assert.equal(restored.quests['mara-sardine'].status,'available');
 assert.deepEqual(questLog(restored).active.map(e=>e.quest.id),['garden-raiders']);
 goTo(restored,'village-smith');assert.equal(turnInQuest(restored,'harness-hides'),false);
});
test('older saves without missions start with all of them on offer, and broken progress is refused',()=>{
 const w=village(),save=captureSave(w);save.state.quests={'mara-sardine':{status:'complete'}};
 const restored=restoreSave(save);assert.equal(restored.quests['garden-raiders'].status,'available');assert.equal(restored.quests['mara-sardine'].status,'complete');
 const active=captureSave(w);active.state.quests['garden-raiders']={status:'active'};
 assert.deepEqual(restoreSave(active).quests['garden-raiders'].since,{rabbit:0},'progress starts from the saved hunt count');
 const bad=captureSave(w);bad.state.quests['garden-raiders']={status:'active',since:{rabbit:5}};
 assert.throws(()=>restoreSave(bad),/Invalid quest progress/);
 const odd=captureSave(w);odd.state.quests['lucky-foot']={status:'done'};assert.throws(()=>restoreSave(odd),/Invalid quest state/);
});
