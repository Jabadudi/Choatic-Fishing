// Decorative boundary geometry only. Collision continues to use the unchanged height field.
const CHUNK=12;
const noise=(x,y)=>Math.sin(x*1.713+y*.917)*Math.cos(x*.137-y*.733);
export function cliffPieces(e){
 const pieces=[];
 for(const terrace of e.terraces.filter(t=>t.id!=='wood-pier'))for(let edge=0;edge<terrace.points.length;edge++){
  const a=terrace.points[edge],b=terrace.points[(edge+1)%terrace.points.length],dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
  if(!length)continue;
  const nx=-dy/length,ny=dx/length,count=Math.ceil(length/CHUNK);
  for(let i=0;i<count;i++){
   const t=(i+.5)/count,x=a[0]+dx*t,y=a[1]+dy*t;
   const left=e.heightAt(x+nx*2,y+ny*2),right=e.heightAt(x-nx*2,y-ny*2);
   // Sloped entrances have their own mesh and must never receive a decorative wall across them.
   if(Math.abs(left-right)<40||e.rampAt(x,y))continue;
   const high=Math.max(left,right),low=Math.min(left,right),sign=left>right?-1:1;
   const p=[a[0]+dx*i/count,a[1]+dy*i/count],q=[a[0]+dx*(i+1)/count,a[1]+dy*(i+1)/count];
   pieces.push({p,q,high,low,nx:nx*sign,ny:ny*sign,row:Math.max(p[1],q[1]),joint:i%4===0,ledge:i%7===3&&noise(x,y)>.15});
  }
 }
 return pieces;
}
function line(c,a,b,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
export function drawCliffPiece(c,s,texture,capTexture){
 const {p,q,high,low,nx,ny}=s;
 const lip=p=>4+Math.sin(p[0]*.043+p[1]*.037)*6+noise(...p)*2;
 const a=[p[0]+nx*lip(p),p[1]-high+ny*lip(p)],b=[q[0]+nx*lip(q),q[1]-high+ny*lip(q)];
 const footA=[a[0],p[1]-low],footB=[b[0],q[1]-low];
 // Only a face with its high ground to the north is visible in this projection.
 if(ny>0.02){
  c.save();c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineTo(...footB);c.lineTo(...footA);c.closePath();c.clip();
  const top=Math.min(a[1],b[1]),bottom=Math.max(footA[1],footB[1]),x=Math.min(a[0],b[0])-2,w=Math.abs(b[0]-a[0])+4;
  c.fillStyle=texture||'#776f5c';c.fillRect(x,top,w,bottom-top+2);
  const light=c.createLinearGradient(0,top,0,bottom);light.addColorStop(0,'rgba(222,202,151,.12)');light.addColorStop(.25,'rgba(47,43,37,.12)');light.addColorStop(1,'rgba(26,32,29,.6)');c.fillStyle=light;c.fillRect(x,top,w,bottom-top+2);
  // Exposed strata share world-space phases, so neighboring pieces form continuous ledges.
  for(const fraction of [.62]){
   const z=high-(high-low)*fraction,shift=x=>Math.sin(x*.025+fraction*9)*3;
   const u=[a[0],p[1]-z+shift(a[0])],v=[b[0],q[1]-z+shift(b[0])];
   line(c,[u[0],u[1]+3],[v[0],v[1]+3],'rgba(35,32,28,.48)',4);
   line(c,u,v,'rgba(199,174,124,.45)',2);
  }
  if(s.joint){const mid=(high+low)/2;line(c,[a[0]+2,p[1]-high+6],[a[0]-4,p[1]-mid],'rgba(39,38,32,.46)',2);line(c,[a[0]-4,p[1]-mid],[a[0]+1,p[1]-low],'rgba(39,38,32,.46)',2);}
  if((s.ledge||s.joint&&noise(...p)>.45)&&ny>.2){
   const length=12+Math.abs(noise(...q))*19;c.strokeStyle=high===0?'#66833d':'#536a43';c.lineWidth=3;c.beginPath();c.moveTo(a[0]+2,a[1]+2);c.quadraticCurveTo(a[0]-2,a[1]+length*.5,a[0]+3,a[1]+length);c.stroke();c.fillStyle='#879750';for(let j=5;j<length;j+=7)c.fillRect(a[0]+(j%2?1:-3),a[1]+j,4,3);
  }
  c.restore();
  // Contact shadow stays narrow; the floor remains readable next to the rock.
  line(c,[footA[0],footA[1]+4],[footB[0],footB[1]+4],'rgba(35,34,27,.12)',12);
  line(c,[footA[0],footA[1]+1],[footB[0],footB[1]+1],'rgba(30,31,25,.3)',4);
 }
 // A shaped cap hides the sampling grid without moving the gameplay boundary.
 const inset=p=>9+Math.sin(p[0]*.061+p[1]*.033)*3;
 const ia=[p[0]-nx*inset(p),p[1]-high-ny*inset(p)],ib=[q[0]-nx*inset(q),q[1]-high-ny*inset(q)];
 c.fillStyle=capTexture||(s.grass?'#8f995c':'#a69a78');c.beginPath();c.moveTo(...ia);c.lineTo(...ib);c.lineTo(...b);c.lineTo(...a);c.closePath();c.fill();if(capTexture){c.fillStyle='rgba(201,184,143,.28)';c.fill();}
 line(c,ia,ib,s.grass?'rgba(187,194,114,.65)':'rgba(211,196,157,.7)',2);
 line(c,a,b,ny>0?'#665c46':'rgba(65,62,46,.6)',2);
 if(s.joint)line(c,ia,a,'rgba(61,57,43,.35)',1.5);
 if(s.ledge&&ny>.2){
  // Small broken slabs project from the rim, with a lit top and a shaded underside.
  const tx=(q[0]-p[0])/Math.hypot(q[0]-p[0],q[1]-p[1]),ty=(q[1]-p[1])/Math.hypot(q[0]-p[0],q[1]-p[1]);
  const span=1+noise(...p)*.3,ox=nx*(2+noise(...q)*2);
  const v=[[a[0]-tx*10*span-nx*8,a[1]-ty*10*span-ny*8],[a[0]+tx*11*span-nx*5,a[1]+ty*11*span-ny*5],[a[0]+tx*8+nx*8+ox,a[1]+ty*8+ny*8],[a[0]-tx*7+nx*10+ox,a[1]-ty*7+ny*10]];
  c.fillStyle='#655b46';c.beginPath();c.moveTo(...v[2]);c.lineTo(...v[3]);c.lineTo(v[3][0]+1,v[3][1]+7);c.lineTo(v[2][0]+1,v[2][1]+5);c.closePath();c.fill();
  c.fillStyle=capTexture||(s.grass?'#9b9e68':'#a99b7a');c.beginPath();c.moveTo(...v[0]);for(const pt of v.slice(1))c.lineTo(...pt);c.closePath();c.fill();line(c,v[0],v[1],'rgba(203,187,146,.6)',1.5);
 }
}
