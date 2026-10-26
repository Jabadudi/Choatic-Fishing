import {NPC_TYPES} from './entities.js';
const residents=[
 {id:'net-carrier',name:'Net carrier',x:1430,y:650,end:{x:1560,y:650},greeting:'We’re mending what the night left behind.',spriteId:'villager-net'},
 {id:'basket-carrier',name:'Basket carrier',x:950,y:820,end:{x:1080,y:820},greeting:'The gardens still need tending. Storm or no storm.',spriteId:'villager-basket'},
 {id:'village-smith',name:'Blacksmith',x:1340,y:470,greeting:'Give the guardian space. She had a long night.',spriteId:'villager-smith'},
 {id:'village-fisher',name:'Fisher',x:790,y:1040,greeting:'The boats are sound. We were lucky last night.',spriteId:'villager-fisher'},
 {id:'child-one',name:'Village child',x:920,y:750,end:{x:1070,y:750},greeting:'Did you see the wolves last night?',child:true,spriteId:'villager-child-one'},
 {id:'child-two',name:'Village child',x:1070,y:790,end:{x:920,y:790},greeting:'Bet you can’t catch me!',child:true,spriteId:'villager-child-two'}
];
export function createVillageResidents(elapsed=0){
 const list=residents.map((r,i)=>({...NPC_TYPES.villager,...r,entityType:'npc',areaId:'village',npc:true,spriteId:r.spriteId,origin:{x:r.x,y:r.y},phase:i*1.2}));
 list.push({...NPC_TYPES.rimejaw,id:'village-rimejaw',name:'Rimejaw',areaId:'village',x:1220,y:438,npc:true,creature:true,spriteId:'rimejaw',greeting:'The guardian watches you. Frost catches in the grooves of her scales.'});
 list.push({...NPC_TYPES.flitlynx,id:'village-flitlynx',name:'Flitlynx',areaId:'village',x:1220,y:265,sortY:413,npc:true,creature:true,spriteId:'flitlynx',greeting:'A winged cat cleans one paw on the blacksmith’s roof.'});
 updateVillageResidents(list,elapsed);return list;
}
// Ambient patrols are deterministic from saved simulation time. Drawing never moves anyone.
export function updateVillageResidents(list,elapsed){
 for(const n of list){if(n.areaId!=='village'||!n.origin||!n.end)continue;
  const phase=elapsed*(n.child ? .7 : .22)+n.phase,t=(Math.sin(phase)+1)/2;
  n.x=n.origin.x+(n.end.x-n.origin.x)*t;n.y=n.origin.y+(n.end.y-n.origin.y)*t;
  n.animationState='walk';n.walkTime=elapsed*(n.child?12:7);n.facingX=Math.cos(phase)*(n.end.x-n.origin.x);
 }
}
