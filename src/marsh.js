// The atlas wetlands: dry hummocks linked by real, walkable timber crossings.
export const MARSH={id:'marsh',name:'Shellback Marsh',width:2100,height:2400,seed:7357,spawn:{x:140,y:760},exits:[{edge:'west',from:700,to:820,target:'crossroads',entry:{x:1530,y:660},label:'Willowbank Crossroads'},
 {edge:'north',from:110,to:250,target:'long-boardwalk',label:'Long Boardwalk'},{edge:'east',from:1340,to:1460,target:'stilt-reach',label:'Stilt Reach'}]};
export const MARSH_ISLANDS=[{x:310,y:760,rx:260,ry:210},{x:940,y:980,rx:340,ry:300},{x:1040,y:440,rx:280,ry:190},{x:1580,y:1000,rx:240,ry:260},{x:1060,y:1620,rx:300,ry:230},{x:400,y:1370,rx:180,ry:230}];
export const MARSH_BOARDS=[
 {width:86,points:[[0,760],[310,760],[540,810],[710,940],[860,1000]]},
 {width:74,points:[[860,1000],[880,1110],[1010,1150],[1150,1050],[1160,1000],[1120,880],[1000,820],[900,850],[820,920],[860,1000]]},
 {width:76,points:[[900,850],[1020,650],[1040,480]]},
 {width:80,points:[[1160,1000],[1390,1000],[1580,1040],[1650,1150],[1650,1380]]},
 {width:82,points:[[1000,1145],[1040,1390],[1170,1460],[1180,1580],[1060,1640]]},
 {width:74,points:[[880,1110],[760,1130],[620,1200],[440,1370],[340,1420]]},
 // North from the Reed Threshold to the Long Boardwalk (9.2), and east past Angler's Reach to Stilt Reach (13.2).
 {width:76,points:[[300,620],[250,400],[190,180],[180,0]]},
 {width:76,points:[[1650,1380],[1800,1400],[2100,1400]]}
];
export const MARSH_ROADS=MARSH_BOARDS.map(board=>board.points);
export function marshWaterDistance(x,y){let d=-Infinity;for(const island of MARSH_ISLANDS)d=Math.max(d,(1-Math.hypot((x-island.x)/island.rx,(y-island.y)/island.ry))*Math.min(island.rx,island.ry));return d;}
export function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
// Each plank run is boxed once, so points far from every board skip the segment maths.
const BOARD_SEGMENTS=MARSH_BOARDS.flatMap(board=>board.points.slice(1).map((b,i)=>{const a=board.points[i],h=board.width/2;return {a,b,h,left:Math.min(a[0],b[0])-h,right:Math.max(a[0],b[0])+h,top:Math.min(a[1],b[1])-h,bottom:Math.max(a[1],b[1])+h};}));
export const onMarshDeck=(x,y)=>BOARD_SEGMENTS.some(s=>x>=s.left-1e-6&&x<=s.right+1e-6&&y>=s.top-1e-6&&y<=s.bottom+1e-6&&segmentDistance(x,y,s.a,s.b)<=s.h);
export const MARSH_OBJECTS=[
 {id:'empty-shell',kind:'shell',x:950,y:975,radius:62},
 {id:'reedwatch',kind:'tower',x:1040,y:405,radius:33},
 {id:'sunken-arch',kind:'ruin',x:1060,y:1500,radius:45},
 {id:'angler-shelter',kind:'shelter',x:1560,y:950,radius:34},
 ...[[240,650],[430,870],[870,380],[1180,420],[1570,840],[720,1050],[1180,1150],[880,1620],[1210,1540],[370,1260]].map(([x,y],i)=>({id:`marsh-tree-${i}`,kind:'cypress',x,y,radius:20}))
];
export const marshBlocked=(x,y)=>MARSH_OBJECTS.some(object=>Math.hypot(x-object.x,y-object.y)<object.radius+10);
export const MARSH_PLACES=[
 {id:'marsh-threshold',name:'The Reed Threshold',x:300,y:760,kind:'marsh-entry',text:'The village road falls quiet behind the reeds. Lantern posts mark the safe timber route through Shellback Marsh. Walk west to return to the crossroads.'},
 {id:'marsh-shell',name:'Shellback Glade',x:950,y:1080,kind:'marsh-shell',text:'An enormous, empty shell rests in the glade, half-grown into the moss. Small paths circle its weathered ridges. This old relic gives the marsh its name.'},
 {id:'marsh-lookout',name:'Reedwatch Lookout',x:1040,y:485,kind:'marsh-lookout',text:'A weathered watch platform stands over the northern reed beds. Its old bell and lantern once guided fishing boats through the mist.'},
 {id:'marsh-fishing',name:"Angler's Reach",x:1650,y:1310,kind:'marsh-fishing',text:'The boardwalk ends above a deep, quiet channel. Lily pads drift between old mooring posts. There is room to cast into open water from either side.'},
 {id:'marsh-ruins',name:'The Sunken Steps',x:1060,y:1615,kind:'marsh-ruin',text:'Broken masonry rises out of the wet ground. The old arch has no door, and its worn stone steps lead down toward the water. The rest of the structure is lost beneath the marsh.'},
 {id:'marsh-pools',name:'Lantern Pools',x:370,y:1430,kind:'marsh-pool',text:'Fireflies gather above still pools and thick reeds. A little landing offers shelter from the wind and a quiet place to fish.'}
];
