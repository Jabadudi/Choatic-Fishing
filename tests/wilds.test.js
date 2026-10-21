import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {neutralInput} from '../src/protocol.js';
import {LANDMARKS,LAKES,ROADS,SPAWN,WORLD,walkable,isWater,nearWater,sceneryAt,drawWilds,cachedChunkCount,clearTerrainCache} from '../src/wilds.js';

test('exploration begins on accessible land without an opponent or countdown',()=>{
 const world=new World(Math.random,{adventure:true});
 assert.deepEqual({x:world.player.x,y:world.player.y},SPAWN);
 assert.ok(walkable(SPAWN.x,SPAWN.y));assert.equal(world.bots.length,0);assert.equal(world.matchState,'playing');
 world.update(1,neutralInput());assert.equal(world.matchState,'playing');
 assert.equal(world.inspect(),true);assert.ok(world.discovered.has('landing'));assert.match(world.message,/boat/);
});
test('every landmark is walkable and trails provide continuous routes and bridges',()=>{
 for(const p of LANDMARKS)assert.ok(walkable(p.x,p.y),p.name);
 for(const road of ROADS)for(let i=1;i<road.length;i++)for(let t=0;t<=1;t+=.01){const x=road[i-1][0]+(road[i][0]-road[i-1][0])*t,y=road[i-1][1]+(road[i][1]-road[i-1][1])*t;assert.ok(walkable(x,y),`route ${x},${y}`);}
});
test('lakes and rivers can be fished while water, tar and lava block walking',()=>{
 const world=new World(()=>.1,{adventure:true}),l=LAKES[0];
 Object.assign(world.player,{x:l.x-l.rx-35,y:l.y});
 assert.ok(walkable(world.player.x,world.player.y));assert.ok(nearWater(world.player.x,world.player.y));assert.ok(world.cast({x:l.x,y:l.y}));
 world.fishing.update(2,false);const start=world.player.x;world.move(300,0,true);assert.ok(world.player.x>start);assert.ok(world.player.x<l.x-l.rx);assert.ok(walkable(world.player.x,world.player.y));
 assert.ok(isWater(l.x,l.y));assert.equal(walkable(l.x,l.y),false);assert.equal(walkable(5300,2250),false);assert.equal(walkable(5070,1300),false);
});
test('scenery is deterministic and rendering keeps a bounded chunk cache',()=>{
 assert.deepEqual(sceneryAt(20,25),sceneryAt(20,25));
 const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),original=globalThis.document;
 try{globalThis.document={createElement:()=>({getContext:()=>ctx})};clearTerrainCache();const world=new World(Math.random,{adventure:true});
 for(let x=0;x<WORLD.width;x+=512)drawWilds(ctx,world,{left:x,right:x+960,top:1800,bottom:2520});
 assert.ok(cachedChunkCount()<=30);
 }finally{globalThis.document=original;clearTerrainCache();}
});
