// The Wishing Well on Willow Commons. It is open from the start of every journey, and each Wishstone Eli drops in
// draws from one of two pools: artifacts at a random rarity, or familiar shards for a creature in his index.
// Gameplay only. The window is drawn by well-ui.js.
import {STORY_STAGES} from './story.js';
import {RARITIES,RARITY_NAMES,ARTIFACT_IDS,ARTIFACTS,artifactItem,copiesOf,itemLabel,withArticle} from './artifacts.js';
import {FAMILIARS,absorbShard} from './familiars.js';
import {codexRevealed,revealedCount} from './codex-discovery.js';
import {marksOf,marksLabel} from './trade.js';
import {VILLAGE_PROPS} from './village.js';
export const WELL_POOLS=Object.freeze(['artifacts','familiars']);
export const POOL_NAMES=Object.freeze({artifacts:'Artifact pool',familiars:'Familiar pool'});
// Chance of each rarity on a draw, before pity. Common takes whatever is left (55%).
export const WELL_ODDS=Object.freeze({uncommon:.28,rare:.12,epic:.04,legendary:.01});
// How many shards one familiar draw brings up at each rarity.
export const SHARD_COUNTS=Object.freeze({common:1,uncommon:2,rare:5,epic:10,legendary:25});
// Every 10th draw without a Rare or better is one. After 50 draws without a Legendary its chance climbs 6% a draw, and draw 70 is certain.
export const PITY=Object.freeze({rare:10,softLegendary:50,legendaryStep:.06,legendary:70});
export const MAX_DRAWS=10,STONE_PRICE=40,LEGENDARY_REFUND=5,STONES_LIMIT=1e6;
// Every journey starts with this many Wishstones at the well.
export const STARTING_STONES=38;
// A creature whose familiar has this many shards has nothing left to gain and leaves the Familiar pool.
export const SHARD_CAP=100;
// What Eli earns on top of the starting stones. Each is counted from world state, so nothing is missed and nothing pays twice.
export const EARNINGS=Object.freeze({chapter:5,shiny:3,sideQuest:2,discovery:1});
export const FOUND_STONE_CHANCE=1/150;
// The stage that closes each chapter.
const CHAPTER_ENDS=['complete','ch2-complete','ch3-complete','ch4-complete','ch5-morning'];
const WELL=VILLAGE_PROPS.find(p=>p.kind==='well');
export const wishstonesLabel=n=>`${n} ${n===1?'Wishstone':'Wishstones'}`;
const freshPity=()=>({rare:0,legendary:0});
export const createWell=()=>({awake:false,stones:0,credited:0,pity:{artifacts:freshPity(),familiars:freshPity()}});
const stageIndex=story=>STORY_STAGES.indexOf(story.stage);
// The well stands apart from the story: it is open on every journey from the first step.
export const wellUnlocked=world=>!!world.adventure;
export const nearWell=world=>!!world.well?.awake&&world.areaId==='village'&&Math.hypot(world.player.x-WELL.x,world.player.y-WELL.y)<75;
export function wellLedger(world){
 const chapters=world.story?CHAPTER_ENDS.filter(stage=>stageIndex(world.story)>=STORY_STAGES.indexOf(stage)).length:0;
 const shinies=Object.values(world.hunting?.shiny?.hunted||{}).reduce((a,b)=>a+b,0);
 const quests=Object.values(world.quests||{}).filter(q=>q?.status==='complete').length;
 return STARTING_STONES+EARNINGS.chapter*chapters+EARNINGS.shiny*shinies+EARNINGS.sideQuest*quests+EARNINGS.discovery*(world.discovered?.size||0)+EARNINGS.discovery*revealedCount(world);
}
const addStones=(well,n)=>{well.stones=Math.min(STONES_LIMIT,well.stones+n);};
// Wakes the well with the starting stones, then pays out whatever Eli has earned since the last check.
// A saved journey that reached the well later is not paid again for progress made before it woke.
export function updateWell(world){
 const well=world.well;if(!well||!wellUnlocked(world))return;
 const ledger=wellLedger(world),woke=!well.awake;
 if(woke){
  well.awake=true;well.credited=ledger-STARTING_STONES;
  world.message=`${world.message?`${world.message} · `:''}The old well on Willow Commons glows a soft blue. ${wishstonesLabel(STARTING_STONES)} wait at its rim.`;
 }
 const earned=ledger-well.credited;if(earned<=0)return;
 well.credited=ledger;addStones(well,earned);
 // Earnings ride on the current message; a fresh payout replaces the last one instead of piling up.
 if(!woke){const base=(world.message||'').replace(/( · )?\+\d+ Wishstones?$/,'');world.message=`${base?`${base} · `:''}+${wishstonesLabel(earned)}`;}
}
// Sometimes a Wishstone comes up on the hook instead of weed.
export function findWishstone(world,random){
 if(!world.well?.awake||random()>=FOUND_STONE_CHANCE)return 0;
 addStones(world.well,1);return 1;
}
// Pity first, then the plain odds. The pool's counters move with every draw.
export function rollWell(pity,random){
 const next=pity.legendary+1;
 const legendary=next>=PITY.legendary?1:next>PITY.softLegendary?WELL_ODDS.legendary+(next-PITY.softLegendary)*PITY.legendaryStep:WELL_ODDS.legendary;
 let rarity='common';
 if(random()<legendary)rarity='legendary';
 else if(pity.rare+1>=PITY.rare)rarity=random()<WELL_ODDS.epic/(WELL_ODDS.epic+WELL_ODDS.rare)?'epic':'rare';
 else{const roll=random();let above=0;for(const r of ['epic','rare','uncommon']){above+=WELL_ODDS[r];if(roll<above){rarity=r;break;}}}
 pity.legendary=rarity==='legendary'?0:next;
 pity.rare=RARITIES.indexOf(rarity)>=RARITIES.indexOf('rare')?0:pity.rare+1;
 return rarity;
}
// Creatures Eli has met whose familiar can still take shards.
export const familiarPool=world=>Object.keys(FAMILIARS).filter(id=>codexRevealed(world,id)&&(world.familiars?.shards[id]||0)<SHARD_CAP);
const pick=(list,random)=>list[Math.min(list.length-1,Math.floor(random()*list.length))];
function drawArtifact(world,random){
 const rarity=rollWell(world.well.pity.artifacts,random),id=pick(ARTIFACT_IDS,random),item=artifactItem(id,rarity),inv=world.inventory;
 const isNew=RARITIES.every(r=>copiesOf(inv,`${id}:${r}`)===0);
 // A Legendary cannot combine any higher, so a second one goes back into the well as stones.
 if(rarity==='legendary'&&copiesOf(inv,`${id}:legendary`)>0){addStones(world.well,LEGENDARY_REFUND);return {rarity,kind:'artifact',artifact:id,name:ARTIFACTS[id].name,refund:LEGENDARY_REFUND};}
 inv.receive(item);
 return {rarity,kind:'artifact',artifact:id,name:ARTIFACTS[id].name,isNew,copies:copiesOf(inv,`${id}:${rarity}`)};
}
function drawShards(world,random){
 const pool=familiarPool(world);if(!pool.length)return null;
 const rarity=rollWell(world.well.pity.familiars,random),id=pick(pool,random),count=SHARD_COUNTS[rarity],isNew=!(world.familiars.shards[id]>0);
 let note='';for(let i=0;i<count;i++)note=absorbShard(world,id)||note;
 return {rarity,kind:'shards',familiar:id,name:FAMILIARS[id].shard,count,isNew,shards:world.familiars.shards[id],note};
}
export const wellOpen=world=>!!world.adventure&&!!world.well?.awake&&world.matchState==='playing'&&world.player.health>0&&world.fishing.state==='idle';
// One or ten Wishstones into one pool. Returns what came up, best first, and leaves a message for the window.
export function drawWell(world,pool,count=1,random=world.random){
 const well=world.well,fail=reason=>{world.message=reason;return {ok:false,reason,results:[]};};
 if(!WELL_POOLS.includes(pool)||!Number.isInteger(count)||count<1||count>MAX_DRAWS)return fail('The well does not answer that.');
 if(!wellOpen(world))return fail('The well is quiet.');
 if(well.stones<count)return fail(`That takes ${wishstonesLabel(count)}. You have ${wishstonesLabel(well.stones)}.`);
 if(pool==='familiars'&&!familiarPool(world).length)return fail('No creature in your index can take more shards. Meet new creatures to widen the Familiar pool.');
 well.stones-=count;
 const results=[];
 for(let i=0;i<count;i++){
  const result=pool==='artifacts'?drawArtifact(world,random):drawShards(world,random);
  // The Familiar pool can run dry partway through a ten-draw; the unused stones go back.
  if(!result){addStones(well,count-i);break;}
  results.push(result);
 }
 const best=results.reduce((a,b)=>RARITIES.indexOf(b.rarity)>RARITIES.indexOf(a.rarity)?b:a,results[0]);
 world.message=`The well answers. ${count>1?`Best of ${results.length}: `:''}${resultLabel(best)}`;
 return {ok:true,reason:world.message,results};
}
// What a pool can bring up and how likely each prize is on a draw before pity, for the window's details page.
// Every prize in a pool is equally likely, so one prize at one rarity is that rarity's chance split between them.
export const rarityChance=rarity=>rarity==='common'?1-Object.values(WELL_ODDS).reduce((a,b)=>a+b,0):WELL_ODDS[rarity];
export function poolRates(world,pool){
 const rarities=RARITIES.map(rarity=>({rarity,chance:rarityChance(rarity),shards:pool==='familiars'?SHARD_COUNTS[rarity]:null}));
 if(pool==='artifacts')return {rarities,prizes:ARTIFACT_IDS.map(id=>({id,name:ARTIFACTS[id].name,inPool:true,chances:Object.fromEntries(RARITIES.map(r=>[r,rarityChance(r)/ARTIFACT_IDS.length]))}))};
 const open=familiarPool(world);
 return {rarities,prizes:Object.keys(FAMILIARS).map(id=>{
  const inPool=open.includes(id),why=inPool?null:codexRevealed(world,id)?'Full: this familiar has every shard it can use':'Not met yet: find this creature in the wild to add it';
  return {id,name:FAMILIARS[id].name,inPool,why,chances:Object.fromEntries(RARITIES.map(r=>[r,inPool?rarityChance(r)/open.length:0]))};
 })};
}
export function resultLabel(result){
 if(result.kind==='shards')return `${result.name} ×${result.count} (${RARITY_NAMES[result.rarity]})`;
 const label=itemLabel({...artifactItem(result.artifact,result.rarity)});
 return result.refund?`${withArticle(label)}, already owned: returned as ${wishstonesLabel(result.refund)}`:withArticle(label);
}
export function buyWishstone(world){
 if(!wellOpen(world))return false;
 if(marksOf(world)<STONE_PRICE){world.message=`A Wishstone costs ${marksLabel(STONE_PRICE)}. You have ${marksLabel(marksOf(world))}.`;return false;}
 world.inventory.marks-=STONE_PRICE;addStones(world.well,1);
 world.message=`Bought a Wishstone for ${marksLabel(STONE_PRICE)}.`;return true;
}
// Older saves have no well; it starts asleep and wakes on its own if the story is far enough along.
export function restoreWell(data,world,fail){
 world.well=createWell();if(data===undefined||data===null)return;
 const count=(value,max)=>Number.isSafeInteger(value)&&value>=0&&value<=max;
 if(typeof data!=='object'||typeof data.awake!=='boolean'||!count(data.stones,STONES_LIMIT)||!Number.isSafeInteger(data.credited)||Math.abs(data.credited)>1e9||!data.pity||typeof data.pity!=='object')fail('Invalid wishing well data.');
 for(const pool of WELL_POOLS){const p=data.pity[pool];if(!p||!count(p.rare,PITY.rare-1)||!count(p.legendary,PITY.legendary-1))fail('Invalid wishing well pity.');world.well.pity[pool]={rare:p.rare,legendary:p.legendary};}
 Object.assign(world.well,{awake:data.awake,stones:data.stones,credited:data.credited});
}
