// The atlas wetlands: dry hummocks linked by real, walkable timber crossings.
import {defineArea} from './atlas-area.js';
// Shellback Marsh, redrawn from the atlas: four natural islands and a reedy west shore, split by the deep Shell
// Channel running south through the middle. Timber walks with lantern posts join them; the main walk crosses the
// channel on a humped bridge. Same size and the same six landmarks as before, so quests keep working.
const GEO=defineArea({id:'marsh-geo',frame:[322,424,172,290],size:[2100,2400],base:'water',
 shapes:[
  ['land',[[330,196],[350,190],[372,192],[390,200],[388,212],[366,216],[340,214],[328,208]]],
  ['land',[[380,222],[400,218],[418,224],[420,240],[408,248],[388,248],[376,238]]],
  ['land',[[384,258],[404,254],[420,260],[420,278],[400,284],[384,276]]],
  ['land',[[322,224],[340,226],[352,240],[356,258],[350,276],[340,290],[322,290]]],
  ['land',[[404,200],[416,196],[424,204],[424,212],[410,212]]],
  ['water',[[336,266],[342,265],[343,271],[337,272]]],['water',[[340,275],[346,274],[346,280],[340,280]]]
 ]});
export const MARSH={id:'marsh',name:'Shellback Marsh',width:2100,height:2400,seed:7357,spawn:{x:140,y:1830},exits:[{edge:'west',from:1770,to:1890,target:'crossroads',entry:{x:1490,y:473},label:'Willowbank Crossroads'},
 {edge:'north',from:30,to:170,target:'long-boardwalk',label:'Long Boardwalk'},{edge:'east',from:1490,to:1610,target:'stilt-reach',label:'Stilt Reach'}]};
export const MARSH_BOARDS=[
 {width:86,points:[[0,1831],[165,1790],[329,1708]]},
 {width:80,points:[[329,1708],[618,1647],[906,1607],[1194,1505],[1441,1302]]},
 {width:76,points:[[1441,1302],[1318,1017],[1112,854],[865,692]]},
 {width:76,points:[[82,0],[206,203],[412,447],[618,569]]},
 {width:76,points:[[1565,1383],[1606,1708],[1647,1871]]},
 {width:76,points:[[1688,1342],[1812,1342],[1976,1464],[2100,1546]]},
 {width:70,points:[[412,1708],[371,1831]]}
];
export const MARSH_ROADS=MARSH_BOARDS.map(board=>board.points);
export const marshWaterDistance=(x,y)=>GEO.water(x,y);
export function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
// Each plank run is boxed once, so points far from every board skip the segment maths.
const BOARD_SEGMENTS=MARSH_BOARDS.flatMap(board=>board.points.slice(1).map((b,i)=>{const a=board.points[i],h=board.width/2;return {a,b,h,left:Math.min(a[0],b[0])-h,right:Math.max(a[0],b[0])+h,top:Math.min(a[1],b[1])-h,bottom:Math.max(a[1],b[1])+h};}));
export const onMarshDeck=(x,y)=>BOARD_SEGMENTS.some(s=>x>=s.left-1e-6&&x<=s.right+1e-6&&y>=s.top-1e-6&&y<=s.bottom+1e-6&&segmentDistance(x,y,s.a,s.b)<=s.h);
export const MARSH_OBJECTS=[
 {id:'empty-shell',kind:'shell',x:1729,y:1220,radius:62},
 {id:'reedwatch',kind:'tower',x:721,y:549,radius:33},
 {id:'sunken-arch',kind:'ruin',x:1750,y:2034,radius:45},
 {id:'angler-shelter',kind:'shelter',x:1894,y:1241,radius:34},
 ...[[247,569],[1194,651],[453,773],[1318,1139],[1853,1139],[1441,1993],[1894,1953],[165,1302],[494,1464],[124,2197],[1935,651]].map(([x,y],i)=>({id:`marsh-tree-${i}`,kind:'cypress',x,y,radius:20}))
];
export const marshBlocked=(x,y)=>MARSH_OBJECTS.some(object=>Math.hypot(x-object.x,y-object.y)<object.radius+10);
export const MARSH_PLACES=[
 {id:'marsh-threshold',name:'The Reed Threshold',x:165,y:1749,kind:'marsh-entry',text:'The village road falls quiet behind the reeds. Lantern posts mark the safe timber route through Shellback Marsh. Walk west to return to the crossroads.'},
 {id:'marsh-shell',name:'Shellback Glade',x:1524,y:1383,kind:'marsh-shell',text:'An enormous, empty shell rests in the glade, half-grown into the moss. Small paths circle its weathered ridges. This old relic gives the marsh its name.'},
 {id:'marsh-lookout',name:'Reedwatch Lookout',x:865,y:712,kind:'marsh-lookout',text:'A weathered watch platform stands over the northern reed beds. Its old bell and lantern once guided fishing boats through the mist.'},
 {id:'marsh-fishing',name:"Angler's Reach",x:1650,y:1310,kind:'marsh-fishing',text:'The boardwalk ends above a deep, quiet channel. Lily pads drift between old mooring posts. There is room to cast into open water from either side.'},
 {id:'marsh-ruins',name:'The Sunken Steps',x:1647,y:1892,kind:'marsh-ruin',text:'Broken masonry rises out of the wet ground. The old arch has no door, and its worn stone steps lead down toward the water. The rest of the structure is lost beneath the marsh.'},
 {id:'marsh-pools',name:'Lantern Pools',x:371,y:1871,kind:'marsh-pool',text:'Fireflies gather above still pools and thick reeds. A little landing offers shelter from the wind and a quiet place to fish.'}
];
// Arrivals from the atlas areas land on the nearest walk.
MARSH.snap=(x,y)=>{let best={x,y},bd=Infinity;for(const s of BOARD_SEGMENTS){const [ax,ay]=s.a,[bx,by]=s.b,dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy))),px=ax+t*dx,py=ay+t*dy,d=Math.hypot(x-px,y-py);if(d<bd){bd=d;best={x:Math.round(px),y:Math.round(py)};}}return best;};
