import {SPRITES} from './sprite-definitions.js';
const images=new Map();
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
 const rect=frameRect(definition,frameIndex(definition,state,time,{direction,duration}),img.naturalWidth,img.naturalHeight);
 if(!rect)return false;
 const [sx,sy,sw,sh]=rect;
 if(![sx,sy,sw,sh].every(Number.isFinite)||sx<0||sy<0||sw<=0||sh<=0||sx+sw>img.naturalWidth||sy+sh>img.naturalHeight)return false;
 const scale=definition.scale??1;if(!Number.isFinite(scale)||scale<=0)return false;
 const w=sw*scale,h=sh*scale,[ax,ay]=definition.anchor||[.5,1],[ox,oy]=definition.offset||[0,0];
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x+ox),Math.round(y+oy));if(angle)ctx.rotate(angle);if(flipX)ctx.scale(-1,1);
 ctx.drawImage(img,sx,sy,sw,sh,-w*ax,-h*ay,w,h);ctx.restore();return true;
}
export function drawEntitySprite(ctx,id,pose={}){
 const def=SPRITES[id];
 const flipX=pose.flipX??(def?.mirror==='left'?pose.facingX>0:def?.mirror==='right'?pose.facingX<0:false);
 return drawSprite(ctx,def,{...pose,flipX});
}
export const clearSpriteCache=()=>images.clear();
