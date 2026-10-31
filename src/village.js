// Village geography and collision stay independent of the painted architecture.
export const VILLAGE={id:'village',name:'Willowback Village',width:1920,height:2000,seed:7343,spawn:{x:1800,y:530},exits:[{edge:'east',from:450,to:610,target:'crossroads',entry:{x:65,y:460},label:'Willowbank Crossroads'},{edge:'north',from:690,to:790,target:'training-ground',entry:{x:540,y:780},label:'Training Ground'},{edge:'north',from:1500,to:1620,target:'village-north',entry:{x:800,y:1120},label:'Upper Lanes'}]};
export const VILLAGE_ROADS=[
 [[1920,530],[1680,530],[1570,580],[1290,580],[1140,680],[1000,750]],
 [[1000,750],[850,850],[750,1010],[730,1210]],
 [[1000,750],[1080,740],[1100,620],[1000,550]],[[1000,750],[710,620],[590,570]],
 [[1570,580],[1660,870],[1460,870],[1370,1010]],
 [[1290,580],[1440,460]],[[750,1010],[500,1090]],
 [[750,1010],[1060,1030],[1370,1010]],
 // The path to the training ground: up past the back of the chief's house and north out of the village.
 [[580,340],[575,250],[620,170],[700,110],[740,40],[740,0]],
 // Up to the Upper Lanes, between the north home and the gate fence.
 [[1570,580],[1560,440],[1560,0]]
];
export const VILLAGE_BUILDINGS=[
 {id:'blacksmith',x:1220,y:390,w:180,h:90,roof:'#565d68',trim:'#a6a69c',name:'THE BLACKSMITH',kind:'workshop'},
 {id:'chief-house',x:780,y:340,w:240,h:125,roof:'#7b3531',trim:'#e4d8bb',name:'THE CHIEF’S HOUSE',kind:'chief'},
 {id:'guest-lodge',x:410,y:330,w:180,h:72,roof:'#7a5a3e',trim:'#c9a46a',name:'GUEST LODGE',kind:'lodge'},
 {id:'hearth-inn',x:1000,y:500,w:220,h:95,roof:'#a45543',trim:'#d49668',name:'THE WILLOW HEARTH',kind:'inn'},
 {id:'west-home',x:590,y:510,w:142,h:80,roof:'#96513e',trim:'#c28d61',kind:'home'},
 {id:'north-home',x:1440,y:390,w:154,h:82,roof:'#966145',trim:'#c59364',kind:'home'},
 {id:'netmaker',x:1460,y:800,w:180,h:86,roof:'#547c71',trim:'#91aaa0',name:'NET & NEEDLE',kind:'workshop'},
 {id:'garden-home',x:650,y:830,w:150,h:76,roof:'#a56242',trim:'#d29760',kind:'home'},
 {id:'boathouse',x:410,y:1030,w:156,h:70,roof:'#567d76',trim:'#8faba0',name:'WILLOW DOCKS',kind:'boat'},
 // More family homes, on the west lanes and up by the gate.
 {id:'west-lane-home',x:380,y:560,w:140,h:78,roof:'#6b5a7a',trim:'#b2a2c2',kind:'home'},
 {id:'lane-end-home',x:420,y:820,w:140,h:78,roof:'#7b3f35',trim:'#d39a72',kind:'home'},
 {id:'gate-home',x:1700,y:400,w:140,h:78,roof:'#565d68',trim:'#a6a69c',kind:'home'}
];
// The guard's watchtower, just outside the village gate on the east road (Chapter 7).
export const VILLAGE_PROPS=[{id:'watchtower',x:1715,y:740,kind:'watchtower'},{id:'well',x:1000,y:690,kind:'well'},{id:'produce-stall',x:1180,y:855,kind:'stall'},{id:'fish-stall',x:920,y:975,kind:'fish-stall'}];
export const VILLAGE_PLACES=[
 {id:'village-gate',name:'Willowback Gate',x:1770,y:530,kind:'village-gate',text:'Willowback Village. Beyond the apple baskets and lantern posts, the riverside lanes lead to the commons. The eastern road returns to the crossroads.'},
 {id:'village-commons',name:'The Willow Commons',x:1000,y:740,kind:'village-square',text:'An old well anchors the village commons. Worn paving, shared benches and market awnings make this a natural meeting place.'},
 {id:'village-inn',name:'The Willow Hearth',x:1000,y:555,kind:'village-inn',text:'Warm light spills from the Willow Hearth. Bundles of firewood and a painted fish sign welcome travellers. The door is closed for now.'},
 {id:'village-docks',name:'Willow Docks',x:730,y:1190,kind:'village-dock',text:'Fishing boats rock beside the timber jetty. Cast into the open river from the dock, or follow the quay back toward the commons.'},
 {id:'village-gardens',name:'Kitchen Gardens',x:1370,y:1010,kind:'village-garden',text:'Cabbages, carrots and climbing beans grow behind low woven fences. Watering cans wait beside rain barrels. These gardens feed the village.'},
 {id:'training-gate',name:'Training Ground',x:740,y:60,kind:'training-gate',text:'The path out of the village to the north, past the back of the chief’s house. At the end of it, the village guard trains at sunrise.'},
 {id:'village-netmaker',name:"Netmaker's Yard",x:1460,y:865,kind:'village-workshop',text:'Nets dry outside a small workshop. Floats, rope coils and repaired crab pots cover the yard. The workshop has not opened for trading yet.'}
];
export const villageShore=x=>1145+Math.sin(x*.004)*28+Math.sin(x*.011)*10;
export const villageWaterDistance=(x,y)=>Math.min(villageShore(x)-y,x-(185+Math.sin(y*.006)*24));
export const onVillageDeck=(x,y)=>(x>=685&&x<=775&&y>=1060&&y<=1360)||(x>=520&&x<=940&&y>=1250&&y<=1320);
export function villageBlocked(x,y){
 if(VILLAGE_BUILDINGS.some(b=>Math.abs(x-b.x)<b.w/2+12&&y>b.y-b.h-10&&y<b.y+18))return true;
 return VILLAGE_PROPS.some(p=>p.kind==='watchtower'?Math.abs(x-p.x)<28&&y>p.y-22&&y<p.y+8:p.kind==='well'?Math.hypot(x-p.x,y-p.y)<35:Math.abs(x-p.x)<55&&y>p.y-25&&y<p.y+20);
}
export const villageClear=(x,y)=>x>300&&x<1810&&y>240&&y<1120||onVillageDeck(x,y);
