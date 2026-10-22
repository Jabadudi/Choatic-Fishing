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
let particles=null,lastT=0,cache=null,glowSprite=null;
// Gradients live in view-local space keyed by size, so a moving camera reuses them every frame.
function gradients(ctx,W,H){
 if(cache?.W===W&&cache.H===H)return cache;
 const warm=ctx.createLinearGradient(0,0,W*.6,H);warm.addColorStop(0,'rgba(255,190,90,.75)');warm.addColorStop(1,'rgba(255,140,80,.25)');
 const cool=ctx.createLinearGradient(0,H*.45,0,H);cool.addColorStop(0,'rgb(255,255,255)');cool.addColorStop(1,'rgb(150,165,205)');
 const shaft=ctx.createLinearGradient(0,0,120,0);shaft.addColorStop(0,'rgba(255,225,160,0)');shaft.addColorStop(.5,'rgb(255,225,160)');shaft.addColorStop(1,'rgba(255,225,160,0)');
 const vignette=ctx.createRadialGradient(W/2,H/2,H*.38,W/2,H/2,H*.85);vignette.addColorStop(0,'rgba(10,20,25,0)');vignette.addColorStop(1,'rgba(10,20,25,.55)');
 return cache={W,H,warm,cool,shaft,vignette};
}
function glow(){
 if(glowSprite||typeof document==='undefined')return glowSprite;
 glowSprite=document.createElement('canvas');glowSprite.width=glowSprite.height=20;const c=glowSprite.getContext('2d'),r=c.createRadialGradient(10,10,0,10,10,10);
 r.addColorStop(0,'rgba(230,255,140,.8)');r.addColorStop(1,'rgba(230,255,140,0)');c.fillStyle=r;c.fillRect(0,0,20,20);return glowSprite;
}
export function drawAtmosphere(ctx,world,view){
 if(!world.adventure)return;
 const t=world.elapsed||0,W=view.right-view.left,H=view.bottom-view.top,p=world.player,g=gradients(ctx,W,H);
 particles??=createParticles();stepParticles(particles,Math.max(0,Math.min(.1,t-lastT)),t);lastT=t;
 const fireflies=nearWater(p.x,p.y,world.areaId)||['Forest Approach','Windchime Path'].includes(regionAt(p.x,p.y,world.areaId))?glow():null;
 ctx.save();ctx.translate(view.left,view.top);
 ctx.globalCompositeOperation='soft-light';ctx.fillStyle=g.warm;ctx.fillRect(0,0,W,H);
 ctx.globalCompositeOperation='multiply';ctx.fillStyle=g.cool;ctx.fillRect(0,0,W,H);
 ctx.globalCompositeOperation='screen';ctx.fillStyle=g.shaft;
 for(let i=0;i<4;i++){ctx.save();ctx.translate(-W*.2+i*W*.27+Math.sin(t*.15+i)*30,-40);ctx.rotate(-.5);ctx.globalAlpha=.07+.03*Math.sin(t*.4+i*2);ctx.fillRect(0,0,120,H*1.6);ctx.restore();}
 ctx.globalCompositeOperation='source-over';
 for(const q of particles){
  const x=q.x*W,y=q.y*H;
  if(q.kind==='pollen'){ctx.globalAlpha=.45+.35*Math.sin(t*2+q.phase);ctx.fillStyle='#fff0b4';ctx.fillRect(Math.round(x),Math.round(y),2,2);}
  else if(q.kind==='leaf'){ctx.globalAlpha=1;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2+q.phase));ctx.fillStyle=q.phase>3?'#d98a3a':'#b9c552';ctx.fillRect(-3,-1,6,3);ctx.restore();}
  else if(fireflies){ctx.globalAlpha=.5+.5*Math.sin(t*3+q.phase*5);ctx.drawImage(fireflies,x-10,y-10);}
 }
 ctx.globalAlpha=1;ctx.fillStyle=g.vignette;ctx.fillRect(0,0,W,H);
 ctx.restore();
}
