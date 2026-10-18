// Five times the original playable land area; camera scale stays unchanged.
export const LAND={left:155,right:155+650*Math.sqrt(5),top:120,bottom:120+490*Math.sqrt(5)};
export const LAKES=[{x:970,y:430,rx:170,ry:120},{x:610,y:900,rx:160,ry:110},{x:1300,y:940,rx:135,ry:150}];
export const CHESTS=[{id:0,x:530,y:560},{id:1,x:1390,y:650},{id:2,x:900,y:1100}];
export const lakeDistance=(x,y,l)=> (Math.hypot((x-l.x)/l.rx,(y-l.y)/l.ry)-1)*Math.min(l.rx,l.ry);
export const isWater=(x,y)=>x<LAND.left||x>LAND.right||y<LAND.top||y>LAND.bottom||LAKES.some(l=>lakeDistance(x,y,l)<0);
export const nearWater=(x,y)=>Math.min(x-LAND.left,LAND.right-x,y-LAND.top,LAND.bottom-y,...LAKES.map(l=>lakeDistance(x,y,l)))<=110+1e-8;
export const DECOR=Array.from({length:150},(_,i)=>({x:300+(i*317%1190),y:280+(i*233%830),kind:i%5===0?'rock':i%3===0?'bush':'tree',r:i%5===0?18:13})).filter(o=>!isWater(o.x,o.y)&&!LAKES.some(l=>lakeDistance(o.x,o.y,l)<45)&&!(o.x<820&&o.y<650)&&!CHESTS.some(c=>Math.hypot(o.x-c.x,o.y-c.y)<65));
// Spatial buckets keep collision checks local instead of scanning every tree.
const solids=new Map();
for(const o of DECOR){if(o.kind==='bush')continue;const key=`${Math.floor(o.x/64)},${Math.floor(o.y/64)}`;if(!solids.has(key))solids.set(key,[]);solids.get(key).push(o);}
export function walkable(x,y){
 if(x<LAND.left+15||x>LAND.right-15||y<LAND.top+15||y>LAND.bottom-15||LAKES.some(l=>lakeDistance(x,y,l)<15))return false;
 const gx=Math.floor(x/64),gy=Math.floor(y/64);
 for(let ix=gx-1;ix<=gx+1;ix++)for(let iy=gy-1;iy<=gy+1;iy++)for(const o of solids.get(`${ix},${iy}`)||[]){if((x-o.x)**2+(y-o.y)**2<(o.r+14)**2)return false;}
 return true;
}

function drawStaticTerrain(ctx){
 ctx.fillStyle='#b4aa7d';ctx.fillRect(LAND.left,LAND.top,LAND.right-LAND.left,LAND.bottom-LAND.top);
 ctx.fillStyle='#789367';ctx.fillRect(LAND.left+110,LAND.top+110,LAND.right-LAND.left-220,LAND.bottom-LAND.top-220);
 for(let i=0;i<850;i++){const x=LAND.left+20+i*173%(LAND.right-LAND.left-40),y=LAND.top+20+i*257%(LAND.bottom-LAND.top-40);ctx.fillStyle=i%2?'#92a274':'#617f59';ctx.fillRect(x,y,3,5);}
 for(const l of LAKES){for(const [extra,color] of [[110,'#b4aa7d'],[6,'#ddd09a'],[0,'#286878'],[-16,'#245767']]){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(l.x,l.y,l.rx+extra,l.ry+extra,0,0,Math.PI*2);ctx.fill();}}
 for(const o of DECOR){ctx.fillStyle='#243e3a33';ctx.beginPath();ctx.ellipse(o.x+8,o.y+12,26,12,0,0,Math.PI*2);ctx.fill();if(o.kind==='tree'){ctx.fillStyle='#715439';ctx.fillRect(o.x-5,o.y-8,10,25);ctx.fillStyle='#335b40';ctx.beginPath();ctx.arc(o.x,o.y-20,27,0,Math.PI*2);ctx.fill();ctx.fillStyle='#49774c';ctx.beginPath();ctx.arc(o.x-7,o.y-27,19,0,Math.PI*2);ctx.fill();}else{ctx.fillStyle=o.kind==='rock'?'#87928a':'#507d49';ctx.beginPath();ctx.ellipse(o.x,o.y,o.kind==='rock'?22:25,16,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=o.kind==='rock'?'#aab3a1':'#8ca45b';ctx.fillRect(o.x-11,o.y-8,13,5);}}
}
let terrainCache;
export function drawTerrain(ctx,world){
 // Static geometry is rasterized once, shared by every match and camera position.
 if(typeof document!=='undefined'){
  if(!terrainCache){terrainCache=document.createElement('canvas');terrainCache.width=Math.ceil(LAND.right+150);terrainCache.height=Math.ceil(LAND.bottom+150);drawStaticTerrain(terrainCache.getContext('2d'));}
  ctx.drawImage(terrainCache,0,0);
 }else drawStaticTerrain(ctx);
 for(const l of LAKES){ctx.strokeStyle='#89c8bf66';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.ellipse(l.x+Math.sin(world.elapsed+i)*4,l.y+i*27,l.rx*.55,4,0,0,Math.PI);ctx.stroke();}}
 for(const c of world.chests){ctx.fillStyle=c.opened?'#564637':'#9d692e';ctx.fillRect(c.x-19,c.y-13,38,27);ctx.strokeStyle='#e1bb60';ctx.lineWidth=3;ctx.strokeRect(c.x-19,c.y-13,38,27);ctx.fillStyle='#efd780';ctx.fillRect(c.x-3,c.y-5,6,9);ctx.font='10px Arial';ctx.textAlign='center';ctx.fillStyle='#fff2ce';ctx.fillText(c.opened?'OPENED':'KEY → FULL HEALTH',c.x,c.y-23);if(!c.opened&&Math.hypot(world.player.x-c.x,world.player.y-c.y)<70){ctx.fillText('Equip key · 2 then F',c.x,c.y+34);}}
}
