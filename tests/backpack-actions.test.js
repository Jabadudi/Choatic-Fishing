import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {LAKES,walkable} from '../src/wilds.js';
import {backpackItems} from '../src/inventory.js';
import {nearbyDrop} from '../src/drops.js';
import {explorationHud} from '../src/hud.js';
const fresh=()=>new World(()=>.1,{adventure:true});
const add=(w,name)=>{w.inventory.receive({name});return w.inventory.allItems.at(-1);};
test('catches go into separate storage and a full hotbar allows continued real fishing',()=>{
 const w=fresh(),lake=LAKES[0];Object.assign(w.player,{x:lake.x-lake.rx-35,y:lake.y});
 for(let i=0;i<6;i++){const item=add(w,'Reed Spear');assert.equal(w.inventory.slots[i],null);w.backpackAction(item.id,'hotbar',i+2);}
 const ids=w.inventory.slots.map(item=>item.id);assert.equal(w.inventory.full,false);
 for(let n=0;n<3;n++){
  assert.ok(w.cast({x:lake.x,y:lake.y}));
  for(let i=0;i<5000&&w.fishing.state!=='idle';i++){
   const f=w.fishing;w.advanceFishing(w.player,1/120,f.state==='reeling'&&f.bar+f.velocity*.2+.135<f.target);
  }
  assert.equal(w.catches.length,n+1);assert.equal(w.inventory.allItems.length,7);assert.equal(w.inventory.countOf('Sardine'),n+1);
 }
 assert.deepEqual(w.inventory.slots.map(item=>item.id),ids);assert.equal(w.progression.totalXp,90);
});
test('hotbar assignment moves one shortcut and replacement retains both backpack items',()=>{
 const w=fresh(),a=add(w,'Reed Spear'),b=add(w,'Sardine');
 assert.ok(w.backpackAction(a.id,'hotbar',2));assert.ok(w.backpackAction(a.id,'hotbar',7));assert.equal(w.inventory.slots[0],null);
 assert.ok(w.backpackAction(b.id,'hotbar',7));assert.equal(w.inventory.allItems.length,2);assert.equal(w.inventory.slots[5].id,b.id);
 assert.equal(w.backpackAction(a.id,'hotbar',1),false);assert.equal(w.backpackAction('missing','hotbar',2),false);
 assert.equal(backpackItems(w.inventory,'weapons')[0].slot,null);
});
test('using directly from backpack heals or attacks without assigning a hotbar slot',()=>{
 const w=fresh(),food=add(w,'Sardine');w.player.health=40;
 assert.ok(w.backpackAction(food.id,'use'));assert.equal(w.player.health,75);assert.equal(w.inventory.allItems.length,0);
 assert.ok(w.inventory.slots.every(item=>item===null));assert.equal(w.inventory.selected,1);
 const weapon=add(w,'Reed Spear'),deer=w.wildlife[0];w.player.cooldown=0;Object.assign(w.player,{x:deer.x-45,y:deer.y,angle:0});
 assert.ok(w.backpackAction(weapon.id,'use'));assert.equal(weapon.uses,4);assert.equal(deer.health,38);assert.equal(w.inventory.selected,1);
 assert.equal(w.backpackAction(weapon.id,'use'),false);assert.equal(weapon.uses,4);
});
test('drops stay on reachable ground, preserve charges across pickup, and persist across area visits',()=>{
 const w=fresh(),weapon=add(w,'Reed Spear');weapon.uses=2;w.backpackAction(weapon.id,'hotbar',2);w.equip(2);
 assert.ok(w.backpackAction(weapon.id,'drop'));assert.equal(w.inventory.slots[0],null);assert.equal(w.inventory.selected,1);assert.equal(w.inventory.allItems.length,0);
 const drop=w.drops[0];assert.equal(drop.item.uses,2);assert.ok(walkable(drop.x,drop.y,w.areaId));assert.equal(nearbyDrop(w),drop);
 assert.match(explorationHud(w,20).prompt,/Pick up Reed Spear/);w.areaId='windchime';assert.equal(nearbyDrop(w),null);w.areaId='landing';
 assert.ok(w.inspect());assert.equal(w.drops.length,0);assert.equal(w.inventory.allItems.length,1);assert.equal(w.inventory.allItems[0].uses,2);
 assert.notEqual(w.inventory.allItems[0].id,weapon.id);assert.ok(w.inventory.slots.every(item=>item===null));
 assert.equal(w.backpackAction(weapon.id,'drop'),false);
});
test('discard clears shortcuts permanently; unsupported items and blocked state do not consume anything',()=>{
 const w=fresh(),item=add(w,'Old Boot');w.backpackAction(item.id,'hotbar',4);w.equip(4);assert.ok(w.backpackAction(item.id,'discard'));
 assert.equal(w.inventory.allItems.length,0);assert.equal(w.inventory.slots[2],null);assert.equal(w.drops.length,0);assert.equal(w.inventory.selected,1);
 assert.equal(w.backpackAction(item.id,'discard'),false);
 w.inventory.receive({name:'Vest',category:'armor'});const armor=w.inventory.allItems[0];assert.equal(w.backpackAction(armor.id,'use'),false);assert.equal(armor.uses,1);
 w.fishing.state='waiting';for(const action of ['use','drop','discard','hotbar'])assert.equal(w.backpackAction(armor.id,action,2),false);
 assert.equal(w.inventory.allItems.length,1);
});
