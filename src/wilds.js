import {SPRITES} from './sprite-definitions.js';
import {CABIN_AREA,CABIN_PLACES,cabinInteriorBlocked,cabinBlocked,cabinClearing,drawCabin,drawCabinInterior,drawCamp,drawWeaponRack} from './story-map.js';
import {cabinDamaged} from './story.js';
import {CHIEF_HOUSE,CHIEF_HOUSE_PLACES,chiefHouseBlocked,drawChiefHouse} from './chief-house.js';
import {GUEST_LODGE,GUEST_LODGE_PLACES,guestLodgeBlocked,drawGuestLodge} from './guest-lodge.js';
import {TRAINING_GROUND,TRAINING_GROUND_PLACES,trainingGroundBlocked,drawTrainingGround} from './training-ground.js';
import {MARSH,MARSH_ROADS,MARSH_PLACES,MARSH_OBJECTS,marshWaterDistance,onMarshDeck,marshBlocked} from './marsh.js';
import {drawMarshGround,drawMarshObject} from './marsh-art.js';
import {VILLAGE,VILLAGE_ROADS,VILLAGE_PLACES,VILLAGE_PROPS,villageWaterDistance,onVillageDeck,villageBlocked,villageClear} from './village.js';
import {drawVillageGround,drawVillageObject,villageObjects,paintVillageBuildings,drawDistrictGround,paintBuildings} from './village-art.js';
import {DISTRICTS} from './village-districts.js';
import {drawEntitySprite,drawProp,onPropLoad} from './sprites.js';
import {CROSSROADS,CROSSROADS_ROADS,CROSSROADS_PLACES,crossroadsWaterDistance,crossroadsBlocked,onCrossroadsDeck,drawCrossroads,drawCrossroadsLabels} from './crossroads.js';
import {leafyTree,meadowRock,meadowBush,grassDetail,wildflower} from './plains-art.js';
import {drawGrassBase} from './grass-texture.js';
import {pathPattern} from './path-texture.js';
// Original, repeatable pixel-art areas. Exit coordinates connect actual map edges.
export const AREAS={
 cabin:CABIN_AREA,
 'chief-house':CHIEF_HOUSE,
 'guest-lodge':GUEST_LODGE,
 'training-ground':TRAINING_GROUND,
 landing:{id:'landing',name:'Reedwater Landing',width:2800,height:2200,seed:7319,spawn:{x:1250,y:1650},exits:[{edge:'north',from:1280,to:1520,target:'windchime',entry:{x:600,y:1510},label:'Windchime Path'}]},
 crossroads:CROSSROADS,
 village:VILLAGE,
 'village-north':DISTRICTS['village-north'].area,
 'village-mill':DISTRICTS['village-mill'].area,
 marsh:MARSH,
 windchime:{id:'windchime',name:'Windchime Path',width:1200,height:1800,seed:7321,spawn:{x:600,y:1510},exits:[{edge:'north',from:480,to:720,target:'crossroads',entry:{x:800,y:1130},label:'Willowbank Crossroads'},{edge:'south',from:480,to:720,target:'landing',entry:{x:1400,y:120},label:'Reedwater Landing'}]}
};
export const WORLD=AREAS.landing;
export const SPAWN=WORLD.spawn;
export const LAND={left:0,right:WORLD.width,top:0,bottom:WORLD.height};
const LANDING_PLACES=[
 {id:'landing',name:'Reedwater Landing',x:1250,y:1650,kind:'landing',text:'The captain’s boat has disappeared beyond the water. A path leads from the dock to Grandpa’s fishing cabin.'},
 {id:'drowned',name:'The Drowned Road',x:620,y:1640,kind:'drowned',text:'Through the shallows, squared stones lead to a doorway below the water. This shore was once a street.'},
 {id:'chimes',name:'The Three Chimes',x:1380,y:1180,kind:'chimes',text:'Three hollow wooden notes drift inland. Follow the worn trail north to enter Windchime Path.'},
 {id:'spring',name:'Reedwater Spring',x:1820,y:980,kind:'spring',text:'Warm water bubbles beneath the reeds. Tiny silver fish gather at the edge of the spring.'},
 {id:'tree',name:'The Hollow Tree',x:1010,y:600,kind:'tree',text:'A deer pauses beside the hollow trunk. Your footsteps echo from somewhere deeper in the roots.'}
];
const PATH_PLACES=[{id:'path-chimes',name:'Windchime Path',x:600,y:1330,kind:'chimes',text:'Behind you lies Reedwater Landing. The chimes carry the sound of the shore into the trees.'},{id:'trail-end',name:'The Old Trail',x:600,y:320,kind:'sign',text:'The trail continues north to Willowbank Crossroads. There, the road divides: west toward the village, east toward Shellback Marsh.'}];
export const LANDMARKS=LANDING_PLACES;
// Walk-in rooms: no water, scenery, weather or open-air atmosphere.
// The training ground is open air, but walled in like a room: no wild animals, water or weather.
export const INTERIOR_AREAS=['cabin','chief-house','guest-lodge','training-ground'];
const interior=id=>INTERIOR_AREAS.includes(id);
export const placesFor=id=>DISTRICTS[id]?DISTRICTS[id].places:id==='cabin'?CABIN_PLACES:id==='guest-lodge'?GUEST_LODGE_PLACES:id==='training-ground'?TRAINING_GROUND_PLACES:id==='chief-house'?CHIEF_HOUSE_PLACES:id==='marsh'?MARSH_PLACES:id==='village'?VILLAGE_PLACES:id==='crossroads'?CROSSROADS_PLACES:id==='windchime'?PATH_PLACES:LANDING_PLACES;
export const areaFor=id=>AREAS[id]||WORLD;
export const LAKES=[{x:2020,y:1050,rx:130,ry:150},{x:650,y:1910,rx:390,ry:190}];
export const RIVERS=[[[2370,-100],[2290,500],[2320,1000],[2440,1500],[2310,2300]]];
export const ROADS=[[[1400,1600],[1510,1570],[1630,1550]],[[1250,1650],[1400,1500],[1380,1180],[1350,800],[1400,0]],[[1380,1180],[1620,1000],[1820,980]],[[1350,800],[1100,700],[1010,600]],[[1250,1650],[960,1610],[620,1640]]];
const PATH_ROADS=[[[600,1800],[600,1330],[520,1000],[650,650],[600,320],[600,0]]];
const pathsFor=id=>DISTRICTS[id]?DISTRICTS[id].roads:id==='marsh'?MARSH_ROADS:id==='village'?VILLAGE_ROADS:id==='crossroads'?CROSSROADS_ROADS:id==='windchime'?PATH_ROADS:ROADS;
export function hash(x,y,s=0){let h=Math.imul(x+WORLD.seed,374761393)^Math.imul(y+s,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
export function ellipseDistance(x,y,l){return (Math.hypot((x-l.x)/l.rx,(y-l.y)/l.ry)-1)*Math.min(l.rx,l.ry);}
// Segments whose bounding box is already farther than the best match are skipped; the nearest segment, and so the result, is unchanged.
const segmentBoxes=new WeakMap();
function boxesFor(lines){let boxes=segmentBoxes.get(lines);if(!boxes){boxes=[];for(const line of lines)for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i];boxes.push([a,b,Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1])]);}segmentBoxes.set(lines,boxes);}return boxes;}
function lineDistance(x,y,lines){let d=Infinity;for(const [a,b,minX,maxX,minY,maxY] of boxesFor(lines)){if(minX-x>d+1e-6||x-maxX>d+1e-6||minY-y>d+1e-6||y-maxY>d+1e-6)continue;const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));d=Math.min(d,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return d;}
export const roadDistance=(x,y,id='landing')=>lineDistance(x,y,pathsFor(id));
export const riverDistance=(x,y)=>lineDistance(x,y,RIVERS);
export const coastDistance=(x,y)=>y-(1910+Math.sin(x*.004)*35+Math.sin(x*.009)*12);
export function waterDistance(x,y,id='landing'){return interior(id)?Infinity:DISTRICTS[id]?DISTRICTS[id].water(x,y): id==='marsh'?marshWaterDistance(x,y):id==='village'?villageWaterDistance(x,y):id==='crossroads'?crossroadsWaterDistance(x,y):id==='windchime'?Infinity:landingWaterDistance(x,y);}
// The shore, lakes and river, without allocating per call: this runs for every step of every animal.
function landingWaterDistance(x,y){let d=-coastDistance(x,y);for(const l of LAKES)d=Math.min(d,ellipseDistance(x,y,l));return Math.min(d,riverDistance(x,y)-36);}
export const isWater=(x,y,id='landing')=>waterDistance(x,y,id)<0;
export const nearWater=(x,y,id='landing')=>waterDistance(x,y,id)<=110;
export function regionAt(x,y,id='landing'){
 if(id==='cabin')return 'Grandpa’s Cabin';
 if(id==='chief-house')return 'The Chief’s House';
 if(id==='guest-lodge')return 'The Guest Lodge';
 if(id==='training-ground')return 'The Training Ground';
 if(id==='marsh')return 'Shellback Marsh';
 if(id==='village')return y>1020?'Willow Docks':'Willowback Village';
 if(DISTRICTS[id])return DISTRICTS[id].area.name;
 if(id==='crossroads')return 'Willowbank Crossroads';
 if(id==='windchime')return 'Windchime Path';
 if(coastDistance(x,y)>0)return 'Reedwater Shore';
 if(y<900)return 'Forest Approach';
 if(x>1750&&y<1450)return 'Springbank';
 if(x<960&&y>1450)return 'The Drowned Road';
 return 'Reedwater Landing';
}
const COLORS={'Grandpa’s Cabin':['#a17b50','#ae8756','#b18b59'],'The Training Ground':['#b99662','#a8844f','#c8a872'],'The Chief’s House':['#8a5e3c','#9a6a43','#a0714a'],'The Guest Lodge':['#7f5e3d','#8f6a45','#987350'],'Shellback Marsh':['#6f854e','#748b53','#7a9057'],'Willowback Village':['#88b447','#8bb748','#90ba4b'],'Willowback Upper Lanes':['#88b447','#8bb748','#90ba4b'],'Willowback Millside':['#8db84a','#91bb4c','#96be50'],'Willow Docks':['#88b447','#8bb748','#90ba4b'],'Willowbank Crossroads':['#87ad4c','#8cb452','#93b958'],'Reedwater Shore':['#247b9a','#2989a4','#3193ac'],'Reedwater Landing':['#88b447','#8bb748','#90ba4b'],'Forest Approach':['#7aa344','#7ea846','#82ad47'],'Windchime Path':['#7aa344','#7ea846','#82ad47'],'Springbank':['#88b447','#8bb748','#90ba4b'],'The Drowned Road':['#88b447','#8bb748','#90ba4b']};
export function surfaceAt(x,y,id='landing'){
 if(id==='marsh'&&onMarshDeck(x,y))return 'path';
 if(id==='village'&&onVillageDeck(x,y))return 'path';
 if(DISTRICTS[id]?.deck(x,y))return 'path';
 if(id==='crossroads'&&onCrossroadsDeck(x,y))return 'path';
 if(id==='windchime')return roadDistance(x,y,id)<29?'path':'ground';
 if(isWater(x,y,id))return id==='landing'&&coastDistance(x,y)>0?'sea':'water';
 if(roadDistance(x,y,id)<29)return 'path';
 return waterDistance(x,y,id)<80?'sand':'ground';
}
// Scenery is fixed per grid cell, so each cell is worked out once per area. Collision checks look up nine cells per step.
const scenery=new Map();
export function sceneryAt(gx,gy,id='landing'){
 let cells=scenery.get(id);if(!cells)scenery.set(id,cells=new Map());
 const key=gx*65536+gy;let o=cells.get(key);
 if(o===undefined){o=findScenery(gx,gy,id);if(o)Object.freeze(o);cells.set(key,o);}
 return o;
}
function findScenery(gx,gy,id){
 if(interior(id)||id==='landing'&&cabinClearing(gx*72+36,gy*72+36))return null;
 if(id==='marsh')return null;
 const x=gx*72+12+hash(gx,gy)*48,y=gy*72+12+hash(gx,gy,3)*48,r=hash(gx,gy,9),region=regionAt(x,y,id);
 if(DISTRICTS[id]?.clear(x,y))return null;
 if(id==='village'&&(villageClear(x,y)||VILLAGE_PROPS.some(p=>p.kind==='watchtower'&&Math.hypot(x-p.x,y-p.y)<110)))return null;
 if(id==='crossroads'&&((x>475&&x<900&&y>440&&y<860)||(x>1200&&y>570&&y<1000)||(x<430&&y>340&&y<530)))return null;
 if(waterDistance(x,y,id)<95||roadDistance(x,y,id)<65||placesFor(id).some(p=>Math.hypot(x-p.x,y-p.y)<100))return null;
 let kind=region==='Windchime Path'||region==='Forest Approach'?(r<.78?'tree':r<.87?'bush':null):r<.13?'tree':r<.21?'rock':r<.35?'bush':null;
 return kind?{x,y,kind,r:kind==='tree'?12:kind==='rock'?15:0}:null;
}
function inExit(x,exit){return x>=exit.from+16&&x<=exit.to-16;}
export function walkable(x,y,id='landing'){
 const area=areaFor(id),edge=area.exits.find(e=>inExit(e.edge==='east'||e.edge==='west'?y:x,e)&&((e.edge==='north'&&y<96&&y>-24)||(e.edge==='south'&&y>area.height-96&&y<area.height+24)||(e.edge==='west'&&x<96&&x>-24)||(e.edge==='east'&&x>area.width-96&&x<area.width+24)));
 if(edge)return true;
 if(x<24||x>area.width-24||y<24||y>area.height-24)return false;
 if(id==='cabin')return !cabinInteriorBlocked(x,y);
 if(id==='chief-house')return !chiefHouseBlocked(x,y);
 if(id==='guest-lodge')return !guestLodgeBlocked(x,y);
 if(id==='training-ground')return !trainingGroundBlocked(x,y);
 if(id==='landing'&&cabinBlocked(x,y))return false;
 if(id==='landing'&&x>=1225&&x<=1275&&y>=1730&&y<=1935)return true;
 if(id==='marsh'){if(marshBlocked(x,y))return false;if(onMarshDeck(x,y))return true;}
 if(id==='village'){if(villageBlocked(x,y))return false;if(onVillageDeck(x,y))return true;}
 if(DISTRICTS[id]){if(DISTRICTS[id].blocked(x,y))return false;if(DISTRICTS[id].deck(x,y))return true;}
 if(id==='crossroads'){if(crossroadsBlocked(x,y))return false;if(onCrossroadsDeck(x,y))return true;}
 if(waterDistance(x,y,id)<15)return false;
 if(roadDistance(x,y,id)<29)return true;
 const gx=Math.floor(x/72),gy=Math.floor(y/72);
 for(let ix=gx-1;ix<=gx+1;ix++)for(let iy=gy-1;iy<=gy+1;iy++){const o=sceneryAt(ix,iy,id);if(o&&o.r&&(x-o.x)**2+(y-o.y)**2<(o.r+14)**2)return false;}
 return true;
}
export function transitionAt(x,y,id='landing'){
 const area=areaFor(id),exit=area.exits.find(e=>inExit(e.edge==='east'||e.edge==='west'?y:x,e)&&((e.edge==='north'&&y<0)||(e.edge==='south'&&y>area.height)||(e.edge==='west'&&x<0)||(e.edge==='east'&&x>area.width)));
 return exit?{areaId:exit.target,...exit.entry}:null;
}
export function nearestLandmark(x,y,id='landing'){return placesFor(id).find(p=>Math.hypot(x-p.x,y-p.y)<135)||null;}
// Discovery and the region label use the wide circle above; examining needs Eli right beside the spot.
export const EXAMINE_RANGE=60;
export function examinableLandmark(x,y,id='landing'){let best=null,bestD=Infinity;for(const p of placesFor(id)){const d=Math.hypot(x-p.x,y-p.y);if(d<=(p.reach||EXAMINE_RANGE)&&d<bestD){best=p;bestD=d;}}return best;}

const tree=leafyTree,rock=meadowRock;
// Water deepens in bands away from the shore; the sea sits one band darker than the lakes.
const WATER_RAMP=['#7cc8bd','#3ea6b0','#2a86a3','#1f6690','#1a5578'];
function waterColor(wet,sea,marsh=false){if(marsh)return wet> -14?'#a8af79':wet> -40?'#739b7e':wet> -110?'#4e807b':'#315d69';const i=wet> -14?0:wet> -40?1:wet> -110?2:3;return WATER_RAMP[sea?Math.min(4,i+1):i];}
function lilyPad(ctx,x,y,flower){ctx.fillStyle='#2f7a45';ctx.beginPath();ctx.ellipse(x,y,8,5,0,.5,6);ctx.lineTo(x,y);ctx.fill();ctx.fillStyle='#5aa552';ctx.fillRect(x-5,y-3,6,2);if(flower){ctx.fillStyle='#f6c6d6';ctx.fillRect(x-2,y-3,5,4);ctx.fillStyle='#ffeaa8';ctx.fillRect(x,y-2,1,2);}}
// The Drowned Road entrance: mossy cobbles and edge stones running from the sand into the lake, reeds, and a leaning milestone
// sunk into a level sand mound behind a shore rock. Stone sinking underwater is tinted by its depth below the waterline.
const SHORE_Y=1722,MILESTONE={x:551,y:1694,a:-.35};
const underTint=d=>`rgba(40,120,140,${Math.min(.75,d*.012)})`;
function block(ctx,x,y,w,h,base,top,depth){ctx.fillStyle='#4f5e55';ctx.fillRect(x,y,w,h);ctx.fillStyle=base;ctx.fillRect(x,y,w,h-2);ctx.fillStyle=top;ctx.fillRect(x,y,w,2);if(depth>0){ctx.fillStyle=underTint(depth);ctx.fillRect(x,y,w,h);}}
function causeway(ctx){
 for(let y=1664;y<1860;y+=8)for(let x=600;x<644;x+=8){const d=y-SHORE_Y,j=(x*7+y*3)%5;block(ctx,x+(y%16?0:4),y,7,7,j<2?'#a9a58d':'#b8b39a','#cfc9ab',d);if(j===0&&d<10){ctx.fillStyle='#6f9a4a';ctx.fillRect(x+1,y+1,3,2);}}
 for(let y=1680;y<1880;y+=18){const d=y-SHORE_Y;block(ctx,590,y,6,8,'#8f9c90','#c2c8b6',d);block(ctx,646,y,6,8,'#8f9c90','#c2c8b6',d);}
 for(const [x,y] of [[586,1730],[652,1718],[662,1734]])for(let i=0;i<4;i++){ctx.fillStyle=i%2?'#6d9a3a':'#8bb04a';ctx.fillRect(x+i*3,y-14+i,2,14-i);}
 // Milestone: soft shadow down-right, the leaning stone, then a level mound that buries its foot evenly.
 ctx.fillStyle='rgba(31,58,53,.32)';ctx.beginPath();ctx.ellipse(570,1714,19,5,0,0,Math.PI*2);ctx.fill();
 const R=(c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
 ctx.save();ctx.translate(MILESTONE.x,MILESTONE.y);ctx.rotate(MILESTONE.a);
 R('#7f8c80',-9,-26,21,46);R('#8f9c90',-9,-26,19,44);R('#b7c2b2',-9,-26,7,44);R('#c9d0c0',-9,-28,19,3);
 R('#5f6e66',4,-18,1,7);R('#5f6e66',3,-11,1,5);R('#5f8a4a',8,-28,5,3);
 ctx.restore();
 ctx.fillStyle='#b5a476';ctx.beginPath();ctx.ellipse(557,1710,17,6,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#cdbd8c';ctx.beginPath();ctx.ellipse(556,1708.5,14,3.5,0,0,Math.PI*2);ctx.fill();
 R('#5f8a4a',542,1706,6,4);R('#86b05a',543,1705,3,2);R('#5f8a4a',566,1705,6,3);R('#86b05a',568,1704,2,2);
 // The shore rock stands in front of the milestone, so it is painted again over the stone's foot.
 meadowRock(ctx,562.7,1716.4,true,false);
}
// The milestone glyph breathes: a slow swell of teal light with a soft halo, about four seconds per breath.
export const milestoneBreath=t=>.5+.5*Math.sin(t*1.6);
// The Region Core's writing hangs in the air in front of Eli until he reads it.
function drawFloatingWriting(ctx,p,t){
 const x=Math.round(p.x),y=Math.round(p.y-74+Math.sin(t*1.6)*2),a=.65+.2*Math.sin(t*2.4);
 ctx.save();ctx.globalAlpha=a;ctx.fillStyle='rgba(20,70,110,.55)';ctx.fillRect(x-38,y-16,76,30);ctx.strokeStyle='#8fe3ff';ctx.lineWidth=1;ctx.strokeRect(x-37.5,y-15.5,75,29);
 ctx.fillStyle='#bff2ff';for(let row=0;row<3;row++)for(let i=0;i<7;i++){const w=3+((i*7+row*3)%5);ctx.fillRect(x-32+i*9,y-10+row*8,w,2);}
 ctx.restore();
}
function milestoneGlyph(ctx,t){
 const b=milestoneBreath(t);
 ctx.save();ctx.translate(MILESTONE.x,MILESTONE.y);ctx.rotate(MILESTONE.a);
 const g=ctx.createRadialGradient(1,-9,0,1,-9,18);g.addColorStop(0,`rgba(95,224,207,${.55*b})`);g.addColorStop(1,'rgba(95,224,207,0)');
 ctx.globalCompositeOperation='screen';ctx.fillStyle=g;ctx.fillRect(-17,-27,36,36);ctx.globalCompositeOperation='source-over';
 ctx.globalAlpha=.35+.65*b;ctx.fillStyle='#7ff0e0';ctx.fillRect(-4,-10,10,2);ctx.fillRect(0,-14,2,9);ctx.fillRect(3,-6,4,2);ctx.fillRect(-4,-4,3,2);
 ctx.restore();
}
function reeds(ctx,x,y,seed){for(let i=0;i<4;i++){const h=12+Math.floor(hash(seed,i,8)*10);ctx.fillStyle=i%2?'#6d9a3a':'#8bb04a';ctx.fillRect(x+i*3-4,y-h,2,h);if(i===1){ctx.fillStyle='#6b4a2a';ctx.fillRect(x+i*3-5,y-h-5,4,7);}}}
function staticArea(ctx,left,top,width,height,id){
 if(id==='cabin'){drawCabinInterior(ctx);return;}
 if(id==='chief-house'){drawChiefHouse(ctx);return;}
 // The lodge's light follows the story, so drawWilds paints it each frame instead of caching it.
 if(id==='guest-lodge'||id==='training-ground')return;
 const texturedGrass=id!=='marsh'&&drawGrassBase(ctx,left,top,width,height,markStale);
 const dirt=pathPattern(ctx,markStale);
 for(let y=Math.floor(top/8)*8;y<top+height;y+=8)for(let x=Math.floor(left/8)*8;x<left+width;x+=8){
  const px=x+4,py=y+4,wet=waterDistance(px,py,id),road=roadDistance(px,py,id),r=hash(x,y,4),palette=COLORS[regionAt(px,py,id)];
  // Visual fringes soften the shoreline and trail without changing collision geometry.
  const deck=id==='marsh'&&onMarshDeck(px,py)||id==='crossroads'&&onCrossroadsDeck(px,py)||id==='village'&&onVillageDeck(px,py)||!!DISTRICTS[id]?.deck(px,py),water=wet<0&&!deck,path=!water&&(deck||road<24+r*12),sand=!water&&!path&&wet< (coastDistance(px,py)>-70?58:20)+r*8;
  if(water||path||sand||!texturedGrass){ctx.fillStyle=water?waterColor(wet,id==='landing'&&coastDistance(px,py)>0,id==='marsh'):path?['#d6bd7a','#dfc885','#d9c17e'][Math.floor(r*3)]:sand?(id==='marsh'?['#8c8b60','#a2a074','#929469']:['#c5ba77','#d1c487','#cabe7d'])[Math.floor(r*3)]:palette[Math.floor(hash(Math.floor(x/48),Math.floor(y/48))*3)];ctx.fillRect(x,y,8,8);}
  if(path&&dirt){ctx.fillStyle=dirt;ctx.fillRect(x,y,8,8);}
  if(water)continue;
  if(path||sand){
   if((!path||!dirt)&&r<.35){ctx.fillStyle=r<.12?'#ac9d65':'#efdaa2';ctx.fillRect(x+2,y+3,r<.12?3:4,2);}
   if(path&&road>21&&r>.4){grassDetail(ctx,x,y,7);if(r>.72){ctx.fillStyle='#80ac3e';ctx.fillRect(x+2,y+1,3,4);ctx.fillStyle='#b1c74c';ctx.fillRect(x+4,y,2,3);}}
  }else if(!texturedGrass&&id!=='marsh')grassDetail(ctx,x,y,9);
 }
 // Sparse clusters leave the walking routes readable and give the meadow small discoveries.
 for(let y=Math.floor((top-24)/24)*24;y<top+height+24;y+=24)for(let x=Math.floor((left-24)/24)*24;x<left+width+24;x+=24){
  const px=x+hash(x,y)*17,py=y+hash(x,y,2)*17,wet=waterDistance(px,py,id),road=roadDistance(px,py,id),r=hash(x,y,19);
  if(id==='marsh')continue;
  if(wet>35&&road>36&&r>.73){for(let i=0;i<3;i++)wildflower(ctx,Math.round(px+hash(x,i,3)*16),Math.round(py+hash(y,i,4)*13),i!==2);}
  else if(wet>0&&wet<17&&r>.35)rock(ctx,px,py,true);
  else if(wet< -18&&wet> -110&&coastDistance(px,py)<0&&r>.8)lilyPad(ctx,Math.round(px),Math.round(py),r>.93);
  else if(wet< -2&&wet> -16&&r>.55)reeds(ctx,Math.round(px),Math.round(py),x);
 }
 for(let gy=Math.floor(top/72)-2;gy<Math.ceil((top+height)/72)+2;gy++)for(let gx=Math.floor(left/72)-2;gx<Math.ceil((left+width)/72)+2;gx++){const o=sceneryAt(gx,gy,id);if(!o)continue;if(o.kind==='tree')tree(ctx,o.x,o.y,false,typeof document!=='undefined'?'trunk':'all');else if(o.kind==='rock')rock(ctx,o.x,o.y);else meadowBush(ctx,o.x,o.y);}
 if(id==='marsh')drawMarshGround(ctx,left,top,width,height);
 if(id==='village')drawVillageGround(ctx);
 if(DISTRICTS[id])drawDistrictGround(ctx,id);
 if(id==='landing'){
  // The old road runs out of the sand as an overgrown causeway and on under the lake; a toppled milestone marks it.
  causeway(ctx);
  // Wooden pier, and the dinghy you arrived in, wrecked on the shore beside it.
  ctx.fillStyle='#604b38';ctx.fillRect(1210,1730,80,220);
  for(let y=1735,i=0;y<1950;y+=12,i++){ctx.fillStyle=i%2?'#9a8058':'#a58b62';ctx.fillRect(1213,y,74,7);ctx.fillStyle='#c2a678';ctx.fillRect(1213,y,74,1);if(i%3===0){ctx.fillStyle='#4a3a28';ctx.fillRect(1206,y-2,7,12);ctx.fillRect(1287,y-2,7,12);}}
  // The captain took the arrival boat back out to sea.

 }
}
// Each chunk also paints a thin strip of its neighbours, so at fractional zoom or camera offsets the
// edges overlap instead of leaving a half-covered pixel row where the backdrop shows through as a line.
const chunks=new Map(),CHUNK=512,SEAM=2,MAX_CHUNKS=40,AHEAD=CHUNK/2;
export const clearTerrainCache=()=>chunks.clear();
// Image loads arrive in bursts, so they mark the cache stale and the next frame repaints once instead of once per image.
let stale=false;const markStale=()=>{stale=true;};
onPropLoad(markStale);
export const cachedChunkCount=()=>chunks.size;
function buildChunk(key,cx,cy,id){
 const canvas=document.createElement('canvas');canvas.width=CHUNK+2*SEAM;canvas.height=CHUNK+2*SEAM;const c=canvas.getContext('2d');c.translate(SEAM-cx*CHUNK,SEAM-cy*CHUNK);staticArea(c,cx*CHUNK-SEAM,cy*CHUNK-SEAM,CHUNK+2*SEAM,CHUNK+2*SEAM,id);
 chunks.set(key,canvas);if(chunks.size>MAX_CHUNKS)chunks.delete(chunks.keys().next().value);return canvas;
}
function drawChunks(ctx,view,id){
 if(stale){stale=false;chunks.clear();}
 shownArea=id;
 for(let cy=Math.floor(view.top/CHUNK);cy<=Math.floor(view.bottom/CHUNK);cy++)for(let cx=Math.floor(view.left/CHUNK);cx<=Math.floor(view.right/CHUNK);cx++){
  const key=`${id}:${cx},${cy}`;let canvas=chunks.get(key);
  if(!canvas)canvas=buildChunk(key,cx,cy,id);
  else{chunks.delete(key);chunks.set(key,canvas);}ctx.drawImage(canvas,cx*CHUNK-SEAM,cy*CHUNK-SEAM);
 }
 prefetchChunks(view,id);
}
// Chunks just beyond the screen edge are painted one at a time while the browser is idle,
// so walking onto new ground draws from the cache instead of painting several chunks in one frame.
let prefetching=false,shownArea=null;
const idle=typeof window==='undefined'?null:window.requestIdleCallback?fn=>window.requestIdleCallback(fn,{timeout:400}):fn=>setTimeout(fn,40);
function prefetchChunks(view,id){
 if(prefetching||!idle)return;
 const area=areaFor(id),midX=(view.left+view.right)/2,midY=(view.top+view.bottom)/2;let best=null,bestDistance=Infinity;
 for(let cy=Math.max(0,Math.floor((view.top-AHEAD)/CHUNK));cy<=Math.min(Math.floor((area.height-1)/CHUNK),Math.floor((view.bottom+AHEAD)/CHUNK));cy++)for(let cx=Math.max(0,Math.floor((view.left-AHEAD)/CHUNK));cx<=Math.min(Math.floor((area.width-1)/CHUNK),Math.floor((view.right+AHEAD)/CHUNK));cx++){
  if(chunks.has(`${id}:${cx},${cy}`))continue;
  const distance=Math.hypot((cx+.5)*CHUNK-midX,(cy+.5)*CHUNK-midY);if(distance<bestDistance){bestDistance=distance;best=[cx,cy];}
 }
 if(!best)return;
 prefetching=true;
 idle(()=>{prefetching=false;const key=`${id}:${best[0]},${best[1]}`;if(!stale&&shownArea===id&&!chunks.has(key))buildChunk(key,best[0],best[1],id);});
}
// Crowns are painted once into a sprite and drawn per frame with a gentle sway; trunks stay in the chunk cache.
const crowns=new Map();
export const crownCacheSize=()=>crowns.size;
export function crownSprite(big=false){
 if(typeof document==='undefined')return null;
 let sprite=crowns.get(big);
 if(!sprite){const k=big?2:1;sprite=document.createElement('canvas');sprite.width=96*k;sprite.height=112*k;leafyTree(sprite.getContext('2d'),48*k,100*k,big,'crown');crowns.set(big,sprite);}
 return sprite;
}
// Depth: scenery and characters are drawn in order of where they touch the ground, so whatever stands lower on screen is in front.
// Static scenery stays in the chunk cache; only canopies (always) and trunks, rocks and bushes near a character are redrawn here.
const fades=new Map(),slots=[],order=[];let fadeTime=0;
export const canopyAlpha=(gx,gy)=>fades.get(`${gx},${gy}`)??1;
export const landmarkCanopyAlpha=id=>fades.get(`landmark:${id}`)??1;
const slot=i=>slots[i]??=({y:0,kind:'',x:0,oy:0,key:'',sway:0,big:false,near:false,ref:null});
const nearActor=(x,y,actors)=>actors.some(a=>Math.abs(a.ref.x-x)<70&&a.ref.y>y-130&&a.ref.y<y+40);
// A canopy that stands in front of the player and overlaps them eases to 30% so they stay visible.
function fadeCanopy(key,x,y,big,p,step){
 const k=big?2:1,target=y>p.y+12&&Math.abs(p.x-x)<48*k+8&&p.y>y-100*k-15?.3:1,cur=fades.get(key)??1,next=cur+(target-cur)*step;
 if(next>.999)fades.delete(key);else fades.set(key,next);
}
function pushTree(it,x,y,key,sway,big,near){it.kind='tree';it.x=x;it.oy=y;it.y=y;it.key=key;it.sway=sway;it.big=big;it.near=near;}
export function drawDepthSorted(ctx,world,view,actors,drawActor){
 const id=world.areaId||'landing',p=world.player,sprite=crownSprite(),bigSprite=crownSprite(true),t=world.elapsed||0,step=Math.min(1,Math.max(0,t-fadeTime)*8);fadeTime=t;
 let n=0;
 for(const a of actors){const it=slot(n++);it.kind='actor';it.y=a.y;it.ref=a.ref;}
 for(let gy=Math.floor(view.top/72)-1;gy<=Math.ceil((view.bottom+100)/72);gy++)for(let gx=Math.floor(view.left/72)-1;gx<=Math.ceil(view.right/72)+1;gx++){
  const o=sceneryAt(gx,gy,id);if(!o)continue;
  const near=nearActor(o.x,o.y,actors);if(o.kind!=='tree'&&!near)continue;if(o.kind==='tree'&&!near&&!sprite)continue;
  const it=slot(n++);
  if(o.kind==='tree'){const key=`${gx},${gy}`;pushTree(it,o.x,o.y,key,hash(gx,gy,21)*6,false,near);if(sprite)fadeCanopy(key,o.x,o.y,false,p,step);}
  else{it.kind=o.kind;it.x=o.x;it.oy=o.y;it.y=o.y+(o.kind==='rock'?8:4);}
 }
 // Landmark trees (the Hollow Tree) sort the same way; their trunk base stays in the landmark layer.
 if(bigSprite)for(const place of placesFor(id))if(place.kind==='tree'&&place.x>view.left-120&&place.x<view.right+120&&place.y>view.top-40&&place.y<view.bottom+240){
  const key=`landmark:${place.id}`;pushTree(slot(n++),place.x,place.y,key,hash(place.x,place.y,21)*6,true,nearActor(place.x,place.y,actors));fadeCanopy(key,place.x,place.y,true,p,step);
 }
 if(id==='marsh')for(const object of MARSH_OBJECTS)if(object.x>view.left-180&&object.x<view.right+180&&object.y>view.top-30&&object.y<view.bottom+200){const it=slot(n++);it.kind='marsh';it.y=object.y+12;it.ref=object;}
 if(DISTRICTS[id])for(const object of [...DISTRICTS[id].buildings,...DISTRICTS[id].props])if(object.x>view.left-200&&object.x<view.right+200&&object.y>view.top-30&&object.y<view.bottom+220){const it=slot(n++);it.kind='village';it.y=object.y+18;it.ref=object;}
 if(id==='village')for(const object of villageObjects)if(object.x>view.left-200&&object.x<view.right+200&&object.y>view.top-30&&object.y<view.bottom+220){const it=slot(n++);it.kind='village';it.y=object.y+18;it.ref=object;}
 if(id==='landing'){const it=slot(n++);it.kind='story-cabin';it.y=1515;}
 order.length=0;for(let i=0;i<n;i++)order.push(slots[i]);order.sort((a,b)=>a.y-b.y);
 for(const it of order){
  if(it.kind==='story-cabin')drawCabin(ctx,world.story);
  else if(it.kind==='marsh')drawMarshObject(ctx,it.ref,t);
  else if(it.kind==='village')drawVillageObject(ctx,it.ref,t);
  else if(it.kind==='actor')drawActor(ctx,it.ref);
  else if(it.kind==='rock')meadowRock(ctx,it.x,it.oy,false,false);
  else if(it.kind==='bush')meadowBush(ctx,it.x,it.oy,false);
  else{
   const crown=it.big?bigSprite:sprite,k=it.big?2:1;
   if(it.near)leafyTree(ctx,it.x,it.oy,it.big,'stem');
   if(crown){const sway=Math.round(Math.sin(t*1.2+it.sway)*1.5);ctx.globalAlpha=fades.get(it.key)??1;ctx.drawImage(crown,Math.round(it.x)-48*k+sway,Math.round(it.oy)-100*k);ctx.globalAlpha=1;}
  }
 }
}
// Shore foam and sparkle positions are found once per chunk on a coarse grid, so the live water layer never samples distance per frame.
const shores=new Map(),MAX_SHORES=60;
// The pier, and the beached dinghy's hull (tested in its own rotated frame), stay free of foam and sparkles.
const onDock=(x,y,id)=>id==='marsh'?onMarshDeck(x,y):id==='village'?onVillageDeck(x,y):id==='crossroads'?onCrossroadsDeck(x,y):DISTRICTS[id]?DISTRICTS[id].deck(x,y):id==='landing'&&((x>=1200&&x<=1300&&y>=1725&&y<=1955));
export function shorePoints(id,cx,cy){
 const key=`${id}:${cx},${cy}`;let points=shores.get(key);if(points)return points;
 points={foam:[],sparkle:[]};
 for(let y=cy*CHUNK;y<(cy+1)*CHUNK;y+=8)for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x+=8){const d=waterDistance(x,y,id);if(d<0&&d> -8&&!onDock(x,y,id))points.foam.push([x,y,d]);}
 for(let y=Math.ceil(cy*CHUNK/18)*18;y<(cy+1)*CHUNK;y+=18)for(let x=Math.ceil(cx*CHUNK/18)*18;x<(cx+1)*CHUNK;x+=18)if(waterDistance(x,y,id)< -20&&!onDock(x,y,id))points.sparkle.push([x,y,hash(x,y,11)]);
 shores.set(key,points);if(shores.size>MAX_SHORES)shores.delete(shores.keys().next().value);return points;
}
function drawWater(ctx,world,view,id){
 if(id==='windchime'||interior(id))return;const t=world.elapsed||0;ctx.save();
 for(let cy=Math.floor(view.top/CHUNK);cy<=Math.floor(view.bottom/CHUNK);cy++)for(let cx=Math.floor(view.left/CHUNK);cx<=Math.floor(view.right/CHUNK);cx++){
  const {foam,sparkle}=shorePoints(id,cx,cy);
  ctx.fillStyle='#fffff5';
  for(const [x,y,d]of foam){if(d< -1-3.5*(1+Math.sin(t*1.6+x*.03)))continue;ctx.globalAlpha=.55+.3*Math.sin(t*2+x*.1);ctx.fillRect(x,y,8,2);}
  // Each glint eases in and out over ~0.6s on a slow 25s cycle, so the water twinkles gently rather than flickering.
  ctx.fillStyle='#fffadc';
  for(const [x,y,phase]of sparkle){const k=(phase+t*.04)%1;if(k<.025){const a=Math.sin(Math.PI*k/.025);ctx.globalAlpha=.55*a;ctx.fillRect(x,y,2,2);if(a>.7){ctx.globalAlpha=.25*a;ctx.fillRect(x-1,y,4,2);ctx.fillRect(x,y-1,2,4);}}}
 }
 ctx.restore();
}
function chimes(ctx,x,y,t){
 ctx.fillStyle='#776040';ctx.fillRect(x-34,y-46,68,6);ctx.fillRect(x+29,y-46,6,65);ctx.fillStyle='#5c4a32';ctx.fillRect(x-34,y-41,68,1);
 for(let i=0;i<3;i++){ctx.save();ctx.translate(x-22+i*18,y-40);ctx.rotate(Math.sin(t*1.8+i)*.12);ctx.fillStyle='#d8c48d';ctx.fillRect(-1,0,2,10);ctx.fillRect(-4,10,8,19+i*6);ctx.fillStyle='#b39c66';ctx.fillRect(2,10,2,19+i*6);ctx.restore();}
}
// Landmark names fade in as the player approaches: fully shown within 140 units, gone beyond 220.
export const labelAlpha=d=>Math.max(0,Math.min(1,(220-d)/80));
function parchmentTag(ctx,x,y,text,alpha){
 if(alpha<=0)return;const w=text.length*7+20;
 ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#00000040';ctx.fillRect(x-w/2+2,y+2,w,20);ctx.fillStyle='#6b5530';ctx.fillRect(x-w/2-2,y-2,w+4,24);ctx.fillStyle='#f1e3bd';ctx.fillRect(x-w/2,y,w,20);
 ctx.font='11px monospace';ctx.textAlign='center';ctx.fillStyle='#2b2a1e';ctx.fillText(text,x,y+14);ctx.restore();
}
function drawLandmark(ctx,p,t=0){
 const {x,y,kind}=p;
 if(kind==='tree')tree(ctx,x,y,true,crownSprite(true)?'trunk':'all');
 else if(kind==='landing'||kind==='chimes')chimes(ctx,x,y,t);
 else if(kind==='sign'){ctx.fillStyle='#7d6244';ctx.fillRect(x-4,y-10,8,33);ctx.fillStyle='#c2a878';ctx.fillRect(x-40,y-23,80,23);}
 else if(kind==='training-gate'){if(drawProp(ctx,'training-gate-arch',{x,y:y+6,w:100,h:66}))return;ctx.fillStyle='#4a301c';ctx.fillRect(x-30,y-40,7,44);ctx.fillRect(x+23,y-40,7,44);ctx.fillStyle='#8a6038';ctx.fillRect(x-34,y-44,68,7);for(const dy of [-26,-12])ctx.fillRect(x-23,y+dy,46,5);ctx.fillStyle='#5c3b22';ctx.fillRect(x-23,y-24,46,1);ctx.fillRect(x-23,y-10,46,1);}
 else if(kind==='spring'){
  ctx.fillStyle='#466e58';ctx.fillRect(x-26,y-7,52,18);ctx.fillStyle='#9eb683';for(let i=0;i<5;i++)ctx.fillRect(x-25+i*11,y-27+i%2*6,3,36);
  for(let i=0;i<4;i++){const k=(t/2+i/4)%1;ctx.fillStyle=`rgba(225,250,240,${.8*(1-k)})`;ctx.fillRect(Math.round(x-15+i*10+Math.sin(t*3+i)*2),Math.round(y+4-k*22),3,3);}
 }
}
function lantern(ctx){
 const g=ctx.createRadialGradient(1292,1736,2,1292,1736,70);g.addColorStop(0,'rgba(255,205,120,.55)');g.addColorStop(1,'rgba(255,205,120,0)');
 ctx.save();ctx.globalCompositeOperation='screen';ctx.fillStyle=g;ctx.fillRect(1222,1666,140,140);ctx.restore();
 ctx.fillStyle='#4a3a28';ctx.fillRect(1290,1712,4,26);ctx.fillStyle='#ffd27a';ctx.fillRect(1287,1726,10,9);ctx.fillStyle='#2a2018';ctx.fillRect(1286,1724,12,2);
}
export function drawWilds(ctx,world,view={left:world.player.x-700,right:world.player.x+700,top:world.player.y-500,bottom:world.player.y+500}){
 const id=world.areaId||'landing',area=areaFor(id);ctx.imageSmoothingEnabled=false;
 if(typeof document!=='undefined')drawChunks(ctx,view,id);else staticArea(ctx,view.left,view.top,view.right-view.left,view.bottom-view.top,id);
 if(id==='guest-lodge'){const stage=world.story?.stage;drawGuestLodge(ctx,{night:['ch5-night','ch5-sleep','ch6-night','ch6-complete'].includes(stage),morning:['ch5-morning','ch6-door'].includes(stage)});if(stage==='ch5-morning'&&!world.story.scene)drawFloatingWriting(ctx,world.player,world.elapsed||0);}
 if(id==='training-ground'){const stage=world.story?.stage;drawTrainingGround(ctx,{t:world.elapsed||0,evening:stage==='ch6-buckets'&&world.story.buckets>=30,sword:['ch6-buckets'].includes(stage)});}
 if(id==='cabin')drawWeaponRack(ctx,world.story);
 drawWater(ctx,world,view,id);
 if(id==='landing'&&cabinDamaged(world.story)&&world.story.stage!=='storm')drawCamp(ctx,world.elapsed||0);
 for(const p of placesFor(id))if(p.x>view.left-120&&p.x<view.right+120&&p.y>view.top-100&&p.y<view.bottom+100)drawLandmark(ctx,p,world.elapsed||0);
 if(id==='landing'&&view.right>1220&&view.left<1370&&view.bottom>1660&&view.top<1810)lantern(ctx);
 if(id==='landing'&&view.right>520&&view.left<590&&view.bottom>1660&&view.top<1730)milestoneGlyph(ctx,world.elapsed||0);
 if(id==='crossroads')drawCrossroads(ctx,world.elapsed||0);

}
// Labels go last so canopies and characters never cover a place name or exit sign.
export function drawWildsLabels(ctx,world,view){
 const id=world.areaId||'landing',area=areaFor(id);
 for(const p of placesFor(id))if(p.x>view.left-120&&p.x<view.right+120&&p.y>view.top-100&&p.y<view.bottom+100)parchmentTag(ctx,p.x,p.y+34,p.name,labelAlpha(Math.hypot(world.player.x-p.x,world.player.y-p.y)));
 if(id==='crossroads')drawCrossroadsLabels(ctx);
 if(id==='landing'){parchmentTag(ctx,1630,1565,cabinDamaged(world.story)?'The Damaged Cabin':'Grandpa’s Cabin',labelAlpha(Math.hypot(world.player.x-1630,world.player.y-1545)));}
 for(const exit of area.exits){const horizontal=exit.edge==='east'||exit.edge==='west',x=horizontal?(exit.edge==='east'?area.width-160:160):(exit.from+exit.to)/2,y=horizontal?(exit.from+exit.to)/2:exit.edge==='north'?110:(interior(id)?area.height-45:area.height-200);parchmentTag(ctx,x,y-12,`${{north:'↑',south:'↓',west:'←',east:'→'}[exit.edge]} ${exit.label}`,1);}
}
export function drawExplorer(ctx,p,time=0){
 // Simulation records the last step's facing and time; a recent step plays the walk for that direction.
 const walking=time-(p.steppedAt??-Infinity)<.12,direction=p.facing||'down';
 if(drawEntitySprite(ctx,p.spriteId||'player',{x:p.x,y:p.y,state:p.animationState||(walking?'walk':'idle'),time,direction,facingX:direction==='left'?-1:1}))return;
 const art=SPRITES[p.spriteId]?.fallback||{};
 const x=Math.round(p.x),y=Math.round(p.y),step=Math.sin(p.walkTime||0)*2;
 ctx.fillStyle='rgba(30,40,50,.3)';ctx.beginPath();ctx.ellipse(x+5,y+14,15,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#423d3c';ctx.fillRect(x-8,y+6+step,6,9);ctx.fillRect(x+3,y+6-step,6,9);
 ctx.fillStyle=art.shirt||'#71885f';ctx.fillRect(x-11,y-8,22,17);ctx.fillStyle='#a2b580';ctx.fillRect(x-8,y-8,7,10);ctx.fillStyle='#c6a276';ctx.fillRect(x-7,y-20,14,12);ctx.fillStyle=art.hair||'#554739';ctx.fillRect(x-9,y-23,18,6);ctx.fillStyle='#d0b77e';if(art.hat!==false)ctx.fillRect(x-13,y-22,26,4);ctx.fillStyle='#775b44';ctx.fillRect(x-6,y-5,13,14);ctx.fillStyle='#c78066';ctx.fillRect(x-8,y-8,17,3);ctx.fillRect(x-11,y-5,5,8);
 ctx.strokeStyle='#c6ae78';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+10,y);ctx.lineTo(x+Math.cos(p.angle)*30,y+Math.sin(p.angle)*30);ctx.stroke();
}
export function paintAtlas(ctx,width,height,player,discovered=new Set(),id='landing'){
 const area=areaFor(id),sx=width/area.width,sy=height/area.height,step=24;ctx.clearRect(0,0,width,height);
 for(let y=0;y<area.height;y+=step)for(let x=0;x<area.width;x+=step){const surface=surfaceAt(x+12,y+12,id);ctx.fillStyle=surface==='sea'?'#29596d':surface==='water'?(id==='marsh'?'#547e75':'#65a8af'):surface==='sand'?'#c9b78a':surface==='path'?'#c3ac79':COLORS[regionAt(x,y,id)][1];ctx.fillRect(x*sx,y*sy,step*sx+1,step*sy+1);}
 if(id==='village')paintVillageBuildings(ctx,sx,sy);
 if(DISTRICTS[id])paintBuildings(ctx,DISTRICTS[id].buildings,sx,sy);
 for(const p of placesFor(id)){ctx.fillStyle=discovered.has(p.id)?'#e6bd65':'#e3e1c9';ctx.fillRect(p.x*sx-2,p.y*sy-2,4,4);if(width>400){ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillStyle='#203c38';ctx.fillText(p.name,p.x*sx+1,p.y*sy-9);ctx.fillStyle='#fff0c9';ctx.fillText(p.name,p.x*sx,p.y*sy-10);}}
 for(const e of area.exits){const horizontal=e.edge==='east'||e.edge==='west',x=horizontal?(e.edge==='east'?width-8:8):(e.from+e.to)/2*sx,y=horizontal?(e.from+e.to)/2*sy:e.edge==='north'?18:height-10;ctx.fillStyle='#f0d68b';ctx.textAlign=horizontal?(e.edge==='east'?'right':'left'):'center';ctx.font=`bold ${width>400?12:8}px monospace`;ctx.fillText(`${{north:'↑',south:'↓',west:'←',east:'→'}[e.edge]} ${e.label}`,x,y);}
 if(player){ctx.fillStyle='#fff4be';ctx.beginPath();ctx.arc(player.x*sx,player.y*sy,5,0,Math.PI*2);ctx.fill();}
}

