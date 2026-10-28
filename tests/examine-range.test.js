import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {explorationHud,promptParts} from '../src/hud.js';
import {placesFor,walkable,examinableLandmark,EXAMINE_RANGE} from '../src/wilds.js';

test('the examine prompt only appears when Eli stands beside a landmark',()=>{
 const w=new World(()=>0,{adventure:true}),spring=placesFor('landing').find(p=>p.id==='spring');
 Object.assign(w.player,{x:spring.x-120,y:spring.y});
 assert.equal(explorationHud(w,99).prompt,null);assert.equal(w.inspect(),false);
 Object.assign(w.player,{x:spring.x-40,y:spring.y});
 assert.equal(explorationHud(w,99).prompt,'Examine Reedwater Spring');assert.equal(w.inspect(),true);assert.ok(w.discovered.has('spring'));
});

test('every landmark can still be reached close enough to examine',()=>{
 for(const id of ['landing','windchime','crossroads','village','marsh','cabin','chief-house','guest-lodge'])for(const p of placesFor(id)){
  const r=p.reach||EXAMINE_RANGE;let reachable=false;
  for(let dx=-r;dx<=r&&!reachable;dx+=4)for(let dy=-r;dy<=r&&!reachable;dy+=4)reachable=walkable(p.x+dx,p.y+dy,id)&&examinableLandmark(p.x+dx,p.y+dy,id)?.id===p.id;
  assert.ok(reachable,`${id}/${p.id} cannot be examined from walkable ground`);
 }
});

test('the bubble over Eli splits the action from what it acts on',()=>{
 assert.deepEqual(promptParts('Examine The Drowned Road'),{verb:'Examine',target:'The Drowned Road'});
 assert.deepEqual(promptParts('Talk to Mara · Side mission'),{verb:'Talk',target:'Mara · Side mission'});
 assert.deepEqual(promptParts('Pick up Sardine'),{verb:'Pick up',target:'Sardine'});
 assert.deepEqual(promptParts('Examine the bed'),{verb:'Examine',target:'The bed'});
 assert.deepEqual(promptParts('Look into the Wishing Well'),{verb:'Look',target:'The Wishing Well'});
 assert.deepEqual(promptParts('Go to sleep'),{verb:'Sleep',target:''});assert.deepEqual(promptParts(null),{verb:'',target:''});
});
