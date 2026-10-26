// Walk-in rooms drawn the way Stardew Valley draws them: the back wall shows its whole face,
// the side and front walls only their tops, with a gap for the door. Tiles come from PROPS as
// `${style}-floor`, `${style}-wall`, `${style}-wall-top` and `${style}-wall-side`; until they load the
// room paints flat colours from the fallback palette.
import {drawTiles} from './sprites.js';
export function roomWalls({width,height,wall,door:[dl,dr],side=20,front=14}){
 const bottom=height-20-front;
 return {inner:[10+side,width-10-side],wall,bottom,door:[dl,dr],
  blocked:(x,y,pad=12)=>y<wall||x<10+side+pad-2||x>width-10-side-pad+2||(y>bottom-pad+2&&(x<dl+pad||x>dr-pad))};
}
export function drawRoomShell(c,{width,height,wall,door:[dl,dr],side=20,front=14},style,{floor,wallFill,paintWall,floorTile=[96,58.5]}){
 const L=10+side,R=width-10-side,B=height-20-front;
 c.fillStyle='#120e0b';c.fillRect(0,0,width,height);
 if(!drawTiles(c,`${style}-floor`,{x:L,y:wall,w:R-L,h:B-wall,tw:floorTile[0],th:floorTile[1]})){
  c.fillStyle=floor[0];c.fillRect(L,wall,R-L,B-wall);
  for(let y=wall,row=0;y<B;y+=16,row++){c.fillStyle=floor[1];c.fillRect(L,y,R-L,2);c.fillStyle=floor[2];c.fillRect(L,y+2,R-L,1);for(let x=L+(row%3)*32;x<R;x+=96){c.fillStyle=floor[1];c.fillRect(x,y,2,16);}}
 }
 if(!drawTiles(c,`${style}-wall`,{x:L,y:10,w:R-L,h:wall-10,th:wall-10})){c.fillStyle=wallFill;c.fillRect(L,10,R-L,wall-10);paintWall(c,L,10,R-L,wall-10);}
 // Shadow where the floor meets the wall.
 const g=c.createLinearGradient(0,wall,0,wall+18);g.addColorStop(0,'rgba(20,12,6,.35)');g.addColorStop(1,'rgba(20,12,6,0)');c.fillStyle=g;c.fillRect(L,wall,R-L,18);
 const tops=[[10,0,side,height-20],[R,0,side,height-20],[10,0,width-20,10],[10,B,dl-10,front],[dr,B,width-10-dr,front]];
 for(const [x,y,w,h] of tops){
  const upright=h>w;
  if(!drawTiles(c,`${style}-wall-${upright?'side':'top'}`,upright?{x,y,w,h,tw:w}:{x,y,w,h,th:h})){c.fillStyle='#3b2a1e';c.fillRect(x,y,w,h);c.fillStyle='#5b4130';c.fillRect(x+2,y+2,w-4,h-4);}
  c.fillStyle='rgba(18,12,8,.35)';c.fillRect(x,y,w,h);
 }
 c.fillStyle='#2a1d14';c.fillRect(dl,B,dr-dl,height-B);
}
