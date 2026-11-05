// Built structures follow the existing ramp height field. No collision or simulation state here.
const STEP=96,STRIP=16;
const mix=(a,b,t)=>a+(b-a)*t;
const styles={
 landing:{texture:'rock',textureAlpha:.4,fallback:'#a49a81',tint:'rgba(192,177,142,.2)',stroke:'rgba(67,61,48,.38)'},
 tread:{texture:'rock',textureAlpha:.25,fallback:'#a99d83',tint:'rgba(192,181,150,.15)',stroke:'rgba(67,61,48,.42)'},
 riser:{texture:'cliffFace',fallback:'#706955',tint:'rgba(53,49,39,.28)',stroke:'rgba(51,47,38,.42)'},
 wall:{texture:'cliffFace',fallback:'#7c735e',tint:'rgba(55,50,41,.22)',stroke:'rgba(55,50,41,.45)'},
 cap:{texture:'rock',fallback:'#a89b7d',tint:'rgba(200,182,143,.34)',stroke:'rgba(66,59,45,.5)'},
 stairCap:{texture:'rock',textureAlpha:.25,fallback:'#b4a582',tint:'rgba(200,182,143,.2)',stroke:'rgba(66,59,45,.65)'},
 track:{fill:'rgba(77,65,44,.15)'},rut:{fill:'rgba(75,62,41,.32)'},
 wood:{fill:'#796047',stroke:'#4f4433'},woodSide:{fill:'#544a39'},woodTop:{fill:'#ab9270',stroke:'#69583f'}
};
function cut(points,bound,keepAbove){
 const out=[];for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],inside=p=>keepAbove?p.y>=bound:p.y<=bound,ia=inside(a),ib=inside(b);
  if(ia)out.push(a);if(ia!==ib){const t=(bound-a.y)/(b.y-a.y);out.push({x:mix(a.x,b.x,t),y:bound,z:mix(a.z,b.z,t)});}
 }return out;
}
export function rampArtwork(e){
 const pieces=[];
 function polygon(points,style,highlight=false){
  const min=Math.min(...points.map(p=>p.y)),max=Math.max(...points.map(p=>p.y));
  for(let row=Math.floor(min/STRIP)*STRIP;row<=Math.floor(max/STRIP)*STRIP;row+=STRIP){
   const clipped=cut(cut(points,row,true),row+STRIP,false);if(clipped.length<3)continue;
   pieces.push({points:clipped,outline:points,style,highlight,row,top:Math.min(...clipped.map(p=>p.y-p.z))-3,bottom:Math.max(...clipped.map(p=>p.y-p.z))+3});
  }
 }
 for(const r of e.ramps){
  const dx=r.to[0]-r.from[0],dy=r.to[1]-r.from[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,nx=-uy,ny=ux,w=r.width/2;
  const z=t=>(r.fromHeight+(r.toHeight-r.fromHeight)*t)*STEP;
  const at=(distance,side=0,height=z(Math.max(0,Math.min(1,distance/L))))=>({x:r.from[0]+ux*distance+nx*side,y:r.from[1]+uy*distance+ny*side,z:height});
  const quad=(a,b,left,right,za,zb)=>[at(a,left,za),at(b,left,zb),at(b,right,zb),at(a,right,za)];
  // Flat threshold aprons tie both ends into their actual floor, without narrowing the entrance.
  for(const [a,b,height]of [[-24,0,z(0)],[L,L+24,z(1)]]){
   for(let j=0;j<3;j++)polygon(quad(a,b,-w+2*w*j/3,-w+2*w*(j+1)/3,height,height),'landing',true);
  }
  if(r.kind==='stairs'){
   const count=Math.max(8,Math.round(Math.abs(z(1)-z(0))/8)),run=L/count;
   for(let i=0;i<count;i++){
    const a=i*run,b=(i+1)*run,height=z((i+.5)/count),next=i===count-1?z(1):z((i+1.5)/count);
    polygon(quad(a,b,-w,w,height,height),'tread','nose');
    polygon([at(b,-w,height),at(b,w,height),at(b,w,next),at(b,-w,next)],'riser');
   }
  }else{
   // Two continuous wheel ruts with broad worn shoulders. Extend onto both threshold aprons.
   for(const side of [-w*.46,w*.46])for(const [half,style]of [[6,'track'],[1.8,'rut']]){
    const count=Math.ceil((L+40)/16);for(let i=0;i<count;i++){
     const a=-20+(L+40)*i/count,b=-20+(L+40)*(i+1)/count;
     polygon(quad(a,b,side-half,side+half),style);
    }
   }
  }
  // Masonry retaining faces and coping remain outside the original traversable width.
  const count=Math.ceil(L/20);
  for(const side of [-1,1])for(let i=0;i<count;i++){
   const a=L*i/count,b=L*(i+1)/count,inner=side*(w+1),outer=side*(w+(r.kind==='stairs'?17:11)),za=z(i/count),zb=z((i+1)/count);
   const pa=at(a,outer),pb=at(b,outer),ga=e.heightAt(pa.x,pa.y),gb=e.heightAt(pb.x,pb.y);
   const ta=r.kind==='stairs'?Math.max(za,ga)+18:za+12,tb=r.kind==='stairs'?Math.max(zb,gb)+18:zb+12;
   // Visible exterior: the embankment reaches the adjoining lower floor.
   if(ny*side>=-.02)polygon([at(a,outer,ta),at(b,outer,tb),at(b,outer,Math.min(zb,gb)),at(a,outer,Math.min(za,ga))],'wall');
   // Far-side cut face: higher adjacent ground meets the road rather than leaving a wedge-shaped gap.
   if(ny*side<0)polygon([at(a,inner,Math.max(za+12,ga)),at(b,inner,Math.max(zb+12,gb)),at(b,inner,zb),at(a,inner,za)],'wall');
   polygon(quad(a,b,inner,outer,ta,tb),r.kind==='stairs'?'stairCap':'cap',true);
   if(r.kind==='stairs'&&(i===0||i===count-1)){
    const distance=i===0?a:b,height=i===0?ta:tb,base=i===0?za:zb;
    polygon([at(distance,inner,height),at(distance,outer,height),at(distance,outer,base),at(distance,inner,base)],'wall');
   }
  }
  // Weathered timber markers at the cart ramp edges. Stair parapets stay stone.
  if(r.kind!=='stairs')for(const side of [-1,1])for(let i=0;i<=3;i++){
   const distance=L*i/3,base=at(distance,side*(w+7)),x=base.x,y=base.y,h=Math.max(base.z,e.heightAt(base.x,base.y))+12;
   const p=(dx,dy,z)=>({x:x+dx,y:y+dy,z});
   polygon([p(-4,3,h),p(4,3,h),p(4,3,h+31),p(-4,3,h+31)],'wood');
   polygon([p(4,3,h),p(7,-2,h),p(7,-2,h+31),p(4,3,h+31)],'woodSide');
   polygon([p(-4,3,h+31),p(4,3,h+31),p(7,-2,h+31),p(-1,-2,h+31)],'woodTop');
  }
 }
 return pieces;
}
export function drawRampPiece(c,p,patterns){
 const style=styles[p.style];c.save();c.beginPath();p.points.forEach((v,i)=>i?c.lineTo(v.x,v.y-v.z):c.moveTo(v.x,v.y-v.z));c.closePath();
 c.fillStyle=style.fill||style.fallback||'#8e8168';c.fill();if(patterns[style.texture]){c.globalAlpha=style.textureAlpha??1;c.fillStyle=patterns[style.texture];c.fill();c.globalAlpha=1;}if(style.tint){c.fillStyle=style.tint;c.fill();}
 // Clip edge strokes to this depth strip; artificial strip boundaries must not become mortar joints.
 c.save();c.clip();
 if(style.stroke){c.strokeStyle=style.stroke;c.lineWidth=1;c.beginPath();p.outline.forEach((v,i)=>i?c.lineTo(v.x,v.y-v.z):c.moveTo(v.x,v.y-v.z));c.closePath();c.stroke();}
 if(p.highlight){const index=p.highlight==='nose'?1:0,a=p.outline[index],b=p.outline[index+1];c.strokeStyle='rgba(218,201,162,.55)';c.lineWidth=1.5;c.beginPath();c.moveTo(a.x,a.y-a.z);c.lineTo(b.x,b.y-b.z);c.stroke();}
 c.restore();
 c.restore();
}
