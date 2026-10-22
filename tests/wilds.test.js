import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {render} from '../src/renderer.js';
import {neutralInput} from '../src/protocol.js';
import {LANDMARKS,LAKES,ROADS,SPAWN,WORLD,walkable,isWater,nearWater,sceneryAt,drawWilds,cachedChunkCount,clearTerrainCache,AREAS,transitionAt} from '../src/wilds.js';

test('exploration begins on accessible land without an opponent or countdown',()=>{
 const world=new World(Math.random,{adventure:true});
 assert.deepEqual({x:world.player.x,y:world.player.y},SPAWN);
 assert.ok(walkable(SPAWN.x,SPAWN.y));assert.equal(world.bots.length,0);assert.equal(world.matchState,'playing');
 world.update(1,neutralInput());assert.equal(world.matchState,'playing');
 assert.equal(world.inspect(),true);assert.ok(world.discovered.has('landing'));assert.match(world.message,/boat/);
});
test('landing landmarks and connecting trails are accessible',()=>{
 for(const p of LANDMARKS)assert.ok(walkable(p.x,p.y),p.name);
 for(const road of ROADS)for(let i=1;i<road.length;i++)for(let t=0;t<=1;t+=.01){const x=road[i-1][0]+(road[i][0]-road[i-1][0])*t,y=road[i-1][1]+(road[i][1]-road[i-1][1])*t;assert.ok(walkable(x,y),`route ${x},${y}`);}
});
test('fishing at the spring uses real shoreline geometry and water blocks walking',()=>{
 const world=new World(()=>.1,{adventure:true}),l=LAKES[0];
 Object.assign(world.player,{x:l.x-l.rx-35,y:l.y});
 assert.ok(walkable(world.player.x,world.player.y));assert.ok(nearWater(world.player.x,world.player.y));assert.ok(world.cast({x:l.x,y:l.y}));
 world.fishing.update(2,false);const start=world.player.x;world.move(300,0,true);assert.ok(world.player.x>start);assert.ok(world.player.x<l.x-l.rx);assert.ok(walkable(world.player.x,world.player.y));
 assert.ok(isWater(l.x,l.y));assert.equal(walkable(l.x,l.y),false);assert.equal(walkable(-10,200),false);
});
test('walking over connected map edges changes areas and returns without a menu',()=>{
 const world=new World(()=>.1,{adventure:true});world.discovered.add('landing');
 Object.assign(world.player,{x:1400,y:4});world.move(0,-12,false);
 assert.equal(world.areaId,'windchime');assert.deepEqual({x:world.player.x,y:world.player.y},{x:600,y:1510});assert.ok(walkable(world.player.x,world.player.y,world.areaId));
 world.inventory.receive({name:'Sardine'});world.progression.pendingUpgrades=1;world.chooseUpgrade('hermes');
 world.move(0,320,false);assert.equal(world.areaId,'landing');assert.equal(world.player.x,1400);assert.equal(world.player.y,120);assert.ok(world.discovered.has('landing'));
 assert.equal(world.inventory.item.name,'Sardine');assert.equal(world.progression.upgrades.hermes,1);
 Object.assign(world.player,{x:800,y:30});world.move(0,-100,false);assert.equal(world.areaId,'landing');assert.ok(world.player.y>=24);assert.equal(transitionAt(800,-1),null);
 for(const area of Object.values(AREAS))for(const exit of area.exits)assert.ok(walkable(exit.entry.x,exit.entry.y,exit.target));
});
test('scenery is deterministic and rendering keeps a bounded chunk cache',()=>{
 assert.deepEqual(sceneryAt(20,25),sceneryAt(20,25));
 const ctx=new Proxy({createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),original=globalThis.document;
 try{globalThis.document={createElement:()=>({getContext:()=>ctx})};clearTerrainCache();const world=new World(Math.random,{adventure:true});
 for(let x=0;x<WORLD.width;x+=512)drawWilds(ctx,world,{left:x,right:x+960,top:1800,bottom:2520});
 assert.ok(cachedChunkCount()<=30);
 }finally{globalThis.document=original;clearTerrainCache();}
});

import {leafyTree} from '../src/plains-art.js';
import {crownCacheSize} from '../src/wilds.js';
test('tree crowns use one cached sprite per variant and leafyTree supports parts',()=>{
 const calls=[];const ctx=new Proxy({fillRect(){calls.push(1);}},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
 leafyTree(ctx,0,0,false,'trunk');const trunk=calls.length;calls.length=0;leafyTree(ctx,0,0,false,'crown');
 assert.ok(trunk>0&&calls.length>trunk);
 const draws=[],c=new Proxy({drawImage(){draws.push(1);},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}}),original=globalThis.document;
 try{globalThis.document={createElement:()=>({getContext:()=>c})};clearTerrainCache();const world=new World(Math.random,{adventure:true});world.areaId='windchime';
  world.rabbits=[];render(c,world,{left:0,top:300,right:1200,bottom:1500});render(c,world,{left:0,top:300,right:1200,bottom:1500});
  assert.equal(crownCacheSize(),1);assert.ok(draws.length>20);
 }finally{globalThis.document=original;clearTerrainCache();}
});

import {shorePoints} from '../src/wilds.js';
test('shore points are cached per area and empty in Windchime Path',()=>{
 const a=shorePoints('landing',1,3);assert.ok(a.foam.length>0);assert.ok(a.sparkle.length>0);assert.equal(shorePoints('landing',1,3),a);
 assert.equal(shorePoints('windchime',1,3).foam.length,0);
});

import {labelAlpha} from '../src/wilds.js';
test('landmark labels fade in near the player',()=>{
 assert.equal(labelAlpha(100),1);assert.equal(labelAlpha(220),0);assert.equal(labelAlpha(500),0);assert.ok(Math.abs(labelAlpha(180)-.5)<1e-9);
});

test('labels and exit signs draw above swaying crowns',()=>{
 const ops=[],c=new Proxy({drawImage(){ops.push('img');},fillText(){ops.push('text');},translate(x,y){if(x===100&&y===1200)ops.push('atmosphere');},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}}),original=globalThis.document;
 try{globalThis.document={createElement:()=>({getContext:()=>c})};clearTerrainCache();const world=new World(Math.random,{adventure:true});world.areaId='windchime';Object.assign(world.player,{x:600,y:1600});
  world.rabbits=[];render(c,world,{left:100,top:1200,right:1100,bottom:1800});
  assert.ok(ops.includes('text'));const scene=ops.slice(0,ops.indexOf('atmosphere'));assert.ok(scene.lastIndexOf('img')<scene.indexOf('text'));
 }finally{globalThis.document=original;clearTerrainCache();}
});
test('shore foam and sparkles skip the pier and boat and use the coarse grid',()=>{
 const {foam,sparkle}=shorePoints('landing',2,3),onDock=([x,y])=>(x>=1200&&x<=1300&&y>=1725&&y<=1955)||(x>=1295&&x<=1400&&y>=1875&&y<=1915);
 assert.ok(foam.length>0);assert.equal(foam.filter(onDock).length,0);assert.equal(sparkle.filter(onDock).length,0);
 assert.ok(foam.every(([x,y])=>x%8===0&&y%8===0));
});
