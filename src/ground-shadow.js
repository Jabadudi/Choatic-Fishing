// One shadow for everything that stands on the ground: Eli, monsters, trees, rocks and furniture. The light comes from
// the upper left (the same light the cliffs and the painted props use), so every shadow falls a little to the right and
// down from the foot, as a soft oval: a faint outer ring and a darker core. rx is the half width at the foot.
export const SHADOW={dx:.22,dy:2,color:'18,34,22',core:.3,outer:.14};
let muted=false;
export function castShadow(ctx,x,y,rx,{ry=Math.max(3,rx*.36),strength=1}={}){
 if(muted)return;
 const ox=x+rx*SHADOW.dx,oy=y+SHADOW.dy;
 ctx.save();
 ctx.fillStyle=`rgba(${SHADOW.color},${SHADOW.outer*strength})`;ctx.beginPath();ctx.ellipse(ox+rx*.08,oy+1,rx*1.18,ry*1.25,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle=`rgba(${SHADOW.color},${SHADOW.core*strength})`;ctx.beginPath();ctx.ellipse(ox,oy,rx,ry,0,0,Math.PI*2);ctx.fill();
 ctx.restore();
}

// The layered areas cast every shadow in one pass, before anyone is drawn. Each prop throws its own painted outline
// onto the ground (flattened and leaned away from the light), and each creature gets a small contact oval right under
// its feet. All of it is drawn solid into one buffer at two game pixels per texel, then laid on the ground once at a
// single strength, so shadows have crisp pixel edges like the art and never stack darker where they overlap.
export const CAST={lean:.5,drop:.2,alpha:.3,texel:2};
let buffer=null;
export function shadowPass(ctx,draw){
 const canvas=ctx.canvas;
 if(typeof document==='undefined'||!canvas?.width||typeof ctx.getTransform!=='function')return false;
 const T=ctx.getTransform(),q=Math.max(1,Math.round(Math.hypot(T.a,T.b)*CAST.texel)),w=Math.ceil(canvas.width/q),h=Math.ceil(canvas.height/q);
 buffer??=document.createElement('canvas');
 if(buffer.width!==w||buffer.height!==h){buffer.width=w;buffer.height=h;}
 const s=buffer.getContext('2d');
 s.setTransform(1,0,0,1,0,0);s.clearRect(0,0,w,h);s.globalCompositeOperation='source-over';s.globalAlpha=1;s.imageSmoothingEnabled=false;
 s.setTransform(T.a/q,T.b/q,T.c/q,T.d/q,T.e/q,T.f/q);s.fillStyle='#000';
 draw(s);
 // Every texel the props and creatures touched becomes one even shadow tone.
 s.setTransform(1,0,0,1,0,0);s.globalCompositeOperation='source-in';s.fillStyle=`rgb(${SHADOW.color})`;s.fillRect(0,0,w,h);s.globalCompositeOperation='source-over';
 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=CAST.alpha;ctx.drawImage(buffer,0,0,w*q,h*q);ctx.restore();
 return true;
}
// While the sorted layer draws after a shadow pass, the old per-object shadows stay off.
export function muteShadows(on){muted=on;}
// A contact shadow: a flat oval straight under the feet, nudged a touch away from the light.
export function contactShadow(s,x,y,rx,ry=Math.max(2.5,rx*.34)){s.beginPath();s.ellipse(x+rx*.1,y,rx,ry,0,0,Math.PI*2);s.fill();}
// Lays whatever draw() paints (a sprite standing on (x,y)) down on the ground, leaning right and down from its foot.
export function projectFrom(s,x,y,draw,scale=1){
 s.save();s.transform(1,0,-CAST.lean,-CAST.drop,CAST.lean*y,y+CAST.drop*y);
 if(scale!==1){s.translate(x,y);s.scale(scale,scale);s.translate(-x,-y);}
 draw(s);s.restore();
}
