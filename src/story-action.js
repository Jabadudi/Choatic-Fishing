import {currentScene,CABIN} from './story.js';
import {walkable} from './wilds.js';
// Scripted story motion runs in fixed simulation steps; rendering only observes it.
const playback=new WeakMap();
// Night attack choreography, in seconds. The rescue illustration opens once the fight on the shore has played out.
export const NIGHT_ATTACK=Object.freeze({approach:3.4,charge:1,leap:.45,knockback:.35,howl:2.8,fight:3.6,art:7});
const DURATIONS={collapse:NIGHT_ATTACK.approach,rescue:NIGHT_ATTACK.fight+NIGHT_ATTACK.art,blackout:1.5};
// The shadow walker steps out in front of the cabin, west of the door Eli flees through.
const WALKER_START=[1500,1604],WALKER_PORCH=[1566,1612],WALKER_GAP=48;
export const storyAction=world=>currentScene(world)?.action||null;
const stateFor=world=>playback.get(world)||playback.get(Object.getPrototypeOf(world));
export const storyActionElapsed=world=>{const state=stateFor(world);return state&&state.key===world.story?.scene+':'+world.story?.page?state.elapsed:0;};
export function updateStoryAction(world,dt){
 const action=storyAction(world);if(!action||!Number.isFinite(dt)||dt<=0)return false;
 const key=world.story.scene+':'+world.story.page;let state=playback.get(world);
 if(state?.key!==key){state={key,elapsed:0,shore:0,waypoint:0,route:world.areaId==='cabin'?[[420,410],[320,420],[320,465]]:[[1660,1620],[1740,1650]]};playback.set(world,state);world.cancel();Object.assign(world.player,{vx:0,vy:0,dashRemaining:0});}
 const step=Math.min(dt,.1);state.elapsed+=step;world.elapsed+=step;
 if(action==='escape'){
  if(world.areaId==='landing')state.shore+=step;
  const goal=state.route[state.waypoint],p=world.player;
  if(goal){const dx=goal[0]-p.x,dy=goal[1]-p.y,d=Math.hypot(dx,dy),travel=Math.min(d,180*step);
   if(d<1)state.waypoint++;
   else{const x=p.x+dx/d*travel,y=p.y+dy/d*travel;if(walkable(x,y,world.areaId)){p.x=x;p.y=y;p.angle=Math.atan2(dy,dx);p.walkTime=(p.walkTime||0)+travel*.14;}else state.waypoint++;}
  }else if(world.areaId==='cabin'){world.areaId='landing';p.x=CABIN.x;p.y=1570;state.route=[[1660,1620],[1740,1650]];state.waypoint=0;}
  else{world.advanceStory();playback.delete(world);}
 }else if(state.elapsed>=(DURATIONS[action]??2.2)){world.advanceStory();playback.delete(world);}
 return true;
}
const mix=(a,b,u)=>a+(b-a)*Math.max(0,Math.min(1,u));
// Poses for the shadow walker and Moonfang. A pure reading of playback time: drawing never moves them.
export function nightAttackActors(world){
 const action=storyAction(world);if(world.areaId!=='landing'||!['escape','collapse','rescue'].includes(action))return [];
 const state=stateFor(world),t=storyActionElapsed(world),p=world.player;
 if(action==='escape'){
  const u=(state?.shore||0)/.8;
  return [{spriteId:'nightwalker',x:mix(WALKER_START[0],WALKER_PORCH[0],u),y:mix(WALKER_START[1],WALKER_PORCH[1],u),state:'walk',time:state?.shore||0,facingX:1}];
 }
 // Ten feet. Eight. Six. The walker closes on Eli where he fell, then lifts the axe.
 const stopX=p.x-WALKER_GAP,stopY=p.y-2,walk=NIGHT_ATTACK.approach-.6;
 if(action==='collapse'){
  const u=t/walk;
  return [{spriteId:'nightwalker',x:mix(WALKER_PORCH[0],stopX,u),y:mix(WALKER_PORCH[1],stopY,u),state:u<1?'walk':'raise',time:u<1?t:t-walk,facingX:1}];
 }
 const {charge,leap,knockback,howl}=NIGHT_ATTACK,hit=charge+leap;
 const walker={spriteId:'nightwalker',x:stopX-(t>hit?mix(0,46,(t-hit)/knockback):0),y:stopY,state:t<hit?'raise':'death',time:t<hit?1:t-hit,facingX:1};
 // Moonfang comes out of the dark from the east, leaps over Eli and slams into the walker.
 const startX=p.x+380,runEnd=p.x+62,landX=stopX+8;let wolf;
 if(t<charge)wolf={state:'run',x:mix(startX,runEnd,t/charge),y:p.y-8,time:t};
 else if(t<hit){const u=(t-charge)/leap;wolf={state:'leap',x:mix(runEnd,landX,u),y:mix(p.y-8,stopY,u),lift:Math.sin(Math.PI*u)*30,time:t-charge,duration:leap};}
 else if(t<howl)wolf={state:'land',x:landX,y:stopY,time:0};
 else wolf={state:'howl',x:landX,y:stopY,time:t-howl};
 return [walker,{spriteId:'moonfang-charge',facingX:-1,...wolf}];
}
