// Layered world: atlas areas with elevation (other than the hand-built quarry) keep their normal painted ground and
// raise it level by level. Each level is the flat terrain, shifted up by its height and cut to that level's floor;
// earth cliff faces hang below the raised edges and stone stairs are drawn over the ramps. Artwork only: the height
// field in elevation.js still owns movement, collision and reach, and nothing here advances the simulation.
import {cliffPieces} from './cliff-art.js';
import {rampArtwork,drawRampPiece} from './ramp-art.js';
import {groundPattern} from './ground-textures.js';
import {polygonContains} from './elevation.js';
import {dualGridSheet,drawDualGrid} from './dual-grid.js';
// Dual-grid lattice spacing in world units: one level (96) is two tiles of cliff wall.
export const LAYER_CELL=48;

const art=new WeakMap();
let flat=null,mask=null;
function scratch(canvas,w,h){canvas??=document.createElement('canvas');if(canvas.width<w)canvas.width=w;if(canvas.height<h)canvas.height=h;return canvas;}
const noise=(x,y)=>Math.sin(x*1.713+y*.917)*Math.cos(x*.137-y*.733);
const GRASS_TOPS=new Set(['meadow','clear','forest',undefined,null]);

function layout(built){
 let it=art.get(built);if(it)return it;
 const e=built.elevation,levels=[...new Set([e.base||0,...e.terraces.map(t=>t.z)])].sort((a,b)=>a-b);
 const faces=cliffPieces(e).map(s=>{const mx=(s.p[0]+s.q[0])/2,my=(s.p[1]+s.q[1])/2;return {...s,top:built.zoneAt(mx-s.nx*14,my-s.ny*14),y0:Math.min(s.p[1],s.q[1])-s.high-24,y1:Math.max(s.p[1],s.q[1])-s.low+24};});
 const stairs=rampArtwork(e);
 // Raised ground for the tiles ignores ramps: stairs are drawn over the cliff they cut through.
 const ground=(x,y)=>{let z=e.base||0;for(const t of e.terraces)if(polygonContains(x,y,t.points))z=t.z;return z;};
 it={levels,faces,stairs,ground};art.set(built,it);return it;
}

// One level's floor in world coordinates. Later terraces override earlier ones, exactly like heightAt.
function paintMask(m,built,z,left,top,width,height){
 const e=built.elevation;
 m.globalCompositeOperation='source-over';
 if((e.base||0)===z){m.fillStyle='#000';m.fillRect(left-2,top-2,width+4,height+4);}
 for(const t of e.terraces){
  m.globalCompositeOperation=t.z===z?'source-over':'destination-out';
  m.beginPath();t.points.forEach((p,i)=>i?m.lineTo(p[0],p[1]):m.moveTo(p[0],p[1]));m.closePath();m.fill();
 }
 m.globalCompositeOperation='source-over';
}

function line(c,a,b,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}

// An earth wall below a raised edge, with the top ground's lip hanging over it.
function drawFace(c,s,earth){
 const {p,q,high,low,ny}=s,a=[p[0],p[1]-high],b=[q[0],q[1]-high],fa=[p[0],p[1]-low],fb=[q[0],q[1]-low];
 const grass=GRASS_TOPS.has(s.top),sand=s.top==='sand';
 if(ny>0.02){
  c.save();c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineTo(...fb);c.lineTo(...fa);c.closePath();
  c.fillStyle=earth||'#8c5e38';c.fill();
  const t=Math.min(a[1],b[1]),bottom=Math.max(fa[1],fb[1]),light=c.createLinearGradient(0,t,0,bottom);
  light.addColorStop(0,'rgba(40,24,12,.35)');light.addColorStop(.18,'rgba(40,24,12,0)');light.addColorStop(.7,'rgba(30,20,12,.12)');light.addColorStop(1,'rgba(22,16,10,.5)');
  c.fillStyle=light;c.fill();
  // Faces turned away from the upper-left light sit a little darker.
  const turn=Math.max(0,(q[0]-p[0])*-1)/Math.hypot(q[0]-p[0],q[1]-p[1]);if(turn>.2){c.fillStyle=`rgba(20,14,8,${.18*turn})`;c.fill();}
  c.restore();
  // Contact shadow on the lower ground.
  line(c,[fa[0],fa[1]+3],[fb[0],fb[1]+3],'rgba(24,30,18,.18)',8);
  line(c,[fa[0],fa[1]+1],[fb[0],fb[1]+1],'rgba(24,22,14,.35)',2);
  // The lip: grass (or sand) curling over the top of the wall, with a dark underside.
  const sag=x=>3+Math.abs(noise(x*.21,p[1]))*5+(Math.sin(x*.37)>.6?4:0);
  const steps=Math.max(2,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/3));
  const at=i=>[a[0]+(b[0]-a[0])*i/steps,a[1]+(b[1]-a[1])*i/steps];
  c.beginPath();c.moveTo(a[0],a[1]-3);c.lineTo(b[0],b[1]-3);
  for(let i=steps;i>=0;i--){const [x,y]=at(i);c.lineTo(x,y+sag(x));}
  c.closePath();c.fillStyle=grass?'#4d7a2c':sand?'#c8a565':'#8c8170';c.fill();
  c.beginPath();for(let i=0;i<=steps;i++){const [x,y]=at(i);const d=sag(x);i?c.lineTo(x,y+d):c.moveTo(x,y+d);}
  c.strokeStyle=grass?'#26401b':sand?'#7b5e33':'#4b4337';c.lineWidth=1.5;c.stroke();
  if(grass){c.fillStyle='#8fc350';for(let i=0;i<steps;i+=2){const [x,y]=at(i);if(noise(x,y)>.1)c.fillRect(Math.round(x),Math.round(y-1),2,2);}
   c.fillStyle='#2f5a22';for(let i=1;i<steps;i+=3){const [x,y]=at(i);const d=sag(x);if(noise(y,x)>.35)c.fillRect(Math.round(x),Math.round(y+d),2,3);}}
 }else{
  // A rim seen from behind: a clean outline where the raised ground meets the lower ground beyond it.
  line(c,[a[0],a[1]+1],[b[0],b[1]+1],'rgba(30,26,16,.55)',2);
  line(c,[a[0],a[1]+2.5],[b[0],b[1]+2.5],'rgba(30,26,16,.18)',3);
  line(c,[a[0],a[1]-1],[b[0],b[1]-1],grass?'rgba(170,214,104,.55)':'rgba(236,214,160,.5)',1);
 }
}

// Paints the projected rectangle [left, top, width, height] of a layered area into c (world units, already
// translated). paintFlat(ctx,left,top,width,height) paints the area's flat ground into ctx.
export function paintLayered(c,left,top,width,height,built,paintFlat,invalidate=()=>{}){
 const topSheet=dualGridSheet('plateauTop',invalidate),wallSheet=dualGridSheet('cliffWall',invalidate);
 if(topSheet&&wallSheet)return paintDualGrid(c,left,top,width,height,built,paintFlat,invalidate,topSheet,wallSheet);
 // Until the tilesets load: polygon floors and drawn cliff faces.
 const {levels,faces,stairs}=layout(built),w=Math.ceil(width),h=Math.ceil(height);
 flat=scratch(flat,w,h);mask=scratch(mask,w,h);
 const f=flat.getContext('2d'),m=mask.getContext('2d'),earth=groundPattern(c,'earthCliff',invalidate);
 for(const z of levels){
  f.setTransform(1,0,0,1,0,0);f.clearRect(0,0,w,h);m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,w,h);
  f.setTransform(1,0,0,1,-left,-(top+z));m.setTransform(1,0,0,1,-left,-(top+z));
  paintFlat(f,left,top+z,width,height);
  paintMask(m,built,z,left,top+z,width,height);
  f.setTransform(1,0,0,1,0,0);f.globalCompositeOperation='destination-in';f.drawImage(mask,0,0);f.globalCompositeOperation='source-over';
  c.drawImage(flat,0,0,w,h,left,top,w,h);
  for(const s of faces)if(s.high===z&&s.y1>top&&s.y0<top+height&&Math.max(s.p[0],s.q[0])>left-4&&Math.min(s.p[0],s.q[0])<left+width+4)drawFace(c,s,earth);
 }
 const patterns={rock:groundPattern(c,'rock',invalidate),cliffFace:earth};
 for(const s of stairs)if(s.bottom>top&&s.top<top+height)drawRampPiece(c,s,patterns);
}


// Dual-grid layering. Per level, lowest first: the cliff wall tiles (one row per 48 units of drop) hang below the raised
// ground, then the area's own ground is cut to the plateau tiles' outline, then the plateau edge tiles are drawn over it.
function paintDualGrid(c,left,top,width,height,built,paintFlat,invalidate,topSheet,wallSheet){
 const {levels,stairs,ground}=layout(built),w=Math.ceil(width),h=Math.ceil(height),C=LAYER_CELL;
 flat=scratch(flat,w,h);mask=scratch(mask,w,h);
 const f=flat.getContext('2d'),m=mask.getContext('2d');
 c.save();c.imageSmoothingEnabled=true;m.imageSmoothingEnabled=true;
 levels.forEach((z,index)=>{
  f.setTransform(1,0,0,1,0,0);f.clearRect(0,0,w,h);
  f.setTransform(1,0,0,1,-left,-(top+z));paintFlat(f,left,top+z,width,height);f.setTransform(1,0,0,1,0,0);
  if(index===0){c.drawImage(flat,0,0,w,h,left,top,w,h);return;}
  const inside=(x,y)=>ground(x,y)>=z,rows=Math.max(1,Math.round((z-levels[index-1])/C));
  for(let k=rows;k>=1;k--)drawDualGrid(c,wallSheet,inside,{left:left-C,top:top+z-k*C-C,width:width+2*C,height:height+2*C,cell:C,dy:-z+k*C});
  m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,w,h);m.setTransform(1,0,0,1,-left,-(top+z));
  drawDualGrid(m,topSheet,inside,{left:left-C,top:top+z-C,width:width+2*C,height:height+2*C,cell:C});
  m.setTransform(1,0,0,1,0,0);
  f.globalCompositeOperation='destination-in';f.drawImage(mask,0,0);f.globalCompositeOperation='source-over';
  c.drawImage(flat,0,0,w,h,left,top,w,h);
  drawDualGrid(c,topSheet,inside,{left:left-C,top:top+z-C,width:width+2*C,height:height+2*C,cell:C,dy:-z,skipFull:true});
 });
 c.restore();
 const patterns={rock:groundPattern(c,'rock',invalidate),cliffFace:groundPattern(c,'earthCliff',invalidate)};
 for(const s of stairs)if(s.bottom>top&&s.top<top+height)drawRampPiece(c,s,patterns);
}
