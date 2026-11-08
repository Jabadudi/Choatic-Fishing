// The Regions game: a separate, story-free game that starts on its own first map, Regions 1.1 Dewdrop Meadow, and
// grows one field map at a time. The Classic game (the story, the whole Reedwater Delta) is untouched and lives at
// /classic/. Here a journey has no story, no townsfolk, no area spawner and no rabbits: only the field map's own
// monsters, placed in bunches (src/field-play.js createBunches), and a sealed gate at the east end that opens once
// every one of them is down.
import {AREAS,areaFor} from './wilds.js';
import {fieldMap,FIELD_MAPS} from './field-maps.js';
import {ANIMAL_TYPES} from './entities.js';
import {createBunches,mapCleared,fieldProgress} from './field-play.js';
import {giveStarterSword} from './warrior.js';
import {CAMP,DUNGEON,createDungeon,leftRun} from './dungeon.js';
import {createCollection,applyCollection} from './collection.js';
export const REGION_START='dewdrop-meadow';
// The Regions maps in order, west to east: 1.1 Dewdrop Meadow, 1.2 Mossroot Trail, 1.3 Saltspray Shore.
export const REGION_MAPS=Object.freeze(Object.keys(FIELD_MAPS).filter(id=>FIELD_MAPS[id].bunches).sort((a,b)=>FIELD_MAPS[a].code.localeCompare(FIELD_MAPS[b].code,undefined,{numeric:true})));
// Every map's monsters, each in its own area; only the map Eli stands in moves and fights.
const allBunches=world=>REGION_MAPS.flatMap(id=>createBunches(world,id));
const foes=(id,n)=>{const name=(ANIMAL_TYPES[fieldMap(id)?.species]?.name||'monster').toLowerCase();return n===1?name:`${name}s`;};
const arrival=(world,id)=>`${fieldMap(id).code} ${areaFor(id).name} · ${mapCleared(world,id)?'Cleared. The gate east stands open.':`Defeat every ${foes(id,1)} to open the gate east.`}`;
// How close to the east edge Eli must walk for the gate to speak.
export const GATE_REACH=150;
// A new Regions game starts in Wilds Camp, by the portal into the dungeon (src/dungeon.js).
export function startRegions(world){
 Object.assign(world,{regions:true,story:null,npcs:[],rabbits:[],spawns:null,areaId:CAMP,dungeon:createDungeon(),collection:createCollection()});
 Object.assign(world.player,AREAS[CAMP].spawn,{name:'Eli',spriteId:'eli'});
 world.wildlife=allBunches(world);
 giveStarterSword(world);
 world.message=`Wilds Camp · Step up to the portal to enter the dungeon, ${DUNGEON.name}.`;
}
// A restored Regions journey rebuilds its map's monsters from the field map state (the ones down stay down).
export function restoreRegions(world){
 Object.assign(world,{regions:true,story:null,npcs:[],rabbits:[],spawns:null});
 Object.assign(world.player,{name:'Eli',spriteId:'eli'});
 world.wildlife=allBunches(world);
 // A save from before the dungeon, standing in one of its maps, carries on as a run.
 world.collection??=createCollection();applyCollection(world);
 world.dungeon??=createDungeon();if(!world.dungeon.run&&DUNGEON.maps.includes(world.areaId))world.dungeon.run={startedAt:world.elapsed};
}
// Walking off the east edge into the next map needs the gate open (this map cleared); walking back west is always open.
// Returns the arrival message, or null when the way is shut (the gate message is already up).
export function regionCrossing(world,next){
 if(!world.regions)return '';
 if(next.areaId===CAMP)return leftRun(world)||'Wilds Camp';
 const from=REGION_MAPS.indexOf(world.areaId),to=REGION_MAPS.indexOf(next.areaId);
 if(to>from&&!mapCleared(world,world.areaId))return null;
 return arrival(world,next.areaId);
}
// The east gate: shut until the map is cleared, then it opens on to the next map. The last map's gate still points
// at a map to be built.
export function updateRegions(world){
 if(!world.regions)return;
 applyCollection(world);
 const area=areaFor(world.areaId),p=world.player;
 if(p.x<area.width-GATE_REACH){world.atGate=false;return;}
 if(world.atGate)return;world.atGate=true;
 const f=fieldProgress(world);if(!f)return;
 const next=area.exits.find(e=>e.edge==='east'),left=f.goal-f.kills;
 world.message=!mapCleared(world,world.areaId)?`The gate is sealed. ${left} ${foes(world.areaId,left)} ${left===1?'is':'are'} still about.`
  :next?`The gate stands open. Walk east into ${next.label}.`:`The gate stands open. The next map, ${nextCode(world.areaId)}, is still being built.`;
}
const nextCode=id=>{const [r,m]=fieldMap(id).code.split('.').map(Number);return `${r}.${m+1}`;};
