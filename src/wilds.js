import {leafyTree,meadowRock,meadowBush,grassDetail,wildflower} from './plains-art.js';
import {drawGrassBase} from './grass-texture.js';
import {pathPattern} from './path-texture.js';
// Original, repeatable pixel-art areas. Exit coordinates connect actual map edges.
export const AREAS={
 landing:{id:'landing',name:'Reedwater Landing',width:2800,height:2200,seed:7319,spawn:{x:1250,y:1650},exits:[{edge:'north',from:1280,to:1520,target:'windchime',entry:{x:600,y:1510},label:'Windchime Path'}]},
 windchime:{id:'windchime',name:'Windchime Path',width:1200,height:1800,seed:7321,spawn:{x:600,y:1510},exits:[{edge:'south',from:480,to:720,target:'landing',entry:{x:1400,y:120},label:'Reedwater Landing'}]}
};
export const WORLD=AREAS.landing;
export const SPAWN=WORLD.spawn;
export const LAND={left:0,right:WORLD.width,top:0,bottom:WORLD.height};
const LANDING_PLACES=[
 {id:'landing',name:'Reedwater Landing',x:1250,y:1650,kind:'landing',text:'Your boat rests beside the sand. Above the tideline, a trail leads north toward three wooden chimes.'},
 {id:'drowned',name:'The Drowned Road',x:620,y:1640,kind:'drowned',text:'Through the shallows, squared stones lead to a doorway below the water. This shore was once a street.'},
 {id:'chimes',name:'The Three Chimes',x:1380,y:1180,kind:'chimes',text:'Three hollow wooden notes drift inland. Follow the worn trail north to enter Windchime Path.'},
 {id:'spring',name:'Reedwater Spring',x:1820,y:980,kind:'spring',text:'Warm water bubbles beneath the reeds. Tiny silver fish gather at the edge of the spring.'},
 {id:'tree',name:'The Hollow Tree',x:1010,y:600,kind:'tree',text:'A deer pauses beside the hollow trunk. Your footsteps echo from somewhere deeper in the roots.'}
];
const PATH_PLACES=[{id:'path-chimes',name:'Windchime Path',x:600,y:1330,kind:'chimes',text:'Behind you lies Reedwater Landing. The chimes carry the sound of the shore into the trees.'},{id:'trail-end',name:'The Old Trail',x:600,y:320,kind:'sign',text:'The trail continues toward Willowbank. This next area is not built yet; return south to the landing for now.'}];
export const LANDMARKS=LANDING_PLACES;
export const placesFor=id=>id==='windchime'?PATH_PLACES:LANDING_PLACES;
export const areaFor=id=>AREAS[id]||WORLD;
export const LAKES=[{x:2020,y:1050,rx:130,ry:150},{x:650,y:1910,rx:390,ry:190}];
export const RIVERS=[[[2370,-100],[2290,500],[2320,1000],[2440,1500],[2310,2300]]];
export const ROADS=[[[1250,1650],[1400,1500],[1380,1180],[1350,800],[1400,0]],[[1380,1180],[1620,1000],[1820,980]],[[1350,800],[1100,700],[1010,600]],[[1250,1650],[960,1610],[620,1640]]];
const PATH_ROADS=[[[600,1800],[600,1330],[520,1000],[650,650],[600,320]]];
const pathsFor=id=>id==='windchime'?PATH_ROADS:ROADS;
export function hash(x,y,s=0){let h=Math.imul(x+WORLD.seed,374761393)^Math.imul(y+s,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
export function ellipseDistance(x,y,l){return (Math.hypot((x-l.x)/l.rx,(y-l.y)/l.ry)-1)*Math.min(l.rx,l.ry);}
function lineDistance(x,y,lines){let d=Infinity;for(const line of lines)for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));d=Math.min(d,Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy));}return d;}
export const roadDistance=(x,y,id='landing')=>lineDistance(x,y,pathsFor(id));
export const riverDistance=(x,y)=>lineDistance(x,y,RIVERS);
export const coastDistance=(x,y)=>y-(1910+Math.sin(x*.004)*35+Math.sin(x*.009)*12);
export function waterDistance(x,y,id='landing'){return id==='windchime'?Infinity:Math.min(-coastDistance(x,y),...LAKES.map(l=>ellipseDistance(x,y,l)),riverDistance(x,y)-36);}
export const isWater=(x,y,id='landing')=>waterDistance(x,y,id)<0;
export const nearWater=(x,y,id='landing')=>waterDistance(x,y,id)<=110;
export function regionAt(x,y,id='landing'){
 if(id==='windchime')return 'Windchime Path';
 if(coastDistance(x,y)>0)return 'Reedwater Shore';
 if(y<900)return 'Forest Approach';
 if(x>1750&&y<1450)return 'Springbank';
 if(x<960&&y>1450)return 'The Drowned Road';
 return 'Reedwater Landing';
}
const COLORS={'Reedwater Shore':['#247b9a','#2989a4','#3193ac'],'Reedwater Landing':['#88b447','#8bb748','#90ba4b'],'Forest Approach':['#7aa344','#7ea846','#82ad47'],'Windchime Path':['#7aa344','#7ea846','#82ad47'],'Springbank':['#88b447','#8bb748','#90ba4b'],'The Drowned Road':['#88b447','#8bb748','#90ba4b']};
export function surfaceAt(x,y,id='landing'){
 if(id==='windchime')return roadDistance(x,y,id)<29?'path':'ground';
 if(isWater(x,y,id))return coastDistance(x,y)>0?'sea':'water';
 if(roadDistance(x,y,id)<29)return 'path';
 return waterDistance(x,y,id)<80?'sand':'ground';
}
export function sceneryAt(gx,gy,id='landing'){
 const x=gx*72+12+hash(gx,gy)*48,y=gy*72+12+hash(gx,gy,3)*48,r=hash(gx,gy,9),region=regionAt(x,y,id);
 if(waterDistance(x,y,id)<95||roadDistance(x,y,id)<65||placesFor(id).some(p=>Math.hypot(x-p.x,y-p.y)<100))return null;
 let kind=region==='Windchime Path'||region==='Forest Approach'?(r<.78?'tree':r<.87?'bush':null):r<.13?'tree':r<.21?'rock':r<.35?'bush':null;
 return kind?{x,y,kind,r:kind==='tree'?12:kind==='rock'?15:0}:null;
}
function inExit(x,exit){return x>=exit.from+16&&x<=exit.to-16;}
export function walkable(x,y,id='landing'){
 const area=areaFor(id),edge=area.exits.find(e=>inExit(x,e)&&((e.edge==='north'&&y<96&&y>-24)||(e.edge==='south'&&y>area.height-96&&y<area.height+24)));
 if(edge)return true;
 if(x<24||x>area.width-24||y<24||y>area.height-24)return false;
 if(id==='landing'&&x>=1225&&x<=1275&&y>=1730&&y<=1935)return true;
 if(waterDistance(x,y,id)<15)return false;
 if(id==='windchime'&&y<250)return false;
 if(roadDistance(x,y,id)<29)return true;
 const gx=Math.floor(x/72),gy=Math.floor(y/72);
 for(let ix=gx-1;ix<=gx+1;ix++)for(let iy=gy-1;iy<=gy+1;iy++){const o=sceneryAt(ix,iy,id);if(o&&o.r&&(x-o.x)**2+(y-o.y)**2<(o.r+14)**2)return false;}
 return true;
}
export function transitionAt(x,y,id='landing'){
 const area=areaFor(id),exit=area.exits.find(e=>inExit(x,e)&&((e.edge==='north'&&y<0)||(e.edge==='south'&&y>area.height)));
 return exit?{areaId:exit.target,...exit.entry}:null;
}
export function nearestLandmark(x,y,id='landing'){return placesFor(id).find(p=>Math.hypot(x-p.x,y-p.y)<135)||null;}

const tree=leafyTree,rock=meadowRock;
// Water deepens in bands away from the shore; the sea sits one band darker than the lakes.
const WATER_RAMP=['#7cc8bd','#3ea6b0','#2a86a3','#1f6690','#1a5578'];
function waterColor(wet,sea){const i=wet> -14?0:wet> -40?1:wet> -110?2:3;return WATER_RAMP[sea?Math.min(4,i+1):i];}
function lilyPad(ctx,x,y,flower){ctx.fillStyle='#2f7a45';ctx.beginPath();ctx.ellipse(x,y,8,5,0,.5,6);ctx.lineTo(x,y);ctx.fill();ctx.fillStyle='#5aa552';ctx.fillRect(x-5,y-3,6,2);if(flower){ctx.fillStyle='#f6c6d6';ctx.fillRect(x-2,y-3,5,4);ctx.fillStyle='#ffeaa8';ctx.fillRect(x,y-2,1,2);}}
function reeds(ctx,x,y,seed){for(let i=0;i<4;i++){const h=12+Math.floor(hash(seed,i,8)*10);ctx.fillStyle=i%2?'#6d9a3a':'#8bb04a';ctx.fillRect(x+i*3-4,y-h,2,h);if(i===1){ctx.fillStyle='#6b4a2a';ctx.fillRect(x+i*3-5,y-h-5,4,7);}}}
function staticArea(ctx,left,top,width,height,id){
 const texturedGrass=drawGrassBase(ctx,left,top,width,height,clearTerrainCache);
 const dirt=pathPattern(ctx,clearTerrainCache);
 for(let y=Math.floor(top/8)*8;y<top+height;y+=8)for(let x=Math.floor(left/8)*8;x<left+width;x+=8){
  const px=x+4,py=y+4,wet=waterDistance(px,py,id),road=roadDistance(px,py,id),r=hash(x,y,4),palette=COLORS[regionAt(px,py,id)];
  // Visual fringes soften the shoreline and trail without changing collision geometry.
  const water=wet<0,path=!water&&road<24+r*12,sand=!water&&!path&&wet< (coastDistance(px,py)>-70?58:20)+r*8;
  if(water||path||sand||!texturedGrass){ctx.fillStyle=water?waterColor(wet,coastDistance(px,py)>0):path?['#d6bd7a','#dfc885','#d9c17e'][Math.floor(r*3)]:sand?['#c5ba77','#d1c487','#cabe7d'][Math.floor(r*3)]:palette[Math.floor(hash(Math.floor(x/48),Math.floor(y/48))*3)];ctx.fillRect(x,y,8,8);}
  if(path&&dirt){ctx.fillStyle=dirt;ctx.fillRect(x,y,8,8);}
  if(water)continue;
  if(path||sand){
   if((!path||!dirt)&&r<.35){ctx.fillStyle=r<.12?'#ac9d65':'#efdaa2';ctx.fillRect(x+2,y+3,r<.12?3:4,2);}
   if(path&&road>21&&r>.4){grassDetail(ctx,x,y,7);if(r>.72){ctx.fillStyle='#80ac3e';ctx.fillRect(x+2,y+1,3,4);ctx.fillStyle='#b1c74c';ctx.fillRect(x+4,y,2,3);}}
  }else if(!texturedGrass)grassDetail(ctx,x,y,9);
 }
 // Sparse clusters leave the walking routes readable and give the meadow small discoveries.
 for(let y=Math.floor((top-24)/24)*24;y<top+height+24;y+=24)for(let x=Math.floor((left-24)/24)*24;x<left+width+24;x+=24){
  const px=x+hash(x,y)*17,py=y+hash(x,y,2)*17,wet=waterDistance(px,py,id),road=roadDistance(px,py,id),r=hash(x,y,19);
  if(wet>35&&road>36&&r>.73){for(let i=0;i<3;i++)wildflower(ctx,Math.round(px+hash(x,i,3)*16),Math.round(py+hash(y,i,4)*13),i!==2);}
  else if(wet>0&&wet<17&&r>.35)rock(ctx,px,py,true);
  else if(wet< -18&&wet> -110&&coastDistance(px,py)<0&&r>.8)lilyPad(ctx,Math.round(px),Math.round(py),r>.93);
  else if(wet< -2&&wet> -16&&r>.55)reeds(ctx,Math.round(px),Math.round(py),x);
 }
 for(let gy=Math.floor(top/72)-2;gy<Math.ceil((top+height)/72)+2;gy++)for(let gx=Math.floor(left/72)-2;gx<Math.ceil((left+width)/72)+2;gx++){const o=sceneryAt(gx,gy,id);if(!o)continue;if(o.kind==='tree')tree(ctx,o.x,o.y,false,typeof document!=='undefined'?'trunk':'all');else if(o.kind==='rock')rock(ctx,o.x,o.y);else meadowBush(ctx,o.x,o.y);}
 if(id==='landing'){
  // The old road stays beneath the water; its shoreline is the examinable location.
  for(let i=0;i<12;i++){ctx.fillStyle=i%2?'rgba(150,200,190,.35)':'rgba(170,215,200,.4)';ctx.fillRect(520+i*21,1800+i*7,19,24);ctx.fillStyle='rgba(20,60,70,.25)';ctx.fillRect(520+i*21,1822+i*7,19,2);}
  for(const [x,y]of [[480,1790],[750,1880]]){
   ctx.fillStyle='#8fa594';ctx.fillRect(x,y-30,12,36);ctx.fillStyle='#a7bda6';ctx.fillRect(x,y-30,5,36);ctx.fillStyle='#d5d6b4';ctx.fillRect(x-3,y-32,18,6);
   ctx.fillStyle='#4f5e55';ctx.fillRect(x+7,y-24,1,5);ctx.fillRect(x+6,y-19,1,4);ctx.fillRect(x+7,y-15,1,3);
   ctx.fillStyle='#5f8a4a';ctx.fillRect(x-3,y-33,7,3);ctx.fillRect(x+9,y-33,6,2);ctx.fillRect(x,y-12,4,6);ctx.fillStyle='#86b05a';ctx.fillRect(x-1,y-34,4,2);
   ctx.fillStyle='rgba(20,60,70,.45)';ctx.fillRect(x,y,12,6);ctx.fillStyle='rgba(255,255,245,.6)';ctx.fillRect(x-3,y-1,18,2);
  }
  // Wooden pier and the arrival boat on the southern shore.
  ctx.fillStyle='#604b38';ctx.fillRect(1210,1730,80,220);
  for(let y=1735,i=0;y<1950;y+=12,i++){ctx.fillStyle=i%2?'#9a8058':'#a58b62';ctx.fillRect(1213,y,74,7);ctx.fillStyle='#c2a678';ctx.fillRect(1213,y,74,1);if(i%3===0){ctx.fillStyle='#4a3a28';ctx.fillRect(1206,y-2,7,12);ctx.fillRect(1287,y-2,7,12);}}
  ctx.fillStyle='#77563d';ctx.fillRect(1300,1880,95,31);ctx.fillStyle='#b99b6c';ctx.fillRect(1310,1885,75,5);ctx.fillRect(1310,1901,75,5);
 }
}
const chunks=new Map(),CHUNK=512,MAX_CHUNKS=30;
export const clearTerrainCache=()=>chunks.clear();
export const cachedChunkCount=()=>chunks.size;
function drawChunks(ctx,view,id){
 for(let cy=Math.floor(view.top/CHUNK);cy<=Math.floor(view.bottom/CHUNK);cy++)for(let cx=Math.floor(view.left/CHUNK);cx<=Math.floor(view.right/CHUNK);cx++){
  const key=`${id}:${cx},${cy}`;let canvas=chunks.get(key);
  if(!canvas){canvas=document.createElement('canvas');canvas.width=CHUNK;canvas.height=CHUNK;const c=canvas.getContext('2d');c.translate(-cx*CHUNK,-cy*CHUNK);staticArea(c,cx*CHUNK,cy*CHUNK,CHUNK,CHUNK,id);chunks.set(key,canvas);if(chunks.size>MAX_CHUNKS)chunks.delete(chunks.keys().next().value);}
  else{chunks.delete(key);chunks.set(key,canvas);}ctx.drawImage(canvas,cx*CHUNK,cy*CHUNK);
 }
}
// Crowns are painted once into a sprite and drawn per frame with a gentle sway; trunks stay in the chunk cache.
const crowns=new Map();
export const crownCacheSize=()=>crowns.size;
export function crownSprite(big=false){
 if(typeof document==='undefined')return null;
 let sprite=crowns.get(big);
 if(!sprite){sprite=document.createElement('canvas');sprite.width=96;sprite.height=112;leafyTree(sprite.getContext('2d'),48,100,big,'crown');crowns.set(big,sprite);}
 return sprite;
}
function drawCrowns(ctx,world,view,id){
 const sprite=crownSprite();if(!sprite)return;
 for(let gy=Math.floor(view.top/72)-1;gy<=Math.ceil((view.bottom+100)/72);gy++)for(let gx=Math.floor(view.left/72)-1;gx<=Math.ceil(view.right/72)+1;gx++){
  const o=sceneryAt(gx,gy,id);if(!o||o.kind!=='tree')continue;
  const sway=Math.round(Math.sin((world.elapsed||0)*1.2+hash(gx,gy,21)*6)*1.5);
  ctx.drawImage(sprite,Math.round(o.x)-48+sway,Math.round(o.y)-100);
 }
}
// Shore foam and sparkle positions are found once per chunk on a coarse grid, so the live water layer never samples distance per frame.
const shores=new Map(),MAX_SHORES=60;
const onDock=(x,y,id)=>id==='landing'&&((x>=1200&&x<=1300&&y>=1725&&y<=1955)||(x>=1295&&x<=1400&&y>=1875&&y<=1915));
export function shorePoints(id,cx,cy){
 const key=`${id}:${cx},${cy}`;let points=shores.get(key);if(points)return points;
 points={foam:[],sparkle:[]};
 for(let y=cy*CHUNK;y<(cy+1)*CHUNK;y+=8)for(let x=cx*CHUNK;x<(cx+1)*CHUNK;x+=8){const d=waterDistance(x,y,id);if(d<0&&d> -8&&!onDock(x,y,id))points.foam.push([x,y,d]);}
 for(let y=Math.ceil(cy*CHUNK/18)*18;y<(cy+1)*CHUNK;y+=18)for(let x=Math.ceil(cx*CHUNK/18)*18;x<(cx+1)*CHUNK;x+=18)if(waterDistance(x,y,id)< -20&&!onDock(x,y,id))points.sparkle.push([x,y,hash(x,y,11)]);
 shores.set(key,points);if(shores.size>MAX_SHORES)shores.delete(shores.keys().next().value);return points;
}
function drawWater(ctx,world,view,id){
 if(id==='windchime')return;const t=world.elapsed||0;ctx.save();
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
 if(kind==='tree')tree(ctx,x,y,true);
 else if(kind==='landing'||kind==='chimes')chimes(ctx,x,y,t);
 else if(kind==='sign'){ctx.fillStyle='#7d6244';ctx.fillRect(x-4,y-10,8,33);ctx.fillStyle='#c2a878';ctx.fillRect(x-40,y-23,80,23);}
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
function wildlife(ctx,world,id){
 const list=id==='landing'?[{x:1080,y:660,kind:'deer'},{x:1980,y:1060,kind:'turtle'},{x:675,y:1910,kind:'eel'}]:[{x:850,y:950,kind:'deer'}];
 for(let i=0;i<list.length;i++){const a=list[i],t=world.elapsed*.35+i,x=a.x+Math.sin(t)*10,y=a.y+Math.cos(t)*6;
  if(a.kind==='deer'){ctx.fillStyle='#a58d64';ctx.fillRect(x-12,y-4,24,15);ctx.fillRect(x+7,y-17,11,18);ctx.fillStyle='#735e43';ctx.fillRect(x-10,y+8,4,12);ctx.fillRect(x+6,y+8,4,12);ctx.fillStyle='#9eb47c';ctx.fillRect(x+5,y-28,3,13);ctx.fillRect(x+17,y-29,3,14);ctx.fillRect(x+1,y-26,6,3);ctx.fillRect(x+19,y-25,6,3);}
  else if(a.kind==='turtle'){ctx.fillStyle='#bac69c';ctx.fillRect(x-21,y-4,9,10);ctx.fillStyle='#3e7058';ctx.fillRect(x-14,y-12,29,27);ctx.fillStyle='#7aa576';ctx.fillRect(x-10,y-9,20,19);ctx.fillStyle='#babf85';ctx.fillRect(x-2,y-20,3,19);ctx.fillRect(x+4,y-26,3,23);}
  else{ctx.fillStyle='#b6e8d4';for(let j=0;j<7;j++)ctx.fillRect(x+j*4,y+Math.sin(t*3+j*.7)*4,5,3);}
 }
}
export function drawWilds(ctx,world,view={left:world.player.x-700,right:world.player.x+700,top:world.player.y-500,bottom:world.player.y+500}){
 const id=world.areaId||'landing',area=areaFor(id);ctx.imageSmoothingEnabled=false;
 if(typeof document!=='undefined')drawChunks(ctx,view,id);else staticArea(ctx,view.left,view.top,view.right-view.left,view.bottom-view.top,id);
 drawWater(ctx,world,view,id);
 for(const p of placesFor(id))if(p.x>view.left-120&&p.x<view.right+120&&p.y>view.top-100&&p.y<view.bottom+100)drawLandmark(ctx,p,world.elapsed||0);
 if(id==='landing'&&view.right>1220&&view.left<1370&&view.bottom>1660&&view.top<1810)lantern(ctx);
 drawCrowns(ctx,world,view,id);
 // Labels go last so swaying canopies never cover a place name or exit sign.
 for(const p of placesFor(id))if(p.x>view.left-120&&p.x<view.right+120&&p.y>view.top-100&&p.y<view.bottom+100)parchmentTag(ctx,p.x,p.y+34,p.name,labelAlpha(Math.hypot(world.player.x-p.x,world.player.y-p.y)));
 for(const exit of area.exits){const x=(exit.from+exit.to)/2,y=exit.edge==='north'?110:area.height-200;parchmentTag(ctx,x,y-12,`${exit.edge==='north'?'↑':'↓'} ${exit.label}`,1);}
 if(id==='windchime'){ctx.fillStyle='#7c8b6c';for(let x=470;x<730;x+=35)ctx.fillRect(x,230,28,27);}
 wildlife(ctx,world,id);
}
export function drawExplorer(ctx,p){
 const x=Math.round(p.x),y=Math.round(p.y),step=Math.sin(p.walkTime||0)*2;
 ctx.fillStyle='rgba(30,40,50,.3)';ctx.beginPath();ctx.ellipse(x+5,y+14,15,5,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#423d3c';ctx.fillRect(x-8,y+6+step,6,9);ctx.fillRect(x+3,y+6-step,6,9);
 ctx.fillStyle='#71885f';ctx.fillRect(x-11,y-8,22,17);ctx.fillStyle='#a2b580';ctx.fillRect(x-8,y-8,7,10);ctx.fillStyle='#c6a276';ctx.fillRect(x-7,y-20,14,12);ctx.fillStyle='#554739';ctx.fillRect(x-9,y-23,18,6);ctx.fillStyle='#d0b77e';ctx.fillRect(x-13,y-22,26,4);ctx.fillStyle='#775b44';ctx.fillRect(x-6,y-5,13,14);ctx.fillStyle='#c78066';ctx.fillRect(x-8,y-8,17,3);ctx.fillRect(x-11,y-5,5,8);
 ctx.strokeStyle='#c6ae78';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+10,y);ctx.lineTo(x+Math.cos(p.angle)*30,y+Math.sin(p.angle)*30);ctx.stroke();
}
export function paintAtlas(ctx,width,height,player,discovered=new Set(),id='landing'){
 const area=areaFor(id),sx=width/area.width,sy=height/area.height,step=24;ctx.clearRect(0,0,width,height);
 for(let y=0;y<area.height;y+=step)for(let x=0;x<area.width;x+=step){const surface=surfaceAt(x+12,y+12,id);ctx.fillStyle=surface==='sea'?'#29596d':surface==='water'?'#65a8af':surface==='sand'?'#c9b78a':surface==='path'?'#c3ac79':COLORS[regionAt(x,y,id)][1];ctx.fillRect(x*sx,y*sy,step*sx+1,step*sy+1);}
 for(const p of placesFor(id)){ctx.fillStyle=discovered.has(p.id)?'#e6bd65':'#e3e1c9';ctx.fillRect(p.x*sx-2,p.y*sy-2,4,4);if(width>400){ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillStyle='#203c38';ctx.fillText(p.name,p.x*sx+1,p.y*sy-9);ctx.fillStyle='#fff0c9';ctx.fillText(p.name,p.x*sx,p.y*sy-10);}}
 for(const e of area.exits){const x=(e.from+e.to)/2*sx,y=e.edge==='north'?18:height-10;ctx.fillStyle='#f0d68b';ctx.textAlign='center';ctx.font=`bold ${width>400?12:8}px monospace`;ctx.fillText(`${e.edge==='north'?'↑':'↓'} ${e.label}`,x,y);}
 if(player){ctx.fillStyle='#fff4be';ctx.beginPath();ctx.arc(player.x*sx,player.y*sy,5,0,Math.PI*2);ctx.fill();}
}
