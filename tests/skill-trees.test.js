import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {damageAnimal} from '../src/wildlife.js';
import {damage,attack} from '../src/combat.js';
import {Progression} from '../src/progression.js';
import {Fishing} from '../src/fishing.js';
import {skillXpToNext,SKILL_IDS} from '../src/skills.js';
import {SKILL_TREES,treePassives,validTree} from '../src/skill-trees.js';
import {sumPassives,PASSIVES} from '../src/passives.js';
const fresh=(random=()=>.2)=>{const w=new World(random,{adventure:true,story:true});w.journeyId='tree-test';w.areaId='landing';return w;};
const levelTo=(p,id,level)=>{while(p.skills[id].level<level)p.train(id,skillXpToNext(p.skills[id].level));};
const learnAll=(p,id,talent,times)=>{for(let i=0;i<times;i++)assert.ok(p.learn(id,talent),`${talent} rank ${i+1}`);};

test('every tree is well formed: known passives, real requirements listed before the talents that need them',()=>{
 for(const id of SKILL_IDS){
  const seen=new Set();assert.ok(SKILL_TREES[id].length>=4,id);
  for(const t of SKILL_TREES[id]){
   assert.ok(t.maxRank>=1&&t.description&&t.name);for(const need of t.requires)assert.ok(seen.has(need),`${t.id} needs ${need}`);
   for(const key of Object.keys(t.effects))assert.ok(Object.hasOwn(PASSIVES,key),key);seen.add(t.id);
  }
 }
});

test('each skill level earns one point that only that skill’s tree can spend',()=>{
 const p=new Progression();
 for(const id of SKILL_IDS)assert.equal(p.skillPoints(id),0);
 assert.equal(p.learn('fishing','patient-line'),false,'no points at level 1');
 levelTo(p,'fishing',3);
 assert.equal(p.skillPoints('fishing'),2);assert.equal(p.skillPoints('hunting'),0);assert.equal(p.skillPoints('cooking'),0);
 assert.equal(p.learn('hunting','sharp-aim'),false,'fishing points never reach the hunting tree');
 assert.equal(p.learn('fishing','sharp-aim'),false,'talents belong to their own tree');
 assert.equal(p.learn('fishing','river-sense'),false,'requirements gate deeper talents');
 assert.equal(p.learn('fishing','patient-line').name,'Patient Line');
 assert.equal(p.learn('fishing','river-sense').name,'River Sense');
 assert.equal(p.skillPoints('fishing'),0);assert.equal(p.learn('fishing','patient-line'),false);
 assert.deepEqual(p.skillTrees.fishing,{'patient-line':1,'river-sense':1});
});

test('ranks stop at the maximum and the capstone needs both branches',()=>{
 const p=new Progression();levelTo(p,'hunting',12);
 learnAll(p,'hunting','sharp-aim',3);assert.equal(p.learn('hunting','sharp-aim'),false);
 learnAll(p,'hunting','tracker',1);assert.equal(p.learn('hunting','apex-hunter'),false);
 learnAll(p,'hunting','thick-skin',1);learnAll(p,'hunting','field-dressing',1);learnAll(p,'hunting','apex-hunter',1);
 assert.equal(p.learn('hunting','apex-hunter'),false);
 assert.ok(Math.abs(p.passive('hunting.damage')-.28)<1e-9);assert.equal(p.passive('skillXp.hunting'),.2);
});

test('passive sources add up by key and reductions are capped',()=>{
 assert.deepEqual(sumPassives([{'health.max':5},{'health.max':10,'food.heal':.2},null]),{'health.max':15,'food.heal':.2});
 assert.equal(sumPassives([{'hunting.hide':.5},{'hunting.hide':.5}])['hunting.hide'],.6);
 assert.deepEqual(sumPassives([{'not.a.passive':4}]),{});
 assert.deepEqual(treePassives({cooking:{'iron-stomach':2,'well-fed':1}}),{'health.max':20,'food.heal':.25});
});

test('fishing talents shorten the wait, speed the meter, slow the drain and can land a second fish',()=>{
 const w=fresh(()=>0);w.story=null;const p=w.progression;levelTo(p,'fishing',12);
 w.areaId='landing';Object.assign(w.player,{x:1855,y:1050});w.inventory.selected=1;
 assert.ok(w.cast({x:2020,y:1050}));const base=w.fishing.wait;w.cancel();
 learnAll(p,'fishing','patient-line',3);assert.ok(w.cast({x:2020,y:1050}));assert.ok(Math.abs(w.fishing.wait-base*.7)<1e-9);w.cancel();
 const meter=perks=>{const f=new Fishing(()=>.5);f.cast();f.update(10,false);f.update(1.5,false,perks);return f.progress;};
 assert.ok(meter({slack:.4})>meter({}),'slack slows the drain');
 const held=perks=>{const f=new Fishing(()=>.5);f.cast();f.update(10,false);f.bar=.4;f.update(.1,false,perks);return f.progress;};
 assert.ok(held({reel:.24})>held({}),'reel speeds the meter');
 learnAll(p,'fishing','strong-reel',1);learnAll(p,'fishing','river-sense',1);learnAll(p,'fishing','slack-line',1);learnAll(p,'fishing','lucky-haul',1);
 const before=w.inventory.countOf('Sardine');w.fishing.state='caught';w.fishing.result={name:'Sardine'};w.advanceFishing(w.player,0,false);
 assert.equal(w.inventory.countOf('Sardine'),before+2);assert.match(w.message,/Two Sardines caught/);
});

test('hunting talents hit harder, take less from animals, heal on a kill and improve drops',()=>{
 const w=fresh();const p=w.progression;levelTo(p,'hunting',9);w.areaId='landing';
 const deer=w.wildlife.find(a=>a.id==='deer-meadow');
 damageAnimal(w,deer,10,w.player,0);const plain=deer.maxHealth-deer.health;deer.health=deer.maxHealth;
 learnAll(p,'hunting','sharp-aim',3);damageAnimal(w,deer,10,w.player,0);assert.ok(Math.abs((deer.maxHealth-deer.health)-plain*1.18)<1e-9);
 w.player.health=50;damage(w,w.player,20,deer,0);const hurt=50-w.player.health;
 learnAll(p,'hunting','thick-skin',2);w.player.health=50;damage(w,w.player,20,deer,0);assert.ok(Math.abs((50-w.player.health)-hurt*.84)<1e-9);
 learnAll(p,'hunting','field-dressing',2);w.player.health=40;while(deer.health>0)damageAnimal(w,deer,25,w.player,0);assert.equal(w.player.health,56);
 learnAll(p,'hunting','tracker',1);assert.ok(Math.abs(p.passive('hunting.loot')-.15)<1e-9);
});

test('cooking talents raise max health, regeneration and what food restores',()=>{
 const w=fresh();w.story=null;const p=w.progression;levelTo(p,'cooking',6);const max=p.maxHealth;
 learnAll(p,'cooking','iron-stomach',2);assert.equal(p.maxHealth,max+10);
 learnAll(p,'cooking','hearty-portions',2);w.player.health=20;attack(w,w.player,{name:'Sardine'});assert.ok(Math.abs(w.player.health-(20+35*1.3))<1e-9);
 learnAll(p,'cooking','fireside-warmth',1);w.player.health=20;w.update(.5,{left:false,right:false,up:false,down:false,held:false,aim:{x:0,y:0}});
 assert.ok(Math.abs(w.player.health-(20+.5*1.25))<1e-6);
});

test('learned talents survive a save, older saves keep every point and overspent trees are rejected',()=>{
 const w=fresh();levelTo(w.progression,'cooking',4);learnAll(w.progression,'cooking','iron-stomach',2);w.player.health=w.progression.maxHealth;
 const restored=restoreSave(captureSave(w));
 assert.deepEqual(restored.progression.skillTrees,w.progression.skillTrees);assert.equal(restored.progression.skillPoints('cooking'),1);assert.equal(restored.progression.maxHealth,w.progression.maxHealth);
 const old=captureSave(w);delete old.state.progression.skillTrees;old.state.player.health=50;
 assert.equal(restoreSave(old).progression.skillPoints('cooking'),3);
 const over=captureSave(w);over.state.progression.skillTrees.cooking={'iron-stomach':3,'hearty-portions':1};assert.throws(()=>restoreSave(over),/skill tree/);
 const skip=captureSave(w);skip.state.progression.skillTrees.cooking={'well-fed':1};assert.throws(()=>restoreSave(skip),/skill tree/);
 assert.equal(validTree('cooking',{'iron-stomach':4},20),false);assert.equal(validTree('cooking',{'nope':1},20),false);
});
