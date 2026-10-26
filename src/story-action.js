import {currentScene,CABIN} from './story.js';
import {walkable} from './wilds.js';
// Scripted story motion runs in fixed simulation steps; rendering only observes it.
const playback=new WeakMap(),night=new WeakMap();
// Night attack staging. About 8 world units to a foot: the walker appears 20 feet behind Eli and Moonfang strikes at 10.
export const NIGHT_ATTACK=Object.freeze({foot:8,spawnGap:160,strikeGap:80,fleeSpeed:95,walkerSpeed:58,closingSpeed:72,charge:1,leap:.4,fight:3,art:7,maxApproach:8});
const DURATIONS={rescue:NIGHT_ATTACK.fight+NIGHT_ATTACK.art,blackout:1.5};
const SHORE_ROUTE=[[1660,1620],[1740,1650],[1840,1660]];
export const storyAction=world=>currentScene(world)?.action||null;
const stateFor=(map,world)=>map.get(world)||(world&&map.get(Object.getPrototypeOf(world)));
export const storyActionElapsed=world=>{const state=stateFor(playback,world);return state&&state.key===world.story?.scene+':'+world.story?.page?state.elapsed:0;};
const towards=(a,x,y,speed,step,stop=0)=>{const dx=x-a.x,dy=y-a.y,d=Math.hypot(dx,dy),travel=Math.min(Math.max(0,d-stop),speed*step);if(d>0){a.x+=dx/d*travel;a.y+=dy/d*travel;}return d-travel<=stop+.5;};
function updateNightAttack(world,action,state,step){
 const p=world.player,{spawnGap,strikeGap,walkerSpeed,closingSpeed,charge,leap}=NIGHT_ATTACK;
 if(!['escape','collapse','rescue'].includes(action)||world.areaId!=='landing'){if(action!=='escape')night.delete(world);return false;}
 let n=night.get(world);
 // The walker steps out of the dark 20 feet to Eli's left as he comes through the cabin door. Restored saves pick it up the same distance behind him.
 if(!n){n={walker:{x:p.x-spawnGap,y:p.y,state:'walk',time:0},wolf:null};night.set(world,n);}
 const w=n.walker;w.time+=step;
 if(action==='escape'){towards(w,p.x,p.y,walkerSpeed,step);w.state='walk';return false;}
 if(action==='collapse'){
  if(w.state==='walk'&&towards(w,p.x,p.y-2,closingSpeed,step,strikeGap)){w.state='raise';w.time=0;}
  return w.state==='raise'&&w.time>=.25||state.elapsed>=NIGHT_ATTACK.maxApproach;
 }
 // Moonfang runs in from behind the walker, leaps and brings it down in one strike.
 const t=state.elapsed;
 if(!n.wolf){if(w.state==='walk'){w.state='raise';w.time=0;}n.wolf={x:w.x-330,y:w.y+4,state:'run',time:0,facingX:1,start:w.x-330,target:w.x};}
 const f=n.wolf;f.time+=step;
 if(t<charge){f.state='run';f.x=f.start+(f.target-70-f.start)*t/charge;}
 else if(t<charge+leap){const u=(t-charge)/leap;if(f.state!=='leap'){f.state='leap';f.time=0;f.duration=leap;}f.x=f.target-70+90*u;f.y=w.y+4-4*u;f.lift=Math.sin(Math.PI*u)*30;}
 else{if(f.state!=='land'){f.state='land';f.time=0;f.lift=0;f.x=f.target+20;f.y=w.y;w.state='death';w.time=0;}}
 return false;
}
export function updateStoryAction(world,dt){
 const action=storyAction(world);if(!action||!Number.isFinite(dt)||dt<=0)return false;
 const key=world.story.scene+':'+world.story.page;let state=playback.get(world);
 if(state?.key!==key){state={key,elapsed:0,waypoint:0,route:world.areaId==='cabin'?[[420,410],[320,420],[320,465]]:SHORE_ROUTE};playback.set(world,state);world.cancel();Object.assign(world.player,{vx:0,vy:0,dashRemaining:0});}
 const step=Math.min(dt,.1);state.elapsed+=step;world.elapsed+=step;
 const approached=updateNightAttack(world,action,state,step);
 if(action==='escape'){
  // Eli bolts through the cabin, then flees the walker along the shore.
  const goal=state.route[state.waypoint],p=world.player,speed=world.areaId==='landing'?NIGHT_ATTACK.fleeSpeed:180;
  if(goal){const dx=goal[0]-p.x,dy=goal[1]-p.y,d=Math.hypot(dx,dy),travel=Math.min(d,speed*step);
   if(d<1)state.waypoint++;
   else{const x=p.x+dx/d*travel,y=p.y+dy/d*travel;if(walkable(x,y,world.areaId)){p.x=x;p.y=y;p.angle=Math.atan2(dy,dx);p.walkTime=(p.walkTime||0)+travel*.14;}else state.waypoint++;}
  }else if(world.areaId==='cabin'){world.areaId='landing';p.x=CABIN.x;p.y=1570;state.route=SHORE_ROUTE;state.waypoint=0;}
  else{world.advanceStory();playback.delete(world);}
 }else if(action==='collapse'?approached:state.elapsed>=(DURATIONS[action]??2.2)){world.advanceStory();playback.delete(world);}
 return true;
}
// Read-only copies of the night attack poses for the renderer.
export function nightAttackActors(world){
 const n=stateFor(night,world);if(!n||world.areaId!=='landing'||!['escape','collapse','rescue'].includes(storyAction(world)))return [];
 return [{spriteId:'nightwalker',facingX:1,...n.walker},...n.wolf?[{spriteId:'moonfang-charge',...n.wolf}]:[]];
}
