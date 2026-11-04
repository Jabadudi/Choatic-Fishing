import {DELTA} from './delta-areas.js';
// 12.2 Town Square: the heart of Willowback. The Willow Commons (an oval of worn paving with the old well and the Great
// Willow), the chief's house to the north, the guest lodge to the west, the Willow Hearth to the north-east and the
// watchtower over the lagoon. Geometry and collision only; the art is in village-art.js and the people in village-life.js.
// The main street leaves east for the Merchant Quarter and a lane drops south to the Port. The track north into the
// trees is for 4 Whispering Forest Edge, which is not open yet.
export const VILLAGE=DELTA.village.area;
export const COMMONS={x:1300,y:690,rx:430,ry:210};
export const VILLAGE_ROADS=DELTA.village.roads;
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
export const VILLAGE_PLACES=DELTA.village.places;
// No water in the square: the river and the lagoon are reached from the Port and the farm.
export const villageWaterDistance=(x,y)=>DELTA.village.water(x,y);
export const onVillageDeck=(x,y)=>DELTA.village.deck(x,y);
export function villageBlocked(x,y){
 if(VILLAGE_BUILDINGS.some(b=>Math.abs(x-b.x)<b.w/2+12&&y>b.y-b.h-10&&y<b.y+18))return true;
 return VILLAGE_PROPS.some(p=>p.kind==='watchtower'?Math.abs(x-p.x)<28&&y>p.y-22&&y<p.y+8:p.kind==='well'?Math.hypot(x-p.x,y-p.y)<35:p.kind==='willow'?Math.hypot(x-p.x,y-p.y+8)<26:p.kind==='notice'?Math.abs(x-p.x)<26&&y>p.y-14&&y<p.y+8:false);
}
// Trees stay in the strip along the north edge, either side of the forest track.
export const villageClear=(x,y)=>y>230&&x>40&&x<1880;
