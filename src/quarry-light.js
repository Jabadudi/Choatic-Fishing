// Quarry lighting and motion are visual functions of world position and elapsed time only.
import {atlasPropArt} from './atlas-area-art.js';
import {drawQuarryWeed} from './quarry-ground-art.js';
const clamp=n=>Math.max(0,Math.min(1,n));
const hash=(x,y,s=0)=>{const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n);};
const wrap=n=>n-Math.floor(n);
let cached=null;
function inside(x,y,points){let yes=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
export function quarryLighting(built){
 if(cached?.built===built)return cached;
 const shadows=[],ripples=[];
 const add=(points,z)=>shadows.push({points,z,left:Math.min(...points.map(p=>p[0]))-4,right:Math.max(...points.map(p=>p[0]))+4,top:Math.min(...points.map(p=>p[1]))-4,bottom:Math.max(...points.map(p=>p[1]))+4});
 const beam=(a,b,width,z)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l*width/2,ny=dx/l*width/2;add([[a[0]+nx,a[1]+ny],[b[0]+nx,b[1]+ny],[b[0]-nx,b[1]-ny],[a[0]-nx,a[1]-ny]],z);};
 for(const p of built.props){
  if(['sign','bush','waterfall','boat'].includes(p.kind))continue;
  const art=atlasPropArt(p);if(!art)continue;
  const [,w0,h0]=art,s=p.scale||1,w=w0*s,h=h0*s,x=p.x,y=p.y,z=built.elevation.heightAt(x,y),dx=h*.5,dy=h*.65;
  if(p.art==='quarry-gantry'){
   for(const side of [-1,1])beam([x+side*w*.36,y],[x+side*w*.36+dx,y+dy],9,z);
   beam([x-w*.4+dx,y+dy],[x+w*.4+dx,y+dy],9,z);
  }else if(p.kind==='crane'){
   beam([x-w*.22,y],[x-w*.22+dx,y+dy],12,z);
   beam([x-w*.22+dx,y+dy],[x+w*.48+dx,y+dy-h*.13],8,z);
  }else{
   add([[x-w*.32,y-3],[x+w*.32,y-3],[x+w*.32+dx,y+dy],[x-w*.32+dx,y+dy]],z);
  }
 }
 for(let y=24;y<built.area.height;y+=60)for(let x=24;x<built.area.width;x+=60){
  const px=x+hash(x,y)*26,py=y+hash(x,y,1)*26,wet=built.water(px,py);
  if(wet> -25||built.deck(px,py)||hash(x,y,2)>.44)continue;
  const z=built.elevation.heightAt(px,py);
  if([[18,0],[-18,0],[0,10],[0,-10]].some(([dx,dy])=>built.water(px+dx,py+dy)>-8||built.elevation.heightAt(px+dx,py+dy)!==z))continue;
  ripples.push({x:px,y:py,z,phase:hash(x,y,3),row:Math.floor((py+12)/16)*16});
 }
 const dustSites=built.props.filter(p=>p.kind==='crane'||p.kind==='mine').slice(0,3).map(({x,y})=>({x,y,z:built.elevation.heightAt(x,y)}));
 return cached={built,shadows,ripples,dustSites};
}
export function quarryShade(built,light,x,y,z){
 let terrain=0;
 // Sun from the upper left. Short rays soften terrace shadows toward their outer edge.
 for(const d of [16,32,48,64,80,96])if(built.elevation.heightAt(x-d*.55,y-d*.8)>z+d*.75+10){terrain=.19*(1-d/125);break;}
 let prop=0;
 for(const s of light.shadows){
  if(s.z!==z||x<s.left||x>s.right||y<s.top||y>s.bottom)continue;
  const coverage=[[0,0],[-3,-3],[3,3]].filter(([dx,dy])=>inside(x+dx,y+dy,s.points)).length/3;
  prop=Math.max(prop,coverage*.19);
 }
 return Math.min(.25,terrain+prop);
}
export function shadeQuarryCell(c,q){
 if(q.shade>0){c.fillStyle=`rgba(25,43,43,${q.shade})`;c.fill();}
 if(q.water<0&&!q.deck){
  // Submerged rock and cliff shade read as depth, without bright foam around the pit.
  const deep=clamp((-q.water-18)/105),pit=q.z< -192;
  c.fillStyle=`rgba(13,48,54,${(pit ? .12 : .035)+deep*(pit ? .17 : .08)})`;c.fill();
 }
}
export function drawQuarryBandMotion(c,motion,t){
 for(const r of motion.ripples){
  const phase=wrap(t*.16+r.phase),alpha=Math.sin(phase*Math.PI)*.14,rx=5+phase*11;
  c.strokeStyle=`rgba(187,225,211,${alpha})`;c.lineWidth=1;c.beginPath();c.ellipse(r.x,r.y-r.z,rx,rx*.32,0,.1,Math.PI*1.5);c.stroke();
 }
 for(const d of motion.weeds)drawQuarryWeed(c,d,t);
}
export function drawQuarryActorShadow(c,actor,built){
 if(actor.entityType==='pickup')return;
 const z=built.elevation.heightAt(actor.x,actor.y);if(built.elevation.heightAt(actor.x+17,actor.y+20)!==z)return;
 c.save();c.fillStyle='rgba(25,40,38,.15)';c.beginPath();c.ellipse(actor.x+12,actor.y+17,23,7,.7,0,Math.PI*2);c.fill();c.restore();
}
export function drawQuarryAir(c,world,view,built){
 const t=world.elapsed||0,light=quarryLighting(built);
 c.save();
 // A gentle world-anchored daylight wash replaces the generic drifting leaves and fireflies here.
 c.globalCompositeOperation='soft-light';c.fillStyle='rgba(246,218,167,.22)';c.fillRect(view.left,view.top,view.right-view.left,view.bottom-view.top);c.globalCompositeOperation='multiply';c.fillStyle='rgba(211,212,198,.08)';c.fillRect(view.left,view.top,view.right-view.left,view.bottom-view.top);c.globalCompositeOperation='source-over';
 for(let site=0;site<light.dustSites.length;site++)for(let i=0;i<8;i++){
  const a=light.dustSites[site],seed=hash(site,i,4),x=a.x+(wrap(seed+t*(.007+hash(i,site)*.004))-.5)*290,y=a.y+(hash(i,site,2)-.5)*150+Math.sin(t*.24+seed*6.28)*8;
  if(built.elevation.heightAt(x,y)!==a.z||built.water(x,y)<0)continue;
  const sy=y-a.z-10-hash(i,site,5)*40;
  if(x<view.left||x>view.right||sy<view.top||sy>view.bottom)continue;
  c.globalAlpha=.12+.1*(.5+.5*Math.sin(t*.45+seed*6.28));c.fillStyle='#d7c4a0';c.beginPath();c.ellipse(x,sy,1+hash(i,site,3)*.8,.8,0,0,Math.PI*2);c.fill();
 }
 c.restore();
}
