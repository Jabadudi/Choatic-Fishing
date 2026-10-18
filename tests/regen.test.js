import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
const input={left:false,right:false,up:false,down:false,aim:{x:0,y:0},held:false};
test('living players regenerate 1 HP per second, capped at their buffed maximum',()=>{
 const w=new World(()=>0,{countdownSeconds:0});w.player.health=80;w.bots[0].health=70;
 for(let i=0;i<120;i++)w.update(1/120,input);
 assert.ok(Math.abs(w.player.health-81)<1e-8);assert.ok(Math.abs(w.bots[0].health-71)<1e-8);
 w.progression.grantCatchBuff(()=>.6);w.player.health=109.9;w.update(.2,input);assert.equal(w.player.health,110);
});
test('regeneration does not revive dead actors or run during countdown or match end',()=>{
 const w=new World();w.player.health=80;w.update(1,input);assert.equal(w.player.health,80);
 w.matchState='playing';w.player.health=0;w.update(1/120,input);assert.equal(w.player.health,0);assert.equal(w.matchState,'lost');
 w.bots[0].health=50;w.update(1,input);assert.equal(w.bots[0].health,50);
});
