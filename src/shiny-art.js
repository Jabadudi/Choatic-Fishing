// Shiny look: the creature's normal artwork washed in gold, a warm glow at its feet and sparkles drifting off it.
// Drawing only. Works the same for sprites and drawn fallbacks, and never touches gameplay state or randomness.
const GOLD='#ffd36a';
let layer=null;
// The tint is painted on a small offscreen layer so it only colours the creature's own pixels.
function tinted(c,x,y,draw){
 if(typeof document==='undefined'){draw(c);return;}
 layer??=Object.assign(document.createElement('canvas'),{width:180,height:180});
 const l=layer.getContext('2d');l.setTransform(1,0,0,1,0,0);l.globalCompositeOperation='source-over';l.globalAlpha=1;l.clearRect(0,0,180,180);
 l.setTransform(1,0,0,1,90-Math.round(x),130-Math.round(y));draw(l);
 l.setTransform(1,0,0,1,0,0);l.globalCompositeOperation='source-atop';l.globalAlpha=.62;l.fillStyle='#ffb92e';l.fillRect(0,0,180,180);
 // A soft gold outline glow around the creature's own silhouette.
 c.save();c.imageSmoothingEnabled=false;c.shadowColor='#fff0a0';c.shadowBlur=12;c.drawImage(layer,Math.round(x)-90,Math.round(y)-130);c.restore();
}
export function drawShiny(c,a,time,draw){
 const x=a.x,y=a.y,alive=a.health>0;
 c.save();
 if(alive){const glow=c.createRadialGradient(x,y,2,x,y,34);glow.addColorStop(0,`${GOLD}77`);glow.addColorStop(1,`${GOLD}00`);c.fillStyle=glow;c.beginPath();c.ellipse(x,y,34,14,0,0,Math.PI*2);c.fill();}
 c.restore();
 tinted(c,x,y,draw);
 if(!alive)return;
 c.save();
 for(let i=0;i<5;i++){const t=(time*.6+i/5)%1,sx=Math.round(x+Math.sin(time*1.7+i*1.9)*20),sy=Math.round(y-10-t*46);c.globalAlpha=(1-t)*.95;c.fillStyle=i%2?'#fffbe6':GOLD;c.fillRect(sx-1,sy-3,2,7);c.fillRect(sx-3,sy-1,7,2);}
 c.restore();
}
export const SHINY_GOLD=GOLD;
