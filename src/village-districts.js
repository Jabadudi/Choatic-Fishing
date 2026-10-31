// Willowback is home to a couple of hundred people, so the village spreads over three areas: the commons by the river
// (village.js), the Upper Lanes to the north and Millside to the north-east. Geometry and collision only; the art is in
// village-art.js and the people in village-life.js.
const W=1600,H=1200;
const home=(id,x,y,w=150,h=80,roof='#966145',trim='#c59364')=>({id,x,y,w,h,roof,trim,kind:'home'});
const shop=(id,name,x,y,w,h,roof,trim)=>({id,x,y,w,h,roof,trim,name,kind:'workshop'});
function blockedBy(buildings,props){
 return (x,y)=>buildings.some(b=>Math.abs(x-b.x)<b.w/2+12&&y>b.y-b.h-10&&y<b.y+18)
  ||props.some(p=>p.kind==='well'?Math.hypot(x-p.x,y-p.y)<35:Math.abs(x-p.x)<55&&y>p.y-25&&y<p.y+20);
}

// The Upper Lanes: rows of family homes round Lantern Square, with the bakery and the weaver on the north side.
export const UPPER_LANES={id:'village-north',name:'Willowback Upper Lanes',width:W,height:H,seed:7363,spawn:{x:800,y:1120},exits:[
 {edge:'south',from:740,to:860,target:'village',entry:{x:1560,y:70},label:'Willowback Commons'},
 {edge:'east',from:550,to:690,target:'village-mill',entry:{x:70,y:620},label:'Millside'}]};
const UPPER_ROADS=[[[800,1200],[800,200]],[[140,620],[1600,620]],[[140,960],[1460,960]],[[200,200],[1400,200]]];
const UPPER_BUILDINGS=[
 home('ul-a1',200,330),home('ul-a2',400,330,150,80,'#7b3f35','#d39a72'),
 shop('bakery','THE OVEN DOOR',610,330,180,90,'#a45543','#d49668'),shop('weaver','LOOM & SHUTTLE',990,330,170,85,'#5c6f8a','#a3b4c6'),
 home('ul-a5',1200,330,150,80,'#547c71','#91aaa0'),home('ul-a6',1400,330,150,80,'#7a5a3e','#c9a46a'),
 home('ul-b1',200,540,150,78,'#565d68','#a6a69c'),home('ul-b2',400,540,150,78,'#a56242','#d29760'),
 home('ul-b5',1200,540,150,78,'#96513e','#c28d61'),home('ul-b6',1400,540,150,78,'#6b5a7a','#b2a2c2'),
 home('ul-c1',200,870,150,80,'#7b3f35','#d39a72'),shop('herbalist','GREENLEAF HERBS',420,870,170,85,'#557a3e','#a7c27f'),
 home('ul-c3',610,870,150,80,'#966145','#c59364'),home('ul-c4',990,870,150,80,'#547c71','#91aaa0'),
 home('ul-c5',1180,870,150,80,'#a56242','#d29760'),shop('carpenter','THE CARPENTER',1400,870,170,85,'#7a5a3e','#c9a46a'),
 home('ul-d1',250,1110,150,80,'#565d68','#a6a69c'),home('ul-d2',450,1110,150,80,'#96513e','#c28d61'),
 home('ul-d3',1150,1110,150,80,'#6b5a7a','#b2a2c2'),home('ul-d4',1350,1110,150,80,'#7b3f35','#d39a72')
];
const UPPER_PROPS=[{id:'ul-well',x:680,y:720,kind:'well'},{id:'ul-stall',x:940,y:720,kind:'stall'}];
const UPPER_PLACES=[
 {id:'lantern-square',name:'Lantern Square',x:800,y:690,kind:'village-square',text:'The heart of the Upper Lanes. Lanterns on every corner, a well that never runs dry, and somebody always selling something.'},
 {id:'oven-door',name:'The Oven Door',x:610,y:360,kind:'village-workshop',text:'The village bakery. The ovens are lit long before sunrise, and the whole lane smells of rye and honey by dawn.'},
 {id:'loom-shuttle',name:'Loom & Shuttle',x:990,y:360,kind:'village-workshop',text:'Bolts of dyed wool hang in the windows. Half the cloaks in Willowback were woven here.'}
];

// Millside: farms and fields along the mill stream, the watermill, the granary, the tannery and the sheep pen.
export const MILLSIDE={id:'village-mill',name:'Willowback Millside',width:W,height:H,seed:7367,spawn:{x:70,y:620},exits:[
 {edge:'west',from:550,to:690,target:'village-north',entry:{x:1530,y:620},label:'Upper Lanes'}]};
export const millStream=y=>1180+Math.sin(y*.006)*35;
const onMillBridge=(x,y)=>x>=1100&&x<=1225&&y>=596&&y<=644;
const MILL_ROADS=[[[0,620],[1560,620]],[[400,620],[400,250]],[[700,620],[700,1010]],[[1420,620],[1420,980]]];
const MILL_BUILDINGS=[
 home('farm-west',250,520,160,85,'#a56242','#d29760'),home('farm-mid',560,520,150,80,'#7b3f35','#d39a72'),
 shop('granary','GRANARY',780,520,140,90,'#8a6a3a','#d1b277'),shop('watermill','THE WATERMILL',1000,520,180,95,'#565d68','#a6a69c'),
 home('farm-east',1430,480,150,80,'#547c71','#91aaa0'),
 shop('barn','THE BARN',220,900,170,95,'#93443b','#e4d8bb'),shop('tannery','TANNERY',480,900,170,80,'#6f5134','#b19058'),
 home('mill-cottage',900,880,140,78,'#966145','#c59364'),home('stream-cottage',1450,1100,150,80,'#6b5a7a','#b2a2c2')
];
const MILL_PROPS=[{id:'mill-well',x:600,y:700,kind:'well'}];
export const SHEEP_PEN={x:860,y:990,w:230,h:140};
const MILL_PLACES=[
 {id:'watermill',name:'The Watermill',x:1000,y:560,kind:'village-workshop',text:'The mill wheel turns all day on the stream. Every loaf in the Oven Door starts as grain ground here.'},
 {id:'millside-fields',name:'Millside Fields',x:560,y:250,kind:'village-garden',text:'Barley and oats in long strips, with scarecrows that do not scare anything. Most of Willowback eats from these fields.'},
 {id:'sheep-pen',name:'Sheep Pen',x:975,y:1060,kind:'village-garden',text:'A split-rail pen full of grubby sheep. The weaver comes down to argue about the wool every spring.'}
];

export const DISTRICTS={
 'village-north':{area:UPPER_LANES,roads:UPPER_ROADS,buildings:UPPER_BUILDINGS,props:UPPER_PROPS,places:UPPER_PLACES,
  water:()=>Infinity,deck:()=>false,clear:(x,y)=>x>110&&x<1490&&y>150&&y<1180,blocked:blockedBy(UPPER_BUILDINGS,UPPER_PROPS)},
 'village-mill':{area:MILLSIDE,roads:MILL_ROADS,buildings:MILL_BUILDINGS,props:MILL_PROPS,places:MILL_PLACES,
  water:(x,y)=>Math.abs(x-millStream(y))-28,deck:onMillBridge,clear:(x,y)=>x>80&&x<1520&&y>140&&y<1150,
  blocked:(x,y)=>blockedBy(MILL_BUILDINGS,MILL_PROPS)(x,y)||(x>SHEEP_PEN.x-6&&x<SHEEP_PEN.x+SHEEP_PEN.w+6&&y>SHEEP_PEN.y-6&&y<SHEEP_PEN.y+SHEEP_PEN.h+6)}
};
export const district=id=>DISTRICTS[id]||null;
export const VILLAGE_AREAS=['village',...Object.keys(DISTRICTS)];
