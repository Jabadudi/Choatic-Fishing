import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {createParticles,stepParticles,drawAtmosphere} from '../src/atmosphere.js';

test('particle pool is capped and stepping does not grow or escape',()=>{
 const p=createParticles(60,()=>.5);assert.equal(p.length,60);
 assert.deepEqual(['pollen','leaf','fly'].map(k=>p.filter(q=>q.kind===k).length),[34,12,14]);
 for(let i=0;i<20000;i++)stepParticles(p,1/60,i/60);
 assert.equal(p.length,60);assert.ok(p.every(q=>q.x>=0&&q.x<=1&&q.y>=0&&q.y<=1&&Number.isFinite(q.x)));
});
test('atmosphere draws headless over the full view, and only in adventure',()=>{
 const fills=[],grad={addColorStop(){}};
 let origin=null;const ctx=new Proxy({fillRect(...a){fills.push(a);},translate(x,y){origin??=[x,y];},createLinearGradient:()=>grad,createRadialGradient:()=>grad},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
 const w=new World(()=>0,{adventure:true}),view={left:100,top:200,right:1060,bottom:920};
 drawAtmosphere(ctx,w,view);assert.deepEqual(origin,[100,200]);assert.ok(fills.some(([x,y,a,b])=>x===0&&y===0&&a===960&&b===720));
 fills.length=0;drawAtmosphere(ctx,new World(()=>0,{botCount:0}),view);assert.equal(fills.length,0);
});
test('atmosphere reuses its gradients between frames of the same size',()=>{
 let made=0;const grad={addColorStop(){}};
 const ctx=new Proxy({createLinearGradient:()=>(made++,grad),createRadialGradient:()=>(made++,grad)},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
 const w=new World(()=>0,{adventure:true});
 drawAtmosphere(ctx,w,{left:0,top:0,right:960,bottom:720});made=0;w.elapsed=1;
 drawAtmosphere(ctx,w,{left:40,top:30,right:1000,bottom:750});assert.equal(made,0);
});

// The quarry uses analytic motion: repeated renders must not step particles or touch progress.
test('quarry lighting motion repeats at a fixed clock without random calls or save changes',async()=>{
 const {captureSave}=await import('../src/save-format.js'),{DELTA}=await import('../src/delta-areas.js');
 const {quarryLighting,drawQuarryBandMotion}=await import('../src/quarry-light.js');
 const built=DELTA['abandoned-quarry'],w=new World(()=>.4,{adventure:true});w.areaId='abandoned-quarry';w.elapsed=4;
 const calls=[],ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...args)=>calls.push([k,args]),set:(o,k,v)=>(o[k]=v,true)});
 const random=Math.random,before=captureSave(w,'manual',123),view={left:0,top:0,right:2400,bottom:2200};
 try{
  Math.random=()=>{throw Error('Drawing consumed randomness');};w.random=Math.random;
  const light=quarryLighting(built),motion={ripples:light.ripples,weeds:[{x:1000,y:700,z:-96,seed:.3}]};
  const draw=()=>{calls.length=0;drawAtmosphere(ctx,w,view);drawQuarryBandMotion(ctx,motion,w.elapsed);return structuredClone(calls);};
  const first=draw();assert.ok(first.length>0);assert.deepEqual(draw(),first);assert.deepEqual(captureSave(w,'manual',123),before);
  w.elapsed=8;assert.notDeepEqual(draw(),first,'elapsed time animates the visual positions');
 }finally{Math.random=random;}
});
