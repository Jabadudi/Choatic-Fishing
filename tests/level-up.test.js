import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {render} from '../src/renderer.js';
import {practise} from '../src/skills.js';
import {drawLevelBurst,LEVEL_UP_SECONDS} from '../src/level-up-fx.js';

const fakeContext=()=>new Proxy({arc(x,y,r){assert.ok(r>=0);},ellipse(x,y,rx,ry){assert.ok(rx>=0&&ry>=0);}},{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{t[k]=v;return true;}});

test('a main level plays the full burst over Eli instead of the floating XP',()=>{
 const world=new World(()=>0,{botCount:0,countdownSeconds:0}),p=world.player;
 const result=practise(world,p,'fishing',p.progression.xpToNextLevel+1);
 assert.ok(result.levels>=1);
 const bursts=world.effects.filter(e=>e.burst);assert.equal(bursts.length,1);
 assert.equal(bursts[0].burst,'level');assert.match(bursts[0].label,/^Level \d+/);
 assert.ok(!world.effects.some(e=>e.name==='skill'));
});

test('a skill level on its own plays the smaller burst, and plain XP stays a floating label',()=>{
 const world=new World(()=>0,{botCount:0,countdownSeconds:0}),p=world.player;
 practise(world,p,'cooking',1);assert.deepEqual(world.effects.map(e=>e.name),['skill']);
 world.effects=[];p.progression.skills.cooking.xp=39;
 const result=practise(world,p,'cooking',1);
 assert.equal(result.levels,0);assert.equal(result.skillLevels,1);
 assert.deepEqual(world.effects.map(e=>[e.burst,e.label]),[['skill','Cooking 2']]);
});

test('the burst draws every frame of its life without negative geometry or randomness',()=>{
 const world=new World(()=>0,{botCount:0,countdownSeconds:0}),ctx=fakeContext(),random=Math.random;
 Math.random=()=>{throw new Error('drawing must not use randomness');};
 try{
  for(let life=LEVEL_UP_SECONDS;life>0;life-=.1)for(const burst of ['level','skill']){
   const effect={name:'level-up',burst,label:'Level 2',x:0,y:0,angle:0,life,duration:LEVEL_UP_SECONDS};
   drawLevelBurst(ctx,effect,world.player,'back');drawLevelBurst(ctx,effect,world.player);
   world.effects=[effect];render(ctx,world);
  }
 }finally{Math.random=random;}
});
