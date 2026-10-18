import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {damage,updateProjectiles} from '../src/combat.js';
import {Progression} from '../src/progression.js';
const input={left:false,right:false,up:false,down:false,aim:{x:900,y:365},held:false};
function equip(actor,name){actor.inventory.receive({name});actor.inventory.equip(2);}

test('melee respects range and facing, consumes uses, and awards kill XP once',()=>{
 const w=new World(()=>0,{botCount:1,countdownSeconds:0}),bot=w.bots[0];bot.x=525;bot.y=365;bot.health=25;
 equip(w.player,'Frying Pan');assert.equal(w.useItem(),true);
 assert.equal(bot.health,0);assert.equal(w.progression.totalXp,90);assert.equal(w.progression.pendingChoices,1);
 assert.equal(w.inventory.item.uses,2);assert.equal(w.useItem(),false);
 assert.equal(damage(w,bot,100,w.player,0),false);assert.equal(w.progression.totalXp,90);
 w.update(1/120,input);assert.equal(w.matchState,'won');
 const miss=new World(()=>0,{botCount:1,countdownSeconds:0});miss.bots[0].x=430;miss.bots[0].y=365;equip(miss.player,'Swordfish');miss.useItem();assert.equal(miss.bots[0].health,100);
});

test('harpoon damage happens on projectile impact and owner is excluded',()=>{
 const w=new World(()=>0,{botCount:1,countdownSeconds:0}),bot=w.bots[0];bot.x=580;bot.y=365;equip(w.player,'Harpoon Gun');w.useItem();
 assert.equal(bot.health,100);
 for(let i=0;i<40;i++)updateProjectiles(w,1/120);
 assert.equal(bot.health,64);assert.equal(w.player.health,100);assert.equal(w.projectiles.length,0);
});

test('bomb explodes at its travel endpoint and damages nearby opponents',()=>{
 const w=new World(()=>0,{botCount:1,countdownSeconds:0}),bot=w.bots[0];bot.x=645;bot.y=365;equip(w.player,'Pufferfish Bomb');w.useItem();
 for(let i=0;i<100;i++)updateProjectiles(w,1/120);
 assert.equal(bot.health,52);assert.equal(w.inventory.item,null);
});

test('sardine heals up to max health and passive buffs affect health, damage and armor',()=>{
 const w=new World(()=>0,{botCount:1,countdownSeconds:0}),bot=w.bots[0];w.player.health=80;equip(w.player,'Sardine');w.useItem();assert.equal(w.player.health,100);
 w.progression.grantCatchBuff(()=>.3);bot.progression.grantCatchBuff(()=>.9);
 damage(w,bot,20,w.player,0);assert.ok(Math.abs(bot.health-(100-20*1.08*.95))<1e-8);
 const p=new Progression();for(const value of [0,.3,.6,.9])p.grantCatchBuff(()=>value);
 assert.deepEqual(p.ranks,{speed:1,power:1,vitality:1,armor:1});assert.equal(p.maxHealth,110);
});

test('level rewards are special attacks only, consume one charge, and require abandoning fishing',()=>{
 const w=new World(()=>0,{botCount:1,countdownSeconds:0});w.progression.award(225);
 assert.equal(w.progression.choose('speed'),false);assert.ok(w.progression.choose('tidal'));assert.ok(w.progression.choose('whirlpool'));
 w.player.x=180;w.cast({x:0,y:365});assert.equal(w.useSpecial('tidal'),false);assert.equal(w.progression.specials.tidal,1);
 w.cancel();assert.equal(w.useSpecial('tidal'),true);assert.equal(w.progression.specials.tidal,0);assert.equal(w.useSpecial('tidal'),false);
 w.player.cooldown=0;w.bots[0].x=200;w.bots[0].y=365;assert.equal(w.useSpecial('whirlpool'),true);assert.equal(w.bots[0].health,55);assert.equal(w.progression.specials.whirlpool,0);
});

test('damage while fishing never changes catch physics; death ends the match',()=>{
 const w=new World(()=>0,{botCount:1,countdownSeconds:0});w.player.x=180;w.cast({x:0,y:365});w.fishing.update(2,false);
 const before=[w.fishing.bar,w.fishing.velocity,w.fishing.target,w.fishing.progress];damage(w,w.player,20,w.bots[0],0,120);
 assert.deepEqual([w.fishing.bar,w.fishing.velocity,w.fishing.target,w.fishing.progress],before);assert.equal(w.fishing.state,'reeling');assert.equal(w.player.health,80);
 damage(w,w.player,200,w.bots[0],0);w.update(1/120,input);assert.equal(w.matchState,'lost');assert.equal(w.bobber,null);assert.equal(w.useItem(),false);
 const fresh=new World();assert.equal(fresh.player.health,100);assert.equal(fresh.progression.level,1);assert.equal(fresh.bots.length,1);assert.equal(fresh.matchState,'countdown');
});

test('bots obtain equipment through fishing, gain buffs and attack without requiring player fishing',()=>{
 const w=new World(()=>0,{botCount:1,countdownSeconds:0});let sawGear=false,sawBuff=false;
 for(let i=0;i<120*70&&w.matchState==='playing';i++){
  w.update(1/120,input);sawGear ||=!!w.bots[0].inventory.item;sawBuff ||=w.bots[0].progression.ranks.speed>0;
 }
 assert.ok(sawGear);assert.ok(sawBuff);assert.ok(w.player.health<100);assert.equal(w.catches.length,0);
});

