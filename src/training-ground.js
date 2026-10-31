// The village guard's training ground behind the chief's house. Geometry, collision and artwork only; story.js decides who stands here.
import {drawGrassBase} from './grass-texture.js';
import {drawProp,drawTiles} from './sprites.js';
// The gate in Willowback, on the west side of the chief's house.
export const TRAINING_GATE={x:580,y:290};
export const TRAINING_GROUND={id:'training-ground',name:'The Training Ground',width:720,height:560,seed:7361,spawn:{x:360,y:480},exits:[{edge:'south',from:310,to:410,target:'village',entry:{x:TRAINING_GATE.x,y:TRAINING_GATE.y+40},label:'Willowback Village'}]};
export const CIRCLE={x:360,y:300,rx:190,ry:140};
export const DRAYFUS_SPOT={x:360,y:290};
export const BENCH={x:110,y:250};
export const TRAINING_EMILIA_SPOT={x:110,y:226};
export const FENCE_MARA_SPOT={x:200,y:470};
export const RACK_SPOT={x:360,y:96};
export const YARD_WELL={x:604,y:150};
export const TROUGH={x:600,y:420};
// Where Eli stands to cast at Drayfus's sword: the south edge of the circle.
export const CAST_SPOT={x:360,y:430};
const DUMMIES=[{x:150,y:120},{x:214,y:104},{x:560,y:300}];
// Scenery only, with no drawn fallback: a barrel of practice weapons, a spear crate, an archery target and hay.
const EXTRAS=[['weapon-barrel',470,118,40,52],['spear-crate',256,118,40,52],['archery-target',660,250,44,54],['hay-bale',666,330,44,44]];
export const TRAINING_GROUND_PLACES=[];
const WALL=84,FENCE=34;
export function trainingGroundBlocked(x,y){
 if(y<WALL||x<FENCE||x>720-FENCE)return true;
 if(y>560-FENCE&&(x<322||x>398))return true;
 if(x>290&&x<430&&y<116)return true;
 if(Math.hypot(x-YARD_WELL.x,y-YARD_WELL.y)<38)return true;
 if(x>TROUGH.x-58&&x<TROUGH.x+58&&y>TROUGH.y-24&&y<TROUGH.y+20)return true;
 if(x>BENCH.x-44&&x<BENCH.x+44&&y>BENCH.y-6&&y<BENCH.y+22)return true;
 if(Math.hypot(x-470,y-104)<24||Math.hypot(x-256,y-104)<24)return true;
 if(x>636&&y>210&&y<342)return true;
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
// Weapon rack against the chief's house: swords, spears, axes and a cracked bow.
function rack(c){
 const {x,y}=RACK_SPOT;
 if(drawProp(c,'weapon-rack',{x,y:y+22,w:140,h:96}))return;
 log(c,x-66,y-10,132,8);log(c,x-66,y+10,132,8);c.fillStyle='#4a301c';c.fillRect(x-66,y-40,6,64);c.fillRect(x+60,y-40,6,64);
 for(let i=0;i<4;i++){const sx=x-50+i*14;c.fillStyle='#b9bcc0';c.fillRect(sx,y-44,4,46);c.fillStyle='#6b4a2a';c.fillRect(sx-3,y+2,10,3);c.fillRect(sx,y+5,4,10);}
 for(let i=0;i<2;i++){const sx=x+10+i*14;c.fillStyle='#7a5733';c.fillRect(sx,y-58,3,74);c.fillStyle='#c8ccd0';c.beginPath();c.moveTo(sx-3,y-58);c.lineTo(sx+1.5,y-70);c.lineTo(sx+6,y-58);c.fill();}
 c.fillStyle='#7a5733';c.fillRect(x+42,y-40,3,52);c.fillStyle='#9aa0a6';c.fillRect(x+36,y-40,12,10);
 c.strokeStyle='#6b4a2a';c.lineWidth=3;c.beginPath();c.arc(x+56,y-14,26,Math.PI*.6,Math.PI*1.4);c.stroke();c.strokeStyle='#e6dcc0';c.lineWidth=1;c.beginPath();c.moveTo(x+48,y-38);c.lineTo(x+48,y+10);c.stroke();
}
function well(c,t){
 const {x,y}=YARD_WELL;
 if(drawProp(c,'well',{x,y:y+30,w:84,h:110}))return;
 c.fillStyle='#20352c55';c.beginPath();c.ellipse(x+3,y+20,40,10,0,0,Math.PI*2);c.fill();
 c.fillStyle='#7d7a72';c.beginPath();c.ellipse(x,y+8,34,16,0,0,Math.PI*2);c.fill();c.fillStyle='#9a978e';for(let i=0;i<8;i++){const a=i/8*Math.PI*2;c.fillRect(x+Math.cos(a)*28-5,y+8+Math.sin(a)*12-3,10,6);}
 c.fillStyle='#1d4c5c';c.beginPath();c.ellipse(x,y+6,22,9,0,0,Math.PI*2);c.fill();c.fillStyle=`rgba(160,220,235,${.35+.15*Math.sin(t*2)})`;c.fillRect(x-10,y+4,8,2);
 c.fillStyle='#5a3d22';c.fillRect(x-30,y-34,5,44);c.fillRect(x+26,y-34,5,44);c.fillStyle='#7a3531';c.fillRect(x-38,y-42,76,10);c.fillStyle='#5c2723';c.fillRect(x-38,y-34,76,3);
 c.fillStyle='#8a5a2a';c.fillRect(x-4,y-30,8,12);
}
function trough(c){
 const {x,y}=TROUGH;
 if(drawProp(c,'water-trough',{x,y:y+18,w:124,h:64}))return;
 c.fillStyle='#20352c55';c.fillRect(x-54,y+12,110,8);
 c.fillStyle='#5c3b22';c.fillRect(x-56,y-20,112,32);c.fillStyle='#8a6038';c.fillRect(x-56,y-20,112,4);
 c.fillStyle='#3f7f95';c.fillRect(x-50,y-14,100,18);c.fillStyle='#7cc8d6';c.fillRect(x-44,y-12,30,2);c.fillRect(x+6,y-8,22,2);
 c.fillStyle='#3a2414';c.fillRect(x-56,y+8,112,4);
}
// Emilia's bench in the shade of an old willow.
function bench(c){
 const {x,y}=BENCH;
 if(drawProp(c,'plank-bench',{x,y:y+24,w:92,h:52}))return;
 log(c,x-42,y,84,8);c.fillStyle='#4a301c';c.fillRect(x-36,y+8,6,12);c.fillRect(x+30,y+8,6,12);
}
function willow(c,t){
 c.fillStyle='rgba(20,40,20,.22)';c.beginPath();c.ellipse(116,236,110,70,0,0,Math.PI*2);c.fill();
 if(drawProp(c,'willow-tree',{x:70,y:218,w:220,h:200}))return;
 c.fillStyle='#5a3d22';c.fillRect(54,96,16,110);
 for(let i=0;i<14;i++){const sway=Math.sin(t*.8+i)*2;c.fillStyle=i%2?'#6f9a3e':'#86ad48';c.fillRect(20+i*9+sway,90+(i%3)*6,4,80+(i%4)*14);}
 c.fillStyle='#5f8a37';c.beginPath();c.ellipse(64,92,64,36,0,0,Math.PI*2);c.fill();c.fillStyle='#78a544';c.beginPath();c.ellipse(52,82,40,22,0,0,Math.PI*2);c.fill();
}
// Drawn each frame: the light follows the story, from a bright morning to a long red evening.
export function drawTrainingGround(c,{t=0,evening=false,sword=false}={}){
 if(!drawGrassBase(c,0,0,720,560,()=>{})){c.fillStyle='#86ad48';c.fillRect(0,0,720,560);}
 // Packed dirt circle.
 c.save();c.beginPath();c.ellipse(CIRCLE.x,CIRCLE.y,CIRCLE.rx,CIRCLE.ry,0,0,Math.PI*2);c.rect(330,420,60,140);c.clip();
 const dirt=drawTiles(c,'dirt-ground',{x:0,y:0,w:720,h:560,tw:96});c.restore();
 if(!dirt){
 c.fillStyle='#b99662';c.beginPath();c.ellipse(CIRCLE.x,CIRCLE.y,CIRCLE.rx,CIRCLE.ry,0,0,Math.PI*2);c.fill();
 c.fillStyle='#a8844f';c.beginPath();c.ellipse(CIRCLE.x,CIRCLE.y,CIRCLE.rx-20,CIRCLE.ry-16,0,0,Math.PI*2);c.fill();
 c.fillStyle='#c8a872';for(let i=0;i<40;i++){const a=i*2.4,r=(i*37)%150;c.fillRect(CIRCLE.x+Math.cos(a)*r,CIRCLE.y+Math.sin(a)*r*.72,3,2);}
 // Path from the gate.
 c.fillStyle='#c9ad74';c.fillRect(330,440,60,120);
 }
 // The back wall of the chief's house: red plaster and white timber.
 if(!drawTiles(c,'training-wall',{x:0,y:0,w:720,h:WALL-8,th:WALL-8})){
 c.fillStyle='#8e3b33';c.fillRect(0,0,720,WALL-8);c.fillStyle='#e4d8bb';for(let x=40;x<720;x+=120)c.fillRect(x,0,8,WALL-8);c.fillRect(0,WALL-16,720,6);
 c.fillStyle='#5f3a26';c.fillRect(0,WALL-10,720,4);c.fillStyle='#3a2a20';c.fillRect(220,14,46,40);c.fillStyle='#f0d690';c.fillRect(224,18,38,32);c.fillStyle='#3a2a20';c.fillRect(242,18,2,32);
 }
 willow(c,t);bench(c);rack(c);well(c,t);trough(c);
 for(const d of DUMMIES)dummy(c,d,t,d.x>400);
 for(const [id,x,y,w,h] of EXTRAS)drawProp(c,id,{x,y,w,h});
 // Split-log fence on three sides, with a gap at the south gate.
 if(!drawTiles(c,'log-fence-side',{x:8,y:WALL-6,w:22,h:560-WALL,tw:22})||!drawTiles(c,'log-fence-side',{x:690,y:WALL-6,w:22,h:560-WALL,tw:22}))
  for(let y=WALL;y<560;y+=26){log(c,6,y,26,8);log(c,688,y,26,8);}
 if(!drawTiles(c,'log-fence',{x:0,y:528,w:318,h:30,th:30})||!drawTiles(c,'log-fence',{x:402,y:528,w:318,h:30,th:30}))
  for(let x=6;x<714;x+=34)if(x<318||x>398){log(c,x,534,34,8);log(c,x,548,34,8);}
 for(const x of [19,701])drawProp(c,'fence-corner-post',{x,y:560,w:40,h:40});
 if(!drawProp(c,'training-gate-posts',{x:360,y:562,w:100,h:92})){c.fillStyle='#4a301c';for(const x of [312,404])c.fillRect(x,520,8,40);}
 // Drayfus's practice sword in the dirt after the disarm.
 if(sword&&!drawProp(c,'glowing-sword',{x:CAST_SPOT.x+28,y:CAST_SPOT.y+14,w:40,h:40})){c.save();c.translate(CAST_SPOT.x+28,CAST_SPOT.y+6);c.rotate(-.5);c.fillStyle='#9b7444';c.fillRect(-2,-24,5,30);c.fillStyle='#5c3b22';c.fillRect(-7,4,15,4);c.fillRect(-1,8,3,8);c.restore();}
 if(evening){c.fillStyle='rgba(120,50,30,.28)';c.fillRect(0,0,720,560);}
}
