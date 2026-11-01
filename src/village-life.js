import {WORLD_DATA} from './world-data.js';
import {NPC_TYPES} from './entities.js';
// Willowback's people, area by area: the Port, the Town Square, the Merchant Quarter and the Farm & Training Grounds.
// Each area keeps to 15-20 people (counting the guardians at the blacksmith's), so the lanes feel busy without crowding
// the screen. Nobody lives in the training yard; Drayfus, Mara and Emilia come and go with the story.
// end: a second point the villager walks to and back from. Everyone else stays put.
const M='village-market';
// Who stands where, what they say and where they stroll to live in src/world-data.js, which the world editor writes.
const residents=WORLD_DATA.npcs;
export const residentArea=r=>r.areaId||'village';
export function createVillageResidents(elapsed=0){
 const list=residents.map((r,i)=>({...NPC_TYPES.villager,...r,entityType:'npc',areaId:residentArea(r),npc:true,spriteId:r.spriteId,origin:{x:r.x,y:r.y},phase:i*1.2,...(!r.end&&r.facing?{direction:r.facing}:{})}));
 list.push({...NPC_TYPES.rimejaw,id:'village-rimejaw',name:'Rimejaw',areaId:M,x:1420,y:338,npc:true,creature:true,spriteId:'rimejaw',greeting:'The guardian watches you. Frost catches in the grooves of her scales.'});
 list.push({...NPC_TYPES.flitlynx,id:'village-flitlynx',name:'Flitlynx',areaId:M,x:1420,y:165,sortY:313,npc:true,creature:true,spriteId:'flitlynx',greeting:'A winged cat cleans one paw on the blacksmith’s roof.'});
 updateVillageResidents(list,elapsed);return list;
}
// Ambient patrols are deterministic from saved simulation time. Drawing never moves anyone.
export function updateVillageResidents(list,elapsed){
 for(const n of list){if(!n.origin||!n.end)continue;
  const phase=elapsed*(n.child ? .7 : .22)+n.phase,t=(Math.sin(phase)+1)/2;
  n.x=n.origin.x+(n.end.x-n.origin.x)*t;n.y=n.origin.y+(n.end.y-n.origin.y)*t;
  n.animationState='walk';n.walkTime=elapsed*(n.child?12:7);n.facingX=Math.cos(phase)*(n.end.x-n.origin.x);
 }
}
