import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {updateCore,useCoreAbility,onCoreLineHit,riverstepMultiplier,reservesMax} from '../src/core-abilities.js';
import {updateProjectiles} from '../src/combat.js';
import {coreSkillState,learnCoreSkill,validCoreSkills} from '../src/core-skills.js';
import {animalGround} from '../src/wildlife.js';
const fresh=()=>{const w=new World(()=>.1,{adventure:true,story:true});w.story.scene=null;w.story.coreIngested=w.story.callAwakened=true;w.progression.level=59;w.progression.coreSkills.levels={'reeds-call':9,undertow:1,'set-the-hook':1,riverstep:1,'reading-the-current':1};return w;};
test('second advancement learns with tier points, prerequisites and compatible saves',()=>{const w=fresh();assert.ok(validCoreSkills(w.progression.coreSkills,59));w.progression.level=29;assert.equal(coreSkillState(w,'undertow'),'tier');assert.equal(useCoreAbility(w,'undertow').used,false);w.progression.level=30;w.progression.coreSkills.levels={};assert.equal(coreSkillState(w,'set-the-hook'),'locked');assert.ok(learnCoreSkill(w,'undertow'));assert.equal(learnCoreSkill(w,'riverstep'),false);});
test('Undertow pulls and slows only current-area animals and expires cleanly',()=>{const w=fresh(),a=w.wildlife.find(a=>a.species==='deer');w.areaId=a.areaId;Object.assign(w.player,{x:a.x-150,y:a.y,angle:0});assert.ok(useCoreAbility(w,'undertow').used);const f=w.core.undertow,before=Math.hypot(a.x-f.x,a.y-f.y);updateCore(w,.1);assert.ok(Math.hypot(a.x-f.x,a.y-f.y)<before);assert.equal(a.coreMoveMultiplier,.75);assert.ok(animalGround(a,a.x,a.y));updateCore(w,4);updateCore(w,.1);assert.equal(w.core.undertow,null);assert.equal(a.coreMoveMultiplier,1);});
test('Hook hits once, deals boosted damage and returns reserves only on a successful hit',()=>{const w=fresh(),a=w.wildlife.find(a=>a.species==='deer');w.areaId=a.areaId;Object.assign(w.player,{x:a.x-100,y:a.y,angle:0});assert.ok(useCoreAbility(w,'set-the-hook').used);const hp=a.health,reserves=w.core.reserves;for(let i=0;i<20&&w.projectiles.length;i++)updateProjectiles(w,.02);assert.ok(a.health<hp);assert.ok(w.core.hook);assert.equal(w.core.reserves,reserves+2);const x=a.x;updateCore(w,.05);assert.ok(a.x<x);const restored=w.core.reserves;updateProjectiles(w,1);assert.equal(w.core.reserves,restored);});
test('heavy hook targets pull Eli and movement respects ground; area changes cancel tethers',()=>{const w=fresh(),a=w.wildlife.find(a=>a.species==='deer');w.areaId=a.areaId;a.radius=30;Object.assign(w.player,{x:a.x-100,y:a.y});onCoreLineHit(w,{coreSkill:'set-the-hook',owner:w.player},a);const x=w.player.x,ax=a.x;updateCore(w,.05);assert.ok(w.player.x>x);assert.equal(a.x,ax);w.areaId='cabin';updateCore(w,.05);assert.equal(w.core.hook,null);});
test('Waterstep adds speed to its passive, checks costs/cooldowns, and expires',()=>{const w=fresh();assert.ok(useCoreAbility(w,'riverstep').used);assert.equal(w.core.reserves,80);assert.ok(Math.abs(riverstepMultiplier(w,'speed')-1.18)<1e-9);assert.equal(riverstepMultiplier(w,'recharge'),1);assert.equal(useCoreAbility(w,'riverstep').used,false);updateCore(w,7);assert.equal(riverstepMultiplier(w,'speed'),1.03);w.core.cooldowns.riverstep=0;w.core.reserves=0;assert.equal(useCoreAbility(w,'riverstep').used,false);});
test('passive restoration is capped, NPCs are excluded and defeat clears persistent skills',()=>{const w=fresh();w.core.reserves=reservesMax(w);onCoreLineHit(w,{coreSkill:'reeds-call',owner:w.player},w.wildlife[0]);assert.equal(w.core.reserves,reservesMax(w));assert.equal(useCoreAbility(w,'reading-the-current').used,false);useCoreAbility(w,'undertow');useCoreAbility(w,'riverstep');w.player.health=0;updateCore(w,.1);assert.equal(w.core.undertow,null);assert.equal(w.core.hook,null);assert.equal(w.core.riverstep,0);});

test('effect rendering uses sprite mappings and never changes simulation or random state',async()=>{
 const {drawCoreArt}=await import('../src/core-art.js');const {SPRITES}=await import('../src/sprite-definitions.js');
 const w=fresh();useCoreAbility(w,'undertow');useCoreAbility(w,'riverstep');w.effects.push({name:'current-return',x:1,y:1,toX:10,toY:10,life:.3,duration:.55},{name:'riverstep-trail',x:1,y:1,life:.3,duration:.6});
 const before=JSON.stringify([w.core,w.player.x,w.player.y,w.effects,w.animals]);
 const ctx=new Proxy({}, {get:(o,k)=>o[k]??(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const random=Math.random;Math.random=()=>{throw Error('drawing consumed gameplay randomness');};
 try{drawCoreArt(ctx,w);drawCoreArt(ctx,w);}finally{Math.random=random;}
 assert.equal(JSON.stringify([w.core,w.player.x,w.player.y,w.effects,w.animals]),before);
 for(const id of ['core.undertow','core.hook','core.ripple'])assert.ok(SPRITES[id].animations.idle.frames.length);
});
