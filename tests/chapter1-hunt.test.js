import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {storyPrompt,storyObjective,restoreStory} from '../src/story.js';
import {damageAnimal,updateWildlife} from '../src/wildlife.js';
import {rollLoot} from '../src/loot.js';
import {Progression} from '../src/progression.js';
import {skillXpToNext} from '../src/skills.js';
import {walkable} from '../src/wilds.js';
const fresh=()=>{const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='hunt-test';return w;};
const finish=w=>{const name=w.story.scene;while(w.story.scene===name)w.advanceStory();};
const go=(w,area,x,y)=>{w.areaId=area;Object.assign(w.player,{x,y});};
function toSupper(w){
 finish(w);go(w,'cabin',520,150);w.inspect();finish(w);go(w,'cabin',110,270);w.inspect();finish(w);assert.equal(w.story.stage,'fish');
}
const catchFish=w=>{w.fishing.state='caught';w.fishing.result={name:'Sardine'};w.advanceFishing(w.player,0,false);};
const count=(w,name)=>w.inventory.allItems.filter(i=>i.name===name).length;
const deer=w=>w.wildlife.filter(a=>a.id.startsWith('deer-meadow'));
const hunt=(w,a)=>{w.areaId=a.areaId;while(a.health>0)damageAnimal(w,a,25,w.player,0);};

test('the weapon rack gives the rod first, and the bow only once two Sardines are in the backpack',()=>{
 const w=fresh();toSupper(w);
 assert.match(storyObjective(w),/Take Grandpa’s fishing rod/);
 go(w,'landing',1250,1850);assert.equal(w.cast({x:1250,y:2000}),false);assert.match(w.message,/weapon rack/);
 go(w,'cabin',320,96);assert.ok(walkable(320,96,'cabin'));assert.equal(walkable(320,50,'cabin'),false);
 assert.equal(storyPrompt(w),'Take Grandpa’s fishing rod');w.inspect();assert.equal(w.story.scene,'rack-rod');finish(w);
 assert.equal(w.story.rod,true);assert.match(storyObjective(w),/Fish 2 Sardines from the dock \(0\/2\)/);
 assert.equal(storyPrompt(w),'Examine the weapon rack');w.inspect();assert.match(w.message,/two Sardines/);
 catchFish(w);assert.match(storyObjective(w),/\(1\/2\)/);catchFish(w);
 assert.match(storyObjective(w),/Take the hunting bow/);assert.equal(storyPrompt(w),'Take the hunting bow');w.inspect();finish(w);
 const bow=w.inventory.allItems.find(i=>i.name==='Hunting Bow');assert.ok(bow);assert.equal(w.inventory.slots[0],bow);assert.equal(w.inventory.selected,2);
 assert.match(storyObjective(w),/collect 3 Deer Meat \(0\/3\)/);
 // The bow is never used up.
 go(w,'landing',1250,1650);for(let i=0;i<5;i++){w.player.cooldown=0;assert.ok(w.useItem());}assert.equal(count(w,'Hunting Bow'),1);
});

test('three deer roam Reedwater Landing in Chapter 1, and each kill drops guaranteed meat from its loot table',()=>{
 const w=fresh();finish(w);assert.ok(deer(w).length>=3);
 for(const a of deer(w)){
  damageAnimal(w,a,25,w.player,0);assert.equal(w.progression.skills.hunting.xp,0,'injuring an animal teaches nothing');
 }
 for(const a of deer(w))hunt(w,a);
 assert.equal(w.hunting.bySpecies.deer,3);
 const meat=w.drops.filter(d=>d.item.name==='Deer Meat');assert.equal(meat.length,3);
 for(const d of w.drops){assert.equal(d.areaId,'landing');assert.ok(walkable(d.x,d.y,'landing'));}
 assert.equal(w.progression.totalXp,75);
 // Pick the meat up like any dropped item.
 for(const d of meat){go(w,'landing',d.x,d.y+10);while(w.drops.some(x=>x.id===d.id))assert.ok(w.inspect());}
 assert.equal(count(w,'Deer Meat'),3);
});

test('loot tables roll each extra drop on its own, and luck only improves the uncertain ones',()=>{
 assert.deepEqual(rollLoot('deer',()=>.99).map(i=>i.name),['Deer Meat']);
 assert.deepEqual(rollLoot('deer',()=>0).map(i=>i.name),['Deer Meat','Deer Hide','Deer Antlers']);
 assert.deepEqual(rollLoot('deer',()=>.21).map(i=>i.name),['Deer Meat','Deer Hide']);
 assert.deepEqual(rollLoot('deer',()=>.21,1.1).map(i=>i.name),['Deer Meat','Deer Hide','Deer Antlers']);
 assert.deepEqual(rollLoot('rabbit',()=>0),[]);
});

test('skill XP comes only from success, and every skill point also feeds the main level',()=>{
 const w=fresh();toSupper(w);
 w.fishing.state='escaped';w.advanceFishing(w.player,0,false);assert.equal(w.progression.totalXp,0);assert.equal(w.progression.skills.fishing.xp,0);
 catchFish(w);assert.equal(w.progression.skills.fishing.xp,30);assert.equal(w.progression.totalXp,30);
 const p=w.progression,before={...p.stats},health=p.maxHealth;
 catchFish(w);catchFish(w);
 assert.equal(p.skills.fishing.level,2);assert.equal(p.level,2);
 assert.deepEqual(p.stats,{strength:before.strength+1,dexterity:before.dexterity+1,luck:before.luck+1,wisdom:before.wisdom+1});
 assert.equal(p.maxHealth,health+10);assert.ok(p.damageMultiplier>1);assert.ok(p.lootMultiplier>1);
 // Wisdom grows skill XP.
 assert.ok(p.train('hunting',100).amount>100);
 assert.equal(p.train('swimming',10),null);assert.equal(p.train('hunting',-5),null);
});

test('arena matches keep their flat balance while exploration levels raise attributes',()=>{
 const arena=new Progression();arena.award(500);assert.equal(arena.maxHealth,100);assert.equal(arena.damageMultiplier,1);
 const w=new World(()=>.2,{botCount:0,countdownSeconds:0});assert.equal(w.progression.characterStats,false);
 assert.equal(fresh().progression.characterStats,true);
 const p=fresh().progression;p.train('cooking',skillXpToNext(1));assert.equal(p.skills.cooking.level,2);
});

test('hunted deer return after a while so the hunting skill can keep growing',()=>{
 const w=fresh(),a=deer(w)[0];hunt(w,a);assert.equal(a.health,0);
 w.areaId='windchime';updateWildlife(w,30);assert.equal(a.health,0);updateWildlife(w,60);
 assert.equal(a.health,a.maxHealth);assert.deepEqual({x:a.x,y:a.y},a.home);
 hunt(w,a);assert.equal(w.hunting.bySpecies.deer,2);
});

test('supper needs two Sardines and three Deer Meat, then cooking trains its own skill',()=>{
 const w=fresh();toSupper(w);go(w,'cabin',100,120);
 for(let i=0;i<2;i++)w.inventory.receive({name:'Sardine'});w.inventory.receive({name:'Deer Meat'});
 w.inspect();assert.match(w.message,/Still needed: 2 Deer Meat/);assert.equal(w.story.scene,null);
 for(let i=0;i<2;i++)w.inventory.receive({name:'Deer Meat'});w.inventory.receive({name:'Deer Hide'});
 w.inspect();assert.equal(w.story.scene,'dinner');assert.deepEqual(w.inventory.allItems.map(i=>i.name),['Deer Hide']);
 assert.equal(w.progression.skills.cooking.level,2);finish(w);assert.equal(w.story.stage,'rest');
});

test('rack tools, skills and respawn timers survive a save, and older saves keep working',()=>{
 const w=fresh();toSupper(w);go(w,'cabin',320,96);w.inspect();finish(w);catchFish(w);
 const a=deer(w)[0];hunt(w,a);updateWildlife(w,0);
 const restored=restoreSave(captureSave(w));
 assert.equal(restored.story.rod,true);assert.equal(restored.story.bow,false);
 assert.deepEqual(restored.progression.skills,w.progression.skills);assert.equal(restored.progression.characterStats,true);
 assert.equal(restored.wildlife.find(x=>x.id===a.id).health,0);
 const old=captureSave(w);delete old.state.progression.skills;delete old.state.story.rod;delete old.state.story.bow;
 const migrated=restoreSave(old);assert.equal(migrated.story.rod,false);assert.equal(migrated.progression.skills.fishing.level,1);
 assert.equal(restoreStory({...w.story,stage:'rest',rod:undefined,bow:undefined}).bow,true);
 const bad=captureSave(w);bad.state.progression.skills.fishing={level:1,xp:9999};assert.throws(()=>restoreSave(bad),/skill/);
});
