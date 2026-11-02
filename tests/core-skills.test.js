import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {damage,updateProjectiles} from '../src/combat.js';
import {CORE_TIERS,CORE_SKILLS,CORE_LEVEL_CAP,tierEarned,tierPoints,coreSkillLevel,coreSkillState,coreStat,learnCoreSkill,resetCoreSkills,equipCoreSkill,unequipCoreSkill,coreSlots,slotOpen,validCoreSkills,statLines} from '../src/core-skills.js';
import {coreWheel,callCost,callDamage,reservesMax,nearLivingWater,RESERVES_MAX} from '../src/core-abilities.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {neutralInput} from '../src/protocol.js';
const fresh=(level=1)=>{const w=new World(()=>.1,{adventure:true,story:true});w.story.scene=null;w.areaId='landing';w.progression.level=level;w.story.coreIngested=w.story.callAwakened=true;return w;};
const learn=(w,id,n)=>{for(let i=0;i<n;i++)assert.ok(learnCoreSkill(w,id),`${id} point ${i+1}`);};

test('four tiers over Lv 1-150 give 29, 30, 40 and 51 SP, one per level, and each tier fits its skills',()=>{
 assert.deepEqual(CORE_TIERS.map(t=>[t.from,t.to]),[[1,29],[30,59],[60,99],[100,150]]);
 assert.deepEqual(CORE_TIERS.map(t=>tierEarned(t,CORE_LEVEL_CAP)),[29,30,40,51]);
 assert.deepEqual(CORE_TIERS.map(t=>tierEarned(t,35)),[29,6,0,0]);
 // Free story levels mean the two first powers take one point less to max.
 const cost=tier=>CORE_SKILLS.filter(s=>s.tier===tier).reduce((sum,s)=>sum+s.max-(s.grant?1:0),0);
 assert.deepEqual([1,2,3,4].map(cost),[29,30,40,50]);
 assert.equal(CORE_SKILLS.length,16);
});

test('the story wakes Still Water and Reedwater’s Call at Lv 1, and Lv 1 plays exactly like before',()=>{
 const w=fresh();
 assert.equal(coreSkillLevel(w,'still-water'),1);assert.equal(coreSkillLevel(w,'reeds-call'),1);
 assert.equal(callDamage(w),30);assert.equal(coreStat(w,'still-water','duration'),5);assert.equal(coreStat(w,'still-water','guard'),.25);
 assert.equal(callCost(w),nearLivingWater(w)?10:30);assert.equal(reservesMax(w),RESERVES_MAX);
 w.story.callAwakened=false;assert.equal(coreSkillState(w,'reeds-call'),'asleep');assert.equal(learnCoreSkill(w,'reeds-call'),false);
});

test('SP spends only in its own tier, skills stop at their max and requirements hold',()=>{
 const w=fresh(12);
 assert.equal(tierPoints(w,1),12);assert.equal(tierPoints(w,2),0);
 assert.equal(coreSkillState(w,'steady-heart'),'locked');
 learn(w,'still-water',2);assert.equal(coreSkillLevel(w,'still-water'),3);assert.equal(coreSkillState(w,'steady-heart'),'open');
 learn(w,'reeds-call',9);assert.equal(coreSkillLevel(w,'reeds-call'),10);assert.equal(coreSkillState(w,'reeds-call'),'maxed');
 assert.equal(callDamage(w),66);assert.equal(callCost(w),nearLivingWater(w)?7:21);
 learn(w,'deep-reserves',1);assert.equal(tierPoints(w,1),0);assert.equal(coreSkillState(w,'deep-reserves'),'broke');
 assert.equal(coreSkillState(w,'undertow'),'unbuilt');
 w.progression.level=30;assert.equal(tierPoints(w,2),1);assert.equal(coreSkillState(w,'set-the-hook'),'unbuilt');
 assert.deepEqual(statLines('still-water',1),['Lasts 5s','Damage taken −25%','Cooldown 18s']);
});

test('Still Water and Deep Reserves scale with their levels',()=>{
 const w=fresh(29);learn(w,'still-water',9);learn(w,'deep-reserves',6);
 assert.equal(coreStat(w,'still-water','duration'),8);assert.ok(Math.abs(coreStat(w,'still-water','guard')-.4)<1e-9);
 assert.equal(reservesMax(w),130);
 assert.ok(w.useCoreAbility('still-water'));assert.equal(w.core.stillWater,8);assert.equal(w.core.cooldowns['still-water'],13);
 const deer=w.wildlife.find(a=>a.species==='deer');const before=w.player.health;damage(w,w.player,20,deer,0,0);
 const plain=20*(1-w.progression.damageReduction);assert.ok(Math.abs((before-w.player.health)-plain*.6)<1e-6);
 // At max, Still Water shakes off a grab.
 w.player.slowRemaining=2;w.update(.1,neutralInput());assert.equal(w.player.slowRemaining,0);
});

test('Steady Heart fires Still Water on its own when a hit drops Eli under 35%, then waits',()=>{
 const w=fresh(10);learn(w,'still-water',2);learn(w,'steady-heart',1);
 const deer=w.wildlife.find(a=>a.species==='deer');w.player.health=w.progression.maxHealth*.4;
 damage(w,w.player,10,deer,0,0);
 assert.equal(w.core.stillWater,2);assert.match(w.message,/This is not a cast/);
 w.update(3,neutralInput());assert.equal(w.core.stillWater,0);
 damage(w,w.player,1,deer,0,0);assert.equal(w.core.stillWater,0,'still on its cooldown');
});

test('a maxed Reedwater’s Call passes through its first foe and hits a second',()=>{
 const w=fresh(10);learn(w,'reeds-call',9);
 const [a,b]=w.wildlife.filter(x=>x.areaId==='landing').slice(0,2);
 Object.assign(w.player,{x:400,y:400,angle:0});Object.assign(a,{x:470,y:400});Object.assign(b,{x:560,y:400});
 assert.ok(w.useCoreAbility('reeds-call'));const shot=w.projectiles.at(-1);shot.homing=null;shot.angle=0;
 const ha=a.health,hb=b.health;for(let i=0;i<20;i++)updateProjectiles(w,.05);
 assert.ok(a.health<ha);assert.ok(b.health<hb);
});

test('wheel slots swap, empty and refill; slots 3 and 4 stay sealed until their powers wake',()=>{
 const w=fresh(5);
 assert.deepEqual(coreSlots(w),['still-water','reeds-call',null,null]);
 assert.equal(slotOpen(w,2),false);assert.equal(equipCoreSkill(w,'still-water',2),false);
 assert.ok(equipCoreSkill(w,'still-water',1));assert.deepEqual(coreSlots(w),['reeds-call','still-water',null,null]);
 assert.equal(equipCoreSkill(w,'deep-reserves',0),false,'passives never take a slot');
 assert.ok(unequipCoreSkill(w,0));assert.deepEqual(coreWheel(w).map(r=>r.empty),[true,false,false,false]);
 assert.equal(w.useCoreSlot(0),false);assert.match(w.message,/Nothing in this slot/);
 assert.ok(w.useCoreSlot(1));assert.ok(w.core.stillWater>0);
 learn(w,'still-water',1);assert.ok(resetCoreSkills(w));
 assert.equal(coreSkillLevel(w,'still-water'),1);assert.deepEqual(coreSlots(w),['still-water','reeds-call',null,null]);assert.equal(tierPoints(w,1),5);
});

test('Eli stops at Lv 150',()=>{
 const w=fresh(149);w.progression.xp=0;
 assert.equal(w.progression.award(1e7),1);assert.equal(w.progression.level,CORE_LEVEL_CAP);assert.equal(w.progression.xp,0);
 assert.equal(w.progression.award(500),0);assert.equal(w.progression.level,CORE_LEVEL_CAP);
});

test('Core skills save and load, and bad or overspent data is refused',()=>{
 const w=fresh(12);w.journeyId="test";learn(w,"still-water",2);learn(w,"steady-heart",1);equipCoreSkill(w,'still-water',1);
 const restored=restoreSave(captureSave(w));
 assert.deepEqual(restored.progression.coreSkills,{levels:{'still-water':2,'steady-heart':1},slots:['reeds-call','still-water',null,null]});
 restored.story.coreIngested=true;assert.equal(coreSkillLevel(restored,'still-water'),3);
 assert.equal(validCoreSkills({levels:{'still-water':2}},1),false,'more SP than Lv 1 gives');
 assert.equal(validCoreSkills({levels:{'still-water':10}},40),false,'past max');
 assert.equal(validCoreSkills({levels:{undertow:1}},40),false,'not built');
 assert.equal(validCoreSkills({levels:{},slots:['deep-reserves',null,null,null]},40),false,'passive in a slot');
 assert.equal(validCoreSkills({levels:{},slots:['still-water','still-water',null,null]},40),false,'twice');
 // Saves from before Core skills keep every point unspent.
 const old=captureSave(w);delete old.state.progression.coreSkills;const back=restoreSave(old);
 assert.equal(tierPoints(back,1),12);assert.deepEqual(coreSlots(back),['still-water','reeds-call',null,null]);
});
