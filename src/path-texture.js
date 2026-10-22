// Sample the clear dirt in the supplied scene instead of repeating its entire
// illustrated road network, which would introduce paths that lead nowhere.
let image,texture;
export function pathPattern(ctx,invalidate){
 if(typeof Image==='undefined')return null;
 if(!image){
  image=new Image();
  image.onload=()=>{
   const tile=document.createElement('canvas');tile.width=128;tile.height=64;
   const c=tile.getContext('2d');c.imageSmoothingEnabled=false;
   // Find a clear soil patch, excluding green tufts and banks from the repeat.
   const source=document.createElement('canvas');source.width=image.naturalWidth;source.height=image.naturalHeight;
   const sourceCtx=source.getContext('2d');sourceCtx.drawImage(image,0,0);
   const pixels=sourceCtx.getImageData(0,0,source.width,source.height).data;
   const sw=80,sh=48;let sx=0,sy=0,best=-1;
   for(let y=0;y<=source.height-sh;y+=12)for(let x=0;x<=source.width-sw;x+=12){
    let score=0;
    for(let dy=0;dy<sh;dy+=4)for(let dx=0;dx<sw;dx+=4){const i=((y+dy)*source.width+x+dx)*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(r>g*.99&&g>b*1.15&&r>140)score++;}
    if(score>best){best=score;sx=x;sy=y;}
   }
   for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    c.save();c.translate(col?128:0,row?64:0);c.scale(col?-1:1,row?-1:1);
    c.drawImage(image,sx,sy,sw,sh,0,0,64,32);c.restore();
   }
   texture=tile;invalidate();
  };
  image.src=new URL('../assets/reedwater-paths.png',import.meta.url).href;
 }
 return texture?ctx.createPattern(texture,'repeat'):null;
}
