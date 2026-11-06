// Presentation only. Simulation owns durations, positions, hitboxes and movement.
import {nearLivingWater} from './core-abilities.js';
import {coreSkillLevel} from './core-skills.js';
import {coreStat} from './core-skills.js';
import {drawEntitySprite} from './sprites.js';
export function drawCoreArt(ctx,world){
 const core=world.core,p=world.player;if(!core)return;
 drawAdvancedArt(ctx,world);
 const field=core.undertow;
 if(field&&field.areaId===world.areaId&&field.life>0){
  ctx.save();ctx.translate(field.x,field.y);ctx.globalAlpha=Math.min(1,field.life/.5);const scale=coreStat(world,'undertow','radius')/122;ctx.scale(scale*(1+Math.sin(world.elapsed*4)*.03),scale);
  if(!drawEntitySprite(ctx,'core.undertow',{x:0,y:0,time:world.elapsed})){ctx.strokeStyle='#a7eadd';ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(0,0,25+i*28,14+i*16,world.elapsed*.4,0,Math.PI*1.7);ctx.stroke();}}
  ctx.restore();
 }
 for(const shot of world.projectiles)if(shot.coreSkill==='set-the-hook'){
  ctx.save();ctx.strokeStyle='#a8f5dd';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y-8);ctx.lineTo(shot.x,shot.y);ctx.stroke();
  if(!drawEntitySprite(ctx,'core.hook',{x:shot.x,y:shot.y,angle:shot.angle})){ctx.beginPath();ctx.arc(shot.x,shot.y,8,-1,Math.PI);ctx.stroke();}ctx.restore();
 }
 if(core.hook){const a=core.hook.target;ctx.save();ctx.strokeStyle='#b9f8e7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y-8);ctx.lineTo(a.x,a.y);ctx.stroke();ctx.restore();}
 for(const e of world.effects){
  if(e.name!=='riverstep-trail'&&e.name!=='current-return')continue;
  ctx.save();ctx.globalAlpha=Math.max(0,e.life/e.duration);ctx.strokeStyle='#bceee0';ctx.fillStyle='#d0fff0';ctx.lineWidth=2;
  if(e.name==='riverstep-trail'){
   if(!drawEntitySprite(ctx,'core.ripple',{x:e.x,y:e.y})){ctx.beginPath();ctx.ellipse(e.x,e.y,25,9,0,0,Math.PI*2);ctx.stroke();}
  }else{const k=1-e.life/e.duration,x=e.x+(e.toX-e.x)*k,y=e.y+(e.toY-e.y)*k;ctx.shadowBlur=12;ctx.shadowColor='#8af5dd';ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();}
  ctx.restore();
 }
}

function drawAdvancedArt(ctx,w){const c=w.core,p=w.player,t=w.elapsed;ctx.save();ctx.strokeStyle='#b6f7ed';ctx.fillStyle='#65cfc655';ctx.lineWidth=3;
 if(c.wall){ctx.save();ctx.translate(c.wall.x,c.wall.y);ctx.rotate(c.wall.angle);ctx.globalAlpha=Math.min(1,c.wall.life);ctx.beginPath();ctx.moveTo(0,-100);ctx.quadraticCurveTo(45,0,0,100);ctx.lineTo(-12,100);ctx.quadraticCurveTo(25,0,-12,-100);ctx.closePath();ctx.fill();ctx.stroke();for(let i=0;i<6;i++){ctx.beginPath();ctx.arc(10,((t*45+i*33)%200)-100,5,0,Math.PI);ctx.stroke();}ctx.restore();}
 if(c['core-flare']>0||c['chosen-of-reedwater']>0||c.rememberFlash>0){const chosen=c['chosen-of-reedwater']>0;ctx.strokeStyle=chosen||c.rememberFlash>0?'#f3dc95':'#b6f7ed';for(let i=0;i<3;i++){const r=20+(t*28+i*20)%60;ctx.globalAlpha=1-(r-20)/60;ctx.beginPath();ctx.ellipse(p.x,p.y-10,r,r*.5,0,0,Math.PI*2);ctx.stroke();}ctx.globalAlpha=1;ctx.beginPath();ctx.arc(p.x,p.y-22,6+Math.sin(t*5)*2,0,Math.PI*2);ctx.fill();}
 if(coreSkillLevel(w,'delta-bond')>0&&nearLivingWater(w)){ctx.save();ctx.strokeStyle='#d4eab4';ctx.globalAlpha=.6;ctx.beginPath();ctx.ellipse(p.x,p.y+10,28+Math.sin(t*3)*4,10,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 if(c.heronReady){ctx.globalAlpha=.6;ctx.beginPath();ctx.ellipse(p.x,p.y+8,34,12,0,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x-10,p.y-28);ctx.quadraticCurveTo(p.x-35,p.y-65,p.x-9,p.y-65);ctx.lineTo(p.x+6,p.y-61);ctx.moveTo(p.x-15,p.y-35);ctx.lineTo(p.x-28,p.y-9);ctx.stroke();}
 ctx.restore();
}
