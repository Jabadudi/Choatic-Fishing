// The Wishing Well's summon animation: Eli throws the stones, the view drops into the flooded cavern under the well,
// and a fish comes to eat each stone. The fish names the rarity. Fakeouts are planned up front from the draw's results;
// drawing reads only the plan and the clock, so it never consumes gameplay randomness.
// The art is drawn from pixel shapes until the generated sprite sheets arrive.
import {RARITIES,RARITY_NAMES} from './artifacts.js';
export const VIEW=Object.freeze({w:320,h:180});
export const FISH=Object.freeze({common:'Sardine',uncommon:'Reed Perch',rare:'River Eel',epic:'Glowfin',legendary:'Golden Koi'});
export const RARITY_COLORS=Object.freeze({common:'#d9dccf',uncommon:'#7fd18b',rare:'#6fb6ff',epic:'#c58cff',legendary:'#ffb347'});
// How often a draw gets a fakeout. The last fish of a ten-draw, which is always the best, gets one more often.
export const FAKEOUT_CHANCE=Object.freeze({single:.55,multi:.2,finale:.6});
const WELL={x:206,mouth:116},GROUND=144,WATER=196,FLOOR=342,ELI={x:118};
const rank=r=>RARITIES.indexOf(r);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=u=>{u=clamp(u);return u<.5?2*u*u:1-(-2*u+2)**2/2;};
const lerp=(a,b,u)=>a+(b-a)*u;
// A repeatable 0..1 value for decoration, so particles and bubbles look random without using a random source.
const hash=n=>{const s=Math.sin(n*12.9898+78.233)*43758.5453;return s-Math.floor(s);};

function pickFakeout(rarity,random){
 const options=rank(rarity)>=rank('uncommon')?['steal','steal','shadow']:['shadow','flare'];
 if(rank(rarity)<=rank('uncommon'))options.push('flare');
 return options[Math.floor(random()*options.length)];
}
// The order fish arrive, their timing and their fakeouts. The best result always comes last.
export function planSummon(rarities,random=Math.random){
 const n=rarities.length,multi=n>1,order=rarities.map((rarity,index)=>({rarity,index}));
 const best=order.reduce((a,b)=>rank(b.rarity)>rank(a.rarity)?b:a,order[0]);
 const queue=[...order.filter(o=>o!==best),best];
 const throwEnd=multi?2.1:1.6,dive=throwEnd+.35,under=dive+1,sinkEnd=under+.9;
 const stones=order.map((o,i)=>multi?{x:44+(i%5)*58+(hash(i+3)-.5)*10,y:256+Math.floor(i/5)*44+(hash(i+9)-.5)*8}:{x:160,y:276});
 const beats=[];let start=sinkEnd;
 queue.forEach((o,k)=>{
  const finale=k===queue.length-1;
  const chance=multi?(finale?FAKEOUT_CHANCE.finale:FAKEOUT_CHANCE.multi):FAKEOUT_CHANCE.single;
  const fake=random()<chance?pickFakeout(o.rarity,random):null;
  // A steal needs a weaker fish to push aside.
  const decoy=fake==='steal'?RARITIES[Math.floor(random()*rank(o.rarity))]:null;
  const tease=fake==='flare'?RARITIES[rank(o.rarity)+1+Math.floor(random()*(RARITIES.length-1-rank(o.rarity)))]:null;
  const big=finale||!multi,duration=(big?2.4:1.15)+(fake?(big?1.1:.7):0)+(o.rarity==='legendary'?1:0);
  beats.push({...o,stone:o.index,start,duration,fake,decoy,tease,side:random()<.5?1:-1,seed:Math.floor(random()*1e6)});
  start+=finale?0:multi?(fake?1.3:.62):0;
 });
 const last=beats.at(-1);
 return {count:n,multi,throwEnd,dive,under,sinkEnd,stones,beats,total:last.start+last.duration+.7};
}
// Rarity labels that pop above each eaten stone, for the host to draw crisply on top.
export function summonLabels(plan,t){
 const camera=cameraY(plan,t),labels=[];
 for(const beat of plan.beats){const u=(t-beat.start)/beat.duration,eat=eatAt(beat);if(u<eat||u>1.3)continue;
  const s=plan.stones[beat.stone],age=(u-eat)*beat.duration;
  labels.push({x:s.x,y:s.y-camera-14-Math.min(age,1)*10,text:RARITY_NAMES[beat.rarity],color:RARITY_COLORS[beat.rarity],alpha:clamp(1.6-age*.9),big:!plan.multi||beat===plan.beats.at(-1)});}
 return labels;
}
export const cameraY=(plan,t)=>ease((t-plan.dive)/(plan.under-plan.dive))*VIEW.h+(t>plan.under?18*ease((t-plan.under)/.6):0);
const eatAt=beat=>beat.fake==='steal'?.62:beat.fake==='shadow'?.7:.5;

// --- Pixel drawing helpers ---
const rect=(c,col,x,y,w,h)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);};
function ellipse(c,col,cx,cy,rx,ry){c.fillStyle=col;for(let dy=-ry;dy<=ry;dy++){const hw=Math.round(rx*Math.sqrt(Math.max(0,1-(dy/ry)**2)));c.fillRect(Math.round(cx-hw),Math.round(cy+dy),hw*2+1,1);}}
function glow(c,col,x,y,r,alpha){c.save();c.globalAlpha=alpha;ellipse(c,col,x,y,r,r);c.globalAlpha=alpha*.6;ellipse(c,col,x,y,Math.round(r*1.6),Math.round(r*1.6));c.restore();}
function line(c,col,x0,y0,x1,y1){const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)));for(let i=0;i<=n;i++)rect(c,col,lerp(x0,x1,i/n),lerp(y0,y1,i/n),1,1);}

function drawSurface(c,t,plan){
 // Sky, cottages, the commons and the well.
 const sky=['#9ed3e4','#acdae7','#bde2ea','#cdeaee'];sky.forEach((col,i)=>rect(c,col,0,i*22,VIEW.w,22));
 for(let i=0;i<3;i++){const x=(40+i*110+t*2)%380-30;ellipse(c,'#eef7f8',x,20+i*9,14,3);}
 for(const [x,w,h,roof] of [[8,46,34,'#96513e'],[62,38,28,'#7b3531'],[250,52,36,'#a45543'],[290,40,26,'#966145']]){rect(c,'#d9c39a',x,GROUND-h,w,h);rect(c,'#8a6a48',x,GROUND-h,w,2);for(let k=0;k<h/2;k++)rect(c,roof,x-4+k,GROUND-h-h/2+k,w+8-2*k,1);rect(c,'#5b4630',x+w/2-4,GROUND-12,8,12);rect(c,'#f3d98a',x+6,GROUND-h+8,6,6);}
 ellipse(c,'#5c8a46',150,GROUND-30,16,20);rect(c,'#5b4630',148,GROUND-14,4,14);
 rect(c,'#7aa856',0,GROUND,VIEW.w,6);rect(c,'#a59a83',0,GROUND+6,VIEW.w,VIEW.h-GROUND);
 for(let x=0;x<VIEW.w;x+=12)rect(c,'#8f846e',x+((x/12)%2)*6,GROUND+12,8,1);
 // Earth under the ground, with the shaft going down to the cavern.
 rect(c,'#5d4a36',0,GROUND+20,VIEW.w,WATER-GROUND-20);for(let i=0;i<40;i++)rect(c,'#4c3c2c',hash(i)*VIEW.w,GROUND+22+hash(i+40)*30,3,2);
 rect(c,'#2a3f4a',WELL.x-18,WELL.mouth,36,WATER-WELL.mouth);rect(c,'#6c6a64',WELL.x-22,GROUND+20,4,WATER-GROUND-20);rect(c,'#6c6a64',WELL.x+18,GROUND+20,4,WATER-GROUND-20);
 // The well: stone ring, posts, roof and crank.
 const glowing=t>plan.throwEnd-.6?clamp((t-(plan.throwEnd-.6))*2):0;
 rect(c,'#7c7a72',WELL.x-24,WELL.mouth,48,GROUND-WELL.mouth);for(let r=0;r<4;r++)for(let k=0;k<4;k++)rect(c,'#5f5d57',WELL.x-24+k*12+(r%2)*6,WELL.mouth+3+r*7,1,6);
 for(let r=1;r<4;r++)rect(c,'#5f5d57',WELL.x-24,WELL.mouth+r*7,48,1);
 ellipse(c,'#8f8d85',WELL.x,WELL.mouth,25,3);ellipse(c,glowing?'#3d7fa8':'#1f3540',WELL.x,WELL.mouth,20,2);
 if(glowing)glow(c,'#7fd6ff',WELL.x,WELL.mouth-2,10,.25*glowing);
 rect(c,'#6b4a2f',WELL.x-22,WELL.mouth-36,3,36);rect(c,'#6b4a2f',WELL.x+19,WELL.mouth-36,3,36);
 for(let k=0;k<12;k++)rect(c,k%3?'#8a5a3a':'#6f4630',WELL.x-30+k,WELL.mouth-48+k,60-2*k,1);
 rect(c,'#4a3020',WELL.x-20,WELL.mouth-30,40,2);line(c,'#c9b58a',WELL.x+4,WELL.mouth-28,WELL.x+4,WELL.mouth-14);rect(c,'#7a5232',WELL.x+1,WELL.mouth-14,7,5);
}
// Eli in pixels: feet on the ground, throwing arm swinging from behind to forward.
function drawEli(c,t,plan){
 const x=ELI.x,y=GROUND,u=clamp((t-.35)/.5),arm=lerp(2.5,-.9,ease(u))+(t>.85?lerp(0,.6,clamp((t-.85)/.4)):0),lean=Math.round(Math.sin(clamp(u)*Math.PI)*2);
 rect(c,'#3f4c5a',x-4,y-9,3,9);rect(c,'#3f4c5a',x+1+lean,y-9,3,9);rect(c,'#2b2622',x-5,y-1,4,1);rect(c,'#2b2622',x+1+lean,y-1,4,1);
 rect(c,'#b6ad8f',x-5+lean,y-19,10,10);rect(c,'#9c9374',x-5+lean,y-11,10,1);
 rect(c,'#e8b991',x-4+lean,y-26,8,7);rect(c,'#49382d',x-5+lean,y-28,10,3);rect(c,'#49382d',x-5+lean,y-26,2,4);rect(c,'#222',x+2+lean,y-24,1,1);
 // The other hand cups the spare stones in a ten-draw.
 rect(c,'#e8b991',x+lean-4,y-13,2,2);
 const sx=x+1+lean,sy=y-17,hx=sx+Math.cos(arm)*8,hy=sy-Math.sin(arm)*8;line(c,'#b6ad8f',sx,sy,lerp(sx,hx,.6),lerp(sy,hy,.6));line(c,'#e8b991',lerp(sx,hx,.6),lerp(sy,hy,.6),hx,hy);
 if(t<.62){rect(c,'#6fb6ff',hx,hy-1,2,2);if(plan.multi){rect(c,'#6fb6ff',hx+1,hy,2,2);rect(c,'#9fd0ff',hx-1,hy+1,2,1);}}
}
// Each stone arcs from Eli's hand into the well mouth; ten scatter a little.
function stoneFlight(plan,i,t){
 const release=.62+(plan.multi?i*.07:0),land=release+(plan.multi?.55+hash(i)*.25:.55),u=(t-release)/(land-release);
 if(u<0||u>1)return null;
 const x0=ELI.x+8,y0=GROUND-22,x1=WELL.x+(plan.multi?(hash(i+5)-.5)*26:0),y1=WELL.mouth;
 return {x:lerp(x0,x1,u),y:lerp(y0,y1,u)-Math.sin(u*Math.PI)*(30+hash(i+7)*14),land};
}
function drawStone(c,x,y,color='#6fb6ff',shine=1){glow(c,color,x,y,2,.25*shine);rect(c,color,x-1,y-1,3,2);rect(c,'#e3f7ff',x-1,y-1,1,1);}
function drawCavern(c,t,plan,camera){
 const top=WATER-camera,bands=['#1d5a73','#194f66','#16455a','#133c4f','#103344','#0d2b3a'];
 bands.forEach((col,i)=>rect(c,col,0,top+i*26,VIEW.w,26));rect(c,'#0b2430',0,top+156,VIEW.w,400);
 // Ceiling rock with the shaft opening, a light beam, ruins and reeds.
 for(let x=0;x<VIEW.w;x+=4){const h=6+Math.round(hash(x)*6);if(Math.abs(x-WELL.x)>20)rect(c,'#2b3a3c',x,top,4,h);}
 c.save();c.globalAlpha=.12+.04*Math.sin(t*2);c.fillStyle='#cfefff';c.beginPath();c.moveTo(WELL.x-16,top);c.lineTo(WELL.x+16,top);c.lineTo(WELL.x+60,top+150);c.lineTo(WELL.x-60,top+150);c.fill();c.restore();
 for(const [x,h] of [[24,70],[70,40],[262,86],[300,52]]){rect(c,'#22424d',x,FLOOR-camera-h,14,h);rect(c,'#2a4e5a',x-2,FLOOR-camera-h,18,4);}
 rect(c,'#3a4a3a',0,FLOOR-camera,VIEW.w,40);for(let x=0;x<VIEW.w;x+=6)rect(c,'#c2b58a',x,FLOOR-camera,4,1);
 for(let i=0;i<26;i++){const x=hash(i+100)*VIEW.w,h=8+hash(i+120)*14,sway=Math.sin(t*1.6+i)*2;line(c,'#3f7a4a',x,FLOOR-camera,x+sway,FLOOR-camera-h);}
 for(let i=0;i<14;i++){const life=(t*.4+hash(i))%1,x=hash(i+30)*VIEW.w+Math.sin(t+i)*3;rect(c,'#9fd7ea',x,lerp(FLOOR-camera-10,top+10,life),1,1);}
}
// --- Fish, facing right at dir 1. Mouth at the front, about 0..2 px ahead of x. ---
function fishShape(c,kind,t,scale=1){
 const wag=Math.round(Math.sin(t*14)*1.5);
 if(kind==='common'){ellipse(c,'#c9d3d6',-3,0,6,2);rect(c,'#5d7b8a',-8,-2,10,1);rect(c,'#eef3f3',-6,1,7,1);for(let k=0;k<3;k++)rect(c,'#9fb0b6',-10-k,-k+wag,1,2*k+1);rect(c,'#111',1,-1,1,1);}
 else if(kind==='uncommon'){ellipse(c,'#7fae5b',-4,0,8,4);rect(c,'#e9e2b6',-9,2,9,1);for(const s of [-9,-6,-3])rect(c,'#3f6b35',s,-3,1,6);for(let k=0;k<5;k++)rect(c,'#d0643a',-8+k*2,-5-(k%2),1,2);for(let k=0;k<4;k++)rect(c,'#d0643a',-13-k,-k+wag,1,2*k+1);rect(c,'#f2c94c',1,-1,2,2);rect(c,'#111',2,-1,1,1);}
 else if(kind==='rare'){for(let i=0;i<30;i++){const y=Math.round(Math.sin(t*9-i*.32)*2.2*(i/30));rect(c,i<4?'#5b8fd0':'#2f4f78',-i,y-1,1,3);if(i%2)rect(c,'#6fb6ff',-i,y-2,1,1);}rect(c,'#9fd8ff',-1,-1,1,1);}
 else if(kind==='epic'){glow(c,'#c58cff',-3,0,7,.18);ellipse(c,'#3a2350',-3,0,6,5);for(let k=0;k<3;k++)rect(c,'#5a3a78',-6+k*3,-2+k,1,1);rect(c,'#eadcff',1,1,1,1);rect(c,'#eadcff',3,1,1,1);rect(c,'#c58cff',-10+wag,-2,2,4);
  const bob=Math.sin(t*4)*1.5;line(c,'#5a3a78',-1,-5,4,-9+bob);glow(c,'#e3b8ff',5,-9+bob,1,.6);rect(c,'#f5e6ff',4,-10+bob,2,2);rect(c,'#f2c94c',-1,-2,1,1);}
 else{glow(c,'#ffd77a',-6,0,12,.16);for(let k=0;k<7;k++)rect(c,'#ffe7a3',-20-k,-k+wag,1,2*k+1);ellipse(c,'#f6c453',-6,0,12,5);ellipse(c,'#ffb347',-4,-1,5,2);rect(c,'#ff7a3d',-12,-3,4,2);rect(c,'#ff7a3d',-6,2,3,1);
  line(c,'#ffe7a3',-8,4,-14,9+wag);line(c,'#ffe7a3',-3,4,-6,8);line(c,'#c99a3a',4,1,8,4);rect(c,'#111',2,-2,1,1);
  for(let i=0;i<4;i++){const a=t*2+i*1.6;rect(c,'#fff6d0',-6+Math.cos(a)*16,Math.sin(a)*8,1,1);}}
}
// Fish are drawn at twice the pixel size so they read clearly against the cavern.
function drawFish(c,kind,x,y,dir,t,{alpha=1,scale=2,shadow=false}={}){
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir*scale,scale);c.globalAlpha=alpha;
 if(shadow){c.filter='brightness(0)';}fishShape(c,kind,t);c.restore();
}
// Where the eating fish and any decoy are during a beat. u runs 0..1 over the beat.
function swim(beat,stone,u){
 const out=VIEW.w/2+90,from=stone.x-beat.side*out,to=stone.x+beat.side*out,eat=eatAt(beat);
 const approach=beat.fake==='steal'?[.48,eat]:beat.fake==='shadow'?[.42,eat]:[0,eat];
 const a=clamp((u-approach[0])/(approach[1]-approach[0])),leave=clamp((u-eat-.06)/(1-eat-.06));
 const x=u<approach[0]?null:u<eat+.06?lerp(from,stone.x,1-(1-a)**3):lerp(stone.x,to,leave*leave);
 return x===null?null:{x,y:stone.y+Math.sin(u*9)*1.5,dir:beat.side};
}
function drawBeat(c,beat,plan,t,camera){
 const u=(t-beat.start)/beat.duration;if(u<-.1||u>1.05)return;
 const stone=plan.stones[beat.stone],sy=stone.y-camera,eat=eatAt(beat),kind=beat.rarity;
 if(beat.fake==='shadow'&&u<.6){const p=u/.6;drawFish(c,'legendary',lerp(beat.side>0?-60:380,beat.side>0?380:-60,p),sy-30,beat.side,t,{alpha:.45*Math.sin(p*Math.PI),scale:6,shadow:true});}
 if(beat.fake==='steal'&&u<.95){
  // The decoy reaches the stone first, then bolts when the real fish arrives.
  const out=VIEW.w/2+90,from=stone.x+beat.side*out,stop=stone.x+beat.side*6;
  // It bolts back the way it came the moment the real fish charges in.
  const x=u<.46?lerp(from,stop,1-(1-clamp(u/.42))**2):lerp(stop,from,clamp((u-.46)/.3)**.8);
  drawFish(c,beat.decoy,x,sy+Math.sin(u*12),u<.46?-beat.side:beat.side,t*(u>.46?2:1));
 }
 const f=swim(beat,stone,u);
 if(beat.rarity==='legendary'&&u>.2){c.save();c.globalAlpha=.18*Math.sin(clamp((u-.2)/.8)*Math.PI);c.fillStyle='#ffd77a';c.fillRect(0,0,VIEW.w,VIEW.h);c.restore();}
 if(f)drawFish(c,kind,f.x,f.y-camera,f.dir,t*(kind==='legendary'?.7:1));
 // Sparks burst where the stone was eaten.
 const age=(u-eat)*beat.duration;
 if(age>0&&age<.6)for(let i=0;i<10;i++){const a=hash(beat.seed+i)*6.28,r=age*30*(.6+hash(beat.seed+i+20)*.6);rect(c,RARITY_COLORS[kind],stone.x+Math.cos(a)*r,sy+Math.sin(a)*r,1,1);}
}
export function drawSummon(c,plan,t){
 c.clearRect(0,0,VIEW.w,VIEW.h);c.imageSmoothingEnabled=false;
 const camera=cameraY(plan,t);
 c.save();c.translate(0,-camera);drawSurface(c,t,plan);c.restore();
 if(camera>0)drawCavern(c,t,plan,camera);
 if(camera<VIEW.h){c.save();c.translate(0,-camera);drawEli(c,t,plan);
  for(let i=0;i<plan.count;i++){const s=stoneFlight(plan,i,t);if(s)drawStone(c,s.x,s.y);
   const land=.62+(plan.multi?i*.07:0)+(plan.multi?.55+hash(i)*.25:.55),age=t-land;
   if(age>0&&age<.4)for(let k=0;k<4;k++)rect(c,'#bfe9ff',WELL.x+(hash(i+k)-.5)*30,WELL.mouth-age*30+age*age*80-k,1,1);}
  c.restore();}
 // Stones sink to their spots, then wait for their fish. A flare tease lights a stone up in a rarer colour for a moment.
 for(let i=0;i<plan.count;i++){
  const beat=plan.beats.find(b=>b.stone===i),s=plan.stones[i],sink=clamp((t-plan.under+.4-i*.04)/.9);
  if(sink<=0||t>beat.start+eatAt(beat)*beat.duration)continue;
  const u=(t-beat.start)/beat.duration,flare=beat.fake==='flare'&&u>.05&&u<.4?Math.sin((u-.05)/.35*Math.PI):0;
  const x=lerp(WELL.x,s.x,ease(sink)),y=lerp(WATER+6,s.y,ease(sink))+Math.sin(t*2+i)*1.2;
  drawStone(c,x,y-camera,flare>.3?RARITY_COLORS[beat.tease]:'#6fb6ff',1+flare*3);
 }
 for(const beat of plan.beats)drawBeat(c,beat,plan,t,camera);
}
