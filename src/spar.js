// Chapter 6: Eli's first spar with Drayfus, played as a fight in the training circle. Gameplay only; story.js starts it
// and plays the scene that follows.
// Drayfus circles Eli, drops his shoulder, then lunges with his practice sword. A lunge that lands puts Eli on the ground.
// Swinging while Drayfus is ready just makes him step aside and counter. The opening is right after a lunge misses:
// dash out of it (Shift) or step back, then hit him while he recovers. The spar ends at the first hit, or when Eli
// has been knocked down ten times. Nothing here hurts: the spar does not touch Eli's health.
import {TRAINING_GROUND,CIRCLE} from './training-ground.js';
export const SPAR_KNOCKDOWNS=10;
// From the sixth knockdown, Still Water steadies Eli and he can read the shoulder drop for longer.
export const SPAR_STILL_WATER=6;
export const SPAR={circle:118,windup:.7,steadyWindup:1,lunge:.2,reach:64,recover:.9,down:1.1,swing:.45,swingReach:86,pause:[1.1,1.8]};
const LINES=['“Up.”','“Up.” Mara is laughing behind her hand.','“Again.”','“Up.” Emilia has stopped drinking her tea.','“Your shoulders, Eli.”','“Up.”','“Better. Again.”','“Up.”','“Watch me, not the sword.”','“That’s ten.”'];
export const sparLine=downs=>LINES[Math.min(LINES.length,downs)-1];
export const sparObjective=f=>`Chapter 6 · Spar with Drayfus. Watch his shoulders, dodge his lunge with Shift, and hit him while he recovers (knocked down ${f.downs}/${SPAR_KNOCKDOWNS}).`;
const drayfusOf=w=>w.npcs.find(n=>n.id==='drayfus'&&n.areaId===TRAINING_GROUND.id);
export function startSpar(w){
 const d=drayfusOf(w);
 w.spar={downs:0,touched:false,phase:'circle',time:0,pause:1.4,orbit:Math.atan2(d.y-w.player.y,d.x-w.player.x),down:0,swing:0,lunge:null};
 if(d){d.animationState='idle';d.talkRange=-1;}
 w.message='Drayfus hands you a wooden practice sword. “Attack me.” Click to swing.';
}
export const sparDown=w=>(w.spar?.down||0)>0;
function phase(f,name){f.phase=name;f.time=0;f.flagged=false;}
function face(d,x,y){const dx=x-d.x,dy=y-d.y;d.direction=Math.abs(dx)>Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');d.facingX=dx;}
// Steps Drayfus toward a point, staying on open ground inside the yard.
// The yard's collision comes in from updateSpar (story.js gets it from the world), which keeps this module out of an import cycle.
let ground=()=>true;
function stepTo(d,x,y,speed,dt){
 const dx=x-d.x,dy=y-d.y,len=Math.hypot(dx,dy);if(len<2)return false;
 const step=Math.min(len,speed*dt),nx=d.x+dx/len*step,ny=d.y+dy/len*step;
 if(ground(nx,ny,TRAINING_GROUND.id)){d.x=nx;d.y=ny;return true;}
 return false;
}
function knockDown(w,d){
 const f=w.spar,p=w.player,angle=Math.atan2(p.y-d.y,p.x-d.x);
 f.downs++;f.down=SPAR.down;
 p.vx+=Math.cos(angle)*220;p.vy+=Math.sin(angle)*220;
 w.effects.push({name:'player-hit',label:'Down!',x:p.x,y:p.y-44,angle:0,life:.9,duration:.9});
 w.message=f.downs===SPAR_STILL_WATER?'Region Core · [Still Water] has activated. The panic sinks like a stone. You can see his shoulder drop before he moves.':sparLine(f.downs);
}
// Eli's swing: a hit only lands while Drayfus is recovering from a lunge. Otherwise he steps aside and counters.
export function sparSwing(w){
 const f=w.spar,p=w.player,d=drayfusOf(w);if(!f||!d||f.down>0||f.swing>0||f.touched)return false;
 f.swing=SPAR.swing;
 w.effects.push({name:'Practice Sword',x:p.x,y:p.y,angle:p.angle,life:.3,duration:.3});
 const dx=d.x-p.x,dy=d.y-p.y,reach=Math.hypot(dx,dy)<=SPAR.swingReach;
 const ahead=Math.abs(Math.atan2(Math.sin(Math.atan2(dy,dx)-p.angle),Math.cos(Math.atan2(dy,dx)-p.angle)))<=1.1;
 if(!reach||!ahead)return true;
 if(f.phase==='recover'){f.touched=true;w.effects.push({name:'player-hit',label:'Hit!',x:d.x,y:d.y-70,angle:0,life:1,duration:1});w.message='Your practice sword taps Drayfus on the ribs.';return true;}
 if(f.phase==='circle'||f.phase==='windup'){
  // He was never there: a sidestep, and the counter is already coming.
  const side=Math.atan2(dy,dx)+((w.random?.()??.5)<.5?1:-1)*Math.PI/2;
  for(let i=0;i<8;i++)stepTo(d,d.x+Math.cos(side)*60,d.y+Math.sin(side)*60,600,1/8);
  phase(f,'windup');f.windup=.4;w.message='Drayfus isn’t there anymore.';
 }
 return true;
}
// Advances the spar. Returns 'touch' or 'ten' when it is over.
export function updateSpar(w,dt,walkable){
 if(walkable)ground=walkable;
 const f=w.spar,p=w.player,d=drayfusOf(w);if(!f||!d)return null;
 f.time+=dt;f.swing=Math.max(0,f.swing-dt);
 // A hit ends it: everyone stops for a breath before the scene.
 if(f.touched){f.over=(f.over||0)+dt;d.animationState='idle';return f.over>=.8?'touch':null;}
 if(f.downs>=SPAR_KNOCKDOWNS&&f.down<=0)return 'ten';
 if(f.down>0){f.down=Math.max(0,f.down-dt);p.vx*=.85;p.vy*=.85;}
 face(d,p.x,p.y);
 const distance=Math.hypot(p.x-d.x,p.y-d.y),steady=f.downs>=SPAR_STILL_WATER;
 if(f.phase==='circle'){
  // Circles Eli at a sword's length and a half, inside the ring.
  f.orbit+=dt*.9;
  const tx=Math.max(CIRCLE.x-CIRCLE.rx+40,Math.min(CIRCLE.x+CIRCLE.rx-40,p.x+Math.cos(f.orbit)*SPAR.circle));
  const ty=Math.max(CIRCLE.y-CIRCLE.ry+40,Math.min(CIRCLE.y+CIRCLE.ry-30,p.y+Math.sin(f.orbit)*SPAR.circle*.75));
  const moved=stepTo(d,tx,ty,150,dt);d.animationState=moved?'walk':'idle';d.walkTime=(d.walkTime||0)+dt*7;
  if(f.time>=f.pause&&f.down<=0&&distance<SPAR.circle*1.6){phase(f,'windup');f.windup=steady?SPAR.steadyWindup:SPAR.windup;}
  return null;
 }
 if(f.phase==='windup'){
  d.animationState='idle';
  if(!f.flagged){f.flagged=true;w.effects.push({name:'notice',label:steady?'Shoulder!':'!',x:d.x,y:d.y-78,angle:0,life:f.windup,duration:f.windup});}
  if(f.time>=f.windup){phase(f,'lunge');f.lunge={x:p.x,y:p.y};}
  return null;
 }
 if(f.phase==='lunge'){
  // A straight lunge at where Eli stood when it started.
  stepTo(d,f.lunge.x,f.lunge.y,520,dt);d.animationState='walk';d.walkTime=(d.walkTime||0)+dt*14;
  if(f.time>=SPAR.lunge){
   w.effects.push({name:'Practice Sword',x:d.x,y:d.y-20,angle:Math.atan2(p.y-d.y,p.x-d.x),life:.3,duration:.3});
   const landed=Math.hypot(p.x-d.x,p.y-d.y)<=SPAR.reach&&!(w.dashRemaining>0)&&f.down<=0;
   if(landed){knockDown(w,d);phase(f,'circle');f.pause=SPAR.pause[0]+(w.random?.()??.5)*(SPAR.pause[1]-SPAR.pause[0]);}
   else{phase(f,'recover');w.message='He missed! He’s open. Hit him now.';}
  }
  return null;
 }
 if(f.phase==='recover'){
  d.animationState='idle';
  if(f.time>=SPAR.recover){phase(f,'circle');f.pause=SPAR.pause[0];}
 }
 return null;
}
