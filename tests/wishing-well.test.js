import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {copiesOf} from '../src/artifacts.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {explorationHud} from '../src/hud.js';
import {PITY,SHARD_COUNTS,STONE_PRICE,STARTING_STONES,buyWishstone,drawWell,familiarPool,findWishstone,poolRates,rollWell,updateWell,wellUnlocked} from '../src/wishing-well.js';
const fresh=(story=false)=>{const w=new World(()=>.5,{adventure:true,story});w.journeyId='well-journey';return w;};
const awake=(stones=0)=>{const w=fresh();updateWell(w);w.well.stones=stones;return w;};
const sequence=values=>{let i=0;return ()=>values[i++%values.length];};
const copy=value=>JSON.parse(JSON.stringify(value));

test('the well is open from the start of every journey, story or not, with 38 Wishstones',()=>{
 for(const story of [true,false]){
  const w=fresh(story);assert.equal(STARTING_STONES,38);assert.equal(wellUnlocked(w),true);
  updateWell(w);assert.equal(w.well.awake,true);assert.equal(w.well.stones,STARTING_STONES);assert.match(w.message,/38 Wishstones wait at its rim/);
  updateWell(w);assert.equal(w.well.stones,STARTING_STONES,'the starting stones are given once');
 }
 // A journey saved before the well opened gets the starting stones, but not back pay for what it already did.
 const old=fresh(true);old.story.stage='ch4-complete';old.discovered.add('village-commons');old.hunting.shiny.hunted.deer=2;
 updateWell(old);assert.equal(old.well.stones,STARTING_STONES);
});

test('Eli earns Wishstones for new places, side missions and shiny hunts, each paid once',()=>{
 const w=awake();w.message='Found the gardens.';
 w.discovered.add('village-gardens');updateWell(w);
 assert.equal(w.well.stones,1);assert.equal(w.message,'Found the gardens. · +1 Wishstone');
 w.quests['gardener-rabbits']={...w.quests['gardener-rabbits'],status:'complete'};w.hunting.shiny.hunted.rabbit=1;updateWell(w);
 assert.equal(w.well.stones,6);assert.equal(w.message,'Found the gardens. · +5 Wishstones','a fresh payout replaces the last one');
 updateWell(w);assert.equal(w.well.stones,6);
 assert.equal(findWishstone(w,()=>.001),1);assert.equal(w.well.stones,7);assert.equal(findWishstone(w,()=>.5),0);
 assert.equal(findWishstone(fresh(true),()=>0),0,'no stones on the hook before the well wakes');
});

test('draws roll 55 / 28 / 12 / 4 / 1, with a Rare by every 10th draw and a Legendary by draw 70',()=>{
 const roll=(values,pity={rare:0,legendary:0})=>rollWell(pity,sequence(values));
 assert.deepEqual([[.5,.005],[.5,.03],[.5,.1],[.5,.3],[.5,.6],[.005]].map(v=>roll(v)),['epic','epic','rare','uncommon','common','legendary']);
 const pity={rare:PITY.rare-1,legendary:0};assert.equal(roll([.5,.9],pity),'rare');assert.deepEqual(pity,{rare:0,legendary:1});
 assert.equal(roll([.5,.1],{rare:PITY.rare-1,legendary:0}),'epic');
 assert.equal(roll([.99],{rare:0,legendary:PITY.legendary-1}),'legendary');
 // Draw 60 has a 61% chance at Legendary.
 assert.equal(roll([.6],{rare:0,legendary:59}),'legendary');assert.notEqual(roll([.62,.9],{rare:0,legendary:59}),'legendary');
 let seed=7;const random=()=>(seed=(seed*16807)%2147483647)/2147483647;
 const state={rare:0,legendary:0},counts={common:0,uncommon:0,rare:0,epic:0,legendary:0};let drought=0,longest=0;
 for(let i=0;i<100000;i++){const r=rollWell(state,random);counts[r]++;drought=['rare','epic','legendary'].includes(r)?0:drought+1;longest=Math.max(longest,drought);}
 assert.ok(longest<PITY.rare,'never ten draws without a Rare');
 assert.ok(counts.legendary/1e5>.02&&counts.legendary/1e5<.03,`about one Legendary in 42 draws, got ${counts.legendary}`);
});

test('the Artifact pool spends stones and puts artifacts in the backpack; a second Legendary returns as stones',()=>{
 const w=awake(12);
 const result=drawWell(w,'artifacts',10,sequence([.5,.5,0]));
 assert.equal(result.ok,true);assert.equal(result.results.length,10);assert.equal(w.well.stones,2);
 assert.ok(result.results.some(r=>['rare','epic','legendary'].includes(r.rarity)),'a ten-draw always holds a Rare');
 assert.equal(w.inventory.allItems.filter(i=>i.category==='artifacts').reduce((n,i)=>n+(i.count||1),0),10);
 assert.equal(drawWell(w,'artifacts',10).ok,false);assert.match(w.message,/takes 10 Wishstones. You have 2/);
 const lucky=awake(2);drawWell(lucky,'artifacts',1,sequence([0,0]));
 assert.equal(copiesOf(lucky.inventory,'lodestone:legendary'),1);
 const again=drawWell(lucky,'artifacts',1,sequence([0,0]));
 assert.equal(again.results[0].refund,5);assert.equal(copiesOf(lucky.inventory,'lodestone:legendary'),1);assert.equal(lucky.well.stones,5);
});

test('every familiar is in the Familiar pool before Eli has met it',()=>{
 const w=awake(10);
 assert.deepEqual(familiarPool(w),['rabbit','fox','deer','boar','elk','bear','heron','turtle','eel','shadow-walker','moonfang','rimejaw','flitlynx']);
 assert.ok(poolRates(w,'familiars').prizes.every(p=>p.inPool&&p.why===null));
 assert.equal(w.codex.has('rimejaw'),false);
 // Rimejaw is the twelfth of thirteen, so a roll of .9 picks it.
 const rare=drawWell(w,'familiars',1,sequence([.5,.1,.9]));
 assert.equal(rare.results[0].familiar,'rimejaw');assert.equal(w.familiars.shards.rimejaw,SHARD_COUNTS.rare);assert.match(w.message,/Rimejaw Familiar Shard ×5/);
 assert.equal(w.codex.has('rimejaw'),true,'shards for an unmet creature open its index entry');
 assert.equal(w.familiarAction('rimejaw','combine'),true);
});

test('the Familiar pool drops a creature once it has every shard it can use',()=>{
 const w=awake(10);
 const rare=drawWell(w,'familiars',1,sequence([.5,.1,.2]));
 assert.equal(rare.results[0].count,SHARD_COUNTS.rare);assert.equal(w.familiars.shards.deer,5);assert.match(w.message,/Deer Familiar Shard ×5 \(Rare\)/);
 w.familiars.shards.deer=99;
 drawWell(w,'familiars',1,sequence([.5,.5,.2]));assert.equal(w.familiars.shards.deer,100);
 assert.ok(!familiarPool(w).includes('deer'),'a creature with 100 shards leaves the pool');
 assert.match(poolRates(w,'familiars').prizes.find(p=>p.id==='deer').why,/Full/);
 for(const id of familiarPool(w))w.familiars.shards[id]=100;const before=w.well.stones;
 assert.equal(drawWell(w,'familiars',1).ok,false);assert.equal(w.well.stones,before);
});

test('pools keep their own pity, and stones can be bought for marks',()=>{
 const w=awake(3);
 drawWell(w,'artifacts',2,sequence([.5,.9]));drawWell(w,'familiars',1,sequence([.5,.9,0]));
 assert.deepEqual(w.well.pity,{artifacts:{rare:2,legendary:2},familiars:{rare:1,legendary:1}});
 w.inventory.marks=STONE_PRICE-1;assert.equal(buyWishstone(w),false);
 w.inventory.marks=STONE_PRICE+5;assert.equal(buyWishstone(w),true);assert.equal(w.inventory.marks,5);assert.equal(w.well.stones,1);
});

test('Eli opens the well from the commons once it is awake',()=>{
 const w=fresh();w.areaId='village';Object.assign(w.player,{x:1300,y:750});
 assert.equal(explorationHud(w,20).prompt,'Examine The Willow Commons');
 updateWell(w);
 assert.equal(explorationHud(w,20).prompt,'Look into the Wishing Well');
 assert.equal(w.inspect(),true);assert.equal(w.wellRequest,true);
});

test('the well survives a save, older saves start it asleep, and bad well data is rejected',()=>{
 const w=awake(17);w.well.pity.familiars={rare:4,legendary:33};
 const saved=captureSave(w),restored=restoreSave(copy(saved));
 assert.deepEqual(restored.well,w.well);
 const old=copy(saved);delete old.state.well;
 assert.deepEqual(restoreSave(old).well,{awake:false,stones:0,credited:0,pity:{artifacts:{rare:0,legendary:0},familiars:{rare:0,legendary:0}}});
 for(const change of [s=>s.well.stones=-1,s=>s.well.awake='yes',s=>s.well.pity.artifacts.rare=PITY.rare,s=>s.well.pity.familiars=null,s=>s.well.credited=1.5]){
  const bad=copy(saved);change(bad.state);assert.throws(()=>restoreSave(bad),/wishing well/i);
 }
});

test('the details page lists every prize with odds that add up to the rarity odds',()=>{
 const w=fresh(),artifacts=poolRates(w,'artifacts');
 assert.deepEqual(artifacts.rarities.map(r=>Math.round(r.chance*100)),[55,28,12,4,1]);
 assert.equal(artifacts.prizes.length,5);assert.ok(artifacts.prizes.every(p=>p.inPool));
 for(const {rarity,chance} of artifacts.rarities)assert.ok(Math.abs(artifacts.prizes.reduce((sum,p)=>sum+p.chances[rarity],0)-chance)<1e-12);
 assert.ok(Math.abs(artifacts.prizes[0].chances.legendary-.002)<1e-12,'one artifact at Legendary is 0.2%');
 // Familiars: every creature that still needs shards; a full one says why it is missing.
 const familiars=poolRates(w,'familiars'),open=familiarPool(w);
 assert.deepEqual(familiars.rarities.map(r=>r.shards),Object.values(SHARD_COUNTS));
 assert.equal(familiars.prizes.filter(p=>p.inPool).length,open.length);
 for(const p of familiars.prizes)if(!p.inPool){assert.match(p.why,/Full/);assert.equal(p.chances.common,0);}
});
