// The collection book of the Regions game (Netanel, 8 Nov 2026): monster cards that earn stars by kills, one set per
// area (every card of that area) with a lasting set effect and a one-time reward, and three exploration goals per map.
// Familiars live in src/familiars.js; the book screen is src/collection-ui.js. Gameplay only.
import {fieldMap,rankOrder} from './field-maps.js';
import {earnMarks} from './trade.js';
import {STONES_LIMIT} from './wishing-well.js';
import {absorbShard,FAMILIARS} from './familiars.js';
// Kills for ★, ★★ and ★★★.
export const STAR_KILLS=Object.freeze([1,30,100]);
// The cards of each region, in book order. map is where the monster lives.
export const BOOK_REGIONS=Object.freeze([
 Object.freeze({id:1,name:'Reedwater Wilds',maps:Object.freeze(['dewdrop-meadow','mossroot-trail','saltspray-shore']),cards:Object.freeze([
  Object.freeze({species:'slime',map:'dewdrop-meadow'}),
  Object.freeze({species:'stump',map:'mossroot-trail'}),
  Object.freeze({species:'shore-crab',map:'saltspray-shore'}),
  Object.freeze({species:'boss-crab',map:'saltspray-shore',boss:true})
 ])})
]);
export const BOOK_CARDS=Object.freeze(BOOK_REGIONS.flatMap(r=>r.cards));
// One set per area: every monster card of that area. The effect lasts once the set is complete; the reward is claimed once.
export const AREA_SETS=Object.freeze([
 Object.freeze({id:'reedwater-wilds',name:'Reedwater Wilds',area:'Maps 1.1 to 1.3',cards:Object.freeze(['slime','stump','shore-crab','boss-crab']),
  effect:Object.freeze({health:10,damage:.03}),reward:Object.freeze({wishstones:3})})
]);
const kills=(world,species)=>world.hunting?.bySpecies?.[species]||0;
const cleared=id=>world=>(world.fieldMaps?.[id]?.clears||0)>0;
const rankAtLeast=(id,rank)=>world=>{const best=world.fieldMaps?.[id]?.best;return !!best&&rankOrder(best)<=rankOrder(rank);};
const defeated=(species,n)=>world=>kills(world,species)>=n;
// Three goals per map; finishing all three pays the map's reward once.
export const EXPLORATION=Object.freeze({
 'dewdrop-meadow':{goals:[['Clear the map',cleared('dewdrop-meadow')],['Clear with rank A or better',rankAtLeast('dewdrop-meadow','A')],['Defeat 100 slimes',defeated('slime',100)]],reward:{marks:200}},
 'mossroot-trail':{goals:[['Clear the map',cleared('mossroot-trail')],['Clear with rank A or better',rankAtLeast('mossroot-trail','A')],['Defeat 100 stumplings',defeated('stump',100)]],reward:{marks:300}},
 'saltspray-shore':{goals:[['Clear the map',cleared('saltspray-shore')],['Clear with rank S',rankAtLeast('saltspray-shore','S')],['Defeat Mudshell 5 times',defeated('boss-crab',5)]],reward:{marks:400,shard:'boss-crab'}}
});
export const createCollection=()=>({sets:[],explored:[]});
export const starsFor=n=>STAR_KILLS.filter(k=>n>=k).length;
export function cardState(world,species){
 const n=kills(world,species),stars=starsFor(n);
 return {species,kills:n,stars,registered:stars>0,next:STAR_KILLS[stars]??null};
}
// Ten points a star, twenty a claimed reward.
export function bookScore(world){
 const c=world.collection||createCollection();
 return BOOK_CARDS.reduce((n,card)=>n+cardState(world,card.species).stars*10,0)+(c.sets.length+c.explored.length)*20;
}
export function setState(world,id){
 const set=AREA_SETS.find(s=>s.id===id);if(!set)return null;
 const have=set.cards.filter(s=>kills(world,s)>0).length;
 return {id,have,total:set.cards.length,done:have===set.cards.length,claimed:!!world.collection?.sets.includes(id)};
}
export function exploreState(world,id){
 const e=EXPLORATION[id];if(!e)return null;
 const goals=e.goals.map(([label,test])=>({label,done:!!test(world)}));
 return {id,goals,done:goals.every(g=>g.done),claimed:!!world.collection?.explored.includes(id)};
}
// What completed sets add to Eli: {health, damage}. Kept on progression.collection.
export function collectionBonus(world){
 const bonus={health:0,damage:0};
 for(const set of AREA_SETS)if(setState(world,set.id).done)for(const [k,v] of Object.entries(set.effect))bonus[k]+=v;
 return bonus;
}
export function applyCollection(world){
 if(!world.progression)return;
 const b=collectionBonus(world),old=world.progression.collection;
 if(old&&old.health===b.health&&old.damage===b.damage)return;
 world.progression.collection=b;
}
function pay(world,{wishstones=0,marks=0,shard}){
 const parts=[];
 if(wishstones>0&&world.well){world.well.stones=Math.min(STONES_LIMIT,(world.well.stones||0)+wishstones);parts.push(`${wishstones} Wishstone${wishstones===1?'':'s'}`);}
 if(marks>0)parts.push(`${earnMarks(world,marks)} reed marks`);
 if(shard&&FAMILIARS[shard]){absorbShard(world,shard);parts.push(FAMILIARS[shard].shard);}
 return parts.join(', ');
}
export function claimSet(world,id){
 const s=setState(world,id);if(!s||!s.done||s.claimed)return false;
 world.collection.sets.push(id);const got=pay(world,AREA_SETS.find(x=>x.id===id).reward);
 world.message=`${AREA_SETS.find(x=>x.id===id).name} set complete · ${got}`;return true;
}
export function claimExploration(world,id){
 const s=exploreState(world,id);if(!s||!s.done||s.claimed)return false;
 world.collection.explored.push(id);const got=pay(world,EXPLORATION[id].reward);
 world.message=`${fieldMap(id).code} exploration complete · ${got}`;return true;
}
export function collectionAction(world,action,id){
 if(!world.adventure)return false;world.collection??=createCollection();
 if(action==='claim-set')return claimSet(world,id);
 if(action==='claim-explore')return claimExploration(world,id);
 return false;
}
export function restoreCollection(data,world,fail=m=>{throw Error(m);}){
 world.collection=createCollection();if(data===undefined||data===null)return;
 if(typeof data!=='object'||!Array.isArray(data.sets)||!Array.isArray(data.explored))fail('Invalid collection data.');
 for(const id of data.sets){if(!AREA_SETS.some(s=>s.id===id)||world.collection.sets.includes(id))fail('Invalid collection data.');world.collection.sets.push(id);}
 for(const id of data.explored){if(!EXPLORATION[id]||world.collection.explored.includes(id))fail('Invalid collection data.');world.collection.explored.push(id);}
}
export const saveCollection=world=>world.collection?{sets:[...world.collection.sets],explored:[...world.collection.explored]}:null;
