// Willowback is home to a couple of hundred people, so the village spreads over four areas (atlas area 12):
//  12.1 the Port: a wooden deck over a low cliff, one stairway down to the boat dock and the Great Pier;
//  12.2 the Town Square (village.js): the commons, the chief's house, the guest lodge, the Willow Hearth;
//  12.3 the Merchant Quarter: Lantern Square's stalls, the shops and the blacksmith, with the Willowback Gate at its east end;
//  12.4 the Farm & Training Grounds: the mill, barn and fields, and the guard's training yard, on the road to the Crossroads.
// Geometry and collision only; the art is in village-art.js and the people in village-life.js.
import {TRAINING_GROUND,YARD,trainingGroundBlocked} from './training-ground.js';
const home=(id,x,y,w=150,h=80,roof='#966145',trim='#c59364')=>({id,x,y,w,h,roof,trim,kind:'home'});
const shop=(id,name,x,y,w,h,roof,trim)=>({id,x,y,w,h,roof,trim,name,kind:'workshop'});
const shed=(id,x,y,w=92,h=56,roof='#567d76',trim='#8faba0')=>({id,x,y,w,h,roof,trim,kind:'shed'});
const solid=(b,x,y)=>Math.abs(x-b.x)<b.w/2+12&&y>b.y-b.h-10&&y<b.y+18;
function blockedBy(buildings,props){
 return (x,y)=>buildings.some(b=>solid(b,x,y))
  ||props.some(p=>p.kind==='well'?Math.hypot(x-p.x,y-p.y)<35:p.kind==='apple-tree'?Math.hypot(x-p.x,y-p.y)<16:p.kind==='forge'?Math.abs(x-p.x)<34&&y>p.y-30&&y<p.y+12:p.kind==='anvil'?Math.abs(x-p.x)<20&&y>p.y-10&&y<p.y+8:p.kind==='boat'||p.kind==='hut'?false:Math.abs(x-p.x)<55&&y>p.y-25&&y<p.y+20);
}
const segment=(x,y,[ax,ay],[bx,by])=>{const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy)));return Math.hypot(x-ax-t*dx,y-ay-t*dy);};

// 12.1 The Port. No beach: the village ends at a low rock cliff. The upper deck runs the width of the area; one
// wooden stairway (two flights and a landing) leads down to the lower boat dock, the Great Pier and two jetties.
// Open water below the pier keeps the camera clear of the phone controls when Eli fishes off the end.
export const PORT={id:'village-port',name:'Willowback Port',width:1800,height:1560,seed:7369,spawn:{x:870,y:130},exits:[
 {edge:'north',from:800,to:940,target:'village',entry:{x:870,y:1090},label:'Town Square'}]};
export const PORT_DECK={top:200,bottom:415};
export const portShore=x=>575+Math.sin(x*.011)*5;
export const PORT_DOCK={left:280,right:1520,top:600,bottom:672};
export const GREAT_PIER=[[600,640],[1020,940]];
export const JETTIES=[[1144,1186],[1388,1430]];
// The stairway: flight one down to the right, a landing, flight two back down to the left.
export const STAIRS={one:{top:412,bottom:495,from:790,to:960},landing:{left:925,right:1015,top:488,bottom:528},two:{top:520,bottom:606,from:960,to:790},half:30};
const onFlight=(f,x,y)=>y>=f.top&&y<=f.bottom&&Math.abs(x-(f.from+(f.to-f.from)*(y-f.top)/(f.bottom-f.top)))<=STAIRS.half;
export const onPortStairs=(x,y)=>onFlight(STAIRS.one,x,y)||onFlight(STAIRS.two,x,y)||(x>=STAIRS.landing.left&&x<=STAIRS.landing.right&&y>=STAIRS.landing.top&&y<=STAIRS.landing.bottom);
export function onPortDeck(x,y){
 if(y>=PORT_DECK.top&&y<=PORT_DECK.bottom+3)return true;
 if(onPortStairs(x,y))return true;
 if(x>=PORT_DOCK.left&&x<=PORT_DOCK.right&&y>=PORT_DOCK.top&&y<=PORT_DOCK.bottom)return true;
 if(segment(x,y,...GREAT_PIER)<=28)return true;
 return JETTIES.some(([a,b])=>x>=a&&x<=b&&y>=PORT_DOCK.bottom-4&&y<=820);
}
const PORT_ROADS=[[[870,0],[866,120],[860,210]]];
const PORT_BUILDINGS=[
 shop('netmaker','NET & NEEDLE',1030,262,180,86,'#547c71','#91aaa0'),
 // Net sheds on stilts along the deck edge.
 shed('shed-west',110,392),shed('shed-mid',470,398,92,56,'#6b5a7a','#b2a2c2'),shed('shed-lane',620,262,86,52,'#7a5a3e','#c9a46a'),shed('shed-east',1660,392,92,56,'#565d68','#a6a69c')
];
const PORT_PROPS=[
 {id:'fish-stall-1',x:1250,y:330,kind:'fish-stall'},{id:'fish-stall-2',x:1420,y:330,kind:'fish-stall'},
 // On the water: the harbourmaster's hut on stilts beside the pier end, and the moored boats.
 {id:'harbourmaster',x:1085,y:905,kind:'hut'},
 ...[[300,740,1],[460,760,-1],[760,890,1],[1270,800,-1],[1500,780,1],[1640,720,-1]].map(([x,y,f],i)=>({id:`boat-${i}`,x,y,f,kind:'boat'}))
];
const PORT_PLACES=[
 {id:'port-deck',name:'The Upper Deck',x:700,y:320,kind:'village-dock',text:'Planks laid out over the cliff edge, worn grey by salt. Nets dry on every rail, and the whole deck smells of fish and tar.'},
 {id:'port-stairs',name:'The Stairway',x:900,y:470,kind:'village-dock',text:'The only way down to the boats: two steep flights of wet timber with a landing halfway. Hold the rail.'},
 {id:'village-docks',name:'Willow Docks',x:420,y:640,kind:'village-dock',text:'The lower boat dock, a timber boardwalk on posts just above the water. Fishing boats knock against it all day.'},
 {id:'great-pier',name:'The Great Pier',x:1000,y:915,kind:'village-dock',text:'The longest pier on the lagoon. At its end, under the harbourmaster’s lantern, the water turns deep and dark. The big fish live out here.'},
 {id:'fish-market',name:'Fish Market',x:1340,y:370,kind:'village-workshop',text:'This morning’s catch on wet boards: eels, perch, a crab trying to leave. Prices shouted, not written.'},
 {id:'village-netmaker',name:'Net & Needle',x:1030,y:300,kind:'village-workshop',text:'Nets dry outside a small workshop. Floats, rope coils and repaired crab pots cover the step.'}
];

// 12.3 The Merchant Quarter, east of the square. The main street runs from the Town Square to the Willowback Gate.
// No way down to the Port from here. The lane south is for 26 Stonefall Creek, which is not open yet.
export const MARKET={id:'village-market',name:'Willowback Merchant Quarter',width:1600,height:1400,seed:7363,spawn:{x:120,y:590},exits:[
 {edge:'west',from:520,to:660,target:'village',entry:{x:1850,y:590},label:'Town Square'},
 {edge:'east',from:460,to:600,target:'village-farm',entry:{x:70,y:1150},label:'Farm & Training Grounds'}]};
export const LANTERN_SQUARE={x:770,y:575,rx:280,ry:235};
export const WILLOWBACK_GATE={x:1540,y:530};
const MARKET_ROADS=[[[0,590],[480,600],[1100,545],[1600,530]],[[430,0],[400,250],[360,590]],[[930,810],[900,1100],[850,1400]],[[1420,310],[1400,540]]];
const MARKET_BUILDINGS=[
 home('mq-north-1',190,270,150,80,'#7b3f35','#d39a72'),home('mq-north-2',615,270,150,80,'#547c71','#91aaa0'),home('mq-north-3',930,270,150,80,'#96513e','#c28d61'),
 {id:'blacksmith',x:1420,y:290,w:180,h:90,roof:'#565d68',trim:'#a6a69c',name:'THE BLACKSMITH',kind:'workshop'},
 shop('weaver','LOOM & SHUTTLE',190,800,170,85,'#6b4f7a','#b2a2c2'),shop('bakery','THE OVEN DOOR',1200,830,180,90,'#a45543','#d49668'),
 home('mq-south-1',220,1080,150,80,'#565d68','#a6a69c'),home('mq-south-2',615,1100,150,80,'#a56242','#d29760'),
 home('mq-south-3',1200,1090,150,80,'#547c71','#91aaa0'),home('mq-south-4',1410,1090,150,80,'#7b3f35','#d39a72')
];
// The six stalls round Lantern Square, the blacksmith's open forge and his anvil.
export const MARKET_STALLS=[
 {id:'stall-fish',x:585,y:400,kind:'fish-stall',goods:'fish'},{id:'stall-veg',x:770,y:385,kind:'stall',goods:'vegetables'},{id:'stall-fruit',x:955,y:400,kind:'stall',goods:'fruit'},
 {id:'stall-cloth',x:570,y:760,kind:'stall',goods:'cloth'},{id:'stall-pots',x:765,y:770,kind:'stall',goods:'pottery'},{id:'stall-sweets',x:955,y:760,kind:'stall',goods:'sweets'}
];
const MARKET_PROPS=[...MARKET_STALLS,{id:'forge',x:1200,y:340,kind:'forge'},{id:'anvil',x:1300,y:440,kind:'anvil'}];
const MARKET_PLACES=[
 {id:'lantern-square',name:'Lantern Square',x:770,y:590,kind:'village-square',text:'Six stalls under strings of lanterns: fish, vegetables, fruit, cloth, pots and sweets. Somebody is always haggling.'},
 {id:'village-smithy',name:'The Blacksmith',x:1360,y:360,kind:'village-workshop',text:'An open forge beside the house, glowing even at noon. A rack of tools and half-finished blades hangs by the anvil.'},
 {id:'oven-door',name:'The Oven Door',x:1200,y:870,kind:'village-workshop',text:'The village bakery. The ovens are lit long before sunrise, and the whole quarter smells of rye and honey by dawn.'},
 {id:'loom-shuttle',name:'Loom & Shuttle',x:190,y:840,kind:'village-workshop',text:'Bolts of dyed wool hang in the windows. Half the cloaks in Willowback were woven here.'},
 {id:'village-gate',name:'Willowback Gate',x:WILLOWBACK_GATE.x,y:WILLOWBACK_GATE.y+40,kind:'village-gate',text:'The village gate, where the main street leaves Willowback. Past it, the road runs east between the fields to the training yard and on to the Crossroads.'},
 {id:'stonefall-lane',name:'The Stonefall Lane',x:860,y:1310,kind:'sign',text:'A lane south between the gardens, toward Stonefall Creek. A cart has lost a wheel across it. Not today.'}
];

// 12.4 Farm & Training Grounds, past the Willowback Gate. The river runs along the north edge; the road from the gate
// runs east to the Crossroads. The mill, barn and farmhouse are north of the road, the fields, orchard and sheep pen
// south-west, and the guard's training yard (training-ground.js) fills the south-east corner.
export const FARM={...TRAINING_GROUND,seed:7367,spawn:{x:70,y:1150},exits:[
 {edge:'west',from:1090,to:1210,target:'village-market',entry:{x:1540,y:530},label:'Merchant Quarter'},
 {edge:'east',from:770,to:890,target:'crossroads',entry:{x:70,y:460},label:'Willowbank Crossroads'}]};
export const farmShore=x=>420+Math.sin(x*.004)*40+Math.sin(x*.013)*15;
export const MILL_LANDING={left:1000,right:1080,top:368,bottom:445};
const onMillLanding=(x,y)=>x>=MILL_LANDING.left&&x<=MILL_LANDING.right&&y>=MILL_LANDING.top&&y<=MILL_LANDING.bottom;
export const MILL_WHEEL={x:880,y:450};
const FARM_ROADS=[[[0,1150],[500,1110],[900,1010],[1300,900],[2000,830]],[[720,1060],[720,580]],[[1040,980],[1040,450]],[[1420,930],[1420,1366]]];
const FARM_BUILDINGS=[
 shop('watermill','THE WATERMILL',640,560,180,95,'#565d68','#a6a69c'),shop('barn','THE BARN',1170,740,170,95,'#93443b','#e4d8bb'),
 home('farmhouse',1650,660,150,80,'#7a5a3e','#c9a46a'),shed('coop',230,990,80,50,'#8a6a3a','#d1b277')
];
export const BARLEY_NORTH={x:130,y:520,w:400,h:300};
export const VEGETABLE_FIELDS={x:90,y:1290,w:520,h:380};
export const BARLEY_SOUTH={x:90,y:1760,w:520,h:400};
export const SHEEP_PEN={x:660,y:1830,w:190,h:300};
const FARM_PROPS=[...[690,800].flatMap((x,i)=>[1330,1460,1590,1720].map((y,j)=>({id:`apple-${i}-${j}`,x:x+(j%2)*12,y,kind:'apple-tree'})))];
const FARM_PLACES=[
 {id:'watermill',name:'The Watermill',x:700,y:600,kind:'village-workshop',text:'The mill wheel turns all day on the river. Every loaf in the Oven Door starts as grain ground here.'},
 {id:'mill-landing',name:'Mill Landing',x:1040,y:470,kind:'village-dock',text:'A little plank landing below the mill. The river runs slow and clear here: good water for a quiet line.'},
 {id:'millside-fields',name:'Barley Fields',x:330,y:870,kind:'village-garden',text:'Barley in long strips, with a scarecrow that does not scare anything. Most of Willowback eats from these fields.'},
 {id:'village-gardens',name:'Vegetable Fields',x:350,y:1700,kind:'village-garden',text:'Cabbages, carrots and climbing beans in long rows. Rain barrels wait at the ends. These fields feed the village.'},
 {id:'orchard',name:'The Orchard',x:745,y:1530,kind:'village-garden',text:'Two rows of old apple trees, propped up with forked sticks. The windfalls never last long.'},
 {id:'sheep-pen',name:'Sheep Pen',x:755,y:2160,kind:'village-garden',text:'A split-rail pen full of grubby sheep. The weaver comes down to argue about the wool every spring.'},
 {id:'training-gate',name:'The Training Grounds',x:1420,y:1300,kind:'training-gate',text:'The guard’s training yard: a fenced square of packed dirt with dummies, a sparring circle and a weapon rack. The gate is in the north fence, off the road.'}
];
const penBlocked=(x,y)=>x>SHEEP_PEN.x-6&&x<SHEEP_PEN.x+SHEEP_PEN.w+6&&y>SHEEP_PEN.y-6&&y<SHEEP_PEN.y+SHEEP_PEN.h+6;

export const DISTRICTS={
 'village-port':{area:PORT,roads:PORT_ROADS,buildings:PORT_BUILDINGS,props:PORT_PROPS,places:PORT_PLACES,
  water:(x,y)=>portShore(x)-y,deck:onPortDeck,clear:(x,y)=>y>185,
  // The cliff face between the upper deck and the water is solid, apart from the stairway.
  blocked:(x,y)=>blockedBy(PORT_BUILDINGS,PORT_PROPS)(x,y)||(y>PORT_DECK.bottom+3&&y<PORT_DOCK.top&&!onPortStairs(x,y))},
 'village-market':{area:MARKET,roads:MARKET_ROADS,buildings:MARKET_BUILDINGS,props:MARKET_PROPS,places:MARKET_PLACES,
  water:()=>Infinity,deck:()=>false,clear:(x,y)=>x>60&&x<1540&&y>60&&y<1340,
  // The palisade north and south of the gate posts: the street is the way out.
  blocked:(x,y)=>blockedBy(MARKET_BUILDINGS,MARKET_PROPS)(x,y)||(Math.abs(x-WILLOWBACK_GATE.x)<16&&Math.abs(y-WILLOWBACK_GATE.y)>66)},
 'village-farm':{area:FARM,roads:FARM_ROADS,buildings:FARM_BUILDINGS,props:FARM_PROPS,places:FARM_PLACES,
  water:(x,y)=>y-farmShore(x),deck:onMillLanding,clear:(x,y)=>x>40&&x<1960&&y<2200,
  blocked:(x,y)=>blockedBy(FARM_BUILDINGS,FARM_PROPS)(x,y)||penBlocked(x,y)||trainingGroundBlocked(x,y)}
};
export const district=id=>DISTRICTS[id]||null;
// The four areas of Willowback, west to east.
export const VILLAGE_AREAS=['village-port','village','village-market','village-farm'];
export const inWillowback=id=>VILLAGE_AREAS.includes(id);
export {YARD};
