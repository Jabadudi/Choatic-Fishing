import {drawDrop} from './drops.js';
import {cabinDamaged,pendingScene} from './story.js';
import {visibleWildlife} from './wildlife.js';
import {drawWildlife,drawAnimalStatus} from './wildlife-art.js';
import {drawEntitySprite} from './sprites.js';
import {facingFor} from './entities.js';
import {drawTerrain} from './terrain.js';
import {drawWilds,drawWildsLabels,drawDepthSorted,drawExplorer,INTERIOR_AREAS,areaFor} from './wilds.js';
import {drawRabbits,drawRabbit,visibleRabbits} from './rabbits.js';
import {drawAtmosphere} from './atmosphere.js';
import {visibleNpcs,drawNpc,drawQuestMarker} from './npcs.js';
import {questMarker} from './side-quests.js';
import {nightAttackActors} from './story-action.js';
import {drawFamiliar,drawShard} from './familiar-art.js';
import {drawRadioBeside,radioBesideEli} from './radio-art.js';
import {drawLevelBurst} from './level-up-fx.js';
// others: players from the shared world standing in this area (hub.js); drawn with the scenery like Eli.
export function render(ctx,world,view,{others=[]}={}){
 const {elapsed:t,player:p,bobber}=world;
 const actors=[];
 if(world.adventure){
  // Player and rabbits join the scenery in one ground-order pass; feet sit about 12 units below the explorer's centre.
  drawWilds(ctx,world,view);
  actors.push({y:p.y+12,ref:p});for(const o of others)actors.push({y:o.y+12,ref:o});for(const r of visibleRabbits(world,view))actors.push({y:r.y,ref:r});
  for(const a of visibleWildlife(world,view))actors.push({y:a.y+14,ref:a});
  if(world.companion?.areaId===world.areaId)actors.push({y:world.companion.y+4,ref:world.companion});
  for(const drop of world.drops||[])if(drop.areaId===world.areaId)actors.push({y:drop.y+5,ref:drop});
  const radio=radioBesideEli(world);if(radio)actors.push({y:radio.y+8,ref:radio});
  for(const n of visibleNpcs(world,view))actors.push({y:n.sortY??n.y+14,ref:n});
  for(const a of nightAttackActors(world))actors.push({y:a.y+14,ref:{...a,cutscene:true}});
  drawDepthSorted(ctx,world,view||{left:p.x-700,right:p.x+700,top:p.y-500,bottom:p.y+500},actors,(c,ref)=>ref===p?drawPlayer(c,world):ref.remote?drawOtherPlayer(c,ref,t):ref.radio?drawRadioBeside(c,ref,t):ref.cutscene?drawCutsceneActor(c,ref):ref===world.companion?drawFamiliar(c,ref,t):ref.entityType==='pickup'?(ref.item.familiar?drawShard(c,ref,t):drawDrop(c,ref,t)):ref.npc?drawNpc(c,ref,t):ref.species==='rabbit'?drawRabbit(c,ref):drawWildlife(c,ref));
  for(const n of visibleNpcs(world,view))drawQuestMarker(ctx,n,questMarker(world,n),t);
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
  for(const shot of world.projectiles){ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate(shot.angle);if(drawEntitySprite(ctx,shot.spriteId||`projectile.${shot.kind}`,{x:0,y:0,state:'idle',time:t})){ctx.restore();continue;}ctx.fillStyle=shot.kind==='wave'?'#a0eee2':shot.kind==='bomb'?'#e2c27c':'#fff0c8';if(shot.kind==='wave'){ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(0,0,12,shot.radius,0,0,Math.PI*2);ctx.fill();}else if(shot.kind==='bomb'){ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();}else if(shot.name==='Hunting Bow'){ctx.fillStyle='#8a6438';ctx.fillRect(-16,-1,24,2);ctx.fillStyle='#e8e2d0';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(6,-4);ctx.lineTo(6,4);ctx.fill();ctx.fillStyle='#d9c27e';ctx.fillRect(-18,-3,5,2);ctx.fillRect(-18,1,5,2);}else ctx.fillRect(-10,-3,20,6);ctx.restore();}
  if(!world.adventure){
  drawBobber(ctx,world);
  ctx.fillStyle='#243e3a55';ctx.beginPath();ctx.ellipse(p.x,p.y+14,18,8,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#b8db94';ctx.strokeStyle='#243d3e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f0d8b1';ctx.fillRect(8,-7,11,14);ctx.strokeStyle='#d8bd86';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(4,7);ctx.lineTo(29,7);ctx.stroke();ctx.restore();
  ctx.fillStyle='#edf3df';ctx.font='bold 10px Arial';ctx.fillText('YOU',p.x,p.y-25);
  }
  for(const effect of world.effects){
    if(effect.burst){if(!world.adventure)drawLevelBurst(ctx,effect,world.player,'back');drawLevelBurst(ctx,effect,world.player);continue;}
    const duration=effect.duration||(['defeat','Whirlpool Burst'].includes(effect.name)?.8:.55);
    const age=Math.max(0,duration-effect.life);ctx.save();ctx.globalAlpha=Math.min(1,effect.life/duration);ctx.translate(effect.x,effect.y);ctx.rotate(effect.angle);
    ctx.strokeStyle='#f3d59d';ctx.fillStyle='#f3d59d';ctx.lineWidth=5;
    if(effect.name==='player-hit'||effect.name==='notice'){ctx.font=`bold ${effect.name==='notice'?22:15}px monospace`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#1a0b0b';ctx.fillStyle=effect.name==='notice'?'#ffcf5a':'#ff6b5b';const y=effect.name==='notice'?-Math.min(age,.2)*30:-age*30;ctx.strokeText(effect.label,0,y);ctx.fillText(effect.label,0,y);}
    else if(effect.name==='animal-hit'||effect.name==='hunt'){ctx.font=effect.name==='hunt'?'bold 12px monospace':'bold 14px monospace';ctx.textAlign='center';ctx.fillStyle=effect.name==='hunt'?'#f8e6a7':'#fff4e4';ctx.fillText(effect.label,0,-age*30);}
    else if(['skill','skill-up','level-up'].includes(effect.name)){const big=effect.name!=='skill';ctx.font=`bold ${big?14:12}px monospace`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#10261d';ctx.fillStyle=effect.name==='level-up'?'#ffd36e':effect.name==='skill-up'?'#bfe8a0':'#e8f0d0';const y=-age*(big?18:26);ctx.strokeText(effect.label,0,y);ctx.fillText(effect.label,0,y);}
    else if(effect.name==='shiny'){ctx.fillStyle='#ffe28a';for(let i=0;i<10;i++){const a=i*Math.PI/5+age,r=10+age*60;ctx.fillRect(Math.cos(a)*r-1,Math.sin(a)*r-3,2,6);ctx.fillRect(Math.cos(a)*r-3,Math.sin(a)*r-1,6,2);}if(effect.label){ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#10261d';ctx.strokeText(effect.label,0,-28-age*16);ctx.fillText(effect.label,0,-28-age*16);}}
    else if(effect.name==='Hunting Bow'){ctx.strokeStyle='#8a6438';ctx.lineWidth=3;ctx.beginPath();ctx.arc(10,0,14,-1.2,1.2);ctx.stroke();}
    else if(['Harpoon Gun','Old Boot','Pufferfish Bomb'].includes(effect.name)){ctx.fillRect(18,-3,8,6);}
    else if(effect.name==='Whirlpool Burst'){ctx.strokeStyle='#a0eee2';ctx.beginPath();ctx.arc(0,0,155*(1-effect.life/.8),0,Math.PI*2);ctx.stroke();}
    else if(effect.name==='explosion'||effect.name==='defeat'){ctx.beginPath();ctx.arc(0,0,10+age*150,0,Math.PI*2);ctx.stroke();}
    else if(effect.name==='Sardine'){ctx.fillStyle='#b9db8c';ctx.font='bold 25px Arial';ctx.fillText('SNACK',0,-30-age*40);}
    else if(effect.name==='Grappling Squid'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(140,0);ctx.stroke();}
    else{ctx.beginPath();ctx.arc(0,0,effect.name==='Anchor'?72:48,-1+age*2,1+age*2);ctx.stroke();}
    ctx.restore();
  }
  if(world.adventure){drawWildsLabels(ctx,world,view||{left:p.x-700,right:p.x+700,top:p.y-500,bottom:p.y+500});if(view&&!world.defeat&&!INTERIOR_AREAS.includes(world.areaId)&&!cabinDamaged(world.story))drawAtmosphere(ctx,world,view);drawAnimalStatus(ctx,world);if(world.defeat&&view)drawDefeat(ctx,world,view);}
}
function drawBobber(ctx,world){
 const {elapsed:t,player:p,bobber}=world;if(!bobber)return;
 ctx.strokeStyle='#f1e6c7';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x+Math.cos(p.angle)*23,p.y+Math.sin(p.angle)*23);ctx.lineTo(bobber.x,bobber.y);ctx.stroke();ctx.strokeStyle='#99c8b788';ctx.beginPath();ctx.ellipse(bobber.x,bobber.y+4,12+Math.sin(t*3)*3,5,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ef947a';ctx.beginPath();ctx.arc(bobber.x,bobber.y,5,0,Math.PI*2);ctx.fill();
}
// The view darkens while Eli is down, then clears as he wakes.
function drawDefeat(ctx,world,view){
 const {remaining,total}=world.defeat,fade=Math.min(1,(total-remaining)/.8),W=view.right-view.left,H=view.bottom-view.top;
 ctx.save();ctx.fillStyle=`rgba(12,6,10,${.72*fade})`;ctx.fillRect(view.left,view.top,W,H);
 ctx.globalAlpha=fade;ctx.textAlign='center';ctx.font='bold 26px Georgia, serif';ctx.fillStyle='#e9d8c4';ctx.fillText('Eli collapses…',view.left+W/2,view.top+H/2-10);
 ctx.font='15px Georgia, serif';ctx.fillStyle='#bfae9c';ctx.fillText(`He will wake at ${areaFor(world.areaId).name}.`,view.left+W/2,view.top+H/2+18);ctx.restore();
}
function drawPlayer(ctx,world){
 drawBobber(ctx,world);
 for(const effect of world.effects)if(effect.burst)drawLevelBurst(ctx,effect,world.player,'back');
 // With a line out, Eli faces the cast.
 const p=world.bobber?{...world.player,facing:facingFor(Math.cos(world.player.angle),Math.sin(world.player.angle))}:world.player;
 // Eli stays down in the mud from the collapse until the blackout, and after a monster brings him down.
 const fallen=!!world.defeat||world.story?.scene==='storm'&&['collapse','rescue'].includes(pendingScene(world)?.action);
 if(fallen){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/2);drawExplorer(ctx,{...p,x:0,y:0,steppedAt:undefined},world.elapsed||0);ctx.restore();}
 else drawExplorer(ctx,p,world.elapsed||0);
}
// Another player: Eli's sprite with their nickname above, in a gold-edged tag so players stand apart from villagers. Away players are faded.
function drawOtherPlayer(ctx,o,t){
 ctx.save();if(o.afk)ctx.globalAlpha=.55;drawExplorer(ctx,o,t||0);ctx.restore();
 const label=o.afk?`${o.name} · away`:o.name,x=Math.round(o.x),y=Math.round(o.y)-50,w=Math.max(46,label.length*6+12);
 ctx.textAlign='center';ctx.font='bold 10px monospace';ctx.fillStyle='#10272ce0';ctx.fillRect(x-w/2,y-11,w,15);
 ctx.strokeStyle=o.afk?'#8a917f':'#e8c46a';ctx.lineWidth=1;ctx.strokeRect(x-w/2+.5,y-10.5,w-1,14);ctx.fillStyle=o.afk?'#b9c2ad':'#f3e6bf';ctx.fillText(label,x,y);
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
