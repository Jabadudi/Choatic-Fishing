import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {SLOTS} from '../src/spawn-tables.js';
import {createCreature} from '../src/spawns.js';
import {attack} from '../src/combat.js';
import {COMBO,STUN,comboDisplay,hitStopDt} from '../src/combo.js';
import {animalPose} from '../src/wildlife-art.js';
const idle=w=>({left:false,right:false,up:false,down:false,held:false,aim:{x:w.player.x+1,y:w.player.y}});
// Reedwater Landing with one shadow walker beside Eli, facing it.
function setup(roll=.2){
 const w=new World(()=>roll,{adventure:true});w.journeyId='combo-test';w.spawns=null;w.rabbits=[];
 const walker=createCreature(SLOTS['landing-east'],'shadow-walker',{id:'walker'});walker.health=walker.maxHealth=10000;w.wildlife=[walker];
 Object.assign(w.player,{x:walker.x-50,y:walker.y,angle:0});return {w,walker};
}
const run=(w,seconds,step=1/60)=>{for(let t=0;t<seconds;t+=step)w.update(step,idle(w));};
const spear={name:'Reed Spear'};

test('three swings in a row chain into a combo whose finisher hits harder and knocks the foe down',()=>{
 const {w,walker}=setup(),hits=[];
 for(let i=0;i<3;i++){const before=walker.health;attack(w,w.player,spear);hits.push(before-walker.health);assert.equal(w.player.comboStep,i+1);run(w,w.player.cooldown+.01);}
 assert.ok(Math.abs(hits[0]-22)<1e-9);assert.ok(Math.abs(hits[1]-22*1.1)<1e-9);assert.ok(Math.abs(hits[2]-22*1.6)<1e-9);
 assert.ok(w.effects.some(e=>e.name==='down')||walker.downRemaining>0);
 // The chain starts over after the finisher.
 attack(w,w.player,spear);assert.equal(w.player.comboStep,1);
});

test('the chain resets when Eli waits too long between swings',()=>{
 const {w}=setup();attack(w,w.player,spear);run(w,w.player.cooldown+COMBO.window+.2);
 attack(w,w.player,spear);assert.equal(w.player.comboStep,1);
});

test('a knocked-down monster cannot swing, takes extra damage, and shows its hurt frame until it gets up',()=>{
 const {w,walker}=setup();
 for(let i=0;i<3;i++){attack(w,w.player,spear);if(i<2)run(w,w.player.cooldown+.01);}
 assert.ok(walker.downRemaining>0);assert.equal(animalPose(walker).state,'hurt');
 const before=walker.health;w.player.comboUntil=-Infinity;attack(w,w.player,spear);
 assert.ok(Math.abs(before-walker.health-22*(1+COMBO.downBonus))<1e-9);
 const health=w.player.health;run(w,.5);assert.equal(w.player.health,health,'no swing lands while it is down');
 run(w,1);assert.equal(walker.downRemaining,0);assert.notEqual(animalPose(walker).state,'hurt');
});

test('bosses are never knocked down',()=>{
 const {w,walker}=setup();walker.boss=true;
 for(let i=0;i<3;i++){attack(w,w.player,spear);run(w,w.player.cooldown+.01);}
 assert.ok(!(walker.downRemaining>0));
});

test('the combo counter climbs with each hit, pays XP every ten, and resets after a pause',()=>{
 const {w}=setup();assert.equal(comboDisplay(w),null);
 const xp=w.progression.totalXp;
 for(let i=0;i<10;i++){w.player.cooldown=0;attack(w,w.player,spear);run(w,.05);}
 assert.equal(w.combo.count,10);assert.equal(comboDisplay(w).count,10);assert.equal(w.combo.best,10);
 assert.equal(w.progression.totalXp-xp,COMBO.milestoneXp,'milestone XP');
 run(w,COMBO.counterSeconds+.2);assert.equal(w.combo.count,0);assert.equal(comboDisplay(w),null);assert.equal(w.combo.best,10);
});

test('a melee hit slows the world for a moment, and a dash cuts a swing short',()=>{
 const {w}=setup();attack(w,w.player,spear);assert.ok(w.hitStop>0);
 const elapsed=w.elapsed;w.update(1/60,idle(w));assert.ok(w.elapsed-elapsed<1/60*.5);
 assert.equal(hitStopDt({hitStop:0},.1),.1);
 run(w,.2);w.player.cooldown=.5;assert.ok(w.dash({right:true}));assert.ok(w.player.cooldown<=.08);
});

test('the arena keeps its flat swings: no combo, no hit-stop',()=>{
 const w=new World(()=>.2);const target=w.bots[0];Object.assign(w.player,{x:target.x-50,y:target.y,angle:0});
 attack(w,w.player,spear);assert.ok(!w.player.comboStep);assert.ok(!(w.hitStop>0));assert.equal(w.combo,undefined);
});

test('Eli starts every story journey with his Iron Sword in hand, and older journeys get it on load',async()=>{
 const {giveStarterSword,STARTER_SWORD}=await import('../src/warrior.js');
 const {captureSave,restoreSave}=await import('../src/save-format.js');
 const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='sword-test';
 const sword=w.inventory.allItems.find(i=>i.name===STARTER_SWORD);assert.ok(sword);
 assert.equal(w.inventory.item,sword,'held ready from the first moment');assert.equal(giveStarterSword(w),false,'only one');
 // A save made before Eli carried a sword.
 w.inventory.removeId(sword.id,Infinity);assert.equal(w.inventory.allItems.length,0);const old=captureSave(w);
 const restored=restoreSave(old);assert.equal(restored.inventory.allItems.filter(i=>i.name===STARTER_SWORD).length,1);
 // A plain exploration world (tests, the arena) has no story and no starting sword.
 assert.equal(new World(()=>.2,{adventure:true}).inventory.allItems.length,0);
});

test('the Iron Sword never breaks and chains the combo',()=>{
 const {w,walker}=setup();
 for(let i=0;i<3;i++){attack(w,w.player,{name:'Iron Sword'});run(w,w.player.cooldown+.01);}
 assert.equal(walker.maxHealth-walker.health,30+30*1.1+30*1.6);
});

test('without a stun a monster keeps attacking while Eli hits it; a stun stops its swing',()=>{
 // Every roll misses the stun: the walker winds up and lands its swing through the whole combo.
 const {w,walker}=setup(.99);w.player.progression.maxHealth;
 const start=w.player.health;
 for(let i=0;i<9;i++){attack(w,w.player,spear);run(w,w.player.cooldown+.01);}
 assert.ok(!(walker.downRemaining>0));assert.ok(w.player.health<start,'the walker hit back during the combo');
 // Every roll stuns: the first hit drops the swing and keeps it from starting another.
 const s=setup(.01);s.walker.state='attack';s.walker.attackRemaining=.3;
 attack(s.w,s.w.player,spear);assert.ok(s.walker.stunRemaining>0);assert.equal(s.walker.attackRemaining,0);assert.notEqual(s.walker.state,'attack');
 assert.ok(s.w.effects.some(e=>e.label==='STUN'));
 const health=s.w.player.health;run(s.w,STUN.seconds*.8);assert.equal(s.w.player.health,health,'no swing while stunned');
});

test('Stun is a stat: base chance, raised by familiars and area sets, capped',()=>{
 const {w}=setup(),p=w.player.progression;assert.equal(p.stun,STUN.base);
 p.familiar={stun:.06};p.collection={health:0,damage:0,stun:.05};assert.ok(Math.abs(p.stun-(STUN.base+.11))<1e-9);
 p.familiar={stun:5};assert.equal(p.stun,STUN.max);
});

// Puts a weapon in Eli's hands from the first hotbar slot.
const hold=(w,name)=>{const inv=w.inventory;inv.receive({name});inv.assignHotbar(inv.allItems.at(-1).id,2);inv.equip(2);};

test('holding the attack button keeps the sword swinging through the whole combo, and letting go stops it',()=>{
 const {w,walker}=setup();
 hold(w,'Iron Sword');
 const held={...idle(w),attackHeld:true,aim:{x:walker.x,y:walker.y}},steps=new Set();
 const start=walker.health;
 for(let t=0;t<3;t+=1/60){w.update(1/60,held);steps.add(w.player.comboStep);}
 assert.ok(walker.health<start,'held swings land');assert.deepEqual([...steps].filter(Boolean).sort(),[1,2,3]);
 const after=walker.health;run(w,2);assert.equal(walker.health,after,'no swing once the button is up');
});

test('holding attack with the bow keeps loosing arrows',()=>{
 const {w}=setup();
 hold(w,'Hunting Bow');
 let shots=0;const held={...idle(w),attackHeld:true};
 for(let t=0;t<2.5;t+=1/60){const before=w.projectiles.length;w.update(1/60,held);if(w.projectiles.length>before)shots++;}
 assert.ok(shots>=3,`expected several arrows, got ${shots}`);
});
