import {drawProp} from './sprites.js';
import {CABIN,CAMP,cabinDamaged} from './story.js';
export const CABIN_AREA={id:'cabin',name:'Grandpa’s Cabin',width:640,height:480,seed:7329,spawn:{x:320,y:395},exits:[{edge:'south',from:270,to:370,target:'landing',entry:{x:CABIN.x,y:1570},label:'Reedwater Shore'}]};
export const CABIN_PLACES=[{id:'cabin-box',name:'The Lure Box',x:520,y:145,kind:'interior',text:'A wooden box leaks a faint blue light.'},{id:'cabin-photo',name:'The Photograph',x:110,y:270,kind:'interior',text:'A young man, a laughing woman, and an enormous gray wolf.'},{id:'cabin-stove',name:'The Stove',x:100,y:120,kind:'interior',text:'A small stove and a well-stocked spice rack.'},{id:'cabin-bed',name:'The Bed',x:510,y:330,kind:'interior',text:'A wool blanket lies neatly folded at the foot of the bed.'}];
export const cabinBlocked=(x,y)=>x>CABIN.left-14&&x<CABIN.right+14&&y>CABIN.top-14&&y<CABIN.bottom+14;
export const cabinClearing=(x,y)=>x>1400&&x<1930&&y>1230&&y<1760;
export const cabinInteriorBlocked=(x,y)=>[[65,45,180,90],[476,65,582,111],[48,212,120,241],[462,255,575,378],[237,203,391,288]].some(([l,t,r,b])=>x>l-12&&x<r+12&&y>t-12&&y<b+12);
export function drawCabin(c,story){
 const damaged=cabinDamaged(story),x=CABIN.left,y=CABIN.top;
 c.save();c.translate(x,y);
 c.fillStyle='#24352d55';c.fillRect(8,12,278,193);
 c.fillStyle=damaged?'#514538':'#89613d';c.fillRect(0,0,270,190);
 for(let j=0;j<190;j+=12){c.fillStyle=damaged?'#362f2b':'#66452d';c.fillRect(0,j,270,3);c.fillStyle=damaged?'#6e6151':'#b38a58';c.fillRect(0,j+3,270,2);}
 c.fillStyle='#b4a58a';c.fillRect(25,-63,33,82);c.fillStyle='#706d61';for(let j=-60;j<20;j+=11)c.fillRect(25,j,33,2);
 c.fillStyle='#392e26';c.fillRect(117,122,42,68);c.fillStyle='#c3924d';c.fillRect(121,127,34,63);c.fillStyle='#e6c36c';c.fillRect(145,158,4,4);
 for(const wx of [29,198]){c.fillStyle='#d9bd81';c.fillRect(wx,125,40,34);c.fillStyle=damaged?'#25302d':'#7ca5a0';c.fillRect(wx+4,129,32,26);c.fillStyle='#684a31';c.fillRect(wx+18,129,4,26);c.fillRect(wx+4,141,32,3);}
 c.fillStyle=damaged?'#322c2a':'#5c493b';c.beginPath();c.moveTo(-18,116);c.lineTo(132,-18);c.lineTo(damaged?180:288,damaged?33:116);c.closePath();c.fill();
 c.strokeStyle=damaged?'#776354':'#9b7c56';c.lineWidth=4;
 for(let j=0;j<6;j++){c.beginPath();c.moveTo(5+j*21,100-j*19);c.lineTo(damaged?166:264-j*21,damaged?62+j*5:100-j*19);c.stroke();}
 if(damaged){c.strokeStyle='#342c28';c.lineWidth=9;for(const [bx,by,ex,ey]of [[172,125,197,10],[207,123,254,35],[252,127,275,74],[169,165,276,195]]){c.beginPath();c.moveTo(bx,by);c.lineTo(ex,ey);c.stroke();}c.fillStyle='#252826';c.fillRect(181,112,77,10);}
 c.fillStyle='#c6ad7c';c.fillRect(106,190,67,12);c.fillStyle='#806748';c.fillRect(98,202,84,7);
 drawProp(c,'firewood-stack',{x:-22,y:196,w:54,h:40});drawProp(c,'rain-barrel',{x:286,y:194,w:30,h:44});c.restore();
}
export function drawCabinInterior(c){
 c.fillStyle='#26352f';c.fillRect(0,0,640,480);c.fillStyle='#b18b59';c.fillRect(24,24,592,432);
 for(let y=25;y<456;y+=22){c.fillStyle='#795b3e';c.fillRect(24,y,592,2);for(let x=24+(y%44?0:65);x<616;x+=130)c.fillRect(x,y,2,22);}
 c.fillStyle='#60432e';c.fillRect(10,10,620,23);c.fillRect(10,10,20,450);c.fillRect(610,10,20,450);
 // Sprites when loaded; the drawn shapes below are the fallback. Rod rack, chairs and lamp exist only as sprites.
 drawProp(c,'fishing-rod-rack',{x:330,y:104,w:84,h:94});
 if(!drawProp(c,'cook-stove',{x:122,y:94,w:118,h:88})){
  c.fillStyle='#654735';c.fillRect(65,45,115,45);c.fillStyle='#354344';c.fillRect(80,55,75,30);c.fillStyle='#ffc66c';c.fillRect(89,67,55,18);
 }
 if(!drawProp(c,'lure-box-shelf',{x:529,y:112,w:110,h:66})){
  c.fillStyle='#785332';c.fillRect(476,65,106,46);c.fillStyle='#4e321e';c.fillRect(501,76,49,26);c.fillStyle='#65d5ed';c.fillRect(505,84,41,3);
 }
 if(!drawProp(c,'photo-side-table',{x:84,y:246,w:76,h:80})){
  c.fillStyle='#6a4328';c.fillRect(48,212,72,29);c.fillStyle='#dfbf7c';c.fillRect(68,216,28,23);c.fillStyle='#554638';c.fillRect(72,220,20,15);
 }
 if(!drawProp(c,'bed-green',{x:518,y:382,w:118,h:150})){
  c.fillStyle='#6b4732';c.fillRect(462,255,113,123);c.fillStyle='#ddc9a0';c.fillRect(470,263,97,106);c.fillStyle='#6f9c91';c.fillRect(470,294,97,75);c.fillStyle='#f2dec1';c.fillRect(482,267,72,21);
 }
 if(!drawProp(c,'dining-table',{x:314,y:292,w:158,h:96})){
  c.fillStyle='#754f30';c.fillRect(237,203,154,85);c.fillStyle='#bd945d';c.fillRect(242,207,144,73);c.fillStyle='#d7be89';c.beginPath();c.arc(310,241,15,0,Math.PI*2);c.fill();
 }
 drawProp(c,'chair',{x:220,y:286,w:34,h:58,flipX:true});drawProp(c,'chair',{x:408,y:286,w:34,h:58});drawProp(c,'oil-lamp',{x:366,y:236,w:18,h:32});
 if(!drawProp(c,'door-mat',{x:320,y:474,w:84,h:40})){
  c.fillStyle='#c4b181';c.fillRect(278,438,84,42);
 }
 c.font='13px monospace';c.textAlign='center';c.fillStyle='#f6e4b6';c.fillText('↓ Shore',320,469);
}
export function drawCamp(c,t){
 c.fillStyle='#717a70';c.fillRect(CAMP.x-63,CAMP.y+14,40,23);c.fillStyle='#a6afa0';c.fillRect(CAMP.x-60,CAMP.y+17,34,3);
 if(!drawProp(c,'campfire',{x:CAMP.x,y:CAMP.y+16,w:58,h:60})){
  c.fillStyle='#786d57';for(let i=0;i<8;i++){const a=i*Math.PI/4;c.beginPath();c.ellipse(CAMP.x+Math.cos(a)*21,CAMP.y+Math.sin(a)*12,7,5,a,0,Math.PI*2);c.fill();}
  c.fillStyle='#643d29';c.fillRect(CAMP.x-18,CAMP.y-3,36,6);c.fillStyle='#f8a94d';c.beginPath();c.moveTo(CAMP.x-12,CAMP.y);c.lineTo(CAMP.x-4,CAMP.y-24-Math.sin(t*3)*3);c.lineTo(CAMP.x+3,CAMP.y-10);c.lineTo(CAMP.x+10,CAMP.y-20);c.lineTo(CAMP.x+13,CAMP.y);c.fill();
  c.fillStyle='#ffe3a0';c.fillRect(CAMP.x-4,CAMP.y-12,9,13);
 }
 c.strokeStyle='#70553a';c.lineWidth=3;c.beginPath();c.moveTo(CAMP.x-34,CAMP.y-19);c.lineTo(CAMP.x+40,CAMP.y-29);c.stroke();
 c.strokeStyle='#ddd0a0';c.lineWidth=1;c.beginPath();c.moveTo(CAMP.x+9,CAMP.y-25);c.lineTo(CAMP.x+7,CAMP.y-10);c.stroke();
 c.fillStyle='#ba9769';c.beginPath();c.ellipse(CAMP.x+7,CAMP.y-11,9,4,-.3,0,Math.PI*2);c.fill();
}
export function paintStoryMap(c,sx,sy,story){
 if(!story)return;c.fillStyle=cabinDamaged(story)?'#45362f':'#815837';c.fillRect(CABIN.left*sx,CABIN.top*sy,270*sx,190*sy);
 if(cabinDamaged(story)&&story.stage!=='storm'){c.fillStyle='#e5a452';c.fillRect(CAMP.x*sx-3,CAMP.y*sy-3,6,6);}
}

