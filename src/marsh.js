import {DELTA} from './delta-areas.js';
// The atlas wetlands: dry hummocks linked by real, walkable timber crossings.
import {defineArea} from './atlas-area.js';
// Shellback Marsh, redrawn from the atlas: four natural islands and a reedy west shore, split by the deep Shell
// Channel running south through the middle. Timber walks with lantern posts join them; the main walk crosses the
// channel on a humped bridge. Same size and the same six landmarks as before, so quests keep working.
export const MARSH=DELTA.marsh.area;
export const MARSH_BOARDS=DELTA.marsh.walks.map(b=>({width:b.half*2,points:b.pts}));
export const MARSH_ROADS=MARSH_BOARDS.map(board=>board.points);
export const marshWaterDistance=(x,y)=>DELTA.marsh.water(x,y);
export function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
// Each plank run is boxed once, so points far from every board skip the segment maths.
const BOARD_SEGMENTS=MARSH_BOARDS.flatMap(board=>board.points.slice(1).map((b,i)=>{const a=board.points[i],h=board.width/2;return {a,b,h,left:Math.min(a[0],b[0])-h,right:Math.max(a[0],b[0])+h,top:Math.min(a[1],b[1])-h,bottom:Math.max(a[1],b[1])+h};}));
export const onMarshDeck=(x,y)=>DELTA.marsh.deck(x,y);
export const MARSH_OBJECTS=[
 {id:'empty-shell',kind:'shell',x:1729,y:1220,radius:62},
 {id:'reedwatch',kind:'tower',x:721,y:549,radius:33},
 {id:'sunken-arch',kind:'ruin',x:1750,y:2034,radius:45},
 {id:'angler-shelter',kind:'shelter',x:1894,y:1241,radius:34},
 ...[[247,569],[1194,651],[453,773],[1318,1139],[1853,1139],[1441,1993],[1894,1953],[165,1302],[494,1464],[124,2197],[1935,651]].map(([x,y],i)=>({id:`marsh-tree-${i}`,kind:'cypress',x,y,radius:20}))
];
export const marshBlocked=(x,y)=>MARSH_OBJECTS.some(object=>Math.hypot(x-object.x,y-object.y)<object.radius+10);
export const MARSH_PLACES=DELTA.marsh.places;
// Arrivals from the atlas areas land on the nearest walk.
