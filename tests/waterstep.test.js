import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {damage,updateProjectiles} from '../src/combat.js';
import {useCoreAbility,updateCore,waterstepSpeed,waterstepEvasion} from '../src/core-abilities.js';
import {coreSkill,statLines} from '../src/core-skills.js';
import {captureSave,restoreSave} from '../src/save-format.js';
const fresh=(rank=1)=>{const w=new World(()=>.5,{adventure:true,story:true});w.journeyId='waterstep-test';w.story.scene=null;w.story.coreIngested=true;w.progression.level=59;w.progression.coreSkills.levels={riverstep:rank};return w;};
const enemy={entityType:'animal',behavior:'aggressive'};
test('Waterstep passive works without casting and active adds speed and evasion until expiry',()=>{
 const w=fresh();assert.equal(coreSkill('riverstep').name,'Waterstep');assert.equal(waterstepSpeed(w),1.03);assert.equal(waterstepEvasion(w),.02);
 useCoreAbility(w,'riverstep');assert.ok(Math.abs(waterstepSpeed(w)-1.18)<1e-9);assert.ok(Math.abs(waterstepEvasion(w)-.12)<1e-9);
 updateCore(w,6);assert.equal(waterstepSpeed(w),1.03);assert.equal(waterstepEvasion(w),.02);
 w.progression.coreSkills.levels.riverstep=5;assert.equal(waterstepSpeed(w),1.06);assert.equal(waterstepEvasion(w),.05);
 w.core.cooldowns.riverstep=0;useCoreAbility(w,'riverstep');assert.ok(Math.abs(waterstepSpeed(w)-1.36)<1e-9);assert.equal(waterstepEvasion(w),.25);
 assert.match(statLines('riverstep',5).join(' '),/Passive:.*6%.*5%.*Active adds:.*30%.*20%/);
});
test('an evaded hit causes no damage, knockback or Steady Heart; a failed roll takes a normal hit',()=>{
 const w=fresh(),p=w.player;w.random=()=>.01;p.health=30;w.progression.coreSkills.levels['steady-heart']=1;
 assert.equal(damage(w,p,10,enemy,0,100),false);assert.equal(p.health,30);assert.equal(p.vx,0);assert.equal(w.core.stillWater,0);assert.ok(w.effects.some(e=>e.label==='EVADE'));
 w.random=()=>.02;assert.equal(damage(w,p,10,enemy,0,100),true);assert.ok(p.health<30);assert.ok(p.vx>0);
});
test('active evasion applies to hostile projectiles, consumes the projectile and rolls once',()=>{
 const w=fresh(),p=w.player;useCoreAbility(w,'riverstep');let rolls=0;w.random=()=>{rolls++;return .1;};
 w.projectiles.push({x:p.x-20,y:p.y,angle:0,owner:enemy,travel:0,kind:'arrow',hostile:true,speed:200,range:100,damage:10,knockback:50,radius:5,hit:new Set()});
 updateProjectiles(w,.1);assert.equal(p.health,100);assert.equal(p.vx,0);assert.equal(w.projectiles.length,0);assert.equal(rolls,1);
});
test('unlearned Waterstep, matches and dash immunity consume no evasion randomness',()=>{
 const w=fresh(0);w.random=()=>{throw Error('unexpected roll');};damage(w,w.player,1,enemy,0);assert.equal(waterstepSpeed(w),1);assert.equal(waterstepEvasion(w),0);
 w.progression.coreSkills.levels.riverstep=1;w.player.dashRemaining=.1;assert.equal(damage(w,w.player,1,enemy,0),false);
 w.adventure=false;assert.equal(waterstepEvasion(w),0);assert.equal(waterstepSpeed(w),1);
});
test('existing riverstep saved levels and slots restore as Waterstep with passive bonuses',()=>{
 const w=fresh(5);w.progression.coreSkills.slots[0]='riverstep';const save=captureSave(w);const restored=restoreSave(save);restored.story.coreIngested=true;
 assert.equal(restored.progression.coreSkills.levels.riverstep,5);assert.equal(restored.progression.coreSkills.slots[0],'riverstep');assert.equal(waterstepSpeed(restored),1.06);assert.equal(waterstepEvasion(restored),.05);assert.equal(restored.core.riverstep||0,0);
});
