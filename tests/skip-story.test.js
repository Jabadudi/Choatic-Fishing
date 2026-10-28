import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {currentScene,SCENES,createStoryNpcs} from '../src/story.js';
import {CHIEF_ROUTE} from '../src/chapter3.js';
import {CHAPTER4_SEQUENCE} from '../src/chapter4.js';
const fresh=()=>{const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='skip-test';return w;};
const go=(w,area,x,y)=>{w.areaId=area;Object.assign(w.player,{x,y});};
test('skipping a scene closes it in one go and still applies its story effects',()=>{
 const w=fresh();assert.equal(w.story.scene,'arrival');
 assert.equal(w.skipStory(),true);assert.equal(currentScene(w),null);assert.equal(w.skipStory(),false);
 go(w,'landing',1630,1560);w.inspect();go(w,'cabin',520,150);w.inspect();assert.equal(w.story.scene,'lure');
 w.advanceStory();w.skipStory();assert.equal(w.story.lureSeen,true);
 go(w,'cabin',110,270);w.inspect();w.skipStory();assert.equal(w.story.photoSeen,true);assert.equal(w.story.stage,'fish');
});
test('skipping stops at scripted action pages so they still play out',()=>{
 const w=fresh();w.story.stage='rest';w.story.scene='storm';w.story.page=0;
 w.skipStory();assert.equal(w.story.scene,'storm');assert.equal(currentScene(w).action,'escape');
 assert.equal(w.skipStory(),false);assert.equal(w.story.page,SCENES.storm.findIndex(p=>p.action==='escape'));
});
test('skipping the chief meeting runs every checkpoint and renames the lure',()=>{
 const w=fresh();w.journeyId='skip-ch4';w.areaId='village';
 w.story={stage:'ch3-complete',scene:null,page:0,lureSeen:true,photoSeen:true,guide:{...CHIEF_ROUTE.at(-1),waypoint:CHIEF_ROUTE.length,areaId:'village'}};
 w.npcs=createStoryNpcs(w.story,w.elapsed);Object.assign(w.player,{x:780,y:420});w.inventory.receive({name:'Mysterious Lure',category:'quest-items'});
 w.inspect();assert.equal(w.story.scene,CHAPTER4_SEQUENCE[0]);
 w.skipStory();assert.equal(currentScene(w),null);assert.equal(w.story.stage,'ch4-complete');
 assert.ok(w.inventory.allItems.some(i=>i.name==='Region Core'));
});
