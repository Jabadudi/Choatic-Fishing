// 12.2 Town Square: the heart of Willowback. The Willow Commons (an oval of worn paving with the old well and the Great
// Willow), the chief's house to the north, the guest lodge to the west, the Willow Hearth to the north-east and the
// watchtower over the lagoon. Geometry and collision only; the art is in village-art.js and the people in village-life.js.
// The main street leaves east for the Merchant Quarter and a lane drops south to the Port. The track north into the
// trees is for 4 Whispering Forest Edge, which is not open yet.
export const VILLAGE={id:'village',name:'Willowback Town Square',width:1920,height:1160,seed:7343,spawn:{x:1820,y:590},exits:[
 {edge:'east',from:520,to:660,target:'village-market',entry:{x:70,y:590},label:'Merchant Quarter'},
 {edge:'south',from:800,to:940,target:'village-port',entry:{x:870,y:70},label:'The Port'}]};
export const COMMONS={x:1300,y:690,rx:430,ry:210};
export const VILLAGE_ROADS=[
 // The main street, east to the Merchant Quarter.
 [[1920,590],[1760,600],[1640,640]],
 // The lane down to the Port.
 [[1010,850],[930,980],[870,1160]],
 // West to the guest lodge and the watchtower.
 [[880,700],[620,710],[400,740],[180,790]],[[400,592],[400,740]],
 // The track north into the trees (closed for now), and the short paths to the chief's door and the Willow Hearth.
 [[960,540],[860,390],[740,210],[680,40]],[[1250,350],[1250,480]],[[1700,464],[1660,520]]
];
export const VILLAGE_BUILDINGS=[
 {id:'chief-house',x:1250,y:330,w:240,h:125,roof:'#7b3531',trim:'#e4d8bb',name:'THE CHIEF’S HOUSE',kind:'chief'},
 {id:'guest-lodge',x:400,y:560,w:180,h:72,roof:'#7a5a3e',trim:'#c9a46a',name:'GUEST LODGE',kind:'lodge'},
 {id:'hearth-inn',x:1700,y:440,w:220,h:95,roof:'#a45543',trim:'#d49668',name:'THE WILLOW HEARTH',kind:'inn'},
 // Family homes with small gardens round the edges.
 {id:'north-home',x:230,y:260,w:140,h:78,roof:'#a56242',trim:'#d29760',kind:'home'},
 {id:'track-home',x:1000,y:380,w:140,h:78,roof:'#7a5a3e',trim:'#c9a46a',kind:'home'},
 {id:'west-home',x:330,y:900,w:142,h:80,roof:'#96513e',trim:'#c28d61',kind:'home'},
 {id:'garden-home',x:620,y:1030,w:150,h:76,roof:'#a56242',trim:'#d29760',kind:'home'},
 {id:'lane-end-home',x:1110,y:1070,w:140,h:78,roof:'#547c71',trim:'#91aaa0',kind:'home'},
 {id:'east-home',x:1820,y:870,w:140,h:78,roof:'#7a5a3e',trim:'#c9a46a',kind:'home'},
 {id:'gate-home',x:1620,y:1050,w:140,h:78,roof:'#6b5a7a',trim:'#b2a2c2',kind:'home'}
];
// The guard's watchtower over the lagoon at the west end (Chapter 7), the well, the Great Willow and the notice board.
export const VILLAGE_PROPS=[{id:'watchtower',x:150,y:800,kind:'watchtower'},{id:'well',x:1300,y:690,kind:'well'},{id:'great-willow',x:920,y:690,kind:'willow'},{id:'notice-board',x:1590,y:700,kind:'notice'}];
export const GARDENS=[[60,390,230,130],[440,1080,120,70],[1420,980,120,80],[1720,960,150,70]];
export const VILLAGE_PLACES=[
 {id:'village-commons',name:'The Willow Commons',x:1300,y:760,kind:'village-square',text:'An oval of worn paving with the old well at its heart. Benches, lantern posts and a notice board: everybody in Willowback crosses here a dozen times a day.'},
 {id:'great-willow',name:'The Great Willow',x:920,y:740,kind:'village-tree',text:'The tree the village is named for. Its branches sweep the paving, and the children say it is older than the river.'},
 {id:'village-inn',name:'The Willow Hearth',x:1700,y:500,kind:'village-inn',text:'Warm light spills from the Willow Hearth. Bundles of firewood and a painted fish sign welcome travellers. The door is closed for now.'},
 {id:'village-watchtower',name:'The Watchtower',x:150,y:850,kind:'village-tower',text:'A tall timber tower at the west end of the village, looking out over the lagoon. Somebody is always up there.'},
 {id:'notice-board',name:'Notice Board',x:1590,y:760,kind:'village-sign',text:'Lost goats, a dance at the Hearth, a reward for a stolen ham. And, pinned in the middle, the guard rota.'},
 {id:'forest-track',name:'The Forest Track',x:690,y:120,kind:'sign',text:'The track climbs north into the trees toward the Whispering Forest. Fallen branches block the way. Not yet.'}
];
// No water in the square: the river and the lagoon are reached from the Port and the farm.
export const villageWaterDistance=()=>Infinity;
export const onVillageDeck=()=>false;
export function villageBlocked(x,y){
 if(VILLAGE_BUILDINGS.some(b=>Math.abs(x-b.x)<b.w/2+12&&y>b.y-b.h-10&&y<b.y+18))return true;
 return VILLAGE_PROPS.some(p=>p.kind==='watchtower'?Math.abs(x-p.x)<28&&y>p.y-22&&y<p.y+8:p.kind==='well'?Math.hypot(x-p.x,y-p.y)<35:p.kind==='willow'?Math.hypot(x-p.x,y-p.y+8)<26:p.kind==='notice'?Math.abs(x-p.x)<26&&y>p.y-14&&y<p.y+8:false);
}
// Trees stay in the strip along the north edge, either side of the forest track.
export const villageClear=(x,y)=>y>230&&x>40&&x<1880;
