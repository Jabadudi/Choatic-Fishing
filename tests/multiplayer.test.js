import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {applyAction,snapshot,fromSnapshot,cleanInput,neutralInput} from '../src/protocol.js';
import {damage} from '../src/combat.js';
const humans=[{id:'host',name:'Host'},{id:'guest',name:'Guest'}];
const setup=()=>new World(()=>0,{humans,countdownSeconds:0});
test('multiplayer applies each input to its own actor and counts all humans for victory',()=>{
 const w=setup(),host=w.player,guest=w.humans[1],input=neutralInput();input.right=true;
 w.update(.1,input,{guest:{...neutralInput(),left:true}});
 assert.ok(host.x>480);assert.ok(guest.x<480);assert.equal(w.player,host);
 guest.health=0;w.update(.01,input);assert.equal(w.matchState,'finished');
});
test('guest actions cannot control host equipment, cooldown or fishing',()=>{
 const w=setup(),input={...neutralInput(),aim:{x:480,y:0}};
 assert.ok(applyAction(w,'guest','toggle',input));assert.equal(w.humans[1].fishing.state,'waiting');assert.equal(w.player.fishing.state,'idle');
 applyAction(w,'guest','cancel',input);assert.ok(applyAction(w,'guest','dash',input));assert.ok(w.humans[1].dashRemaining>0);assert.equal(w.dashRemaining,0);
 assert.equal(applyAction(w,'unknown','use',input),false);
 assert.equal(damage(w,w.humans[1],50,w.player,0),false);
});
test('snapshot roundtrip preserves local guest HUD and typed inventory/progression',()=>{
 const w=setup(),guest=w.humans[1];guest.inventory.receive({name:'Sardine'});guest.progression.award(90);guest.progression.choose('tidal');guest.progression.grantCatchBuff(()=>.6);guest.health=110;
 const restored=fromSnapshot(JSON.parse(JSON.stringify(snapshot(w))),'guest');
 assert.equal(restored.player.id,'guest');assert.equal(restored.inventory.item.name,'Sardine');assert.equal(restored.progression.maxHealth,110);assert.equal(restored.progression.specials.tidal,1);assert.ok(restored.progression.eliminations instanceof Set);assert.equal(restored.bots.length,0);
 assert.equal(fromSnapshot(snapshot(w),'outsider'),null);
});
test('remote input rejects nonfinite coordinates and ignores client-supplied state',()=>{
 assert.equal(cleanInput({aim:{x:Infinity,y:0}}),null);
 const input=cleanInput({right:true,health:9999,aim:{x:1000000,y:0}});assert.equal(input.aim.x,2600);assert.equal(input.health,undefined);assert.equal(input.held,false);
});
