import {VILLAGE_BUILDINGS,VILLAGE_PROPS} from './village.js';
import {drawProp} from './sprites.js';
import {SHEEP_PEN,millStream} from './village-districts.js';
const r=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function post(c,x,y){r(c,'#53442e',x-4,y-30,8,40);r(c,'#ba9960',x-3,y-30,3,38);r(c,'#dcc18b',x-5,y-32,10,3);}
function fence(c,x,y,length){for(let dx=0;dx<=length;dx+=24)post(c,x+dx,y);r(c,'#a58b54',x,y-19,length,4);r(c,'#79633e',x,y-8,length,4);}
function barrel(c,x,y){if(drawProp(c,'barrel',{x,y:y+11,w:26,h:36}))return;ellipse(c,x,y+9,13,5,'#243a3340');r(c,'#735332',x-11,y-12,22,22);r(c,'#ae8851',x-8,y-12,7,21);r(c,'#424e43',x-12,y-8,24,3);r(c,'#424e43',x-12,y+4,24,3);ellipse(c,x,y-12,11,4,'#baa174');ellipse(c,x,y-12,8,2,'#665336');}
function lantern(c,x,y){if(drawProp(c,'lantern-post',{x:x+4,y:y+10,w:34,h:56}))return;post(c,x,y);r(c,'#3e392a',x-7,y-38,14,3);r(c,'#edc87e',x-5,y-35,10,15);r(c,'#fff0b1',x-3,y-33,3,10);r(c,'#3e392a',x-7,y-21,14,3);}
function boat(c,x,y,flip=1){if(drawProp(c,'rowing-boat',{x,y:y+18,w:88,h:58,flipX:flip<0}))return;c.save();c.translate(x,y);c.scale(flip,1);ellipse(c,4,6,39,12,'#123d5355');c.fillStyle='#60462f';c.beginPath();c.moveTo(-39,-9);c.lineTo(20,-12);c.lineTo(43,0);c.lineTo(20,12);c.lineTo(-39,9);c.closePath();c.fill();r(c,'#ab8050',-33,-7,53,14);r(c,'#5c442e',-17,-8,4,16);r(c,'#5c442e',8,-8,4,16);r(c,'#d2ac74',-33,-8,55,2);r(c,'#d7c08b',-5,-21,3,43);r(c,'#b88c56',-8,14,9,12);c.restore();}
export function drawVillageGround(c){
 // Worn stone commons, shared paths and a broad waterside jetty.
 ellipse(c,1000,755,185,123,'#b9ae78');
 for(let y=645;y<870;y+=14)for(let x=825;x<1180;x+=22){if(((x-1000)/175)**2+((y-755)/112)**2>1)continue;r(c,(x+y)%3?'#bfb58a':'#a9a17b',x+(y%28?8:0),y,20,12);r(c,'#d4c79c',x+(y%28?8:0),y,19,2);}
 r(c,'#4e4935',682,1058,96,305);r(c,'#4e4935',517,1247,426,77);
 for(let y=1062;y<1360;y+=11){r(c,y%22?'#9c7c50':'#ae8c5b',688,y,84,9);r(c,'#c5a56d',688,y,84,1);r(c,'#58452f',696,y+4,2,2);r(c,'#58452f',763,y+4,2,2);}
 for(let x=520;x<940;x+=12){r(c,x%24?'#9c7c50':'#ae8c5b',x,1253,10,64);r(c,'#c5a56d',x,1253,2,64);}
 for(const [x,y]of [[685,1080],[775,1080],[685,1220],[775,1220],[530,1260],[530,1320],[930,1260],[930,1320],[685,1352],[775,1352]])post(c,x,y);
 // Kitchen gardens: small crop beds with a clear central aisle and a gate.
 r(c,'#756342',1200,914,290,132);
 for(let row=0;row<5;row++)for(let col=0;col<11;col++){
  const x=1214+col*24,y=925+row*22;if(col>=5&&col<=6)continue;
  r(c,'#5a4a34',x-6,y+1,15,9);ellipse(c,x,y,7,4,row%2?'#78a44c':'#487849');r(c,row%2?'#c6be62':'#8bb362',x-4,y-5,5,6);if(row===2)r(c,'#d8974d',x-1,y,3,8);
 }
 fence(c,1200,914,288);fence(c,1200,1060,120);fence(c,1400,1060,96);
 for(const [x,y]of [[1498,1030],[1518,1045],[345,1050],[1610,810],[1610,780]])barrel(c,x,y);
 // Workyard net racks and rope coils.
 if(!drawProp(c,'net-rack',{x:1590,y:834,w:96,h:110})){
  for(const x of [1550,1630]){post(c,x,758);post(c,x,830);}r(c,'#84613c',1548,727,85,4);
  c.strokeStyle='#d1c898';c.lineWidth=1;
  for(let x=1554;x<1630;x+=9){c.beginPath();c.moveTo(x,733);c.lineTo(x-6,796);c.stroke();}
  for(let y=737;y<798;y+=8){c.beginPath();c.moveTo(1550,y);c.lineTo(1628,y+9);c.stroke();}
 }
 for(const [x,y]of [[1410,853],[1520,855],[480,1092]])if(!drawProp(c,'rope-coils',{x,y:y+10,w:38,h:26})){c.strokeStyle='#d5bd83';c.lineWidth=3;for(let i=0;i<3;i++){c.beginPath();c.ellipse(x,y,9+i*4,4+i*2,0,0,Math.PI*2);c.stroke();}}
 fence(c,1600,468,240);for(const x of [1715,1835])lantern(c,x,560);
 r(c,'#6f5134',1712,454,126,12);r(c,'#b19058',1725,468,100,21);c.font='bold 11px monospace';c.textAlign='center';c.fillStyle='#f2dfb2';c.fillText('WILLOWBACK',1775,483);
 for(const [x,y]of [[840,780],[1110,760],[610,590],[790,1040]])if(!drawProp(c,'plank-bench',{x,y:y+21,w:80,h:40})){r(c,'#594831',x-31,y,5,19);r(c,'#594831',x+26,y,5,19);r(c,'#b5945d',x-37,y-4,74,10);r(c,'#d3b77f',x-37,y-4,74,2);}
 boat(c,625,1210);boat(c,838,1370,-1);boat(c,980,1280);boat(c,415,1150,-1);
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
export function drawVillageObject(c,b,time=0){
 const {x,y}=b;
 if(b.kind==='watchtower'){watchtower(c,x,y);return;}
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
// Ground dressing for the Upper Lanes and Millside: everything here is flat, so it is painted once into the cached ground.
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
function upperLanes(c){
 paving(c,800,700,215,118);
 for(const [x,y] of [[300,598],[560,598],[1040,598],[1300,598],[560,938],[1040,938],[740,250],[860,250],[300,190],[1300,190]])lantern(c,x,y);
 for(const [x,y] of [[700,800],[900,800]])bench(c,x,y);
 plot(c,112,672,170,84,0);plot(c,320,672,160,84,1);plot(c,1110,672,170,84,2);plot(c,1320,672,160,84,0);
 fence(c,112,672,170);fence(c,320,672,160);fence(c,1110,672,170);fence(c,1320,672,160);
 washing(c,140,388,120,0);washing(c,330,388,120,2);washing(c,1130,388,120,4);washing(c,1330,388,120,1);
 for(const [x,y] of [[300,775],[1300,775],[1060,1150],[540,1150]])firewood(c,x,y);
 for(const [x,y] of [[715,360],[530,900],[1300,900],[1500,900],[1250,1120],[640,1120]])barrel(c,x,y);
}
function millside(c){
 strips(c,112,160,250,170);strips(c,440,160,520,170);fence(c,112,345,250);fence(c,440,345,520);
 for(const [x,y] of [[240,260],[700,250]])scarecrow(c,x,y);
 for(const [x,y] of [[860,580],[890,600],[700,460],[340,980],[372,996]])hay(c,x,y);
 for(const [x,y] of [[660,560],[840,450],[1300,560],[560,980]])barrel(c,x,y);
 // The pen: split rails all round, and the sheep inside.
 const {x:px,y:py,w:pw,h:ph}=SHEEP_PEN;fence(c,px,py,pw);fence(c,px,py+ph,pw);for(let yy=py;yy<=py+ph;yy+=24){post(c,px,yy);post(c,px+pw,yy);}
 for(const [x,y,f] of [[900,1030,1],[950,1060,-1],[1010,1025,1],[1050,1085,-1],[930,1100,1],[990,1110,1]])sheep(c,x,y,f);
 // The bridge over the mill stream.
 r(c,'#4e4935',1096,592,134,56);for(let x=1100;x<1228;x+=11){r(c,x%22?'#9c7c50':'#ae8c5b',x,596,9,48);r(c,'#c5a56d',x,596,9,1);}
 for(const yy of [594,646]){r(c,'#6f5134',1096,yy-8,134,5);for(const x of [1098,1162,1224])post(c,x,yy);}
 // The mill wheel, half in the water beside the mill.
 const wx=1118,wy=472;ellipse(c,wx+6,wy+44,30,6,'#123d5344');c.save();c.translate(wx,wy);
 for(let i=0;i<12;i++){c.rotate(Math.PI/6);r(c,'#6f5134',-2,-44,4,44);r(c,'#8a6640',-7,-46,14,6);}
 c.restore();ellipse(c,wx,wy,9,9,'#4a331f');c.strokeStyle='#5c4128';c.lineWidth=4;c.beginPath();c.arc(wx,wy,40,0,Math.PI*2);c.stroke();
 for(const [x,y] of [[1360,650],[1480,650]])lantern(c,x,y);
 plot(c,1300,700,100,80,1);fence(c,1300,700,100);
}
export function drawDistrictGround(c,id){if(id==='village-north')upperLanes(c);else if(id==='village-mill')millside(c);}
