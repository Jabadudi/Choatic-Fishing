// Quarry surface artwork. Everything is deterministic, decorative and independent of simulation.
const hash=(x,y,s=0)=>{const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n);};
const lerp=(a,b,t)=>a+(b-a)*t;
function field(x,y,size,seed=0){x/=size;y/=size;const ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,s=u*u*(3-2*u),t=v*v*(3-2*v);return lerp(lerp(hash(ix,iy,seed),hash(ix+1,iy,seed),s),lerp(hash(ix,iy+1,seed),hash(ix+1,iy+1,seed),s),t);}
const clamp=x=>Math.max(0,Math.min(1,x));
export function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy,t=d?clamp(((x-a[0])*dx+(y-a[1])*dy)/d):0;return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);}
export function routeDistance(x,y,trails){let d=Infinity;for(const [a,b]of trails)d=Math.min(d,segmentDistance(x,y,a,b));return d;}
function pattern(c,p,alpha){if(!p||alpha<=0)return;c.globalAlpha=alpha;c.fillStyle=p;c.fill();c.globalAlpha=1;}
const BASES={rock:'#8c8b82',dirt:'#b38c58',path:'#bb9d6c'};
export const quarryBase=kind=>BASES[kind];
export function drawQuarrySurface(c,q,patterns){
 const {x,y,kind}=q;
 if(q.water<0&&q.z<=-480&&!q.deck){
  const deep=clamp((-q.water-12)/100);c.fillStyle=deep>.7?'#124f50':deep>.3?'#226a61':'#438779';c.fill();
  pattern(c,patterns.river,.13);if(q.water>-48)pattern(c,patterns.rock,.42);c.fillStyle='rgba(28,120,96,.16)';c.fill();return true;
 }
 const rock=kind==='rock',soil=kind==='dirt',path=kind==='path';
 if(!rock&&!soil&&!path)return false;
 // Broad stone exposures and dust deposits replace uniform small-scale texture repetition.
 const broad=field(x,y,220,3)*.65+field(x,y,83,7)*.35;
 const exposure=clamp((broad-.34)*2.5),dust=field(x,y,145,9);
 c.fillStyle=quarryBase(kind);c.fill();
 pattern(c,patterns.rock,path ? .15 : rock ? .76+exposure*.18 : exposure*.18);
 pattern(c,patterns.dirt,path ? .45 : rock ? (1-exposure)*.1 : .4);
 c.globalAlpha=path ? .06 : .08+dust*.12;c.fillStyle=rock?'#c0af88':'#c2ab7f';c.fill();c.globalAlpha=1;
 return true;
}
export function drawQuarryShoulder(c,q){
 if(!['rock','dirt','grass'].includes(q.kind)||q.ramp)return;
 const edge=43+(field(q.x,q.y,38,5)-.5)*13;
 const fade=clamp((edge-q.routeDistance)/(edge-18));
 if(!fade)return;c.globalAlpha=fade*.5;c.fillStyle='#bb9d6c';c.fill();c.globalAlpha=1;
}
export function quarryGroundDetails(built,trails){
 const e=built.elevation,edges=e.terraces.flatMap(t=>t.points.map((a,i)=>[a,t.points[(i+1)%t.points.length]]));
 const details=[],W=built.area.width,H=built.area.height;
 function valid(x,y,z){return x>2&&y>2&&x<W-2&&y<H-2&&e.heightAt(x,y)===z&&!e.rampAt(x,y)&&built.water(x,y)>0&&!built.deck(x,y)&&routeDistance(x,y,trails)>46&&['rock','dirt'].includes(built.zoneAt(x,y));}
 for(let gy=0;gy<H;gy+=46)for(let gx=0;gx<W;gx+=46){
  const x=gx+hash(gx,gy,1)*46,y=gy+hash(gx,gy,2)*46,z=e.heightAt(x,y);
  if(!valid(x,y,z))continue;
  let edge=Infinity;for(const [a,b]of edges)edge=Math.min(edge,segmentDistance(x,y,a,b));
  const n=hash(gx,gy,3),close=edge<43,crack=!close&&n<.055;
  if(!close&&!crack&&n>.075)continue;
  const chips=[];
  if(!crack)for(let k=0;k<(close?5:3);k++){
   const px=x+(hash(gx,gy,k+5)-.5)*31,py=y+(hash(gx,gy,k+15)-.5)*22;
   if(valid(px,py,z))chips.push({x:px,y:py,size:3+hash(gx,gy,k+25)*(close?8:4),tone:hash(gx,gy,k+35)});
  }
  const weed=close&&n<.38||crack&&n<.025;
  details.push({x,y,z,chips,crack,weed,seed:n,row:Math.floor((y+24)/16)*16});
 }
 const pit=e.terraces.find(t=>t.id==='flooded-pit');
 if(pit)for(let edge=0;edge<pit.points.length;edge++){
  const a=pit.points[edge],b=pit.points[(edge+1)%pit.points.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),nx=-dy/length,ny=dx/length;
  for(let i=0;i<length;i+=62){const t=(i+20)/length;if(t>1)continue;const x=a[0]+dx*t,y=a[1]+dy*t,sign=e.heightAt(x+nx*5,y+ny*5)===-480?1:-1;
   for(const inset of [22,51]){if(inset===51&&hash(edge,i,8)>.25)continue;const px=x+nx*sign*inset,py=y+ny*sign*inset;
    if(built.water(px,py)>-5||e.heightAt(px,py)!==-480)continue;
    details.push({shelf:true,x:px,y:py,z:-480,size:17+hash(edge,i,9)*15,seed:hash(edge,i,10),row:Math.floor((py+24)/16)*16});
   }
  }
 }
 return details;
}
export function drawQuarryDetail(c,d,{weed=true,stone=null}={}){
 const {x,y,z,seed}=d,sy=y-z;
 if(d.shelf){const r=d.size;c.save();c.globalAlpha=.8;c.fillStyle='#20594f';c.beginPath();c.moveTo(x-r,sy-4);c.lineTo(x+r*.7,sy-7);c.lineTo(x+r,sy+10);c.lineTo(x-r*.7,sy+15);c.closePath();c.fill();c.fillStyle=stone||'#4b8873';c.beginPath();c.moveTo(x-r,sy-r*.15);c.lineTo(x-r*.8,sy-r*.65);c.lineTo(x-r*.2,sy-r*.6);c.lineTo(x-r*.1,sy-r*.78);c.lineTo(x+r*.7,sy-r*.65);c.lineTo(x+r*.95,sy-r*.25);c.lineTo(x+r*.7,sy+r*.28);c.lineTo(x-r*.6,sy+r*.42);c.closePath();c.fill();c.fillStyle='rgba(32,125,100,.65)';c.fill();c.strokeStyle='rgba(132,181,143,.5)';c.lineWidth=2;c.beginPath();c.moveTo(x-r,sy-4);c.lineTo(x-r*.6,sy-r*.65);c.lineTo(x+r*.5,sy-r*.7);c.stroke();c.restore();return;}
 if(d.crack){
  c.strokeStyle='rgba(54,53,43,.42)';c.lineWidth=1.5;c.beginPath();c.moveTo(x-19,sy-5);c.lineTo(x-7,sy-1);c.lineTo(x+1,sy-5);c.lineTo(x+18,sy+1);c.moveTo(x-7,sy-1);c.lineTo(x-10,sy+7);c.stroke();
  c.strokeStyle='rgba(195,183,150,.55)';c.lineWidth=1;c.beginPath();c.moveTo(x-18,sy-3);c.lineTo(x-7,sy+1);c.stroke();
 }
 for(const chip of d.chips){
  const {x,size:r,tone}=chip,y=chip.y-z;
  c.fillStyle='rgba(44,42,33,.18)';c.beginPath();c.ellipse(x+1,y+2,r*1.1,r*.5,0,0,Math.PI*2);c.fill();
  c.fillStyle=tone>.55?'#777566':'#9e9780';c.beginPath();c.moveTo(x-r,y);c.lineTo(x-r*.5,y-r*.65);c.lineTo(x+r*.45,y-r*.8);c.lineTo(x+r,y-r*.1);c.lineTo(x+r*.5,y+r*.4);c.lineTo(x-r*.6,y+r*.3);c.closePath();c.fill();
  c.fillStyle=tone>.55?'#aaa48c':'#c0b59a';c.beginPath();c.moveTo(x-r,y);c.lineTo(x-r*.5,y-r*.65);c.lineTo(x+r*.45,y-r*.8);c.lineTo(x+r*.2,y-r*.1);c.closePath();c.fill();
 }
 if(weed&&d.weed)drawQuarryWeed(c,d,0);
}
export function drawQuarryWeed(c,d,t=0){
 const {x,y,z,seed}=d,sy=y-z,sway=Math.sin(t*1.2+x*.03)*1.6;
  c.strokeStyle='rgba(43,47,29,.24)';c.lineWidth=3;c.beginPath();c.moveTo(x-4,sy+2);c.lineTo(x+5,sy+2);c.stroke();
  c.lineWidth=1.5;for(let i=-2;i<=2;i++){c.strokeStyle=i%2?'#737c48':'#87925b';c.beginPath();c.moveTo(x,sy);c.quadraticCurveTo(x+i*1.5,sy-4-seed*4,x+i*3+sway,sy-5-Math.abs(i)*1.5);c.stroke();}
}
