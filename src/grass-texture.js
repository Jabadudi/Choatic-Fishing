// Preserve the supplied artwork; mirrored repeats avoid abrupt outer-edge seams.
let image,texture;
export function drawGrassBase(ctx,left,top,width,height,invalidate){
 if(typeof Image==='undefined')return false;
 if(!image){
  image=new Image();
  image.onload=()=>{
   const tile=document.createElement('canvas');tile.width=1024;tile.height=512;
   const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
   for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    c.save();c.translate(col?1024:0,row?512:0);c.scale(col?-1:1,row?-1:1);
    c.drawImage(image,0,0,512,256);c.restore();
   }
   texture=tile;invalidate();
  };
  image.src=new URL('../assets/reedwater-grass.png',import.meta.url).href;
 }
 if(!texture)return false;
 const pattern=ctx.createPattern(texture,'repeat');
 if(!pattern)return false;
 ctx.fillStyle=pattern;ctx.fillRect(left,top,width,height);return true;
}
