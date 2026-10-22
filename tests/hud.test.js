import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {explorationHud} from '../src/hud.js';

test('exploration HUD state: hint timeout, dots, prompt and upgrade bar',()=>{
 const w=new World(()=>0,{adventure:true});
 let s=explorationHud(w,0);assert.equal(s.hintVisible,true);assert.equal(s.dots.length,5);assert.ok(s.dots.every(d=>!d));
 assert.equal(explorationHud(w,10).hintVisible,false);
 Object.assign(w.player,{x:620,y:1640});assert.equal(explorationHud(w,0).prompt,'Examine The Drowned Road');
 w.inspect();assert.equal(explorationHud(w,0).dots.filter(Boolean).length,1);
 const f=explorationHud(w,0).upgradeFraction;assert.ok(f>=0&&f<=1);
});
