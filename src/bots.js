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
  if(name==='Sardine'||name==='Grappling Squid'){bot.intent='RECOVERING';if(name==='Grappling Squid')bot.angle+=Math.PI;world.useActorItem(bot);return;}
  const spec=WEAPONS[name],range=spec?.kind==='melee'?spec.range:spec?.kind==='bomb'?160:230;
  bot.intent='HUNTING';
  if(distance<=range){world.useActorItem(bot);if(distance<40)world.moveActor(bot,-dx/distance*80*dt,-dy/distance*80*dt,false);}
  else world.moveActor(bot,dx/distance*155*bot.progression.speedMultiplier*dt,dy/distance*155*bot.progression.speedMultiplier*dt,false);
  return;
 }
 bot.inventory.equip(1);
 if(bot.retreat>0){bot.retreat-=dt;bot.intent='RETREATING';world.moveActor(bot,-dx/distance*170*dt,-dy/distance*170*dt,false);return;}
 const sx=bot.shore.x-bot.x,sy=bot.shore.y-bot.y,shoreDistance=Math.hypot(sx,sy);
 bot.intent='TO SHORE';
 if(shoreDistance>8)world.moveActor(bot,sx/shoreDistance*145*dt,sy/shoreDistance*145*dt,false);
 else world.castActor(bot,bot.shore.aim);
}
