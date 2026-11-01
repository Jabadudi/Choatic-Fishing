import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {ARTIFACTS,ARTIFACT_IDS,RARITIES,RARITY_CHANCES,artifactBonus,artifactItem,artifactSlots,combineArtifacts,copiesOf,itemLabel,rollRarity,slotArtifact,slottedArtifacts,unslotArtifact} from '../src/artifacts.js';
import {LOOT_TABLES,rollLoot} from '../src/loot.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {attack,damage} from '../src/combat.js';
import {damageAnimal} from '../src/wildlife.js';
import {dropItem} from '../src/drops.js';
import {sellValue} from '../src/trade.js';
import {backpackItems} from '../src/inventory.js';
const fresh=()=>{const w=new World(()=>.2,{adventure:true});w.journeyId='artifact-journey';return w;};
const copy=value=>JSON.parse(JSON.stringify(value));
const give=(w,id,rarity,count=1)=>{for(let i=0;i<count;i++)w.inventory.receive(artifactItem(id,rarity));return w.inventory.allItems.find(item=>item.artifact===id&&item.rarity===rarity);};
const sequence=values=>{let i=0;return ()=>values[i++%values.length];};

// The spawn plan's new animals (fox through seal) of the spawn plan's new animals, have no artifact yet.
test('each hunted creature carries one artifact, rolled before its familiar shard',()=>{
 const carriers=Object.entries(LOOT_TABLES).map(([table,entries])=>[table,entries.filter(entry=>entry.artifact).map(entry=>entry.artifact)]);
 assert.deepEqual(Object.fromEntries(carriers),{rabbit:['rabbits-foot'],fox:[],deer:['stag-crown'],boar:[],elk:[],bear:[],heron:[],crab:[],goat:[],otter:[],duck:[],pike:[],seal:[],turtle:['mossback-scute'],eel:['lodestone'],'shadow-walker':['black-light-heart'],
  'hollow-stag':[],'gloam-boar':[],stoneshade:[],whisperer:[],'mire-walker':[],'drowned-soldier':[],'ash-archer':[],inkeel:[]});
 for(const id of ARTIFACT_IDS)assert.ok(ARTIFACTS[id].chance>0&&ARTIFACTS[id].chance<1&&ARTIFACTS[id].values.length===RARITIES.length,id);
 // Hide, antlers, crown, crown rarity, shard.
 const [crown]=rollLoot('deer',sequence([.9,.9,0,.5,.9])).filter(item=>item.artifact);
 assert.deepEqual({name:crown.name,rarity:crown.rarity,category:crown.category},{name:'Stag Crown',rarity:'common',category:'artifacts'});
 assert.equal(rollLoot('deer',sequence([.9,.9,0,.005,.9])).find(item=>item.artifact).rarity,'legendary');
});

test('rarity rolls follow 60 / 25 / 10 / 4 / 1, and luck lifts every rarity above Common',()=>{
 assert.deepEqual([.005,.03,.1,.3,.5,.99].map(roll=>rollRarity(()=>roll)),['legendary','epic','rare','uncommon','common','common']);
 assert.equal(Object.values(RARITY_CHANCES).reduce((a,b)=>a+b,0).toFixed(2),'0.40');
 assert.equal(rollRarity(()=>.5),'common');assert.equal(rollRarity(()=>.5,2),'uncommon');
 assert.equal(rollRarity(()=>.99,10),'rare');
});

test('copies stack only with the same rarity and show their rarity by name',()=>{
 const w=fresh();give(w,'lodestone','common',2);give(w,'lodestone','rare');
 const stacks=w.inventory.allItems.filter(item=>item.artifact==='lodestone');
 assert.deepEqual(stacks.map(item=>[item.rarity,item.count]),[['common',2],['rare',1]]);
 assert.equal(itemLabel(stacks[1]),'Rare Lodestone');
 assert.deepEqual(backpackItems(w.inventory,'artifacts').map(entry=>entry.item.rarity),['common','rare']);
});

test('three slots hold one copy of each artifact, and a better copy swaps in for the old one',()=>{
 const w=fresh(),inv=w.inventory,common=give(w,'lodestone','common'),rare=give(w,'lodestone','rare'),crown=give(w,'stag-crown','common'),foot=give(w,'rabbits-foot','uncommon'),scute=give(w,'mossback-scute','epic');
 assert.ok(slotArtifact(inv,common).ok);assert.equal(slotArtifact(inv,common).ok,false);
 assert.ok(slotArtifact(inv,rare).ok);assert.deepEqual(artifactSlots(inv),['lodestone:rare',null,null]);
 assert.ok(slotArtifact(inv,crown).ok&&slotArtifact(inv,foot).ok);
 assert.match(slotArtifact(inv,scute).reason,/full/);
 assert.equal(artifactBonus(w.player,'lodestone'),200);assert.equal(artifactBonus(w.player,'mossback-scute'),0);
 assert.ok(unslotArtifact(inv,crown));assert.ok(slotArtifact(inv,scute).ok);
 assert.deepEqual(slottedArtifacts(inv).map(entry=>entry.artifact),['lodestone','mossback-scute','rabbits-foot']);
 // A slotted artifact stops working once its last copy leaves the backpack.
 inv.removeId(rare.id);assert.equal(artifactBonus(w.player,'lodestone'),0);
});

test('three copies of one rarity combine into one a rarity higher, and a slot follows the upgrade',()=>{
 const w=fresh(),inv=w.inventory,commons=give(w,'stag-crown','common',4);
 assert.ok(w.backpackAction(commons.id,'slot'));
 assert.ok(w.backpackAction(commons.id,'combine'));assert.equal(w.message,'Three Common Stag Crowns combined into an Uncommon Stag Crown!');
 assert.equal(copiesOf(inv,'stag-crown:common'),1);assert.equal(copiesOf(inv,'stag-crown:uncommon'),1);
 assert.deepEqual(artifactSlots(inv),['stag-crown:common',null,null],'a copy is still left, so the slot keeps it');
 assert.equal(w.backpackAction(commons.id,'combine'),false);assert.match(w.message,/needs 3/);
 const uncommon=give(w,'stag-crown','uncommon',2);w.backpackAction(commons.id,'unslot');w.backpackAction(uncommon.id,'slot');
 assert.ok(combineArtifacts(inv,uncommon).ok);assert.deepEqual(artifactSlots(inv),['stag-crown:rare',null,null]);
 const legend=give(w,'stag-crown','legendary',3);assert.equal(combineArtifacts(inv,legend).ok,false);
 assert.equal(w.backpackAction(legend.id,'hotbar',2),false);
});

test('the Lodestone pulls nearby drops into the backpack, leaving far and freshly thrown ones alone',()=>{
 const w=fresh(),p=w.player,lode=give(w,'lodestone','common');
 const drop=(id,dx,item)=>w.drops.push({id,entityType:'pickup',spriteId:'pickup',areaId:w.areaId,x:p.x+dx,y:p.y,item:{name:item,id:`loot-${id}`,uses:1,category:'consumables'}});
 drop('near',80,'Deer Meat');drop('far',180,'Rabbit Meat');
 for(let i=0;i<60;i++)w.pullDrops(1/60);
 assert.deepEqual(w.drops.map(d=>d.id),['near','far'],'nothing moves without a slotted Lodestone');
 w.backpackAction(lode.id,'slot');
 for(let i=0;i<60;i++)w.pullDrops(1/60);
 assert.deepEqual(w.drops.map(d=>d.id),['far']);assert.equal(w.inventory.countOf('Deer Meat'),1);assert.equal(w.message,'Picked up Deer Meat.');
 const thrown=w.inventory.allItems.find(item=>item.name==='Deer Meat');assert.ok(dropItem(w,thrown));
 for(let i=0;i<60;i++)w.pullDrops(1/60);
 assert.equal(w.inventory.countOf('Deer Meat'),0,'a thrown item waits before the Lodestone takes it back');
 w.elapsed+=5;for(let i=0;i<60;i++)w.pullDrops(1/60);assert.equal(w.inventory.countOf('Deer Meat'),1);
 // A Legendary Lodestone reaches six steps.
 give(w,'lodestone','legendary');w.backpackAction(w.inventory.allItems.find(item=>item.rarity==='legendary').id,'slot');
 for(let i=0;i<120;i++)w.pullDrops(1/60);assert.deepEqual(w.drops,[]);
});

test('artifact drops announce their rarity when picked up',()=>{
 const w=fresh(),p=w.player;give(w,'lodestone','common');w.backpackAction(w.inventory.allItems[0].id,'slot');
 w.drops.push({id:'gem',entityType:'pickup',spriteId:'pickup',areaId:w.areaId,x:p.x+20,y:p.y,item:{...artifactItem('stag-crown','epic'),id:'loot-gem',uses:1}});
 for(let i=0;i<30;i++)w.pullDrops(1/60);assert.equal(w.message,'Picked up an Epic Stag Crown!');
});

test('the scute, crown and heart change combat while slotted',()=>{
 const w=fresh(),p=w.player;
 p.health=100;damage(w,p,50,{entityType:'animal'},0);const plain=100-p.health;
 const scute=give(w,'mossback-scute','legendary');w.backpackAction(scute.id,'slot');
 p.health=100;damage(w,p,50,{entityType:'animal'},0);assert.ok(Math.abs((100-p.health)-plain*.8)<1e-9);
 attack(w,p,{name:'Hunting Bow'});const before=w.projectiles.pop().damage;
 const crown=give(w,'stag-crown','rare');w.backpackAction(crown.id,'slot');p.cooldown=0;
 attack(w,p,{name:'Hunting Bow'});assert.ok(Math.abs(w.projectiles.pop().damage-before*1.15)<1e-9);
 const heart=give(w,'black-light-heart','epic');w.backpackAction(heart.id,'slot');
 const deer=w.wildlife.find(a=>a.species==='deer');p.health=50;Object.assign(p,{x:deer.x-40,y:deer.y});w.areaId=deer.areaId;
 damageAnimal(w,deer,10000,p,0);assert.ok(p.health>=54,`${p.health}`);
});

test('artifacts sell by rarity',()=>{
 assert.deepEqual(RARITIES.map(rarity=>sellValue(artifactItem('lodestone',rarity))),[8,20,50,120,300]);
});

test('artifact slots survive a save, older Rabbit’s Feet become Common artifacts, and bad slots are rejected',()=>{
 const w=fresh(),rare=give(w,'mossback-scute','rare');w.backpackAction(rare.id,'slot');
 const save=captureSave(w),restored=restoreSave(copy(save));
 assert.deepEqual(artifactSlots(restored.inventory),['mossback-scute:rare',null,null]);
 assert.equal(artifactBonus(restored.player,'mossback-scute'),.12);
 const old=copy(save);delete old.state.inventory.artifacts;
 old.state.inventory.items.push({id:'item-90',name:'Rabbit’s Foot',category:'trophies',description:'Supposedly lucky.',uses:1,count:2});
 const migrated=restoreSave(old),foot=migrated.inventory.allItems.find(item=>item.name==='Rabbit’s Foot');
 assert.deepEqual([foot.artifact,foot.rarity,foot.category,foot.count],['rabbits-foot','common','artifacts',2]);
 assert.deepEqual(artifactSlots(migrated.inventory),[null,null,null]);
 const bad=copy(save);bad.state.inventory.artifacts=['moon-rock:rare',null,null];assert.throws(()=>restoreSave(bad),/artifact slots/);
 const fake=copy(save);fake.state.inventory.items[0].rarity='mythic';assert.throws(()=>restoreSave(fake),/backpack items/);
});
