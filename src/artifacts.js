// Artifacts are drop-only backpack items that work while they sit in one of Eli's artifact slots.
// Each drops at a random rarity; three copies of one rarity combine into one copy a rarity higher.
export const RARITIES=Object.freeze(['common','uncommon','rare','epic','legendary']);
export const RARITY_NAMES=Object.freeze({common:'Common',uncommon:'Uncommon',rare:'Rare',epic:'Epic',legendary:'Legendary'});
// Share of artifact drops that land at each rarity above Common. Common takes whatever is left.
export const RARITY_CHANCES=Object.freeze({uncommon:.25,rare:.1,epic:.04,legendary:.01});
export const COMBINE_COUNT=3;
export const ARTIFACT_SLOT_COUNT=3;
// One value per rarity, Common first. The Lodestone's reach is in world pixels; 50 is about one of Eli's steps.
export const ARTIFACTS=Object.freeze({
 lodestone:{name:'Lodestone',species:'eel',chance:.05,values:[100,150,200,250,300],
  description:'A lump of dark iron ore that eels swallow and carry for years. Loose things drift toward it.',
  effect:v=>`Pulls drops into the backpack from ${v/50} steps away`},
 'stag-crown':{name:'Stag Crown',species:'deer',chance:.05,values:[.05,.1,.15,.22,.3],
  description:'Antlers from a stag that never lost a fight.',
  effect:v=>`Arrows hit ${Math.round(v*100)}% harder`},
 'rabbits-foot':{name:'Rabbit’s Foot',species:'rabbit',chance:.04,values:[.05,.1,.15,.22,.3],
  description:'Supposedly lucky. It was not lucky for the rabbit.',
  effect:v=>`Rare drops are ${Math.round(v*100)}% more likely`},
 'mossback-scute':{name:'Mossback Scute',species:'turtle',chance:.05,values:[.04,.08,.12,.16,.2],
  description:'One plate of an old turtle’s shell, still warm.',
  effect:v=>`Take ${Math.round(v*100)}% less damage`},
 'black-light-heart':{name:'Heart of Black Light',species:'shadow-walker',chance:1/15,values:[1,2,3,4,6],
  description:'It beats, slowly, when shadow walkers are near.',
  effect:v=>`Each kill restores ${v} health`}
});
export const ARTIFACT_IDS=Object.freeze(Object.keys(ARTIFACTS));
const BY_NAME=new Map(ARTIFACT_IDS.map(id=>[ARTIFACTS[id].name,id]));
export const artifactIdFor=name=>BY_NAME.get(name)||null;
export const isArtifact=item=>!!item&&Object.hasOwn(ARTIFACTS,item.artifact)&&RARITIES.includes(item.rarity);
export const artifactKey=item=>`${item.artifact}:${item.rarity}`;
export const nextRarity=rarity=>RARITIES[RARITIES.indexOf(rarity)+1]||null;
export const artifactValue=(id,rarity)=>ARTIFACTS[id].values[RARITIES.indexOf(rarity)];
export const artifactEffect=(id,rarity)=>ARTIFACTS[id].effect(artifactValue(id,rarity));
// The name shown in messages and prompts: "Rare Stag Crown".
export const itemLabel=item=>isArtifact(item)?`${RARITY_NAMES[item.rarity]} ${item.name}`:item?.name;
export const withArticle=label=>`${/^[AEIOU]/.test(label)?'an':'a'} ${label}`;
export function artifactItem(id,rarity='common'){
 const a=ARTIFACTS[id];return {name:a.name,category:'artifacts',artifact:id,rarity,description:a.description};
}
// Luck scales every rarity above Common, capped so the chances never pass certainty.
export function rollRarity(random,luck=1){
 const roll=random();let above=0;
 for(const rarity of [...RARITIES].reverse()){if(rarity==='common')break;above=Math.min(1,above+RARITY_CHANCES[rarity]*luck);if(roll<above)return rarity;}
 return 'common';
}
// Backpacks from before artifacts carry plain Rabbit's Feet. They become Common artifacts.
export function normalizeArtifact(item){
 const id=artifactIdFor(item?.name);if(!id)return item;
 if(item.artifact!==id||!RARITIES.includes(item.rarity))Object.assign(item,{artifact:id,rarity:'common'});
 item.category='artifacts';return item;
}

// Slots hold "artifact:rarity" keys. A slot only counts while the backpack still holds a copy of that rarity.
const owned=(inventory,key)=>inventory.allItems.some(item=>isArtifact(item)&&artifactKey(item)===key);
export const artifactSlots=inventory=>inventory.artifactSlots||(inventory.artifactSlots=Array(ARTIFACT_SLOT_COUNT).fill(null));
export function slottedArtifacts(inventory){
 return artifactSlots(inventory).flatMap(key=>key&&owned(inventory,key)?[{artifact:key.split(':')[0],rarity:key.split(':')[1]}]:[]);
}
// The strength of one artifact's effect for whoever carries this backpack, or 0 when it is not slotted.
export function artifactBonus(actor,id){
 const slotted=actor?.inventory?slottedArtifacts(actor.inventory).find(entry=>entry.artifact===id):null;
 return slotted?artifactValue(id,slotted.rarity):0;
}
export const inArtifactSlot=(inventory,item)=>isArtifact(item)&&artifactSlots(inventory).includes(artifactKey(item));
// Puts an artifact in a slot. A copy of the same artifact already slotted is swapped out, since only one of each can work at once.
export function slotArtifact(inventory,item){
 if(!isArtifact(item))return {ok:false,reason:'Only artifacts go in artifact slots.'};
 const slots=artifactSlots(inventory),key=artifactKey(item);
 for(let i=0;i<slots.length;i++)if(slots[i]&&!owned(inventory,slots[i]))slots[i]=null;
 if(slots.includes(key))return {ok:false,reason:`${itemLabel(item)} is already in a slot.`};
 const same=slots.findIndex(entry=>entry?.split(':')[0]===item.artifact),free=slots.indexOf(null),index=same>=0?same:free;
 if(index<0)return {ok:false,reason:'All three artifact slots are full. Take one out first.'};
 slots[index]=key;return {ok:true,reason:`${itemLabel(item)} is now in an artifact slot.`};
}
export function unslotArtifact(inventory,item){
 const slots=artifactSlots(inventory),index=isArtifact(item)?slots.indexOf(artifactKey(item)):-1;
 if(index<0)return false;slots[index]=null;return true;
}
export const copiesOf=(inventory,key)=>inventory.allItems.reduce((total,item)=>total+(isArtifact(item)&&artifactKey(item)===key?Math.max(1,item.count||1):0),0);
// Three copies of one rarity become one copy a rarity higher. A slot holding the last of the old copies follows the upgrade.
export function combineArtifacts(inventory,item){
 if(!isArtifact(item))return {ok:false,reason:'Only artifacts can be combined.'};
 const key=artifactKey(item),next=nextRarity(item.rarity);
 if(!next)return {ok:false,reason:`${item.name} is already Legendary.`};
 if(copiesOf(inventory,key)<COMBINE_COUNT)return {ok:false,reason:`Combining needs ${COMBINE_COUNT} ${itemLabel(item)}s.`};
 let left=COMBINE_COUNT;
 for(const stack of [...inventory.allItems])if(left>0&&isArtifact(stack)&&artifactKey(stack)===key)left-=Math.max(1,inventory.removeId(stack.id,left)?.count||1);
 const upgraded=artifactItem(item.artifact,next);inventory.receive(upgraded);
 const slots=artifactSlots(inventory),index=slots.indexOf(key);
 if(index>=0&&!owned(inventory,key))slots[index]=artifactKey(upgraded);
 return {ok:true,reason:`Three ${itemLabel(item)}s combined into ${withArticle(itemLabel(upgraded))}!`,rarity:next};
}
