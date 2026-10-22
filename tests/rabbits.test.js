import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../src/world.js';
import {createRabbits,updateRabbits,rabbitFrame,rabbitGround,RABBIT_FRAMES} from '../src/rabbits.js';
import {walkable,isWater} from '../src/wilds.js';
const fresh=()=>new World(()=>.1,{adventure:true});

test('provided sheet has 23 valid crops and idle, hop and settling use its poses',()=>{
 const png=readFileSync(new URL('../assets/bunny-sheet.png',import.meta.url));
 assert.equal(png.toString('ascii',1,4),'PNG');assert.equal(png.readUInt32BE(16),220);assert.equal(png.readUInt32BE(20),444);
 assert.equal(RABBIT_FRAMES.length,23);
 for(const [x,y,w,h]of RABBIT_FRAMES){assert.ok(w>0&&h>0&&x>=0&&y>=0&&x+w<=220&&y+h<=444);}
 const used=new Set();for(const state of ['idle','graze','hop','settle'])for(let t=0;t<3;t+=.01){const index=rabbitFrame({state,time:t,hopDuration:.65});assert.ok(index>=0&&index<23);used.add(index);}
 assert.equal(used.size,23);
});
test('rabbits spawn on dry navigable ground and idle before hopping',()=>{
 const w=fresh();assert.equal(w.rabbits.length,5);assert.deepEqual(w.rabbits,createRabbits());
 Object.assign(w.player,{x:50,y:50});let hopped=false,grazed=false;
 for(let i=0;i<120*12;i++){updateRabbits(w,1/120);for(const r of w.rabbits){assert.ok(rabbitGround(r.x,r.y,r.areaId));hopped ||=r.state==='hop';grazed ||=r.state==='graze';}}
 assert.ok(hopped&&grazed);
});
test('approaching a rabbit triggers a retreat without touching fishing or combat state',()=>{
 const w=fresh(),r=w.rabbits[0];w.rabbits=[r];Object.assign(w.player,{x:r.x-40,y:r.y});
 const distance=Math.hypot(r.x-w.player.x,r.y-w.player.y),health=w.player.health;
 w.fishing.state='reeling';Object.assign(w.fishing,{bar:.3,target:.4,progress:.7});
 for(let i=0;i<120;i++)updateRabbits(w,1/120);
 assert.ok(Math.hypot(r.x-w.player.x,r.y-w.player.y)>distance+20);
 assert.equal(w.player.health,health);assert.equal(w.fishing.progress,.7);assert.equal(w.fishing.bar,.3);assert.equal(w.fishing.state,'reeling');assert.equal(w.actors.length,1);
});
test('wandering and fleeing stay on land and rabbits persist while their area is inactive',()=>{
 const w=fresh();
 for(let i=0;i<120*60;i++){
  if(i%240===0){const r=w.rabbits[Math.floor(i/240)%w.rabbits.length];Object.assign(w.player,{x:r.x-70,y:r.y+15});}
  updateRabbits(w,1/120);
  for(const r of w.rabbits){assert.ok(walkable(r.x,r.y,r.areaId));assert.equal(isWater(r.x,r.y,r.areaId),false);}
 }
 const state=JSON.stringify(w.rabbits);w.areaId='windchime';updateRabbits(w,5);assert.equal(JSON.stringify(w.rabbits),state);
 w.areaId='landing';updateRabbits(w,.1);assert.notEqual(JSON.stringify(w.rabbits),state);
 w.matchState='finished';const stopped=JSON.stringify(w.rabbits);updateRabbits(w,1);assert.equal(JSON.stringify(w.rabbits),stopped);
});

test('rabbits allow a player outside the smaller scare radius to stand nearby',()=>{
 const w=fresh(),r=w.rabbits[0];Object.assign(w.player,{x:r.x-85,y:r.y});
 updateRabbits(w,.5);assert.equal(r.alert,0);assert.equal(r.state,'idle');
});
