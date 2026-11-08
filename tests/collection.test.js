import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {BOOK_CARDS,AREA_SETS,EXPLORATION,cardState,setState,exploreState,collectionAction,bookScore} from '../src/collection.js';
import {FAMILIARS} from '../src/familiars.js';
import {LOOT_TABLES} from '../src/loot.js';
import {updateRegions} from '../src/region-play.js';
import {captureSave,restoreSave} from '../src/save-format.js';
const fresh=()=>{const w=new World(()=>.3,{adventure:true,regions:true});w.journeyId='book-test';return w;};

test('a monster card registers on the first kill and earns stars at 30 and 100',()=>{
 const w=fresh();assert.equal(cardState(w,'slime').registered,false);
 w.hunting.bySpecies.slime=1;assert.deepEqual([cardState(w,'slime').stars,cardState(w,'slime').next],[1,30]);
 w.hunting.bySpecies.slime=30;assert.equal(cardState(w,'slime').stars,2);
 w.hunting.bySpecies.slime=100;assert.deepEqual([cardState(w,'slime').stars,cardState(w,'slime').next],[3,null]);
 assert.equal(bookScore(w),30);
});

test('every book monster has a familiar whose shard is in its loot table',()=>{
 for(const {species} of BOOK_CARDS){assert.ok(FAMILIARS[species],species);assert.ok(LOOT_TABLES[species].some(e=>e.item===FAMILIARS[species].shard),species);}
});

test('the Reedwater Wilds set needs every area card; its effect lasts and its reward pays once; a save keeps the claim',()=>{
 const w=fresh(),set=AREA_SETS[0],hp=w.progression.maxHealth,stones=w.well.stones;
 for(const s of set.cards.slice(1))w.hunting.bySpecies[s]=1;
 updateRegions(w);assert.equal(setState(w,set.id).done,false);assert.equal(collectionAction(w,'claim-set',set.id),false);assert.equal(w.progression.maxHealth,hp);
 w.hunting.bySpecies[set.cards[0]]=1;updateRegions(w);
 assert.equal(w.progression.maxHealth,hp+set.effect.health);assert.equal(w.progression.collection.damage,set.effect.damage);
 assert.equal(collectionAction(w,'claim-set',set.id),true);assert.equal(w.well.stones,stones+set.reward.wishstones);
 assert.equal(collectionAction(w,'claim-set',set.id),false,'once');
 w.player.health=w.progression.maxHealth;
 const back=restoreSave(captureSave(w));assert.deepEqual(back.collection.sets,[set.id]);assert.equal(back.progression.maxHealth,hp+set.effect.health);
});

test('a map pays its exploration reward once all three goals are done',()=>{
 const w=fresh(),id='dewdrop-meadow',marks=w.inventory.marks||0;
 assert.equal(exploreState(w,id).done,false);assert.equal(collectionAction(w,'claim-explore',id),false);
 Object.assign(w.fieldMaps[id],{clears:1,best:'A'});w.hunting.bySpecies.slime=100;
 assert.equal(exploreState(w,id).done,true);assert.equal(collectionAction(w,'claim-explore',id),true);
 assert.equal(w.inventory.marks,marks+EXPLORATION[id].reward.marks);assert.equal(collectionAction(w,'claim-explore',id),false);
 const back=restoreSave(captureSave(w));assert.deepEqual(back.collection.explored,[id]);
});
