import test from 'node:test';
import assert from 'node:assert/strict';
import {RARITIES} from '../src/artifacts.js';
import {VIEW,FISH,planSummon,drawSummon,summonLabels,cameraAt} from '../src/well-summon.js';
const sequence=values=>{let i=0;return ()=>values[i++%values.length];};
let seed=3;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
const rank=r=>RARITIES.indexOf(r);
// A canvas context that accepts every call and draws nothing.
const fakeContext=()=>new Proxy({},{get:(target,key)=>key in target?target[key]:()=>{},set:(target,key,value)=>{target[key]=value;return true;}});

test('every rarity has its own fish, so the fish tells you the rarity',()=>{
 assert.deepEqual(Object.keys(FISH),RARITIES);assert.equal(new Set(Object.values(FISH)).size,RARITIES.length);assert.equal(FISH.rare,'River Eel');
});

test('a ten-draw saves its best result for the last fish',()=>{
 const results=['common','legendary','uncommon','common','rare','common','common','epic','common','uncommon'];
 const plan=planSummon(results,sequence([.9]));
 assert.equal(plan.beats.length,10);assert.equal(plan.beats.at(-1).rarity,'legendary');assert.equal(plan.beats.at(-1).index,1);
 assert.deepEqual(plan.beats.map(b=>b.index).sort((a,b)=>a-b),[...Array(10).keys()]);
 for(let i=1;i<10;i++)assert.ok(plan.beats[i].start>=plan.beats[i-1].start);
 assert.ok(plan.total<25,'a ten-draw stays short enough to sit through');
});

test('fakeouts only ever tease: a stolen stone goes to the better fish, a flare promises more than the stone gives',()=>{
 for(let n=0;n<400;n++){
  const rarity=RARITIES[n%RARITIES.length],[beat]=planSummon([rarity],random).beats;
  assert.equal(beat.rarity,rarity);
  if(beat.fake==='steal')assert.ok(rank(beat.decoy)<rank(rarity),`a ${beat.decoy} decoy for a ${rarity}`);
  if(beat.fake==='flare')assert.ok(rank(beat.tease)>rank(rarity),`a ${beat.tease} flare for a ${rarity}`);
  assert.ok(beat.fake!=='steal'||rarity!=='common','nothing is weaker than a Common to steal from');
 }
 assert.equal(planSummon(['rare'],sequence([0,.1,.5,.5])).beats[0].fake,'steal');
 assert.equal(planSummon(['rare'],sequence([.99])).beats[0].fake,null);
});

test('drawing reads only the plan and the clock, and every stone gets its rarity label',()=>{
 const plan=planSummon(['common','rare','epic'],random),original=Math.random;let calls=0;
 Math.random=()=>{calls++;return original();};
 try{for(let t=0;t<plan.total;t+=.05)drawSummon(fakeContext(),plan,t);}finally{Math.random=original;}
 assert.equal(calls,0);
 for(const beat of plan.beats){const labels=summonLabels(plan,beat.start+beat.duration*.8).map(l=>l.text);assert.ok(labels.includes(beat.rarity[0].toUpperCase()+beat.rarity.slice(1)));}
 assert.deepEqual(summonLabels(plan,0),[]);
});

test('the camera is one continuous shot from Eli in the village, down the well, into the cavern',()=>{
 for(const rarities of [['rare'],['common','legendary','uncommon','common','rare','common','common','epic','common','uncommon']]){
  const plan=planSummon(rarities,random),start=cameraAt(plan,0),end=cameraAt(plan,plan.total);
  assert.deepEqual(start,{x:VIEW.w/2,y:VIEW.h/2,z:1},'it opens on the whole village');
  assert.ok(end.y-VIEW.h/2/end.z>VIEW.h,'it ends below the village');
  let last=start,deepest=0;
  for(let t=1/60;t<=plan.total;t+=1/60){
   const c=cameraAt(plan,t);
   assert.ok(Math.hypot(c.x-last.x,c.y-last.y)<8&&Math.abs(c.z-last.z)<.03,`no cut at ${t.toFixed(2)}s`);
   assert.ok(c.y>=deepest-20,'once it dives it does not climb back to the surface');
   if(t>plan.throwEnd)deepest=Math.max(deepest,c.y);last=c;
  }
 }
});

test('Eli only takes the jump shot when the draw holds an Epic or better',()=>{
 assert.equal(planSummon(['rare'],random).shot,false);assert.equal(planSummon(['common','uncommon','rare'],random).shot,false);
 assert.equal(planSummon(['epic'],random).shot,true);assert.equal(planSummon(['common','common','legendary'],random).shot,true);
 const toss=planSummon(['rare'],random),shot=planSummon(['epic'],random);
 assert.ok(shot.flights[0].release>toss.flights[0].release,'he crouches and jumps before he shoots');
});
