import {Fishing,ITEMS} from './fishing.js';
import {Progression,XP} from './progression.js';
import {Inventory} from './inventory.js';
import {attack,special,updateProjectiles} from './combat.js';
import {updateBot} from './bots.js';
import {LAND,CHESTS,LAKES,lakeDistance,isWater,nearWater,walkable} from './terrain.js';
import * as Wilds from './wilds.js';
export {LAND} from './terrain.js';
export const SHORE_DEPTH=110;
export const INLAND={left:LAND.left+SHORE_DEPTH,right:LAND.right-SHORE_DEPTH,top:LAND.top+SHORE_DEPTH,bottom:LAND.bottom-SHORE_DEPTH};
export function createActor(id,name,x,y,random){return {id,name,x,y,angle:0,health:100,vx:0,vy:0,cooldown:0,dashCharges:1,dashRemaining:0,dashCooldown:0,dashDirection:{x:0,y:0},message:'',catches:[],inventory:new Inventory(),progression:new Progression(),fishing:new Fishing(random),bobber:null,retreat:0,intent:'TO SHORE'};}
export class World {
 constructor(random=Math.random,{botCount=1,countdownSeconds=5,humans=null,adventure=false}={}){
  this.random=random;this.player=createActor('player','YOU',480,365,random);
  this.online=!!humans;this.chests=CHESTS.map(c=>({...c,opened:false}));
  const spawns=[{name:'BRINE',x:220,y:180,aim:{x:80,y:180}},{name:'HOOK',x:740,y:180,aim:{x:880,y:180}},{name:'GILL',x:740,y:550,aim:{x:880,y:550}}];
  this.bots=spawns.slice(0,botCount).map((spawn,i)=>Object.assign(createActor(`bot-${i}`,spawn.name,spawn.x,spawn.y,random),{shore:spawn,color:['#ef947a','#d4a7dc','#f0c67c'][i]}));
  this.actors=[this.player,...this.bots];this.effects=[];this.projectiles=[];this.elapsed=0;this.catches=[];this.message='';
  this.countdownRemaining=countdownSeconds;this.matchState=countdownSeconds>0?'countdown':'playing';
  this.dashRemaining=0;this.dashCooldown=0;this.dashDirection={x:0,y:0};
  this.humans=[this.player];
  if(humans){
   const positions=[[480,550],[480,180],[220,365],[740,365]];
   this.humans=humans.map((human,i)=>Object.assign(createActor(human.id,human.name,...positions[i],random),{color:['#b8db94','#ef947a','#d4a7dc','#f0c67c'][i]}));
   this.player=this.humans[0];this.bots=[];this.actors=[...this.humans];
  }
  this.adventure=adventure;
  if(adventure){this.areaId='landing';Object.assign(this.player,Wilds.SPAWN);this.bots=[];this.actors=[this.player];this.humans=[this.player];this.chests=[];this.countdownRemaining=0;this.matchState='playing';this.discovered=new Set();this.message='Welcome to Reedwater Landing. Follow the north trail to walk into Windchime Path. M opens the area map.';}
 }
 get fishing(){return this.player.fishing;}get progression(){return this.player.progression;}get inventory(){return this.player.inventory;}
 get message(){return this.player.message;}set message(value){this.player.message=value;}
 get catches(){return this.player.catches;}set catches(value){this.player.catches=value;}
 get dashRemaining(){return this.player.dashRemaining;}set dashRemaining(value){this.player.dashRemaining=value;}
 get dashCooldown(){return this.player.dashCooldown;}set dashCooldown(value){this.player.dashCooldown=value;}
 get dashDirection(){return this.player.dashDirection;}set dashDirection(value){this.player.dashDirection=value;}
 asActor(actor,callback){const previous=this.player;this.player=actor;try{return callback();}finally{this.player=previous;}}
 get bobber(){return this.player.bobber;}set bobber(value){this.player.bobber=value;}
 get useCooldown(){return this.player.cooldown;}set useCooldown(value){this.player.cooldown=value;}
 equip(slot){if(this.matchState!=='playing')return false;if(this.fishing.state!=='idle')this.cancel();return this.inventory.equip(slot);}
 useActorItem(actor){
  if(this.matchState!=='playing'||actor.health<=0||actor.fishing.state!=='idle'||actor.cooldown>0)return false;
  if(actor.inventory.selected===2&&actor.inventory.item?.name==='Treasure Key'){
   if(this.chests.every(c=>c.opened)){actor.inventory.use();actor.message='All chests are open. Spare key discarded.';return true;}
   const chest=this.chests.find(c=>!c.opened&&Math.hypot(actor.x-c.x,actor.y-c.y)<=70);
   if(!chest){actor.message='Find an unopened chest and stand close to use your key.';return false;}
   actor.inventory.use();chest.opened=true;actor.health=actor.progression.maxHealth;actor.message='Treasure unlocked! Health fully restored.';return true;
  }
  const item=actor.inventory.use();if(!item)return false;
  attack(this,actor,item);return true;
 }
 useItem(){
  const name=this.inventory.item?.name;
  if(!this.useActorItem(this.player)){if(!this.inventory.item)this.message='Slot 2 is empty. Fish for an item.';return false;}
  if(name==='Treasure Key')return true;
  this.message=this.inventory.item?`${name} · ${this.inventory.item.uses} uses left.`:`${name} used up. Slot clear — fish again.`;return true;
 }
 useSpecial(kind,actor=this.player){const used=special(this,actor,kind);if(actor===this.player)this.message=used?`${kind==='tidal'?'Tidal Cannon':'Whirlpool Burst'} unleashed!`:'Special unavailable. Earn a charge, abandon fishing, and let your attack recover.';return used;}
 recordElimination(victimId){return this.progression.recordElimination(victimId);}
 nearestWater(actor=this.player){return this.adventure?Wilds.nearWater(actor.x,actor.y,this.areaId):nearWater(actor.x,actor.y);}
 inspect(){
  if(!this.adventure||this.matchState!=='playing')return false;
  const place=Wilds.nearestLandmark(this.player.x,this.player.y,this.areaId);
  if(!place)return false;
  this.discovered.add(place.id);this.message=place.text;return true;
 }
 move(dx,dy,shoreOnly){this.moveActor(this.player,dx,dy,shoreOnly);}
 chooseUpgrade(kind,actor=this.player){
  if(this.matchState!=='playing'||actor.health<=0||!actor.progression.chooseUpgrade(kind))return false;
  if(kind==='health')actor.health=Math.min(actor.progression.maxHealth,actor.health+20);
  if(kind==='dash')actor.dashCharges++;
  actor.message=kind==='hermes'?'Hermes Boots stacked: +15% movement speed.':kind==='dash'?'Extra Dash stacked: +1 dash charge.':'Max Health stacked: +20 maximum and current HP.';return true;
 }
 dash(input={}){
  if(this.matchState!=='playing'||this.player.health<=0||this.fishing.state==='waiting'||this.dashRemaining>0||this.player.dashCharges<=0)return false;
  let x=Number(!!input.right)-Number(!!input.left),y=Number(!!input.down)-Number(!!input.up);
  const length=Math.hypot(x,y);
  if(length){x/=length;y/=length;}else{x=Math.cos(this.player.angle);y=Math.sin(this.player.angle);}
  this.player.dashCharges--;this.dashDirection={x,y};this.dashRemaining=.16;return true;
 }
 moveActor(p,dx,dy,shoreOnly){
  if(dx===0&&dy===0)return;
  if(this.adventure){
   const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5)),sx=dx/steps,sy=dy/steps;
   for(let i=0;i<steps;i++){if(Wilds.walkable(p.x+sx,p.y,this.areaId)&&(!shoreOnly||Wilds.nearWater(p.x+sx,p.y,this.areaId)))p.x+=sx;if(Wilds.walkable(p.x,p.y+sy,this.areaId)&&(!shoreOnly||Wilds.nearWater(p.x,p.y+sy,this.areaId)))p.y+=sy;}
   const next=Wilds.transitionAt(p.x,p.y,this.areaId);
   if(next){this.areaId=next.areaId;p.x=next.x;p.y=next.y;p.vx=0;p.vy=0;this.cancel();this.message=`${Wilds.areaFor(this.areaId).name} · Walk back through the edge to return.`;}
   p.walkTime=(p.walkTime||0)+Math.hypot(dx,dy)*.14;return;
  }
  let x=Math.max(LAND.left+15,Math.min(LAND.right-15,p.x+dx));
  if(shoreOnly&&!LAKES.some(l=>lakeDistance(p.x,p.y,l)<=110)&&p.y>INLAND.top&&p.y<INLAND.bottom){if(p.x<=INLAND.left)x=Math.min(x,INLAND.left);else if(p.x>=INLAND.right)x=Math.max(x,INLAND.right);}
  let y=Math.max(LAND.top+15,Math.min(LAND.bottom-15,p.y+dy));
  if(shoreOnly&&!LAKES.some(l=>lakeDistance(p.x,p.y,l)<=110)&&x>INLAND.left&&x<INLAND.right){if(p.y<=INLAND.top)y=Math.min(y,INLAND.top);else if(p.y>=INLAND.bottom)y=Math.max(y,INLAND.bottom);}
  // Substeps prevent dashes and knockback from crossing water or solid scenery.
  const steps=Math.max(1,Math.ceil(Math.hypot(x-p.x,y-p.y)/5)),sx=(x-p.x)/steps,sy=(y-p.y)/steps;
  for(let i=0;i<steps;i++){if(walkable(p.x+sx,p.y)&&(!shoreOnly||nearWater(p.x+sx,p.y)))p.x+=sx;if(walkable(p.x,p.y+sy)&&(!shoreOnly||nearWater(p.x,p.y+sy)))p.y+=sy;}
  if(Math.abs(p.x-x)<1e-8)p.x=x;if(Math.abs(p.y-y)<1e-8)p.y=y;
 }
 castActor(actor,aim){
  if(this.matchState!=='playing'||actor.health<=0||actor.fishing.state!=='idle')return false;
  if(actor.inventory.selected!==1){if(actor===this.player)this.message='Equip the fishing rod with 1 first.';return false;}
  if(actor.inventory.item){if(actor===this.player)this.message='Item slot full. Equip 2 and use your item before fishing again.';return false;}
  if(!this.nearestWater(actor)){if(actor===this.player)this.message='Move closer to the shoreline to cast.';return false;}
  if(!(this.adventure?Wilds.isWater(aim.x,aim.y,this.areaId):isWater(aim.x,aim.y))){if(actor===this.player)this.message='Aim out over the water, then cast.';return false;}
  if(!actor.fishing.cast())return false;actor.bobber={...aim};return true;
 }
 cast(aim){const result=this.castActor(this.player,aim);if(result)this.message='Line cast. Waiting for a bite…';return result;}
 cancel(){if(this.fishing.cancel()){this.bobber=null;this.message='Line abandoned. You’re free to move.';}}
 advanceFishing(actor,dt,held){
  actor.fishing.update(dt,held);
  if(actor.fishing.state==='caught'){
   const item=actor.fishing.result.name==='Treasure Key'&&this.chests.every(c=>c.opened)?ITEMS[6]:actor.fishing.result;actor.inventory.receive(item);actor.progression.award(XP.catch);
   const buff=actor.progression.grantCatchBuff(this.random);if(buff.id==='vitality')actor.health+=10;
   if(actor===this.player){this.catches.push(item);this.message=`${item.name} caught! ${buff.name}: ${buff.description} · +30 XP`;}
   actor.fishing.state='idle';actor.bobber=null;
  }else if(actor.fishing.state==='escaped'){if(actor===this.player)this.message='It got away. Try again.';actor.fishing.state='idle';actor.bobber=null;}
 }
 update(dt,input,remoteInputs={}){
  if(this.matchState==='countdown'){
   this.countdownRemaining=Math.max(0,this.countdownRemaining-dt);
   if(this.countdownRemaining<1e-9){this.countdownRemaining=0;this.matchState='playing';this.message='Go! Fish for gear and defeat your opponent.';}
   return;
  }
  if(this.matchState!=='playing')return;
  this.elapsed+=dt;this.effects=this.effects.filter(effect=>(effect.life-=dt)>0);
  for(const actor of this.actors){actor.cooldown=Math.max(0,actor.cooldown-dt);if(actor.health<=0)continue;actor.progression.tickUpgrades(dt);actor.health=Math.min(actor.progression.maxHealth,actor.health+dt);this.moveActor(actor,actor.vx*dt,actor.vy*dt,actor.fishing.state!=='idle');actor.vx*=Math.exp(-9*dt);actor.vy*=Math.exp(-9*dt);}
  for(const human of this.humans){
   const actorInput=human===this.player?input:remoteInputs[human.id]||{left:false,right:false,up:false,down:false,held:false,aim:{x:human.x+1,y:human.y}};
   if(human.health>0)this.asActor(human,()=>this.updateHuman(dt,actorInput));
  }
  for(const bot of this.bots){if(bot.health<=0)continue;if(bot.progression.pendingUpgrades)this.chooseUpgrade(['hermes','health'][Math.floor(this.random()*2)],bot);updateBot(this,bot,dt);const f=bot.fishing;this.advanceFishing(bot,dt,f.state==='reeling'&&f.bar+f.velocity*.2+.135<f.target);}
  updateProjectiles(this,dt);
  if(this.adventure){const place=Wilds.nearestLandmark(this.player.x,this.player.y,this.areaId);if(place)this.discovered.add(place.id);}
  else if(this.online){if(this.actors.filter(actor=>actor.health>0).length<=1){this.matchState='finished';for(const actor of this.actors){actor.fishing.cancel();actor.bobber=null;}}}
  else if(this.player.health<=0){this.matchState='lost';this.cancel();this.message='You were eliminated.';}
  else if(this.bots.length&&this.bots.every(bot=>bot.health<=0)){this.matchState='won';this.cancel();this.message='Last angler standing!';}
 }
 updateHuman(dt,input){
  const dashing=this.dashRemaining>0;
  if(dashing){
   const step=Math.min(dt,this.dashRemaining);
   this.move(this.dashDirection.x*850*step,this.dashDirection.y*850*step,this.fishing.state!=='idle');
   this.dashRemaining=Math.max(0,this.dashRemaining-dt);
   if(this.dashRemaining<1e-9){this.dashRemaining=0;if(this.dashCooldown===0)this.dashCooldown=2;}
  }else if(this.dashCooldown>0){
   this.dashCooldown-=dt;
   while(this.dashCooldown<=1e-9&&this.player.dashCharges<this.progression.maxDashes){this.player.dashCharges++;if(this.player.dashCharges<this.progression.maxDashes)this.dashCooldown+=2;else this.dashCooldown=0;}
  }
  const p=this.player;p.angle=Math.atan2(input.aim.y-p.y,input.aim.x-p.x);
  if(!dashing&&p.health>0&&(this.fishing.state==='idle'||this.fishing.state==='reeling')){const x=Number(input.right)-Number(input.left),y=Number(input.down)-Number(input.up),len=Math.hypot(x,y)||1,speed=195*this.progression.speedMultiplier;this.move(x/len*speed*dt,y/len*speed*dt,this.fishing.state==='reeling');}
  if(p.health>0)this.advanceFishing(p,dt,input.held);
 }
}
