import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../src/world.js';
import {SLOTS} from '../src/spawn-tables.js';
import {createCreature,rollArea,spawnWeights} from '../src/spawns.js';
import {updateWildlife,damageAnimal} from '../src/wildlife.js';
import {animalPose} from '../src/wildlife-art.js';
import {SPRITES} from '../src/sprite-definitions.js';
import {frameIndex} from '../src/sprites.js';
const fresh=()=>{const w=new World(()=>.2,{adventure:true});w.journeyId='new-animals';return w;};
const pngSize=path=>{const b=readFileSync(path);return [b.readUInt32BE(16),b.readUInt32BE(20)];};

test('foxes roam Windchime Path and the Crossroads, and nowhere the story hunts deer',()=>{
 for(const id of ['windchime','crossroads'])assert.ok(spawnWeights(id,'land').some(([s])=>s==='fox'),id);
 for(const id of ['landing','marsh'])assert.ok(!spawnWeights(id,'land').some(([s])=>s==='fox'),id);
 const w=fresh();w.areaId='village';let seen=0;
 for(let i=0;i<60&&!seen;i++){w.wildlife=w.wildlife.filter(a=>a.areaId!=='windchime');seen=rollArea(w,'windchime').filter(a=>a.species==='fox').length;}
 assert.ok(seen>0,'a windchime roll brings a fox');
});

test('a fox bolts from further off than a rabbit, faster, and leaves a pelt',()=>{
 const w=fresh(),fox=createCreature(SLOTS['windchime-north'],'fox',{id:'fox-1',seed:11});w.wildlife.push(fox);
 w.areaId='windchime';Object.assign(w.player,{x:fox.x+100,y:fox.y});
 const {x,y}=fox;updateWildlife(w,1/60);assert.equal(fox.state,'flee');assert.equal(animalPose(fox).state,'run');
 // A rabbit would still be grazing at this distance (fear range 55), and the fox outruns its 180.
 for(let i=0;i<5;i++)updateWildlife(w,1/60);assert.ok(Math.hypot(fox.x-x,fox.y-y)>=215*6/60-1,'it runs at full speed');
 Object.assign(w.player,{x:fox.x-60,y:fox.y});damageAnimal(w,fox,1e4,w.player,0);
 assert.ok(w.drops.some(d=>d.item.name==='Fox Pelt'));assert.equal(animalPose(fox).state,'death');
});

test('boars live in the northern forest, ignore Eli until hurt, then charge him',()=>{
 for(const id of ['forest-edge','stone-clearing','whispering-woods'])assert.ok(spawnWeights(id,'land').some(([s])=>s==='boar'),id);
 const w=fresh(),slot=Object.values(SLOTS).find(s=>s.areaId==='stone-clearing'&&s.habitat==='land'),boar=createCreature(slot,'boar',{id:'boar-1',seed:3});
 w.wildlife.push(boar);w.areaId='stone-clearing';Object.assign(w.player,{x:boar.x+120,y:boar.y});
 for(let i=0;i<20;i++)updateWildlife(w,1/60);assert.notEqual(boar.state,'flee');assert.ok(!(boar.anger>0));
 damageAnimal(w,boar,10,w.player,0);boar.hurtRemaining=0;
 updateWildlife(w,1/60);assert.equal(boar.state,'walk');assert.equal(animalPose(boar).state,'run','an angry boar rushes');
 Object.assign(w.player,{x:boar.x+30,y:boar.y});const before=w.player.health;
 updateWildlife(w,1/60);assert.equal(boar.state,'attack');assert.deepEqual(animalPose(boar),{state:'attack',time:boar.time,duration:boar.attackWindup});
 for(let i=0;i<40;i++){Object.assign(w.player,{x:boar.x+30,y:boar.y});updateWildlife(w,1/60);}
 assert.ok(w.player.health<before,'the tusks land');
 damageAnimal(w,boar,1e4,w.player,0);assert.ok(w.drops.some(d=>d.item.name==='Boar Meat'));
});

test('elk graze in Elk Run and the deep woods, and sweep their antlers once hurt',()=>{
 for(const id of ['elk-run','trailhead','deep-trail'])assert.ok(spawnWeights(id,'land').some(([s])=>s==='elk'),id);
 const w=fresh(),slot=Object.values(SLOTS).find(s=>s.areaId==='elk-run'&&s.habitat==='land'),elk=createCreature(slot,'elk',{id:'elk-1',seed:4});
 w.wildlife.push(elk);w.areaId='elk-run';Object.assign(w.player,{x:elk.x+50,y:elk.y});
 damageAnimal(w,elk,10,w.player,0);elk.hurtRemaining=0;updateWildlife(w,1/60);
 assert.equal(elk.state,'attack');assert.equal(animalPose(elk).state,'attack');
 damageAnimal(w,elk,1e4,w.player,0);assert.ok(w.drops.some(d=>d.item.name==='Elk Meat'));
});

for(const id of ['fox','boar','elk'])test(`every ${id} clip points at a frame inside its sheet`,()=>{
 const def=SPRITES[id],[w,h]=pngSize(`assets/${def.asset}`),[cw,ch]=def.frameSize;
 assert.equal(w%cw,0);assert.equal(h%ch,0);
 const count=(w/cw)*(h/ch);
 for(const clip of Object.values(def.animations))for(const f of clip.frames)assert.ok(f>=0&&f<count,`frame ${f}`);
 if(id!=='elk')assert.equal(frameIndex(def,'run','',{direction:'right'}),id==='fox'?32:34);
});
