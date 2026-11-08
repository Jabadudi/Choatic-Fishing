import {fieldProgress} from './field-play.js';
import {drawCoreArt} from './core-art.js';
import {drawDrop} from './drops.js';
import {cabinDamaged,pendingScene} from './story.js';
import {visibleWildlife} from './wildlife.js';
import {drawWildlife,drawAnimalStatus} from './wildlife-art.js';
import {drawEntitySprite,drawProp} from './sprites.js';
import {facingFor} from './entities.js';
import {drawTerrain} from './terrain.js';
import {drawWilds,drawWildsLabels,drawDepthSorted,drawExplorer,INTERIOR_AREAS,areaFor,heightAt,elevationFor,projectGround} from './wilds.js';
import {drawRabbits,drawRabbit,visibleRabbits} from './rabbits.js';
import {drawAtmosphere} from './atmosphere.js';
import {visibleNpcs,drawNpc,drawQuestMarker} from './npcs.js';
import {questMarker} from './side-quests.js';
import {nightAttackActors} from './story-action.js';
import {drawFamiliar,drawShard} from './familiar-art.js';
import {drawRadioBeside,radioBesideEli} from './radio-art.js';
import {drawLevelBurst} from './level-up-fx.js';
import {comboDisplay} from './combo.js';
// others: players from the shared world standing in this area (hub.js); drawn with the scenery like Eli.
export function render(ctx,world,view,{others=[]}={}){
 const {elapsed:t,player:p,bobber}=world;
 const displayView=view;
 const actors=[];
 if(world.adventure&&elevationFor(world.areaId)&&view)view={...view,top:view.top-700,bottom:view.bottom+700};
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
  drawDepthSorted(ctx,world,view||{left:p.x-700,right:p.x+700,top:p.y-500,bottom:p.y+500},actors,(c,ref)=>ref===p?drawPlayer(c,world):ref.remote?drawOtherPlayer(c,ref,t):ref.radio?drawRadioBeside(c,ref,t):ref.cutscene?drawCutsceneActor(c,ref):ref===world.companion?drawFamiliar(c,ref,t):ref.entityType==='pickup'?(ref.item.familiar?drawShard(c,ref,t):drawDrop(c,ref,t)):ref.npc?drawNpc(c,ref,t):ref.species==='rabbit'?drawRabbit(c,ref):drawWildlife(c,ref),{terrainView:displayView||view});
  for(const n of visibleNpcs(world,view)){ctx.save();ctx.translate(0,-heightAt(n.x,n.y,world.areaId));drawQuestMarker(ctx,n,questMarker(world,n),t);ctx.restore();}
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
  drawCoreArt(ctx,world);
  // Region Core powers: Reedwater's Call is a bending line of core-blue light; Still Water rings Eli while it holds.
  for(const shot of world.projectiles)if(shot.kind==='line'&&shot.trail?.length>1){ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='#59b9ff';ctx.shadowBlur=10;ctx.strokeStyle='#9ad7ffcc';ctx.lineWidth=3;ctx.beginPath();shot.trail.forEach((p,i)=>i?ctx.lineTo(p.x,p.y-(shot.elevation||0)):ctx.moveTo(p.x,p.y-(shot.elevation||0)));ctx.stroke();ctx.fillStyle='#e8f7ff';ctx.beginPath();ctx.arc(shot.x,shot.y-(shot.elevation||0),4,0,Math.PI*2);ctx.fill();ctx.restore();}
  if(world.core?.stillWater>0&&world.player.health>0){const p=world.player,fade=Math.min(1,world.core.stillWater/.6);ctx.save();ctx.globalAlpha=.55*fade;ctx.strokeStyle='#9ad7ff';ctx.lineWidth=2;for(let i=0;i<2;i++){const r=26+((t*14+i*11)%22);ctx.beginPath();ctx.ellipse(p.x,p.y-heightAt(p.x,p.y,world.areaId)+4,r,r*.45,0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
  for(const shot of world.projectiles){if(shot.kind==='line')continue;ctx.save();ctx.translate(shot.x,shot.y-(shot.elevation||0));ctx.rotate(shot.angle);if(drawEntitySprite(ctx,shot.spriteId||`projectile.${shot.kind}`,{x:0,y:0,state:'idle',time:t})){ctx.restore();continue;}ctx.fillStyle=shot.kind==='wave'?'#a0eee2':shot.kind==='bomb'?'#e2c27c':'#fff0c8';if(shot.kind==='wave'){ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(0,0,12,shot.radius,0,0,Math.PI*2);ctx.fill();}else if(shot.kind==='bomb'){ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();}else if(shot.name==='Hunting Bow'){ctx.fillStyle='#8a6438';ctx.fillRect(-16,-1,24,2);ctx.fillStyle='#e8e2d0';ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(6,-4);ctx.lineTo(6,4);ctx.fill();ctx.fillStyle='#d9c27e';ctx.fillRect(-18,-3,5,2);ctx.fillRect(-18,1,5,2);}else ctx.fillRect(-10,-3,20,6);ctx.restore();}
  if(!world.adventure){
  drawBobber(ctx,world);
  ctx.fillStyle='#243e3a55';ctx.beginPath();ctx.ellipse(p.x,p.y+14,18,8,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#b8db94';ctx.strokeStyle='#243d3e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f0d8b1';ctx.fillRect(8,-7,11,14);ctx.strokeStyle='#d8bd86';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(4,7);ctx.lineTo(29,7);ctx.stroke();ctx.restore();
  ctx.fillStyle='#edf3df';ctx.font='bold 10px Arial';ctx.fillText('YOU',p.x,p.y-25);
  }
  for(const effect of world.effects){
    if(effect.name==='riverstep-trail'||effect.name==='current-return')continue;
    if(effect.burst){ctx.save();if(world.adventure)ctx.translate(0,-heightAt(effect.x,effect.y,world.areaId));if(!world.adventure)drawLevelBurst(ctx,effect,world.player,'back');drawLevelBurst(ctx,effect,world.player);ctx.restore();continue;}
    const duration=effect.duration||(['defeat','Whirlpool Burst'].includes(effect.name)?.8:.55);
    const age=Math.max(0,duration-effect.life);ctx.save();ctx.globalAlpha=Math.min(1,effect.life/duration);ctx.translate(effect.x,effect.y-heightAt(effect.x,effect.y,world.areaId));ctx.rotate(effect.angle);
    ctx.strokeStyle='#f3d59d';ctx.fillStyle='#f3d59d';ctx.lineWidth=5;
    // Combo finisher: a wide white slash; DOWN pops over a knocked-down foe (src/combo.js).
    if(effect.name==='combo-finisher'){const k=Math.min(1,age/(duration*.6)),r=(effect.range||70)+18;ctx.strokeStyle='#fffbe8';ctx.lineWidth=9*(1-k)+2;ctx.beginPath();ctx.arc(0,0,r,-1.4,-1.4+2.8*k);ctx.stroke();ctx.restore();continue;}
    if(effect.name==='down'){ctx.font='bold 16px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#1a0b0b';ctx.fillStyle='#ffe066';const y=-Math.min(age,.15)*60;ctx.strokeText(effect.label,0,y);ctx.fillText(effect.label,0,y);ctx.restore();continue;}
    if(effect.name==='player-hit'||effect.name==='notice'){ctx.font=`bold ${effect.name==='notice'?22:15}px monospace`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#1a0b0b';ctx.fillStyle=effect.name==='notice'?'#ffcf5a':'#ff6b5b';const y=effect.name==='notice'?-Math.min(age,.2)*30:-age*30;ctx.strokeText(effect.label,0,y);ctx.fillText(effect.label,0,y);}
    else if(effect.name==='animal-hit'||effect.name==='hunt'){ctx.font=effect.name==='hunt'?'bold 12px monospace':'bold 14px monospace';ctx.textAlign='center';ctx.fillStyle=effect.name==='hunt'?'#f8e6a7':'#fff4e4';ctx.fillText(effect.label,0,-age*30);}
    else if(['skill','skill-up','level-up'].includes(effect.name)){const big=effect.name!=='skill';ctx.font=`bold ${big?14:12}px monospace`;ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#10261d';ctx.fillStyle=effect.name==='level-up'?'#ffd36e':effect.name==='skill-up'?'#bfe8a0':'#e8f0d0';const y=-age*(big?18:26);ctx.strokeText(effect.label,0,y);ctx.fillText(effect.label,0,y);}
    else if(effect.name==='shiny'){ctx.fillStyle='#ffe28a';for(let i=0;i<10;i++){const a=i*Math.PI/5+age,r=10+age*60;ctx.fillRect(Math.cos(a)*r-1,Math.sin(a)*r-3,2,6);ctx.fillRect(Math.cos(a)*r-3,Math.sin(a)*r-1,6,2);}if(effect.label){ctx.font='bold 13px monospace';ctx.textAlign='center';ctx.lineWidth=3;ctx.strokeStyle='#10261d';ctx.strokeText(effect.label,0,-28-age*16);ctx.fillText(effect.label,0,-28-age*16);}}
    else if(effect.name==='Hunting Bow'){ctx.strokeStyle='#8a6438';ctx.lineWidth=3;ctx.beginPath();ctx.arc(10,0,14,-1.2,1.2);ctx.stroke();}
    else if(['Harpoon Gun','Old Boot','Pufferfish Bomb'].includes(effect.name)){ctx.fillRect(18,-3,8,6);}
    // Greyhorn's stomp: a ring of black smoke running out along the ground.
    else if(effect.name==='stomp'){const k=age/duration;ctx.strokeStyle='#241c2c';ctx.globalAlpha*=.8;ctx.lineWidth=10*(1-k)+2;ctx.beginPath();ctx.ellipse(0,0,effect.radius*k,effect.radius*k*.5,0,0,Math.PI*2);ctx.stroke();}
    else if(effect.name==='sabre-sweep'){ctx.strokeStyle='#cfe6ff';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,70,-1.3,-1.3+2.6*Math.min(1,age/(duration*.5)));ctx.stroke();}
    // The boss weapon rushes are drawn by Eli's own sheet.
    else if(['Tide Lunge','Antler Charge','Captain’s Sabre','Greyhorn Spear'].includes(effect.name)){}
    else if(effect.name==='Whirlpool Burst'){ctx.strokeStyle='#a0eee2';ctx.beginPath();ctx.arc(0,0,155*(1-effect.life/.8),0,Math.PI*2);ctx.stroke();}
    else if(effect.name==='explosion'||effect.name==='defeat'){ctx.beginPath();ctx.arc(0,0,10+age*150,0,Math.PI*2);ctx.stroke();}
    else if(effect.name==='Sardine'){ctx.fillStyle='#b9db8c';ctx.font='bold 25px Arial';ctx.fillText('SNACK',0,-30-age*40);}
    else if(effect.name==='Grappling Squid'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(140,0);ctx.stroke();}
    // The second swing of a combo sweeps back the other way.
    else{const back=effect.comboStep===2?-1:1;ctx.beginPath();ctx.arc(0,0,effect.name==='Anchor'?72:48,back*(-1+age*2),back*(1+age*2),back<0);ctx.stroke();}
    ctx.restore();
  }
  if(world.adventure){drawWildsLabels(ctx,world,view||{left:p.x-700,right:p.x+700,top:p.y-500,bottom:p.y+500});if(view&&!world.defeat&&!INTERIOR_AREAS.includes(world.areaId)&&!cabinDamaged(world.story))drawAtmosphere(ctx,world,displayView);drawAnimalStatus(ctx,world);if(view)hud(ctx,displayView,v=>{drawFieldProgress(ctx,world,v);drawComboCounter(ctx,world,v);drawFieldClear(ctx,world,v);});if(world.defeat&&view)drawDefeat(ctx,world,displayView);}
}
function drawBobber(ctx,world){
 const {elapsed:t,player:p,bobber}=world;if(!bobber)return;
 ctx.strokeStyle='#f1e6c7';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x+Math.cos(p.angle)*23,p.y-heightAt(p.x,p.y,world.areaId)+Math.sin(p.angle)*23);ctx.lineTo(bobber.x,bobber.y-heightAt(bobber.x,bobber.y,world.areaId));ctx.stroke();ctx.strokeStyle='#99c8b788';ctx.beginPath();ctx.ellipse(bobber.x,bobber.y-heightAt(bobber.x,bobber.y,world.areaId)+4,12+Math.sin(t*3)*3,5,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ef947a';ctx.beginPath();ctx.arc(bobber.x,bobber.y-heightAt(bobber.x,bobber.y,world.areaId),5,0,Math.PI*2);ctx.fill();
}
// The combo counter sits right of centre while hits keep landing, and pops on each new one.
function drawComboCounter(ctx,world,view){
 const c=comboDisplay(world);if(!c)return;
 const W=view.right-view.left,H=view.bottom-view.top,size=Math.max(26,Math.min(48,W*.045))*(1+c.flash*.8);
 ctx.save();ctx.globalAlpha=c.fade;ctx.textAlign='right';ctx.lineJoin='round';
 // Left of the hotbar column and above the attack wheel, so it never sits on either (desktop or phone).
 const x=view.right-W*.2,y=view.top+H*.32;
 ctx.font=`900 ${Math.round(size)}px Arial`;ctx.lineWidth=Math.max(4,size*.14);ctx.strokeStyle='#2a1206';ctx.fillStyle=c.count>=30?'#ff8f3a':c.count>=10?'#ffd24a':'#fff3d6';
 ctx.strokeText(String(c.count),x,y);ctx.fillText(String(c.count),x,y);
 ctx.font=`bold ${Math.round(size*.36)}px Arial`;ctx.lineWidth=4;ctx.strokeText('HIT COMBO',x,y+size*.45);ctx.fillStyle='#fff3d6';ctx.fillText('HIT COMBO',x,y+size*.45);
 ctx.restore();
}
// The field map's clear goal, top centre: monsters defeated, whether the elite has fallen, and the best rank so far.
// HUD pieces drawn on the world canvas keep their screen size when the camera zooms in: they draw into a view
// zoom times larger, scaled back down around its top-left corner.
function hud(ctx,view,draw){
 const z=view.zoom||1;if(z===1)return draw(view);
 const W=(view.right-view.left)*z,H=(view.bottom-view.top)*z;
 ctx.save();ctx.translate(view.left,view.top);ctx.scale(1/z,1/z);draw({left:0,top:0,right:W,bottom:H,zoom:1});ctx.restore();
}
function drawFieldProgress(ctx,world,view){
 const f=fieldProgress(world);if(!f||world.fieldClear)return;
 if(f.species){drawRankTracker(ctx,f,view);return;}
 const W=view.right-view.left,size=Math.max(11,Math.min(14,W*.011)),x=view.left+W/2,y=view.top+size*2.2;
 // A bunch map (Regions) has no elite: its pill counts its own monsters, then says the gate is open.
 const text=f.species?(f.clears?`${f.code} · Cleared · Rank ${f.best} · The gate east is open`:`${f.code} · Monsters ${f.kills}/${f.goal}`):`${f.code} · Monsters ${f.kills}/${f.goal} · ${f.eliteName} ${f.elite?'✓':'—'}${f.best?` · Best ${f.best}`:''}`;
 ctx.save();ctx.font=`bold ${Math.round(size)}px Georgia, serif`;ctx.textAlign='center';ctx.textBaseline='middle';
 const w=(ctx.measureText?.(text)?.width||text.length*size*.6)+size*1.6,h=size*1.9;
 ctx.fillStyle='#1d2a22cc';ctx.fillRect(x-w/2,y-h/2,w,h);ctx.strokeStyle='#c9a85a';ctx.lineWidth=1;ctx.strokeRect(x-w/2+.5,y-h/2+.5,w-1,h-1);
 ctx.fillStyle=f.kills>=f.goal&&!f.elite?'#ffd24a':'#f3e6bf';ctx.fillText(text,x,y+1);ctx.restore();
}
const RANK_COLORS={S:'#ffcf3a',A:'#9fe0ff',B:'#b8e08a',C:'#e8d8c0'};
// A bunch map's live tracker (Regions): the rank the run is on course for in a big letter, a COMBO bar (the current
// chain, toward a 30-hit chain; a tick marks the best so far), a KILLS bar toward the map's goal, and one segment per
// bunch that fills as its monsters fall. Once cleared, it shows the best rank and that the gate is open.
function drawRankTracker(ctx,f,view){
 const W=view.right-view.left,k=Math.max(.75,Math.min(1.15,W/1150)),bw=210*k,box=54*k,gap=8*k,w=box+gap+bw,x=view.left+W/2-w/2,y=view.top+8*k;
 const rank=f.clears?f.best:f.live;
 ctx.save();ctx.textBaseline='middle';
 // The rank box.
 ctx.fillStyle='#14201acc';ctx.fillRect(x,y,box,box);ctx.strokeStyle='#c9a85a';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,box-2,box-2);
 ctx.strokeStyle='#ffffff22';ctx.lineWidth=1;ctx.strokeRect(x+4,y+4,box-8,box-8);
 ctx.textAlign='center';ctx.font=`900 ${Math.round(38*k)}px Arial`;ctx.lineWidth=4*k;ctx.strokeStyle='#10180f';ctx.fillStyle=f.started||f.clears?RANK_COLORS[rank]||'#fff':'#8b9a8e';
 ctx.strokeText(rank,x+box/2,y+box/2+2*k);ctx.fillText(rank,x+box/2,y+box/2+2*k);
 ctx.font=`bold ${Math.round(8*k)}px Arial`;ctx.fillStyle='#e9d8a8';ctx.fillText(f.clears?'CLEARED':`${f.code} RANK`,x+box/2,y+box-6*k);
 // COMBO and KILLS bars.
 const bx=x+box+gap,label=46*k,track=bw-label,bh=9*k;
 ctx.fillStyle='#14201ab0';ctx.fillRect(bx-4*k,y,bw+8*k,box);
 const bar=(row,name,t,top,bottom,mark,text)=>{const by=y+3*k+row*15*k;ctx.textAlign='left';ctx.font=`bold ${Math.round(11*k)}px Arial`;ctx.lineWidth=3;ctx.strokeStyle='#10180f';ctx.strokeText(name,bx,by+bh/2);ctx.fillStyle='#f3e6bf';ctx.fillText(name,bx,by+bh/2);
  ctx.fillStyle='#10180fcc';ctx.fillRect(bx+label,by,track,bh);ctx.strokeStyle='#c9a85a99';ctx.lineWidth=1;ctx.strokeRect(bx+label+.5,by+.5,track-1,bh-1);
  const g=ctx.createLinearGradient?ctx.createLinearGradient(0,by,0,by+bh):null;if(g){g.addColorStop(0,top);g.addColorStop(1,bottom);ctx.fillStyle=g;}else ctx.fillStyle=top;
  ctx.fillRect(bx+label+1,by+1,Math.max(0,(track-2)*Math.min(1,t)),bh-2);
  if(mark>0){ctx.fillStyle='#fff3d6';ctx.fillRect(bx+label+1+(track-2)*Math.min(1,mark)-1,by-1,2,bh+2);}
  ctx.textAlign='right';ctx.font=`bold ${Math.round(9*k)}px Arial`;ctx.lineWidth=3;ctx.strokeStyle='#10180f';ctx.strokeText(text,bx+bw-3*k,by+bh/2+.5);ctx.fillStyle='#fff3d6';ctx.fillText(text,bx+bw-3*k,by+bh/2+.5);};
 bar(0,'COMBO',f.combo/30,'#ffe27a','#e0a640',f.bestCombo/30,`${f.combo} · best ${f.bestCombo}`);
 bar(1,'KILLS',f.kills/f.goal,'#ff9a4a','#d8502a',0,`${f.kills} / ${f.goal}`);
 // One segment per bunch.
 const n=f.bunches.length,sg=3*k,sw=(bw-sg*(n-1))/n,sy=y+box-12*k,sh=10*k;
 f.bunches.forEach((b,i)=>{const sx=bx+i*(sw+sg);ctx.fillStyle='#10180fcc';ctx.fillRect(sx,sy,sw,sh);
  if(b.down){ctx.fillStyle=b.down===b.count?'#7fd36a':'#3f7a3a';ctx.fillRect(sx+1,sy+1,(sw-2)*(b.down===b.count?1:b.down/b.count),sh-2);}
  ctx.strokeStyle=b.down===b.count?'#e9ffd0':'#6b7a5a';ctx.lineWidth=1;ctx.strokeRect(sx+.5,sy+.5,sw-1,sh-1);});
 ctx.restore();
}
// The clear banner: the map's name, the rank in big letters, how it was earned, and the first-clear reward.
function drawFieldClear(ctx,world,view){
 const c=world.fieldClear;if(!c)return;
 const age=c.duration-c.remaining,fade=Math.min(1,age/.35,c.remaining/.6),W=view.right-view.left,H=view.bottom-view.top,x=view.left+W/2,y=view.top+H*.3,k=Math.max(.7,Math.min(1.2,W/1100));
 ctx.save();ctx.globalAlpha=Math.max(0,fade);ctx.textAlign='center';ctx.lineJoin='round';
 ctx.fillStyle='#10180fcc';ctx.fillRect(view.left,y-70*k,W,(c.reward?168:146)*k);
 ctx.font=`bold ${Math.round(16*k)}px Georgia, serif`;ctx.fillStyle='#e9d8a8';ctx.fillText(`${c.code} ${c.name.toUpperCase()} CLEARED`,x,y-42*k);
 const pop=1+Math.max(0,.35-age)*1.6;ctx.font=`900 ${Math.round(64*k*pop)}px Arial`;ctx.lineWidth=8*k;ctx.strokeStyle='#2a1206';ctx.fillStyle=RANK_COLORS[c.rank]||'#fff';
 ctx.strokeText(`RANK ${c.rank}`,x,y+22*k);ctx.fillText(`RANK ${c.rank}`,x,y+22*k);
 const m=Math.floor(c.seconds/60),s=String(Math.floor(c.seconds%60)).padStart(2,'0');
 ctx.font=`${Math.round(14*k)}px Georgia, serif`;ctx.fillStyle='#f3e6bf';ctx.fillText(`Time ${m}:${s} · Damage taken ${c.damage} · Best combo ${c.combo}`,x,y+52*k);
 if(c.reward){ctx.fillStyle='#ffd24a';ctx.fillText(`First clear: +${c.reward.wishstones} Wishstone · +${c.reward.marks} reed marks`,x,y+76*k);}
 ctx.restore();
}
// The view darkens while Eli is down, then clears as he wakes.
function drawDefeat(ctx,world,view){
 const {remaining,total}=world.defeat,fade=Math.min(1,(total-remaining)/.8),W=view.right-view.left,H=view.bottom-view.top;
 ctx.save();ctx.fillStyle=`rgba(12,6,10,${.72*fade})`;ctx.fillRect(view.left,view.top,W,H);
 ctx.globalAlpha=fade;ctx.textAlign='center';ctx.font='bold 26px Georgia, serif';ctx.fillStyle='#e9d8c4';ctx.fillText('Eli collapses…',view.left+W/2,view.top+H/2-10);
 ctx.font='15px Georgia, serif';ctx.fillStyle='#bfae9c';ctx.fillText(`He will wake at ${areaFor(world.areaId).name}.`,view.left+W/2,view.top+H/2+18);ctx.restore();
}
function drawPlayer(ctx,world){
 ctx.save();ctx.translate(0,heightAt(world.player.x,world.player.y,world.areaId));drawBobber(ctx,world);ctx.restore();
 for(const effect of world.effects)if(effect.burst)drawLevelBurst(ctx,effect,world.player,'back');
 // With a line out, Eli faces the cast.
 const p=world.bobber?{...world.player,facing:facingFor(Math.cos(world.player.angle),Math.sin(world.player.angle))}:world.player;
 // Eli stays down in the mud from the collapse until the blackout, and after a monster brings him down.
 const fallen=!!world.defeat||world.story?.scene==='storm'&&['collapse','rescue'].includes(pendingScene(world)?.action);
 if(fallen){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/2);drawExplorer(ctx,{...p,x:0,y:0,steppedAt:undefined},world.elapsed||0);ctx.restore();}
 // Holding Drayfus's squat: lower at the knees, and shaking once the legs start to go.
 else if(world.story?.stage==='ch7-hold'&&!world.story.scene){const h=world.story.hold||0,shake=h>7?Math.round(Math.sin((world.elapsed||0)*47)*Math.min(1.5,(h-7)/6)):0;ctx.save();ctx.translate(p.x+shake,p.y+14);ctx.scale(1,.84);ctx.translate(-p.x,-(p.y+14));drawExplorer(ctx,p,world.elapsed||0);ctx.restore();}
 // A boss weapon in hand: its swing or rush sheet plays over the walk while the move lasts.
 else if(!weaponPose(ctx,world,p))drawExplorer(ctx,p,world.elapsed||0);
 // Drayfus's buckets, one in each hand, while Eli carries water to the trough.
 if(world.story?.stage==='ch6-buckets'&&world.story.carrying)for(const side of [-1,1]){const x=Math.round(p.x+side*15),y=Math.round(p.y+2+Math.sin((p.walkTime||world.elapsed||0)*6+side)*1);if(drawProp(ctx,'water-bucket-full',{x,y:y+10,w:16,h:16}))continue;ctx.fillStyle='#5c3b22';ctx.fillRect(x-5,y-2,10,11);ctx.fillStyle='#8a6038';ctx.fillRect(x-5,y-2,10,2);ctx.fillStyle='#3f7f95';ctx.fillRect(x-4,y,8,2);ctx.strokeStyle='#3a2414';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y-2,5,Math.PI,0);ctx.stroke();}
}
function weaponPose(ctx,world,p){
 const pose=p.weaponPose,age=(world.elapsed||0)-(pose?.started??0);
 if(!pose||world.bobber||age<0||age>=pose.duration)return false;
 return drawEntitySprite(ctx,pose.spriteId,{x:p.x,y:p.y,state:pose.state,time:age,duration:pose.duration,facingX:Math.cos(p.angle)<0?-1:1});
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
