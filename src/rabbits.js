import {walkable,waterDistance,areaFor} from './wilds.js';

import {drawEntitySprite,spriteFrame} from './sprites.js';
export {RABBIT_FRAMES} from './sprite-definitions.js';
const HOMES=[{x:1460,y:1540},{x:1000,y:1450},{x:1680,y:1300},{x:1070,y:850},{x:1670,y:770}];
function random(r){let n=r.seed;n^=n<<13;n^=n>>>17;n^=n<<5;r.seed=n>>>0;return r.seed/4294967296;}
export function rabbitGround(x,y,areaId){
 const a=areaFor(areaId);
 return x>80&&y>110&&x<a.width-80&&y<a.height-100&&waterDistance(x,y,areaId)>22&&walkable(x,y,areaId);
}
export function createRabbits(){
 return HOMES.map((home,i)=>{
  let position=null;
  for(let ring=0;ring<8&&!position;ring++)for(let j=0;j<16;j++){const angle=j*Math.PI/8,x=home.x+Math.cos(angle)*ring*14,y=home.y+Math.sin(angle)*ring*14;if(rabbitGround(x,y,'landing')){position={x,y};break;}}
  if(!position)return null;
  return {id:`rabbit-${i}`,areaId:'landing',...position,home:{...position},seed:7319+i*971,state:'idle',time:0,wait:1+i*.37,alert:0,direction:{x:-1,y:0},hopDuration:.65,hopDistance:0};
 }).filter(Boolean);
}
function startHop(r,player){
 let angle;
 if(r.alert>0)angle=Math.atan2(r.y-player.y,r.x-player.x);
 else if(Math.hypot(r.x-r.home.x,r.y-r.home.y)>145)angle=Math.atan2(r.home.y-r.y,r.home.x-r.x);
 else angle=random(r)*Math.PI*2;
 const distance=r.alert>0?68+random(r)*18:28+random(r)*22;
 const turn=(random(r)-.5)*.5;
 for(const offset of [turn,.55,-.55,1.1,-1.1,Math.PI]){
  const dx=Math.cos(angle+offset),dy=Math.sin(angle+offset);
  let clear=true;
  for(let step=1;step<=Math.ceil(distance/5);step++){const d=Math.min(distance,step*5);if(!rabbitGround(r.x+dx*d,r.y+dy*d,r.areaId)){clear=false;break;}}
  if(!clear)continue;
  r.direction={x:dx,y:dy};r.hopDuration=r.alert>0?.42:.65;r.hopDistance=distance;r.state='hop';r.time=0;return true;
 }
 r.state='idle';r.time=0;r.wait=.35;return false;
}
export function updateRabbits(world,dt){
 if(!world.adventure||world.matchState!=='playing')return;
 for(const r of world.rabbits||[]){
  if(r.areaId!==world.areaId)continue;
  r.alert=Math.max(0,r.alert-dt);
  const close=Math.hypot(r.x-world.player.x,r.y-world.player.y)<125;
  if(close){r.alert=1.3;if(r.state!=='hop')startHop(r,world.player);}
  r.time+=dt;
  if(r.state==='hop'){
   const step=Math.min(dt,Math.max(0,r.hopDuration-(r.time-dt))),distance=r.hopDistance*step/r.hopDuration;
   const count=Math.max(1,Math.ceil(distance/4));
   for(let i=0;i<count;i++){const x=r.x+r.direction.x*distance/count,y=r.y+r.direction.y*distance/count;if(rabbitGround(x,y,r.areaId)){r.x=x;r.y=y;}else break;}
   if(r.time>=r.hopDuration){if(r.alert>0)startHop(r,world.player);else {r.state='settle';r.time=0;}}
  }else if(r.state==='settle'&&r.time>=.7){r.state='idle';r.time=0;r.wait=1.8+random(r)*2.8;}
  else if(r.state==='idle'&&r.time>=r.wait){r.state='graze';r.time=0;r.wait=1+random(r)*1.4;}
  else if(r.state==='graze'&&r.time>=r.wait)startHop(r,world.player);
 }
}
export function rabbitFrame(r){return spriteFrame('rabbit',r.state,r.time,{duration:r.state==='hop'?r.hopDuration:undefined});}
export function drawRabbits(ctx,world,view){
 if(!world.adventure||!world.rabbits?.length)return;
 for(const r of visibleRabbits(world,view).sort((a,b)=>a.y-b.y))drawRabbit(ctx,r);
}
export const visibleRabbits=(world,view)=>(world.rabbits||[]).filter(r=>r.areaId===world.areaId&&(!view||(r.x>view.left-40&&r.x<view.right+40&&r.y>view.top-50&&r.y<view.bottom+40)));
export function drawRabbit(ctx,r){
 const hop=r.state==='hop'?Math.sin(Math.min(1,r.time/r.hopDuration)*Math.PI)*5:0;
 ctx.save();ctx.fillStyle='#263d3438';ctx.beginPath();ctx.ellipse(r.x,r.y+1,8-hop*.3,3,0,0,Math.PI*2);ctx.fill();ctx.restore();
 if(drawEntitySprite(ctx,r.spriteId||'rabbit',{x:r.x,y:r.y-hop,state:r.state,time:r.time,duration:r.state==='hop'?r.hopDuration:undefined,facingX:r.direction.x}))return;
 // Visible fallback while a replacement is loading or has incompatible crops.
 ctx.fillStyle='#d2cfdf';ctx.fillRect(r.x-7,r.y-hop-12,14,12);ctx.fillRect(r.x-5,r.y-hop-23,3,13);ctx.fillRect(r.x+1,r.y-hop-22,3,12);
}
