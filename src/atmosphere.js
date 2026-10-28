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
function makeGradients(ctx,W,H){
 const warm=ctx.createLinearGradient(0,0,W*.6,H);warm.addColorStop(0,'rgba(255,190,90,.75)');warm.addColorStop(1,'rgba(255,140,80,.25)');
 const cool=ctx.createLinearGradient(0,H*.45,0,H);cool.addColorStop(0,'rgb(255,255,255)');cool.addColorStop(1,'rgb(150,165,205)');
 const shaft=ctx.createLinearGradient(0,0,120,0);shaft.addColorStop(0,'rgba(255,225,160,0)');shaft.addColorStop(.5,'rgb(255,225,160)');shaft.addColorStop(1,'rgba(255,225,160,0)');
 const vignette=ctx.createRadialGradient(W/2,H/2,H*.48,W/2,H/2,H*.9);vignette.addColorStop(0,'rgba(10,20,25,0)');vignette.addColorStop(1,'rgba(10,20,25,.3)');
 return {warm,cool,shaft,vignette};
}
function gradients(ctx,W,H){
 const t=ctx.getTransform?.(),k=t?Math.hypot(t.a,t.b):1;
 if(cache?.W===W&&cache.H===H&&cache.k===k)return cache;
 const {warm,cool,shaft,vignette}=makeGradients(ctx,W,H);
 // The full-view layers never change for a given view size, so each is painted once and then copied.
 const layer=fill=>{if(typeof document==='undefined')return null;const c=document.createElement('canvas');c.width=Math.max(1,Math.ceil(W*k));c.height=Math.max(1,Math.ceil(H*k));const l=c.getContext('2d');l.scale(c.width/W,c.height/H);l.fillStyle=fill;l.fillRect(0,0,W,H);return c;};
 return cache={W,H,k,warm,cool,shaft,vignette,warmLayer:layer(warm),coolLayer:layer(cool),vignetteLayer:layer(vignette)};
}
function glow(){
 if(glowSprite||typeof document==='undefined')return glowSprite;
 glowSprite=document.createElement('canvas');glowSprite.width=glowSprite.height=20;const c=glowSprite.getContext('2d'),r=c.createRadialGradient(10,10,0,10,10,10);
 r.addColorStop(0,'rgba(230,255,140,.8)');r.addColorStop(1,'rgba(230,255,140,0)');c.fillStyle=r;c.fillRect(0,0,20,20);return glowSprite;
}
const paint=(ctx,layer,fill,W,H)=>{if(layer)ctx.drawImage(layer,0,0,W,H);else{ctx.fillStyle=fill;ctx.fillRect(0,0,W,H);}};
// Full-view blend passes are cheap on a GPU canvas but cost several milliseconds each where the canvas is drawn
// on the CPU (Safari, and Firefox on a Mac). When mounted, the grade, shafts and vignette live in small canvases
// stacked over the game and blended by the browser's compositor, so the game canvas only draws the motes.
let overlay=null,overlayDrawn=false;
export function mountAtmosphere(parent){
 const root=document.createElement('div');root.className='atmosphere';root.hidden=true;root.setAttribute('aria-hidden','true');
 const layer=blend=>{const c=document.createElement('canvas');c.style.mixBlendMode=blend;root.append(c);return c;};
 overlay={root,warm:layer('soft-light'),cool:layer('multiply'),shafts:layer('screen'),vignette:layer('normal'),W:0,H:0};
 parent.append(root);return root;
}
const OVERLAY_SCALE=.5;
function paintOverlay(ctx,W,H){
 const o=overlay,k=ctx.getTransform?.(),pixels=(k?Math.hypot(k.a,k.b):1)*OVERLAY_SCALE,w=Math.max(1,Math.ceil(W*pixels)),h=Math.max(1,Math.ceil(H*pixels));
 if(o.W===W&&o.H===H&&o.shafts.width===w&&o.shafts.height===h)return;
 o.W=W;o.H=H;
 for(const [c,fill] of [[o.warm,'warm'],[o.cool,'cool'],[o.shafts,null],[o.vignette,'vignette']]){
  c.width=w;c.height=h;const l=c.getContext('2d');l.setTransform(w/W,0,0,h/H,0,0);
  if(fill){l.fillStyle=makeGradients(l,W,H)[fill];l.fillRect(0,0,W,H);}
 }
 const c=o.shafts.getContext('2d');c.fillStyle=makeGradients(c,W,H).shaft;
}
function drawShafts(c,W,H,t){
 for(let i=0;i<4;i++){c.save();c.translate(-W*.2+i*W*.27+Math.sin(t*.15+i)*30,-40);c.rotate(-.5);c.globalAlpha=.07+.03*Math.sin(t*.4+i*2);c.fillRect(0,0,120,H*1.6);c.restore();}
}
// Called once per rendered frame: hides the overlay when the last frame did not draw the atmosphere.
export function syncAtmosphere(){if(overlay){overlay.root.hidden=!overlayDrawn;overlayDrawn=false;}}
export function drawAtmosphere(ctx,world,view){
 if(!world.adventure)return;
 const t=world.elapsed||0,W=view.right-view.left,H=view.bottom-view.top,p=world.player;
 particles??=createParticles();stepParticles(particles,Math.max(0,Math.min(.1,t-lastT)),t);lastT=t;
 const fireflies=nearWater(p.x,p.y,world.areaId)||['Forest Approach','Windchime Path','Shellback Marsh'].includes(regionAt(p.x,p.y,world.areaId))?glow():null;
 let g=null;
 if(overlay){
  paintOverlay(ctx,W,H);overlayDrawn=true;overlay.root.hidden=false;
  const c=overlay.shafts.getContext('2d');c.clearRect(0,0,W,H);drawShafts(c,W,H,t);
  ctx.save();ctx.translate(view.left,view.top);
 }else{
  g=gradients(ctx,W,H);
  ctx.save();ctx.translate(view.left,view.top);
  ctx.globalCompositeOperation='soft-light';paint(ctx,g.warmLayer,g.warm,W,H);
  ctx.globalCompositeOperation='multiply';paint(ctx,g.coolLayer,g.cool,W,H);
  ctx.globalCompositeOperation='screen';ctx.fillStyle=g.shaft;drawShafts(ctx,W,H,t);
  ctx.globalCompositeOperation='source-over';
 }
 for(const q of particles){
  const x=q.x*W,y=q.y*H;
  if(q.kind==='pollen'){ctx.globalAlpha=.45+.35*Math.sin(t*2+q.phase);ctx.fillStyle='#fff0b4';ctx.fillRect(Math.round(x),Math.round(y),2,2);}
  else if(q.kind==='leaf'){ctx.globalAlpha=1;ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(t*2+q.phase));ctx.fillStyle=q.phase>3?'#d98a3a':'#b9c552';ctx.fillRect(-3,-1,6,3);ctx.restore();}
  else if(fireflies){ctx.globalAlpha=.5+.5*Math.sin(t*3+q.phase*5);ctx.drawImage(fireflies,x-10,y-10);}
 }
 ctx.globalAlpha=1;if(g)paint(ctx,g.vignetteLayer,g.vignette,W,H);
 ctx.restore();
}
