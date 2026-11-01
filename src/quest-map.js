// The story's next stop drawn on the area map and the minimap: a gold marker on the target, and for the Chapter 7
// runs the numbered guard posts and the path between them. Drawing only; storyTarget decides where.
import {PERIMETER} from './chapter7.js';
const GOLD='#ffd76a',INK='#2d2414',DONE='#6fbf5f',PALE='#f3e6bf';
export function runPosts(world,areaId){
 const s=world.story;
 if(!s||areaId!=='village'||!['ch7-run','ch7-laps'].includes(s.stage))return null;
 const run=s.run||0;
 return PERIMETER.map((post,i)=>({...post,n:i+1,state:i<run?'done':i===run?'next':'ahead'}));
}
function diamond(c,x,y,r,fill){c.save();c.translate(x,y);c.rotate(Math.PI/4);c.fillStyle=fill;c.strokeStyle=INK;c.lineWidth=Math.max(1.5,r/3);c.fillRect(-r,-r,r*2,r*2);c.strokeRect(-r,-r,r*2,r*2);c.restore();}
// The full area map. t is seconds, for the pulse; label names the target under its marker.
export function paintQuestMap(c,world,areaId,target,sx,sy,t=0){
 const posts=runPosts(world,areaId);
 if(posts){
  c.save();c.setLineDash([7,6]);c.strokeStyle='#7a4a1ccc';c.lineWidth=3;c.beginPath();posts.forEach((p,i)=>i?c.lineTo(p.x*sx,p.y*sy):c.moveTo(p.x*sx,p.y*sy));c.stroke();c.restore();
  for(const p of posts){
   const x=p.x*sx,y=p.y*sy,r=p.state==='next'?11:9;
   c.fillStyle=p.state==='done'?DONE:p.state==='next'?GOLD:PALE;c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.stroke();
   c.fillStyle=INK;c.font=`bold ${p.state==='next'?12:11}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText(p.state==='done'?'✓':String(p.n),x,y+.5);
  }
 }
 if(!target||target.areaId!==areaId)return;
 const x=target.x*sx,y=target.y*sy,pulse=(t%1.6)/1.6;
 c.save();c.strokeStyle=GOLD;c.globalAlpha=1-pulse;c.lineWidth=3;c.beginPath();c.arc(x,y,14+pulse*16,0,Math.PI*2);c.stroke();c.restore();
 if(!posts)diamond(c,x,y,7,GOLD);
 c.font='bold 13px Georgia, serif';c.textAlign='center';c.textBaseline='alphabetic';
 const text=target.label[0].toUpperCase()+target.label.slice(1),w=c.measureText(text).width+16,ly=y-24;
 c.fillStyle='#0c2119e6';c.strokeStyle=GOLD;c.lineWidth=1.5;c.beginPath();c.roundRect?.(x-w/2,ly-15,w,21,10);if(!c.roundRect)c.rect(x-w/2,ly-15,w,21);c.fill();c.stroke();
 c.fillStyle=PALE;c.fillText(text,x,ly);
}
// The minimap is centred on Eli at (cx, cy); a target outside its circle sits on the rim, pointing the way.
export function paintQuestMinimap(c,world,target,zoom,cx,cy,radius){
 const posts=runPosts(world,world.areaId);
 if(posts)for(const p of posts){if(p.state==='ahead')continue;const x=cx+(p.x-world.player.x)*zoom,y=cy+(p.y-world.player.y)*zoom;if(Math.hypot(x-cx,y-cy)>radius-4)continue;c.fillStyle=p.state==='done'?DONE:GOLD;c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.fill();c.stroke();}
 if(!target||!target.here)return;
 let dx=(target.x-world.player.x)*zoom,dy=(target.y-world.player.y)*zoom;const d=Math.hypot(dx,dy),edge=radius-10;
 if(d<=edge){diamond(c,cx+dx,cy+dy,5,GOLD);return;}
 const a=Math.atan2(dy,dx);c.save();c.translate(cx+Math.cos(a)*edge,cy+Math.sin(a)*edge);c.rotate(a);
 c.fillStyle=GOLD;c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.moveTo(8,0);c.lineTo(-6,-7);c.lineTo(-3,0);c.lineTo(-6,7);c.closePath();c.fill();c.stroke();c.restore();
}
