import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {SCENES,currentScene} from '../src/story.js';
import {NARRATOR,VOICE} from '../src/scene-script.js';
import {captureSave,restoreSave} from '../src/save-format.js';
const SPEAKERS=new Set(['Eli','The girl','Mara','The old woman','The chief','Emilia',NARRATOR,VOICE]);
test('every story page has one known speaker and no quoted dialogue inside a character’s line',()=>{
 for(const [scene,pages] of Object.entries(SCENES))pages.forEach((page,i)=>{
  assert.ok(SPEAKERS.has(page.speaker),`${scene}:${i} speaker ${page.speaker}`);
  if(page.speaker!==NARRATOR)assert.doesNotMatch(page.text,/[“”]/,`${scene}:${i} should be split by speaker`);
  assert.ok(Number.isInteger(page.beat));
 });
});
test('the storm voice is the mysterious voice and action pages stay single',()=>{
 assert.ok(SCENES.storm.some(p=>p.speaker===VOICE&&/Take it/.test(p.text)));
 for(const action of ['escape','collapse','rescue','blackout'])assert.equal(SCENES.storm.filter(p=>p.action===action).length,1);
});
test('version 4 saves resume at the start of the same story beat',()=>{
 const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='beat-migration';
 Object.assign(w.story,{stage:'complete',scene:'ch2-island',page:1,lureSeen:true,photoSeen:true});
 const save=captureSave(w);save.version=4;save.state.story.stage='ch2-home';
 const restored=restoreSave(save);assert.equal(currentScene(restored).title,'This is no island');assert.equal(currentScene(restored).beat,1);
 assert.equal(SCENES['ch2-island'][restored.story.page-1].beat,0);
});
