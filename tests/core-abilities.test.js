import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {damage,updateProjectiles} from '../src/combat.js';
import {CORE_ABILITIES,RESERVES_MAX,coreWheel,callCost,nearLivingWater} from '../src/core-abilities.js';
import {applyAction,neutralInput} from '../src/protocol.js';
const fresh=()=>{const w=new World(()=>.1,{adventure:true,story:true});w.story.scene=null;w.areaId='landing';return w;};

test('the wheel holds the two Reedwater powers and two sealed slots, all asleep until the story wakes them',()=>{
 const w=fresh();
 assert.deepEqual(CORE_ABILITIES.map(a=>a.name),['Still Water','Reedwater’s Call','???','???']);
 assert.deepEqual(coreWheel(w).map(r=>r.unlocked),[false,false,false,false]);
 assert.equal(w.useCoreAbility('still-water'),false);assert.match(w.message,/out of reach/);
 assert.equal(w.useCoreAbility('reeds-call'),false);assert.match(w.message,/asleep/);
 assert.equal(w.useCoreAbility('sealed-3'),false);assert.match(w.message,/hasn’t awakened/);
 w.story.coreIngested=true;
 assert.deepEqual(coreWheel(w).map(r=>r.unlocked),[true,false,false,false]);
 w.story.callAwakened=true;
 assert.deepEqual(coreWheel(w).map(r=>r.unlocked),[true,true,false,false]);
});

test('Still Water softens hits, holds Eli steady, then waits out its cooldown',()=>{
 const w=fresh();w.story.coreIngested=true;
 const deer=w.wildlife.find(a=>a.species==='deer');
 const before=w.player.health;damage(w,w.player,20,deer,0,160);const plain=before-w.player.health;
 w.player.health=before;w.player.vx=w.player.vy=0;
 assert.ok(w.useCoreAbility('still-water'));assert.equal(w.core.stillWater,5);
 damage(w,w.player,20,deer,0,160);
 assert.ok(Math.abs((before-w.player.health)-plain*.75)<1e-9);assert.equal(w.player.vx,0);
 assert.equal(w.useCoreAbility('still-water'),false);assert.match(w.message,/needs \d+s more/);
 w.update(6,neutralInput());assert.equal(w.core.stillWater,0);
 for(let i=0;i<13;i++)w.update(1,neutralInput());
 assert.ok(w.useCoreAbility('still-water'));
});

test('Reedwater’s Call spends reserves, costs less by living water and bends toward its target',()=>{
 const w=fresh();w.story.coreIngested=w.story.callAwakened=true;
 const deer=w.wildlife.find(a=>a.species==='deer');
 Object.assign(w.player,{x:deer.x-260,y:deer.y-120,angle:0});
 const cost=callCost(w);assert.equal(cost,nearLivingWater(w)?10:30);
 assert.ok(w.useCoreAbility('reeds-call'));assert.equal(w.core.reserves,RESERVES_MAX-cost);
 const shot=w.projectiles.find(p=>p.kind==='line');assert.equal(shot.homing,deer.id);
 const start=deer.health;for(let i=0;i<40&&!shot.done;i++)updateProjectiles(w,1/30);
 assert.ok(deer.health<start,'the bending line reaches the deer');
 w.core.reserves=5;w.core.cooldowns['reeds-call']=0;
 assert.equal(w.useCoreAbility('reeds-call'),false);assert.match(w.message,/hollow/);
});

test('ability keys reach the core only in the story; matches keep their level-up specials',()=>{
 const w=fresh();w.story.coreIngested=true;
 assert.ok(applyAction(w,w.player.id,'still-water',neutralInput()));
 const match=new World(()=>.1,{botCount:1,countdownSeconds:0});
 assert.equal(applyAction(match,match.player.id,'still-water',neutralInput()),false);
});
