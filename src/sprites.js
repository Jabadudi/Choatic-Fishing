import {SPRITES,PROPS} from './sprite-definitions.js';
const images=new Map();
const keyedImages=new Map();
export function greenMattePixel(r,g,b){return g>100&&g>r*1.45&&g>b*1.35;}
function imageSource(img,definition,url){
 if(definition.chromaKey!=='green')return img;
 if(typeof document==='undefined')return null;
 if(keyedImages.has(url))return keyedImages.get(url);
 const surface=document.createElement('canvas');surface.width=img.naturalWidth;surface.height=img.naturalHeight;
 const c=surface.getContext('2d',{willReadFrequently:true});
 try{c.drawImage(img,0,0);const pixels=c.getImageData(0,0,surface.width,surface.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4)if(greenMattePixel(d[i],d[i+1],d[i+2]))d[i+3]=0;
  c.putImageData(pixels,0,0);
  // The keying canvas is kept in memory for pixel reads; a plain copy can live on the GPU, so drawing it each frame needs no upload.
  const keyed=document.createElement('canvas');keyed.width=surface.width;keyed.height=surface.height;keyed.getContext('2d').drawImage(surface,0,0);
  keyedImages.set(url,keyed);return keyed;
 }catch{keyedImages.set(url,null);return null;}
}
export function spriteAssetUrl(asset){
 const url=new URL(`../assets/${asset}`,import.meta.url);
 // Versioned deployment folders also version image requests, even if the filename stays the same.
 const folder=new URL('.',import.meta.url).pathname.split('/').filter(Boolean).at(-1);
 if(folder?.startsWith('game-'))url.searchParams.set('v',folder.slice(5));
 return url.href;
}
export function frameIndex(definition,state='idle',time=0,{direction,duration}={}){
 const clips=definition.animations||{},clip=clips[`${state}:${direction}`]||clips[state]||clips.idle;
 if(!clip?.frames?.length)return 0;
 const clock=Math.max(0,Number.isFinite(time)?time:0),rate=duration>0?clip.frames.length/duration:clip.fps||1;
 const step=Math.floor(clock*rate),index=clip.loop===false?Math.min(clip.frames.length-1,step):step%clip.frames.length;
 return clip.frames[index];
}
export function frameRect(definition,index,imageWidth,imageHeight){
 if(definition.frames)return definition.frames[index]||null;
 if(definition.frameSize){const [w,h]=definition.frameSize,columns=definition.columns||Math.floor(imageWidth/w);if(columns<1)return null;return [(index%columns)*w,Math.floor(index/columns)*h,w,h];}
 return [0,0,imageWidth,imageHeight];
}
export const spriteFrame=(id,state,time,options)=>frameIndex(SPRITES[id]||{},state,time,options);
export function drawSprite(ctx,definition,{x=0,y=0,state='idle',time=0,direction,duration,flipX=false,angle=0}={}){
 if(!definition?.asset||typeof Image==='undefined')return false;
 const url=spriteAssetUrl(definition.asset);let img=images.get(url);
 if(!img){img=new Image();images.set(url,img);img.src=url;}
 if(!img.complete||!img.naturalWidth||!img.naturalHeight)return false;
 const source=imageSource(img,definition,url);if(!source)return false;
 const rect=frameRect(definition,frameIndex(definition,state,time,{direction,duration}),img.naturalWidth,img.naturalHeight);
 if(!rect)return false;
 const [sx,sy,sw,sh]=rect;
 if(![sx,sy,sw,sh].every(Number.isFinite)||sx<0||sy<0||sw<=0||sh<=0||sx+sw>img.naturalWidth||sy+sh>img.naturalHeight)return false;
 const scale=definition.scale??1;if(!Number.isFinite(scale)||scale<=0)return false;
 const w=sw*scale,h=sh*scale,[ax,ay]=definition.anchor||[.5,1],[ox,oy]=definition.offset||[0,0];
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x+ox),Math.round(y+oy));if(angle)ctx.rotate(angle);if(flipX)ctx.scale(-1,1);
 ctx.drawImage(source,sx,sy,sw,sh,-w*ax,-h*ay,w,h);ctx.restore();return true;
}
export function drawEntitySprite(ctx,id,pose={}){
 const def=SPRITES[id];
 const clips=def?.animations||{},state=pose.state||'idle';
 // A clip drawn for the requested direction already faces that way. A missing one can borrow its mirror image, e.g. left from right.
 if(clips[`${state}:${pose.direction}`])return drawSprite(ctx,def,{...pose,flipX:pose.flipX??false});
 const twin=def?.mirrorDirections?.[pose.direction];
 if(twin&&clips[`${state}:${twin}`])return drawSprite(ctx,def,{...pose,direction:twin,flipX:pose.flipX??true});
 const flipX=pose.flipX??(def?.mirror==='left'?pose.facingX>0:def?.mirror==='right'?pose.facingX<0:false);
 return drawSprite(ctx,def,{...pose,flipX});
}
const propListeners=new Set();
// Cached scenery (terrain chunks) registers here to repaint once a prop image arrives.
export const onPropLoad=fn=>propListeners.add(fn);
// Fits a prop inside a w×h box whose bottom centre sits at (x,y). Returns false until the image is ready.
export const drawProp=(ctx,id,box)=>!!PROPS[id]&&drawFitted(ctx,PROPS[id],box,true);
// Same fit for any image under assets/, such as item icons. Nothing repaints when it loads, since the next frame draws it.
// It keeps sub-pixel positions, so a small floating motion glides instead of stepping.
export const drawImageAsset=(ctx,asset,box)=>drawFitted(ctx,asset,box,false);
function drawFitted(ctx,asset,{x,y,w,h,flipX=false},notify){
 if(typeof Image==='undefined')return false;
 const url=spriteAssetUrl(asset);let img=images.get(url);
 if(!img){img=new Image();if(notify)img.onload=()=>propListeners.forEach(fn=>fn());images.set(url,img);img.src=url;}
 if(!img.complete||!img.naturalWidth||!img.naturalHeight)return false;
 const k=Math.min(w/img.naturalWidth,h/img.naturalHeight),dw=img.naturalWidth*k,dh=img.naturalHeight*k;
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(notify)ctx.translate(Math.round(x),Math.round(y));else ctx.translate(x,y);if(flipX)ctx.scale(-1,1);
 ctx.drawImage(img,-dw/2,-dh,dw,dh);ctx.restore();return true;
}
// Repeats a tile image across a rectangle, each tile drawn tw×th, starting at the rectangle's corner.
// Tile ids are listed in PROPS like any other prop.
export function drawTiles(ctx,id,{x,y,w,h,tw,th}){
 if(!PROPS[id]||typeof Image==='undefined')return false;
 const url=spriteAssetUrl(PROPS[id]);let img=images.get(url);
 if(!img){img=new Image();img.onload=()=>propListeners.forEach(fn=>fn());images.set(url,img);img.src=url;}
 if(!img.complete||!img.naturalWidth||!img.naturalHeight)return false;
 const pattern=ctx.createPattern(img,'repeat');if(!pattern)return false;
 // Give one side of the tile and the other follows the image's proportions.
 tw??=th*img.naturalWidth/img.naturalHeight;th??=tw*img.naturalHeight/img.naturalWidth;
 if(pattern.setTransform&&typeof DOMMatrix!=='undefined')pattern.setTransform(new DOMMatrix().translate(x,y).scale(tw/img.naturalWidth,th/img.naturalHeight));
 ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle=pattern;ctx.fillRect(x,y,w,h);ctx.restore();return true;
}
// Scenery props are small; fetching them all early lets the terrain cache repaint once, before the player reaches them.
export function preloadProps(){
 if(typeof Image==='undefined')return;
 for(const id of Object.keys(PROPS)){const url=spriteAssetUrl(PROPS[id]);if(images.has(url))continue;const img=new Image();img.onload=()=>propListeners.forEach(fn=>fn());images.set(url,img);img.src=url;}
}
export const clearSpriteCache=()=>{images.clear();keyedImages.clear();};
