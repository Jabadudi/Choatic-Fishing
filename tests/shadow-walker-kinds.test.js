import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../src/world.js';
import {SLOTS} from '../src/spawn-tables.js';
import {createCreature,spawnWeights} from '../src/spawns.js';
import {ANIMAL_TYPES} from '../src/entities.js';
import {animalPose} from '../src/wildlife-art.js';
import {damageAnimal,animalGround} from '../src/wildlife.js';
import {SPRITES} from '../src/sprite-definitions.js';
import {isWater,waterDistance} from '../src/wilds.js';
import {codexEntry} from '../src/codex.js';
const KINDS=['hollow-stag','gloam-boar','stoneshade','whisperer','mire-walker','drowned-soldier','ash-archer','inkeel'];
const idle=w=>({left:false,right:false,up:false,down:false,held:false,aim:{x:w.player.x+1,y:w.player.y}});
const pngSize=path=>{const b=readFileSync(path);return [b.readUInt32BE(16),b.readUInt32BE(20)];};
// Reedwater Landing with one monster and nothing else, so only its AI is running.
function setup(species,slot='landing-east'){
 const w=new World(()=>.2,{adventure:true});w.journeyId='kinds-test';w.spawns=null;w.rabbits=[];
 const a=createCreature(SLOTS[slot],species,{id:species});w.wildlife=[a];w.areaId=SLOTS[slot].areaId;
 Object.assign(w.player,{x:a.x-400,y:a.y});return {w,a};
}
const until=(w,test,seconds=10,step=1/30)=>{for(let t=0;t<seconds;t+=step){if(test())return true;w.update(step,idle(w));}return test();};

test('the eight shadow walker kinds hunt Eli, stay outrunnable and spawn where the plan puts them',()=>{
 for(const id of KINDS){
  const spec=ANIMAL_TYPES[id];assert.equal(spec.behavior,'aggressive',id);assert.ok(spec.chaseSpeed<195,id);
  assert.equal(codexEntry(id).category,'monsters');
 }
 assert.ok(spawnWeights('outer-shallows','water').some(([s])=>s==='inkeel'));
 assert.ok(spawnWeights('outer-shallows','land').some(([s])=>s==='drowned-soldier'));
});

for(const id of KINDS)test(`every ${id} clip points at a frame inside its sheet`,()=>{
 const def=SPRITES[id],[w,h]=pngSize(`assets/${def.asset}`),[cw,ch]=def.frameSize;
 assert.equal(w%cw,0);assert.equal(h%ch,0);
 const count=(w/cw)*(h/ch);
 for(const [name,clip] of Object.entries(def.animations))for(const f of clip.frames)assert.ok(f>=0&&f<count,`${name} frame ${f}`);
 for(const clip of ['idle','walk:right','walk:down','walk:up','raise','swing','death'])assert.ok(def.animations[clip],clip);
});

test('the Hollow Stag gallops after Eli and every kind leaves Shadow Ichor',()=>{
 const {w,a}=setup('hollow-stag');Object.assign(w.player,{x:a.x-200,y:a.y});
 assert.ok(until(w,()=>a.state==='chase'&&!a.still,2));assert.equal(animalPose(a).state,'run');
 for(const id of KINDS){const {w,a}=setup(id,id==='inkeel'?'landing-shallows':'landing-east');damageAnimal(w,a,1e4,w.player,0);assert.ok(w.drops.some(d=>d.item.name==='Shadow Ichor'),id);}
});

test('a Whisperer is faint until it notices Eli, then fades in',()=>{
 const {w,a}=setup('whisperer');w.update(1/30,idle(w));assert.ok(a.visibility<.2);
 Object.assign(w.player,{x:a.x-120,y:a.y});w.update(1/30,idle(w));
 assert.equal(a.state,'notice');assert.equal(animalPose(a).state,'appear');
 assert.ok(until(w,()=>a.visibility===1,2));
});

test('a Mire Walker lies hidden, rises as Eli passes, and its grab slows him',()=>{
 const {w,a}=setup('mire-walker');w.update(1/30,idle(w));assert.equal(animalPose(a).state,'submerged');
 Object.assign(w.player,{x:a.x-50,y:a.y});w.update(1/30,idle(w));
 assert.equal(animalPose(a).state,'appear');
 assert.ok(until(w,()=>a.state==='strike',4));
 assert.ok(w.player.slowRemaining>0,'grabbed');
 // Half pace while held.
 Object.assign(w.player,{vx:0,vy:0});a.state='return';a.x+=2000;
 const step=()=>{const x=w.player.x;w.update(.05,{...idle(w),left:true});return Math.abs(w.player.x-x);};
 const slow=step();w.player.slowRemaining=0;const free=step();
 assert.ok(slow<free*.6,`slow ${slow} free ${free}`);
});

test('an Ash Archer shoots from range, backs off when Eli closes in, and a dash goes through its arrow',()=>{
 const {w,a}=setup('ash-archer');Object.assign(w.player,{x:a.x-250,y:a.y});
 assert.ok(until(w,()=>w.projectiles.some(s=>s.owner===a),5),'it looses an arrow');
 const health=w.player.health;
 assert.ok(until(w,()=>w.player.health<health,3),'the arrow lands');
 assert.equal(w.projectiles.filter(s=>s.owner===a).length,0);
 // A dashing Eli takes no hit.
 a.attackCooldownRemaining=0;a.state='attack';a.time=0;a.attackRemaining=0;w.player.health=health;
 w.update(1/30,idle(w));assert.ok(w.projectiles.some(s=>s.owner===a));
 for(let i=0;i<60;i++){w.player.dashRemaining=.1;w.update(1/30,idle(w));}
 assert.equal(w.player.health,health);
 // Too close: it steps back.
 Object.assign(w.player,{x:a.x-80,y:a.y});a.state='chase';a.attackCooldownRemaining=5;const d=Math.hypot(w.player.x-a.x,w.player.y-a.y);
 w.update(1/30,idle(w));w.update(1/30,idle(w));
 assert.ok(Math.hypot(w.player.x-a.x,w.player.y-a.y)>d,'backing away');assert.equal(animalPose(a).state,'back');
});

test('a Drowned Soldier wades into the shallows, and an Inkeel strikes Eli on the bank',()=>{
 const soldier=createCreature(Object.values(SLOTS).find(s=>s.areaId==='outer-shallows'&&s.habitat==='land'),'drowned-soldier',{id:'s'});
 const wet=[];for(let x=0;x<3000&&!wet.length;x+=20)for(let y=0;y<3000&&!wet.length;y+=20)if(isWater(x,y,'outer-shallows')&&waterDistance(x,y,'outer-shallows')>-100)wet.push([x,y]);
 assert.ok(wet.length);assert.equal(animalGround(soldier,...wet[0]),true);
 assert.equal(animalGround({...soldier,wades:0},...wet[0]),false);
 Object.assign(soldier,{x:wet[0][0],y:wet[0][1],state:'walk',wading:true});assert.equal(animalPose(soldier).state,'wade');
 const slot=Object.values(SLOTS).find(s=>s.areaId==='glasswater'&&s.habitat==='water');
 const {w,a}=setup('inkeel',Object.keys(SLOTS).find(k=>SLOTS[k]===slot));
 // Eli on the nearest bank.
 let bank=null;for(let r=20;r<600&&!bank;r+=10)for(let k=0;k<32&&!bank;k++){const x=a.x+Math.cos(k/32*6.28)*r,y=a.y+Math.sin(k/32*6.28)*r;if(!isWater(x,y,'glasswater'))bank=[x,y];}
 Object.assign(w.player,{x:bank[0],y:bank[1]});const health=w.player.health;
 assert.ok(until(w,()=>w.player.health<health,8),'struck from the water');
 assert.ok(isWater(a.x,a.y,'glasswater'),'never leaves the water');
});
