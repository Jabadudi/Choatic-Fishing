import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {Progression,xpToNext,levelForTotal} from '../src/progression.js';
import {captureSave,restoreSave,SAVE_VERSION} from '../src/save-format.js';
import {practise} from '../src/skills.js';

test('Eli levels on 80·L² + 160·L; arena matches keep their quick flat curve',()=>{
 assert.deepEqual([1,2,5,10,15,45].map(xpToNext),[240,640,2800,9600,20400,169200]);
 const w=new World(()=>.5,{adventure:true});assert.equal(w.progression.xpToNextLevel,240);
 const arena=new Progression();assert.equal(arena.xpToNextLevel,90);
 assert.deepEqual(levelForTotal(0),{level:1,xp:0});assert.deepEqual(levelForTotal(239),{level:1,xp:239});assert.deepEqual(levelForTotal(240+640+5),{level:3,xp:5});
 assert.equal(levelForTotal(1e12).level,150);assert.equal(levelForTotal(1e12).xp,0);
});

test('Wisdom and familiars speed up skills but not Eli\'s own level',()=>{
 const w=new World(()=>.5,{adventure:true}),p=w.progression;p.level=11;
 const r=practise(w,w.player,'hunting',100);assert.ok(r.amount>100,'Wisdom still boosts the skill');assert.equal(p.totalXp,100);assert.equal(p.xp,100);
});

test('an old save moves onto the new curve from its lifetime EXP and gets its Region Core points back',()=>{
 const w=new World(()=>.5,{adventure:true});w.journeyId='old-fast-levels';
 const save=captureSave(w),p=save.state.progression;save.version=8;
 // Lv 40 under the old curve: 90+135+...; the lifetime total decides the new level.
 Object.assign(p,{level:40,xp:100,totalXp:43000,pendingChoices:39,coreSkills:{levels:{'steady-heart':5},slots:['still-water','reeds-call',null,null]}});
 save.state.player.health=490;
 const restored=restoreSave(save),r=restored.progression,want=levelForTotal(43000);
 assert.equal(r.level,want.level);assert.equal(r.xp,want.xp);assert.equal(r.totalXp,43000);assert.ok(r.level<15&&r.level>5,`Lv ${r.level}`);
 assert.deepEqual(r.coreSkills.levels,{});assert.ok(r.pendingChoices<=r.level-1);assert.ok(restored.player.health<=r.maxHealth);
 assert.equal(captureSave(restored).version,SAVE_VERSION);
});
