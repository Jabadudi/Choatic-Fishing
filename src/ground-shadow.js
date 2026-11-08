// One shadow for everything that stands on the ground: Eli, monsters, trees, rocks and furniture. The light comes from
// the upper left (the same light the cliffs and the painted props use), so every shadow falls a little to the right and
// down from the foot, as a soft oval: a faint outer ring and a darker core. rx is the half width at the foot.
export const SHADOW={dx:.22,dy:2,color:'18,34,22',core:.3,outer:.14};
export function castShadow(ctx,x,y,rx,{ry=Math.max(3,rx*.36),strength=1}={}){
 const ox=x+rx*SHADOW.dx,oy=y+SHADOW.dy;
 ctx.save();
 ctx.fillStyle=`rgba(${SHADOW.color},${SHADOW.outer*strength})`;ctx.beginPath();ctx.ellipse(ox+rx*.08,oy+1,rx*1.18,ry*1.25,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=`rgba(${SHADOW.color},${SHADOW.core*strength})`;ctx.beginPath();ctx.ellipse(ox,oy,rx,ry,0,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
