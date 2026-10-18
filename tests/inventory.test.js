import test from 'node:test';
import assert from 'node:assert/strict';
import {Inventory} from '../src/inventory.js';
import {World} from '../src/world.js';

test('rod is permanent; caught slot cannot overwrite an item and empties after finite uses',()=>{
 const inventory=new Inventory();
 assert.equal(inventory.use(),null);
 assert.equal(inventory.receive({name:'Frying Pan'}),true);
 assert.equal(inventory.receive({name:'Anchor'}),false);
 inventory.equip(2);
 for(let i=0;i<3;i++)assert.equal(inventory.use().name,'Frying Pan');
 assert.equal(inventory.item,null);assert.equal(inventory.selected,1);
 assert.equal(inventory.equip(3),false);
 assert.equal(inventory.receive({name:'Old Boot'}),true);
 inventory.equip(2);inventory.use();assert.equal(inventory.item,null);
});

test('filled catch slot blocks fishing; using an item unlocks fishing without extra slots',()=>{
 const w=new World(()=>0,{botCount:0,countdownSeconds:0});w.player.x=180;
 w.inventory.receive({name:'Sardine'});
 assert.equal(w.cast({x:0,y:365}),false);
 w.equip(2);assert.equal(w.useItem(),true);
 assert.equal(w.inventory.item,null);assert.equal(w.inventory.selected,1);
 assert.equal(w.cast({x:0,y:365}),true);
 assert.equal(w.useItem(),false);
 w.equip(2);assert.equal(w.fishing.state,'idle');assert.equal(w.bobber,null);
});

test('cooldown prevents multiple uses per click burst and grappling stays on land',()=>{
 const w=new World(Math.random,{botCount:0,countdownSeconds:0});w.inventory.receive({name:'Harpoon Gun'});w.equip(2);
 assert.equal(w.useItem(),true);assert.equal(w.useItem(),false);assert.equal(w.inventory.item.uses,2);
 const grapple=new World(Math.random,{botCount:0,countdownSeconds:0});grapple.player.x=790;grapple.inventory.receive({name:'Grappling Squid'});grapple.equip(2);grapple.useItem();
 assert.ok(grapple.player.x<=790);assert.equal(grapple.inventory.item,null);
});


