// Smooth material coverage, never the artwork itself. The software path also works
// on mobile browsers without CanvasRenderingContext2D.filter.
export function blurMask(mask,target,radius){
 target.clearRect(0,0,mask.width,mask.height);
 if('filter' in target){target.filter=`blur(${radius}px)`;target.drawImage(mask,0,0);target.filter='none';return;}
 const {width:w,height:h}=mask,source=mask.getContext('2d').getImageData(0,0,w,h),pixels=source.data;
 let a=new Float32Array(w*h),b=new Float32Array(w*h);
 for(let i=0;i<a.length;i++)a[i]=pixels[i*4+3];
 // Three separable box passes approximate a Gaussian; r=3 gives sigma≈3.46.
 const r=Math.max(1,Math.floor(radius)),span=2*r+1;
 for(let pass=0;pass<3;pass++){
  for(let y=0;y<h;y++){
   const row=y*w;let sum=0;for(let k=-r;k<=r;k++)sum+=a[row+Math.max(0,Math.min(w-1,k))];
   for(let x=0;x<w;x++){b[row+x]=sum/span;sum+=a[row+Math.min(w-1,x+r+1)]-a[row+Math.max(0,x-r)];}
  }
  for(let x=0;x<w;x++){
   let sum=0;for(let k=-r;k<=r;k++)sum+=b[Math.max(0,Math.min(h-1,k))*w+x];
   for(let y=0;y<h;y++){a[y*w+x]=sum/span;sum+=b[Math.min(h-1,y+r+1)*w+x]-b[Math.max(0,y-r)*w+x];}
  }
 }
 for(let i=0;i<a.length;i++){pixels[i*4]=pixels[i*4+1]=pixels[i*4+2]=255;pixels[i*4+3]=Math.round(a[i]);}
 target.putImageData(source,0,0);
}
