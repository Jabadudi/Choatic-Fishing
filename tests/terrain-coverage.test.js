import test from 'node:test';
import assert from 'node:assert/strict';
import {TerrainCoverageCache} from '../src/terrain-coverage.js';

test('coverage runs reproduce every original sample including negative coordinates',()=>{
 const cache=new TerrainCoverageCache(),sample=(x,y)=>x<0?'water':y<0?'sand':'grass';
 const runs=cache.get('tile',-8,-4,20,12,2,sample),pixels=new Map();
 for(const [material,rects]of runs)for(let i=0;i<rects.length;i+=4){
  const [x,y,w,h]=rects.slice(i,i+4);
  for(let py=y;py<y+h;py+=2)for(let px=x;px<x+w;px+=2){const key=`${px},${py}`;assert.ok(!pixels.has(key));pixels.set(key,material);}
 }
 for(let y=0;y<12;y+=2)for(let x=0;x<20;x+=2)assert.equal(pixels.get(`${x},${y}`),sample(x-8,y-4));
 assert.equal(pixels.size,60);
});

test('image repaints reuse geometry and cache has bounded least-recently-used eviction',()=>{
 const cache=new TerrainCoverageCache(2);let calls=0;
 const get=key=>cache.get(key,0,0,8,8,2,()=>{calls++;return 'grass';});
 const a=get('a');assert.equal(calls,16);get('b');assert.equal(get('a'),a);assert.equal(calls,32);
 get('c');assert.equal(cache.entries.size,2);assert.equal(get('a'),a);get('b');assert.equal(calls,64);
 cache.clear();assert.equal(cache.entries.size,0);get('a');assert.equal(calls,80);
});
