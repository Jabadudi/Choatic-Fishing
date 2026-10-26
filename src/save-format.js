import {restoreStory,createStoryNpcs} from './story.js';
import {World} from './world.js';
import {AREAS,walkable} from './wilds.js';
import {animalGround} from './wildlife.js';
export const SAVE_VERSION=4;
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
function itemValid(item){return item&&typeof item.id==='string'&&item.id.length<100&&typeof item.name==='string'&&item.name.length>0&&item.name.length<120&&number(item.uses,1,100000)&&Number.isInteger(item.uses)&&(!item.description||typeof item.description==='string'&&item.description.length<2000);}
const ANIMAL_FIELDS=['x','y','health','state','time','wait','alert','direction','seed','hopDuration','hopDistance','anger','attackerId','attackRemaining','attackCooldownRemaining','threat','deathRemaining'];
export function captureSave(world,reason='autosave',now=Date.now()){
 if(!world?.adventure)fail('Only exploration progress can be saved.');
 const p=world.player;
 return {format:SAVE_FORMAT,version:SAVE_VERSION,savedAt:now,reason,journeyId:world.journeyId,state:{
  areaId:world.areaId,elapsed:world.elapsed,story:world.story?clone(world.story):null,
  player:{x:p.x,y:p.y,angle:p.angle,health:p.health,cooldown:p.cooldown,dashCharges:p.dashCharges,dashCooldown:p.dashCooldown},
  inventory:{items:clone(p.inventory.allItems),hotbar:p.inventory.slots.map(item=>item?.id||null),selected:p.inventory.selected,nextId:p.inventory.nextId},
  progression:{...clone(p.progression),eliminations:[...p.progression.eliminations]},catches:clone(p.catches),
  quests:clone(world.quests),discovered:[...world.discovered],hunting:clone(world.hunting),
  animals:world.animals.map(animal=>({id:animal.id,...Object.fromEntries(ANIMAL_FIELDS.filter(key=>animal[key]!==undefined).map(key=>[key,clone(animal[key])]))})),
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
 if(target.xp>=target.xpToNextLevel)fail('Experience exceeds the level threshold.');
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
 if(save.version!==SAVE_VERSION)fail('This save version is not supported. Your existing save was not changed.');
 if(!number(save.savedAt,0,1e16)||typeof save.journeyId!=='string'||save.journeyId.length>120)fail('Invalid save header.');
 const s=save.state;if(!s||!Object.hasOwn(AREAS,s.areaId))fail('Unknown saved area.');
 const w=new World(Math.random,{adventure:true});w.journeyId=save.journeyId;w.areaId=s.areaId;w.elapsed=number(s.elapsed)?s.elapsed:0;
 w.story=restoreStory(s.story);
 if(w.story?.guide&&!walkable(w.story.guide.x,w.story.guide.y,w.story.guide.areaId))fail('Invalid story guide position.');
 if(w.story){w.player.name='Eli';w.player.spriteId='eli';w.npcs=createStoryNpcs(w.story,w.elapsed);}
 progressionFrom(s.progression,w.progression);
 const inv=s.inventory;if(!inv||!list(inv.items)||!list(inv.hotbar,6)||inv.hotbar.length!==6||!Number.isInteger(inv.selected)||inv.selected<1||inv.selected>7||!Number.isSafeInteger(inv.nextId)||inv.nextId<1)fail('Invalid backpack data.');
 if(!inv.items.every(itemValid)||new Set(inv.items.map(item=>item.id)).size!==inv.items.length)fail('Invalid backpack items.');
 const ids=new Map(inv.items.map(item=>[item.id,item]));const shortcuts=inv.hotbar.filter(Boolean);
 if(new Set(shortcuts).size!==shortcuts.length||shortcuts.some(id=>!ids.has(id)))fail('Invalid hotbar shortcuts.');
 w.inventory.storedItems=clone(inv.items);const stored=new Map(w.inventory.storedItems.map(item=>[item.id,item]));w.inventory.slots=inv.hotbar.map(id=>stored.get(id)||null);w.inventory.selected=inv.selected;
 w.inventory.nextId=Math.max(inv.nextId,...inv.items.map(item=>/^item-\d+$/.test(item.id)?Number(item.id.slice(5))+1:1));
 const p=s.player;if(!p||!number(p.x,0,AREAS[s.areaId].width)||!number(p.y,0,AREAS[s.areaId].height)||!number(p.health,0,w.progression.maxHealth)||!number(p.angle,-100,100))fail('Invalid player data.');
 Object.assign(w.player,{x:p.x,y:p.y,angle:p.angle,health:p.health});
 // Old positions blocked by a future map edit safely return to that area's spawn.
 if(!walkable(p.x,p.y,w.areaId))Object.assign(w.player,AREAS[w.areaId].spawn);
 for(const key of ['cooldown','dashCharges','dashCooldown'])if(p[key]!==undefined){if(!number(p[key],0,key==='dashCharges'?w.progression.maxDashes:10))fail('Invalid player timers.');w.player[key]=p[key];}
 if(!list(s.catches)||!list(s.discovered,10000)||!list(s.animals,1000)||!list(s.drops))fail('Invalid saved world data.');
 w.catches=clone(s.catches);w.discovered=new Set(s.discovered.filter(id=>typeof id==='string'));
 for(const [id,quest] of Object.entries(w.quests))if(s.quests?.[id]){if(!['available','active','complete'].includes(s.quests[id].status))fail('Invalid quest state.');quest.status=s.quests[id].status;}
 if(!s.hunting||!Number.isSafeInteger(s.hunting.total)||s.hunting.total<0)fail('Invalid hunting data.');w.hunting.total=s.hunting.total;
 for(const species of ['rabbit','deer','turtle','eel'])if(s.hunting.bySpecies?.[species]!==undefined){const count=s.hunting.bySpecies[species];if(!Number.isSafeInteger(count)||count<0)fail('Invalid hunt counts.');w.hunting.bySpecies[species]=count;}
 for(const animal of w.animals){
  const saved=s.animals.find(a=>a.id===animal.id);if(!saved)continue;
  if(!number(saved.health,0,animal.maxHealth)||!number(saved.x,0,AREAS[animal.areaId].width)||!number(saved.y,0,AREAS[animal.areaId].height))fail('Invalid animal state.');
  animal.health=saved.health;
  if(animalGround(animal,saved.x,saved.y)){animal.x=saved.x;animal.y=saved.y;}
  for(const key of ANIMAL_FIELDS.filter(key=>!['x','y','health','direction','threat','state','attackerId'].includes(key)))if(saved[key]!==undefined){if(!number(saved[key],0,key==='seed'?4294967295:1e9))fail('Invalid animal timers.');animal[key]=saved[key];}
  if(saved.direction&&number(saved.direction.x,-1,1)&&number(saved.direction.y,-1,1))animal.direction=clone(saved.direction);
  if(saved.threat&&number(saved.threat.x,0,3000)&&number(saved.threat.y,0,3000))animal.threat=clone(saved.threat);
  if(saved.attackerId==='player')animal.attackerId='player';
  animal.state=animal.health===0?'dead':['idle','walk','graze','hop','settle','flee','attack'].includes(saved.state)?saved.state:'idle';
 }
 for(const drop of s.drops){
  if(!drop||typeof drop.id!=='string'||!Object.hasOwn(AREAS,drop.areaId)||!itemValid(drop.item)||!number(drop.x,0,AREAS[drop.areaId].width)||!number(drop.y,0,AREAS[drop.areaId].height))fail('Invalid dropped item.');
  const position=walkable(drop.x,drop.y,drop.areaId)?{x:drop.x,y:drop.y}:AREAS[drop.areaId].spawn;
  w.drops.push({id:drop.id,entityType:'pickup',spriteId:'pickup',areaId:drop.areaId,...position,item:clone(drop.item)});
 }
 if(new Set([...inv.items.map(item=>item.id),...w.drops.map(drop=>drop.item.id)]).size!==inv.items.length+w.drops.length)fail('Duplicate world inventory item.');
 if(new Set(w.drops.map(drop=>drop.id)).size!==w.drops.length)fail('Duplicate dropped item.');
 w.nextDropId=Math.max(Number.isSafeInteger(s.nextDropId)?s.nextDropId:1,...w.drops.map(drop=>/^drop-\d+$/.test(drop.id)?Number(drop.id.slice(5))+1:1));
 w.message='Journey restored. Welcome back!';return w;
}
export function parseSave(text){if(typeof text!=='string'||text.length>5*1024*1024)fail('Save file is too large.');let save;try{save=JSON.parse(text);}catch{fail('Could not read this file. Choose a valid The Wilds JSON save.');}restoreSave(save);return save;}
export function importantProgress(world){
 const p=world.progression;
 return JSON.stringify([world.areaId,world.inventory.allItems,world.inventory.slots.map(i=>i?.id),p.totalXp,p.pendingChoices,p.pendingUpgrades,p.upgrades,p.ranks,p.specials,world.quests,world.story,[...world.discovered],world.hunting,world.drops,world.animals.map(a=>a.health)]);
}
