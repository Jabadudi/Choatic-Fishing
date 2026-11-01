import {VILLAGE_BUILDINGS,VILLAGE_PROPS,COMMONS,GARDENS} from './village.js';
import {drawProp} from './sprites.js';
import {SHEEP_PEN,BARLEY_NORTH,BARLEY_SOUTH,VEGETABLE_FIELDS,MILL_WHEEL,MILL_LANDING,farmShore,LANTERN_SQUARE,WILLOWBACK_GATE,PORT,PORT_DECK,PORT_DOCK,GREAT_PIER,JETTIES,STAIRS,portShore} from './village-districts.js';
const r=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function post(c,x,y){r(c,'#53442e',x-4,y-30,8,40);r(c,'#ba9960',x-3,y-30,3,38);r(c,'#dcc18b',x-5,y-32,10,3);}
function fence(c,x,y,length){for(let dx=0;dx<=length;dx+=24)post(c,x+dx,y);r(c,'#a58b54',x,y-19,length,4);r(c,'#79633e',x,y-8,length,4);}
function barrel(c,x,y){if(drawProp(c,'barrel',{x,y:y+11,w:26,h:36}))return;ellipse(c,x,y+9,13,5,'#243a3340');r(c,'#735332',x-11,y-12,22,22);r(c,'#ae8851',x-8,y-12,7,21);r(c,'#424e43',x-12,y-8,24,3);r(c,'#424e43',x-12,y+4,24,3);ellipse(c,x,y-12,11,4,'#baa174');ellipse(c,x,y-12,8,2,'#665336');}
function lantern(c,x,y){if(drawProp(c,'lantern-post',{x:x+4,y:y+10,w:34,h:56}))return;post(c,x,y);r(c,'#3e392a',x-7,y-38,14,3);r(c,'#edc87e',x-5,y-35,10,15);r(c,'#fff0b1',x-3,y-33,3,10);r(c,'#3e392a',x-7,y-21,14,3);}
function boat(c,x,y,flip=1){if(drawProp(c,'rowing-boat',{x,y:y+18,w:88,h:58,flipX:flip<0}))return;c.save();c.translate(x,y);c.scale(flip,1);ellipse(c,4,6,39,12,'#123d5355');c.fillStyle='#60462f';c.beginPath();c.moveTo(-39,-9);c.lineTo(20,-12);c.lineTo(43,0);c.lineTo(20,12);c.lineTo(-39,9);c.closePath();c.fill();r(c,'#ab8050',-33,-7,53,14);r(c,'#5c442e',-17,-8,4,16);r(c,'#5c442e',8,-8,4,16);r(c,'#d2ac74',-33,-8,55,2);r(c,'#d7c08b',-5,-21,3,43);r(c,'#b88c56',-8,14,9,12);c.restore();}
// 12.2 Town Square: the worn paving of the Willow Commons, lantern posts, benches, garden plots and the WILLOWBACK sign
// over the main street. The well, the Great Willow and the notice board are depth-sorted objects.
export function drawVillageGround(c){
 const {x:cx,y:cy,rx,ry}=COMMONS;
 ellipse(c,cx,cy,rx+10,ry+8,'#b9ae78');
 for(let y=cy-ry;y<cy+ry;y+=14)for(let x=cx-rx;x<cx+rx;x+=22){if(((x-cx)/rx)**2+((y-cy)/ry)**2>1)continue;const o=y%28?8:0;r(c,(x+y)%3?'#bfb58a':'#a9a17b',x+o,y,20,12);r(c,'#d4c79c',x+o,y,19,2);}
 for(const [x,y,w,h] of GARDENS){plot(c,x,y,w,h,(x+y)%3);fence(c,x,y,w);}
 for(const [x,y] of [[1030,520],[1600,520],[1030,890],[1600,890],[1760,620],[880,610]])lantern(c,x,y);
 for(const [x,y] of [[1150,610],[1450,610],[1200,820],[1460,820]])bench(c,x,y);
 for(const [x,y] of [[1840,520],[520,600],[1560,470]])barrel(c,x,y);
 for(const [x,y] of [[1810,480],[590,520]])firewood(c,x,y);
 washing(c,120,620,130,1);washing(c,1480,1120,110,3);
 // The sign over the main street, where it leaves for the Merchant Quarter.
 r(c,'#6f5134',1832,520,6,64);r(c,'#6f5134',1900,520,6,64);r(c,'#6f5134',1826,508,86,10);r(c,'#b19058',1834,511,70,15);c.font='bold 9px monospace';c.textAlign='center';c.fillStyle='#3c3c28';c.fillText('MARKET ►',1869,522);
 // The fallen branches across the forest track.
 for(const [x,y,a] of [[660,70,.3],[720,96,-.4]]){c.save();c.translate(x,y);c.rotate(a);r(c,'#5c4128',-46,-5,92,10);r(c,'#7d5c38',-46,-5,92,3);r(c,'#4f7a32',-30,-12,10,8);r(c,'#4f7a32',18,4,12,8);c.restore();}
}
function window(c,x,y){r(c,'#5d4932',x-16,y-20,32,29);r(c,'#edc67b',x-12,y-16,24,21);r(c,'#fff0b3',x-11,y-15,9,13);r(c,'#715537',x-1,y-18,3,24);r(c,'#715537',x-13,y-7,26,3);r(c,'#b18b52',x-18,y+8,36,5);}
// A tall timber watchtower: four legs, a ladder, a railed platform and a plank roof.
function watchtower(c,x,y){
 ellipse(c,x+8,y+4,38,10,'#18392c44');
 for(const dx of [-24,18])r(c,'#5c4128',x+dx,y-92,7,96);for(const dx of [-16,10])r(c,'#4a331f',x+dx,y-88,6,90);
 for(const yy of [y-30,y-62]){r(c,'#6f5134',x-24,yy,49,4);}
 r(c,'#7d5c38',x-4,y-86,3,88);r(c,'#7d5c38',x+5,y-86,3,88);for(let yy=y-80;yy<y;yy+=10)r(c,'#a07a4a',x-4,yy,12,2);
 r(c,'#6f5134',x-34,y-100,68,10);r(c,'#b19058',x-34,y-100,68,3);
 for(const dx of [-33,-12,9,29])r(c,'#5c4128',x+dx,y-122,4,22);r(c,'#8a6640',x-34,y-124,68,4);
 r(c,'#5b3e2a',x-40,y-150,80,8);r(c,'#7b5636',x-36,y-158,72,9);r(c,'#946a42',x-30,y-165,60,8);
 for(const dx of [-33,29])r(c,'#4a331f',x+dx,y-150,4,28);
}
// The Great Willow: the drawn willow sprite, or a drooping crown of strands over a thick trunk.
function greatWillow(c,x,y,t){
 ellipse(c,x+26,y+10,120,40,'rgba(20,40,20,.22)');
 if(drawProp(c,'willow-tree',{x,y:y+6,w:260,h:236}))return;
 r(c,'#5a3d22',x-14,y-150,28,152);r(c,'#7a5733',x-8,y-150,6,150);
 ellipse(c,x,y-156,96,54,'#5f8a37');ellipse(c,x-16,y-170,64,34,'#78a544');
 for(let i=0;i<20;i++){const sway=Math.sin(t*.8+i)*2;r(c,i%2?'#6f9a3e':'#86ad48',x-92+i*9+sway,y-162+(i%3)*6,4,96+(i%4)*16);}
}
function noticeBoard(c,x,y){
 ellipse(c,x+4,y+4,26,6,'#18392c33');r(c,'#5c4128',x-22,y-44,5,48);r(c,'#5c4128',x+17,y-44,5,48);
 r(c,'#7d5c38',x-26,y-50,52,32);r(c,'#a07a4a',x-24,y-48,48,28);
 for(const [dx,dy,col] of [[-20,-46,'#efe3c0'],[-6,-44,'#e3d3a6'],[8,-46,'#f2e8cc'],[-14,-32,'#e8dcb8'],[4,-32,'#efe3c0']])r(c,col,x+dx,y+dy,11,12);
 r(c,'#b3443b',x-1,y-44,2,2);r(c,'#5b4230',x-28,y-52,56,4);
}
// A small hut on stilts: the net sheds over the deck edge, the coop, the harbourmaster's hut over the water.
function stiltHut(c,b,stilts=true){
 const {x,y,w,h}=b,left=x-w/2,top=y-h;
 ellipse(c,x+6,y+8,w*.5,10,'#18382d36');
 if(stilts)for(const dx of [-w/2+6,-w/6,w/6,w/2-10]){r(c,'#4a331f',x+dx,y-4,5,26);r(c,'#6f5134',x+dx,y-4,2,26);}
 r(c,'#8a6640',left,top,w,h);for(let xx=left+4;xx<left+w-2;xx+=10)r(c,'#6f5134',xx,top+2,2,h-4);
 r(c,'#3d2c1c',x-9,y-28,18,28);r(c,'#edc67b',x+w/4-6,top+12,12,10);
 for(let row=0;row<6;row++){const inset=(5-row)*4,ry=top-34+row*6;r(c,b.roof||'#567d76',left-10+inset,ry,w+20-inset*2,7);for(let xx=left-8+inset+(row%2)*8;xx<left+w+8-inset;xx+=16)r(c,b.trim||'#8faba0',xx,ry,13,2);}
 r(c,'#5b4230',left-12,top-2,w+24,6);
}
function appleTree(c,x,y){
 ellipse(c,x+6,y+6,30,9,'#18392c33');r(c,'#5a3d22',x-5,y-42,10,44);r(c,'#7a5733',x-3,y-42,3,40);
 ellipse(c,x,y-58,34,28,'#4f7a32');ellipse(c,x-8,y-66,22,16,'#6a9640');
 for(const [dx,dy] of [[-16,-52],[10,-60],[-4,-74],[18,-48],[-20,-66],[4,-46]])ellipse(c,x+dx,y+dy,3,3,'#c43c2e');
 r(c,'#8a6640',x+10,y-30,3,32);
}
// The blacksmith's open forge: a stone hearth with a hood and a glowing bed of coals, and the smoke above it.
function forge(c,x,y,t){
 ellipse(c,x+4,y+6,40,9,'#18392c33');r(c,'#6c6a64',x-34,y-30,68,40);r(c,'#8e8b82',x-34,y-30,68,5);
 r(c,'#3b2a20',x-24,y-24,48,18);const glow=.6+.4*Math.sin(t*5);r(c,`rgba(255,${120+Math.round(glow*60)},40,1)`,x-20,y-20,40,10);r(c,'#ffd27a',x-10,y-18,14,4);
 r(c,'#55524c',x-28,y-74,56,12);r(c,'#6c6a64',x-10,y-104,20,32);
 for(let i=0;i<4;i++){const k=((t*.35+i/4)%1);c.fillStyle=`rgba(190,190,185,${.45*(1-k)})`;c.beginPath();c.arc(x+Math.sin(t+i)*8,y-110-k*70,8+k*14,0,Math.PI*2);c.fill();}
}
function anvil(c,x,y){
 ellipse(c,x+2,y+4,20,5,'#18392c33');r(c,'#5c4128',x-10,y-14,20,16);r(c,'#3e3e42',x-18,y-24,36,10);r(c,'#5d5d63',x-18,y-24,36,3);r(c,'#3e3e42',x+18,y-22,8,5);
 // The tool rack beside it.
 r(c,'#5c4128',x+40,y-46,4,48);r(c,'#5c4128',x+96,y-46,4,48);r(c,'#7d5c38',x+38,y-48,64,4);
 for(let i=0;i<5;i++){r(c,'#9aa0a6',x+46+i*11,y-44,3,i%2?26:32);r(c,'#6b4a2a',x+44+i*11,y-16+(i%2?-6:0),7,3);}
}
export function drawVillageObject(c,b,time=0){
 const {x,y}=b;
 if(b.kind==='watchtower'){watchtower(c,x,y);return;}
 if(b.kind==='willow'){greatWillow(c,x,y,time);return;}
 if(b.kind==='notice'){noticeBoard(c,x,y);return;}
 if(b.kind==='shed'){stiltHut(c,b,b.id!=='coop');return;}
 if(b.kind==='hut'){stiltHut(c,{x,y,w:72,h:46,roof:'#7a3531',trim:'#c9a46a'});r(c,'#5c4128',x+46,y-70,4,72);r(c,'#ffd76a',x+42,y-80,12,12);r(c,'#fff0b1',x+45,y-77,5,5);return;}
 if(b.kind==='boat'){boat(c,x,y,b.f||1);return;}
 if(b.kind==='apple-tree'){appleTree(c,x,y);return;}
 if(b.kind==='forge'){forge(c,x,y,time);return;}
 if(b.kind==='anvil'){anvil(c,x,y);return;}
 if(b.kind==='well'){
  if(drawProp(c,'well',{x,y:y+18,w:92,h:126}))return;
  ellipse(c,x+9,y+8,40,17,'#1a392c44');ellipse(c,x,y,30,17,'#647a70');ellipse(c,x,y-8,30,17,'#b4b69a');ellipse(c,x,y-10,21,10,'#314f4b');r(c,'#658e88',x-13,y-11,24,3);
  for(const dx of [-29,24]){r(c,'#624b30',x+dx,y-79,6,77);r(c,'#b08a52',x+dx,y-79,2,76);}r(c,'#7b4e36',x-41,y-89,82,16);r(c,'#bc8555',x-44,y-75,88,5);r(c,'#d9ba7d',x,y-74,2,56);return;
 }
 if(b.kind==='stall'||b.kind==='fish-stall'){
  if(drawProp(c,b.kind==='stall'?'produce-stall':'fish-stall',{x,y:y+16,w:126,h:110}))return;
  ellipse(c,x+8,y+5,61,15,'#18392c33');for(const dx of [-49,44])r(c,'#644a30',x+dx,y-65,5,78);
  r(c,'#755535',x-54,y-18,108,30);r(c,'#bb945b',x-54,y-18,108,7);
  for(let i=0;i<6;i++){const color=b.kind==='stall'?(i%2?'#edd3a0':'#b86b4c'):(i%2?'#e6dba8':'#588c7a');r(c,color,x-60+i*20,y-72,20,36);r(c,'#5a4b3444',x-60+i*20,y-39,20,6);}
  for(let i=0;i<7;i++){if(b.kind==='stall'){ellipse(c,x-43+i*14,y-20,6,5,i%2?'#b7bc58':'#c7754d');}else{ellipse(c,x-39+i*13,y-23,8,3,'#a1c5b1');r(c,'#d8e2c1',x-42+i*13,y-25,5,2);}}return;
 }
 const left=x-b.w/2,top=y-b.h;
 ellipse(c,x+14,y+6,b.w*.55,24,'#18382d36');r(c,'#716e53',left-5,y-7,b.w+10,23);r(c,b.kind==='chief'?'#93443b':'#d4c292',left,top,b.w,b.h);r(c,b.kind==='chief'?'#793c35':'#b8a57c',x+b.w*.2,top,b.w*.3,b.h);r(c,b.kind==='chief'?'#e4d8bb':'#594a33',left,top,7,b.h);r(c,b.kind==='chief'?'#e4d8bb':'#594a33',left+b.w-7,top,7,b.h);
 for(let xx=left+36;xx<left+b.w-15;xx+=46)r(c,'#82704b',xx,top+5,4,b.h-9);
 window(c,x-b.w*.29,y-35);window(c,x+b.w*.29,y-35);
 r(c,'#59432d',x-18,y-55,36,55);r(c,'#916f43',x-14,y-50,28,49);r(c,'#b99560',x-13,y-49,4,48);r(c,'#eed18e',x+7,y-24,3,3);r(c,'#b1aa86',x-29,y+1,58,11);r(c,'#d9cf9b',x-29,y+1,58,3);
 // Layered clay shingles, with timber eaves and a tiny chimney.
 r(c,'#60513c',x+b.w*.22,top-89,18,48);r(c,'#beb69a',x+b.w*.22-3,top-91,24,6);
 const roofHeight=70;
 for(let row=0;row<10;row++){
  const inset=(9-row)*4,ry=top-roofHeight+row*7;
  r(c,b.roof,left-17+inset,ry,b.w+34-inset*2,8);
  for(let xx=left-15+inset+(row%2)*10;xx<left+b.w+15-inset;xx+=20){r(c,b.trim,xx,ry,17,2);r(c,'#2f292333',xx+18,ry+2,2,5);}
 }
 r(c,'#5b4230',left-19,top-2,b.w+38,8);r(c,b.trim,left-19,top-2,b.w+38,2);
 if(b.name){r(c,'#5a452f',x-64,y-73,128,19);r(c,'#c2a36a',x-62,y-71,124,15);c.font='bold 9px monospace';c.textAlign='center';c.fillStyle='#3c3c28';c.fillText(b.name,x,y-60);}
 // Flowers beside each door, rather than traversable interiors in this first pass.
 for(const dx of [-30,30])if(!drawProp(c,'flower-box',{x:x+dx,y:y+4,w:26,h:22})){r(c,'#805338',x+dx-6,y-8,12,11);r(c,'#639047',x+dx-4,y-17,8,10);r(c,'#e9c887',x+dx-6,y-18,5,5);r(c,'#d68c85',x+dx+2,y-15,5,5);}
}
export const villageObjects=[...VILLAGE_BUILDINGS,...VILLAGE_PROPS];
export function paintVillageBuildings(c,sx,sy){for(const b of VILLAGE_BUILDINGS){r(c,b.roof,(b.x-b.w/2)*sx,(b.y-b.h)*sy,b.w*sx,b.h*sy);}}
export function paintBuildings(c,buildings,sx,sy){for(const b of buildings)r(c,b.roof,(b.x-b.w/2)*sx,(b.y-b.h)*sy,b.w*sx,b.h*sy);}
// Ground dressing for the other three areas: everything here is flat, so it is painted once into the cached ground.
function paving(c,cx,cy,rx,ry){
 ellipse(c,cx,cy,rx+8,ry+6,'#b9ae78');
 for(let y=cy-ry;y<cy+ry;y+=14)for(let x=cx-rx;x<cx+rx;x+=22){if(((x-cx)/rx)**2+((y-cy)/ry)**2>1)continue;const o=y%28?8:0;r(c,(x+y)%3?'#bfb58a':'#a9a17b',x+o,y,20,12);r(c,'#d4c79c',x+o,y,19,2);}
}
function bench(c,x,y){if(drawProp(c,'plank-bench',{x,y:y+21,w:80,h:40}))return;r(c,'#594831',x-31,y,5,19);r(c,'#594831',x+26,y,5,19);r(c,'#b5945d',x-37,y-4,74,10);r(c,'#d3b77f',x-37,y-4,74,2);}
function plot(c,x,y,w,h,seed=0){
 r(c,'#756342',x,y,w,h);
 for(let row=0;row*20+12<h;row++)for(let col=0;col*22+10<w;col++){const px=x+12+col*22,py=y+10+row*20,k=(row+col+seed)%3;r(c,'#5a4a34',px-6,py+1,15,9);ellipse(c,px,py,7,4,k?'#78a44c':'#487849');r(c,k===1?'#c6be62':'#8bb362',px-4,py-5,5,6);if(k===2)r(c,'#d8974d',px-1,py,3,8);}
}
function washing(c,x,y,length,seed=0){
 const colours=['#d7d2c0','#b86b4c','#6c8fb0','#e2c56f','#8fae74','#c99aa8'];
 for(const dx of [0,length]){r(c,'#5c4128',x+dx-2,y-34,4,36);}
 c.strokeStyle='#e8dcb8';c.lineWidth=1;c.beginPath();c.moveTo(x,y-32);c.quadraticCurveTo(x+length/2,y-26,x+length,y-32);c.stroke();
 for(let i=0;i<Math.floor(length/22);i++){const k=(i+seed)%colours.length;r(c,colours[k],x+8+i*22,y-30+Math.sin(i)*1.5,14,i%2?16:12);r(c,'#00000018',x+8+i*22,y-18+Math.sin(i)*1.5,14,2);}
}
function firewood(c,x,y){if(drawProp(c,'firewood-stack',{x,y:y+12,w:54,h:40}))return;for(let i=0;i<3;i++)for(let j=0;j<4-i;j++){ellipse(c,x-18+j*12+i*6,y-i*9,6,5,'#8a6640');ellipse(c,x-18+j*12+i*6,y-i*9,3,3,'#c6a26a');}}
function hay(c,x,y){if(drawProp(c,'hay-bale',{x,y:y+10,w:44,h:44}))return;r(c,'#c9a54f',x-18,y-20,36,26);r(c,'#e0c070',x-18,y-20,36,4);r(c,'#9c7c3a',x-18,y-8,36,2);}
function sheep(c,x,y,f=1){ellipse(c,x+3,y+6,14,4,'#18392c33');r(c,'#3e3a36',x-8,y+1,3,6);r(c,'#3e3a36',x+5,y+1,3,6);ellipse(c,x,y-4,14,9,'#ece6d6');ellipse(c,x-3,y-7,8,5,'#fbf7ec');r(c,'#3e3a36',x+f*11-3,y-9,7,8);r(c,'#fbf7ec',x+f*11-4,y-11,9,3);}
function scarecrow(c,x,y){r(c,'#5c4128',x-2,y-44,4,46);r(c,'#5c4128',x-18,y-34,36,4);r(c,'#7a6a9a',x-10,y-34,20,18);r(c,'#d9b36a',x-7,y-48,14,12);r(c,'#8a6640',x-11,y-52,22,5);r(c,'#e7c875',x-20,y-32,4,8);r(c,'#e7c875',x+16,y-32,4,8);}
function strips(c,x,y,w,h){for(let yy=y;yy<y+h;yy+=12){r(c,(yy/12)%2?'#d6b75c':'#b99a46',x,yy,w,10);for(let xx=x+4;xx<x+w;xx+=9)r(c,(yy/12)%2?'#ecd282':'#c9ab55',xx,yy+1,2,5);}}
function planks(c,x,y,w,h,vertical=false){
 r(c,'#4e4935',x-3,y-3,w+6,h+6);
 if(vertical)for(let yy=y;yy<y+h;yy+=11){r(c,(yy/11|0)%2?'#9c7c50':'#ae8c5b',x,yy,w,9);r(c,'#c5a56d',x,yy,w,1);}
 else for(let xx=x;xx<x+w;xx+=12){r(c,(xx/12|0)%2?'#9c7c50':'#ae8c5b',xx,y,10,h);r(c,'#c5a56d',xx,y,2,h);}
}
// 12.1 The Port: the cliff, the upper deck over it, the stairway, the lower dock, the Great Pier and the jetties.
function port(c){
 const W=PORT.width;
 // The low rock cliff, from the deck's edge down to the water.
 for(let x=0;x<W;x+=8){const shore=portShore(x);for(let y=PORT_DECK.bottom;y<shore+6;y+=8){const k=((x*7+y*13)%23)/23;r(c,k<.3?'#77736a':k<.7?'#8a867b':'#9b968a',x,y,8,8);if(k>.85)r(c,'#5f5b53',x+2,y+5,5,2);}r(c,'#5a564e',x,shore-2,8,6);r(c,'#cfe3e0',x+(x%16),shore+4,4,2);}
 for(let x=20;x<W;x+=46){r(c,'#4c3a24',x,PORT_DECK.bottom,5,24+((x*31)%30));}
 // The upper deck: long planks, a rail along the cliff edge, posts underneath.
 for(let y=PORT_DECK.top;y<PORT_DECK.bottom;y+=10){r(c,(y/10|0)%2?'#9c7c50':'#ae8c5b',0,y,W,9);r(c,'#c5a56d',0,y,W,1);for(let x=((y*7)%60);x<W;x+=60)r(c,'#58452f',x,y+4,2,2);}
 r(c,'#6f5134',0,PORT_DECK.top-6,W,6);r(c,'#4e4935',0,PORT_DECK.bottom,W,5);
 for(let x=0;x<W;x+=40){if(x>STAIRS.one.from-40&&x<STAIRS.one.from+40)continue;post(c,x,PORT_DECK.bottom-4);}
 r(c,'#a58b54',0,PORT_DECK.bottom-23,STAIRS.one.from-40,4);r(c,'#a58b54',STAIRS.one.from+40,PORT_DECK.bottom-23,W,4);
 // The stairway: each tread is a short plank, stepped sideways down each flight.
 for(const f of [STAIRS.one,STAIRS.two])for(let y=f.top;y<f.bottom;y+=7){const cx=f.from+(f.to-f.from)*(y-f.top)/(f.bottom-f.top);r(c,'#3e2e1d',cx-STAIRS.half-3,y,STAIRS.half*2+6,7);r(c,(y/7|0)%2?'#9c7c50':'#b7966a',cx-STAIRS.half,y,STAIRS.half*2,6);r(c,'#d4b98a',cx-STAIRS.half,y,STAIRS.half*2,1);}
 const L=STAIRS.landing;planks(c,L.left,L.top,L.right-L.left,L.bottom-L.top);
 // The lower boat dock, the Great Pier and the two jetties.
 planks(c,PORT_DOCK.left,PORT_DOCK.top,PORT_DOCK.right-PORT_DOCK.left,PORT_DOCK.bottom-PORT_DOCK.top);
 for(let x=PORT_DOCK.left;x<=PORT_DOCK.right;x+=80){post(c,x,PORT_DOCK.bottom+8);}
 for(const [a,b] of JETTIES){planks(c,a,PORT_DOCK.bottom,b-a,820-PORT_DOCK.bottom,true);post(c,a,824);post(c,b,824);}
 const [[ax,ay],[bx,by]]=GREAT_PIER,len=Math.hypot(bx-ax,by-ay);
 c.save();c.translate(ax,ay);c.rotate(Math.atan2(by-ay,bx-ax));
 r(c,'#4e4935',-4,-31,len+8,62);for(let d=0;d<len;d+=12){r(c,(d/12|0)%2?'#9c7c50':'#ae8c5b',d,-28,10,56);r(c,'#c5a56d',d,-28,2,56);}
 for(let d=40;d<len;d+=90){r(c,'#3e2e1d',d,-34,7,6);r(c,'#3e2e1d',d,28,7,6);}
 c.restore();
 for(const [x,y] of [[1380,300],[1520,360],[1590,250],[1180,380]])barrel(c,x,y);
 for(const [x,y] of [[300,280],[560,330],[1700,300]])if(!drawProp(c,'net-rack',{x,y:y+30,w:96,h:110})){post(c,x-30,y);post(c,x+30,y);r(c,'#84613c',x-34,y-30,68,4);}
 for(const [x,y] of [[420,640],[1110,640],[980,300],[180,640]])if(!drawProp(c,'rope-coils',{x,y:y+10,w:38,h:26})){c.strokeStyle='#d5bd83';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.ellipse(x,y,9+i*4,4+i*2,0,0,Math.PI*2);c.stroke();}}
 for(const [x,y] of [[1300,380],[1480,384]])if(!drawProp(c,'apple-crate',{x,y:y+10,w:34,h:28}))r(c,'#8a6640',x-14,y-12,28,20);
 // Rocks off the east end of the dock.
 for(const [x,y,s] of [[1660,640,16],[1720,700,12],[1580,880,10],[1740,830,14]]){ellipse(c,x,y,s,s*.6,'#6c6a64');ellipse(c,x-3,y-3,s*.6,s*.35,'#8e8b82');}
}
// 12.3 The Merchant Quarter: Lantern Square's paving, lantern strings, garden plots and the Willowback Gate.
function market(c,t=0){
 const {x:cx,y:cy,rx,ry}=LANTERN_SQUARE;
 r(c,'#b9ae78',cx-rx-8,cy-ry-8,(rx+8)*2,(ry+8)*2);
 for(let y=cy-ry;y<cy+ry;y+=14)for(let x=cx-rx;x<cx+rx;x+=22){const o=y%28?8:0;r(c,(x+y)%3?'#bfb58a':'#a9a17b',x+o,y,20,12);r(c,'#d4c79c',x+o,y,19,2);}
 const corners=[[cx-rx+12,cy-ry+18],[cx+rx-12,cy-ry+18],[cx-rx+12,cy+ry-8],[cx+rx-12,cy+ry-8]];
 for(const [x,y] of corners)lantern(c,x,y);
 c.strokeStyle='#3e392a';c.lineWidth=1;for(const [[x1,y1],[x2,y2]] of [[corners[0],corners[3]],[corners[1],corners[2]]]){c.beginPath();c.moveTo(x1,y1-36);c.quadraticCurveTo((x1+x2)/2,(y1+y2)/2-10,x2,y2-36);c.stroke();for(let i=1;i<8;i++){const k=i/8;r(c,i%2?'#f2c45a':'#e8955a',x1+(x2-x1)*k-2,y1-36+(y2-y1)*k+Math.sin(k*Math.PI)*8-10,5,6);}}
 for(const [x,y] of [[120,170],[545,170],[860,170]]){plot(c,x,y,150,64,(x/7|0)%3);fence(c,x,y,150);}
 for(const [x,y] of [[150,1160],[545,1180],[1130,1170],[1340,1170]]){plot(c,x,y,150,64,(x/9|0)%3);fence(c,x,y,150);}
 for(const [x,y] of [[700,480],[860,480],[700,690],[860,690]])barrel(c,x,y);
 for(const [x,y] of [[650,590],[900,600]])bench(c,x,y);
 washing(c,60,700,110,2);washing(c,1300,980,120,5);
 for(const [x,y] of [[1110,410],[1500,370]])firewood(c,x,y);
 // The Willowback Gate: two heavy posts, a crossbeam and the village sign, across the street at the east end.
 const {x,y}=WILLOWBACK_GATE;
 // A palisade runs north and south from the gate posts, so the street is the way out.
 for(let yy=40;yy<y-80;yy+=22)post(c,x,yy);for(let yy=y+92;yy<1390;yy+=22)post(c,x,yy);
 for(const dy of [-75,75]){r(c,'#4a331f',x-9,y+dy-92,18,104);r(c,'#6f5134',x-9,y+dy-92,5,104);r(c,'#5b3e2a',x-13,y+dy-96,26,8);lantern(c,x+22,y+dy+4);}
 r(c,'#6f5134',x-62,y-200,124,26);r(c,'#b19058',x-58,y-197,116,20);c.font='bold 11px monospace';c.textAlign='center';c.fillStyle='#3c2c1c';c.fillText('WILLOWBACK',x,y-183);
 // The cart with a lost wheel, across the Stonefall lane.
 r(c,'#6f5134',820,1320,90,30);r(c,'#8a6640',820,1320,90,6);ellipse(c,830,1356,14,14,'#4a331f');ellipse(c,830,1356,6,6,'#8a6640');ellipse(c,930,1370,13,6,'#4a331f');
}
// 12.4 Farm & Training Grounds: fields, scarecrow, hay, the coop yard, the pen and its sheep, the mill wheel and landing.
// The training yard is drawn each frame by drawTrainingGround, on top of this.
function farm(c){
 const N=BARLEY_NORTH,S=BARLEY_SOUTH,V=VEGETABLE_FIELDS;
 strips(c,N.x,N.y,N.w,N.h);fence(c,N.x,N.y+N.h+14,N.w);
 strips(c,S.x,S.y,S.w,S.h);fence(c,S.x,S.y-6,S.w);
 for(const [x,y] of [[250,1900],[420,1980],[180,2080],[500,2100]])hay(c,x,y);
 plot(c,V.x,V.y,V.w,V.h,1);fence(c,V.x,V.y,V.w);scarecrow(c,350,1480);scarecrow(c,330,700);
 for(const [x,y] of [[620,1310],[620,1640]])barrel(c,x,y);
 // The pen: split rails all round, and the sheep inside.
 const {x:px,y:py,w:pw,h:ph}=SHEEP_PEN;fence(c,px,py,pw);fence(c,px,py+ph,pw);for(let yy=py;yy<=py+ph;yy+=24){post(c,px,yy);post(c,px+pw,yy);}
 for(const [x,y,f] of [[700,1880,1],[760,1910,-1],[810,1960,1],[690,2000,-1],[780,2050,1],[730,2090,1]])sheep(c,x,y,f);
 // Chickens scratching round the coop.
 for(const [x,y] of [[170,1040],[200,1060],[260,1050],[290,1030]]){ellipse(c,x,y,6,5,'#f3efe2');r(c,'#d5432f',x+3,y-7,3,3);r(c,'#e5a83a',x+6,y-3,3,2);}
 for(const [x,y] of [[1300,760],[1330,780],[1060,880]])hay(c,x,y);
 for(const [x,y] of [[860,640],[1560,720],[1750,700]])barrel(c,x,y);
 for(const [x,y] of [[1560,600],[1740,600]])lantern(c,x,y);
 plot(c,1530,740,120,70,2);fence(c,1530,740,120);
 // The mill wheel, half in the river beside the mill.
 const wx=MILL_WHEEL.x,wy=Math.round(farmShore(MILL_WHEEL.x))+8;ellipse(c,wx+6,wy+44,30,6,'#123d5344');c.save();c.translate(wx,wy);
 for(let i=0;i<12;i++){c.rotate(Math.PI/6);r(c,'#6f5134',-2,-44,4,44);r(c,'#8a6640',-7,-46,14,6);}
 c.restore();ellipse(c,wx,wy,9,9,'#4a331f');c.strokeStyle='#5c4128';c.lineWidth=4;c.beginPath();c.arc(wx,wy,40,0,Math.PI*2);c.stroke();
 r(c,'#6f5134',730,wy-6,wx-730,8);
 const M=MILL_LANDING;planks(c,M.left,M.top,M.right-M.left,M.bottom-M.top,true);post(c,M.left,M.top+8);post(c,M.right,M.top+8);
 // The hedge along the south edge.
 for(let x=0;x<2000;x+=26)if(x<870||x>1980){ellipse(c,x+13,2232,18,14,'#3f6a2c');ellipse(c,x+9,2226,10,8,'#5a8a3a');}
}
export function drawDistrictGround(c,id){if(id==='village-port')port(c);else if(id==='village-market')market(c);else if(id==='village-farm')farm(c);}
