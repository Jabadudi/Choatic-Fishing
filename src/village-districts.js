import {DELTA} from './delta-areas.js';
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
export const PORT=DELTA['village-port'].area;
export const PORT_DECK={top:200,bottom:415};
export const portShore=x=>575+Math.sin(x*.011)*5;
export const PORT_DOCK={left:280,right:1520,top:600,bottom:672};
export const GREAT_PIER=[[600,640],[1020,940]];
export const JETTIES=[[1144,1186],[1388,1430]];
// The stairway: flight one down to the right, a landing, flight two back down to the left.
export const STAIRS={one:{top:412,bottom:495,from:790,to:960},landing:{left:925,right:1015,top:488,bottom:528},two:{top:520,bottom:606,from:960,to:790},half:30};
const onFlight=(f,x,y)=>y>=f.top&&y<=f.bottom&&Math.abs(x-(f.from+(f.to-f.from)*(y-f.top)/(f.bottom-f.top)))<=STAIRS.half;
export const onPortStairs=(x,y)=>onFlight(STAIRS.one,x,y)||onFlight(STAIRS.two,x,y)||(x>=STAIRS.landing.left&&x<=STAIRS.landing.right&&y>=STAIRS.landing.top&&y<=STAIRS.landing.bottom);
function legacyPortDeck(x,y){
 if(y>=PORT_DECK.top&&y<=PORT_DECK.bottom+3)return true;
 if(onPortStairs(x,y))return true;
 if(x>=PORT_DOCK.left&&x<=PORT_DOCK.right&&y>=PORT_DOCK.top&&y<=PORT_DOCK.bottom)return true;
 if(segment(x,y,...GREAT_PIER)<=28)return true;
 return JETTIES.some(([a,b])=>x>=a&&x<=b&&y>=PORT_DOCK.bottom-4&&y<=820);
}
export const onPortDeck=(x,y)=>DELTA['village-port'].deck(x,y);
const PORT_ROADS=DELTA['village-port'].roads;
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
const PORT_PLACES=DELTA['village-port'].places;

// 12.3 The Merchant Quarter, east of the square. The main street runs from the Town Square to the Willowback Gate.
// No way down to the Port from here. The lane south is for 26 Stonefall Creek, which is not open yet.
export const MARKET=DELTA['village-market'].area;
export const LANTERN_SQUARE={x:770,y:575,rx:280,ry:235};
export const WILLOWBACK_GATE={x:1540,y:530};
const MARKET_ROADS=DELTA['village-market'].roads;
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
const MARKET_PLACES=DELTA['village-market'].places;

// 12.4 Farm & Training Grounds, past the Willowback Gate. The river runs along the north edge; the road from the gate
// runs east to the Crossroads. The mill, barn and farmhouse are north of the road, the fields, orchard and sheep pen
// south-west, and the guard's training yard (training-ground.js) fills the south-east corner.
export const FARM=DELTA['village-farm'].area;
export const farmShore=x=>420+Math.sin(x*.004)*40+Math.sin(x*.013)*15;
export const MILL_LANDING={left:1000,right:1080,top:368,bottom:445};
const onMillLanding=(x,y)=>x>=MILL_LANDING.left&&x<=MILL_LANDING.right&&y>=MILL_LANDING.top&&y<=MILL_LANDING.bottom;
export const MILL_WHEEL={x:880,y:450};
const FARM_ROADS=DELTA['village-farm'].roads;
const FARM_BUILDINGS=[
 shop('watermill','THE WATERMILL',640,560,180,95,'#565d68','#a6a69c'),shop('barn','THE BARN',1170,740,170,95,'#93443b','#e4d8bb'),
 home('farmhouse',1650,660,150,80,'#7a5a3e','#c9a46a'),shed('coop',230,990,80,50,'#8a6a3a','#d1b277')
];
export const BARLEY_NORTH={x:130,y:520,w:400,h:300};
export const VEGETABLE_FIELDS={x:90,y:1290,w:520,h:380};
export const BARLEY_SOUTH={x:90,y:1760,w:520,h:400};
export const SHEEP_PEN={x:660,y:1830,w:190,h:300};
const FARM_PROPS=[...[690,800].flatMap((x,i)=>[1330,1460,1590,1720].map((y,j)=>({id:`apple-${i}-${j}`,x:x+(j%2)*12,y,kind:'apple-tree'})))];
const FARM_PLACES=DELTA['village-farm'].places;
const penBlocked=(x,y)=>x>SHEEP_PEN.x-6&&x<SHEEP_PEN.x+SHEEP_PEN.w+6&&y>SHEEP_PEN.y-6&&y<SHEEP_PEN.y+SHEEP_PEN.h+6;

export const DISTRICTS={
 'village-port':{structuresBlocked:blockedBy(PORT_BUILDINGS,PORT_PROPS),area:PORT,roads:PORT_ROADS,buildings:PORT_BUILDINGS,props:PORT_PROPS,places:PORT_PLACES,
  water:(x,y)=>DELTA['village-port'].water(x,y),deck:onPortDeck,clear:(x,y)=>y>185,
  // The cliff face between the upper deck and the water is solid, apart from the stairway.
  blocked:(x,y)=>blockedBy(PORT_BUILDINGS,PORT_PROPS)(x,y)||(y>PORT_DECK.bottom+3&&y<PORT_DOCK.top&&!onPortStairs(x,y))},
 'village-market':{area:MARKET,roads:MARKET_ROADS,buildings:MARKET_BUILDINGS,props:MARKET_PROPS,places:MARKET_PLACES,
  water:(x,y)=>DELTA['village-market'].water(x,y),deck:(x,y)=>DELTA['village-market'].deck(x,y),clear:(x,y)=>x>60&&x<1540&&y>60&&y<1340,
  // The palisade north and south of the gate posts: the street is the way out.
  blocked:(x,y)=>blockedBy(MARKET_BUILDINGS,MARKET_PROPS)(x,y)||(Math.abs(x-WILLOWBACK_GATE.x)<16&&Math.abs(y-WILLOWBACK_GATE.y)>66)},
 'village-farm':{area:FARM,roads:FARM_ROADS,buildings:FARM_BUILDINGS,props:FARM_PROPS,places:FARM_PLACES,
  water:(x,y)=>DELTA['village-farm'].water(x,y),deck:(x,y)=>DELTA['village-farm'].deck(x,y),clear:(x,y)=>x>40&&x<1960&&y<2200,
  blocked:(x,y)=>blockedBy(FARM_BUILDINGS,FARM_PROPS)(x,y)||penBlocked(x,y)||trainingGroundBlocked(x,y)}
};
export const district=id=>DISTRICTS[id]||null;
// The four areas of Willowback, west to east.
export const VILLAGE_AREAS=['village-port','village','village-market','village-farm'];
export const inWillowback=id=>VILLAGE_AREAS.includes(id);
export {YARD};
