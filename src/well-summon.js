// The Wishing Well's summon animation, filmed as one continuous shot: Eli throws the stones, the camera follows them
// over the well and down through the flooded shaft into the cavern below, and a fish comes to eat each stone.
// The fish names the rarity. Fakeouts are planned up front from the draw's results; drawing reads only the plan and
// the clock, so it never consumes gameplay randomness. Until the art in assets/well-summon/ loads, or if it is
// missing, the scene is drawn from pixel shapes.
import {RARITIES,RARITY_NAMES} from './artifacts.js';
export const VIEW=Object.freeze({w:320,h:180});
export const FISH=Object.freeze({common:'Sardine',uncommon:'Reed Perch',rare:'River Eel',epic:'Glowfin',legendary:'Golden Koi'});
export const RARITY_COLORS=Object.freeze({common:'#d9dccf',uncommon:'#7fd18b',rare:'#6fb6ff',epic:'#c58cff',legendary:'#ffb347'});
// How often a draw gets a fakeout. The last fish of a ten-draw, which is always the best, gets one more often.
export const FAKEOUT_CHANCE=Object.freeze({single:.55,multi:.2,finale:.6});
// The world is one tall picture: the village (0..180), earth with the well shaft, then the cavern. Units match VIEW.
const WELL={x:217,mouth:106},GROUND=142,ELI={x:70},HAND={x:16,y:-40},EARTH=150,SHAFT=12;
const CAVE={x:-1,y:186,w:400,h:225};
// Strips cut by scripts/prepare-well-summon.py: cell size and anchor in scene units, at 4 pixels per unit.
const SUMMON_ART={eliSingle:{src:'eli-throw-single',frames:6,w:37.25,h:45.5,ax:17.43,ay:45.25},eliMulti:{src:'eli-throw-multi',frames:6,w:35.25,h:44.5,ax:16,ay:44.25},
 eliShot:{src:'eli-jump-shot',frames:7,w:33.5,h:61,ax:13.8,ay:60.41},
 common:{src:'fish-sardine',frames:5,w:34.5,h:16.75,ax:34.25,ay:7.5},uncommon:{src:'fish-reed-perch',frames:5,w:42.25,h:26,ax:42,ay:12.88},
 rare:{src:'fish-river-eel',frames:5,w:84.5,h:44.25,ax:84.25,ay:25.12},epic:{src:'fish-glowfin',frames:5,w:48.25,h:45.75,ax:48,ay:17.18},
 legendary:{src:'fish-golden-koi',frames:5,w:87.75,h:66.5,ax:87.5,ay:42},shadow:{src:'koi-shadow',frames:4,w:87.75,h:64.5,ax:87.5,ay:42},
 stone:{src:'wishstone',frames:1,w:7.5,h:7.25,ax:3.75,ay:3.62},splash:{src:'splash',frames:3,w:36.25,h:30,ax:18.12,ay:24.44},sparkle:{src:'sparkle',frames:3,w:30.5,h:30,ax:15.25,ay:15},
 scene:{src:'well-scene'},cavern:{src:'well-cavern'}};
// Eli's frames change at these times; the stones leave his hand during the fourth frame.
const ELI_FRAMES={single:[0,.22,.42,.56,.72,.95],multi:[0,.22,.42,.56,.8,1.35]};
const RELEASE=.62;
// A draw holding an Epic or better gets Eli's basketball jump shot instead of the toss: a crouch, a leap, a high arc
// that hangs at the top, and a swish into the well. Until its sheet loads, the throw frames stand in, lifted off the ground.
export const SHOT_RARITY='epic';
const SHOT={release:.95,frames:[0,.22,.48,.82,1.05,1.4,1.75],standIn:[0,1,2,3,4,4,5]};
const jumpAt=t=>16*Math.sin(Math.PI*clamp((t-.55)/.75));
const rank=r=>RARITIES.indexOf(r);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=u=>{u=clamp(u);return u<.5?2*u*u:1-(-2*u+2)**2/2;};
const lerp=(a,b,u)=>a+(b-a)*u;
// A repeatable 0..1 value for decoration, so particles and bubbles look random without using a random source.
const hash=n=>{const s=Math.sin(n*12.9898+78.233)*43758.5453;return s-Math.floor(s);};

let art=null;
export function loadSummonArt(){
 if(art||typeof Image==='undefined')return;art={};
 for(const [key,{src}] of Object.entries(SUMMON_ART)){const image=new Image();image.src=new URL(`../assets/well-summon/${src}.webp`,import.meta.url).href;art[key]=image;}
 // The sparkle is white so it can take each rarity's colour.
 art.sparkle.onload=()=>{art.tinted={};for(const [rarity,color] of Object.entries(RARITY_COLORS)){const canvas=document.createElement('canvas');canvas.width=art.sparkle.naturalWidth;canvas.height=art.sparkle.naturalHeight;const c=canvas.getContext('2d');c.drawImage(art.sparkle,0,0);c.globalCompositeOperation='source-atop';c.globalAlpha=.6;c.fillStyle=color;c.fillRect(0,0,canvas.width,canvas.height);art.tinted[rarity]=canvas;}};
}
const ready=key=>!!art?.[key]?.complete&&art[key].naturalWidth>0;
// One frame of a strip with its anchor at x,y. dir -1 mirrors it.
function sprite(c,key,frame,x,y,{dir=1,scale=1,alpha=1,image=art[key]}={}){
 const s=SUMMON_ART[key],cw=image.width/s.frames;
 c.save();c.globalAlpha*=alpha;c.translate(x,y);c.scale(dir*scale,scale);c.drawImage(image,frame*cw,0,cw,image.height,-s.ax,-s.ay,s.w,s.h);c.restore();
}

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
 // Each stone's throw: when it leaves Eli's hand, when it drops into the well and where on the water.
 const shot=rarities.some(r=>rank(r)>=rank(SHOT_RARITY));
 const flights=order.map((o,i)=>{
  const release=shot?SHOT.release+(multi?i*.015:0):RELEASE+(multi?i*.07:0);
  return {release,land:release+(shot?(multi?1+hash(i)*.15:1.05):multi?.55+hash(i)*.25:.6),x:WELL.x+(multi?(hash(i+5)-.5)*18:0)};
 });
 const throwEnd=Math.max(...flights.map(f=>f.land))+.1,under=throwEnd+1.5,sinkEnd=under+1;
 const stones=order.map((o,i)=>multi?{x:WELL.x-116+(i%5)*58+(hash(i+3)-.5)*10,y:CAVE.y+80+Math.floor(i/5)*44+(hash(i+9)-.5)*8}:{x:WELL.x,y:CAVE.y+104});
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
 return {count:n,multi,shot,flights,throwEnd,under,sinkEnd,stones,beats,total:last.start+last.duration+.7};
}
const handAt=(plan,t)=>plan.shot?{x:ELI.x+15,y:GROUND-46-jumpAt(t)}:{x:ELI.x+HAND.x,y:GROUND+HAND.y};
// Where stone i is: in Eli's hand, arcing over to the well, sinking down the shaft, then drifting to its spot in the cavern.
function stoneAt(plan,i,t){
 const f=plan.flights[i],hand=handAt(plan,Math.min(t,f.release)),exit=WELL.x+(hash(i+11)-.5)*12,spot=plan.stones[i];
 if(t<f.release)return {...hand,phase:'hand'};
 if(t<f.land){
  // A jump shot climbs higher and hangs at the top of its arc before it drops.
  let u=(t-f.release)/(f.land-f.release);if(plan.shot)u+=.7*Math.sin(2*Math.PI*u)/(2*Math.PI);
  return {x:lerp(hand.x,f.x,u),y:lerp(hand.y,WELL.mouth,u)-Math.sin(u*Math.PI)*(plan.shot?78+hash(i+7)*10:46+hash(i+7)*14),phase:'air'};
 }
 if(t<plan.under){const u=ease((t-f.land)/(plan.under-f.land));return {x:lerp(f.x,exit,u)+Math.sin(t*3+i)*u*(1-u)*6,y:lerp(WELL.mouth+3,CAVE.y+22,u),phase:'sink'};}
 const u=ease((t-plan.under-i*.04)/.9);
 return {x:lerp(exit,spot.x,u),y:lerp(CAVE.y+22,spot.y,u)+Math.sin(t*2+i)*1.2*u,phase:'rest'};
}
// --- Camera: a centre and a zoom, always a pure function of the clock. ---
const WIDE={x:VIEW.w/2,y:VIEW.h/2,z:1},TRACK_ZOOM=1.5;
function rawCamera(plan,t){
 let x=0,y=0;for(let i=0;i<plan.count;i++){const s=stoneAt(plan,i,t);x+=s.x;y+=s.y;}
 // On a jump shot the camera pushes in a little more while the stones hang at the top.
 const f=plan.flights[0],hang=plan.shot?.25*Math.sin(Math.PI*clamp((t-f.release)/(f.land-f.release))):0;
 const track={x:x/plan.count,y:y/plan.count,z:TRACK_ZOOM+hang},follow=ease((t-.35)/.7);
 if(t<plan.under)return {x:lerp(WIDE.x,track.x,follow),y:lerp(WIDE.y,track.y,follow),z:lerp(WIDE.z,track.z,follow)};
 // In the cavern the camera settles on the whole pool, then leans in a little on the last fish.
 const last=plan.beats.at(-1),push=ease((t-last.start)/1.4)*.12,stone=plan.stones[last.stone];
 const pool={x:WELL.x+(stone.x-WELL.x)*push*2,y:CAVE.y+97+Math.sin(t*.6)*2+(stone.y-CAVE.y-97)*push*2,z:1+push},u=ease((t-plan.under)/1.1);
 return {x:lerp(track.x,pool.x,u),y:lerp(track.y,pool.y,u),z:lerp(track.z,pool.z,u)};
}
// Keep the view inside the pictures: the village is 320 wide, the earth and cavern below it a little wider.
function inside({x,y,z}){
 const hw=VIEW.w/2/z,hh=VIEW.h/2/z;y=clamp(y,hh,CAVE.y+CAVE.h-hh);
 const deep=clamp((y-hh-EARTH)/30);
 return {x:clamp(x,lerp(0,CAVE.x,deep)+hw,lerp(VIEW.w,CAVE.x+CAVE.w,deep)-hw),y,z};
}
// The raw path is averaged over a short window, so the camera eases through every change of direction.
export function cameraAt(plan,t){
 let x=0,y=0,z=0;const n=9;
 for(let k=0;k<n;k++){const c=rawCamera(plan,Math.max(0,t-k*.035));x+=c.x;y+=c.y;z+=c.z;}
 return inside({x:x/n,y:y/n,z:z/n});
}
const toView=(camera,x,y)=>({x:(x-camera.x)*camera.z+VIEW.w/2,y:(y-camera.y)*camera.z+VIEW.h/2});
// Rarity labels that pop above each eaten stone, in VIEW coordinates, for the host to draw crisply on top.
export function summonLabels(plan,t){
 const camera=cameraAt(plan,t),labels=[];
 for(const beat of plan.beats){const u=(t-beat.start)/beat.duration,eat=eatAt(beat);if(u<eat||u>1.3)continue;
  const s=plan.stones[beat.stone],age=(u-eat)*beat.duration,at=toView(camera,s.x,s.y-18-Math.min(age,1)*10);
  labels.push({...at,text:RARITY_NAMES[beat.rarity],color:RARITY_COLORS[beat.rarity],alpha:clamp(1.6-age*.9),big:!plan.multi||beat===plan.beats.at(-1)});}
 return labels;
}
const eatAt=beat=>beat.fake==='steal'?.62:beat.fake==='shadow'?.7:.5;

// --- Pixel drawing helpers, for the shapes drawn before or without the art ---
const rect=(c,col,x,y,w,h)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);};
function ellipse(c,col,cx,cy,rx,ry){c.fillStyle=col;for(let dy=-ry;dy<=ry;dy++){const hw=Math.round(rx*Math.sqrt(Math.max(0,1-(dy/ry)**2)));c.fillRect(Math.round(cx-hw),Math.round(cy+dy),hw*2+1,1);}}
function glow(c,col,x,y,r,alpha){c.save();c.globalAlpha=alpha;ellipse(c,col,x,y,r,r);c.globalAlpha=alpha*.6;ellipse(c,col,x,y,Math.round(r*1.6),Math.round(r*1.6));c.restore();}
function line(c,col,x0,y0,x1,y1){const n=Math.max(1,Math.ceil(Math.hypot(x1-x0,y1-y0)));for(let i=0;i<=n;i++)rect(c,col,lerp(x0,x1,i/n),lerp(y0,y1,i/n),1,1);}

function drawVillage(c,t,plan){
 if(ready('scene')){c.drawImage(art.scene,0,0,VIEW.w,VIEW.h);return;}
 // Sky, cottages, the commons and the well.
 const sky=['#9ed3e4','#acdae7','#bde2ea','#cdeaee'];sky.forEach((col,i)=>rect(c,col,0,i*22,VIEW.w,22));
 for(let i=0;i<3;i++){const x=(40+i*110+t*2)%380-30;ellipse(c,'#eef7f8',x,20+i*9,14,3);}
 for(const [x,w,h,roof] of [[8,46,34,'#96513e'],[100,38,28,'#7b3531'],[262,52,36,'#a45543']]){rect(c,'#d9c39a',x,GROUND-h,w,h);rect(c,'#8a6a48',x,GROUND-h,w,2);for(let k=0;k<h/2;k++)rect(c,roof,x-4+k,GROUND-h-h/2+k,w+8-2*k,1);rect(c,'#5b4630',x+w/2-4,GROUND-12,8,12);rect(c,'#f3d98a',x+6,GROUND-h+8,6,6);}
 ellipse(c,'#5c8a46',160,GROUND-30,16,20);rect(c,'#5b4630',158,GROUND-14,4,14);
 rect(c,'#7aa856',0,GROUND,VIEW.w,6);rect(c,'#a59a83',0,GROUND+6,VIEW.w,VIEW.h-GROUND);
 for(let x=0;x<VIEW.w;x+=12)rect(c,'#8f846e',x+((x/12)%2)*6,GROUND+12,8,1);
 // The well: stone ring, posts, roof and crank.
 const glowing=clamp((t-plan.flights[0].release)*2);
 rect(c,'#7c7a72',WELL.x-24,WELL.mouth,48,GROUND-WELL.mouth-6);for(let r=0;r<4;r++)for(let k=0;k<4;k++)rect(c,'#5f5d57',WELL.x-24+k*12+(r%2)*6,WELL.mouth+3+r*7,1,6);
 for(let r=1;r<4;r++)rect(c,'#5f5d57',WELL.x-24,WELL.mouth+r*7,48,1);
 ellipse(c,'#8f8d85',WELL.x,WELL.mouth,25,3);ellipse(c,glowing?'#3d7fa8':'#1f3540',WELL.x,WELL.mouth,20,2);
 if(glowing)glow(c,'#7fd6ff',WELL.x,WELL.mouth-2,10,.25*glowing);
 rect(c,'#6b4a2f',WELL.x-22,WELL.mouth-36,3,36);rect(c,'#6b4a2f',WELL.x+19,WELL.mouth-36,3,36);
 for(let k=0;k<12;k++)rect(c,k%3?'#8a5a3a':'#6f4630',WELL.x-30+k,WELL.mouth-48+k,60-2*k,1);
 rect(c,'#4a3020',WELL.x-20,WELL.mouth-30,40,2);line(c,'#c9b58a',WELL.x+4,WELL.mouth-28,WELL.x+4,WELL.mouth-14);rect(c,'#7a5232',WELL.x+1,WELL.mouth-14,7,5);
}
// Earth under the village, wider than the village so a deep view never runs off its edge.
function drawEarth(c){
 const bands=['#3b3328','#332c23','#2b251e','#241f1a'],h=(CAVE.y+12-EARTH)/bands.length;
 bands.forEach((col,i)=>rect(c,col,CAVE.x-10,EARTH+i*h,CAVE.w+20,Math.ceil(h)+1));
 for(let i=0;i<40;i++){const x=CAVE.x+hash(i)*CAVE.w,y=VIEW.h+2+hash(i+40)*(CAVE.y-VIEW.h),w=2+Math.round(hash(i+80)*4);ellipse(c,i%3?'#4a4238':'#3f382f',x,y,w,Math.max(1,Math.round(w/2)));}
}
// The flooded shaft from the well's water down into the cavern. Over the village it fades in as a cut-away.
function drawShaft(c,t,plan){
 const top=WELL.mouth+3,bottom=CAVE.y+8,l=WELL.x-SHAFT,w=SHAFT*2,cut=clamp((t-Math.min(...plan.flights.map(f=>f.land))+.15)/.5);
 const water=['#4aa3cc','#3b91bb','#2f7fa8','#256d93','#1d5c7e','#174d6a'];
 const part=(y0,y1,alpha)=>{if(alpha<=0||y1<=y0)return;c.save();c.globalAlpha=alpha;
  // Earth either side of the cut-away, then the water column between two walls of fitted stone.
  rect(c,'#2b251e',l-10,y0,w+20,y1-y0);
  for(let y=y0;y<y1;y+=3){const col=water[Math.min(water.length-1,Math.floor((y-top)/(bottom-top)*water.length))];rect(c,col,l,y,w,Math.min(3,y1-y));}
  for(let y=y0,row=0;y<y1;y+=5,row++)for(const side of [l-6,l+w]){const shade=hash(row*2+side)>.5?'#8a867c':'#77746b';rect(c,shade,side,y,6,Math.min(4,y1-y));rect(c,'#4b4943',side+(row%2?2:4),y,1,Math.min(4,y1-y));}
  rect(c,'#1d3a48',l,y0,1,y1-y0);rect(c,'#1d3a48',l+w-1,y0,1,y1-y0);
  // Light from above shimmering down the water, and bubbles rising.
  c.globalAlpha=alpha*(.16+.05*Math.sin(t*3));rect(c,'#d6f3ff',l+6+Math.sin(t*1.3)*2,y0,4,y1-y0);
  c.globalAlpha=alpha;for(let i=0;i<10;i++){const life=(t*.35+hash(i+300))%1,y=lerp(bottom,top,life);if(y>y0&&y<y1)rect(c,'#bfe9ff',l+2+hash(i+310)*(w-4)+Math.sin(t*2+i),y,1,1);}
  c.restore();};
 part(top,VIEW.h,cut);part(VIEW.h,bottom,1);
}
function drawCavern(c,t){
 const top=CAVE.y;
 if(ready('cavern'))c.drawImage(art.cavern,CAVE.x,top,CAVE.w,CAVE.h);
 else{
  const bands=['#1d5a73','#194f66','#16455a','#133c4f','#103344','#0d2b3a'];bands.forEach((col,i)=>rect(c,col,CAVE.x,top+i*30,CAVE.w,30));rect(c,'#0b2430',CAVE.x,top+180,CAVE.w,CAVE.h-180);
  // Ceiling rock with the shaft opening, a light beam, ruins and reeds.
  const floor=top+CAVE.h-30;
  for(let x=CAVE.x;x<CAVE.x+CAVE.w;x+=4){const h=6+Math.round(hash(x)*6);if(Math.abs(x-WELL.x)>SHAFT+4)rect(c,'#2b3a3c',x,top,4,h);}
  c.save();c.globalAlpha=.12+.04*Math.sin(t*2);c.fillStyle='#cfefff';c.beginPath();c.moveTo(WELL.x-16,top);c.lineTo(WELL.x+16,top);c.lineTo(WELL.x+60,top+170);c.lineTo(WELL.x-60,top+170);c.fill();c.restore();
  for(const [x,h] of [[50,80],[96,46],[318,96],[356,58]]){rect(c,'#22424d',x,floor-h,14,h);rect(c,'#2a4e5a',x-2,floor-h,18,4);}
  rect(c,'#3a4a3a',CAVE.x,floor,CAVE.w,30);for(let x=CAVE.x;x<CAVE.x+CAVE.w;x+=6)rect(c,'#c2b58a',x,floor,4,1);
  for(let i=0;i<30;i++){const x=CAVE.x+hash(i+100)*CAVE.w,h=8+hash(i+120)*14,sway=Math.sin(t*1.6+i)*2;line(c,'#3f7a4a',x,floor,x+sway,floor-h);}
 }
 for(let i=0;i<16;i++){const life=(t*.4+hash(i))%1,x=CAVE.x+hash(i+30)*CAVE.w+Math.sin(t+i)*3;rect(c,'#9fd7ea',x,lerp(top+CAVE.h-30,top+14,life),1,1);}
}
// Eli in pixels: feet on the ground, throwing arm swinging from behind to forward.
function drawEli(c,t,plan){
 const key=plan.multi?'eliMulti':'eliSingle',release=plan.flights[0].release;
 if(plan.shot&&ready('eliShot')){sprite(c,'eliShot',SHOT.frames.filter(s=>t>=s).length-1,ELI.x,GROUND);return;}
 const lift=plan.shot?jumpAt(t):0;
 if(ready(key)){
  const times=ELI_FRAMES[plan.multi?'multi':'single'],frame=plan.shot?SHOT.standIn[SHOT.frames.filter(s=>t>=s).length-1]:times.filter(s=>t>=s).length-1;
  sprite(c,key,frame,ELI.x,GROUND-lift);return;
 }
 const x=ELI.x,y=GROUND-Math.round(lift),u=clamp((t-release+.27)/.5),arm=lerp(2.5,-.9,ease(u))+(t>.85?lerp(0,.6,clamp((t-.85)/.4)):0),lean=Math.round(Math.sin(clamp(u)*Math.PI)*2);
 rect(c,'#3f4c5a',x-4,y-9,3,9);rect(c,'#3f4c5a',x+1+lean,y-9,3,9);rect(c,'#2b2622',x-5,y-1,4,1);rect(c,'#2b2622',x+1+lean,y-1,4,1);
 rect(c,'#b6ad8f',x-5+lean,y-19,10,10);rect(c,'#9c9374',x-5+lean,y-11,10,1);
 rect(c,'#e8b991',x-4+lean,y-26,8,7);rect(c,'#49382d',x-5+lean,y-28,10,3);rect(c,'#49382d',x-5+lean,y-26,2,4);rect(c,'#222',x+2+lean,y-24,1,1);
 // The other hand cups the spare stones in a ten-draw.
 rect(c,'#e8b991',x+lean-4,y-13,2,2);
 const sx=x+1+lean,sy=y-17,hx=sx+Math.cos(arm)*8,hy=sy-Math.sin(arm)*8;line(c,'#b6ad8f',sx,sy,lerp(sx,hx,.6),lerp(sy,hy,.6));line(c,'#e8b991',lerp(sx,hx,.6),lerp(sy,hy,.6),hx,hy);
 if(t<release){rect(c,'#6fb6ff',hx,hy-1,2,2);if(plan.multi){rect(c,'#6fb6ff',hx+1,hy,2,2);rect(c,'#9fd0ff',hx-1,hy+1,2,1);}}
}
function drawStone(c,x,y,color='#6fb6ff',shine=1){
 glow(c,color,x,y,3,.3*shine);
 if(ready('stone'))sprite(c,'stone',0,x,y,{scale:1.25});else{rect(c,color,x-1,y-1,3,2);rect(c,'#e3f7ff',x-1,y-1,1,1);}
}
// A splash where each stone drops into the well.
function drawSplash(c,plan,t){
 // A jump shot ends in a swish: a ring of light flashes out of the well.
 const swish=t-Math.min(...plan.flights.map(f=>f.land));
 if(plan.shot&&swish>0&&swish<.6){c.save();c.globalAlpha=(1-swish/.6)*.8;c.strokeStyle='#eaf8ff';c.lineWidth=2;c.beginPath();c.ellipse?.(WELL.x,WELL.mouth,8+swish*60,2+swish*14,0,0,Math.PI*2);c.stroke();c.restore();glow(c,'#eaf8ff',WELL.x,WELL.mouth-2,6,.5*(1-swish/.6));}
 plan.flights.forEach((f,i)=>{const age=t-f.land;if(age<0||age>=.42)return;
  if(ready('splash'))sprite(c,'splash',Math.floor(age/.14),f.x,WELL.mouth+1,{scale:plan.shot?1:plan.multi?.45:.7,alpha:1-age*1.2});
  else for(let k=0;k<4;k++)rect(c,'#bfe9ff',f.x+(hash(i+k)-.5)*14,WELL.mouth-age*30+age*age*80-k,1,1);});
}
// --- Fish, facing right at dir 1, with the mouth at x. ---
function fishShape(c,kind,t){
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
// Sprite fish swim through frames 1-4 and bite with frame 5. The shapes are drawn at twice the pixel size.
function drawFish(c,kind,x,y,dir,t,{alpha=1,scale=1,shadow=false,bite=false}={}){
 const key=shadow?'shadow':kind;
 if(ready(key)){sprite(c,key,bite&&!shadow?4:Math.floor(t*(kind==='legendary'||shadow?5:8))%4,x,y,{dir,scale,alpha});return;}
 c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir*scale*2,scale*2);c.globalAlpha=alpha;
 if(shadow){c.filter='brightness(0)';}fishShape(c,kind,t);c.restore();
}
// Where the eating fish is during a beat. u runs 0..1 over the beat.
function swim(beat,stone,u){
 const out=VIEW.w/2+100,from=stone.x-beat.side*out,to=stone.x+beat.side*out,eat=eatAt(beat);
 const approach=beat.fake==='steal'?[.48,eat]:beat.fake==='shadow'?[.42,eat]:[0,eat];
 const a=clamp((u-approach[0])/(approach[1]-approach[0])),leave=clamp((u-eat-.06)/(1-eat-.06));
 const x=u<approach[0]?null:u<eat+.06?lerp(from,stone.x,1-(1-a)**3):lerp(stone.x,to,leave*leave);
 return x===null?null:{x,y:stone.y+Math.sin(u*9)*1.5,dir:beat.side};
}
function drawBeat(c,beat,plan,t){
 const u=(t-beat.start)/beat.duration;if(u<-.1||u>1.05)return;
 const stone=plan.stones[beat.stone],eat=eatAt(beat),kind=beat.rarity;
 // A huge shadow glides through the deep, then the stone goes to someone else.
 if(beat.fake==='shadow'&&u<.6){const p=u/.6;drawFish(c,'legendary',lerp(stone.x-beat.side*230,stone.x+beat.side*330,p),stone.y+34,beat.side,t,{alpha:.5*Math.sin(p*Math.PI),scale:2.6,shadow:true});}
 if(beat.fake==='steal'&&u<.95){
  // The decoy reaches the stone first, then bolts back the way it came the moment the real fish charges in.
  const from=stone.x+beat.side*(VIEW.w/2+100),stop=stone.x+beat.side*4;
  const x=u<.46?lerp(from,stop,1-(1-clamp(u/.42))**2):lerp(stop,from,clamp((u-.46)/.3)**.8);
  drawFish(c,beat.decoy,x,stone.y+Math.sin(u*12),u<.46?-beat.side:beat.side,t*(u>.46?2:1),{bite:u>.36&&u<.46});
 }
 const f=swim(beat,stone,u),bite=Math.abs(u-eat)*beat.duration<.14;
 if(f)drawFish(c,kind,f.x,f.y,f.dir,t,{bite});
 // A burst of light where the stone was eaten, in the rarity's colour.
 const age=(u-eat)*beat.duration,big=!plan.multi||beat===plan.beats.at(-1);
 if(age>0&&age<.51&&art?.tinted)sprite(c,'sparkle',Math.min(2,Math.floor(age/.17)),stone.x,stone.y,{scale:big?1.2:.7,image:art.tinted[kind]});
 if(age>0&&age<.6)for(let i=0;i<10;i++){const a=hash(beat.seed+i)*6.28,r=age*30*(.6+hash(beat.seed+i+20)*.6);rect(c,RARITY_COLORS[kind],stone.x+Math.cos(a)*r,stone.y+Math.sin(a)*r,1,1);}
}
export function drawSummon(c,plan,t){
 loadSummonArt();
 c.clearRect(0,0,VIEW.w,VIEW.h);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 const camera=cameraAt(plan,t);
 c.save();c.translate(VIEW.w/2,VIEW.h/2);c.scale(camera.z,camera.z);c.translate(-camera.x,-camera.y);
 drawEarth(c);drawCavern(c,t);drawVillage(c,t,plan);drawShaft(c,t,plan);drawEli(c,t,plan);
 // Stones fly, sink and wait for their fish. A flare tease lights a stone up in a rarer colour for a moment.
 for(let i=0;i<plan.count;i++){
  const beat=plan.beats.find(b=>b.stone===i),s=stoneAt(plan,i,t);
  if(s.phase==='hand'||t>beat.start+eatAt(beat)*beat.duration)continue;
  const u=(t-beat.start)/beat.duration,flare=beat.fake==='flare'&&u>.05&&u<.4?Math.sin((u-.05)/.35*Math.PI):0;
  drawStone(c,s.x,s.y,flare>.3?RARITY_COLORS[beat.tease]:'#6fb6ff',1+flare*3);
 }
 drawSplash(c,plan,t);
 for(const beat of plan.beats)drawBeat(c,beat,plan,t);
 c.restore();
 // A golden wash over the whole view while the koi is on screen.
 const legend=plan.beats.find(b=>b.rarity==='legendary'),lu=legend?(t-legend.start)/legend.duration:-1;
 if(lu>.2&&lu<1){c.save();c.globalAlpha=.18*Math.sin(clamp((lu-.2)/.8)*Math.PI);c.fillStyle='#ffd77a';c.fillRect(0,0,VIEW.w,VIEW.h);c.restore();}
}
