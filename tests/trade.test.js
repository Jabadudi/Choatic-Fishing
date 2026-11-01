import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {captureSave,restoreSave,importantProgress} from '../src/save-format.js';
import {WARES,MERCHANTS,buyWare,sellItem,sellValue,earnMarks,findMarks,marksLabel,FOUND_MARKS} from '../src/trade.js';
import {createVillageResidents} from '../src/village-life.js';
import {codexEntry,codexLoot} from '../src/codex.js';
import {WEAPONS} from '../src/combat.js';
import {itemCount} from '../src/inventory.js';
const fresh=()=>{const w=new World(()=>.1,{adventure:true});w.journeyId='trade-journey';return w;};
const add=(w,name,extra={})=>{w.inventory.receive({name,...extra});return w.inventory.allItems.at(-1);};
test('a new journey starts with an empty purse, and selling pays the listed value',()=>{
 const w=fresh();assert.equal(w.inventory.marks,0);
 const hide=add(w,'Deer Hide');assert.equal(sellValue(hide),5);
 assert.ok(sellItem(w,hide.id));assert.equal(w.inventory.marks,5);assert.equal(w.inventory.allItems.length,0);assert.equal(w.message,'Sold Deer Hide for 5 marks.');
 assert.equal(sellItem(w,hide.id),false);assert.equal(w.inventory.marks,5);
});
test('quest items and Grandpa’s bow are never for sale',()=>{
 const w=fresh(),lure=add(w,'Mysterious Lure',{category:'quest-items'}),bow=add(w,'Hunting Bow',{category:'weapons'}),key=add(w,'Treasure Key');
 for(const item of [lure,bow,key]){assert.equal(sellValue(item),0);assert.equal(sellItem(w,item.id),false);}
 assert.equal(w.inventory.allItems.length,3);assert.equal(w.inventory.marks,0);
});
test('buying spends marks, refuses when short, and bundles arrive as one stack',()=>{
 const w=fresh();
 assert.equal(buyWare(w,'fisher',0),false);assert.match(w.message,/costs 4 marks\. You have 0 marks/);
 earnMarks(w,5);assert.ok(buyWare(w,'fisher',0));assert.equal(w.inventory.marks,1);
 assert.deepEqual(w.inventory.allItems.map(item=>[item.name,itemCount(item)]),[['Sardine',3]]);
 assert.equal(buyWare(w,'blacksmith',99),false);assert.equal(buyWare(w,'nobody',0),false);
 w.fishing.state='waiting';earnMarks(w,100);assert.equal(buyWare(w,'gardener',0),false);
});
test('every merchant lists coin prices, and the creature index shows them',()=>{
 for(const [npc,merchant] of Object.entries(MERCHANTS)){assert.ok(createVillageResidents().some(n=>n.id===npc));assert.ok(WARES[merchant].length);}
 for(const ware of Object.values(WARES).flat()){assert.ok(Number.isInteger(ware.price)&&ware.price>0);assert.ok(ware.description);
  // Nothing can be bought and sold back at a profit.
  assert.ok(sellValue({name:ware.item,category:ware.category})*(ware.count||1)<ware.price,ware.item);}
 const rows=codexLoot(codexEntry('blacksmith'));assert.equal(rows.kind,'wares');assert.equal(rows.rows[0].price,20);
 assert.equal(marksLabel(1),'1 mark');assert.equal(marksLabel(2),'2 marks');
});
test('talking to a merchant greets you and asks the interface to open the stall',()=>{
 const w=fresh();w.npcs=createVillageResidents();w.areaId='village';
 const smith=w.npcs.find(n=>n.id==='village-smith');w.areaId=smith.areaId;Object.assign(w.player,{x:smith.x+20,y:smith.y});
 assert.ok(w.inspect());assert.equal(w.tradeRequest,'blacksmith');assert.match(w.message,/^Blacksmith:/);assert.equal(w.dialogue,null);
 w.tradeRequest=null;const child=w.npcs.find(n=>n.id==='child-one');w.npcs=[child];w.areaId=child.areaId;Object.assign(w.player,{x:child.x,y:child.y});
 assert.ok(w.inspect());assert.equal(w.tradeRequest,null);assert.equal(w.dialogue.npcId,'child-one');
});
test('bought food heals and is eaten, and the hunting knife fights like a weapon',()=>{
 const w=fresh(),salve=add(w,'Healing Salve',{category:'consumables'});
 assert.equal(w.backpackAction(salve.id,'use'),false);assert.equal(w.message,'Already at full health.');assert.equal(w.inventory.allItems.length,1);
 w.player.health=50;assert.ok(w.backpackAction(salve.id,'use'));assert.equal(w.player.health,90);assert.equal(w.inventory.allItems.length,0);assert.match(w.message,/\+40 health/);
 const knife=add(w,'Hunting Knife',{category:'weapons'});assert.equal(knife.uses,12);assert.ok(WEAPONS['Hunting Knife']);
 assert.ok(w.backpackAction(knife.id,'use'));assert.equal(w.inventory.allItems[0].uses,11);
});
test('a few marks sometimes come up with a catch, but never in the Chapter 1 sardine lesson',()=>{
 const w=fresh();
 assert.equal(findMarks(w,()=>FOUND_MARKS.chance+.01),0);
 assert.equal(findMarks(w,()=>0),FOUND_MARKS.min);assert.equal(w.inventory.marks,FOUND_MARKS.min);
 const rolls=[0,.999];assert.equal(findMarks(w,()=>rolls.shift()),FOUND_MARKS.max);
 w.story={stage:'fish'};assert.equal(findMarks(w,()=>0),0);
});
test('the purse survives a save, older saves start empty, and bad purses are refused',()=>{
 const w=fresh();earnMarks(w,42);const before=importantProgress(w);earnMarks(w,1);assert.notEqual(importantProgress(w),before);
 const save=captureSave(w);assert.equal(restoreSave(save).inventory.marks,43);
 const old=structuredClone(save);delete old.state.inventory.marks;assert.equal(restoreSave(old).inventory.marks,0);
 for(const bad of [-1,1.5,'10',Infinity]){const broken=structuredClone(save);broken.state.inventory.marks=bad;assert.throws(()=>restoreSave(broken),/purse/);}
});
test('selling takes one from a stack, or the whole stack at once',()=>{
 const w=fresh();w.inventory.receive({name:'Rabbit Pelt',count:5});const pelts=w.inventory.allItems[0];assert.equal(itemCount(pelts),5);
 assert.ok(sellItem(w,pelts.id));assert.equal(itemCount(pelts),4);assert.equal(w.inventory.marks,3);assert.equal(w.message,'Sold Rabbit Pelt for 3 marks.');
 assert.ok(sellItem(w,pelts.id,Infinity));assert.equal(w.inventory.allItems.length,0);assert.equal(w.inventory.marks,15);assert.equal(w.message,'Sold 4 Rabbit Pelt for 12 marks.');
});
