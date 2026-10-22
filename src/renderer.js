import {drawTerrain} from './terrain.js';
import {drawWilds,drawExplorer} from './wilds.js';
import {drawRabbits} from './rabbits.js';
import {drawAtmosphere} from './atmosphere.js';
export function render(ctx,world,view){
 const {elapsed:t,player:p,bobber}=world;
 if(world.adventure)drawWilds(ctx,world,view);else drawTerrain(ctx,world);
 drawRabbits(ctx,world,view);
  for(const bot of world.actors.filter(actor=>actor!==world.player)){
    if(bot.health<=0)continue;
    if(bot.bobber){ctx.strokeStyle='#eee3bf99';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(bot.x,bot.y);ctx.lineTo(bot.bobber.x,bot.bobber.y);ctx.stroke();ctx.fillStyle=bot.color;ctx.beginPath();ctx.arc(bot.bobber.x,bot.bobber.y,4,0,Math.PI*2);ctx.fill();}
    ctx.fillStyle='#243e3a55';ctx.beginPath();ctx.ellipse(bot.x,bot.y+13,18,8,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(bot.x,bot.y);ctx.rotate(bot.angle);ctx.fillStyle=bot.color;ctx.strokeStyle='#243d3e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f0d8b1';ctx.fillRect(8,-6,12,12);ctx.restore();
    ctx.textAlign='center';ctx.fillStyle='#20322c';ctx.fillRect(bot.x-23,bot.y-30,46,5);ctx.fillStyle=bot.color;ctx.fillRect(bot.x-23,bot.y-30,46*bot.health/bot.progression.maxHealth,5);
    ctx.font='bold 10px Arial';ctx.fillStyle='#fff3db';ctx.fillText(bot.name,bot.x,bot.y-36);
    ctx.font='8px Arial';ctx.fillStyle='#263e35';ctx.fillText(bot.fishing.state!=='idle'?'FISHING':bot.inventory.item?.name||'TO SHORE',bot.x,bot.y+29);
  }
  for(const shot of world.projectiles){ctx.save();ctx.translate(shot.x,shot.y);ctx.rotate(shot.angle);ctx.fillStyle=shot.kind==='wave'?'#a0eee2':shot.kind==='bomb'?'#e2c27c':'#fff0c8';if(shot.kind==='wave'){ctx.globalAlpha=.8;ctx.beginPath();ctx.ellipse(0,0,12,shot.radius,0,0,Math.PI*2);ctx.fill();}else if(shot.kind==='bomb'){ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.fill();}else ctx.fillRect(-10,-3,20,6);ctx.restore();}
  if(bobber){ctx.strokeStyle='#f1e6c7';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x+Math.cos(p.angle)*23,p.y+Math.sin(p.angle)*23);ctx.lineTo(bobber.x,bobber.y);ctx.stroke();ctx.strokeStyle='#99c8b788';ctx.beginPath();ctx.ellipse(bobber.x,bobber.y+4,12+Math.sin(t*3)*3,5,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ef947a';ctx.beginPath();ctx.arc(bobber.x,bobber.y,5,0,Math.PI*2);ctx.fill();}
  if(world.adventure)drawExplorer(ctx,p);
  else {
  ctx.fillStyle='#243e3a55';ctx.beginPath();ctx.ellipse(p.x,p.y+14,18,8,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle='#b8db94';ctx.strokeStyle='#243d3e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,14,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#f0d8b1';ctx.fillRect(8,-7,11,14);ctx.strokeStyle='#d8bd86';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(4,7);ctx.lineTo(29,7);ctx.stroke();ctx.restore();
  ctx.fillStyle='#edf3df';ctx.font='bold 10px Arial';ctx.fillText('YOU',p.x,p.y-25);
  }
  for(const effect of world.effects){
    const duration=['defeat','Whirlpool Burst'].includes(effect.name)?.8:.55;
    const age=Math.max(0,duration-effect.life);ctx.save();ctx.globalAlpha=Math.min(1,effect.life/duration);ctx.translate(effect.x,effect.y);ctx.rotate(effect.angle);
    ctx.strokeStyle='#f3d59d';ctx.fillStyle='#f3d59d';ctx.lineWidth=5;
    if(['Harpoon Gun','Old Boot','Pufferfish Bomb'].includes(effect.name)){ctx.fillRect(18,-3,8,6);}
    else if(effect.name==='Whirlpool Burst'){ctx.strokeStyle='#a0eee2';ctx.beginPath();ctx.arc(0,0,155*(1-effect.life/.8),0,Math.PI*2);ctx.stroke();}
    else if(effect.name==='explosion'||effect.name==='defeat'){ctx.beginPath();ctx.arc(0,0,10+age*150,0,Math.PI*2);ctx.stroke();}
    else if(effect.name==='Sardine'){ctx.fillStyle='#b9db8c';ctx.font='bold 25px Arial';ctx.fillText('SNACK',0,-30-age*40);}
    else if(effect.name==='Grappling Squid'){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(140,0);ctx.stroke();}
    else{ctx.beginPath();ctx.arc(0,0,effect.name==='Anchor'?72:48,-1+age*2,1+age*2);ctx.stroke();}
    ctx.restore();
  }
  if(world.adventure&&view)drawAtmosphere(ctx,world,view);
}
