// Areas built straight from the Reedwater Delta atlas (assets/codex/reedwater-delta-map.jpg, 720 × 480 pixels).
// Each area is plain data in atlas pixels: a frame cut out of the atlas, a size in world units, and shapes for land
// and water, trails, boardwalks, fords, props, landmarks and exits. defineArea scales it all into world units and
// answers the questions the terrain code asks (where the water is, what is walkable, what is solid).
// Geometry and collision only; atlas-area-art.js paints the boardwalks, fords and props.
export const ATLAS_SIZE={width:720,height:480};
const segment=(x,y,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l)):0;return Math.hypot(x-ax-t*dx,y-ay-t*dy);};
const lineDistance=(x,y,pts)=>{let d=Infinity;for(let i=1;i<pts.length;i++)d=Math.min(d,segment(x,y,...pts[i-1],...pts[i]));return pts.length===1?Math.hypot(x-pts[0][0],y-pts[0][1]):d;};
export function inside(x,y,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;}
// Signed distance to a closed polygon: positive inside.
function polygonDistance(x,y,poly){let d=Infinity;for(let i=0,j=poly.length-1;i<poly.length;j=i++)d=Math.min(d,segment(x,y,...poly[j],...poly[i]));return inside(x,y,poly)?d:-d;}
const boxOf=(pts,pad=0)=>{let l=Infinity,r=-Infinity,t=Infinity,b=-Infinity;for(const [x,y] of pts){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return {l:l-pad,r:r+pad,t:t-pad,b:b+pad};};
const outside=(x,y,b)=>Math.max(b.l-x,x-b.r,b.t-y,y-b.b,0);
const KIND_REACH={tree:true};
// Props that block walking, as a radius in world units around the prop's foot.
export const PROP_SOLID={hut:46,'stilt-hut':0,tower:58,arch:0,pillar:16,boat:0,wheel:0,cave:0,tent:34,shell:60,stone:18,sign:0,cairn:16,crane:20,'big-tree':30,ruin:40,lantern:0,well:30,statue:22,bench:0,raft:0,nest:0,heron:0,shrine:28,dock:0,cart:24,logs:22,mine:0,lighthouse:40,wreck:0,gate:0};
// An arrival spot is either world units in the target area ({x, y}) or an atlas point ([ax, ay]) that linkEntries
// converts with the target's own frame, since every area shares the one atlas.
const entryOf=e=>Array.isArray(e)?{entry:null,entryAtlas:e}:{entry:e?{...e}:null};
export function defineArea(def){
 const [X0,X1,Y0,Y1]=def.frame,[W,H]=def.size,kx=W/(X1-X0),ky=H/(Y1-Y0),k=(kx+ky)/2;
 const P=([ax,ay])=>[(ax-X0)*kx,(ay-Y0)*ky],Ps=pts=>pts.map(P);
 const shapeZones=[];
 // Land and water, applied in order: land shapes raise ground out of the water, water shapes cut it away.
 const shapes=(def.shapes||[]).map(([op,form,...rest])=>{
  if(form==='line'){const [pts,width]=rest,line=Ps(pts),half=width*k/2;return {op,box:boxOf(line,half),sd:(x,y)=>half-lineDistance(x,y,line)};}
  if(form==='ellipse'){const [[cx,cy],rx,ry]=rest,[x0,y0]=P([cx,cy]),a=rx*kx,b=ry*ky;return {op,box:{l:x0-a,r:x0+a,t:y0-b,b:y0+b},sd:(x,y)=>(1-Math.hypot((x-x0)/a,(y-y0)/b))*Math.min(a,b)};}
  const poly=Ps(form);if(rest[0]?.zone)shapeZones.push([rest[0].zone,form]);return {op,box:boxOf(poly),sd:(x,y)=>polygonDistance(x,y,poly)};
 });
 const land=def.base!=='water';
 function water(x,y){
  let v=land?4000:-4000;
  // A shape whose box is far away cannot change the answer; inside its box it always might (overlapping shapes
  // would otherwise leave a seam along the inner edge).
  for(const s of shapes){const far=outside(x,y,s.box);if(s.op==='land'){if(far>0&&v>=-far)continue;v=Math.max(v,s.sd(x,y));}else{if(far>0&&v<=far)continue;v=Math.min(v,-s.sd(x,y));}}
  return v;
 }
 // Crossings run a little past both ends, so they always bite into the dry ground they join.
 const extend=pts=>{if(pts.length<2)return pts;const out=pts.map(p=>[...p]),push=(i,j)=>{const [ax,ay]=out[j],[bx,by]=out[i],l=Math.hypot(bx-ax,by-ay)||1;out[i]=[bx+(bx-ax)/l*30,by+(by-ay)/l*30];};push(0,1);push(out.length-1,out.length-2);return out;};
 const lines=(list,width)=>(list||[]).map(item=>{const raw=Array.isArray(item[0])?item:item.pts,w=(Array.isArray(item[0])?width:item.width||width)*k,pts=extend(Ps(raw));return {pts,half:w/2,box:boxOf(pts,w/2)};});
 const walks=lines(def.walks,2.6),fords=lines(def.fords,2.2),bridges=lines(def.bridges,3.2);
 const decks=[...walks,...fords,...bridges];
 const deck=(x,y)=>decks.some(d=>outside(x,y,d.box)===0&&lineDistance(x,y,d.pts)<=d.half);
// A land shape can carry its own ground ({zone:'sand'}); those come after the listed zones, which stay on top.
 for(const c of def.cliffs||[])shapeZones.unshift(['cliff',c]);
 const zones=[...(def.zones||[]),...shapeZones].map(([kind,poly])=>{const p=Ps(poly);return {kind,poly:p,box:boxOf(p)};});
 const zoneAt=(x,y)=>{for(const z of zones)if(outside(x,y,z.box)===0&&inside(x,y,z.poly))return z.kind;return def.ground||'meadow';};
 const props=(def.props||[]).map((p,i)=>{const [x,y]=P(p.at);return {id:`${def.id}-${p.kind}-${i}`,...p,x,y,r:p.solid??PROP_SOLID[p.kind]??0,area:def.id,inWater:water(x,y)<0};});
 const solidProps=props.filter(p=>p.r>0);
 const places=(def.places||[]).map(p=>{const [x,y]=P(p.at);const {at,...rest}=p;if(rest.travel)rest.travel={target:rest.travel.target,...entryOf(rest.travel.entry)};return {kind:'atlas',...rest,x:Math.round(x),y:Math.round(y)};});
 const roads=(def.roads||[]).map(Ps);
 const exits=(def.exits||[]).map(e=>{const horizontal=e.edge==='west'||e.edge==='east',from=horizontal?(e.from-Y0)*ky:(e.from-X0)*kx,to=horizontal?(e.to-Y0)*ky:(e.to-X0)*kx;return {edge:e.edge,from:Math.round(Math.min(from,to)),to:Math.round(Math.max(from,to)),target:e.target,label:e.label,back:e.back||null,...entryOf(e.entry)};});
 // Portals: a spot inside the area (a ford's far end, a cave mouth) that leads straight into another area.
 const portals=(def.portals||[]).map(q=>{const [x,y]=P(q.at);return {x:Math.round(x),y:Math.round(y),r:q.r||60,target:q.target,label:q.label,...entryOf(q.entry)};});
 const area={id:def.id,name:def.name,num:def.num,width:W,height:H,seed:def.seed||7400+[...def.id].reduce((a,c)=>a+c.charCodeAt(0),0),spawn:def.spawn?{x:Math.round(P(def.spawn)[0]),y:Math.round(P(def.spawn)[1])}:null,exits,portals,frame:def.frame,atlas:true,sea:!!def.sea,fromAtlas:pt=>{const [x,y]=P(pt);return {x:Math.round(x),y:Math.round(y)};}};
 // Arrivals snap onto the nearest trail, boardwalk or ford, so a diagonal trail still meets the edge where Eli lands.
 area.snap=(x,y)=>{let best=null,bd=170;for(const pts of [...roads,...decks.map(d=>d.pts)])for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i],dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/l)):0,px=ax+t*dx,py=ay+t*dy,d=Math.hypot(x-px,y-py);if(d<bd){bd=d;best={x:Math.round(px),y:Math.round(py)};}}return best||{x,y};};
 // Cliffs and steep rock: dry but solid, except where a trail or stair climbs them.
 const cliffs=(def.cliffs||[]).map(poly=>{const p=Ps(poly);return {poly:p,box:boxOf(p)};});
 const onRoad=(x,y)=>roads.some(r=>lineDistance(x,y,r)<30)||deck(x,y);
 const blocked=(x,y)=>solidProps.some(p=>(x-p.x)**2+(y-p.y)**2<(p.r+12)**2)||cliffs.some(c=>outside(x,y,c.box)===0&&inside(x,y,c.poly))&&!onRoad(x,y);
 area.places=places;
 return {area,water,deck,blocked,zoneAt,roads,places,props,walks,fords,bridges,toWorld:P,
  // Ground kept free of random trees and rocks: the walks' ends, landmarks and props.
  clear:(x,y)=>props.some(p=>Math.hypot(x-p.x,y-p.y)<(p.clear??90))||decks.some(d=>outside(x,y,d.box)<60&&lineDistance(x,y,d.pts)<d.half+50)};
}
// Exits without an explicit entry land just inside the matching exit of the area they lead to.
export function linkEntries(areas){
 const resolve=link=>{if(!link.entry&&link.entryAtlas&&areas[link.target]?.fromAtlas)link.entry=areas[link.target].fromAtlas(link.entryAtlas);};
 for(const area of Object.values(areas)){for(const q of area.portals||[])resolve(q);for(const p of area.places||[])if(p.travel)resolve(p.travel);}
 for(const area of Object.values(areas))for(const exit of area.exits||[]){
  resolve(exit);if(exit.entry)continue;
  const target=areas[exit.target];if(!target)continue;
  const back=target.exits.find(e=>e.target===area.id&&(!exit.back||e.label===exit.back))||target.exits.find(e=>e.target===area.id);
  if(!back){exit.entry={...target.spawn};continue;}
  const mid=Math.round((back.from+back.to)/2),inset=110;
  const spot=back.edge==='north'?{x:mid,y:inset}:back.edge==='south'?{x:mid,y:target.height-inset}:back.edge==='west'?{x:inset,y:mid}:{x:target.width-inset,y:mid};
  exit.entry=target.snap?target.snap(spot.x,spot.y):spot;
 }
 for(const area of Object.values(areas))if(area.atlas&&!area.spawn){const e=area.exits[0];if(e){const mid=Math.round((e.from+e.to)/2),inset=110;const spot=e.edge==='north'?{x:mid,y:inset}:e.edge==='south'?{x:mid,y:area.height-inset}:e.edge==='west'?{x:inset,y:mid}:{x:area.width-inset,y:mid};area.spawn=area.snap(spot.x,spot.y);}else area.spawn={x:area.width/2,y:area.height/2};}
}
