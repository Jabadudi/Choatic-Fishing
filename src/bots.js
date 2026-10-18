import {walkable,LAND} from './terrain.js';
import {WEAPONS} from './combat.js';
export function updateBot(world,bot,dt){
 if(bot.health<=0)return;
 const enemies=world.actors.filter(actor=>actor!==bot&&actor.health>0);
 const target=enemies.sort((a,b)=>Math.hypot(a.x-bot.x,a.y-bot.y)-Math.hypot(b.x-bot.x,b.y-bot.y))[0];
 if(!target)return;
 const dx=target.x-bot.x,dy=target.y-bot.y,distance=Math.hypot(dx,dy)||1;
 bot.angle=Math.atan2(dy,dx);
 // Decisions use distance, health and equipment, never the target's fishing state.
 if(bot.fishing.state!=='idle'){
  bot.intent='FISHING';
  if(distance<70){bot.fishing.cancel();bot.bobber=null;bot.retreat=1.2;}
  return;
 }
 if(bot.progression.pendingChoices)bot.progression.choose('tidal');
 if(bot.progression.specials.tidal&&distance<240&&world.useSpecial('tidal',bot))return;
 if(bot.inventory.item){
  const name=bot.inventory.item.name;bot.inventory.equip(2);
  if(name==='Treasure Key'){const c=world.chests.filter(c=>!c.opened).sort((a,b)=>Math.hypot(a.x-bot.x,a.y-bot.y)-Math.hypot(b.x-bot.x,b.y-bot.y))[0];if(c){const d=Math.hypot(c.x-bot.x,c.y-bot.y);if(d<=70)world.useActorItem(bot);else navigate(world,bot,c,145*dt);}return;}
  if(name==='Sardine'||name==='Grappling Squid'){bot.intent='RECOVERING';if(name==='Grappling Squid')bot.angle+=Math.PI;world.useActorItem(bot);return;}
  const spec=WEAPONS[name],range=spec?.kind==='melee'?spec.range:spec?.kind==='bomb'?160:230;
  bot.intent='HUNTING';
  if(distance<=range){world.useActorItem(bot);if(distance<40)world.moveActor(bot,-dx/distance*80*dt,-dy/distance*80*dt,false);}
  else navigate(world,bot,target,155*bot.progression.speedMultiplier*dt);
  return;
 }
 bot.inventory.equip(1);
 if(bot.retreat>0){bot.retreat-=dt;bot.intent='RETREATING';world.moveActor(bot,-dx/distance*170*dt,-dy/distance*170*dt,false);return;}
 const sx=bot.shore.x-bot.x,sy=bot.shore.y-bot.y,shoreDistance=Math.hypot(sx,sy);
 bot.intent='TO SHORE';
 if(shoreDistance>8)navigate(world,bot,bot.shore,145*dt);
 else world.castActor(bot,bot.shore.aim);
}

// A small navigation grid lets opponents find routes around lakes and trees.
function navigate(world,bot,target,step){
 const cell=40,point=(x,y)=>({x:LAND.left+20+x*cell,y:LAND.top+20+y*cell}),grid=p=>[Math.round((p.x-LAND.left-20)/cell),Math.round((p.y-LAND.top-20)/cell)];
 if(!bot.route||world.elapsed>(bot.routeAt||0)||Math.hypot(target.x-bot.goalX,target.y-bot.goalY)>80){
  const start=grid(bot),goal=grid(target),queue=[start],parents=new Map([[start.join(','),null]]);let found=null;
  for(let i=0;i<queue.length&&i<1600;i++){const [x,y]=queue[i];if(x===goal[0]&&y===goal[1]){found=[x,y];break;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const next=[x+dx,y+dy],key=next.join(','),p=point(...next);if(!parents.has(key)&&walkable(p.x,p.y)){parents.set(key,[x,y]);queue.push(next);}}}
  bot.route=[];while(found){bot.route.unshift(point(...found));found=parents.get(found.join(','));}if(bot.route.length)bot.route.shift();bot.routeAt=world.elapsed+2;bot.goalX=target.x;bot.goalY=target.y;
 }
 while(bot.route.length&&Math.hypot(bot.route[0].x-bot.x,bot.route[0].y-bot.y)<6)bot.route.shift();
 const p=bot.route[0]||target,d=Math.hypot(p.x-bot.x,p.y-bot.y)||1;world.moveActor(bot,(p.x-bot.x)/d*Math.min(step,d),(p.y-bot.y)/d*Math.min(step,d),false);
}
