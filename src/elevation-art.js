import {rampArtwork,drawRampPiece} from './ramp-art.js';
import {quarryBase,routeDistance,drawQuarrySurface,drawQuarryShoulder,quarryGroundDetails,drawQuarryDetail} from './quarry-ground-art.js';
import {cliffPieces,drawCliffPiece} from './cliff-art.js';
import {pathPattern} from './path-texture.js';
// Cached terrain strips participate in the same depth order as actors. Drawing only.
import {groundPattern} from './ground-textures.js';
import {drawGrassBase} from './grass-texture.js';
const CELL=8,STRIP=16,SCALE=.5;
let cached=null,scratch=null;
const segment=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/d)):0;return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);};
function resources(ctx){const p={};for(const k of ['rock','dirt','sand','forest','river','shallow','sea','road','decking','cliffFace'])p[k]=groundPattern(ctx,k,()=>{});const grass=drawGrassBase(ctx,0,0,0,0,()=>{});p.grass=grass?ctx.fillStyle:null;p.path=pathPattern(ctx,()=>{});return p;}
export function elevationBands(built){
 if(typeof document==='undefined'||!built.elevation)return [];
 scratch??=document.createElement('canvas').getContext('2d');const ready=Object.entries(resources(scratch)).filter(([,p])=>p).map(([k])=>k).join(',');
 if(cached?.built===built&&cached.ready===ready)return cached.bands;
 const {area,elevation:e}=built,W=area.width,H=area.height,bands=[];
 const cliffs=cliffPieces(e);
 for(const s of cliffs){const zone=built.zoneAt((s.p[0]+s.q[0])/2-s.nx*12,(s.p[1]+s.q[1])/2-s.ny*12);s.grass=zone==='meadow'||zone==='clear';}
 const trails=built.roads.flatMap(pts=>pts.slice(1).map((b,i)=>[pts[i],b]));
 const quarry=area.id==='abandoned-quarry',details=quarry?quarryGroundDetails(built,trails):[],structures=quarry?rampArtwork(e):[];
 for(let row=0;row<H;row+=STRIP){
  const decorations=details.filter(d=>d.row===row),rampPieces=structures.filter(s=>s.row===row);
  const cells=[],walls=cliffs.filter(s=>Math.floor(s.row/STRIP)*STRIP===row);let top=Infinity,bottom=-Infinity;
  for(let y=row;y<Math.min(H,row+STRIP);y+=CELL)for(let x=0;x<W;x+=CELL){const cx=x+CELL/2,cy=y+CELL/2,z=e.heightAt(cx,cy),north=e.heightAt(cx,y-CELL/2),ramp=e.rampAt(cx,cy);let a=z,b=z,qright=z,qbottom=z;
   if(ramp){const r=ramp.r,dx=r.to[0]-r.from[0],dy=r.to[1]-r.from[1],d=dx*dx+dy*dy;const at=(px,py)=>{const t=Math.max(0,Math.min(1,((px-r.from[0])*dx+(py-r.from[1])*dy)/d));return (r.fromHeight+(r.toHeight-r.fromHeight)*t)*96;};a=at(x,y);b=at(x,y+CELL);qright=at(x+CELL,y);qbottom=at(x+CELL,y+CELL);}
   const water=built.water(cx,cy),zone=built.zoneAt(cx,cy),road=trails.some(([a,b])=>Math.abs(cx-(a[0]+b[0])/2)<Math.abs(a[0]-b[0])/2+30&&Math.abs(cy-(a[1]+b[1])/2)<Math.abs(a[1]-b[1])/2+30&&segment(cx,cy,a,b)<25);
   const kind=built.deck(cx,cy)?'road':water<0?(water>-35?'shallow':area.sea?'sea':'river'):ramp?.r.kind==='stairs'?'road':road||ramp?'path':zone==='meadow'||zone==='clear'?'grass':zone;
   const cell={x,y,z,a,b,qright,qbottom,north,kind,ramp,routeDistance:quarry?routeDistance(cx,cy,trails):Infinity};cells.push(cell);top=Math.min(top,y-a,y-qright,y+CELL-b,y+CELL-qbottom,y-north);bottom=Math.max(bottom,y-a,y-qright,y+CELL-b,y+CELL-qbottom);
  }
  for(const s of walls){top=Math.min(top,s.p[1]-s.high-18,s.q[1]-s.high-18);bottom=Math.max(bottom,s.p[1]-s.low+18,s.q[1]-s.low+18);}
  for(const d of decorations){top=Math.min(top,d.y-d.z-30);bottom=Math.max(bottom,d.y-d.z+30);}
  for(const s of rampPieces){top=Math.min(top,s.top);bottom=Math.max(bottom,s.bottom);}
  // Keep every strip on the same texture pixel grid, including strips with tall decorations.
  top=Math.floor(top*SCALE)/SCALE;bottom=Math.ceil(bottom*SCALE)/SCALE;
  const canvas=document.createElement('canvas');canvas.width=Math.ceil(W*SCALE);canvas.height=Math.max(1,Math.ceil((bottom-top+3)*SCALE));const c=canvas.getContext('2d');c.scale(SCALE,SCALE);c.translate(0,-top);const patterns=resources(c);
  for(const q of cells){const {x,y,a,b,north,kind}=q;
   c.fillStyle=patterns[kind]||({grass:'#88aa50',rock:'#8a887a',dirt:'#b29261',path:'#d9bf83',forest:'#54703c',river:'#246473',sea:'#225265',shallow:'#5a9a93'}[kind]||'#7d8361');
   c.beginPath();c.moveTo(x,y-a);c.lineTo(x+CELL+.4,y-q.qright);c.lineTo(x+CELL+.4,y+CELL-q.qbottom+.4);c.lineTo(x,y+CELL-b+.4);c.closePath();
   if(quarry){c.fillStyle=quarryBase(kind)||c.fillStyle;c.fill();c.save();c.clip();if(!drawQuarrySurface(c,q,patterns)){c.fillStyle=patterns[kind]||c.fillStyle;c.fill();}drawQuarryShoulder(c,q);c.restore();}else c.fill();
   if(north-Math.min(a,q.qright)>12){const t=y-north,h=north-Math.min(a,q.qright);c.save();c.beginPath();c.moveTo(x,t);c.lineTo(x+CELL+.5,t);c.lineTo(x+CELL+.5,y-q.qright+1);c.lineTo(x,y-a+1);c.closePath();c.clip();c.fillStyle=patterns.cliffFace||patterns.rock||'#777366';c.fillRect(x,t,CELL+.5,h+2);const shade=c.createLinearGradient(0,t,0,t+h);shade.addColorStop(0,'rgba(49,41,30,.1)');shade.addColorStop(1,'rgba(25,28,24,.5)');c.fillStyle=shade;c.fillRect(x,t,CELL+.5,h+2);c.fillStyle=north===0?'#7e984b':'#b6aa89';c.fillRect(x,t,CELL+.5,3);c.restore();}

   if(!quarry&&q.ramp?.r.kind==='stairs'){c.strokeStyle='rgba(59,53,40,.5)';c.lineWidth=1;c.beginPath();c.moveTo(x,y-a);c.lineTo(x+CELL,y-a);c.stroke();}
  }
  for(const decoration of decorations)drawQuarryDetail(c,decoration);
  for(const wall of walls)drawCliffPiece(c,wall,patterns.cliffFace||patterns.rock,wall.grass?patterns.grass:patterns.rock);
  for(const structure of rampPieces)drawRampPiece(c,structure,patterns);
  bands.push({canvas,top,y:row+STRIP,bottom});
 }
 cached={built,ready,bands};return bands;
}
export function drawElevationBand(ctx,band){ctx.drawImage(band.canvas,0,band.top,band.canvas.width/SCALE,band.canvas.height/SCALE);}
