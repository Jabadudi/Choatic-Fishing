import {drawDrop} from './drops.js';
import {cabinDamaged,pendingScene} from './story.js';
import {visibleWildlife} from './wildlife.js';
import {drawWildlife,drawAnimalStatus} from './wildlife-art.js';
import {drawEntitySprite} from './sprites.js';
import {drawTerrain} from './terrain.js';
import {drawWilds,drawWildsLabels,drawDepthSorted,drawExplorer} from './wilds.js';
import {drawRabbits,drawRabbit,visibleRabbits} from './rabbits.js';
import {drawAtmosphere} from './atmosphere.js';
import {visibleNpcs,drawNpc} from './npcs.js';
import {nightAttackActors} from './story-action.js';
export function render(ctx,world,view){
 const {elapsed:t,player:p,bobber}=world;
 const actors=[];
 if(world.adventure){
  // Player and rabbits join the scenery in one ground-order pass; feet sit about 12 units below the explorer's centre.
  drawWilds(ctx,world,view);
  actors.push({y:p.y+12,ref:p});for(const r of visibleRabbits(world,view))actors.push({y:r.y,ref:r});
  for(const a of visibleWildlife(world,view))actors.push({y:a.y+14,ref:a});
  for(const drop of world.drops||[])if(drop.areaId===world.areaId)actors.push({y:drop.y+5,ref:drop});
  for(const n of visibleNpcs(world,view))actors.push({y:n.sortY??n.y+14,ref:n});
  for(const a of nightAttackActors(world))actors.push({y:a.y+14,ref:{...a,cutscene:true}});
  drawDepthSorted(ctx,world,view||{left:p.x-700,right:p.x+700,top:p.y-500,bottom:p.y+500},actors,(c,ref)=>ref===p?drawPlayer(c,world):ref.cutscene?drawCutsceneActor(c,ref):ref.entityType==='pickup'?drawDrop(c,ref,t):ref.npc?drawNpc(c,ref,t):ref.species==='rabbit'?drawRabbit(c,ref):drawWildlife(c,ref));
 }else{drawTerrain(ctx,world);drawRabbits(ctx,world,view);}
  for(const bot of world.actors.filter(actor=>actor!==world.player)){
    if(bot.health<=0)continue;
    if(bot.bobber){ctx.strokeStyle='#eee3bf99';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bot.x,bot.y);ctx.lineTo(bot.bobber.x,bot.bobber.y);ctx.stroke();ctx.fillStyle=bot.color;ctx.beginPath();ctx.arc(bot.bobber.x,bot.bobber.y,4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#243e3a55';ctx.beginPath();ctx.ellipse(bot.x,bot.y+13,18,8,0,0,Math.PI*2);ctx.fill();
    if(!drawEntitySprite(ctx,bot.spriteId||'player',{x:bot.x,y:bot.y,state:bot.animationState||'idle',time:t})){ctx.save();ctx.translate(bot.x,bot.y);ctx.rotate(bot.angle);ctx.fillStyle=bot.color;ctx.strokeStyle='#243d3e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f0d8b1';ctx.fillRect(8,-6,12,12);ctx.restore();}
    ctx.textAlign='center';ctx.fillStyle='#20322c';ctx.fillRect(bot.x-23,bot.y-30,46,5);ctx.fillStyle=bot.color;ctx.fillRect(bot.x-23,bot.y-30,46*bot.health/bot.progression.maxHealth,5);
    ctx.font='bold 10px Arial';ctx.fillStyle='#fff3db';ctx.fillText(bot.name,bot.x,bot.y-36);
    ctx.font='8px Arial';ctx.fillStyle='#263e35';ctx.fillText(bot.fishing.state!=='idle'?'FISHING':bot.inventory.item?.name||'TO SHORE',bot.x,bot.y+29);
  }
  for(const shot of world.projectiles){ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate(shot.angle);if(drawEntitySprite(ctx,shot.spriteId||`projectile.${shot.kind}`,{x:0,y:0,state:'idle',time:t})){ctx.restore();continue;}ctx.fillStyle=shot.kind==='wave'?'#a0eee2':shot.kind==='bomb'?'#e2c27c':'#fff0c8';if(shot.kind==='wave'){ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(0,0,12,shot.radius,0,0,Math.PI*2);ctx.fill();}else if(shot.kind==='bomb'){ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();}else ctx.fillRect(-10,-3,20,6);ctx.restore();}
  if(!world.adventure){
  drawBobber(ctx,world);
  ctx.fillStyle='#243e3a55';ctx.beginPath();ctx.ellipse(p.x,p.y+14,18,8,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#b8db94';ctx.strokeStyle='#243d3e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f0d8b1';ctx.fillRect(8,-7,11,14);ctx.strokeStyle='#d8bd86';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(4,7);ctx.lineTo(29,7);ctx.stroke();ctx.restore();
  ctx.fillStyle='#edf3df';ctx.font='bold 10px Arial';ctx.fillText('YOU',p.x,p.y-25);
  }
  for(const effect of world.effects){
    const duration=effect.duration||(['defeat','Whirlpool Burst'].includes(effect.name)?.8:.55);
    const age=Math.max(0,duration-effect.life);ctx.save();ctx.globalAlpha=Math.min(1,effect.life/duration);ctx.translate(effect.x,effect.y);ctx.rotate(effect.angle);
    ctx.strokeStyle='#f3d59d';ctx.fillStyle='#f3d59d';ctx.lineWidth=5;
    if(effect.name==='animal-hit'||effect.name==='hunt'){ctx.font=effect.name==='hunt'?'bold 12px monospace':'bold 14px monospace';ctx.textAlign='center';ctx.fillStyle=effect.name==='hunt'?'#f8e6a7':'#fff4e4';ctx.fillText(effect.label,0,-age*30);}
    else if(['Harpoon Gun','Old Boot','Pufferfish Bomb'].includes(effect.name)){ctx.fillRect(18,-3,8,6);}
    else if(effect.name==='Whirlpool Burst'){ctx.strokeStyle='#a0eee2';ctx.beginPath();ctx.arc(0,0,155*(1-effect.life/.8),0,Math.PI*2);ctx.stroke();}
    else if(effect.name==='explosion'||effect.name==='defeat'){ctx.beginPath();ctx.arc(0,0,10+age*150,0,Math.PI*2);ctx.stroke();}
    else if(effect.name==='Sardine'){ctx.fillStyle='#b9db8c';ctx.font='bold 25px Arial';ctx.fillText('SNACK',0,-30-age*40);}
    else if(effect.name==='Grappling Squid'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(140,0);ctx.stroke();}
    else{ctx.beginPath();ctx.arc(0,0,effect.name==='Anchor'?72:48,-1+age*2,1+age*2);ctx.stroke();}
    ctx.restore();
  }
  if(world.adventure){drawWildsLabels(ctx,world,view||{left:p.x-700,right:p.x+700,top:p.y-500,bottom:p.y+500});if(view&&!['cabin','chief-house'].includes(world.areaId)&&!cabinDamaged(world.story))drawAtmosphere(ctx,world,view);drawAnimalStatus(ctx,world);}
}
function drawBobber(ctx,world){
 const {elapsed:t,player:p,bobber}=world;if(!bobber)return;
 ctx.strokeStyle='#f1e6c7';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x+Math.cos(p.angle)*23,p.y+Math.sin(p.angle)*23);ctx.lineTo(bobber.x,bobber.y);ctx.stroke();ctx.strokeStyle='#99c8b788';ctx.beginPath();ctx.ellipse(bobber.x,bobber.y+4,12+Math.sin(t*3)*3,5,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ef947a';ctx.beginPath();ctx.arc(bobber.x,bobber.y,5,0,Math.PI*2);ctx.fill();
}
function drawPlayer(ctx,world){
 drawBobber(ctx,world);
 // Eli stays down in the mud from the collapse until the blackout.
 const fallen=world.story?.scene==='storm'&&['collapse','rescue'].includes(pendingScene(world)?.action);
 if(fallen){const p=world.player;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/2);drawExplorer(ctx,{...p,x:0,y:0},world.elapsed||0);ctx.restore();}
 else drawExplorer(ctx,world.player,world.elapsed||0);
}
// Cutscene actors are poses computed by story-action.js. Visible silhouettes stand in while sheets load.
function drawCutsceneActor(ctx,a){
 const y=a.y-(a.lift||0);
 ctx.fillStyle='#0b101855';ctx.beginPath();ctx.ellipse(a.x,a.y+14,a.spriteId==='nightwalker'?17:22,6,0,0,Math.PI*2);ctx.fill();
 if(drawEntitySprite(ctx,a.spriteId,{...a,y}))return;
 ctx.save();ctx.translate(Math.round(a.x),Math.round(y));
 if(a.spriteId==='nightwalker'){
  ctx.globalAlpha=a.state==='death'?Math.max(0,1-a.time/1.3):1;
  ctx.fillStyle='#1c1820';ctx.beginPath();ctx.moveTo(-13,15);ctx.lineTo(-8,-30);ctx.lineTo(0,-40);ctx.lineTo(8,-30);ctx.lineTo(13,15);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#8d8a86';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(4,-4);ctx.lineTo(a.state==='raise'?10:20,a.state==='raise'?-36:8);ctx.stroke();
 }else{
  ctx.scale(a.facingX<0?-1:1,1);ctx.fillStyle='#b8bcc4';ctx.beginPath();ctx.ellipse(0,-4,24,11,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(22,-14,9,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#8f949c';ctx.fillRect(-16,4,5,11);ctx.fillRect(12,4,5,11);
 }
 ctx.restore();
}
