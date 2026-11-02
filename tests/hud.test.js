import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {explorationHud} from '../src/hud.js';
import {placesFor} from '../src/wilds.js';

test('exploration HUD state: hint timeout, dots, prompt and upgrade bar',()=>{
 const w=new World(()=>0,{adventure:true});
 let s=explorationHud(w,0);assert.equal(s.hintVisible,true);assert.equal(s.dots.length,5);assert.ok(s.dots.every(d=>!d));
 assert.equal(explorationHud(w,10).hintVisible,false);
 // Stand on the landmark, wherever the land editor has put it.
 const drowned=placesFor('landing').find(p=>p.id==='drowned');Object.assign(w.player,{x:drowned.x,y:drowned.y});assert.equal(explorationHud(w,0).prompt,'Examine The Drowned Road');
 w.inspect();assert.equal(explorationHud(w,0).dots.filter(Boolean).length,1);
 const f=explorationHud(w,0).upgradeFraction;assert.ok(f>=0&&f<=1);
});
test('exploration HUD health follows damage, buffed maximum and the low warning',async()=>{
 const {damage}=await import('../src/combat.js');
 const w=new World(()=>0,{adventure:true});w.matchState='playing';
 assert.deepEqual(explorationHud(w,0).health,{current:100,max:100,fraction:1,low:false});
 damage(w,w.player,75.5,{entityType:'monster'},0);let h=explorationHud(w,0).health;
 assert.equal(h.current,25);assert.equal(h.low,true);assert.ok(Math.abs(h.fraction-.245)<1e-9);
 w.progression.grantCatchBuff(()=>.6);h=explorationHud(w,0).health;assert.equal(h.max,w.progression.maxHealth);assert.ok(h.max>100);
 w.player.health=0;assert.deepEqual(explorationHud(w,0).health,{current:0,max:h.max,fraction:0,low:true});
});
