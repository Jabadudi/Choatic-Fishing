import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {notePickups} from '../src/pickups.js';
import {captureSave,restoreSave} from '../src/save-format.js';
const fresh=()=>{const w=new World(()=>.2,{adventure:true});w.journeyId='pickups-test';return w;};

test('the first look at a journey announces nothing',()=>{
 const w=fresh();w.inventory.receive({name:'Sardine'});
 const seen=notePickups(w,null);
 assert.deepEqual(seen.gained,[]);assert.deepEqual(seen.firsts,[]);assert.ok(w.itemsFound.has('Sardine'));
});

test('pickups report how many were gained, and only a never-found item gets a first-find card',()=>{
 const w=fresh();let seen=notePickups(w,null);
 w.inventory.receive({name:'Sardine'});w.inventory.receive({name:'Sardine'});
 seen=notePickups(w,seen.carried);
 assert.deepEqual(seen.gained.map(g=>[g.name,g.count]),[['Sardine',2]]);
 assert.deepEqual(seen.firsts.map(f=>f.name),['Sardine']);
 w.inventory.receive({name:'Sardine'});seen=notePickups(w,seen.carried);
 assert.deepEqual(seen.gained.map(g=>g.count),[1]);assert.deepEqual(seen.firsts,[]);
 // Selling or eating items is not a pickup.
 w.inventory.storedItems=[];seen=notePickups(w,seen.carried);assert.deepEqual(seen.gained,[]);
});

test('found items are saved, and older saves count what Eli carries as found',()=>{
 const w=fresh();w.inventory.receive({name:'Deer Hide'});notePickups(w,null);
 const save=captureSave(w,'manual',1);assert.deepEqual(save.state.itemsFound,['Deer Hide']);
 assert.deepEqual([...restoreSave(save).itemsFound],['Deer Hide']);
 delete save.state.itemsFound;const old=restoreSave(save);assert.equal(old.itemsFound,null);
 assert.deepEqual(notePickups(old,null).firsts,[]);assert.ok(old.itemsFound.has('Deer Hide'));
 save.state.itemsFound=[42];assert.throws(()=>restoreSave(save),/found items/);
});
