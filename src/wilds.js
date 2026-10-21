// A fixed world seed gives geography and scenery the same positions on every visit.
export const WORLD={width:6400,height:4800,seed:7319};
export const SPAWN={x:2920,y:4200};
export const LAND={left:0,right:WORLD.width,top:0,bottom:WORLD.height};
export const LANDMARKS=[
 {id:'landing',name:'Reedwater Landing',x:2920,y:4200,kind:'landing',text:'Your boat rests beside the delta. Wooden chimes mark the beginning of the old inland path.'},
 {id:'forest',name:'Whispering Forest',x:1660,y:2150,kind:'forest',text:'Hollow trunks carry the wind between the roots. Something taps twice, far beyond the path.'},
 {id:'jungle',name:'Verdant Jungle',x:1500,y:3450,kind:'jungle',text:'Roots cradle broken stone channels. They were built to carry water into the ruins.'},
 {id:'lakes',name:'Crystal Lakes',x:3030,y:2710,kind:'lakes',text:'Silver shapes drift above a drowned road. The paving stones lead toward a submerged doorway.'},
 {id:'mountains',name:'Frostspire Mountains',x:3120,y:1000,kind:'mountain',text:'Snow gathers in every crevice except the narrow seams of warm stone.'},
 {id:'dragon',name:'Dragon Cave',x:4160,y:1000,kind:'cave',text:'The cave breathes warm air. A weathered scale lies beside claw marks older than the trail.'},
 {id:'volcano',name:'Ember Volcano',x:5070,y:1600,kind:'volcano',text:'Heat rises through black basalt. Deep beneath your feet, the mountain answers with a low rumble.'},
 {id:'tar',name:'The Tar Pits',x:5110,y:2720,kind:'tar',text:'Dark bubbles break the surface. An ancient wheel emerges from the tar, still joined to its axle.'},
 {id:'mines',name:'Gold Mines',x:4750,y:3440,kind:'mine',text:'The rails end at a sealed shaft. You hear a faint knock after your footsteps stop.'},
 {id:'river',name:'Silverflow Crossing',x:3260,y:3370,kind:'river',text:'The river divides below the bridge, carrying mountain water toward the southern sea.'}
];
export const LAKES=[{x:2800,y:2150,rx:250,ry:180},{x:3340,y:2360,rx:290,ry:200},{x:3620,y:1950,rx:160,ry:150}];
export const RIVERS=[[[3070,800],[3000,1350],[2800,1700],[2800,2150],[3080,2550],[3260,2920],[3260,3370],[3200,3830],[3200,4620]],[[4040,900],[3860,1430],[3620,1950],[3340,2360],[3080,2550]],[[2800,2150],[2200,2400],[1700,2800],[1500,3450],[2300,3990],[3200,4320]],[[3200,3830],[3600,4130],[3950,4470]]];
const routes=[['landing','river'],['river','lakes'],['lakes','forest'],['forest','jungle'],['jungle','landing'],['forest','mountains'],['lakes','mountains'],['mountains','dragon'],['dragon','volcano'],['volcano','tar'],['tar','mines'],['mines','river'],['lakes','tar']];
export const ROADS=routes.map(([a,b])=>{const start=LANDMARKS.find(p=>p.id===a),end=LANDMARKS.find(p=>p.id===b);return [[start.x,start.y],[(start.x+end.x)/2+Math.sin(start.x)*70,(start.y+end.y)/2+45],[end.x,end.y]];});
export const TAR=[{x:5300,y:2250,rx:100,ry:70},{x:4920,y:2390,rx:75,ry:100},{x:5470,y:2630,rx:120,ry:70}];
export function hash(x,y,s=0){let h=Math.imul(x+WORLD.seed,374761393)^Math.imul(y+s,668265263);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
export function ellipseDistance(x,y,l){return (Math.hypot((x-l.x)/l.rx,(y-l.y)/l.ry)-1)*Math.min(l.rx,l.ry);}
function segmentDistance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);}
function lineDistance(x,y,lines){let d=Infinity;for(const line of lines)for(let i=1;i<line.length;i++)d=Math.min(d,segmentDistance(x,y,line[i-1],line[i]));return d;}
export const roadDistance=(x,y)=>lineDistance(x,y,ROADS);
export const riverDistance=(x,y)=>lineDistance(x,y,RIVERS);
export function coastDistance(x,y){const angle=Math.atan2((y-2400)/2150,(x-3200)/2880),edge=1+.025*Math.sin(angle*9)+.016*Math.sin(angle*17);return (Math.hypot((x-3200)/2880,(y-2400)/2150)-edge)*2150;}
export function waterDistance(x,y){return Math.min(-coastDistance(x,y),...LAKES.map(l=>ellipseDistance(x,y,l)),riverDistance(x,y)-24);}
export const isWater=(x,y)=>waterDistance(x,y)<0;
export const nearWater=(x,y)=>waterDistance(x,y)<=110;
export function regionAt(x,y){
 if(coastDistance(x,y)>0)return 'Southern Sea';
 const ox=x;x+=Math.sin(y*.0023)*110+Math.sin(y*.007)*35;y+=Math.sin(ox*.002)*90;
 if(x>4480&&y<1900)return 'Ember Volcano';
 if(y<1320)return 'Frostspire Mountains';
 if(x>4510&&y<2950)return 'The Tar Pits';
 if(x>4140&&y>=2950)return 'Goldward Foothills';
 if(x<2500&&y>3000)return 'Verdant Jungle';
 if(x<2450&&y<3000)return 'Whispering Forest';
 if(x>2450&&x<4030&&y<2890)return 'Crystal Lakes';
 if(y>3860)return 'Reedwater Delta';
 return 'Silverflow Lowlands';
}
const PALETTES={
 'Southern Sea':['#254a62','#29536a','#2d5c70'],
 'Reedwater Delta':['#8da574','#91a877','#94aa7b'],
 'Silverflow Lowlands':['#889e68','#8ba16b','#8fa56e'],
 'Whispering Forest':['#57734f','#5a7652','#5e7955'],
 'Verdant Jungle':['#436e52','#477155','#4b7557'],
 'Crystal Lakes':['#91b17e','#95b581','#99b885'],
 'Frostspire Mountains':['#869295','#929d9e','#a8b2ad'],
 'Ember Volcano':['#5d5556','#655959','#70605b'],
 'The Tar Pits':['#9e8860','#ac9469','#b19b70'],
 'Goldward Foothills':['#999466','#a39e70','#ada678']
};
export function surfaceAt(x,y){
 const wet=waterDistance(x,y);
 if(wet<0)return coastDistance(x,y)>0?'sea':'water';
 if(roadDistance(x,y)<25)return 'path';
 if(TAR.some(t=>ellipseDistance(x,y,t)<0))return 'tar';
 const volcano=Math.hypot(x-5070,y-1300);
 if(volcano<150)return 'lava';
 if(wet<45)return 'sand';
 return 'ground';
}
export function sceneryAt(gx,gy){
 const x=gx*80+16+hash(gx,gy)*48,y=gy*80+16+hash(gx,gy,3)*48,region=regionAt(x,y),r=hash(gx,gy,9);
 if(coastDistance(x,y)>-45||waterDistance(x,y)<56||roadDistance(x,y)<65||LANDMARKS.some(p=>Math.hypot(x-p.x,y-p.y)<100))return null;
 let kind=null;
 if(region==='Whispering Forest'&&r<.72)kind='tree';
 else if(region==='Verdant Jungle'&&r<.8)kind=r<.48?'palm':'tree';
 else if(region==='Frostspire Mountains'&&r<.54)kind='mountain';
 else if(region==='Ember Volcano'&&r<.48)kind='basalt';
 else if(region==='Goldward Foothills'&&r<.3)kind='gold';
 else if(r<.13)kind=r<.07?'tree':'rock';
 else if(r<.27)kind='bush';
 return kind?{x,y,kind,r:kind==='mountain'?24:kind==='tree'||kind==='palm'?12:kind==='bush'?0:15}:null;
}
export function walkable(x,y){
 if(x<32||y<32||x>WORLD.width-32||y>WORLD.height-32||coastDistance(x,y)>-16)return false;
 // Continuous old roads bridge water and guarantee routes to every landmark.
 if(roadDistance(x,y)<25)return true;
 if(waterDistance(x,y)<15||TAR.some(t=>ellipseDistance(x,y,t)<15)||Math.hypot(x-5070,y-1300)<170)return false;
 const gx=Math.floor(x/80),gy=Math.floor(y/80);
 for(let ix=gx-1;ix<=gx+1;ix++)for(let iy=gy-1;iy<=gy+1;iy++){const o=sceneryAt(ix,iy);if(o&&o.r&&(x-o.x)**2+(y-o.y)**2<(o.r+14)**2)return false;}
 return true;
}
export function nearestLandmark(x,y){return LANDMARKS.find(p=>Math.hypot(x-p.x,y-p.y)<115)||null;}

// Original small pixel sprites. No commercial game assets are bundled.
function pixelTree(ctx,x,y,palm=false){
 ctx.fillStyle='#162e3155';ctx.fillRect(x-24,y+9,50,15);ctx.fillStyle='#513e32';ctx.fillRect(x-5,y-9,10,30);ctx.fillStyle='#896442';ctx.fillRect(x-2,y-9,4,28);
 if(palm){ctx.fillStyle='#274d3c';ctx.fillRect(x-35,y-27,70,10);ctx.fillRect(x-8,y-47,16,53);ctx.fillRect(x-26,y-38,52,10);ctx.fillStyle='#5d9860';ctx.fillRect(x-27,y-32,29,5);ctx.fillRect(x+4,y-39,19,5);return;}
 ctx.fillStyle='#244d3b';ctx.fillRect(x-28,y-40,56,37);ctx.fillRect(x-19,y-52,38,59);ctx.fillStyle='#376548';ctx.fillRect(x-24,y-40,44,25);ctx.fillRect(x-15,y-48,30,13);ctx.fillStyle='#528056';ctx.fillRect(x-19,y-37,12,7);ctx.fillRect(x-10,y-45,17,5);
 ctx.fillStyle='#668e5b';ctx.fillRect(x-12,y-44,8,4);ctx.fillRect(x-21,y-32,5,4);ctx.fillStyle='#2b5940';ctx.fillRect(x+8,y-28,13,6);ctx.fillRect(x-7,y-16,10,5);ctx.fillStyle='#83a366';ctx.fillRect(x-8,y-43,3,3);
}
function rock(ctx,o){const {x,y,kind}=o,m=kind==='mountain';ctx.fillStyle='#23394144';ctx.fillRect(x-22,y+4,49,17);ctx.fillStyle=m?'#58676f':'#636e67';ctx.beginPath();ctx.moveTo(x-25,y+13);ctx.lineTo(x-13,y-(m?44:18));ctx.lineTo(x+8,y-(m?63:24));ctx.lineTo(x+28,y+12);ctx.closePath();ctx.fill();ctx.fillStyle=m?'#cbd5ce':kind==='gold'?'#d9b65b':'#9aa397';ctx.beginPath();ctx.moveTo(x-13,y-(m?44:18));ctx.lineTo(x+8,y-(m?63:24));ctx.lineTo(x+15,y-(m?33:8));ctx.lineTo(x+3,y-(m?39:12));ctx.lineTo(x-4,y-(m?30:7));ctx.closePath();ctx.fill();}
function staticArea(ctx,left,top,width,height){
 for(let y=Math.floor(top/16)*16;y<top+height;y+=16)for(let x=Math.floor(left/16)*16;x<left+width;x+=16){
  const region=regionAt(x+8,y+8),surface=surfaceAt(x+8,y+8),palette=PALETTES[region];let color=palette[Math.floor(hash(x,y)*palette.length)];
  if(surface==='water')color='#4d9ba5';else if(surface==='sea')color='#2a566b';else if(surface==='sand')color='#c4b486';else if(surface==='path')color='#b39b71';else if(surface==='tar')color='#34323b';else if(surface==='lava')color='#d37545';
  ctx.fillStyle=color;ctx.fillRect(x,y,16,16);
  const r=hash(x,y,4);ctx.fillStyle=surface==='water'?'#8ac4bd':surface==='sea'?'#396c7b':surface==='lava'?'#f0b765':'#d6dbac44';
  if(r<.55)ctx.fillRect(x+3,y+6,surface==='water'||surface==='sea'?8:2,2);
  if(surface==='ground'&&r<.3){ctx.fillStyle='#334e3528';ctx.fillRect(x+8,y+5,2,4);ctx.fillRect(x+6,y+7,5,2);}
  if(surface==='path'&&isWater(x+8,y+8)){ctx.fillStyle='#735b46';ctx.fillRect(x,y,16,16);ctx.fillStyle='#b59a6b';for(let k=1;k<16;k+=8)ctx.fillRect(x+k,y,5,16);}
 }
 for(let gy=Math.floor(top/80)-1;gy<Math.ceil((top+height)/80)+1;gy++)for(let gx=Math.floor(left/80)-1;gx<Math.ceil((left+width)/80)+1;gx++){const o=sceneryAt(gx,gy);if(!o)continue;if(o.kind==='tree'||o.kind==='palm')pixelTree(ctx,o.x,o.y,o.kind==='palm');else if(o.kind==='bush'){ctx.fillStyle='#416b46';ctx.fillRect(o.x-14,o.y-7,28,14);ctx.fillStyle='#83a967';ctx.fillRect(o.x-8,o.y-9,12,5);}else rock(ctx,o);}
}
const chunks=new Map(),CHUNK=512,MAX_CHUNKS=30;
export function clearTerrainCache(){chunks.clear();}
export function cachedChunkCount(){return chunks.size;}
function drawChunks(ctx,view){
 for(let cy=Math.floor(view.top/CHUNK);cy<=Math.floor(view.bottom/CHUNK);cy++)for(let cx=Math.floor(view.left/CHUNK);cx<=Math.floor(view.right/CHUNK);cx++){
  const key=`${cx},${cy}`;let canvas=chunks.get(key);
  if(!canvas){canvas=document.createElement('canvas');canvas.width=CHUNK;canvas.height=CHUNK;const c=canvas.getContext('2d');c.translate(-cx*CHUNK,-cy*CHUNK);staticArea(c,cx*CHUNK,cy*CHUNK,CHUNK,CHUNK);chunks.set(key,canvas);if(chunks.size>MAX_CHUNKS)chunks.delete(chunks.keys().next().value);}
  else {chunks.delete(key);chunks.set(key,canvas);}
  ctx.drawImage(canvas,cx*CHUNK,cy*CHUNK);
 }
}
function drawLandmark(ctx,p){
 const {x,y,kind}=p;ctx.fillStyle='#182c3444';ctx.fillRect(x-45,y+10,90,18);
 if(kind==='cave'||kind==='mine'){ctx.fillStyle='#626e71';ctx.fillRect(x-37,y-38,74,58);ctx.fillRect(x-24,y-52,48,20);ctx.fillStyle='#192a33';ctx.fillRect(x-22,y-31,44,51);ctx.fillStyle=kind==='mine'?'#d5af52':'#9ca6a0';ctx.fillRect(x-29,y-35,8,58);ctx.fillRect(x+21,y-35,8,58);if(kind==='mine'){ctx.fillStyle='#e1bd59';for(let i=0;i<5;i++)ctx.fillRect(x+34+i*5,y+10-i%2*7,7,7);}else {ctx.fillStyle='#a5b7a5';ctx.fillRect(x-10,y-45,6,5);ctx.fillRect(x+5,y-45,6,5);}}
 else if(kind==='volcano'){for(let i=0;i<6;i++){ctx.fillStyle=i<4?'#554f54':'#da774c';ctx.fillRect(x-64+i*8,y+12-i*15,128-i*16,17);}ctx.fillStyle='#f1bd70';ctx.fillRect(x-17,y-67,34,9);}
 else if(kind==='landing'){ctx.fillStyle='#6c523c';ctx.fillRect(x-53,y-12,76,30);ctx.fillStyle='#baa077';ctx.fillRect(x-43,y-8,55,5);ctx.fillStyle='#e2d4a7';ctx.fillRect(x+24,y-45,5,60);ctx.fillStyle='#947b50';ctx.fillRect(x+10,y-47,36,5);for(let i=0;i<3;i++)ctx.fillRect(x+14+i*10,y-35,4,14+i*5);}
 else if(kind==='forest'||kind==='jungle'){pixelTree(ctx,x-30,y-6,kind==='jungle');pixelTree(ctx,x+32,y-11,kind==='jungle');ctx.fillStyle='#b7b88a';ctx.fillRect(x-6,y-9,12,28);}
 else if(kind==='mountain')rock(ctx,{x,y,kind:'mountain'});
 else if(kind==='tar'){ctx.fillStyle='#2d2c35';ctx.fillRect(x-41,y-14,82,27);ctx.fillStyle='#695b56';ctx.fillRect(x-28,y-8,26,5);ctx.fillRect(x+6,y+3,18,4);}
 else {ctx.fillStyle='#a7b5a4';ctx.fillRect(x-34,y-25,12,42);ctx.fillRect(x+22,y-18,12,35);ctx.fillStyle='#cad2b0';ctx.fillRect(x-37,y-29,18,7);ctx.fillRect(x+19,y-22,18,7);}
 ctx.textAlign='center';ctx.font='bold 13px monospace';ctx.fillStyle='#172d32dd';ctx.fillRect(x-105,y+30,210,25);ctx.fillStyle='#efe8c6';ctx.fillText(p.name,x,y+47);
}
function wildlife(ctx,world,view){
 const animals=[{x:1810,y:2270,kind:'deer'},{x:1730,y:2020,kind:'deer'},{x:2720,y:3990,kind:'deer'},{x:2840,y:2130,kind:'turtle'},{x:3380,y:2360,kind:'turtle'},{x:2740,y:2175,kind:'eel'},{x:3280,y:2320,kind:'eel'}];
 for(let i=0;i<animals.length;i++){
  const a=animals[i],t=world.elapsed*.35+i,x=a.x+Math.sin(t)*12,y=a.y+Math.cos(t*.8)*8;
  if(x<view.left-40||x>view.right+40||y<view.top-40||y>view.bottom+40)continue;
  if(a.kind==='deer'){
   ctx.fillStyle='#233c3455';ctx.fillRect(x-16,y+10,32,8);ctx.fillStyle='#a28b62';ctx.fillRect(x-12,y-4,23,15);ctx.fillRect(x+7,y-17,10,18);ctx.fillStyle='#715d43';ctx.fillRect(x-10,y+8,4,12);ctx.fillRect(x+6,y+8,4,12);ctx.fillStyle='#c4b28a';ctx.fillRect(x+3,y-17,6,4);ctx.fillRect(x+15,y-20,7,4);ctx.fillStyle='#8fac70';ctx.fillRect(x+6,y-29,3,14);ctx.fillRect(x+16,y-30,3,14);ctx.fillRect(x+1,y-27,6,3);ctx.fillRect(x+18,y-26,7,3);ctx.fillStyle='#263c36';ctx.fillRect(x+14,y-12,2,2);
  }else if(a.kind==='turtle'){
   ctx.fillStyle='#b0c59b';ctx.fillRect(x-21,y-4,9,10);ctx.fillRect(x+14,y-8,7,7);ctx.fillRect(x+12,y+9,7,7);ctx.fillStyle='#3b6b59';ctx.fillRect(x-14,y-12,29,27);ctx.fillStyle='#6e9a70';ctx.fillRect(x-10,y-9,20,19);ctx.fillStyle='#b0ba7d';ctx.fillRect(x-2,y-19,3,15);ctx.fillRect(x+4,y-23,3,20);ctx.fillRect(x-7,y-18,2,13);
  }else{ctx.fillStyle='#b6e8cb';for(let j=0;j<7;j++)ctx.fillRect(x+j*4,y+Math.sin(t*3+j*.7)*4,5,3);}
 }
}
export function drawWilds(ctx,world,view={left:world.player.x-700,right:world.player.x+700,top:world.player.y-500,bottom:world.player.y+500}){
 ctx.imageSmoothingEnabled=false;
 if(typeof document!=='undefined')drawChunks(ctx,view);else staticArea(ctx,view.left,view.top,view.right-view.left,view.bottom-view.top);
 for(const p of LANDMARKS)if(p.x>view.left-130&&p.x<view.right+130&&p.y>view.top-100&&p.y<view.bottom+100)drawLandmark(ctx,p);
 wildlife(ctx,world,view);
}
export function drawExplorer(ctx,p){
 const x=Math.round(p.x),y=Math.round(p.y),step=Math.sin(p.walkTime||0)*2;
 ctx.fillStyle='#18323855';ctx.fillRect(x-12,y+10,25,7);ctx.fillStyle='#423d3c';ctx.fillRect(x-8,y+6+step,6,9);ctx.fillRect(x+3,y+6-step,6,9);
 ctx.fillStyle='#71885f';ctx.fillRect(x-11,y-8,22,17);ctx.fillStyle='#a2b580';ctx.fillRect(x-8,y-8,7,10);ctx.fillStyle='#c6a276';ctx.fillRect(x-7,y-20,14,12);ctx.fillStyle='#554739';ctx.fillRect(x-9,y-23,18,6);ctx.fillStyle='#d0b77e';ctx.fillRect(x-13,y-22,26,4);ctx.fillStyle='#775b44';ctx.fillRect(x-6,y-5,13,14);
 ctx.fillStyle='#c78066';ctx.fillRect(x-8,y-8,17,3);ctx.fillRect(x-11,y-5,5,8);
 ctx.strokeStyle='#c6ae78';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+10,y);ctx.lineTo(x+Math.cos(p.angle)*30,y+Math.sin(p.angle)*30);ctx.stroke();
}

export function paintAtlas(ctx,width,height,player,discovered=new Set()){
 ctx.clearRect(0,0,width,height);const sx=width/WORLD.width,sy=height/WORLD.height,step=64;
 for(let y=0;y<WORLD.height;y+=step)for(let x=0;x<WORLD.width;x+=step){const surface=surfaceAt(x+32,y+32),region=regionAt(x+32,y+32);ctx.fillStyle=surface==='sea'?'#234e60':surface==='water'?'#64abb0':surface==='tar'?'#34333a':surface==='lava'?'#d47a46':PALETTES[region][1];ctx.fillRect(x*sx,y*sy,step*sx+1,step*sy+1);if(surface==='ground'&&width>400&&hash(x,y)<.5){ctx.fillStyle=region==='Frostspire Mountains'?'#d5d7c5':'#284f3e55';if(region==='Frostspire Mountains'){ctx.beginPath();ctx.moveTo(x*sx,y*sy+4);ctx.lineTo(x*sx+3,y*sy-3);ctx.lineTo(x*sx+7,y*sy+4);ctx.fill();}else ctx.fillRect(x*sx+2,y*sy+2,3,3);}}
 ctx.strokeStyle='#d6c18f';ctx.lineWidth=1;for(const line of ROADS){ctx.beginPath();line.forEach((p,i)=>i?ctx.lineTo(p[0]*sx,p[1]*sy):ctx.moveTo(p[0]*sx,p[1]*sy));ctx.stroke();}
 for(const p of LANDMARKS){ctx.fillStyle=discovered.has(p.id)?'#e4c575':'#dee1cc';ctx.fillRect(p.x*sx-2,p.y*sy-2,4,4);if(width<400)continue;ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.fillStyle='#132c32';ctx.fillText(p.name,p.x*sx+1,p.y*sy-9);ctx.fillStyle='#f1e7c6';ctx.fillText(p.name,p.x*sx,p.y*sy-10);}
 if(player){ctx.fillStyle='#fff4be';ctx.beginPath();ctx.arc(player.x*sx,player.y*sy,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#213d40';ctx.lineWidth=2;ctx.stroke();}
}
