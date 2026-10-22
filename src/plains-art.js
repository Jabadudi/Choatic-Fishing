// Small, repeatable pixel clusters, painted once into the terrain chunk cache.
const noise=(x,y,s=0)=>{let n=Math.imul(x+913,374761393)^Math.imul(y+s,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
function oval(ctx,x,y,rx,ry,color,step=3){
 ctx.fillStyle=color;
 for(let row=-ry;row<=ry;row+=step){const w=Math.round(rx*Math.sqrt(Math.max(0,1-row*row/(ry*ry)))/step)*step;ctx.fillRect(Math.round(x-w),Math.round(y+row),w*2,step);}
}
// part: 'trunk' (cached with terrain), 'stem' (trunk without shadow, redrawn over characters behind it), 'crown' (sprite drawn per frame so it can sway) or 'all'.
export function leafyTree(ctx,x,y,big=false,part='all'){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));if(big)ctx.scale(2,2);
 if(part!=='crown'){
 if(part!=='stem')oval(ctx,18,10,34,10,'#1f3a3550');
 ctx.fillStyle='#514329';ctx.fillRect(-7,-38,14,53);ctx.fillRect(-15,11,11,5);ctx.fillRect(5,10,12,5);
 ctx.fillStyle='#936237';ctx.fillRect(-4,-35,6,47);ctx.fillRect(-13,-34,10,5);ctx.fillRect(4,-41,12,5);
 ctx.fillStyle='#c38d48';ctx.fillRect(-4,-23,3,27);
 if(big){oval(ctx,0,5,5,10,'#253a29',2);ctx.fillStyle='#75934c';ctx.fillRect(-13,10,7,3);}
 }
 if(part==='trunk'||part==='stem'){ctx.restore();return;}
 const crowns=[[-22,-40,24,19],[21,-43,25,19],[-17,-61,26,24],[13,-66,26,24],[0,-79,23,17],[0,-48,34,23]];
 for(const [cx,cy,rx,ry]of crowns){oval(ctx,cx+3,cy+5,rx,ry,'#164c38');oval(ctx,cx,cy-1,rx-2,ry-3,'#28733d');}
 // Leaf clusters catch the light from the upper left, leaving dark pockets below.
 for(let i=0;i<100;i++){
  const cx=-42+noise(i,3)*84,cy=-91+noise(i,7)*65;
  if(!crowns.some(([a,b,rx,ry])=>((cx-a)/rx)**2+((cy-b)/ry)**2<.8))continue;
  const lit=(1-(cx+42)/84)*.35+(1-(cy+91)/65)*.4+noise(i,11)*.4;
  const colors=lit>.72?['#a8cd43','#83b83c']:lit>.45?['#5b9c36','#47903c']:['#23673b','#327d3b'];
  const w=4+Math.floor(noise(i,12)*3)*2,h=3+Math.floor(noise(i,13)*2)*2;
  ctx.fillStyle=colors[i%2];ctx.fillRect(Math.round(cx/2)*2,Math.round(cy/2)*2,w,h);ctx.fillRect(Math.round(cx/2)*2-2,Math.round(cy/2)*2+2,4,h);
 }
 ctx.restore();
}
export function meadowRock(ctx,x,y,small=false,shadow=true){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));if(small)ctx.scale(.45,.45);
 if(shadow)oval(ctx,8,9,22,7,'#1f3a3550');
 const face=(color,points)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fill();};
 face('#575f59',[[-23,7],[-20,-8],[-9,-22],[7,-25],[20,-12],[25,9],[10,14],[-13,13]]);
 face('#9a9b7b',[[-20,-8],[-9,-22],[7,-25],[15,-13],[2,-7],[-10,-9],[-16,3]]);
 face('#b8b295',[[-9,-22],[5,-23],[10,-16],[-2,-16]]);
 face('#747c70',[[2,-7],[15,-13],[22,0],[20,9],[7,11]]);
 ctx.fillStyle='#3f544c';ctx.fillRect(-9,1,3,10);ctx.fillRect(11,-5,3,9);
 ctx.fillStyle='#759848';ctx.fillRect(-19,-7,8,4);ctx.fillRect(-14,-11,8,4);ctx.fillRect(6,-23,8,3);
 ctx.restore();
}
export function meadowBush(ctx,x,y,shadow=true){
 if(shadow)oval(ctx,x+6,y+6,20,6,'#1f3a3550');
 for(let i=0;i<5;i++){const cx=x-15+i*7,cy=y-3-noise(i,Math.floor(x))*9;oval(ctx,cx,cy,9,8,'#327d3c',2);oval(ctx,cx-2,cy-3,6,4,'#73a83d',2);ctx.fillStyle='#b1c94e';ctx.fillRect(cx-3,cy-5,3,2);}
}
export function grassDetail(ctx,x,y,seed){
 const r=noise(x,y,seed);
 ctx.fillStyle=r<.45?'#94bb45':r<.75?'#c1ce58':'#5e9b41';
 ctx.fillRect(x,y,2,2);ctx.fillRect(x+4,y+5,3,2);
 if(r<.25){ctx.fillStyle='#548b38';ctx.fillRect(x+3,y+1,2,4);ctx.fillRect(x+1,y+2,2,2);ctx.fillStyle='#b6ce57';ctx.fillRect(x+5,y,2,4);}
 if(r>.92){ctx.fillStyle='#f1d65b';ctx.fillRect(x,y,2,3);ctx.fillRect(x+6,y+5,2,2);}
}
export function wildflower(ctx,x,y,white=true){
 ctx.fillStyle='#408242';ctx.fillRect(x,y,2,10);ctx.fillRect(x-3,y+5,4,2);ctx.fillRect(x+2,y+3,3,2);
 ctx.fillStyle=white?'#f9f4d5':'#f6d455';ctx.fillRect(x-4,y-1,9,3);ctx.fillRect(x-1,y-4,3,9);
 ctx.fillStyle=white?'#e8bb42':'#cb9634';ctx.fillRect(x-1,y-1,3,3);
}
