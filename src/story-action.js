import {currentScene,CABIN} from './story.js';
import {walkable} from './wilds.js';
// Scripted story motion runs in fixed simulation steps; rendering only observes it.
const playback=new WeakMap();
export const storyAction=world=>currentScene(world)?.action||null;
export function updateStoryAction(world,dt){
 const action=storyAction(world);if(!action||!Number.isFinite(dt)||dt<=0)return false;
 const key=world.story.scene+':'+world.story.page;let state=playback.get(world);
 if(state?.key!==key){state={key,elapsed:0,waypoint:0,route:world.areaId==='cabin'?[[420,410],[320,420],[320,465]]:[[1660,1620],[1740,1650]]};playback.set(world,state);world.cancel();Object.assign(world.player,{vx:0,vy:0,dashRemaining:0});}
 const step=Math.min(dt,.1);state.elapsed+=step;world.elapsed+=step;
 if(action==='escape'){
  const goal=state.route[state.waypoint],p=world.player;
  if(goal){const dx=goal[0]-p.x,dy=goal[1]-p.y,d=Math.hypot(dx,dy),travel=Math.min(d,180*step);
   if(d<1)state.waypoint++;
   else{const x=p.x+dx/d*travel,y=p.y+dy/d*travel;if(walkable(x,y,world.areaId)){p.x=x;p.y=y;p.angle=Math.atan2(dy,dx);p.walkTime=(p.walkTime||0)+travel*.14;}else state.waypoint++;}
  }else if(world.areaId==='cabin'){world.areaId='landing';p.x=CABIN.x;p.y=1570;state.route=[[1660,1620],[1740,1650]];state.waypoint=0;}
  else{world.advanceStory();playback.delete(world);}
 }else if(state.elapsed>=(action==='rescue'?7:action==='blackout'?1.5:2.2)){world.advanceStory();playback.delete(world);}
 return true;
}
