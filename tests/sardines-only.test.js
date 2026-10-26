import test from 'node:test';
import assert from 'node:assert/strict';
import {Fishing,SARDINES_ONLY,SARDINE} from '../src/fishing.js';
import {World} from '../src/world.js';
test('every catch is a Sardine while sardines-only fishing is on',()=>{
 assert.equal(SARDINES_ONLY,true);assert.equal(SARDINE.name,'Sardine');
 for(const roll of [0,.01,.05,.06,.3,.5,.75,.99]){const f=new Fishing(()=>roll);f.cast();f.update(4,false);f.progress=1;f.update(0,false);assert.equal(f.state,'caught');assert.equal(f.result,SARDINE);}
});
test('players land only Sardines from the water',()=>{
 const w=new World(()=>.01,{botCount:0,countdownSeconds:0});
 w.fishing.cast();w.fishing.update(4,false);w.fishing.progress=1;w.fishing.update(0,false);w.advanceFishing(w.player,0,false);
 assert.ok(w.inventory.slots.some(item=>item?.name==='Sardine'));
});
