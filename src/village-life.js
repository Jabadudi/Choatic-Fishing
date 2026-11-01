import {NPC_TYPES} from './entities.js';
// Willowback's people, area by area: the Port, the Town Square, the Merchant Quarter and the Farm & Training Grounds.
// Each area keeps to 15-20 people (counting the guardians at the blacksmith's), so the lanes feel busy without crowding
// the screen. Nobody lives in the training yard; Drayfus, Mara and Emilia come and go with the story.
// end: a second point the villager walks to and back from. Everyone else stays put.
const P='village-port',M='village-market',F='village-farm';
const residents=[
 // 12.1 The Port: fishers, net menders and the fish market on the upper deck; anglers on the dock, jetties and pier.
 {id:'village-fisher',name:'Fisher',areaId:P,x:700,y:640,greeting:'The boats are sound. We were lucky last night.',spriteId:'villager-fisher'},
 {id:'net-carrier',name:'Net carrier',areaId:P,x:300,y:300,end:{x:560,y:300},greeting:'We’re mending what the night left behind.',spriteId:'villager-net'},
 {id:'commons-washer',name:'Washer',areaId:P,x:420,y:650,greeting:'Lagoon water gets everything clean. Eventually.',spriteId:'villager-washer'},
 {id:'commons-cooper',name:'Cooper',areaId:P,x:1550,y:250,greeting:'Every fish barrel in Willowback, I made. Or my mother did.',spriteId:'villager-cooper'},
 {id:'harbourmaster',name:'Harbourmaster',areaId:P,x:980,y:911,greeting:'No boats for hire yet. Ask me again when the weather’s turned.',spriteId:'villager-elder'},
 {id:'fishmonger',name:'Fishmonger',areaId:P,x:1250,y:378,greeting:'Eels! Perch! A crab with opinions!',spriteId:'villager-trader'},
 {id:'fishmonger-two',name:'Fishmonger',areaId:P,x:1420,y:378,greeting:'Don’t listen to him. My crab is calmer.',spriteId:'villager-basket'},
 {id:'port-child',name:'Village child',areaId:P,x:700,y:300,end:{x:1180,y:300},greeting:'Race you to the stairs!',child:true,spriteId:'villager-child-three'},
 {id:'port-porter',name:'Porter',areaId:P,x:1150,y:640,end:{x:1450,y:640},greeting:'Up the stairs with a full crate, down with an empty one. All morning.',spriteId:'villager-farmer'},
 {id:'jetty-angler',name:'Angler',areaId:P,x:1165,y:780,greeting:'Shh. They bite at the turn of the tide.',spriteId:'villager-net'},
 {id:'jetty-angler-two',name:'Angler',areaId:P,x:1409,y:790,greeting:'Nothing yet. Nothing yesterday either.',spriteId:'villager-washer'},
 {id:'port-guard',name:'Guard',areaId:P,x:866,y:170,greeting:'Mind the stairs, they’re wet. They’re always wet.',spriteId:'villager-guard'},
 {id:'rope-maker',name:'Rope maker',areaId:P,x:200,y:250,greeting:'Three strands, twisted tight. Want to try? No? Nobody does.',spriteId:'villager-potter'},
 {id:'gull-child',name:'Village child',areaId:P,x:750,y:747,greeting:'I’m feeding the gulls. They’re not supposed to have this bread.',child:true,spriteId:'villager-child-five'},
 {id:'port-elder',name:'Elder',areaId:P,x:1700,y:260,greeting:'When I was a girl there was a beach down there. Then the cliff came down in the big storm.',spriteId:'villager-elder-two'},
 // 12.2 The Town Square: the commons, the well and the Great Willow.
 {id:'child-one',name:'Village child',x:1180,y:770,end:{x:1420,y:770},greeting:'Did you see the wolves last night?',child:true,spriteId:'villager-child-one'},
 {id:'child-two',name:'Village child',x:1420,y:600,end:{x:1180,y:600},greeting:'Bet you can’t catch me!',child:true,spriteId:'villager-child-two'},
 {id:'commons-elder',name:'Elder',x:1150,y:640,greeting:'I’ve sat on this bench for sixty years. The commons was smaller then. So was I.',spriteId:'villager-elder'},
 {id:'commons-lamplighter',name:'Lamplighter',x:1040,y:560,end:{x:1560,y:560},greeting:'Every lantern from the gate to the docks. Twice a day, every day.',spriteId:'villager-lamplighter'},
 {id:'commons-potter',name:'Potter',x:1000,y:800,end:{x:1100,y:860},greeting:'Mind the pots. Mind the pots!',spriteId:'villager-potter'},
 {id:'commons-child',name:'Village child',x:700,y:760,end:{x:860,y:800},greeting:'My big brother says you came out of the lake.',child:true,spriteId:'villager-child-three'},
 {id:'commons-trader',name:'Trader',x:1500,y:800,greeting:'Apples from the farm orchard. Two for a mark, three if you smile.',spriteId:'villager-trader'},
 {id:'gate-guard',name:'Guard',x:1760,y:560,greeting:'Merchant Quarter that way. The Port’s down the lane past the willow.',spriteId:'villager-guard'},
 {id:'square-washer',name:'Washer',x:180,y:560,greeting:'Don’t walk under my sheets with those muddy hands.',spriteId:'villager-washer'},
 {id:'square-guard',name:'Guard',x:200,y:880,greeting:'Somebody’s always up the tower. Today it’s not me. Today I guard the ladder.',spriteId:'villager-guard'},
 {id:'square-neighbour',name:'Neighbour',x:560,y:900,greeting:'You’re the one staying at the lodge? Eat something. You look thin.',spriteId:'villager-basket'},
 {id:'square-child',name:'Village child',x:1450,y:900,end:{x:1450,y:1000},greeting:'I’m going to be a guard when I’m big. Like Drayfus.',child:true,spriteId:'villager-child-four'},
 {id:'traveller',name:'Traveller',x:480,y:640,greeting:'Three days on the road from the coast. The lodge beds are the best thing that’s happened to me all week.',spriteId:'villager-net'},
 {id:'square-elder-two',name:'Elder',x:1460,y:640,greeting:'The willow was here before the village. We just built round it.',spriteId:'villager-elder-two'},
 {id:'lanes-sweeper',name:'Sweeper',x:1350,y:860,end:{x:1150,y:860},greeting:'Somebody has to sweep the commons. Today it’s me.',spriteId:'villager-net'},
 // 12.3 The Merchant Quarter: Lantern Square's stalls, the shops and the smithy.
 {id:'village-smith',name:'Blacksmith',areaId:M,x:1250,y:400,greeting:'Give the guardian space. She had a long night.',spriteId:'villager-smith'},
 {id:'baker',name:'Baker',areaId:M,x:1200,y:875,greeting:'Up since the fourth bell. Try the honey rye, it’s still warm.',spriteId:'villager-baker'},
 {id:'weaver',name:'Weaver',areaId:M,x:190,y:850,greeting:'That shirt is a disgrace. Come back when you have marks.',spriteId:'villager-weaver'},
 {id:'herbalist',name:'Herbalist',areaId:M,x:955,y:450,greeting:'Willow bark for the aches. You look like you need a whole tree.',spriteId:'villager-herbalist'},
 {id:'carpenter',name:'Carpenter',areaId:M,x:750,y:1180,greeting:'Half the roofs in the quarter leaked after the storm. Busy month.',spriteId:'villager-carpenter'},
 {id:'lanes-lamplighter',name:'Lamplighter',areaId:M,x:520,y:500,end:{x:1000,y:500},greeting:'Lantern Square has twelve lanterns. I have one ladder.',spriteId:'villager-lamplighter'},
 {id:'lanes-washer',name:'Washer',areaId:M,x:100,y:660,greeting:'Sun’s out. Everything’s going on the line.',spriteId:'villager-washer'},
 {id:'lanes-elder',name:'Elder',areaId:M,x:650,y:630,greeting:'Oscar’s grandson? You have his ears. Unlucky.',spriteId:'villager-elder'},
 {id:'lanes-elder-two',name:'Elder',areaId:M,x:900,y:640,greeting:'Don’t listen to him. They’re perfectly good ears.',spriteId:'villager-elder-two'},
 {id:'lanes-trader',name:'Trader',areaId:M,x:770,y:432,greeting:'Turnips, onions, the last of the beans. All of it grown out past the gate.',spriteId:'villager-trader'},
 {id:'lanes-child',name:'Village child',areaId:M,x:600,y:660,end:{x:940,y:660},greeting:'Tag! You’re it!',child:true,spriteId:'villager-child-four'},
 {id:'lanes-child-two',name:'Village child',areaId:M,x:400,y:300,end:{x:390,y:520},greeting:'Have you seen the forge? You can feel it from here.',child:true,spriteId:'villager-child-five'},
 {id:'lanes-cooper',name:'Cooper',areaId:M,x:330,y:950,end:{x:700,y:950},greeting:'Rolling barrels uphill is how you get legs like mine.',spriteId:'villager-cooper'},
 {id:'lanes-guard',name:'Gate guard',areaId:M,x:1470,y:620,greeting:'Farms and the training yard past the gate. Crossroads after that.',spriteId:'villager-guard'},
 {id:'lanes-porter',name:'Porter',areaId:M,x:1000,y:552,end:{x:1450,y:535},greeting:'Flour for the bakery. Every sack, every morning, all the way from the mill.',spriteId:'villager-farmer'},
 {id:'lanes-neighbour',name:'Neighbour',areaId:M,x:1050,y:960,greeting:'—and then she said the goose was hers all along!',spriteId:'villager-potter'},
 {id:'lanes-neighbour-two',name:'Neighbour',areaId:M,x:1085,y:960,greeting:'She never! Oh, hello. We weren’t talking about anyone.',spriteId:'villager-basket'},
 {id:'lanes-child-three',name:'Village child',areaId:M,x:1100,y:700,end:{x:1400,y:700},greeting:'Have you got any sweets? The sweet stall gives us the broken ones.',child:true,spriteId:'villager-child-one'},
 // 12.4 The Farm & Training Grounds: the mill, the barn, the fields and the pen.
 {id:'miller',name:'Miller',areaId:F,x:780,y:610,greeting:'The wheel never stops. Neither do I, apparently.',spriteId:'villager-miller'},
 {id:'mill-farmer',name:'Farmer',areaId:F,x:330,y:560,end:{x:330,y:800},greeting:'Good barley this year. The storm flattened the east strip, mind.',spriteId:'villager-farmer'},
 {id:'mill-reaper',name:'Reaper',areaId:F,x:200,y:700,greeting:'Mind where you step. Every stalk is somebody’s bread.',spriteId:'villager-fisher'},
 {id:'mill-reaper-two',name:'Reaper',areaId:F,x:480,y:650,greeting:'The scarecrow is called Fenwick. He’s useless.',spriteId:'villager-basket'},
 {id:'shepherd',name:'Shepherd',areaId:F,x:620,y:1980,greeting:'Forty-one sheep. Forty-two, if you count the one that thinks it’s a dog.',spriteId:'villager-shepherd'},
 {id:'tanner',name:'Tanner',areaId:F,x:1500,y:1000,greeting:'Yes, it smells. That’s why they put me out here.',spriteId:'villager-tanner'},
 {id:'mill-farmhand',name:'Farmhand',areaId:F,x:720,y:700,end:{x:720,y:1000},greeting:'Hay to the barn, sacks to the mill, back again. All day.',spriteId:'villager-farmer'},
 {id:'mill-child',name:'Village child',areaId:F,x:400,y:1120,end:{x:800,y:1035},greeting:'I fell in the river once. On purpose.',child:true,spriteId:'villager-child-three'},
 {id:'porter',name:'Porter',areaId:F,x:1010,y:800,greeting:'Granary’s full to the rafters. Willowback eats well this winter.',spriteId:'villager-cooper'},
 {id:'east-farmhand',name:'Farmhand',areaId:F,x:1600,y:760,end:{x:1600,y:860},greeting:'Crossroads is east along the river. Don’t let the road fool you, it’s further than it looks.',spriteId:'villager-smith'},
 {id:'mill-washer',name:'Washer',areaId:F,x:1040,y:470,greeting:'River water’s colder than the lagoon. Wakes you right up.',spriteId:'villager-washer'},
 {id:'bridge-child',name:'Village child',areaId:F,x:1200,y:500,greeting:'There’s a fish under the landing as big as my arm. I’ve named him.',child:true,spriteId:'villager-child-two'},
 {id:'mill-elder',name:'Elder',areaId:F,x:320,y:1060,greeting:'My father farmed this strip, and his mother before him.',spriteId:'villager-elder-two'},
 {id:'barn-hand',name:'Barn hand',areaId:F,x:1170,y:800,greeting:'The cows are in a mood. Don’t go in the barn.',spriteId:'villager-potter'},
 {id:'beekeeper',name:'Beekeeper',areaId:F,x:1800,y:700,greeting:'Stand still and they won’t sting. Mostly.',spriteId:'villager-herbalist'},
 {id:'stream-farmer',name:'Farmer',areaId:F,x:450,y:1500,greeting:'Quiet out here. Just me, the cabbages and the crows.',spriteId:'villager-trader'},
 {id:'basket-carrier',name:'Basket carrier',areaId:F,x:300,y:1250,end:{x:560,y:1250},greeting:'The fields still need tending. Storm or no storm.',spriteId:'villager-basket'}
];
export const residentArea=r=>r.areaId||'village';
export function createVillageResidents(elapsed=0){
 const list=residents.map((r,i)=>({...NPC_TYPES.villager,...r,entityType:'npc',areaId:residentArea(r),npc:true,spriteId:r.spriteId,origin:{x:r.x,y:r.y},phase:i*1.2}));
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
