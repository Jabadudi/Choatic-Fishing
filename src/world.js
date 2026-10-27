import {practise} from './skills.js';
import {PERMANENT_ITEMS} from './inventory.js';
import {rodReady,createStory,currentScene,inspectStory,advanceStory,storyObjective,updateStory,inlandUnlocked,storyTransitionAllowed,onStoryAreaChange} from './story.js';
import {nearbyDrop,dropItem} from './drops.js';
import {createQuests,maraQuestDialogue} from './quests.js';
import {createWildlife,updateWildlife,updateAnimalCombat} from './wildlife.js';
import {Fishing,ITEMS} from './fishing.js';
import {Progression,XP} from './progression.js';
import {Inventory,canUseItem} from './inventory.js';
import {attack,special,updateProjectiles} from './combat.js';
import {updateBot} from './bots.js';
import {LAND,CHESTS,LAKES,lakeDistance,isWater,nearWater,walkable} from './terrain.js';
import * as Wilds from './wilds.js';
import {createRabbits,updateRabbits} from './rabbits.js';
import {createSpawns,updateSpawns} from './spawns.js';
import {createNpcs,nearbyNpc,updateDialogue} from './npcs.js';
import {createFamiliars,absorbShard,updateFamiliar,familiarAction} from './familiars.js';
export {LAND} from './terrain.js';
export const SHORE_DEPTH=110;
export const INLAND={left:LAND.left+SHORE_DEPTH,right:LAND.right-SHORE_DEPTH,top:LAND.top+SHORE_DEPTH,bottom:LAND.bottom-SHORE_DEPTH};
export function createActor(id,name,x,y,random){return {id,name,entityType:'player',x,y,angle:0,health:100,vx:0,vy:0,cooldown:0,dashCharges:1,dashRemaining:0,dashCooldown:0,dashDirection:{x:0,y:0},message:'',catches:[],inventory:new Inventory(),progression:new Progression(),fishing:new Fishing(random),bobber:null,retreat:0,intent:'TO SHORE'};}
export class World {
 constructor(random=Math.random,{botCount=1,countdownSeconds=5,humans=null,adventure=false,story=false}={}){
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
  this.story=adventure&&story?createStory():null;this.adventure=adventure;this.drops=[];this.nextDropId=1;
  if(adventure)this.player.inventory=new Inventory({separateStorage:true});
  this.rabbits=adventure?createRabbits():[];this.wildlife=adventure?createWildlife():[];this.hunting={total:0,bySpecies:{},shiny:{seen:{},hunted:{}}};this.spawns=adventure?createSpawns():null;this.familiars=createFamiliars();this.companion=null;
  this.npcs=adventure?createNpcs():[];this.dialogue=null;this.quests=createQuests();
  if(adventure){this.areaId='landing';Object.assign(this.player,Wilds.SPAWN);this.bots=[];this.actors=[this.player];this.humans=[this.player];this.chests=[];this.countdownRemaining=0;this.matchState='playing';this.discovered=new Set();this.message='Welcome to Reedwater Landing. Follow the north trail to walk into Windchime Path. M opens the area map.';}
  if(adventure)this.player.progression.characterStats=true;
  if(this.story){this.player.name='Eli';this.player.spriteId='eli';this.npcs=[];this.message=storyObjective(this);}
 }
 advanceStory(){return advanceStory(this);}
 familiarAction(id,action){return familiarAction(this,id,action);}
 get animals(){return [...this.rabbits,...this.wildlife];}
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
 useActorItem(actor,itemId=null){
  if(currentScene(this)||this.matchState!=='playing'||actor.health<=0||actor.fishing.state!=='idle'||actor.cooldown>0)return false;
  const chosen=itemId?actor.inventory.allItems.find(item=>item.id===itemId):actor.inventory.selected>1?actor.inventory.item:null;
  if(chosen&&!canUseItem(chosen)){actor.message='This item cannot be used yet.';return false;}
  const consume=()=>itemId?actor.inventory.useId(itemId):actor.inventory.use();
  if(chosen?.name==='Treasure Key'){
   if(this.chests.every(c=>c.opened)){consume();actor.message='All chests are open. Spare key discarded.';return true;}
   const chest=this.chests.find(c=>!c.opened&&Math.hypot(actor.x-c.x,actor.y-c.y)<=70);
   if(!chest){actor.message='Find an unopened chest and stand close to use your key.';return false;}
   consume();chest.opened=true;actor.health=actor.progression.maxHealth;actor.message='Treasure unlocked! Health fully restored.';return true;
  }
  const item=consume();if(!item)return false;
  attack(this,actor,item);return true;
 }
 useItem(){
  const name=this.inventory.item?.name,huntsBefore=this.hunting.total;
  if(!this.useActorItem(this.player)){if(!this.inventory.item)this.message='Selected slot is empty. Choose a filled slot with 2–7.';return false;}
  if(name==='Treasure Key'||this.hunting.total>huntsBefore)return true;
  this.message=PERMANENT_ITEMS.has(name)?`${name} · Arrow loosed.`:this.inventory.item?`${name} · ${this.inventory.item.uses} uses left.`:`${name} used up. Slot clear — fish again.`;return true;
 }
 backpackAction(id,action,slot){
  if(!this.adventure||this.matchState!=='playing'||this.player.health<=0||this.fishing.state!=='idle')return false;
  const item=this.inventory.allItems.find(item=>item.id===id);if(!item)return false;
  if(item.name==='Mysterious Lure'){this.message='Eli keeps the strange lure close.';return false;}
  if(item.name==='Region Core'){this.message='Eli keeps the Region Core close. He isn’t ready to eat it. Not yet.';return false;}
  if(action==='hotbar')return this.inventory.assignHotbar(id,slot);
  if(action==='discard'){this.inventory.removeId(id);this.message=`${item.name} discarded.`;return true;}
  if(action==='drop')return dropItem(this,item);
  if(action==='use'){
   if(!canUseItem(item)){this.message='This item cannot be used yet.';return false;}
   const used=this.useActorItem(this.player,id);if(used)this.message=`Used ${item.name}.`;return used;
  }
  return false;
 }
 useSpecial(kind,actor=this.player){const used=special(this,actor,kind);if(actor===this.player)this.message=used?`${kind==='tidal'?'Tidal Cannon':'Whirlpool Burst'} unleashed!`:'Special unavailable. Earn a charge, abandon fishing, and let your attack recover.';return used;}
 recordElimination(victimId){return this.progression.recordElimination(victimId);}
 nearestWater(actor=this.player){return this.adventure?Wilds.nearWater(actor.x,actor.y,this.areaId):nearWater(actor.x,actor.y);}
 inspect(){
  if(!this.adventure||this.matchState!=='playing'||this.player.health<=0||currentScene(this))return false;
  if(inspectStory(this))return true;
  const drop=nearbyDrop(this);if(drop){const shard=absorbShard(this,drop.item.familiar);if(!shard)this.inventory.receive(drop.item);this.drops=this.drops.filter(item=>item.id!==drop.id);this.message=shard||`Picked up ${drop.item.name}.`;return true;}
  const npc=nearbyNpc(this);
  if(npc){const text=npc.id==='mara'&&!this.story?maraQuestDialogue(this):npc.greeting;this.dialogue={npcId:npc.id,text,remaining:12};this.message=`${npc.name}: ${text}`;return true;}
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
  if(currentScene(this)||this.matchState!=='playing'||this.player.health<=0||this.fishing.state==='waiting'||this.dashRemaining>0||this.player.dashCharges<=0)return false;
  let x=Number(!!input.right)-Number(!!input.left),y=Number(!!input.down)-Number(!!input.up);
  const length=Math.hypot(x,y);
  if(length){x/=length;y/=length;}else{x=Math.cos(this.player.angle);y=Math.sin(this.player.angle);}
  this.player.dashCharges--;this.dashDirection={x,y};this.dashRemaining=.16;return true;
 }
 moveActor(p,dx,dy,shoreOnly){
  if(dx===0&&dy===0)return;
  if(this.adventure){
   if(currentScene(this))return;
   const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5)),sx=dx/steps,sy=dy/steps;
   for(let i=0;i<steps;i++){if(Wilds.walkable(p.x+sx,p.y,this.areaId)&&(!shoreOnly||Wilds.nearWater(p.x+sx,p.y,this.areaId)))p.x+=sx;if(Wilds.walkable(p.x,p.y+sy,this.areaId)&&(!shoreOnly||Wilds.nearWater(p.x,p.y+sy,this.areaId)))p.y+=sy;}
   let next=Wilds.transitionAt(p.x,p.y,this.areaId);
   if(next&&this.story&&!inlandUnlocked(this.story)&&this.areaId==='landing'){next=null;p.y=Math.max(25,p.y);this.message=storyObjective(this);}
   if(next&&!storyTransitionAllowed(this,next)){next=null;const a=Wilds.areaFor(this.areaId);p.x=Math.max(25,Math.min(a.width-25,p.x));p.y=Math.max(25,Math.min(a.height-25,p.y));this.message='Your guide is still on the trail. Stay with her before moving on.';}
   if(next){const previous=this.areaId;this.projectiles=[];this.effects=[];this.dialogue=null;this.areaId=next.areaId;p.x=next.x;p.y=next.y;p.vx=0;p.vy=0;this.cancel();this.message=this.areaId==='crossroads'?'Willowbank Crossroads · West: Willowback Village · East: Shellback Marsh · South: Windchime Path.':`${Wilds.areaFor(this.areaId).name} · Follow the trail; walk back through the edge to return.`;onStoryAreaChange(this,previous);}
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
  if(this.matchState!=='playing'||actor.health<=0||actor.fishing.state!=='idle'||currentScene(this))return false;
  if(this.story&&!rodReady(this.story)){if(actor===this.player)this.message='Grandpa’s fishing rod is on the weapon rack inside the cabin.';return false;}
  if(actor.inventory.selected!==1){if(actor===this.player)this.message='Equip the fishing rod with 1 first.';return false;}
  if(actor.inventory.full){if(actor===this.player)this.message='Backpack full. Equip 2–7 and use an item to make room.';return false;}
  if(!this.nearestWater(actor)){if(actor===this.player)this.message='Move closer to the shoreline to cast.';return false;}
  if(!(this.adventure?Wilds.isWater(aim.x,aim.y,this.areaId):isWater(aim.x,aim.y))){if(actor===this.player)this.message='Aim out over the water, then cast.';return false;}
  if(!actor.fishing.cast())return false;actor.fishing.wait*=1-actor.progression.passive('fishing.biteTime');actor.bobber={...aim};return true;
 }
 cast(aim){const result=this.castActor(this.player,aim);if(result)this.message='Line cast. Waiting for a bite…';return result;}
 cancel(){if(this.fishing.cancel()){this.bobber=null;this.message='Line abandoned. You’re free to move.';}}
 advanceFishing(actor,dt,held){
  actor.fishing.update(dt,held,{reel:actor.progression.passive('fishing.reel'),slack:actor.progression.passive('fishing.slack')});
  if(actor.fishing.state==='caught'){
   const item=this.story?.stage==='fish'?{name:'Sardine',description:'A fresh catch for dinner.'}:actor.fishing.result.name==='Treasure Key'&&this.chests.every(c=>c.opened)?ITEMS[6]:actor.fishing.result;actor.inventory.receive(item);
   // Lucky Haul: a second fish of the same kind, only when there is room and the chance is learned.
   const double=actor.progression.passive('fishing.doubleCatch'),bonus=double>0&&this.random()<double&&actor.inventory.receive(item);
   // Fishing XP comes only from a landed fish; escapes and abandoned lines award nothing.
   const trained=practise(this,actor,'fishing',XP.catch,actor.bobber||undefined);
   const buff=this.story?null:actor.progression.grantCatchBuff(this.random);if(buff?.id==='vitality')actor.health+=10;
   if(actor===this.player){this.catches.push(item);const gained=`+${trained.amount} Fishing XP${trained.text?` · ${trained.text}`:''}`;if(bonus)this.catches.push(item);const landed=bonus?`Two ${item.name}s`:item.name;this.message=buff?`${landed} caught! ${buff.name}: ${buff.description} · ${gained}`:this.story?.stage==='fish'?`${landed} caught! ${gained} · ${storyObjective(this).replace(/^Chapter 1 · /,'')}`:`${landed} caught! · ${gained}`;}
   actor.fishing.state='idle';actor.bobber=null;
  }else if(actor.fishing.state==='escaped'){if(actor===this.player)this.message='It got away. Try again.';actor.fishing.state='idle';actor.bobber=null;}
 }
 update(dt,input,remoteInputs={}){
  if(currentScene(this))return;
  if(this.matchState==='countdown'){
   this.countdownRemaining=Math.max(0,this.countdownRemaining-dt);
   if(this.countdownRemaining<1e-9){this.countdownRemaining=0;this.matchState='playing';this.message='Go! Fish for gear and defeat your opponent.';}
   return;
  }
  if(this.matchState!=='playing')return;
  this.elapsed+=dt;this.effects=this.effects.filter(effect=>(effect.life-=dt)>0);
  for(const actor of this.actors){actor.cooldown=Math.max(0,actor.cooldown-dt);if(actor.health<=0)continue;if(!this.story)actor.progression.tickUpgrades(dt);actor.health=Math.min(actor.progression.maxHealth,actor.health+dt*(1+actor.progression.passive('health.regen')));this.moveActor(actor,actor.vx*dt,actor.vy*dt,actor.fishing.state!=='idle');actor.vx*=Math.exp(-9*dt);actor.vy*=Math.exp(-9*dt);}
  for(const human of this.humans){
   const actorInput=human===this.player?input:remoteInputs[human.id]||{left:false,right:false,up:false,down:false,held:false,aim:{x:human.x+1,y:human.y}};
   if(human.health>0)this.asActor(human,()=>this.updateHuman(dt,actorInput));
  }
  for(const bot of this.bots){if(bot.health<=0)continue;if(bot.progression.pendingUpgrades)this.chooseUpgrade(['hermes','health'][Math.floor(this.random()*2)],bot);updateBot(this,bot,dt);const f=bot.fishing;this.advanceFishing(bot,dt,f.state==='reeling'&&f.bar+f.velocity*.2+.135<f.target);}
  updateProjectiles(this,dt);
  updateAnimalCombat(this,dt);
  updateRabbits(this,dt);
  updateWildlife(this,dt);
  updateSpawns(this,dt);
  updateFamiliar(this,dt);
  updateDialogue(this,dt);
  updateStory(this,dt,Wilds.walkable);
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
  if(!dashing&&p.health>0&&(this.fishing.state==='idle'||this.fishing.state==='reeling')){const analog=Number.isFinite(input.moveX)&&Number.isFinite(input.moveY),x=analog?input.moveX:Number(input.right)-Number(input.left),y=analog?input.moveY:Number(input.down)-Number(input.up),len=Math.max(1,Math.hypot(x,y)),speed=195*this.progression.speedMultiplier;this.move(x/len*speed*dt,y/len*speed*dt,this.fishing.state==='reeling');}
  if(p.health>0)this.advanceFishing(p,dt,input.held);
 }
}
