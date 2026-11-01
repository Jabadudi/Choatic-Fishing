// The Reedwater Delta world map: the regional atlas with every playable area outlined where it sits, Eli's position
// and the story's next stop. Each area knows its piece of the atlas (its frame, in atlas pixels on the 720 × 480 map);
// atlas-built areas carry their own, the hand-built ones are listed here. Drawing only.
import {AREAS} from './wilds.js';
import {ATLAS_SIZE} from './atlas-area.js';
export const ATLAS_IMAGE='assets/codex/reedwater-delta-map.jpg';
// [left, right, top, bottom] in atlas pixels.
const FRAMES={windchime:[262,340,236,296],crossroads:[266,350,176,243],marsh:[322,424,172,290],
 village:[112,198,180,232],'village-port':[108,198,218,272],'village-market':[192,244,190,236],'village-farm':[234,270,178,236]};
// Rooms sit inside the area whose door they open from.
const PARENT={cabin:'landing','chief-house':'village','guest-lodge':'village'};
export const frameFor=id=>{const a=AREAS[PARENT[id]||id];return a?.frame||FRAMES[a?.id]||null;};
export const mapAreaId=id=>PARENT[id]||id;
// Where a point in an area lies on the atlas.
export function atlasPoint(id,x,y){
 const area=AREAS[mapAreaId(id)],f=frameFor(id);if(!area||!f)return null;
 if(PARENT[id])return {x:(f[0]+f[1])/2,y:(f[2]+f[3])/2};
 return {x:f[0]+(f[1]-f[0])*x/area.width,y:f[2]+(f[3]-f[2])*y/area.height};
}
export const playableAreas=()=>Object.values(AREAS).filter(a=>!PARENT[a.id]&&frameFor(a.id));
let image=null;
export function atlasImage(onload){
 if(typeof Image==='undefined')return null;
 if(!image){image=new Image();image.src=ATLAS_IMAGE;}
 if(onload&&!image.complete)image.addEventListener('load',onload,{once:true});
 return image.complete&&image.naturalWidth?image:null;
}
const GREEN='#7ee08a',GOLD='#ffd76a',INK='#10201c';
// view: {x, y, scale} puts atlas point (x, y) at the canvas centre, `scale` canvas pixels per atlas pixel.
export function paintWorld(c,width,height,world,view,{labels=false,target=null,t=0}={}){
 const img=atlasImage();
 c.save();c.fillStyle='#173038';c.fillRect(0,0,width,height);
 const ox=width/2-view.x*view.scale,oy=height/2-view.y*view.scale,s=view.scale,X=x=>ox+x*s,Y=y=>oy+y*s;
 c.imageSmoothingEnabled=true;
 if(img)c.drawImage(img,X(0),Y(0),ATLAS_SIZE.width*s,ATLAS_SIZE.height*s);
 // Everything outside the playable areas is dimmed, so the built world reads at a glance.
 c.fillStyle='rgba(8,18,22,.42)';c.fillRect(X(0),Y(0),ATLAS_SIZE.width*s,ATLAS_SIZE.height*s);
 const here=mapAreaId(world.areaId);
 for(const a of playableAreas()){
  const [l,r,tp,b]=frameFor(a.id);
  if(img)c.drawImage(img,l,tp,r-l,b-tp,X(l),Y(tp),(r-l)*s,(b-tp)*s);
  c.strokeStyle=a.id===here?GOLD:GREEN;c.lineWidth=a.id===here?2.5:1.5;c.globalAlpha=a.id===here?1:.85;c.strokeRect(X(l)+.5,Y(tp)+.5,(r-l)*s-1,(b-tp)*s-1);c.globalAlpha=1;
 }
 if(target&&frameFor(target.areaId)){const [l,r,tp,b]=frameFor(target.areaId),p=target.x!=null?atlasPoint(target.areaId,target.x,target.y):{x:(l+r)/2,y:(tp+b)/2},pulse=(t%1.6)/1.6;
  c.strokeStyle=GOLD;c.globalAlpha=1-pulse;c.lineWidth=3;c.beginPath();c.arc(X(p.x),Y(p.y),8+pulse*14,0,Math.PI*2);c.stroke();c.globalAlpha=1;
  c.fillStyle=GOLD;c.strokeStyle=INK;c.lineWidth=1.5;c.save();c.translate(X(p.x),Y(p.y));c.rotate(Math.PI/4);c.fillRect(-5,-5,10,10);c.strokeRect(-5,-5,10,10);c.restore();}
 if(labels){c.font='bold 11px Georgia, serif';c.textAlign='center';c.textBaseline='middle';
  // Labels that would overlap one already placed are skipped; Eli's own area is placed first so it always shows.
  const placed=[],list=playableAreas().sort((p,q)=>(q.id===here)-(p.id===here));
  for(const a of list){const [l,r,tp,b]=frameFor(a.id),x=X((l+r)/2),y=Y((tp+b)/2);const w=c.measureText(a.name).width+10;if(placed.some(q=>Math.abs(q.x-x)<(q.w+w)/2&&Math.abs(q.y-y)<17))continue;placed.push({x,y,w});c.fillStyle=a.id===here?'#3a2c0ccc':'#0c2119cc';c.fillRect(x-w/2,y-8,w,16);c.fillStyle=a.id===here?GOLD:'#e9f5dc';c.fillText(a.name,x,y+.5);}}
 const p=atlasPoint(world.areaId,world.player.x,world.player.y);
 if(p){c.translate(X(p.x),Y(p.y));c.rotate((world.player.angle||0)+Math.PI/2);c.fillStyle='#fff4c1';c.strokeStyle='#20383d';c.lineWidth=2;c.beginPath();c.moveTo(0,-8);c.lineTo(6,6);c.lineTo(0,3);c.lineTo(-6,6);c.closePath();c.stroke();c.fill();}
 c.restore();
}
// The whole atlas, fitted to the canvas.
export const fullView=(width,height)=>{const s=Math.min(width/ATLAS_SIZE.width,height/ATLAS_SIZE.height);return {x:ATLAS_SIZE.width/2,y:ATLAS_SIZE.height/2,scale:s};};
// Which playable area lies under a canvas point, for clicking through to its area map.
export function areaAt(cx,cy,width,height,view){
 const ax=view.x+(cx-width/2)/view.scale,ay=view.y+(cy-height/2)/view.scale;let best=null,bestArea=Infinity;
 for(const a of playableAreas()){const [l,r,t,b]=frameFor(a.id);if(ax>=l&&ax<=r&&ay>=t&&ay<=b&&(r-l)*(b-t)<bestArea){best=a.id;bestArea=(r-l)*(b-t);}}
 return best;
}
