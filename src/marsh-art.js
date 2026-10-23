import {MARSH_BOARDS,marshWaterDistance,onMarshDeck} from './marsh.js';
const r=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
const hash=(x,y)=>{let n=Math.imul(x+7357,374761393)^Math.imul(y,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
function oval(c,x,y,rx,ry,color){c.fillStyle=color;for(let row=-ry;row<=ry;row+=3){const width=Math.round(rx*Math.sqrt(Math.max(0,1-row*row/(ry*ry)))/3)*3;c.fillRect(Math.round(x-width),Math.round(y+row),width*2,3);}}
function post(c,x,y,light=false){r(c,'#4a4d37',x-4,y-24,8,32);r(c,'#9f9769',x-3,y-25,3,30);r(c,'#c0b582',x-5,y-27,10,4);if(light){r(c,'#353d30',x-7,y-44,14,3);r(c,'#d9c687',x-5,y-41,10,13);r(c,'#f4e2a4',x-3,y-39,3,8);}}
function crossing(c,a,b,width){
 const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);c.save();c.translate(a[0],a[1]);c.rotate(Math.atan2(dy,dx));
 r(c,'#283f35',-3,-width/2-4,length+6,width+8);
 for(let x=0;x<length;x+=11){r(c,Math.floor(x/11)%2?'#817c54':'#94885c',x,-width/2,9,width);r(c,'#b2a57a',x,-width/2,2,width);r(c,'#47543c',x+3,-width/2+5,4,2);r(c,'#47543c',x+3,width/2-7,4,2);if(Math.floor(x/11)%7===0)r(c,'#5c7750',x+2,-width/2+11,5,12);}
 c.restore();
 for(let d=20;d<length;d+=85){const t=d/length,nx=-dy/length*(width/2+3),ny=dx/length*(width/2+3),x=a[0]+dx*t,y=a[1]+dy*t;post(c,x+nx,y+ny,Math.floor(d/85)%4===0);post(c,x-nx,y-ny);}
}
function cattails(c,x,y,seed){
 for(let i=0;i<6;i++){const h=15+hash(seed,i)*25;const dx=i*4-11;r(c,i%2?'#728451':'#536b45',x+dx,y-h,2,h);r(c,'#9ca16a',x+dx-2,y-h+6,2,h-6);if(i%3===0){r(c,'#5e4c31',x+dx-1,y-h-8,4,11);r(c,'#a18a52',x+dx,y-h-8,1,8);}}
}
export function drawMarshGround(c,left,top,width,height){
 // Shoreline clumps leave plank edges readable; no renderer-driven randomness.
 for(let y=Math.floor((top-40)/32)*32;y<top+height+40;y+=32)for(let x=Math.floor((left-40)/32)*32;x<left+width+40;x+=32){
  const h=hash(x,y),px=x+h*21,py=y+hash(y,x)*20,d=marshWaterDistance(px,py);
  if(onMarshDeck(px,py))continue;
  if(d>-90&&d<65&&h>.27)cattails(c,px,py,x+y);
  else if(d>65&&h>.82){oval(c,px,py,12,5,'#526d45');r(c,'#a8b371',px-7,py-3,5,2);}
  else if(d<0&&d>-150&&h>.8){oval(c,px,py,8,4,'#486f43');r(c,'#819858',px-5,py-3,5,2);if(h>.94){r(c,'#d4c68c',px-1,py-5,4,4);}}
 }
 for(const board of MARSH_BOARDS)for(let i=1;i<board.points.length;i++)crossing(c,board.points[i-1],board.points[i],board.width);
 // Low moorings, a forgotten fish trap, and the ruin's worn stone apron.
 for(const [x,y]of [[1620,1365],[1680,1365],[330,1440],[410,1465]])post(c,x,y,true);
 for(let row=0;row<5;row++)for(let col=0;col<5;col++){const x=1007+col*22+(row%2?6:0),y=1530+row*18;r(c,(row+col)%2?'#8a9479':'#a4ab8b',x,y,20,16);r(c,'#bdbea0',x,y,20,2);if((col+row)%3===0)r(c,'#5f8050',x+2,y+11,9,3);}
 r(c,'#5e563b',1515,1110,30,18);r(c,'#ac9a69',1515,1110,30,3);for(let i=0;i<5;i++)r(c,'#99916a',1518+i*5,1113,1,13);
}
export function drawMarshObject(c,o,time=0){
 const {x,y,kind}=o;oval(c,x+10,y+6,o.radius+7,12,'#173b3540');
 if(kind==='cypress'){
  r(c,'#555440',x-9,y-75,18,83);r(c,'#8b8b60',x-7,y-73,5,80);r(c,'#66674a',x-17,y+2,11,10);r(c,'#66674a',x+7,y+1,15,10);
  for(const [dx,dy,rx,ry]of [[-20,-80,36,20],[22,-96,37,23],[0,-119,40,24],[-33,-111,26,19]]){oval(c,x+dx,y+dy,rx,ry,'#3d6550');oval(c,x+dx-5,y+dy-7,rx*.8,ry*.65,'#587b55');}
  for(let i=0;i<7;i++){const dx=i*10-30,h=19+(i%3)*10;r(c,'#8e9c6a',x+dx,y-82,2,h);r(c,'#687f56',x+dx+2,y-77,2,h-3);}return;
 }
 if(kind==='shell'){
  oval(c,x+5,y,76,39,'#465c48');oval(c,x,y-13,75,44,'#6e8361');oval(c,x-6,y-26,61,34,'#94a076');oval(c,x-12,y-37,42,19,'#acb18a');
  c.strokeStyle='#586c50';c.lineWidth=4;for(const dx of [-36,0,36]){c.beginPath();c.moveTo(x+dx*.5,y-56);c.quadraticCurveTo(x+dx*1.2,y-28,x+dx*1.7,y+16);c.stroke();}
  c.beginPath();c.ellipse(x,y-13,64,29,0,0,Math.PI);c.stroke();r(c,'#304637',x-13,y+2,26,15);oval(c,x-55,y+12,20,7,'#718950');r(c,'#d2bd88',x-55,y+3,4,5);return;
 }
 if(kind==='tower'){
  for(const dx of [-31,25]){r(c,'#414c38',x+dx,y-144,7,151);r(c,'#a59a69',x+dx,y-140,2,140);}
  for(let i=0;i<5;i++)r(c,'#9c8d5e',x-36,y-26-i*12,72,6);
  r(c,'#4f5138',x-50,y-103,100,12);for(let i=0;i<10;i++)r(c,i%2?'#7e8056':'#979366',x-50+i*10,y-99,8,8);
  for(const dx of [-44,38])r(c,'#566349',x+dx,y-155,6,58);r(c,'#6c7950',x-53,y-164,106,13);r(c,'#a6a473',x-53,y-164,106,3);
  r(c,'#a9a777',x-6,y-152,12,23);r(c,'#d6c995',x-10,y-132,20,4);r(c,'#384d39',x-42,y-122,84,4);return;
 }
 if(kind==='ruin'){
  for(const dx of [-44,28])for(let row=0;row<6;row++){r(c,row%2?'#7b8b7a':'#939d83',x+dx,y-row*15,20,14);r(c,'#bac1a1',x+dx,y-row*15,20,2);}
  for(let col=0;col<5;col++){const rise=Math.abs(col-2)*8;r(c,'#82907b',x-48+col*20,y-104+rise,19,18);r(c,'#b1b89a',x-48+col*20,y-104+rise,19,3);}
  r(c,'#5d7a52',x-49,y-21,24,10);r(c,'#6f8b58',x+24,y-68,27,8);r(c,'#c3b99b',x-68,y+8,23,12);return;
 }
 if(kind==='shelter'){
  for(const dx of [-37,32]){r(c,'#545139',x+dx,y-75,6,82);r(c,'#aaa06d',x+dx,y-74,2,78);}r(c,'#6e704c',x-47,y-89,94,19);
  for(let i=0;i<8;i++)r(c,i%2?'#a0a16b':'#818957',x-48+i*12,y-95,12,28);r(c,'#c0b77e',x-52,y-69,104,4);
  r(c,'#9c8959',x-31,y-9,62,10);r(c,'#5c5639',x-24,y,5,13);r(c,'#5c5639',x+20,y,5,13);
 }
}
