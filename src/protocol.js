import {World,createActor} from './world.js';
export const VERSION=1;
export const neutralInput=()=>({left:false,right:false,up:false,down:false,held:false,aim:{x:480,y:365}});
export function cleanInput(raw){
 if(!raw||!Number.isFinite(raw.aim?.x)||!Number.isFinite(raw.aim?.y))return null;
 return {left:raw.left===true,right:raw.right===true,up:raw.up===true,down:raw.down===true,held:raw.held===true,aim:{x:Math.max(-960,Math.min(1920,raw.aim.x)),y:Math.max(-720,Math.min(1440,raw.aim.y))}};
}
export function applyAction(world,id,action,input){
 const actor=world.humans.find(actor=>actor.id===id);if(!actor||actor.health<=0||world.matchState!=='playing')return false;
 return world.asActor(actor,()=>{
  actor.angle=Math.atan2(input.aim.y-actor.y,input.aim.x-actor.x);
  switch(action){
   case 'toggle':return actor.fishing.state==='idle'?world.cast(input.aim):world.cancel();
   case 'cancel':return world.cancel();
   case 'rod':return world.equip(1);
   case 'item':return world.equip(2);
   case 'use':return world.useItem();
   case 'click':return actor.fishing.state==='idle'?(actor.inventory.selected===2?world.useItem():world.cast(input.aim)):false;
   case 'dash':return world.dash(input);
   case 'tidal':return world.useSpecial('tidal');
   case 'whirlpool':return world.useSpecial('whirlpool');
   case 'choose-tidal':return actor.progression.choose('tidal');
   case 'choose-whirlpool':return actor.progression.choose('whirlpool');
   default:return false;
  }
 });
}
export function snapshot(world){
 return {version:VERSION,matchState:world.matchState,countdownRemaining:world.countdownRemaining,elapsed:world.elapsed,
 actors:world.actors.map(actor=>({...actor,fishing:{...actor.fishing,random:undefined},progression:{...actor.progression,eliminations:[...actor.progression.eliminations]}})),
 effects:world.effects,projectiles:world.projectiles.map(shot=>({...shot,owner:undefined,ownerId:shot.owner.id,hit:[...shot.hit]}))};
}
export function fromSnapshot(data,localId){
 if(data?.version!==VERSION||!Array.isArray(data.actors)||data.actors.length>4||!data.actors.some(actor=>actor.id===localId))return null;
 const world=new World(Math.random,{botCount:0,countdownSeconds:0});
 world.online=true;world.matchState=data.matchState;world.countdownRemaining=data.countdownRemaining;world.elapsed=data.elapsed;
 world.actors=data.actors.map(raw=>{const actor=createActor(raw.id,raw.name,raw.x,raw.y,Math.random);const {fishing,progression,inventory,...fields}=raw;Object.assign(actor,fields);Object.assign(actor.fishing,fishing);Object.assign(actor.inventory,inventory);Object.assign(actor.progression,progression,{eliminations:new Set(progression.eliminations)});return actor;});
 world.humans=world.actors;world.player=world.actors.find(actor=>actor.id===localId);world.bots=[];world.effects=data.effects||[];
 world.projectiles=(data.projectiles||[]).map(shot=>({...shot,owner:world.actors.find(actor=>actor.id===shot.ownerId),hit:new Set(shot.hit)}));return world;
}
