import {restoreStory,createStoryNpcs,pageForBeat,relocateGuide,LURE,REGION_CORE} from './story.js';
import {YARD} from './training-ground.js';
import {World} from './world.js';
import {AREAS,walkable} from './wilds.js';
import {animalGround} from './wildlife.js';
import {SKILL_IDS,skillXpToNext} from './skills.js';
import {validTree} from './skill-trees.js';
import {restoreFamiliars} from './familiars.js';
import {restoreCodex} from './codex-discovery.js';
import {restoreItemsFound} from './pickups.js';
import {SLOTS} from './spawn-tables.js';
import {createCreature,listFor,restoreSpawns,spawnable} from './spawns.js';
import {ANIMAL_TYPES} from './entities.js';
import {MARKS_LIMIT} from './trade.js';
import {SIDE_QUEST_IDS,restoreSideQuests} from './side-quests.js';
import {restoreWell} from './wishing-well.js';
import {restoreBosses} from './bosses.js';
import {ARTIFACTS,ARTIFACT_SLOT_COUNT,RARITIES,artifactIdFor,normalizeArtifact} from './artifacts.js';
export const SAVE_VERSION=8;
export const SAVE_FORMAT='the-wilds-save';
const clone=value=>JSON.parse(JSON.stringify(value));
const fail=message=>{throw Error(message);};
const number=(value,min=0,max=1e9)=>typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max;
const list=(value,max=20000)=>Array.isArray(value)&&value.length<=max;
function inspect(value,depth=0){
 if(depth>20)fail('Save file is too deeply nested.');
 if(value&&typeof value==='object')for(const key of Object.keys(value)){
  if(['__proto__','prototype','constructor'].includes(key))fail('Save file contains invalid fields.');inspect(value[key],depth+1);
 }
}
function itemValid(item){return item&&typeof item.id==='string'&&item.id.length<100&&typeof item.name==='string'&&item.name.length>0&&item.name.length<120&&number(item.uses,1,100000)&&Number.isInteger(item.uses)&&(!item.description||typeof item.description==='string'&&item.description.length<2000)&&(item.count===undefined||number(item.count,1,100000)&&Number.isInteger(item.count))&&artifactValid(item);}
// An artifact names a known artifact, matches its name and carries a known rarity.
const artifactValid=item=>item.artifact===undefined&&item.rarity===undefined||Object.hasOwn(ARTIFACTS,item.artifact)&&ARTIFACTS[item.artifact].name===item.name&&RARITIES.includes(item.rarity);
const slotValid=key=>key===null||typeof key==='string'&&Object.hasOwn(ARTIFACTS,key.split(':')[0])&&RARITIES.includes(key.split(':')[1])&&key.split(':').length===2;
const ANIMAL_FIELDS=['x','y','health','state','time','wait','alert','direction','seed','hopDuration','hopDistance','anger','attackerId','attackRemaining','attackCooldownRemaining','roarRemaining','threat','deathRemaining'];
export function captureSave(world,reason='autosave',now=Date.now()){
 if(!world?.adventure)fail('Only exploration progress can be saved.');
 const p=world.player;
 return {format:SAVE_FORMAT,version:SAVE_VERSION,savedAt:now,reason,journeyId:world.journeyId,state:{
  areaId:world.areaId,elapsed:world.elapsed,story:world.story?clone(world.story):null,
  player:{x:p.x,y:p.y,angle:p.angle,health:p.health,cooldown:p.cooldown,dashCharges:p.dashCharges,dashCooldown:p.dashCooldown},
  inventory:{items:clone(p.inventory.allItems),hotbar:p.inventory.slots.map(item=>item?.id||null),selected:p.inventory.selected,nextId:p.inventory.nextId,marks:p.inventory.marks,artifacts:[...p.inventory.artifactSlots]},
  progression:{...clone(p.progression),eliminations:[...p.progression.eliminations]},catches:clone(p.catches),
  quests:clone(world.quests),discovered:[...world.discovered],hunting:clone(world.hunting),familiars:clone(world.familiars),codex:[...(world.codex||[])],itemsFound:world.itemsFound?[...world.itemsFound]:null,well:clone(world.well),
  spawns:world.spawns?{seed:world.spawns.seed,next:world.spawns.next,current:world.spawns.current,areas:clone(world.spawns.areas)}:null,
  // Bosses and their adds are not saved: a boss rises fresh when Eli comes back. Only each spot's clock is kept.
  bosses:clone(world.bosses||{}),
  animals:world.animals.filter(animal=>!animal.bossId).map(animal=>({id:animal.id,slotId:animal.slotId,species:animal.species,shiny:!!animal.shiny,seen:!!animal.seen,...Object.fromEntries(ANIMAL_FIELDS.filter(key=>animal[key]!==undefined).map(key=>[key,clone(animal[key])]))})),
  drops:clone(world.drops),nextDropId:world.nextDropId
 }};
}
// Assign only known progression fields; new game fields keep their current defaults.
function progressionFrom(data,target){
 if(!data||!number(data.level,1,100000)||!number(data.xp)||!number(data.totalXp))fail('Invalid experience data.');
 for(const key of ['upgradeRemaining','pendingUpgrades','level','xp','totalXp','pendingChoices']){
  if(data[key]!==undefined){if(!number(data[key],0,key==='upgradeRemaining'?30:1e9))fail('Invalid progression data.');target[key]=data[key];}
 }
 for(const group of ['upgrades','ranks','specials'])if(data[group])for(const key of Object.keys(target[group])){
  const value=data[group][key];if(value!==undefined){if(!number(value,0,100000)||!Number.isInteger(value))fail('Invalid upgrade data.');target[group][key]=value;}
 }
 if(!list(data.eliminations||[],10000))fail('Invalid elimination data.');target.eliminations=new Set(data.eliminations||[]);
 if(data.lastBuff&&typeof data.lastBuff.name==='string')target.lastBuff=clone(data.lastBuff);
 // Skills arrived after save version 5 was set; saves without them start every skill fresh.
 if(data.skills!==undefined&&(!data.skills||typeof data.skills!=='object'))fail('Invalid skill data.');
 for(const id of SKILL_IDS){const skill=data.skills?.[id];if(skill===undefined)continue;
  if(!skill||!Number.isInteger(skill.level)||!number(skill.level,1,100000)||!Number.isInteger(skill.xp)||!number(skill.xp,0,skillXpToNext(skill.level)-1))fail('Invalid skill data.');
  target.skills[id]={level:skill.level,xp:skill.xp};}
 // Skill trees arrived later still; saves without them keep every earned point unspent.
 if(data.skillTrees!==undefined&&(!data.skillTrees||typeof data.skillTrees!=='object'))fail('Invalid skill tree data.');
 for(const id of SKILL_IDS){const ranks=data.skillTrees?.[id];if(ranks===undefined)continue;
  if(!validTree(id,ranks,target.skills[id].level))fail('Invalid skill tree data.');
  target.skillTrees[id]=Object.fromEntries(Object.entries(ranks).filter(([,rank])=>rank>0));}
 if(target.xp>=target.xpToNextLevel)fail('Experience exceeds the level threshold.');
}
// Willowback's Commons, Upper Lanes, Millside and Training Ground became the Town Square, the Merchant Quarter and the
// Farm & Training Grounds (with the training yard inside the farm), and Windchime Path was redrawn. Old positions on
// those maps mean nothing on the new ones: Eli, dropped items and the guide move to their area's new places, and the
// training yard keeps its layout, so anything in it just shifts into the farm.
const RENAMED={'village-north':'village-market','village-mill':'village-farm','training-ground':'village-farm'};
const REDRAWN=['village','village-north','village-mill','windchime'];
function moveToNewMaps(s){
 if(!s||typeof s!=='object')return;
 const move=thing=>{
  const old=thing.areaId,area=AREAS[RENAMED[old]||old];if(!area)return;
  if(old==='training-ground'&&typeof thing.x==='number'&&typeof thing.y==='number'){thing.x+=YARD.x;thing.y+=YARD.y;}
  else if(REDRAWN.includes(old)){thing.x=area.spawn.x;thing.y=area.spawn.y;}
  thing.areaId=area.id;
 };
 if(typeof s.areaId==='string'&&s.player&&typeof s.player==='object'){const p={areaId:s.areaId,x:s.player.x,y:s.player.y};move(p);s.areaId=p.areaId;s.player.x=p.x;s.player.y=p.y;}
 for(const drop of Array.isArray(s.drops)?s.drops:[])if(drop&&typeof drop==='object')move(drop);
 // Animals on the redrawn path go back to their spawn slot.
 for(const animal of Array.isArray(s.animals)?s.animals:[])if(animal&&SLOTS[animal.slotId]?.areaId==='windchime'){animal.x=SLOTS[animal.slotId].x;animal.y=SLOTS[animal.slotId].y;}
 if(s.story?.guide&&typeof s.story.guide==='object'){if(RENAMED[s.story.guide.areaId]){const g={...s.story.guide};move(g);s.story.guide=g;}relocateGuide(s.story);}
}
export function restoreSave(input){
 const save=clone(input);inspect(save);
 if(save?.format!==SAVE_FORMAT)fail('This is not a The Wilds save file.');
 if(save.version>SAVE_VERSION)fail('This save is from a newer game version. Update the game before importing it.');
 // Version 1 predates the story. Preserve those exploration journeys without replaying Chapter 1.
 if(save.version===1){save.version=2;if(save.state)save.state.story=null;}
 // Version 3 adds a validated, resumable guide route. Keep every existing story page and milestone.
 if(save.version===2){save.version=3;if(save.state?.story)save.state.story.guide=null;}
 // Version 4 makes guide geography explicit for the journey through connected areas.
 if(save.version===3){save.version=4;if(save.state?.story?.guide)save.state.story.guide.areaId='landing';}
 // Version 5 splits each story page into one page per speaker. Resume at the start of the saved beat.
 if(save.version===4){save.version=5;const story=save.state?.story;if(story?.scene&&Number.isInteger(story.page)&&pageForBeat(story.scene,story.page)>=0)story.page=pageForBeat(story.scene,story.page);}
 // Version 6 replaces fixed animals and their respawn timers with area spawn slots. Saved animals keep their slot, named by their id.
 if(save.version===5){save.version=6;for(const animal of save.state?.animals||[])if(animal&&typeof animal==='object'){animal.slotId=animal.id;delete animal.respawnRemaining;}}
 // Version 7 stacks identical items in one backpack slot. Older backpacks hold one item per entry and are folded into stacks once restored.
 const restack=save.version===6;if(restack)save.version=7;
 // Version 8 redraws Willowback as four areas and Windchime Path on a new trail. See moveToNewMaps.
 if(save.version===7){save.version=8;moveToNewMaps(save.state);}
 if(save.version!==SAVE_VERSION)fail('This save version is not supported. Your existing save was not changed.');
 if(!number(save.savedAt,0,1e16)||typeof save.journeyId!=='string'||save.journeyId.length>120)fail('Invalid save header.');
 const s=save.state;if(!s||!Object.hasOwn(AREAS,s.areaId))fail('Unknown saved area.');
 const w=new World(Math.random,{adventure:true});w.journeyId=save.journeyId;w.areaId=s.areaId;w.elapsed=number(s.elapsed)?s.elapsed:0;
 w.story=restoreStory(s.story);
 if(w.story?.guide&&!walkable(w.story.guide.x,w.story.guide.y,w.story.guide.areaId))fail('Invalid story guide position.');
 if(w.story){w.player.name='Eli';w.player.spriteId='eli';w.npcs=createStoryNpcs(w.story,w.elapsed);}
 progressionFrom(s.progression,w.progression);
 // Familiars arrived after save version 5 was set; saves without them start with none. Restored before health, which they can raise.
 restoreFamiliars(s.familiars,w);
 // The creature index arrived after save version 5; older saves start with no encounters, and story reveals catch up on their own.
 restoreCodex(s.codex,w);
 // Found items arrived after save version 7; older saves count what Eli carries as already found.
 restoreItemsFound(s.itemsFound,w);
 const inv=s.inventory;if(!inv||!list(inv.items)||!list(inv.hotbar,6)||inv.hotbar.length!==6||!Number.isInteger(inv.selected)||inv.selected<1||inv.selected>7||!Number.isSafeInteger(inv.nextId)||inv.nextId<1)fail('Invalid backpack data.');
 if(!inv.items.every(itemValid)||new Set(inv.items.map(item=>item.id)).size!==inv.items.length)fail('Invalid backpack items.');
 const ids=new Map(inv.items.map(item=>[item.id,item]));const shortcuts=inv.hotbar.filter(Boolean);
 if(new Set(shortcuts).size!==shortcuts.length||shortcuts.some(id=>!ids.has(id)))fail('Invalid hotbar shortcuts.');
 w.inventory.storedItems=clone(inv.items);const stored=new Map(w.inventory.storedItems.map(item=>[item.id,item]));w.inventory.slots=inv.hotbar.map(id=>stored.get(id)||null);w.inventory.selected=inv.selected;
 // Artifacts arrived after save version 7. Rabbit's Feet carried from before become Common artifacts, and saves without slots start with all three empty.
 const migrated=w.inventory.storedItems.filter(item=>artifactIdFor(item.name)&&item.rarity===undefined);w.inventory.storedItems.forEach(normalizeArtifact);if(restack||migrated.length)w.inventory.restack();
 if(inv.artifacts!==undefined&&(!list(inv.artifacts,ARTIFACT_SLOT_COUNT)||inv.artifacts.length!==ARTIFACT_SLOT_COUNT||!inv.artifacts.every(slotValid)))fail('Invalid artifact slots.');
 w.inventory.artifactSlots=inv.artifacts?[...inv.artifacts]:Array(ARTIFACT_SLOT_COUNT).fill(null);
 // Reed marks arrived with save version 7's stacks; saves without them start with an empty purse.
 if(inv.marks!==undefined&&(!Number.isSafeInteger(inv.marks)||!number(inv.marks,0,MARKS_LIMIT)))fail('Invalid purse data.');w.inventory.marks=inv.marks??0;
 // Eli swallows the Region Core at the end of Chapter 5. Saves from before that scene was written still carry it.
 if(w.story?.coreIngested)for(const item of [...w.inventory.allItems])if([LURE,REGION_CORE].includes(item.name))w.inventory.removeId(item.id,Infinity);
 w.inventory.nextId=Math.max(inv.nextId,...inv.items.map(item=>/^item-\d+$/.test(item.id)?Number(item.id.slice(5))+1:1));
 const p=s.player;if(!p||!number(p.x,0,AREAS[s.areaId].width)||!number(p.y,0,AREAS[s.areaId].height)||!number(p.health,0,w.progression.maxHealth)||!number(p.angle,-100,100))fail('Invalid player data.');
 Object.assign(w.player,{x:p.x,y:p.y,angle:p.angle,health:p.health});
 // Old positions blocked by a future map edit safely return to that area's spawn.
 if(!walkable(p.x,p.y,w.areaId))Object.assign(w.player,AREAS[w.areaId].spawn);
 for(const key of ['cooldown','dashCharges','dashCooldown'])if(p[key]!==undefined){if(!number(p[key],0,key==='dashCharges'?w.progression.maxDashes:10))fail('Invalid player timers.');w.player[key]=p[key];}
 if(!list(s.catches)||!list(s.discovered,10000)||!list(s.animals,1000)||!list(s.drops))fail('Invalid saved world data.');
 w.catches=clone(s.catches);w.discovered=new Set(s.discovered.filter(id=>typeof id==='string'));
 for(const [id,quest] of Object.entries(w.quests))if(s.quests?.[id]&&!SIDE_QUEST_IDS.includes(id)){if(!['available','active','complete'].includes(s.quests[id].status))fail('Invalid quest state.');quest.status=s.quests[id].status;}
 if(!s.hunting||!Number.isSafeInteger(s.hunting.total)||s.hunting.total<0)fail('Invalid hunting data.');w.hunting.total=s.hunting.total;
 for(const species of Object.keys(ANIMAL_TYPES))if(s.hunting.bySpecies?.[species]!==undefined){const count=s.hunting.bySpecies[species];if(!Number.isSafeInteger(count)||count<0)fail('Invalid hunt counts.');w.hunting.bySpecies[species]=count;}
 // Shiny counts arrived with area spawns; older saves have seen none.
 for(const kind of ['seen','hunted'])for(const species of Object.keys(ANIMAL_TYPES)){const count=s.hunting.shiny?.[kind]?.[species];if(count===undefined)continue;if(!Number.isSafeInteger(count)||count<0)fail('Invalid shiny counts.');w.hunting.shiny[kind][species]=count;}
 // Side missions arrived after save version 7 was set; saves without them start with every mission on offer. Kill progress is checked against the hunt counts above.
 restoreSideQuests(s.quests,w,fail);
 // The Wishing Well arrived after save version 7 was set; saves without it start with the well asleep, and it wakes once the story allows.
 restoreWell(s.well,w,fail);
 restoreSpawns(s.spawns,w);
 // Boss spots arrived after save version 8 was set; saves without them have every boss ready to rise.
 restoreBosses(s.bosses,w);
 // Every saved creature is rebuilt in its slot. Migrated saves name the slot of the journey's starting creature.
 const starting=w.animals;w.rabbits=[];w.wildlife=[];const animalIds=new Set();
 for(const saved of s.animals){
  if(!saved||typeof saved.id!=='string'||saved.id.length>80||typeof saved.slotId!=='string'||saved.slotId.length>80||animalIds.has(saved.id))fail('Invalid animal state.');
  const species=saved.species??starting.find(a=>a.id===saved.id)?.species;if(!species||!spawnable(species))fail('Invalid animal state.');
  // The world editor can remove a spawn point or turn it from water to land. A creature whose point is gone, or no
  // longer suits it, simply leaves; its slot is free for the next roll.
  if(!Object.hasOwn(SLOTS,saved.slotId))continue;
  const animal=createCreature(SLOTS[saved.slotId],species,{id:saved.id,shiny:saved.shiny===true});if(!animal)continue;
  const start=starting.find(a=>a.id===saved.id&&a.species===species);if(start)Object.assign(animal,{x:start.x,y:start.y,home:start.home,seed:start.seed,wait:start.wait});
  if(saved.seen===true)animal.seen=true;animalIds.add(saved.id);
  if(!number(saved.health,0,animal.maxHealth)||!number(saved.x,0,AREAS[animal.areaId].width)||!number(saved.y,0,AREAS[animal.areaId].height))fail('Invalid animal state.');
  animal.health=saved.health;
  if(animalGround(animal,saved.x,saved.y)){animal.x=saved.x;animal.y=saved.y;}
  for(const key of ANIMAL_FIELDS.filter(key=>!['x','y','health','direction','threat','state','attackerId'].includes(key)))if(saved[key]!==undefined){if(!number(saved[key],0,key==='seed'?4294967295:1e9))fail('Invalid animal timers.');animal[key]=saved[key];}
  if(saved.direction&&number(saved.direction.x,-1,1)&&number(saved.direction.y,-1,1))animal.direction=clone(saved.direction);
  if(saved.threat&&number(saved.threat.x,0,3000)&&number(saved.threat.y,0,3000))animal.threat=clone(saved.threat);
  if(saved.attackerId==='player')animal.attackerId='player';
  animal.state=animal.health===0?'dead':['idle','walk','graze','hop','settle','flee','attack','return'].includes(saved.state)?saved.state:'idle';
  listFor(w,species).push(animal);
 }
 for(const drop of s.drops){
  if(!drop||typeof drop.id!=='string'||!Object.hasOwn(AREAS,drop.areaId)||!itemValid(drop.item)||!number(drop.x,0,AREAS[drop.areaId].width)||!number(drop.y,0,AREAS[drop.areaId].height))fail('Invalid dropped item.');
  const position=walkable(drop.x,drop.y,drop.areaId)?{x:drop.x,y:drop.y}:AREAS[drop.areaId].spawn;
  w.drops.push({id:drop.id,entityType:'pickup',spriteId:'pickup',areaId:drop.areaId,...position,item:normalizeArtifact(clone(drop.item))});
 }
 if(new Set([...inv.items.map(item=>item.id),...w.drops.map(drop=>drop.item.id)]).size!==inv.items.length+w.drops.length)fail('Duplicate world inventory item.');
 if(new Set(w.drops.map(drop=>drop.id)).size!==w.drops.length)fail('Duplicate dropped item.');
 w.nextDropId=Math.max(Number.isSafeInteger(s.nextDropId)?s.nextDropId:1,...w.drops.map(drop=>/^drop-\d+$/.test(drop.id)?Number(drop.id.slice(5))+1:1));
 w.message='Journey restored. Welcome back!';return w;
}
export function parseSave(text){if(typeof text!=='string'||text.length>5*1024*1024)fail('Save file is too large.');let save;try{save=JSON.parse(text);}catch{fail('Could not read this file. Choose a valid The Wilds JSON save.');}restoreSave(save);return save;}
export function importantProgress(world){
 const p=world.progression;
 return JSON.stringify([world.areaId,world.inventory.allItems,world.inventory.marks,world.inventory.slots.map(i=>i?.id),world.inventory.artifactSlots,world.well,p.totalXp,p.skills,p.skillTrees,p.pendingChoices,p.pendingUpgrades,p.upgrades,p.ranks,p.specials,world.quests,world.story,[...world.discovered],world.hunting,world.familiars,[...(world.codex||[])],world.drops,world.animals.map(a=>a.health)]);
}
