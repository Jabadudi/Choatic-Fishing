import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {SLOTS} from '../src/spawn-tables.js';
import {createCreature} from '../src/spawns.js';
import {ANIMAL_TYPES,reactionFor} from '../src/entities.js';
import {DEFEAT_SECONDS,RESPAWN_GRACE} from '../src/monsters.js';
import {areaFor} from '../src/wilds.js';
import {animalPose} from '../src/wildlife-art.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {attack} from '../src/combat.js';
const idle=w=>({left:false,right:false,up:false,down:false,held:false,aim:{x:w.player.x+1,y:w.player.y}});
// Reedwater Landing with one shadow walker and nothing else, so only its AI is running.
function setup(){
 const w=new World(()=>.2,{adventure:true});w.journeyId='monster-test';w.spawns=null;w.rabbits=[];
 const walker=createCreature(SLOTS['landing-east'],'shadow-walker',{id:'walker'});w.wildlife=[walker];
 Object.assign(w.player,{x:walker.x-400,y:walker.y});return {w,walker};
}
const run=(w,seconds,step=1/30)=>{for(let t=0;t<seconds;t+=step)w.update(step,idle(w));};
const until=(w,test,seconds=10,step=1/30)=>{for(let t=0;t<seconds;t+=step){if(test())return true;w.update(step,idle(w));}return test();};

test('shadow walkers are aggressive monsters with their own art, loot and familiar',()=>{
 const spec=ANIMAL_TYPES['shadow-walker'];
 assert.equal(spec.behavior,'aggressive');assert.equal(spec.spriteId,'nightwalker');assert.equal(spec.loot,'shadow-walker');
 assert.equal(reactionFor({entityType:'animal',health:1,behavior:'aggressive'}),'pursue');
 // Eli runs at 195; a walker must be outrunnable.
 assert.ok(spec.chaseSpeed<195);
});

test('it roams until Eli comes close, then notices him and gives chase',()=>{
 const {w,walker}=setup();
 run(w,3);assert.ok(['idle','walk'].includes(walker.state));
 Object.assign(w.player,{x:walker.x-200,y:walker.y});w.update(1/30,idle(w));
 assert.equal(walker.state,'notice');assert.ok(w.effects.some(e=>e.name==='notice'));assert.match(w.message,/Shadow Walker has seen you/);
 const start=Math.hypot(walker.x-w.player.x,walker.y-w.player.y);
 assert.ok(until(w,()=>walker.state==='chase',1));
 run(w,.5);assert.ok(Math.hypot(walker.x-w.player.x,walker.y-w.player.y)<start-30,'closing in');
});

test('it winds up its axe, then hits Eli if he is still in reach',()=>{
 const {w,walker}=setup();
 Object.assign(w.player,{x:walker.x-45,y:walker.y});const max=w.player.health;
 assert.ok(until(w,()=>walker.state==='attack',3));
 assert.equal(w.player.health,max,'no damage during the windup');
 assert.equal(animalPose(walker).state,'raise');
 assert.ok(until(w,()=>walker.state==='strike',1));
 assert.ok(w.player.health<max-10,`took ${max-w.player.health}`);
 assert.equal(animalPose(walker).state,'swing');
 assert.ok(w.effects.some(e=>e.name==='player-hit'));
});

test('stepping out of reach or dashing during the windup avoids the blow',()=>{
 for(const dodge of ['step','dash']){
  const {w,walker}=setup();Object.assign(w.player,{x:walker.x-45,y:walker.y});const max=w.player.health;
  assert.ok(until(w,()=>walker.state==='attack',3));
  if(dodge==='step')w.player.x-=200;else w.dashRemaining=10;
  for(let i=0;i<30&&walker.state==='attack';i++)walker.alert=0,w.update(1/30,idle(w));
  assert.equal(w.player.health,max,dodge);
 }
});

test('it gives up when Eli escapes, walks home and heals',()=>{
 const {w,walker}=setup();
 Object.assign(w.player,{x:walker.x-200,y:walker.y});assert.ok(until(w,()=>walker.state==='chase',2));
 walker.health=20;Object.assign(w.player,{x:walker.x-700,y:walker.y-300});
 assert.ok(until(w,()=>walker.state==='return',1));
 Object.assign(w.player,{x:200,y:300});
 assert.ok(until(w,()=>walker.state==='idle',15));
 assert.equal(walker.health,walker.maxHealth);
 assert.ok(Math.hypot(walker.x-walker.home.x,walker.y-walker.home.y)<30);
});

test('a hit from range turns it on Eli even beyond its notice range',()=>{
 const {w,walker}=setup();
 Object.assign(w.player,{x:walker.x-380,y:walker.y,angle:0});attack(w,w.player,{name:'Hunting Bow'});
 assert.ok(until(w,()=>walker.health<walker.maxHealth,2),'arrow landed');
 assert.ok(until(w,()=>walker.state==='chase',2));
});

test('defeating one grants Hunting XP once and drops shadow walker loot',()=>{
 const {w,walker}=setup();Object.assign(w.player,{x:walker.x-60,y:walker.y,angle:0});
 for(let i=0;i<5&&walker.health>0;i++)attack(w,w.player,{name:'Anchor'});
 assert.equal(walker.health,0);assert.match(w.message,/Shadow Walker defeated · \+40 Hunting XP/);
 assert.ok(w.drops.some(d=>d.item.name==='Shadow Ichor'));assert.equal(w.hunting.bySpecies['shadow-walker'],1);
 assert.equal(w.progression.totalXp,40);
});

test('when Eli falls he stays down, then wakes at the area arrival point at full health and is left alone briefly',()=>{
 const {w,walker}=setup();Object.assign(w.player,{x:walker.x-45,y:walker.y});
 w.player.health=5;w.inventory.receive({name:'Shadow Ichor'});const items=w.inventory.allItems.length;
 assert.ok(until(w,()=>!!w.defeat,4));
 assert.equal(w.player.health,0);assert.equal(w.message,'Eli collapses…');
 const fell={x:w.player.x,y:w.player.y};
 run(w,DEFEAT_SECONDS-.2);assert.ok(w.defeat);assert.deepEqual({x:w.player.x,y:w.player.y},fell,'stays down');
 assert.ok(['return','idle','walk'].includes(walker.state),'the walker loses interest');
 run(w,.4);
 const spawn=areaFor('landing').spawn;
 assert.equal(w.defeat,null);assert.deepEqual({x:w.player.x,y:w.player.y},spawn);assert.equal(w.player.health,w.progression.maxHealth);
 assert.equal(w.inventory.allItems.length,items,'keeps what he carried');assert.match(w.message,/wakes up at Reedwater Landing/);
 // Even standing right beside it during the grace period, nothing happens.
 run(w,10);Object.assign(walker,{x:spawn.x+150,y:spawn.y,home:{x:spawn.x+150,y:spawn.y},state:'idle',time:0});w.respawnGrace=RESPAWN_GRACE;w.update(1/30,idle(w));
 assert.ok(['idle','walk'].includes(walker.state));
 run(w,RESPAWN_GRACE);assert.ok(['notice','chase','attack'].includes(walker.state));
});

test('a save made while Eli is down wakes him on load',()=>{
 const {w}=setup();w.player.health=0;w.update(1/30,idle(w));assert.ok(w.defeat);
 const loaded=restoreSave(captureSave(w));assert.equal(loaded.player.health,0);
 for(let i=0;i<DEFEAT_SECONDS*30+10;i++)loaded.update(1/30,idle(loaded));
 assert.equal(loaded.player.health,loaded.progression.maxHealth);
});
