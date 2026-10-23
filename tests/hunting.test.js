import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {damage,attack,special,updateProjectiles,combatTargets} from '../src/combat.js';
import {BEHAVIORS,ENTITY_TYPES,reactionFor} from '../src/entities.js';
import {animalGround,damageAnimal,updateWildlife} from '../src/wildlife.js';
import {neutralInput} from '../src/protocol.js';
import {visibleRabbits} from '../src/rabbits.js';
const fresh=()=>new World(()=>.1,{adventure:true});

test('nine animals have their assigned behavior; Mara is a talk-only, untargetable NPC',()=>{
 const w=fresh();assert.equal(w.animals.length,9);assert.equal(new Set(w.animals.map(a=>a.id)).size,9);
 for(const a of w.animals){assert.equal(a.entityType,ENTITY_TYPES.ANIMAL);assert.equal(a.behavior,a.species==='deer'?BEHAVIORS.DEFENSIVE:BEHAVIORS.PASSIVE);assert.equal(a.health,a.maxHealth);assert.ok(animalGround(a,a.x,a.y),a.id);}
 const mara=w.npcs[0];assert.equal(mara.entityType,ENTITY_TYPES.NPC);assert.equal(mara.huntable,false);assert.deepEqual(mara.interactions,['talk']);
 assert.equal(combatTargets(w).includes(mara),false);assert.equal(damage(w,mara,100,w.player,0,300),false);
 Object.assign(w.player,{x:mara.x-25,y:mara.y});assert.ok(w.inspect());assert.match(w.message,/Mara: Hello! Catch me 1 sardine/);
});

test('behavior policy distinguishes fleeing, retaliation and aggression without assigning hostile animals',()=>{
 const animal={entityType:'animal',health:50,behavior:'passive'};
 assert.equal(reactionFor(animal,{provoked:true}),'flee');assert.equal(reactionFor(animal,{disturbed:true}),'flee');
 assert.equal(reactionFor({...animal,behavior:'defensive'}),'idle');assert.equal(reactionFor({...animal,behavior:'defensive'},{provoked:true}),'retaliate');
 assert.equal(reactionFor({...animal,behavior:'aggressive'}),'pursue');assert.equal(reactionFor({...animal,entityType:'npc'},{provoked:true}),'none');
});

test('melee hunting respects facing and distance, counts one hunt and grants hunting XP once',()=>{
 const w=fresh(),deer=w.wildlife.find(a=>a.species==='deer'&&a.areaId==='landing');
 Object.assign(w.player,{x:deer.x-55,y:deer.y,angle:Math.PI});
 attack(w,w.player,{name:'Anchor'});assert.equal(deer.health,60);
 w.player.angle=0;attack(w,w.player,{name:'Reed Spear'});assert.equal(deer.health,38);assert.ok(deer.alert>0);
 attack(w,w.player,{name:'Anchor'});assert.equal(deer.health,0);assert.equal(w.hunting.total,1);assert.equal(w.hunting.bySpecies.deer,1);assert.equal(w.progression.totalXp,25);
 assert.equal(damageAnimal(w,deer,100,w.player,0),false);assert.equal(w.progression.totalXp,25);assert.equal(w.progression.eliminations.size,0);
 assert.ok(w.matchState==='playing');
});

test('finite-use weapons hunt animals through the existing Use action and preserve the kill message',()=>{
 const w=fresh(),rabbit=w.rabbits[0];Object.assign(w.player,{x:rabbit.x-40,y:rabbit.y,angle:0});
 w.inventory.receive({name:'Reed Spear'});w.inventory.assignHotbar(w.inventory.allItems.at(-1).id,2);w.equip(2);assert.ok(w.useItem());
 assert.equal(rabbit.health,0);assert.equal(w.inventory.item.uses,4);assert.match(w.message,/Rabbit hunted/);
 w.update(2.1,neutralInput());assert.equal(visibleRabbits(w).includes(rabbit),false);
 assert.equal(w.hunting.total,1);
});

test('ranged hunting crosses water, does not skip small targets, and awards aquatic XP',()=>{
 const w=fresh(),eel=w.wildlife.find(a=>a.species==='eel');
 Object.assign(w.player,{x:eel.x-100,y:eel.y,angle:0});attack(w,w.player,{name:'Harpoon Gun'});
 updateProjectiles(w,.4);assert.equal(eel.health,0);assert.equal(w.hunting.bySpecies.eel,1);assert.equal(w.progression.totalXp,12);
});

test('bombs and radial specials affect animals while leaving Mara available for conversation',()=>{
 const w=fresh(),rabbit=w.rabbits[0],mara=w.npcs[0];
 Object.assign(w.player,{x:rabbit.x-165,y:rabbit.y,angle:0});const saved=JSON.stringify(mara);
 attack(w,w.player,{name:'Pufferfish Bomb'});updateProjectiles(w,1);assert.equal(rabbit.health,0);assert.equal(JSON.stringify(mara),saved);
 const deer=w.wildlife.find(a=>a.species==='deer'&&a.areaId==='landing');Object.assign(w.player,{x:deer.x-40,y:deer.y});w.player.cooldown=0;w.progression.specials.whirlpool=1;
 assert.ok(special(w,w.player,'whirlpool'));assert.equal(deer.health,15);assert.equal(JSON.stringify(mara),saved);
});

test('only animals in the active area can be hit; area travel clears lingering projectiles',()=>{
 const w=fresh(),deer=w.wildlife.find(a=>a.areaId==='windchime');
 Object.assign(w.player,{x:deer.x-40,y:deer.y,angle:0});attack(w,w.player,{name:'Anchor'});assert.equal(deer.health,60);
 assert.equal(damageAnimal(w,deer,60,w.player,0),false);
 attack(w,w.player,{name:'Harpoon Gun'});assert.ok(w.projectiles.length);
 Object.assign(w.player,{x:1400,y:4});w.move(0,-12,false);assert.equal(w.areaId,'windchime');assert.equal(w.projectiles.length,0);
});

test('deer ignore nearby players, retaliate only after injury, and stop after a bounded pursuit',()=>{
 const w=fresh(),deer=w.wildlife.find(a=>a.species==='deer'&&a.areaId==='landing');
 Object.assign(w.player,{x:deer.x-35,y:deer.y});const x=deer.x;
 for(let i=0;i<60;i++)updateWildlife(w,1/120);
 assert.equal(deer.x,x);assert.equal(w.player.health,100);assert.equal(deer.behavior,'defensive');
 damageAnimal(w,deer,1,w.player,0);
 for(let i=0;i<120;i++)updateWildlife(w,1/120);
 assert.equal(w.player.health,88);
 const health=w.player.health;
 for(let i=0;i<12;i++)updateWildlife(w,1/120);
 assert.equal(w.player.health,health);
 Object.assign(w.player,{x:deer.x-400,y:deer.y});updateWildlife(w,1/120);
 assert.equal(deer.anger,0);assert.equal(deer.attackerId,null);
});

test('deer windup can be dodged and dashing prevents retaliation damage',()=>{
 const w=fresh(),deer=w.wildlife[0];Object.assign(w.player,{x:deer.x-35,y:deer.y});
 damageAnimal(w,deer,1,w.player,0);updateWildlife(w,.01);assert.equal(deer.state,'attack');
 w.player.x-=100;updateWildlife(w,.5);assert.equal(w.player.health,100);
 Object.assign(w.player,{x:deer.x-35,y:deer.y,dashRemaining:1});
 for(let i=0;i<240;i++)updateWildlife(w,1/120);
 assert.equal(w.player.health,100);
});

test('land and water animals respect habitat after attacks; wounded state persists across area visits',()=>{
 const w=fresh();
 for(const a of w.animals.filter(a=>a.areaId==='landing')){
  damageAnimal(w,a,1,w.player,Math.PI/3,300);
 }
 for(let i=0;i<120*12;i++){
  const a=w.animals[i%w.animals.length];if(a.areaId==='landing')Object.assign(w.player,{x:a.x-45,y:a.y-20});
  w.update(1/120,neutralInput());
  for(const a of w.animals)assert.ok(animalGround(a,a.x,a.y),a.id);
 }
 assert.ok(w.player.health>0);
 const health=w.wildlife[0].health,positions=JSON.stringify(w.animals.filter(a=>a.areaId==='landing'));
 w.areaId='windchime';w.update(.2,neutralInput());assert.equal(JSON.stringify(w.animals.filter(a=>a.areaId==='landing')),positions);
 w.areaId='landing';assert.equal(w.wildlife[0].health,health);
});
