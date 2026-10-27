import {drawProp} from './sprites.js';
// Stand-in pixel art for the Portable Radio, drawn one game pixel at a time.
// The painted icon, world sprite and front view replace these once they are cut into assets/.
const P={o:'#1a1410',b:'#8a3b2e',bl:'#b5513d',bd:'#5e2820',s:'#2b2b33',sl:'#4b4b58',c:'#c9c2b0',cd:'#8d8676',m:'#1b1b1f',g:'#132a14',gl:'#3d7a34',k:'#e6c77f',h:'#a7a9ad',n:'#f3f0e0'};
const px=(c,color,x,y,w=1,h=1)=>{c.fillStyle=P[color];c.fillRect(x,y,w,h);};
function disc(c,cx,cy,r,color){for(let y=-r;y<=r;y++){const half=Math.floor(Math.sqrt(r*r+r*.6-y*y));px(c,color,cx-half,cy+y,half*2+1,1);}}
// The large front view for the radio sheet, 96 by 48 pixels. The screen at (35,21) 26x8 is left plain for the song title.
export const FRONT_SIZE={width:96,height:48,screen:{x:35,y:21,w:26,h:8}};
export function drawRadioFront(c){
 px(c,'o',22,1,52,3);px(c,'h',23,2,50,1);px(c,'o',20,1,3,10);px(c,'o',73,1,3,10);px(c,'h',21,4,1,7);px(c,'h',74,4,1,7);
 px(c,'o',80,0,1,10);px(c,'h',81,1,1,8);
 px(c,'o',2,9,92,38);px(c,'b',3,10,90,36);px(c,'bl',3,10,90,2);px(c,'bd',3,43,90,3);px(c,'c',5,12,6,3);px(c,'cd',5,14,6,1);
 for(const cx of [18,78]){
  disc(c,cx,28,14,'o');disc(c,cx,28,13,'s');disc(c,cx,28,10,'sl');disc(c,cx,28,9,'s');disc(c,cx,28,4,'o');disc(c,cx,28,3,'m');px(c,'sl',cx-2,26);
  for(let y=17;y<40;y+=3)for(let x=cx-11;x<=cx+11;x+=3){const d=(x-cx)**2+(y-28)**2;if(d<80&&d>25)px(c,'m',x,y);}
 }
 px(c,'o',33,13,30,31);px(c,'c',34,14,28,29);px(c,'cd',34,41,28,2);
 px(c,'o',34,20,28,10);px(c,'g',35,21,26,8);
 px(c,'o',36,16,24,2);px(c,'cd',37,16,22,1);
 for(let i=0;i<5;i++){px(c,'o',35+i*5,33,4,4);px(c,'k',36+i*5,34,2,2);}
 for(let i=0;i<7;i++)px(c,'o',38+i*3,38,1,2);
 px(c,'o',8,46,10,2);px(c,'o',78,46,10,2);
}
// The small radio, 24 by 18 pixels: the HUD button, mini player and the radio set down beside Eli.
// Frames 1 and 3 push the speakers out for the "playing" thump.
export function drawRadioSmall(c,frame=0){
 const thump=frame%2===1,top=thump?5:4;
 px(c,'o',5,top-4,14,2);px(c,'o',4,top-4,2,5);px(c,'o',18,top-4,2,5);px(c,'o',21,top-4,1,4);
 px(c,'o',0,top,24,18-top);px(c,'b',1,top+1,22,16-top);px(c,'bl',1,top+1,22,1);
 for(const cx of [6,17]){disc(c,cx,11,thump?4:3,'o');disc(c,cx,11,thump?3:2,'s');px(c,'m',cx,11);}
 px(c,'o',10,top+2,4,3);px(c,'gl',11,top+3,2,1);
 if(frame===3){px(c,'n',2,0);px(c,'n',2,1);px(c,'n',1,2,2,1);px(c,'n',21,1);px(c,'n',21,2);px(c,'n',20,3,2,1);}
}
export function paintRadioCanvas(canvas,draw,frame){const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);draw(c,frame);}
// While Eli fishes with the radio playing, he sets it down on the bank beside him and it thumps along.
// Purely a picture: it has no collision and is placed from the player's position each frame.
export function radioBesideEli(world){
 const p=world.player;if(!world.radioPlaying||!world.adventure||world.defeat||!world.fishing||world.fishing.state==='idle'||p.health<=0)return null;
 return {radio:true,x:p.x+(Math.cos(p.angle||0)>0?-26:26),y:p.y+6};
}
export function drawRadioBeside(c,ref,t){
 const frame=Math.floor(t*5)%4;
 if(drawProp(c,`portable-radio-${frame+1}`,{x:ref.x,y:ref.y+9,w:28,h:24}))return;
 c.save();c.fillStyle='#1a14104d';c.beginPath();c.ellipse(ref.x,ref.y+9,13,3.5,0,0,Math.PI*2);c.fill();
 c.translate(Math.round(ref.x-12),Math.round(ref.y-9));drawRadioSmall(c,frame);c.restore();
}
