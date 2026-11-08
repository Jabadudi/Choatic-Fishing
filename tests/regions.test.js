import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {AREAS} from '../src/wilds.js';
import {FIELD_MAPS} from '../src/field-maps.js';
import {fieldProgress} from '../src/field-play.js';
import {REGION_START,GATE_REACH} from '../src/region-play.js';
import {damageAnimal} from '../src/wildlife.js';
import {captureSave,restoreSave,requireGame} from '../src/save-format.js';
import {STARTER_SWORD} from '../src/warrior.js';
const idle=w=>({left:false,right:false,up:false,down:false,held:false,aim:{x:w.player.x+1,y:w.player.y}});
const regions=()=>{const w=new World(()=>.3,{adventure:true,regions:true});w.journeyId='regions-test';return w;};
const slimes=w=>w.wildlife.filter(a=>a.areaId===REGION_START&&a.health>0);
const kill=(w,a)=>{Object.assign(w.player,{x:a.x-40,y:a.y});a.downRemaining=1;for(let i=0;i<200&&a.health>0;i++){w.player.health=w.progression.maxHealth;damageAnimal(w,a,1000,w.player,0);}assert.equal(a.health,0);};

test('a Regions game starts on 1.1 Dewdrop Meadow with no story, no townsfolk and Eli’s sword in hand',()=>{
 const w=regions(),a=AREAS[REGION_START];
 assert.equal(w.areaId,REGION_START);assert.equal(w.story,null);assert.equal(w.regions,true);
 assert.deepEqual([w.npcs.length,w.rabbits.length,w.spawns],[0,0,null]);
 assert.equal(w.player.name,'Eli');assert.equal(w.inventory.item?.name,STARTER_SWORD);
 // A third of the old Landing's height, run west to east.
 assert.deepEqual([a.width,a.height],[4000,740]);assert.ok(w.player.x<300);
});

test('slimes stand in bunches of three or four, and their count is the kill goal',()=>{
 const w=regions(),f=FIELD_MAPS[REGION_START],all=slimes(w);
 assert.ok(all.every(s=>s.species==='slime'&&s.behavior==='aggressive'));
 assert.equal(all.length,f.clear.kills);assert.equal(fieldProgress(w).goal,all.length);
 const bunches=Object.values(Object.groupBy(all,s=>s.packId));
 assert.equal(bunches.length,f.bunches.length);
 for(const b of bunches){assert.ok(b.length>=3&&b.length<=4,`${b[0].packId}: ${b.length}`);const cx=b.reduce((n,s)=>n+s.x,0)/b.length,cy=b.reduce((n,s)=>n+s.y,0)/b.length;assert.ok(b.every(s=>Math.hypot(s.x-cx,s.y-cy)<120),'bunched up');}
 // Levels rise west to east inside the map's band.
 assert.ok(all.every(s=>s.level>=1&&s.level<=2));assert.ok(all.some(s=>s.level===2));
 // Hitting one brings its whole bunch.
 const one=all[0],rest=all.filter(s=>s.packId===one.packId&&s!==one);Object.assign(w.player,{x:one.x-40,y:one.y});damageAnimal(w,one,1,w.player,0);
 for(const s of rest)assert.ok(s.alert>0&&s.threat,'the bunch is roused');
});

test('the gate east stays sealed until every slime is down; clearing pays once and stays cleared',()=>{
 const w=regions(),a=AREAS[REGION_START];
 Object.assign(w.player,{x:a.width-GATE_REACH+20,y:380});w.update(1/60,idle(w));assert.match(w.message,/gate is sealed\. \d+ slimes/);
 const all=slimes(w),stones=w.well.stones;
 for(const s of all.slice(0,-1))kill(w,s);
 assert.equal(w.fieldClear,undefined);assert.equal(fieldProgress(w).kills,all.length-1);
 kill(w,all.at(-1));
 assert.ok(w.fieldClear);assert.equal(w.fieldClear.code,'1.1');assert.equal(w.fieldClear.first,true);assert.equal(w.well.stones,stones+1);
 assert.equal(fieldProgress(w).kills,all.length,'the count stays full');assert.equal(fieldProgress(w).clears,1);
 Object.assign(w.player,{x:2000,y:380});w.update(1/60,idle(w));Object.assign(w.player,{x:a.width-GATE_REACH+20,y:380});w.update(1/60,idle(w));
 assert.match(w.message,/gate stands open/);
});

test('a Regions save keeps the slimes that are down, and the Regions page refuses other journeys',()=>{
 const w=regions(),all=slimes(w);kill(w,all[0]);kill(w,all[5]);
 const save=captureSave(w);assert.equal(save.state.regions,true);
 const r=restoreSave(save);
 assert.equal(r.regions,true);assert.equal(r.story,null);assert.equal(slimes(r).length,all.length-2);
 assert.ok(!slimes(r).some(s=>s.id===all[0].id||s.id===all[5].id));assert.equal(fieldProgress(r).kills,2);
 const bad=structuredClone(save);bad.state.fieldMaps[REGION_START].defeated.push('dewdrop-meadow:99-1');assert.throws(()=>restoreSave(bad),/field map/);
 const old=new World(()=>.3,{adventure:true,story:true});old.journeyId='old';const story=captureSave(old);
 try{requireGame('regions');assert.throws(()=>restoreSave(story),/earlier test build/);assert.ok(restoreSave(save).regions);}finally{requireGame(null);}
});
