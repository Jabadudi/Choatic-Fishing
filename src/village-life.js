import {NPC_TYPES} from './entities.js';
// Willowback's people, area by area: the commons by the river, the Upper Lanes and Millside. Each area keeps to 15-20
// people (counting the guardians on the commons), so the lanes feel busy without crowding the screen.
// end: a second point the villager walks to and back from. Everyone else stays put.
const residents=[
 // The commons.
 {id:'net-carrier',name:'Net carrier',x:1430,y:650,end:{x:1560,y:650},greeting:'We’re mending what the night left behind.',spriteId:'villager-net'},
 {id:'basket-carrier',name:'Basket carrier',x:950,y:820,end:{x:1080,y:820},greeting:'The gardens still need tending. Storm or no storm.',spriteId:'villager-basket'},
 {id:'village-smith',name:'Blacksmith',x:1340,y:470,greeting:'Give the guardian space. She had a long night.',spriteId:'villager-smith'},
 {id:'village-fisher',name:'Fisher',x:790,y:1040,greeting:'The boats are sound. We were lucky last night.',spriteId:'villager-fisher'},
 {id:'child-one',name:'Village child',x:920,y:750,end:{x:1070,y:750},greeting:'Did you see the wolves last night?',child:true,spriteId:'villager-child-one'},
 {id:'child-two',name:'Village child',x:1070,y:790,end:{x:920,y:790},greeting:'Bet you can’t catch me!',child:true,spriteId:'villager-child-two'},
 {id:'commons-lamplighter',name:'Lamplighter',x:1300,y:585,end:{x:1500,y:585},greeting:'Every lantern from the gate to the docks. Twice a day, every day.',spriteId:'villager-lamplighter'},
 {id:'commons-washer',name:'Washer',x:600,y:1110,greeting:'River water gets everything clean. Eventually.',spriteId:'villager-washer'},
 {id:'commons-elder',name:'Elder',x:850,y:805,greeting:'I’ve sat on this bench for sixty years. The commons was smaller then. So was I.',spriteId:'villager-elder'},
 {id:'commons-trader',name:'Trader',x:1180,y:905,greeting:'Apples from the Millside orchards. Two for a mark, three if you smile.',spriteId:'villager-trader'},
 {id:'commons-cooper',name:'Cooper',x:1540,y:1000,greeting:'Every barrel in Willowback, I made. Or my mother did.',spriteId:'villager-cooper'},
 {id:'commons-potter',name:'Potter',x:730,y:640,end:{x:880,y:700},greeting:'Mind the pots. Mind the pots!',spriteId:'villager-potter'},
 {id:'commons-child',name:'Village child',x:830,y:880,end:{x:760,y:990},greeting:'My big brother says you came out of the lake.',child:true,spriteId:'villager-child-three'},
 {id:'gate-guard',name:'Gate guard',x:1700,y:585,greeting:'Crossroads that way. Upper Lanes up the path behind me.',spriteId:'villager-guard'},
 // The Upper Lanes.
 {id:'baker',name:'Baker',areaId:'village-north',x:610,y:372,greeting:'Up since the fourth bell. Try the honey rye, it’s still warm.',spriteId:'villager-baker'},
 {id:'weaver',name:'Weaver',areaId:'village-north',x:990,y:372,greeting:'That shirt is a disgrace. Come back when you have marks.',spriteId:'villager-weaver'},
 {id:'herbalist',name:'Herbalist',areaId:'village-north',x:420,y:915,greeting:'Willow bark for the aches. You look like you need a whole tree.',spriteId:'villager-herbalist'},
 {id:'carpenter',name:'Carpenter',areaId:'village-north',x:1400,y:915,greeting:'Half the roofs in the lanes leaked after the storm. Busy month.',spriteId:'villager-carpenter'},
 {id:'lanes-lamplighter',name:'Lamplighter',areaId:'village-north',x:200,y:640,end:{x:700,y:640},greeting:'Lantern Square has twelve lanterns. I have one ladder.',spriteId:'villager-lamplighter'},
 {id:'lanes-washer',name:'Washer',areaId:'village-north',x:200,y:400,greeting:'Don’t walk under my sheets with those muddy hands.',spriteId:'villager-washer'},
 {id:'lanes-elder',name:'Elder',areaId:'village-north',x:740,y:840,greeting:'Oscar’s grandson? You have his ears. Unlucky.',spriteId:'villager-elder'},
 {id:'lanes-elder-two',name:'Elder',areaId:'village-north',x:860,y:840,greeting:'Don’t listen to him. They’re perfectly good ears.',spriteId:'villager-elder-two'},
 {id:'lanes-trader',name:'Trader',areaId:'village-north',x:940,y:762,greeting:'Turnips, onions, the last of the beans. All of it grown up at Millside.',spriteId:'villager-trader'},
 {id:'lanes-child',name:'Village child',areaId:'village-north',x:650,y:680,end:{x:950,y:680},greeting:'Tag! You’re it!',child:true,spriteId:'villager-child-four'},
 {id:'lanes-child-two',name:'Village child',areaId:'village-north',x:800,y:560,end:{x:800,y:420},greeting:'I’m going to be a guard when I’m big. Like Drayfus.',child:true,spriteId:'villager-child-five'},
 {id:'lanes-cooper',name:'Cooper',areaId:'village-north',x:200,y:980,end:{x:700,y:980},greeting:'Rolling barrels uphill is how you get legs like mine.',spriteId:'villager-cooper'},
 {id:'lanes-guard',name:'Guard',areaId:'village-north',x:800,y:1100,end:{x:800,y:760},greeting:'Quiet up here. That’s how we like it.',spriteId:'villager-guard'},
 {id:'lanes-porter',name:'Porter',areaId:'village-north',x:900,y:640,end:{x:1500,y:640},greeting:'Flour for the bakery. Every sack, every morning.',spriteId:'villager-farmer'},
 {id:'lanes-neighbour',name:'Neighbour',areaId:'village-north',x:1180,y:980,greeting:'—and then she said the goose was hers all along!',spriteId:'villager-potter'},
 {id:'lanes-neighbour-two',name:'Neighbour',areaId:'village-north',x:1215,y:980,greeting:'She never! Oh, hello. We weren’t talking about anyone.',spriteId:'villager-basket'},
 {id:'lanes-child-three',name:'Village child',areaId:'village-north',x:1100,y:945,end:{x:1450,y:945},greeting:'Have you got any sweets? The baker gives us sweets.',child:true,spriteId:'villager-child-one'},
 {id:'lanes-sweeper',name:'Sweeper',areaId:'village-north',x:600,y:590,end:{x:600,y:660},greeting:'Somebody has to sweep the square. Today it’s me.',spriteId:'villager-net'},
 // Millside.
 {id:'miller',name:'Miller',areaId:'village-mill',x:1000,y:560,greeting:'The wheel never stops. Neither do I, apparently.',spriteId:'villager-miller'},
 {id:'mill-farmer',name:'Farmer',areaId:'village-mill',x:400,y:560,end:{x:400,y:370},greeting:'Good barley this year. The storm flattened the east strip, mind.',spriteId:'villager-farmer'},
 {id:'mill-reaper',name:'Reaper',areaId:'village-mill',x:300,y:300,greeting:'Mind where you step. Every stalk is somebody’s bread.',spriteId:'villager-fisher'},
 {id:'mill-reaper-two',name:'Reaper',areaId:'village-mill',x:800,y:280,greeting:'The scarecrow is called Fenwick. He’s useless.',spriteId:'villager-basket'},
 {id:'shepherd',name:'Shepherd',areaId:'village-mill',x:830,y:1060,greeting:'Forty-one sheep. Forty-two, if you count the one that thinks it’s a dog.',spriteId:'villager-shepherd'},
 {id:'tanner',name:'Tanner',areaId:'village-mill',x:480,y:945,greeting:'Yes, it smells. That’s how you know it’s working.',spriteId:'villager-tanner'},
 {id:'mill-farmhand',name:'Farmhand',areaId:'village-mill',x:700,y:700,end:{x:700,y:990},greeting:'Hay to the barn, sacks to the mill, back again. All day.',spriteId:'villager-farmer'},
 {id:'mill-child',name:'Village child',areaId:'village-mill',x:500,y:645,end:{x:860,y:645},greeting:'I fell in the mill stream once. On purpose.',child:true,spriteId:'villager-child-three'},
 {id:'porter',name:'Porter',areaId:'village-mill',x:780,y:565,greeting:'Granary’s full to the rafters. Willowback eats well this winter.',spriteId:'villager-cooper'},
 {id:'east-farmhand',name:'Farmhand',areaId:'village-mill',x:1420,y:700,end:{x:1420,y:960},greeting:'Bridge is the only way over. Don’t try to jump it.',spriteId:'villager-smith'},
 {id:'mill-washer',name:'Washer',areaId:'village-mill',x:1090,y:800,greeting:'Stream water’s colder than the river. Wakes you right up.',spriteId:'villager-washer'},
 {id:'bridge-child',name:'Village child',areaId:'village-mill',x:1160,y:620,greeting:'There’s a fish under the bridge as big as my arm. I’ve named him.',child:true,spriteId:'villager-child-two'},
 {id:'mill-elder',name:'Elder',areaId:'village-mill',x:250,y:580,greeting:'My father farmed this strip, and his mother before him.',spriteId:'villager-elder-two'},
 {id:'barn-hand',name:'Barn hand',areaId:'village-mill',x:330,y:950,greeting:'The cows are in a mood. Don’t go in the barn.',spriteId:'villager-potter'},
 {id:'beekeeper',name:'Beekeeper',areaId:'village-mill',x:1480,y:760,greeting:'Stand still and they won’t sting. Mostly.',spriteId:'villager-herbalist'},
 {id:'stream-farmer',name:'Farmer',areaId:'village-mill',x:1460,y:960,greeting:'Quiet this side of the stream. Just me, the bees and the mud.',spriteId:'villager-trader'}
];
export const residentArea=r=>r.areaId||'village';
export function createVillageResidents(elapsed=0){
 const list=residents.map((r,i)=>({...NPC_TYPES.villager,...r,entityType:'npc',areaId:residentArea(r),npc:true,spriteId:r.spriteId,origin:{x:r.x,y:r.y},phase:i*1.2}));
 list.push({...NPC_TYPES.rimejaw,id:'village-rimejaw',name:'Rimejaw',areaId:'village',x:1220,y:438,npc:true,creature:true,spriteId:'rimejaw',greeting:'The guardian watches you. Frost catches in the grooves of her scales.'});
 list.push({...NPC_TYPES.flitlynx,id:'village-flitlynx',name:'Flitlynx',areaId:'village',x:1220,y:265,sortY:413,npc:true,creature:true,spriteId:'flitlynx',greeting:'A winged cat cleans one paw on the blacksmith’s roof.'});
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
