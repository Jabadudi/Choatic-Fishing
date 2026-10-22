import {nearWater,regionAt} from './wilds.js';
// Golden late-afternoon light over the visible view: grade, shafts, drifting motes and a vignette.
// Particles are view-relative (0..1) so they never leave the screen and are never reallocated.
export function createParticles(count=60,random=Math.random){
 const pollen=Math.round(count*34/60),leaves=Math.round(count*12/60),list=[];
 for(let i=0;i<count;i++)list.push({x:random(),y:random(),kind:i<pollen?'pollen':i<pollen+leaves?'leaf':'fly',phase:random()*6.28,speed:.3+random()*.7});
 return list;
}
const wrap=v=>v-Math.floor(v);
export function stepParticles(list,dt,t){
 for(const p of list){
  if(p.kind==='pollen'){p.x+=(Math.sin(t*.7+p.phase)*.25+.15*p.speed)*dt*.06;p.y+=(Math.cos(t*.5+p.phase)*.2-.05)*dt*.08;}
  else if(p.kind==='leaf'){p.x+=(.35*p.speed+Math.sin(t+p.phase)*.4)*dt*.06;p.y+=.45*p.speed*dt*.08;}
  else{p.x+=Math.sin(t*.9+p.phase)*.3*dt*.06;p.y+=Math.cos(t*.7+p.phase)*.3*dt*.08;}
  p.x=wrap(p.x);p.y=wrap(p.y);
 }
}
let particles=null,lastT=0;
export function drawAtmosphere(ctx,world,view){
 if(!world.adventure)return;
 const t=world.elapsed||0,{left:x0,top:y0}=view,W=view.right-x0,H=view.bottom-y0,p=world.player;
 particles??=createParticles();stepParticles(particles,Math.max(0,Math.min(.1,t-lastT)),t);lastT=t;
 const glow=nearWater(p.x,p.y,world.areaId)||['Forest Approach','Windchime Path'].includes(regionAt(p.x,p.y,world.areaId));
 ctx.save();
 ctx.globalCompositeOperation='soft-light';let g=ctx.createLinearGradient(x0,y0,x0+W*.6,y0+H);g.addColorStop(0,'rgba(255,190,90,.75)');g.addColorStop(1,'rgba(255,140,80,.25)');ctx.fillStyle=g;ctx.fillRect(x0,y0,W,H);
 ctx.globalCompositeOperation='multiply';g=ctx.createLinearGradient(0,y0+H*.45,0,y0+H);g.addColorStop(0,'rgb(255,255,255)');g.addColorStop(1,'rgb(150,165,205)');ctx.fillStyle=g;ctx.fillRect(x0,y0,W,H);
 ctx.globalCompositeOperation='screen';
 for(let i=0;i<4;i++){ctx.save();ctx.translate(x0-W*.2+i*W*.27+Math.sin(t*.15+i)*30,y0-40);ctx.rotate(-.5);g=ctx.createLinearGradient(0,0,120,0);g.addColorStop(0,'rgba(255,225,160,0)');g.addColorStop(.5,`rgba(255,225,160,${.07+.03*Math.sin(t*.4+i*2)})`);g.addColorStop(1,'rgba(255,225,160,0)');ctx.fillStyle=g;ctx.fillRect(0,0,120,H*1.6);ctx.restore();}
 ctx.globalCompositeOperation='source-over';
 for(const q of particles){
  const x=x0+q.x*W,y=y0+q.y*H;
  if(q.kind==='pollen'){ctx.fillStyle=`rgba(255,240,180,${.45+.35*Math.sin(t*2+q.phase)})`;ctx.fillRect(Math.round(x),Math.round(y),2,2);}
  else if(q.kind==='leaf'){ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2+q.phase));ctx.fillStyle=q.phase>3?'#d98a3a':'#b9c552';ctx.fillRect(-3,-1,6,3);ctx.restore();}
  else if(glow){const a=.5+.5*Math.sin(t*3+q.phase*5),r=ctx.createRadialGradient(x,y,0,x,y,10);r.addColorStop(0,`rgba(230,255,140,${a*.8})`);r.addColorStop(1,'rgba(230,255,140,0)');ctx.fillStyle=r;ctx.fillRect(x-10,y-10,20,20);}
 }
 g=ctx.createRadialGradient(x0+W/2,y0+H/2,H*.38,x0+W/2,y0+H/2,H*.85);g.addColorStop(0,'rgba(10,20,25,0)');g.addColorStop(1,'rgba(10,20,25,.55)');ctx.fillStyle=g;ctx.fillRect(x0,y0,W,H);
 ctx.restore();
}
