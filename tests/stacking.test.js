import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {Inventory,STACK_SIZE,backpackItems} from '../src/inventory.js';
import {captureSave,restoreSave,SAVE_VERSION} from '../src/save-format.js';
import {nearbyDrop} from '../src/drops.js';
const fresh=()=>{const w=new World(()=>.1,{adventure:true});w.journeyId='stack-journey';return w;};
const copy=value=>JSON.parse(JSON.stringify(value));

test('identical items share one backpack slot and overflow into a new stack once full',()=>{
 const inventory=new Inventory({separateStorage:true});
 for(let i=0;i<STACK_SIZE+3;i++)inventory.receive({name:'Sardine'});
 assert.equal(inventory.allItems.length,2);assert.deepEqual(inventory.allItems.map(item=>item.count),[STACK_SIZE,3]);
 assert.equal(inventory.countOf('Sardine'),STACK_SIZE+3);
 inventory.receive({name:'Deer Hide',category:'upgrade-materials'});inventory.receive({name:'Deer Hide',category:'upgrade-materials'});
 assert.equal(inventory.allItems.length,3);assert.equal(backpackItems(inventory,'upgrade-materials')[0].item.count,2);
 // A stack received at once, such as a thrown pile picked back up, tops up the open stack first.
 inventory.receive({name:'Sardine',count:STACK_SIZE});assert.deepEqual(inventory.allItems.filter(i=>i.name==='Sardine').map(i=>i.count),[STACK_SIZE,STACK_SIZE,3]);
});

test('weapons, the bow and story items keep a slot each',()=>{
 const inventory=new Inventory({separateStorage:true});
 for(const name of ['Reed Spear','Reed Spear','Hunting Bow','Hunting Bow','Mysterious Lure','Region Core','Region Core'])inventory.receive({name});
 assert.equal(inventory.allItems.length,7);assert.ok(inventory.allItems.every(item=>item.count===undefined));
});

test('the arena hotbar still holds one catch per slot',()=>{
 const inventory=new Inventory();for(let i=0;i<6;i++)inventory.receive({name:'Sardine'});
 assert.equal(inventory.full,true);assert.equal(inventory.receive({name:'Sardine'}),false);
});

test('using, discarding and throwing take one from a stack while its hotbar shortcut stays put',()=>{
 const w=fresh();for(let i=0;i<4;i++)w.inventory.receive({name:'Sardine'});
 const stack=w.inventory.allItems[0];assert.ok(w.backpackAction(stack.id,'hotbar',3));w.player.health=40;
 assert.ok(w.backpackAction(stack.id,'use'));assert.equal(stack.count,3);assert.equal(w.player.health,75);assert.equal(w.inventory.slots[1],stack);
 assert.ok(w.backpackAction(stack.id,'discard'));assert.equal(stack.count,2);assert.match(w.message,/^Sardine discarded/);
 assert.ok(w.backpackAction(stack.id,'drop'));assert.equal(stack.count,1);assert.equal(w.drops.length,1);assert.equal(w.drops[0].item.count,1);
 assert.ok(w.inspect());assert.equal(nearbyDrop(w),null);assert.equal(stack.count,2);assert.equal(w.inventory.allItems.length,1);
 assert.ok(w.backpackAction(stack.id,'discard-all'));assert.equal(w.inventory.allItems.length,0);assert.equal(w.inventory.slots[1],null);assert.match(w.message,/2 Sardine discarded/);
});

test('stacks save with their counts and older one-per-slot backpacks fold into stacks on load',()=>{
 const w=fresh();for(let i=0;i<3;i++)w.inventory.receive({name:'Deer Meat'});
 const restored=restoreSave(copy(captureSave(w)));assert.equal(restored.inventory.allItems.length,1);assert.equal(restored.inventory.countOf('Deer Meat'),3);
 // A version 6 backpack holds each sardine on its own; the shortcut on a merged sardine moves to the surviving stack.
 const old=captureSave(fresh());old.version=6;
 old.state.inventory={items:[
  {id:'item-1',name:'Sardine',uses:1},{id:'item-2',name:'Reed Spear',uses:4},{id:'item-3',name:'Sardine',uses:1},
  ...Array.from({length:STACK_SIZE},(_,i)=>({id:`item-${i+4}`,name:'Deer Meat',uses:1}))
 ],hotbar:[null,'item-3','item-2',null,null,null],selected:3,nextId:STACK_SIZE+4};
 const migrated=restoreSave(old),inv=migrated.inventory;
 assert.deepEqual(inv.allItems.map(item=>[item.name,item.count]),[['Sardine',2],['Reed Spear',undefined],['Deer Meat',STACK_SIZE]]);
 assert.equal(inv.slots[1],inv.allItems[0]);assert.equal(inv.item.name,'Sardine');assert.equal(inv.slots[2].name,'Reed Spear');
 assert.equal(captureSave(migrated).version,SAVE_VERSION);
});
