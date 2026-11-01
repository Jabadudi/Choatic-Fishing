import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../src/world.js';
import {SLOTS} from '../src/spawn-tables.js';
import {createCreature,rollArea,spawnWeights} from '../src/spawns.js';
import {updateWildlife,damageAnimal,startleRange,rushSpeed} from '../src/wildlife.js';
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
 w.areaId='windchime';Object.assign(w.player,{x:fox.x+62,y:fox.y});
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

test('bears roam the deep trails, rear up and roar when first hurt, then swipe',()=>{
 for(const id of ['trailhead','deep-trail'])assert.ok(spawnWeights(id,'land').some(([s])=>s==='bear'),id);
 const w=fresh(),slot=Object.values(SLOTS).find(s=>s.areaId==='deep-trail'&&s.habitat==='land'),bear=createCreature(slot,'bear',{id:'bear-1',seed:4});
 w.wildlife.push(bear);w.areaId='deep-trail';Object.assign(w.player,{x:bear.x+50,y:bear.y});
 updateWildlife(w,1/60);assert.notEqual(bear.state,'roar','a calm bear leaves Eli alone');
 damageAnimal(w,bear,10,w.player,0);bear.hurtRemaining=0;updateWildlife(w,1/60);
 assert.equal(bear.state,'roar');assert.equal(animalPose(bear).state,'roar');
 const x=bear.x;for(let i=0;i<30;i++)updateWildlife(w,1/60);assert.equal(bear.x,x,'it stands its ground while it roars');
 damageAnimal(w,bear,10,w.player,0);bear.hurtRemaining=0;assert.ok(bear.roarRemaining<bear.roar,'a second hit does not start the roar over');
 for(let i=0;i<60;i++)updateWildlife(w,1/60);
 assert.equal(bear.state,'attack');assert.equal(animalPose(bear).state,'attack');
 damageAnimal(w,bear,1e4,w.player,0);assert.ok(w.drops.some(d=>d.item.name==='Bear Meat'));
});

test('herons stalk the delta landmarks and fly off when Eli comes close',()=>{
 for(const id of ['upper-falls','glasswater','heron-islands','heron-point'])assert.ok(spawnWeights(id,'land').some(([s])=>s==='heron'),id);
 const w=fresh(),slot=Object.values(SLOTS).find(s=>s.areaId==='heron-point'&&s.habitat==='land'),heron=createCreature(slot,'heron',{id:'heron-1',seed:4});
 w.wildlife.push(heron);w.areaId='heron-point';Object.assign(w.player,{x:heron.x+startleRange(heron)-5,y:heron.y});
 updateWildlife(w,1/60);assert.equal(heron.state,'flee');assert.equal(animalPose(heron).state,'run','it takes to the air');
 damageAnimal(w,heron,1e4,w.player,0);assert.ok(w.drops.some(d=>d.item.name==='Heron Feather'));
});

const spawnAt=(w,areaId,habitat,species)=>{
 const slot=Object.values(SLOTS).find(s=>s.areaId===areaId&&s.habitat===habitat),a=createCreature(slot,species,{id:`${species}-1`,seed:4});
 w.wildlife.push(a);w.areaId=areaId;return a;
};
test('crabs and goats fight back; a goat headbutt throws Eli further than a crab nip',()=>{
 for(const [species,area] of [['crab','arrival-bay'],['goat','lookout-heights']]){
  assert.ok(spawnWeights(area,'land').some(([s])=>s===species),area);
  const w=fresh(),a=spawnAt(w,area,'land',species);Object.assign(w.player,{x:a.x+30,y:a.y});
  damageAnimal(w,a,5,w.player,0);a.hurtRemaining=0;updateWildlife(w,1/60);
  assert.equal(a.state,'attack',species);assert.equal(animalPose(a).state,'attack');
 }
 assert.ok(createCreature(Object.values(SLOTS).find(s=>s.areaId==='lookout-heights'&&s.habitat==='land'),'goat').knockback>90);
});
test('otters, ducks and seals keep to the water and swim or fly off when Eli comes close',()=>{
 for(const [species,area] of [['otter','falls-channels'],['duck','glasswater'],['seal','seal-skerries']]){
  assert.ok(spawnWeights(area,'water').some(([s])=>s===species),area);
  const w=fresh(),a=spawnAt(w,area,'water',species);assert.equal(a.habitat,'water');
  Object.assign(w.player,{x:a.x+startleRange(a)-5,y:a.y});updateWildlife(w,1/60);
  assert.equal(a.state,'flee',species);assert.equal(animalPose(a).state,'run');
 }
});
test('a hurt pike lunges at Eli from the water',()=>{
 const w=fresh(),a=spawnAt(w,'glasswater','water','pike');Object.assign(w.player,{x:a.x+60,y:a.y});
 damageAnimal(w,a,5,w.player,0);a.hurtRemaining=0;updateWildlife(w,1/60);
 assert.equal(a.state,'attack');assert.equal(animalPose(a).state,'attack');
 damageAnimal(w,a,1e4,w.player,0);assert.ok(w.drops.some(d=>d.item.name==='Pike Fillet'));
});

for(const id of ['fox','boar','elk','bear','heron','crab','goat','otter','duck','pike','seal'])test(`every ${id} clip points at a frame inside its sheet`,()=>{
 const def=SPRITES[id],[w,h]=pngSize(`assets/${def.asset}`),[cw,ch]=def.frameSize;
 assert.equal(w%cw,0);assert.equal(h%ch,0);
 const count=(w/cw)*(h/ch);
 for(const clip of Object.values(def.animations))for(const f of clip.frames)assert.ok(f>=0&&f<count,`frame ${f}`);
 if(['fox','boar','heron'].includes(id))assert.equal(frameIndex(def,'run','',{direction:'right'}),{fox:32,boar:34,heron:36}[id]);
});

test('passive animals watch a calm Eli instead of being pushed away by him',()=>{
 for(const species of ['fox','heron']){
  const w=fresh(),slot=Object.values(SLOTS).find(s=>s.areaId==='windchime'&&s.habitat==='land'),a=createCreature(slot,species,{id:`${species}-calm`,seed:7});
  w.wildlife.push(a);w.areaId='windchime';
  // Eli stands well inside the fear range but outside the startle range: the animal turns to look, and never runs.
  Object.assign(w.player,{x:a.x+(a.fearRange+startleRange(a))/2,y:a.y});
  for(let i=0;i<60*8;i++){updateWildlife(w,1/60);assert.notEqual(a.state,'flee',species);}
  // Walking past it sideways does not scare it either.
  Object.assign(w.player,{x:a.x+startleRange(a)+15,y:a.y-120});
  for(let i=0;i<60*1.2;i++){w.player.y+=150/60;updateWildlife(w,1/60);assert.notEqual(a.state,'flee',species);}
 }
});
test('rushing at an animal makes it bolt, and the flight carries it off before it settles and looks back',()=>{
 const w=fresh(),slot=Object.values(SLOTS).find(s=>s.areaId==='windchime'&&s.habitat==='land'),fox=createCreature(slot,'fox',{id:'fox-rush',seed:3});
 w.wildlife.push(fox);w.areaId='windchime';Object.assign(w.player,{x:fox.x+fox.fearRange+40,y:fox.y});
 let frames=0;
 while(fox.state!=='flee'&&frames++<120){w.player.x-=195/60;updateWildlife(w,1/60);}
 assert.equal(fox.state,'flee');assert.ok(Math.hypot(fox.x-w.player.x,fox.y-w.player.y)>startleRange(fox),'it ran before Eli reached it');
 assert.ok(rushSpeed(fox)<195);
 // Eli stops. The fox keeps running well past its fear range instead of halting right on its edge.
 for(let i=0;i<60*3&&fox.state==='flee';i++)updateWildlife(w,1/60);
 assert.equal(fox.state,'idle');
 assert.ok(Math.hypot(fox.x-w.player.x,fox.y-w.player.y)>fox.fearRange+60);
 assert.ok(fox.direction.x*(w.player.x-fox.x)+fox.direction.y*(w.player.y-fox.y)>0,'it looks back at Eli');
});
