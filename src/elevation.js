// Gameplay height, in world units. Artwork never defines floors or collision.
export const ELEVATION_STEP=96;
export function polygonContains(x,y,points){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
export function compileElevation(def,point=p=>p,scale=1){
 if(!def||!def.terraces?.length&&!def.base)return null;
 const terraces=def.terraces.map(t=>({...t,points:t.points.map(point),z:t.height*ELEVATION_STEP}));
 const ramps=(def.ramps||[]).map(r=>({...r,from:point(r.from),to:point(r.to),width:r.width*scale}));
 function rampAt(x,y){for(const r of ramps){const dx=r.to[0]-r.from[0],dy=r.to[1]-r.from[1],d=dx*dx+dy*dy;if(!d)continue;const t=((x-r.from[0])*dx+(y-r.from[1])*dy)/d;if(t<0||t>1)continue;if(Math.hypot(x-r.from[0]-dx*t,y-r.from[1]-dy*t)<=r.width/2)return {r,t};}return null;}
 function heightAt(x,y){const slope=rampAt(x,y);if(slope)return (slope.r.fromHeight+(slope.r.toHeight-slope.r.fromHeight)*slope.t)*ELEVATION_STEP;let z=(def.base||0)*ELEVATION_STEP;for(const t of terraces)if(polygonContains(x,y,t.points))z=t.z;return z;}
 function canTraverse(ax,ay,bx,by){const length=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.ceil(length/4));let z=heightAt(ax,ay);for(let i=1;i<=n;i++){const next=heightAt(ax+(bx-ax)*i/n,ay+(by-ay)*i/n);if(Math.abs(next-z)>length/n*1.5+.15)return false;z=next;}return true;}
 function canReach(a,b,tolerance=24){const z=Number.isFinite(a.elevation)?a.elevation:heightAt(a.x,a.y),target=Number.isFinite(b.elevation)?b.elevation:heightAt(b.x,b.y);if(Math.abs(z-target)>tolerance)return false;const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/8));for(let i=1;i<n;i++)if(Math.abs(heightAt(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n)-z)>tolerance)return false;return true;}
 // Picking follows the frontmost visible surface, matching the terrain painter.
 function unproject(x,screenY){let best=null,error=Infinity;const lo=Math.min(0,...terraces.map(t=>t.z)),hi=Math.max(0,...terraces.map(t=>t.z));for(let y=screenY+lo-2;y<=screenY+hi+2;y+=2){const d=Math.abs(y-heightAt(x,y)-screenY);if(d<=error){best=y;error=d;}}return {x,y:best??screenY};}
 return {base:(def.base||0)*ELEVATION_STEP,terraces,ramps,heightAt,rampAt,canTraverse,canReach,unproject,project:(x,y)=>({x,y:y-heightAt(x,y)})};
}

const level=n=>Number.isInteger(n)&&n>=-6&&n<=6;
const id=s=>typeof s==='string'&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(s);
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
export function validateElevation(value){
 if(value===null)return null;
 const e=structuredClone(value),seen=new Set();
 if(!e||!level(e.base??0)||!Array.isArray(e.terraces)||e.terraces.length>32||!Array.isArray(e.ramps)||e.ramps.length>64)throw Error('Invalid elevation data.');
 for(const t of e.terraces){if(!id(t.id)||seen.has(t.id)||!level(t.height)||!Array.isArray(t.points)||t.points.length<3||t.points.length>64||!t.points.every(point))throw Error('A terrace needs a unique name, a whole height and at least three points.');const area=t.points.reduce((sum,p,i)=>{const n=t.points[(i+1)%t.points.length];return sum+p[0]*n[1]-n[0]*p[1];},0);if(Math.abs(area)<.2)throw Error('Terrace corners must enclose an area.');seen.add(t.id);}
 for(const r of e.ramps){if(!id(r.id)||seen.has(r.id)||!point(r.from)||!point(r.to)||Math.hypot(r.to[0]-r.from[0],r.to[1]-r.from[1])<6||!Number.isFinite(r.width)||r.width<1||r.width>16||!level(r.fromHeight)||!level(r.toHeight)||!(Math.abs(r.toHeight-r.fromHeight)===1||r.kind==='stairs'&&Math.abs(r.toHeight-r.fromHeight)===2)||!['ramp','stairs'].includes(r.kind))throw Error('A ramp needs neighboring heights (stairs may span two levels), length at least 6 and width 1–16 atlas units.');seen.add(r.id);}
 const ground=compileElevation({...e,ramps:[]});
 for(const r of e.ramps)if((ground?.heightAt(...r.from)||0)!==r.fromHeight*96||(ground?.heightAt(...r.to)||0)!==r.toHeight*96)throw Error('Both ramp ends must land on the selected terrace heights. Adjust the ends or remove connected ramps first.');
 return {base:e.base??0,terraces:e.terraces.map(({id,height,points})=>({id,height,points})),ramps:e.ramps.map(({id,from,to,width,fromHeight,toHeight,kind})=>({id,from,to,width,fromHeight,toHeight,kind}))};
}
