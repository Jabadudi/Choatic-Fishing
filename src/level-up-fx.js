// The level-up burst over Eli, after classic MapleStory: a pillar of light from his feet, a ring on the ground,
// sparks spiralling up and a gold "LEVEL UP!" that pops in. It follows him while it plays.
// Drawing only: no gradients are kept, no randomness is used, and the spark count stays small for phones.
export const LEVEL_UP_SECONDS=3,SKILL_UP_SECONDS=2.2;
const LOOKS={
 level:{title:'LEVEL UP!',size:22,height:170,width:34,sparks:26,core:'#fff6c8',glow:'255,214,92',ring:'#ffe28a',text:'#ffd84a',edge:'#5a2c06',sub:'#fff3c4'},
 skill:{title:'SKILL UP!',size:16,height:115,width:24,sparks:14,core:'#effbd8',glow:'170,232,120',ring:'#d6f5a6',text:'#c8f07a',edge:'#16310f',sub:'#eefbd8'}
};
const ease=t=>1-(1-t)**3;
// A fixed pseudo-random value per spark, so every frame agrees without touching the game's random source.
const hash=n=>{const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);};

export function levelUpEffect(world,label,kind='level'){
 return {name:'level-up',burst:kind,label,x:world.player.x,y:world.player.y,angle:0,life:kind==='skill'?SKILL_UP_SECONDS:LEVEL_UP_SECONDS,duration:kind==='skill'?SKILL_UP_SECONDS:LEVEL_UP_SECONDS};
}

// Two layers: 'back' (pillar and ground rings) goes under Eli so he stays visible, 'front' (sparks and title) over him.
export function drawLevelBurst(ctx,effect,anchor,layer='front'){
 const look=LOOKS[effect.burst]||LOOKS.level,duration=effect.duration||LEVEL_UP_SECONDS,age=Math.max(0,duration-effect.life);
 const fadeOut=Math.min(1,effect.life/.6),x=Math.round(anchor?.x??effect.x),feet=Math.round((anchor?.y??effect.y)+15);
 ctx.save();ctx.translate(x,feet);
 if(layer==='back'){
  // Pillar: shoots up fast, holds, then thins and fades. Soft layers keep it readable on grass and on sand.
  const rise=ease(Math.min(1,age/.25)),beam=age<1?1:Math.max(0,1-(age-1)/.9);
  if(beam>0){
   const h=look.height*rise,w=look.width*(.5+.5*beam);
   for(const [scale,alpha,colour] of [[1.5,.16,look.glow],[1,.28,look.glow],[.55,.5,look.glow],[.22,.85,'255,255,240']]){ctx.fillStyle=`rgba(${colour},${alpha*beam})`;ctx.fillRect(-w*scale/2,-h,w*scale,h);}
   ctx.fillStyle=`rgba(${look.glow},${.3*beam})`;for(let i=0;i<4;i++){const s=(1-i/4)*w;ctx.fillRect(-s/2,-h-(i+1)*6,s,6);}
   // Thin rays race up the beam.
   ctx.fillStyle=`rgba(255,255,235,${.8*beam})`;
   for(let i=0;i<5;i++){const lane=(hash(i+200)-.5)*w*.9,ray=((age*1.6+hash(i+220))%1)*h,len=10+hash(i+240)*14;ctx.fillRect(Math.round(lane),-Math.round(ray)-len,1,len);}
  }

  // Ground ring and a second, slower one.
  for(const [delay,reach] of [[0,64],[.18,44]]){
   const t=(age-delay)/.6;if(t<0||t>1)continue;
   ctx.globalAlpha=(1-t)*.9;ctx.strokeStyle=look.ring;ctx.lineWidth=3*(1-t)+1;
   ctx.beginPath();ctx.ellipse(0,0,6+reach*ease(t),(6+reach*ease(t))*.32,0,0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();return;
 }
 ctx.globalCompositeOperation='lighter';
 // A faint wash over Eli himself while the pillar holds.
 const wash=age<1?.18:Math.max(0,.18*(1-(age-1)/.9));
 if(wash>0){ctx.fillStyle=`rgba(${look.glow},${wash})`;ctx.fillRect(-look.width*.4,-60,look.width*.8,60);}

 // Sparks spiral up around Eli, each starting a little later than the last.
 for(let i=0;i<look.sparks;i++){
  const start=hash(i)*1.2,life=1+hash(i+40)*.7,t=(age-start)/life;if(t<0||t>1)continue;
  const a=hash(i+80)*Math.PI*2+t*4,r=10+hash(i+120)*18,sx=Math.cos(a)*r,sy=-t*look.height*(.6+hash(i+160)*.5),size=hash(i)>.6?4:2;
  ctx.globalAlpha=(1-t)*(Math.sin(age*18+i)>-.4?1:.35);ctx.fillStyle=i%3?look.ring:look.core;
  ctx.fillRect(Math.round(sx)-size,Math.round(sy),size*2+1,1);ctx.fillRect(Math.round(sx),Math.round(sy)-size,1,size*2+1);
 }
 ctx.restore();

 // Title: pops past full size, settles, drifts up and fades at the end.
 const pop=age<.12?ease(age/.12)*1.3:age<.26?1.3-.3*ease((age-.12)/.14):1,ty=-84-age*5;
 ctx.save();ctx.translate(x,feet+ty);ctx.globalAlpha=fadeOut;ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineJoin='round';
 // On small screens the camera zooms out, so the title grows back toward a readable size.
 const c=ctx.canvas,zoom=(ctx.getTransform?.()?.a||1)*(c?.clientWidth&&c.width?c.clientWidth/c.width:1),grow=Math.min(1.8,Math.max(1,.9/zoom));
 ctx.scale(pop*grow,pop*grow);ctx.font=`bold ${look.size}px monospace`;
 ctx.lineWidth=5;ctx.strokeStyle=look.edge;ctx.strokeText(look.title,0,0);
 ctx.fillStyle=look.text;ctx.fillText(look.title,0,0);
 // A bright band across the top half of the letters, like the old bitmap fonts.
 ctx.save();ctx.beginPath();ctx.rect(-200,-look.size,400,look.size*.42);ctx.clip();ctx.fillStyle=look.core;ctx.fillText(look.title,0,0);ctx.restore();
 if(effect.label&&age>.2){
  ctx.globalAlpha=fadeOut*Math.min(1,(age-.2)/.2);ctx.font=`bold ${Math.round(look.size*.55)}px monospace`;ctx.lineWidth=3;
  ctx.strokeText(effect.label,0,look.size*.95);ctx.fillStyle=look.sub;ctx.fillText(effect.label,0,look.size*.95);
 }
 ctx.restore();
}
