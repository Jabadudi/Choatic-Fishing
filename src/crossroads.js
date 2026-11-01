// The atlas fork between Windchime Path, Willowbank and Shellback Marsh.
import {drawProp} from './sprites.js';
// Both sides of the atlas fork now connect to playable areas.
export const CROSSROADS={id:'crossroads',name:'Willowbank Crossroads',width:1600,height:1280,seed:7327,spawn:{x:800,y:1130},exits:[{edge:'south',from:680,to:920,target:'windchime',entry:{x:1150,y:80},label:'Windchime Path'},{edge:'west',from:410,to:510,target:'village-farm',entry:{x:1930,y:830},label:'Willowback'},{edge:'east',from:610,to:710,target:'marsh',entry:{x:140,y:760},label:'Shellback Marsh'}]};
export const CROSSROADS_ROADS=[
 [[800,1280],[800,1080],[760,870],[800,680]],
 [[800,680],[610,630],[400,490],[170,460],[0,460]],
 [[800,680],[1030,630],[1220,660],[1450,660],[1600,660]],
 [[610,630],[670,700],[665,800],[580,810]],
 [[1220,660],[1220,850],[1360,930]]
];
export const CROSSROADS_PLACES=[
 {id:'crossroads-sign',name:'The Fork',x:800,y:590,kind:'waypost',text:'The weathered arrows point west to Willowback, past its farms, and east to Shellback Marsh. South, the chimes lead back to Reedwater Landing. Follow the western trail into the village. The eastern boardwalk leads into Shellback Marsh.'},
 {id:'village-approach',name:'Willowback Approach',x:230,y:460,kind:'village-marker',text:'Cart tracks bend west toward Willowback. Apple baskets and a low stone wall mark the village approach. Follow the cart tracks west, past the farms and the training yard, to the Willowback Gate.'},
 {id:'marsh-approach',name:'Shellback Crossing',x:1410,y:660,kind:'marsh-marker',text:'The dry trail gives way to a timber boardwalk. Beyond the lantern posts lie Shellback Marsh and its many waterways. Follow the eastern boardwalk through the map edge to explore the wetlands.'},
 {id:'travellers-rest',name:"Travellers’ Rest",x:580,y:760,kind:'rest',text:'A bench beneath the trees, a cold campfire and a little shelter for the rain. Someone has left a coil of fishing line beside the seat.'},
 {id:'reed-pool',name:'Reedside Pool',x:1350,y:930,kind:'pool-marker',text:'Reeds whisper around a quiet pool fed by the marsh. Fish gather beside the bank. It is a good place to cast before choosing a road.'},
 {id:'crossroads-chimes',name:'The Last Chimes',x:850,y:1060,kind:'chimes',text:'The last of the wooden chimes hangs where Windchime Path reaches the fork. From here, the land opens toward the village and the marsh.'}
];
export function crossroadsWaterDistance(x,y){return Math.min((Math.hypot((x-1570)/190,(y-1020)/270)-1)*190,x<1450?Infinity:Math.abs(y-655)-58);}
export const onCrossroadsDeck=(x,y)=>x>=1370&&x<=1600&&y>=627&&y<=693;
export function crossroadsBlocked(x,y){
 // Open trail corridors at both destination edges; posts and bench remain solid.
 return (x<130&&(y<410||y>510))||(x>1490&&y<765&&(y<610||y>710))||
  (x>779&&x<821&&y>574&&y<615)||
  (x>522&&x<638&&y>738&&y<776);
}
const rect=(c,color,x,y,w,h)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);};
function shadow(c,x,y,rx,ry){c.fillStyle='#182d2c45';c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function arrow(c,x,y,text,left,color){
 c.fillStyle='#352b21';c.beginPath();c.moveTo(x-112,y);c.lineTo(x+112,y);c.lineTo(x+(left?112:126),y+12);c.lineTo(x+112,y+25);c.lineTo(x-112,y+25);c.lineTo(x-(left?126:112),y+12);c.closePath();c.fill();
 rect(c,color,x-109,y+2,218,20);rect(c,'#ead2a0',x-108,y+2,216,2);
 c.font='bold 12px monospace';c.textAlign='center';c.fillStyle='#352b21';c.fillText((left?'← ':'')+text+(left?'':' →'),x,y+16);
 rect(c,'#4a3928',x-98,y+9,3,3);rect(c,'#4a3928',x+96,y+9,3,3);
}
function post(c,x,y){rect(c,'#62462e',x-4,y-36,8,44);rect(c,'#a2804e',x-4,y-37,8,3);}
function rope(c,x1,y1,x2,y2){post(c,x1,y1);post(c,x2,y2);c.strokeStyle='#d3bd83';c.lineWidth=3;c.beginPath();c.moveTo(x1,y1-24);c.quadraticCurveTo((x1+x2)/2,(y1+y2)/2-8,x2,y2-24);c.stroke();}
function lantern(c,x,y,t){
 const g=c.createRadialGradient(x,y,1,x,y,38);g.addColorStop(0,'rgba(255,214,133,.32)');g.addColorStop(1,'rgba(255,214,133,0)');c.fillStyle=g;c.fillRect(x-38,y-38,76,76);
 rect(c,'#443a2b',x-7,y-12,14,4);rect(c,'#dfbc70',x-5,y-8,10,14);rect(c,'#ffde91',x-3,y-6,4,9);rect(c,'#443a2b',x-7,y+6,14,3);
}
export function drawCrossroads(c,t=0){
 // West: a modest field wall, baskets and an open village road.
 for(let x=145;x<425;x+=24)for(const y of [398,410]){rect(c,'#667164',x+(y===398?7:0),y,22,12);rect(c,'#a5ab8b',x+(y===398?7:0),y,22,3);if(x%3===1)rect(c,'#678747',x+8,y-2,12,4);}
 // The former western rope is removed so the village road is open.
 post(c,136,412);post(c,136,512);
 for(const [x,y] of [[281,422],[307,430]])if(!drawProp(c,'apple-crate',{x,y:y+13,w:32,h:30})){shadow(c,x,y+9,16,5);rect(c,'#765334',x-12,y-8,25,20);rect(c,'#b38a4c',x-12,y-8,25,4);for(let k=0;k<4;k++){rect(c,'#b16442',x-9+k*6,y-13,5,7);rect(c,'#9ca64e',x-7+k*6,y-15,2,3);}}
 // East: the boardwalk continues through the map edge into Shellback Marsh.
 rect(c,'#3d4940',1368,622,233,76);
 for(let x=1370,i=0;x<1600;x+=10,i++){rect(c,i%2?'#96764e':'#ab895b',x,628,8,64);rect(c,'#d1b583',x,629,2,62);}
 for(const x of [1374,1436,1504,1580]){post(c,x,622);post(c,x,700);}

 // Rest stop: small shingled shelter, a bench and an old stone hearth.
 if(!(drawProp(c,'rest-shelter',{x:584,y:764,w:156,h:126})&&drawProp(c,'bench-backrest',{x:580,y:774,w:110,h:62}))){
  shadow(c,580,765,64,12);
  for(const x of [528,630]){rect(c,'#63482f',x,688,6,72);rect(c,'#ac8554',x,688,2,72);}
  rect(c,'#564631',515,676,136,16);
  for(let row=0;row<4;row++)for(let col=0;col<9;col++)rect(c,(row+col)%2?'#8c6b45':'#a07d4f',514+col*15+row*3,652+row*8,15,8);
  rect(c,'#d1ae70',514,682,148,4);
  rect(c,'#62472f',536,747,5,24);rect(c,'#62472f',617,747,5,24);rect(c,'#a7814c',527,741,106,10);rect(c,'#c5a16b',527,741,106,2);rect(c,'#89643c',529,716,103,15);rect(c,'#c19b60',529,716,103,3);
  c.strokeStyle='#c4c6a0';c.lineWidth=1.5;c.beginPath();c.ellipse(614,737,7,3,0,0,Math.PI*2);c.stroke();
 }
 if(!drawProp(c,'fire-ring-cold',{x:675,y:814,w:58,h:40})){
  shadow(c,675,800,30,9);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;rect(c,i%2?'#889181':'#b0b298',675+Math.cos(a)*22-5,800+Math.sin(a)*10-4,10,8);}
  rect(c,'#4d4234',661,796,28,6);rect(c,'#77513a',665,794,22,3);
 }
 // The central waypost is deliberately readable without opening a menu.
 shadow(c,807,612,37,8);rect(c,'#59432f',794,475,12,138);rect(c,'#a17c47',794,475,4,138);rect(c,'#d0b176',791,470,18,7);
 arrow(c,787,493,'WILLOWBACK',true,'#d1b780');arrow(c,813,527,'SHELLBACK MARSH',false,'#a6b395');
 rect(c,'#8f7651',754,568,92,20);c.font='10px monospace';c.textAlign='center';c.fillStyle='#f3dfb4';c.fillText('↓ WINDCHIME',800,582);
 lantern(c,832,599,t);
 // Quiet pool: low fishing seat and leaning rod on the safe bank.
 if(!drawProp(c,'fishing-seat',{x:1362,y:958,w:96,h:96})){
  rect(c,'#654c33',1327,923,5,25);rect(c,'#654c33',1351,923,5,25);rect(c,'#b08d58',1324,918,36,8);
  c.strokeStyle='#cab885';c.lineWidth=2;c.beginPath();c.moveTo(1364,934);c.lineTo(1415,881);c.stroke();c.strokeStyle='#e5dcba88';c.lineWidth=1;c.beginPath();c.moveTo(1415,881);c.quadraticCurveTo(1434,915,1457,940);c.stroke();
 }
}
export function drawCrossroadsLabels(c){
 c.font='10px monospace';c.textAlign='center';
 for(const [x,y,label] of [[240,370,'← Willowback Village'],[1390,580,'Shellback Marsh →']]){c.fillStyle='#203d36dd';c.fillRect(x-93,y-14,186,24);c.fillStyle='#f0dfb9';c.fillText(label,x,y+1);}
}
