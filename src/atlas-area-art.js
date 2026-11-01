// Art for the atlas-built areas (atlas-area.js): boardwalks, fords, stone bridges and props. Drawing only.
const each=(pts,step,fn)=>{for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i],len=Math.hypot(bx-ax,by-ay),n=Math.max(1,Math.floor(len/step));for(let j=0;j<n;j++){const t=j/n;fn(ax+(bx-ax)*t,ay+(by-ay)*t,Math.atan2(by-ay,bx-ax),j);}}};
function stroke(ctx,pts,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
const near=(pts,half,left,top,width,height)=>pts.some(([x,y])=>x>left-400&&x<left+width+400&&y>top-400&&y<top+height+400);
export function drawAtlasGround(ctx,built,left,top,width,height){
 for(const b of built.bridges){if(!near(b.pts,b.half,left,top,width,height))continue;const w=b.half*2;
  stroke(ctx,b.pts,w+10,'#3d3a36');stroke(ctx,b.pts,w+4,'#8d877a');stroke(ctx,b.pts,w-6,'#b9b19c');
  each(b.pts,14,(x,y,a)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#a39a84';ctx.fillRect(-1,-b.half+5,2,w-10);ctx.restore();});
 }
 for(const b of built.walks){if(!near(b.pts,b.half,left,top,width,height))continue;const w=b.half*2;
  // Posts under the deck, then the planks laid across the line.
  each(b.pts,46,(x,y,a)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle='#3e2b1c';ctx.fillRect(-4,-b.half-5,8,8);ctx.fillRect(-4,b.half-3,8,8);ctx.restore();});
  stroke(ctx,b.pts,w+4,'#4f3a26');stroke(ctx,b.pts,w-2,'#a8875c');
  each(b.pts,9,(x,y,a,j)=>{ctx.save();ctx.translate(x,y);ctx.rotate(a);ctx.fillStyle=j%2?'#9a7a52':'#b39066';ctx.fillRect(-3,-b.half+2,7,w-4);ctx.fillStyle='#6b5034';ctx.fillRect(3,-b.half+2,1,w-4);ctx.restore();});
 }
 for(const b of built.fords){if(!near(b.pts,b.half,left,top,width,height))continue;
  stroke(ctx,b.pts,b.half*2+8,'rgba(150,215,205,.55)');
  each(b.pts,26,(x,y,a,j)=>{const o=(j%2?1:-1)*b.half*.25,dx=-Math.sin(a)*o,dy=Math.cos(a)*o;ctx.fillStyle='#55605a';ctx.beginPath();ctx.ellipse(x+dx+1,y+dy+3,13,9,a,0,Math.PI*2);ctx.fill();ctx.fillStyle=j%3?'#a7a594':'#b8b5a2';ctx.beginPath();ctx.ellipse(x+dx,y+dy,12,8,a,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d2cfbb';ctx.fillRect(Math.round(x+dx-5),Math.round(y+dy-5),6,2);});
 }
 for(const r of built.roads){if(!near(r,0,left,top,width,height))continue;}
}
const R=(ctx,c,x,y,w,h)=>{ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
function shadow(ctx,x,y,rx,ry){ctx.fillStyle='rgba(20,40,40,.28)';ctx.beginPath();ctx.ellipse(x+4,y+4,rx,ry,0,0,Math.PI*2);ctx.fill();}
function roof(ctx,x,y,w,h,c,d){ctx.fillStyle=d;ctx.beginPath();ctx.moveTo(x-w/2-6,y);ctx.lineTo(x,y-h);ctx.lineTo(x+w/2+6,y);ctx.closePath();ctx.fill();ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x-w/2-2,y-2);ctx.lineTo(x,y-h+2);ctx.lineTo(x+w/2+2,y-2);ctx.closePath();ctx.fill();}
export function drawAtlasProp(ctx,p,t=0){
 const x=Math.round(p.x),y=Math.round(p.y),s=p.scale||1;
 switch(p.kind){
  case 'hut':shadow(ctx,x,y,52,14);R(ctx,'#6a4a2e',x-42,y-48,84,48);R(ctx,'#8a6440',x-40,y-46,80,4);for(let i=0;i<5;i++)R(ctx,'#5a3e26',x-40,y-38+i*8,80,1);R(ctx,'#2d2018',x-9,y-28,18,28);roof(ctx,x,y-46,84,34,p.roof||'#8f5a3c','#5a3524');break;
  case 'stilt-hut':for(const dx of [-30,-10,10,30])R(ctx,'#3e2b1c',x+dx-3,y-20,6,34);R(ctx,'#7a5a3a',x-40,y-26,80,8);R(ctx,'#6a4a2e',x-32,y-66,64,40);R(ctx,'#2d2018',x-7,y-50,14,24);roof(ctx,x,y-64,64,30,p.roof||'#a0703c','#634126');break;
  case 'tower':shadow(ctx,x,y,60,16);R(ctx,'#6f6a60',x-44,y-150,88,150);R(ctx,'#8e887a',x-40,y-146,80,146);for(let i=0;i<8;i++)for(let j=0;j<4;j++)R(ctx,'#7a7468',x-40+j*20+(i%2)*10,y-146+i*18,18,1);R(ctx,'#2a2824',x-10,y-34,20,34);R(ctx,'#2a2824',x-6,y-110,12,16);
   // A broken crown: uneven merlons.
   for(const [dx,h] of [[-40,12],[-18,22],[6,8],[28,16]])R(ctx,'#8e887a',x+dx,y-150-h,14,h);R(ctx,'#5f8a4a',x-40,y-60,10,24);R(ctx,'#6d9a3a',x+28,y-96,12,18);break;
  case 'ruin':shadow(ctx,x,y,48,12);for(const [dx,h] of [[-44,58],[-22,30],[0,72],[22,26],[40,44]])R(ctx,'#8e887a',x+dx,y-h,18,h),R(ctx,'#a49e8e',x+dx,y-h,18,3);R(ctx,'#5f8a4a',x-30,y-14,16,10);break;
  case 'arch':for(const dx of [-46,30]){R(ctx,'#7d776b',x+dx,y-96,16,96);R(ctx,'#a39d8d',x+dx,y-96,16,3);}ctx.strokeStyle='#8e887a';ctx.lineWidth=14;ctx.beginPath();ctx.arc(x-8,y-90,38,Math.PI,0);ctx.stroke();break;
  case 'pillar':shadow(ctx,x,y,14,5);R(ctx,'#7d776b',x-10,y-70*s,20,70*s);R(ctx,'#a39d8d',x-10,y-70*s,20,3);R(ctx,'#5f8a4a',x-10,y-24,8,10);break;
  case 'stone':shadow(ctx,x,y,16,6);R(ctx,'#6f6c64',x-12,y-46,24,46);R(ctx,'#94907f',x-12,y-46,10,46);R(ctx,'#7fc2b0',x-3,y-34,6,2);break;
  case 'cairn':for(let i=0;i<4;i++)R(ctx,i%2?'#9a968a':'#7d7a70',x-14+i*3,y-10-i*10,28-i*6,10);break;
  case 'boat':ctx.save();ctx.translate(x,y);ctx.rotate(p.angle||0);ctx.fillStyle='#4a3220';ctx.beginPath();ctx.ellipse(0,0,44,15,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#8a6038';ctx.beginPath();ctx.ellipse(0,-2,38,10,0,0,Math.PI*2);ctx.fill();R(ctx,'#5c3b22',-2,-11,4,18);ctx.restore();break;
  case 'raft':for(let i=0;i<5;i++)R(ctx,i%2?'#8a6440':'#9c7450',x-30+i*12,y-20,11,40);break;
  case 'wheel':ctx.strokeStyle='#5a3e26';ctx.lineWidth=7;ctx.beginPath();ctx.arc(x,y-40,36,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4+(p.still?0:t*.6);ctx.beginPath();ctx.moveTo(x,y-40);ctx.lineTo(x+Math.cos(a)*36,y-40+Math.sin(a)*36);ctx.stroke();}break;
  case 'cave':ctx.fillStyle='#4f4a42';ctx.beginPath();ctx.ellipse(x,y-30,86,58,0,Math.PI,0);ctx.fill();ctx.fillStyle='#14110e';ctx.beginPath();ctx.ellipse(x,y-6,44,40,0,Math.PI,0);ctx.fill();R(ctx,'#6f6a60',x-86,y-34,22,34);R(ctx,'#6f6a60',x+64,y-30,22,30);break;
  case 'tent':shadow(ctx,x,y,40,10);ctx.fillStyle='#a8875c';ctx.beginPath();ctx.moveTo(x-40,y);ctx.lineTo(x,y-50);ctx.lineTo(x+40,y);ctx.fill();ctx.fillStyle='#3d2c1d';ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x,y-30);ctx.lineTo(x+8,y);ctx.fill();break;
  case 'shell':shadow(ctx,x,y,70,18);ctx.fillStyle='#6d6250';ctx.beginPath();ctx.ellipse(x,y-34,72,40,0,Math.PI,0);ctx.fill();ctx.fillStyle='#8f8268';for(let i=-2;i<=2;i++){ctx.beginPath();ctx.ellipse(x+i*26,y-40-Math.abs(i)*-4,12,16,0,0,Math.PI*2);ctx.fill();}break;
  case 'sign':R(ctx,'#7d6244',x-4,y-36,8,36);R(ctx,'#c2a878',x-34,y-44,68,18);R(ctx,'#8a6f4a',x-34,y-28,68,2);break;
  case 'crane':R(ctx,'#5a3e26',x-6,y-120,12,120);R(ctx,'#6a4a2e',x-6,y-120,90,10);ctx.strokeStyle='#3a2a1c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+76,y-110);ctx.lineTo(x+76,y-50);ctx.stroke();R(ctx,'#7d776b',x+66,y-50,20,16);break;
  case 'big-tree':shadow(ctx,x,y,60,16);R(ctx,'#5c3b22',x-16,y-80,32,80);ctx.fillStyle='#2f6b3a';ctx.beginPath();ctx.ellipse(x,y-120,90,64,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#4a8a45';ctx.beginPath();ctx.ellipse(x-18,y-136,58,38,0,0,Math.PI*2);ctx.fill();ctx.fillStyle=p.glow||'#9fe3c8';for(let i=0;i<6;i++)R(ctx,ctx.fillStyle,x-60+i*24,y-110+((i*37)%30),4,4);break;
  case 'lantern':R(ctx,'#4a3a28',x-2,y-40,4,40);R(ctx,'#ffd27a',x-5,y-50,10,10);break;
  case 'well':shadow(ctx,x,y,30,8);R(ctx,'#7d776b',x-28,y-26,56,26);R(ctx,'#2a3c48',x-22,y-24,44,8);R(ctx,'#5c3b22',x-26,y-60,6,36);R(ctx,'#5c3b22',x+20,y-60,6,36);R(ctx,'#8a6038',x-30,y-64,60,6);break;
  case 'statue':shadow(ctx,x,y,24,8);R(ctx,'#7d776b',x-20,y-16,40,16);R(ctx,'#9b9584',x-10,y-74,20,58);R(ctx,'#9b9584',x-7,y-88,14,14);break;
  case 'bench':R(ctx,'#5c3b22',x-40,y-14,80,8);R(ctx,'#3e2b1c',x-36,y-6,6,8);R(ctx,'#3e2b1c',x+30,y-6,6,8);break;
  case 'nest':ctx.fillStyle='#6b5034';ctx.beginPath();ctx.ellipse(x,y,26,12,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e9e4d0';for(const dx of [-8,2,10])ctx.fillRect(x+dx,y-4,6,5);break;
  case 'heron':ctx.fillStyle='#e9eef0';ctx.beginPath();ctx.ellipse(x,y-30,12,18,0,0,Math.PI*2);ctx.fill();R(ctx,'#e9eef0',x+4,y-62,4,22);R(ctx,'#e9eef0',x+4,y-64,12,5);R(ctx,'#e0a63a',x+16,y-63,10,3);R(ctx,'#3a3a32',x-4,y-12,2,14);R(ctx,'#3a3a32',x+2,y-12,2,14);break;
  case 'shrine':shadow(ctx,x,y,30,8);R(ctx,'#7d776b',x-26,y-60,52,60);R(ctx,'#a39d8d',x-30,y-66,60,8);R(ctx,'#2a2824',x-8,y-40,16,24);R(ctx,'#9fe3c8',x-3,y-34,6,6);break;
  case 'cart':R(ctx,'#6a4a2e',x-30,y-34,60,22);R(ctx,'#2a2018',x-22,y-14,14,14);R(ctx,'#2a2018',x+10,y-14,14,14);break;
  case 'logs':for(let i=0;i<3;i++){R(ctx,'#6a4a2e',x-30,y-10-i*10,60,10);R(ctx,'#c9a46a',x+26,y-10-i*10,6,10);}break;
  case 'mine':R(ctx,'#3a3530',x-40,y-60,80,60);R(ctx,'#14110e',x-26,y-48,52,48);R(ctx,'#5a3e26',x-32,y-56,8,56);R(ctx,'#5a3e26',x+24,y-56,8,56);R(ctx,'#5a3e26',x-34,y-60,68,8);break;
  case 'lighthouse':shadow(ctx,x,y,40,12);R(ctx,'#d8d2c0',x-24,y-170,48,170);for(let i=0;i<4;i++)R(ctx,'#a0403a',x-24,y-150+i*40,48,14);R(ctx,'#3a3530',x-30,y-196,60,26);R(ctx,'#ffe9a0',x-16,y-192,32,18);break;
  case 'wreck':ctx.save();ctx.translate(x,y);ctx.rotate(p.angle||-.3);ctx.fillStyle='#3e2b1c';ctx.beginPath();ctx.ellipse(0,0,80,26,0,0,Math.PI);ctx.fill();for(let i=-3;i<=3;i++)R(ctx,'#5a3e26',i*20-3,-30,6,30);R(ctx,'#5a3e26',-4,-90,8,90);ctx.restore();break;
  case 'gate':for(const dx of [-50,40]){R(ctx,'#4a301c',x+dx,y-70,10,70);}R(ctx,'#8a6038',x-56,y-76,112,8);break;
  case 'dock':R(ctx,'#4f3a26',x-16,y-10,32,90);for(let i=0;i<9;i++)R(ctx,i%2?'#9a7a52':'#b39066',x-14,y-8+i*10,28,8);break;
 }
}
