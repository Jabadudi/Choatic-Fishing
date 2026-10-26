import test from 'node:test';
import assert from 'node:assert/strict';
import {Inventory,ITEM_CATEGORIES,itemCategory,backpackItems} from '../src/inventory.js';
import {Fishing,ITEMS} from '../src/fishing.js';
import {updateProjectiles} from '../src/combat.js';
import {applyAction,snapshot,fromSnapshot} from '../src/protocol.js';
import {World,LAND} from '../src/world.js';

test('six catches are kept separately, full bags reject loot, and used slots can be refilled',()=>{
 const inventory=new Inventory();assert.equal(inventory.use(),null);
 for(let i=0;i<6;i++)assert.equal(inventory.receive({name:'Frying Pan'}),true);
 assert.equal(inventory.full,true);assert.equal(inventory.receive({name:'Anchor'}),false);
 inventory.equip(7);for(let i=0;i<3;i++)assert.equal(inventory.use().name,'Frying Pan');
 assert.equal(inventory.selected,1);assert.equal(inventory.slots[5],null);assert.equal(inventory.slots[0].uses,3);
 assert.equal(inventory.receive({name:'Anchor'}),true);assert.equal(inventory.slots[5].name,'Anchor');
 for(const invalid of [0,8,2.5,NaN])assert.equal(inventory.equip(invalid),false);
});

test('fishing remains available with spare space and blocks only when all six slots are full',()=>{
 const w=new World(()=>0,{botCount:0,countdownSeconds:0});w.player.x=180;
 w.inventory.receive({name:'Sardine'});assert.equal(w.cast({x:0,y:365}),true);w.cancel();
 for(let i=1;i<6;i++)w.inventory.receive({name:'Sardine'});
 assert.equal(w.cast({x:0,y:365}),false);w.equip(7);assert.equal(w.useItem(),true);
 assert.equal(w.inventory.slots[5],null);assert.equal(w.cast({x:0,y:365}),true);
});

test('cooldown prevents multiple uses per click burst and grappling stays on land',()=>{
 const w=new World(Math.random,{botCount:0,countdownSeconds:0});w.inventory.receive({name:'Harpoon Gun'});w.equip(2);
 assert.equal(w.useItem(),true);assert.equal(w.useItem(),false);assert.equal(w.inventory.item.uses,2);
 const grapple=new World(Math.random,{botCount:0,countdownSeconds:0});grapple.player.x=LAND.right-15;grapple.inventory.receive({name:'Grappling Squid'});grapple.equip(2);grapple.useItem();
 assert.ok(grapple.player.x<=LAND.right-15);assert.equal(grapple.inventory.item,null);
});



for(const [name,uses,damage,ranged] of [['Reed Spear',5,22,false],['Crab Maul',3,52,false],['Shell Sling',6,18,true]]){
 test(`${name} is awarded by the fishing loot roll`,()=>{
  const i=ITEMS.findIndex(item=>item.name===name);assert.ok(i>=0);
  const fishing=new Fishing(()=>.06+.94*(i+.5)/ITEMS.length,{sardinesOnly:false});
  fishing.cast();fishing.update(4,false);fishing.progress=1;fishing.update(0,false);
  assert.equal(fishing.result.name,name);
 });
 test(`${name} can be equipped in the last slot and deals its configured damage`,()=>{
  const w=new World(()=>0,{botCount:1,countdownSeconds:0});
  for(let i=0;i<5;i++)w.inventory.receive({name:'Old Boot'});
  w.inventory.receive({name});w.equip(7);assert.equal(w.inventory.item.uses,uses);
  const target=w.bots[0];target.x=w.player.x+40;target.y=w.player.y;w.player.angle=0;
  assert.equal(w.useItem(),true);
  if(ranged)updateProjectiles(w,.05);
  assert.equal(target.health,100-damage);assert.equal(w.inventory.item.uses,uses-1);
  assert.equal(w.inventory.slots[0].uses,1);
 });
}

test('remote slot selection and snapshot hydration preserve all six items',()=>{
 const w=new World(()=>0,{botCount:0,countdownSeconds:0});
 for(let i=0;i<6;i++)w.inventory.receive({name:i===5?'Reed Spear':'Anchor'});
 assert.equal(applyAction(w,w.player.id,'slot-7',{aim:{x:900,y:365}}),true);
 const copy=fromSnapshot(JSON.parse(JSON.stringify(snapshot(w))),w.player.id);
 assert.equal(copy.inventory.selected,7);assert.equal(copy.inventory.slots.length,6);
 assert.equal(copy.inventory.item.name,'Reed Spear');assert.equal(copy.inventory.use().name,'Reed Spear');
 assert.equal(copy.inventory.item.uses,4);assert.equal(w.inventory.item.uses,5);
});


test('backpack filters classify every existing catch and preserve actual hotbar slots',()=>{
 const bag=new Inventory();for(const name of ['Sardine','Reed Spear','Treasure Key','Old Boot','Pufferfish Bomb','Grappling Squid'])bag.receive({name});
 const before=JSON.stringify(bag);
 assert.deepEqual(ITEM_CATEGORIES.map(c=>c.label),['Consumables','Weapons','Armor','Quest items','Trophies','Upgrade materials']);
 assert.deepEqual(backpackItems(bag,'consumables').map(e=>e.slot),[2,7]);
 assert.deepEqual(backpackItems(bag,'weapons').map(e=>e.slot),[3,6]);
 assert.deepEqual(backpackItems(bag,'quest-items').map(e=>e.slot),[4]);
 assert.deepEqual(backpackItems(bag,'trophies').map(e=>e.slot),[5]);
 assert.deepEqual(backpackItems(bag,'armor'),[]);assert.deepEqual(backpackItems(bag,'upgrade-materials'),[]);
 assert.equal(backpackItems(bag).length,6);assert.equal(JSON.stringify(bag),before);
 bag.equip(backpackItems(bag,'weapons')[0].slot);assert.equal(bag.item.name,'Reed Spear');bag.use();assert.equal(bag.item.uses,4);
 for(const item of ITEMS)assert.ok(ITEM_CATEGORIES.some(c=>c.id===itemCategory(item)));
});
test('explicit categories support future armor and materials without relying on their names',()=>{
 const bag=new Inventory();bag.receive({name:'Reed Vest',category:'armor'});bag.receive({name:'Copper',category:'upgrade-materials'});
 assert.equal(backpackItems(bag,'armor')[0].item.name,'Reed Vest');assert.equal(backpackItems(bag,'upgrade-materials')[0].item.name,'Copper');
});
