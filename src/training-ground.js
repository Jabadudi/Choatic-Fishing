// The village guard's training yard: a fenced square of packed dirt in the south-east corner of 12.4 Farm & Training
// Grounds, east of the Willowback Gate. Geometry, collision and artwork only; story.js decides who stands here.
// The yard is laid out in its own coordinates (W x H, gate in the north fence) and placed at YARD in the farm; every
// spot exported here is already in farm coordinates.
import {drawGrassBase} from './grass-texture.js';
import {drawProp,drawTiles} from './sprites.js';
const W=1080,H=840;
export const YARD={x:880,y:1350,w:W,h:H};
// The farm the yard sits in. village-districts.js builds the full area (roads, exits) around this id and size.
export const TRAINING_GROUND={id:'village-farm',name:'Willowback Farm & Training Grounds',width:2000,height:2250};
const world=(x,y)=>({x:x+YARD.x,y:y+YARD.y});
const L_CIRCLE={x:540,y:440,rx:250,ry:180};
export const CIRCLE={...world(L_CIRCLE.x,L_CIRCLE.y),rx:L_CIRCLE.rx,ry:L_CIRCLE.ry};
// The gap in the north fence, onto the track up to the farm road.
const NORTH_GAP=[490,590];
export const TRAINING_GATE=world(540,10);
export const DRAYFUS_SPOT=world(540,430);
const L_BENCH={x:190,y:360};
export const TRAINING_EMILIA_SPOT=world(190,336);
export const FENCE_MARA_SPOT=world(330,720);
const L_RACK={x:760,y:130},L_WELL={x:940,y:250},L_TROUGH={x:920,y:650},L_CAST={x:540,y:600};
export const RACK_SPOT=world(L_RACK.x,L_RACK.y);
export const YARD_WELL=world(L_WELL.x,L_WELL.y);
export const TROUGH=world(L_TROUGH.x,L_TROUGH.y);
// Where Eli stands to cast at Drayfus's sword: the south edge of the circle.
export const CAST_SPOT=world(L_CAST.x,L_CAST.y);
const WILLOW={x:150,y:322};
const DUMMIES=[{x:250,y:170},{x:330,y:150},{x:860,y:450}];
// Scenery only, with no drawn fallback: a barrel of practice weapons, a spear crate, an archery target and hay.
const EXTRAS=[['weapon-barrel',880,160,40,52],['spear-crate',640,160,40,52],['archery-target',1020,430,44,54],['hay-bale',1024,510,44,44]];
export const TRAINING_GROUND_PLACES=[];
// Split-log fence all round, with the gate in the north fence.
const TOP=56,FENCE=34;
export const inYard=(x,y)=>x>=YARD.x&&x<=YARD.x+W&&y>=YARD.y&&y<=YARD.y+H;
// Farm coordinates in; only points inside the yard's square can be blocked by it.
export function trainingGroundBlocked(wx,wy){
 if(!inYard(wx,wy))return false;
 const x=wx-YARD.x,y=wy-YARD.y;
 if(x<FENCE||x>W-FENCE)return true;
 if(y<TOP&&(x<NORTH_GAP[0]+8||x>NORTH_GAP[1]-8))return true;
 if(y>H-FENCE)return true;
 if(x>L_RACK.x-70&&x<L_RACK.x+70&&y>L_RACK.y-40&&y<L_RACK.y+20)return true;
 if(Math.hypot(x-L_WELL.x,y-L_WELL.y)<38)return true;
 if(x>L_TROUGH.x-58&&x<L_TROUGH.x+58&&y>L_TROUGH.y-24&&y<L_TROUGH.y+20)return true;
 if(x>L_BENCH.x-44&&x<L_BENCH.x+44&&y>L_BENCH.y-6&&y<L_BENCH.y+22)return true;
 if(Math.hypot(x-WILLOW.x,y-WILLOW.y+10)<18)return true;
 if(Math.hypot(x-880,y-146)<24||Math.hypot(x-640,y-146)<24)return true;
 if(x>996&&y>380&&y<522)return true;
 return DUMMIES.some(d=>Math.hypot(x-d.x,y-d.y)<20);
}
function log(c,x,y,w,h){c.fillStyle='#5c3b22';c.fillRect(x,y,w,h);c.fillStyle='#8a6038';c.fillRect(x+1,y+1,w-2,Math.max(1,h/2-1));c.fillStyle='#3a2414';c.fillRect(x,y+h-2,w,2);}
function dummy(c,{x,y},t,beaten){
 if(drawProp(c,beaten?'training-dummy-worn':'training-dummy',{x,y:y+6,w:46,h:58}))return;
 c.fillStyle='#20352c55';c.beginPath();c.ellipse(x+2,y+4,14,5,0,0,Math.PI*2);c.fill();
 c.fillStyle='#5a3d22';c.fillRect(x-2,y-40,5,44);c.fillRect(x-16,y-30,32,4);
 c.fillStyle='#d6b25e';c.fillRect(x-10,y-34,20,24);c.fillStyle='#b8923e';for(let i=0;i<4;i++)c.fillRect(x-9+i*5,y-33,2,22);
 c.fillStyle='#d6b25e';c.beginPath();c.arc(x,y-42,9,0,Math.PI*2);c.fill();c.fillStyle='#8a5a2a';c.fillRect(x-10,y-24,20,3);
 if(beaten){c.fillStyle='#e8cf86';c.fillRect(x+8,y-38+Math.sin(t*2)*1,6,2);c.fillRect(x-14,y-20,5,2);}
}
// Weapon rack by the north fence: swords, spears, axes and a cracked bow.
function rack(c){
 const {x,y}=L_RACK;
 if(drawProp(c,'weapon-rack',{x,y:y+22,w:140,h:96}))return;
 log(c,x-66,y-10,132,8);log(c,x-66,y+10,132,8);c.fillStyle='#4a301c';c.fillRect(x-66,y-40,6,64);c.fillRect(x+60,y-40,6,64);
 for(let i=0;i<4;i++){const sx=x-50+i*14;c.fillStyle='#b9bcc0';c.fillRect(sx,y-44,4,46);c.fillStyle='#6b4a2a';c.fillRect(sx-3,y+2,10,3);c.fillRect(sx,y+5,4,10);}
 for(let i=0;i<2;i++){const sx=x+10+i*14;c.fillStyle='#7a5733';c.fillRect(sx,y-58,3,74);c.fillStyle='#c8ccd0';c.beginPath();c.moveTo(sx-3,y-58);c.lineTo(sx+1.5,y-70);c.lineTo(sx+6,y-58);c.fill();}
 c.fillStyle='#7a5733';c.fillRect(x+42,y-40,3,52);c.fillStyle='#9aa0a6';c.fillRect(x+36,y-40,12,10);
 c.strokeStyle='#6b4a2a';c.lineWidth=3;c.beginPath();c.arc(x+56,y-14,26,Math.PI*.6,Math.PI*1.4);c.stroke();c.strokeStyle='#e6dcc0';c.lineWidth=1;c.beginPath();c.moveTo(x+48,y-38);c.lineTo(x+48,y+10);c.stroke();
}
function well(c,t){
 const {x,y}=L_WELL;
 if(drawProp(c,'well',{x,y:y+30,w:84,h:110}))return;
 c.fillStyle='#20352c55';c.beginPath();c.ellipse(x+3,y+20,40,10,0,0,Math.PI*2);c.fill();
 c.fillStyle='#7d7a72';c.beginPath();c.ellipse(x,y+8,34,16,0,0,Math.PI*2);c.fill();c.fillStyle='#9a978e';for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.fillRect(x+Math.cos(a)*28-5,y+8+Math.sin(a)*12-3,10,6);}
 c.fillStyle='#1d4c5c';c.beginPath();c.ellipse(x,y+6,22,9,0,0,Math.PI*2);c.fill();c.fillStyle=`rgba(160,220,235,${.35+.15*Math.sin(t*2)})`;c.fillRect(x-10,y+4,8,2);
 c.fillStyle='#5a3d22';c.fillRect(x-30,y-34,5,44);c.fillRect(x+26,y-34,5,44);c.fillStyle='#7a3531';c.fillRect(x-38,y-42,76,10);c.fillStyle='#5c2723';c.fillRect(x-38,y-34,76,3);
 c.fillStyle='#8a5a2a';c.fillRect(x-4,y-30,8,12);
}
function trough(c){
 const {x,y}=L_TROUGH;
 if(drawProp(c,'water-trough',{x,y:y+18,w:124,h:64}))return;
 c.fillStyle='#20352c55';c.fillRect(x-54,y+12,110,8);
 c.fillStyle='#5c3b22';c.fillRect(x-56,y-20,112,32);c.fillStyle='#8a6038';c.fillRect(x-56,y-20,112,4);
 c.fillStyle='#3f7f95';c.fillRect(x-50,y-14,100,18);c.fillStyle='#7cc8d6';c.fillRect(x-44,y-12,30,2);c.fillRect(x+6,y-8,22,2);
 c.fillStyle='#3a2414';c.fillRect(x-56,y+8,112,4);
}
// Emilia's bench in the shade of an old willow.
function bench(c){
 const {x,y}=L_BENCH;
 if(drawProp(c,'plank-bench',{x,y:y+24,w:92,h:52}))return;
 log(c,x-42,y,84,8);c.fillStyle='#4a301c';c.fillRect(x-36,y+8,6,12);c.fillRect(x+30,y+8,6,12);
}
function willow(c,t){
 const {x,y}=WILLOW;
 c.fillStyle='rgba(20,40,20,.22)';c.beginPath();c.ellipse(x+46,y+18,110,70,0,0,Math.PI*2);c.fill();
 if(drawProp(c,'willow-tree',{x,y:y+4,w:220,h:200}))return;
 c.fillStyle='#5a3d22';c.fillRect(x-16,y-120,16,110);
 for(let i=0;i<14;i++){const sway=Math.sin(t*.8+i)*2;c.fillStyle=i%2?'#6f9a3e':'#86ad48';c.fillRect(x-50+i*9+sway,y-126+(i%3)*6,4,80+(i%4)*14);}
 c.fillStyle='#5f8a37';c.beginPath();c.ellipse(x-6,y-124,64,36,0,0,Math.PI*2);c.fill();c.fillStyle='#78a544';c.beginPath();c.ellipse(x-18,y-134,40,22,0,0,Math.PI*2);c.fill();
}
// Drawn each frame, in yard coordinates: the caller translates to YARD. The evening light is laid over the whole farm by the caller.
export function drawTrainingGround(c,{t=0,sword=false}={}){
 if(!drawGrassBase(c,0,0,W,H,()=>{})){c.fillStyle='#86ad48';c.fillRect(0,0,W,H);}
 // Packed dirt: the circle and the path north to the gate.
 const paths=[[NORTH_GAP[0]+12,0,NORTH_GAP[1]-NORTH_GAP[0]-24,L_CIRCLE.y]];
 c.save();c.beginPath();c.ellipse(L_CIRCLE.x,L_CIRCLE.y,L_CIRCLE.rx,L_CIRCLE.ry,0,0,Math.PI*2);for(const [x,y,w,h] of paths)c.rect(x,y,w,h);c.clip();
 const dirt=drawTiles(c,'dirt-ground',{x:0,y:0,w:W,h:H,tw:96});c.restore();
 if(!dirt){
  c.fillStyle='#c9ad74';for(const [x,y,w,h] of paths)c.fillRect(x,y,w,h);
  c.fillStyle='#b99662';c.beginPath();c.ellipse(L_CIRCLE.x,L_CIRCLE.y,L_CIRCLE.rx,L_CIRCLE.ry,0,0,Math.PI*2);c.fill();
  c.fillStyle='#a8844f';c.beginPath();c.ellipse(L_CIRCLE.x,L_CIRCLE.y,L_CIRCLE.rx-20,L_CIRCLE.ry-16,0,0,Math.PI*2);c.fill();
  c.fillStyle='#c8a872';for(let i=0;i<60;i++){const a=i*2.4,r=(i*37)%200;c.fillRect(L_CIRCLE.x+Math.cos(a)*r,L_CIRCLE.y+Math.sin(a)*r*.72,3,2);}
 }
 // Fences go in before the scenery, so the props stand in front of the north rail.
 const rail=(x0,x1,y)=>{if(!drawTiles(c,'log-fence',{x:x0,y,w:x1-x0,h:30,th:30}))for(let x=x0;x<x1;x+=34){log(c,x,y+6,Math.min(34,x1-x),8);log(c,x,y+20,Math.min(34,x1-x),8);}};
 rail(0,NORTH_GAP[0]-6,TOP-34);rail(NORTH_GAP[1]+6,W,TOP-34);
 if(!drawProp(c,'training-gate-posts',{x:540,y:TOP+2,w:100,h:92})){c.fillStyle='#4a301c';for(const x of [NORTH_GAP[0]-6,NORTH_GAP[1]-2])c.fillRect(x,TOP-40,8,40);}
 willow(c,t);bench(c);rack(c);well(c,t);trough(c);
 for(const d of DUMMIES)dummy(c,d,t,d.x>600);
 for(const [id,x,y,w,h] of EXTRAS)drawProp(c,id,{x,y,w,h});
 for(const x of [8,W-30])if(!drawTiles(c,'log-fence-side',{x,y:TOP-36,w:22,h:H-TOP+36,tw:22}))for(let y=TOP-30;y<H;y+=26)log(c,x-2,y,26,8);
 rail(0,W,H-32);
 for(const [x,y] of [[19,TOP+2],[W-19,TOP+2],[19,H],[W-19,H]])drawProp(c,'fence-corner-post',{x,y,w:40,h:40});
 // Drayfus's practice sword in the dirt after the disarm.
 if(sword&&!drawProp(c,'glowing-sword',{x:L_CAST.x+28,y:L_CAST.y+14,w:40,h:40})){c.save();c.translate(L_CAST.x+28,L_CAST.y+6);c.rotate(-.5);c.fillStyle='#9b7444';c.fillRect(-2,-24,5,30);c.fillStyle='#5c3b22';c.fillRect(-7,4,15,4);c.fillRect(-1,8,3,8);c.restore();}
}
// Chapter 6: shows Eli where to stand to cast at the sword. The spot glows and an arrow bobs over it; while he is
// further than a few steps away, a second arrow circles him, pointing at it.
export function drawCastGuide(c,t=0,player=null){
 const {x,y}=CAST_SPOT,pulse=(Math.sin(t*3)+1)/2;
 c.save();
 const g=c.createRadialGradient?c.createRadialGradient(x,y,4,x,y,46):null;
 if(g){g.addColorStop(0,`rgba(170,240,255,${.8+.2*pulse})`);g.addColorStop(.6,`rgba(110,210,255,${.45+.2*pulse})`);g.addColorStop(1,'rgba(110,210,255,0)');c.fillStyle=g;}else c.fillStyle='rgba(140,230,255,.5)';
 c.beginPath();c.ellipse(x,y,56,26,0,0,Math.PI*2);c.fill();
 c.strokeStyle=`rgba(225,250,255,${.7+.3*pulse})`;c.lineWidth=3;c.beginPath();c.ellipse(x,y,34+pulse*8,15+pulse*4,0,0,Math.PI*2);c.stroke();
 for(let i=0;i<6;i++){const k=(t*.6+i/6)%1;c.fillStyle=`rgba(200,245,255,${.8*(1-k)})`;c.fillRect(Math.round(x-30+i*12),Math.round(y-k*40),3,3);}
 arrow(c,x,y-34-Math.abs(Math.sin(t*4))*12,Math.PI/2,1.1);
 if(player){const dx=x-player.x,dy=y-player.y,d=Math.hypot(dx,dy);if(d>110){const a=Math.atan2(dy,dx);arrow(c,player.x+Math.cos(a)*48,player.y-20+Math.sin(a)*48,a,.75);}}
 c.restore();
}
// A chunky gold arrow pointing along angle a, centred on its tip.
function arrow(c,x,y,a,k){
 c.save();c.translate(x,y);c.rotate(a);c.scale(k,k);
 c.fillStyle='#1f2a22';c.beginPath();c.moveTo(2,0);c.lineTo(-18,-14);c.lineTo(-18,-6);c.lineTo(-34,-6);c.lineTo(-34,6);c.lineTo(-18,6);c.lineTo(-18,14);c.closePath();c.fill();
 c.fillStyle='#ffd65a';c.beginPath();c.moveTo(-1,0);c.lineTo(-16,-10);c.lineTo(-16,-4);c.lineTo(-31,-4);c.lineTo(-31,4);c.lineTo(-16,4);c.lineTo(-16,10);c.closePath();c.fill();
 c.restore();
}
