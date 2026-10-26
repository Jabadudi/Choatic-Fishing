import {currentScene,cabinDamaged} from './story.js';
// Visual clock only. No simulation state or randomness is consumed here.
export function drawStoryWeather(c,w,v,time){
 if(!w.story||!v)return;
 const scene=currentScene(w),weather=scene?.weather;
 c.save();
 if(weather==='blackout'){c.fillStyle='#080d14';c.fillRect(v.left,v.top,v.right-v.left,v.bottom-v.top);}
 else if(weather==='storm'){
  c.fillStyle='#102036c9';c.fillRect(v.left,v.top,v.right-v.left,v.bottom-v.top);
  c.strokeStyle='#bacdda66';c.lineWidth=1.5;
  for(let i=0;i<120;i++){const x=v.left+((i*83+time*160)%(v.right-v.left+60))-30,y=v.top+((i*137+time*430)%(v.bottom-v.top+80))-40;c.beginPath();c.moveTo(x,y);c.lineTo(x-12,y+30);c.stroke();}
 }else if(cabinDamaged(w.story)){
  const width=v.right-v.left,height=v.bottom-v.top;
  c.fillStyle='#adc8d02c';c.fillRect(v.left,v.top,width,height);
  for(let i=0;i<3;i++){
   const y=v.top+height*(.2+i*.3)+Math.sin(time*.1+i)*16,band=c.createLinearGradient(0,y-55,0,y+55);
   band.addColorStop(0,'#c9dce000');band.addColorStop(.5,'#c9dce027');band.addColorStop(1,'#c9dce000');
   c.fillStyle=band;c.fillRect(v.left,y-55,width,110);
  }
 }
 c.restore();
}
