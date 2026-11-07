// The Regions game: a separate, story-free game that starts on its own first map, Regions 1.1 Dewdrop Meadow, and
// grows one field map at a time. The Classic game (the story, the whole Reedwater Delta) is untouched and lives at
// /classic/. Here a journey has no story, no townsfolk, no area spawner and no rabbits: only the field map's own
// monsters, placed in bunches (src/field-play.js createBunches), and a sealed gate at the east end that opens once
// every one of them is down.
import {AREAS,areaFor} from './wilds.js';
import {fieldMap} from './field-maps.js';
import {createBunches,mapCleared,fieldProgress} from './field-play.js';
import {giveStarterSword} from './warrior.js';
export const REGION_START='dewdrop-meadow';
// How close to the east edge Eli must walk for the gate to speak.
export const GATE_REACH=150;
export function startRegions(world){
 Object.assign(world,{regions:true,story:null,npcs:[],rabbits:[],spawns:null,areaId:REGION_START});
 Object.assign(world.player,AREAS[REGION_START].spawn,{name:'Eli',spriteId:'eli'});
 world.wildlife=createBunches(world,REGION_START);
 giveStarterSword(world);
 world.message=`${fieldMap(REGION_START).code} ${areaFor(REGION_START).name} · Defeat every slime to open the gate east.`;
}
// A restored Regions journey rebuilds its map's monsters from the field map state (the ones down stay down).
export function restoreRegions(world){
 Object.assign(world,{regions:true,story:null,npcs:[],rabbits:[],spawns:null});
 Object.assign(world.player,{name:'Eli',spriteId:'eli'});
 world.wildlife=createBunches(world,world.areaId);
}
// The east gate: shut until the map is cleared, then it points on to the next map, which is still to be built.
export function updateRegions(world){
 if(!world.regions)return;
 const area=areaFor(world.areaId),p=world.player;
 if(p.x<area.width-GATE_REACH){world.atGate=false;return;}
 if(world.atGate)return;world.atGate=true;
 const f=fieldProgress(world);if(!f)return;
 world.message=mapCleared(world,world.areaId)?'The gate stands open. The next map, 1.2, is still being built.':`The gate is sealed. ${f.goal-f.kills} ${f.goal-f.kills===1?'slime is':'slimes are'} still bouncing about the meadow.`;
}
