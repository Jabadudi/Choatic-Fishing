import {World,createActor} from './world.js';
export const VERSION=5;
export const neutralInput=()=>({left:false,right:false,up:false,down:false,held:false,aim:{x:480,y:365}});
export function cleanInput(raw){
 if(!raw||!Number.isFinite(raw.aim?.x)||!Number.isFinite(raw.aim?.y))return null;
 return {left:raw.left===true,right:raw.right===true,up:raw.up===true,down:raw.down===true,held:raw.held===true,aim:{x:Math.max(-960,Math.min(2600,raw.aim.x)),y:Math.max(-720,Math.min(2100,raw.aim.y))}};
}
export function applyAction(world,id,action,input){
 const actor=world.humans.find(actor=>actor.id===id);if(!actor||actor.health<=0||world.matchState!=='playing')return false;
 return world.asActor(actor,()=>{
  actor.angle=Math.atan2(input.aim.y-actor.y,input.aim.x-actor.x);
  if(/^slot-[1-7]$/.test(action))return world.equip(Number(action.slice(5)));
  switch(action){
   case 'upgrade-hermes':return world.chooseUpgrade('hermes');
   case 'upgrade-dash':return world.chooseUpgrade('dash');
   case 'upgrade-health':return world.chooseUpgrade('health');
   case 'toggle':return actor.fishing.state==='idle'?world.cast(input.aim):world.cancel();
   case 'cancel':return world.cancel();
   case 'rod':return world.equip(1);
   case 'item':return world.equip(2);
   case 'use':return world.useItem();
   case 'click':return actor.fishing.state==='idle'?(actor.inventory.selected>1?world.useItem():world.cast(input.aim)):false;
   case 'dash':return world.dash(input);
   case 'tidal':return world.useSpecial('tidal');
   case 'whirlpool':return world.useSpecial('whirlpool');
   case 'choose-tidal':return actor.progression.choose('tidal');
   case 'choose-whirlpool':return actor.progression.choose('whirlpool');
   default:return false;
  }
 });
}
const round=n=>Math.round(n*1000)/1000;
export function snapshot(world){
 return {version:VERSION,matchState:world.matchState,countdownRemaining:world.countdownRemaining,elapsed:world.elapsed,chests:world.chests,
 actors:world.actors.map(actor=>{
  const {catches,route,routeAt,goalX,goalY,shore,...fields}=actor;
  return {...fields,catchCount:catches.length,x:round(actor.x),y:round(actor.y),angle:round(actor.angle),vx:round(actor.vx),vy:round(actor.vy),health:round(actor.health),fishing:{...actor.fishing,random:undefined,result:null},progression:{...actor.progression,eliminations:[...actor.progression.eliminations]}};
 }),
 effects:world.effects,projectiles:world.projectiles.map(shot=>({...shot,owner:undefined,ownerId:shot.owner.id,hit:[...shot.hit]}))};
}
export function fromSnapshot(data,localId,existing=null){
 if(data?.version!==VERSION||!Array.isArray(data.actors)||data.actors.length>4||!data.actors.some(actor=>actor.id===localId))return null;
 const world=existing||new World(Math.random,{botCount:0,countdownSeconds:0});
 const previous=new Map(world.actors.map(actor=>[actor.id,actor]));
 world.chests=data.chests.map(c=>({...c}));world.online=true;world.matchState=data.matchState;world.countdownRemaining=data.countdownRemaining;world.elapsed=data.elapsed;
 world.actors=data.actors.map(raw=>{const actor=previous.get(raw.id)||createActor(raw.id,raw.name,raw.x,raw.y,Math.random);const {fishing,progression,inventory,...fields}=raw;Object.assign(actor,fields);Object.assign(actor.fishing,fishing);Object.assign(actor.inventory,inventory);Object.assign(actor.progression,progression,{eliminations:new Set(progression.eliminations)});return actor;});
 world.humans=world.actors;world.player=world.actors.find(actor=>actor.id===localId);world.bots=[];world.effects=data.effects||[];
 world.projectiles=(data.projectiles||[]).map(shot=>({...shot,owner:world.actors.find(actor=>actor.id===shot.ownerId),hit:new Set(shot.hit)}));return world;
}
