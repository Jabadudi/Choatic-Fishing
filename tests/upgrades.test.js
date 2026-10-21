import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {neutralInput,applyAction,snapshot,fromSnapshot} from '../src/protocol.js';

const fresh=()=>new World(()=>.1,{botCount:0,countdownSeconds:0});
const input=neutralInput();

test('upgrade countdown repeats every 30 playing seconds and queues choices',()=>{
 const w=fresh();
 for(let i=0;i<3600;i++)w.update(1/120,input);
 assert.equal(w.progression.pendingUpgrades,1);
 assert.ok(Math.abs(w.progression.upgradeRemaining-30)<1e-6);
 w.update(60,input);
 assert.equal(w.progression.pendingUpgrades,3);
 w.matchState='finished';w.update(30,input);
 assert.equal(w.progression.pendingUpgrades,3);
 const waiting=new World(()=>.1,{botCount:0});
 waiting.update(5,input);
 assert.equal(waiting.progression.upgradeRemaining,30);
});

test('upgrades stack separately from catches, inventory and level rewards',()=>{
 const w=fresh();
 assert.equal(w.chooseUpgrade('hermes'),false);
 w.progression.pendingUpgrades=5;
 assert.equal(w.chooseUpgrade('bad'),false);
 w.chooseUpgrade('hermes');w.chooseUpgrade('hermes');
 assert.equal(w.progression.speedMultiplier,1.3);
 w.player.health=50;w.chooseUpgrade('health');w.chooseUpgrade('health');
 assert.equal(w.progression.maxHealth,140);assert.equal(w.player.health,90);
 w.chooseUpgrade('dash');
 assert.equal(w.progression.maxDashes,2);assert.equal(w.player.dashCharges,2);
 assert.equal(w.inventory.item,null);assert.equal(w.progression.pendingChoices,0);
 assert.equal(w.progression.pendingUpgrades,0);
});

test('extra dash supports sequential uses and recharges each spent charge',()=>{
 const w=fresh();w.progression.pendingUpgrades=1;w.chooseUpgrade('dash');
 assert.ok(w.dash({right:true}));assert.equal(w.dash(),false);w.update(.16,input);
 assert.equal(w.player.dashCharges,1);assert.ok(w.dash({right:true}));w.update(.16,input);
 assert.equal(w.player.dashCharges,0);assert.equal(w.dash(),false);
 w.update(2,input);assert.equal(w.player.dashCharges,1);assert.equal(w.dashCooldown,2);
 w.update(2,input);assert.equal(w.player.dashCharges,2);assert.equal(w.dashCooldown,0);
});

test('host validates guest choices and snapshots preserve timer, stacks and charges',()=>{
 const w=new World(()=>.1,{humans:[{id:'host',name:'H'},{id:'guest',name:'G'}],countdownSeconds:0}),g=w.humans[1];
 assert.equal(applyAction(w,'guest','upgrade-dash',input),false);
 g.progression.tickUpgrades(31);
 assert.ok(applyAction(w,'guest','upgrade-dash',input));
 assert.equal(w.progression.upgrades.dash,0);assert.equal(g.dashCharges,2);
 assert.equal(applyAction(w,'guest','upgrade-health',input),false);
 const copy=fromSnapshot(JSON.parse(JSON.stringify(snapshot(w))),'guest');
 assert.equal(copy.progression.upgradeRemaining,29);
 assert.equal(copy.progression.maxDashes,2);assert.equal(copy.player.dashCharges,2);
 g.health=0;g.progression.pendingUpgrades=1;
 assert.equal(applyAction(w,'guest','upgrade-health',input),false);
 assert.equal(fresh().progression.upgrades.dash,0);
});
