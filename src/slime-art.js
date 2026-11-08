// Chibi slimes for the Regions game. They use Netanel's painted slime sheet (art/sprites/creatures/slime-sheet.png, cut
// by scripts/prepare-slime-sprites.py into eight poses): resting, crouched, stretched mid-hop, landing, and splatted
// flat. It crouches before a hop, stretches in the air, lands wide, flattens through its windup and splats when defeated.
// Until the frames load, the old code-drawn jelly dome stands in. Drawing only; the slime's stats are in src/entities.js.
import {castShadow} from './ground-shadow.js';
import {drawProp} from './sprites.js';
// The eight poses on the sheet, by number: 0 and 4 rest, 3 rests tall, 1 crouches, 2 and 5 stretch, 7 lands wide, 6 is flat.
const SIZE=.5;
export const SLIME_FRAMES=[[78,64],[88,45],[68,76],[75,69],[77,64],[69,73],[93,39],[83,55]];
const COLORS=[
 {body:'#7fd36a',dark:'#4f9f45',light:'#c4f3a6'},
 {body:'#6fc3e8',dark:'#3f8cb8',light:'#bfe9fb'},
 {body:'#f2a0c4',dark:'#c06b93',light:'#ffd6e8'},
 {body:'#f0c95a',dark:'#c2932c',light:'#fff0b0'}
];
export const slimeColor=a=>COLORS[(a.seed>>>0)%COLORS.length];
// How high the slime is off the ground and how squashed it is this frame.
function slimePose(a){
 const t=a.time||0,dead=a.health<=0,moving=['walk','chase','return','notice'].includes(a.state);
 // A hop: up off the ground, squashed on landing. The windup squashes low; the strike stretches forward.
 const hopT=moving?(t*2.6+((a.seed>>>0)%7)/7)%1:0,lift=moving?Math.sin(hopT*Math.PI)*10:0;
 let sx=1,sy=1;
 if(dead){sx=1.5;sy=.28;}
 else if(a.state==='attack'){const k=1-Math.max(0,Math.min(1,(a.attackRemaining??0)/Math.max(.01,a.attackWindup||.5)));sx=1+.25*k;sy=1-.28*k;}
 else if(a.state==='strike'){sx=.82;sy=1.22;}
 else if(moving){const land=1-Math.sin(hopT*Math.PI);sx=1+.18*land*land;sy=1-.16*land*land;}
 else{const b=Math.sin(t*3+(a.seed>>>0))*.04;sx=1+b;sy=1-b;}
 return {dead,lift,sx,sy,hopT,moving,t};
}
// Which painted pose fits this moment.
export function slimeFrame(a,pose=slimePose(a)){
 const {dead,hopT,moving,t}=pose;
 if(dead)return 6;
 if(a.state==='attack'){const k=1-Math.max(0,Math.min(1,(a.attackRemaining??0)/Math.max(.01,a.attackWindup||.5)));return k<.45?7:6;}
 if(a.state==='strike')return 2;
 if(a.hurtRemaining>0)return 7;
 if(moving)return hopT<.12?1:hopT<.42?2:hopT<.62?5:hopT<.86?3:7;
 // At rest it breathes between its two resting poses, now and then sitting up tall.
 const beat=Math.floor(t*2.2+((a.seed>>>0)%5));return [0,4,0,3][beat%4];
}
// The slime's contact shadow for the shadow pass: under its base, shrinking while it is in the air.
export function slimeShadow(a){const pose=slimePose(a);if(pose.dead)return null;const k=1-pose.lift/26,[fw]=SLIME_FRAMES[slimeFrame(a,pose)];return {x:Math.round(a.x),y:Math.round(a.y)-1,rx:fw*SIZE*.46*k,ry:4.6*k};}
export function drawSlime(c,a){
 const pose=slimePose(a),f=slimeFrame(a,pose),[fw,fh]=SLIME_FRAMES[f];
 if(!drawProp(c,`slime/${f}`,{x:-1e5,y:-1e5,w:1,h:1}))return drawnSlime(c,a);
 const x=Math.round(a.x),y=Math.round(a.y);
 if(!pose.dead)castShadow(c,x,y+1,fw*SIZE*.5*(1-pose.lift/40),{strength:1-pose.lift/30});
 c.save();
 // A hurt one flickers.
 if(a.hurtRemaining>0&&Math.floor((a.time||0)*20)%2)c.globalAlpha=.6;
 const shake=a.hurtRemaining>0?Math.round(Math.sin((a.time||0)*60)*1.5):0;
 drawProp(c,`slime/${f}`,{x:x+shake,y:y+3-Math.round(pose.lift),w:fw*SIZE,h:fh*SIZE});
 c.restore();
}
// The code-drawn slime, while the painted frames load.
function drawnSlime(c,a){
 const col=slimeColor(a),{dead,lift,sx,sy}=slimePose(a);
 const x=Math.round(a.x),y=Math.round(a.y),R=17;
 c.save();c.translate(x,y);
 // Shadow on the ground, smaller while the slime is in the air.
 if(!dead)castShadow(c,0,1,R*1.05*(1-lift/40),{strength:1-lift/30});
 c.translate(0,-lift);if(a.direction?.x<0)c.scale(-1,1);c.scale(sx,sy);
 // Body: a jelly dome, darker at the rim.
 const g=c.createRadialGradient?c.createRadialGradient(-4,-16,2,0,-9,R*1.5):null;
 if(g){g.addColorStop(0,col.light);g.addColorStop(.45,col.body);g.addColorStop(1,col.dark);c.fillStyle=g;}else c.fillStyle=col.body;
 c.beginPath();c.moveTo(-R,0);c.bezierCurveTo(-R*1.08,-R*1.2,-R*.55,-R*1.75,0,-R*1.78);c.bezierCurveTo(R*.55,-R*1.75,R*1.08,-R*1.2,R,0);c.quadraticCurveTo(0,R*.32,-R,0);c.closePath();c.fill();
 c.strokeStyle=col.dark;c.lineWidth=1.5;c.stroke();
 // Glossy shine and a little drip.
 c.fillStyle='#ffffffb0';c.beginPath();c.ellipse(-6,-19,4,2.6,-.5,0,Math.PI*2);c.fill();
 c.fillStyle='#ffffff80';c.beginPath();c.arc(-1,-22,1.3,0,Math.PI*2);c.fill();
 if(!dead){
  // Big chibi eyes with sparkles; squeezed shut while hurt.
  const hurt=a.hurtRemaining>0;
  for(const ex of [-5,6]){
   if(hurt){c.strokeStyle='#2a1d2a';c.lineWidth=1.8;c.beginPath();c.moveTo(ex-3,-11);c.lineTo(ex,-9);c.lineTo(ex+3,-11);c.stroke();continue;}
   c.fillStyle='#2a1d2a';c.beginPath();c.ellipse(ex,-10,3.2,4.2,0,0,Math.PI*2);c.fill();
   c.fillStyle='#ffffff';c.beginPath();c.arc(ex-1.1,-11.8,1.4,0,Math.PI*2);c.fill();c.beginPath();c.arc(ex+1.2,-8.6,.7,0,Math.PI*2);c.fill();
  }
  // Rosy cheeks and a tiny mouth: an "o" when it is about to pounce.
  c.fillStyle='#ff7fa066';c.beginPath();c.ellipse(-10,-5,2.6,1.5,0,0,Math.PI*2);c.fill();c.beginPath();c.ellipse(11,-5,2.6,1.5,0,0,Math.PI*2);c.fill();
  c.strokeStyle='#2a1d2a';c.lineWidth=1.2;c.beginPath();
  if(a.state==='attack'||a.state==='strike')c.arc(.5,-4.5,1.6,0,Math.PI*2);else c.arc(.5,-6,2,.2*Math.PI,.8*Math.PI);
  c.stroke();
 }
 c.restore();
}
