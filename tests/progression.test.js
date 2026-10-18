import test from 'node:test';
import assert from 'node:assert/strict';
import {Progression,XP} from '../src/progression.js';
import {World} from '../src/world.js';

test('XP carries over increasing thresholds and queues every level choice',()=>{
  const p=new Progression();
  p.award(250);
  assert.equal(p.level,3);
  assert.equal(p.xp,25);
  assert.equal(p.xpToNextLevel,180);
  assert.equal(p.pendingChoices,2);
  assert.equal(p.totalXp,250);
  assert.equal(p.choose('invalid'),false);
  assert.equal(p.pendingChoices,2);
  assert.equal(p.choose('speed'),false);
  assert.equal(p.choose('whirlpool'),true);
  assert.equal(p.choose('tidal'),true);
  assert.equal(p.choose('tidal'),false);
  assert.equal(p.speedMultiplier,1);
  assert.equal(p.specialCharges,2);
});

test('eliminations grant XP once per opponent and invalid XP cannot corrupt progression',()=>{
  const w=new World(Math.random,{botCount:0,countdownSeconds:0});
  assert.equal(w.recordElimination('opponent-1'),true);
  assert.equal(w.recordElimination('opponent-1'),false);
  assert.equal(w.recordElimination(''),false);
  assert.equal(w.recordElimination(null),false);
  assert.equal(w.progression.totalXp,XP.elimination);
  for(const amount of [NaN,Infinity,-30,0,.5])w.progression.award(amount);
  assert.equal(w.progression.totalXp,XP.elimination);
});

test('real catches grant XP; cancellations and failures do not',()=>{
  const w=new World(()=>.1,{botCount:0,countdownSeconds:0}),input={left:false,right:false,up:false,down:false,aim:{x:0,y:365},held:false};
  w.player.x=180;
  for(let catchIndex=0;catchIndex<3;catchIndex++){
    assert.ok(w.cast(input.aim));
    for(let i=0;i<5000&&w.fishing.state!=='idle';i++){
      const f=w.fishing;
      input.held=f.state==='reeling'&&f.bar+f.velocity*.2+.135<f.target;
      w.update(1/120,input);
    }
    assert.equal(w.catches.length,catchIndex+1);
    w.equip(2);
    while(w.inventory.item){w.useItem();w.update(.5,input);}
  }
  assert.equal(w.progression.level,2);
  assert.equal(w.progression.pendingChoices,1);
  assert.equal(w.progression.totalXp,90);
  assert.equal(Object.values(w.progression.ranks).reduce((sum,rank)=>sum+rank,0),3);
  w.cast(input.aim);w.cancel();
  w.cast(input.aim);input.held=false;
  for(let i=0;i<2400;i++)w.update(1/120,input);
  assert.equal(w.progression.totalXp,90);
  assert.equal(Object.values(w.progression.ranks).reduce((sum,rank)=>sum+rank,0),3);
});

test('speed rewards change movement but do not alter fishing or pause the world',()=>{
  const baseline=new World(()=>.1,{botCount:0,countdownSeconds:0}),upgraded=new World(()=>.1,{botCount:0,countdownSeconds:0});
  upgraded.progression.grantCatchBuff(()=>0);
  const input={right:true,left:false,up:false,down:false,aim:{x:0,y:365},held:false};
  baseline.update(.1,input);upgraded.update(.1,input);
  assert.ok(Math.abs((upgraded.player.x-480)/(baseline.player.x-480)-1.05)<1e-10);
  for(const w of [baseline,upgraded]){w.player.x=180;w.player.y=365;w.cast(input.aim);}
  for(let i=0;i<300;i++){baseline.update(1/120,input);upgraded.update(1/120,input);}
  assert.equal(upgraded.fishing.bar,baseline.fishing.bar);
  assert.equal(upgraded.fishing.target,baseline.fishing.target);
  assert.equal(upgraded.fishing.progress,baseline.fishing.progress);
  assert.ok(upgraded.elapsed>2);
  assert.equal(new World(Math.random,{botCount:0,countdownSeconds:0}).progression.totalXp,0);
});



