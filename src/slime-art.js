// Chibi slimes for the Regions game, drawn in code: a round jelly dome with a glossy shine, big sparkly eyes and pink
// cheeks. It squashes and stretches as it hops, rears back through its windup, and splats flat when defeated.
// Each slime gets one of a few soft colours from its seed. Drawing only; the slime's stats are in src/entities.js.
import {castShadow} from './ground-shadow.js';
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
 return {dead,lift,sx,sy};
}
// The slime's contact shadow for the shadow pass: under its base, shrinking while it is in the air.
export function slimeShadow(a){const {dead,lift,sx}=slimePose(a);if(dead)return null;const k=1-lift/26;return {x:Math.round(a.x),y:Math.round(a.y)+1,rx:17*sx*.95*k,ry:4.6*k};}
export function drawSlime(c,a){
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
