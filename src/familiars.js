// Familiars: every hunted creature may drop a shard of its kind. Five shards fuse into a familiar that follows Eli.
// The village guardians are never hunted, so their shards come only from the Wishing Well's Familiar pool (wellOnly).
// Shards keep counting after the bond: 25 strengthens its passive and 100 wakes its last, strongest one.
// Gameplay only. The follower is drawn by familiar-art.js from the species' own sprite.
import {walkable,areaFor} from './wilds.js';
import {BRUME_TIMING} from './sprite-definitions.js';
export const FAMILIAR_TIERS=Object.freeze([5,25,100]);
// Keyed by loot table, so a creature's shard, loot and index entry share one id. Guardians are keyed by their index entry.
// passive.ranks[0] is the summoning passive, ranks[1] its stronger version at 25 shards. ultimate joins at 100.
export const FAMILIARS=Object.freeze({
 rabbit:{name:'Rabbit',shard:'Rabbit Familiar Shard',spriteId:'rabbit',scale:1,
  passive:{name:'Lucky Paw',ranks:[{luck:2},{luck:5}]},ultimate:{name:'Warren Dash',bonus:{speed:.12}}},
 fox:{name:'Fox',shard:'Fox Familiar Shard',spriteId:'fox',scale:1,
  passive:{name:'Quick Paws',ranks:[{dexterity:2},{dexterity:5}]},ultimate:{name:'Sly Fortune',bonus:{luck:3}}},
 deer:{name:'Deer',shard:'Deer Familiar Shard',spriteId:'deer',scale:.8,
  passive:{name:'Antler Might',ranks:[{strength:2},{strength:5}]},ultimate:{name:'Herd Sense',bonus:{huntingXp:.25}}},
 boar:{name:'Boar',shard:'Boar Familiar Shard',spriteId:'boar',scale:.75,
  passive:{name:'Thick Hide',ranks:[{health:10,strength:1},{health:25,strength:3}]},ultimate:{name:'Bristle Charge',bonus:{damageReduction:.08,strength:2}}},
 elk:{name:'Elk',shard:'Elk Familiar Shard',spriteId:'elk',scale:.5,ring:1.4,
  passive:{name:'Antler Crown',ranks:[{strength:2,health:10},{strength:5,health:25}]},ultimate:{name:'Herd Leader',bonus:{huntingXp:.15,strength:2}}},
 bear:{name:'Bear',shard:'Bear Familiar Shard',spriteId:'bear',scale:.6,ring:1.3,
  passive:{name:'Thick Fur',ranks:[{health:15,strength:1},{health:35,strength:3}]},ultimate:{name:'Bear Hug',bonus:{damageReduction:.12,strength:2}}},
 heron:{name:'Heron',shard:'Heron Familiar Shard',spriteId:'heron',scale:.8,
  passive:{name:'Patient Eye',ranks:[{wisdom:2},{wisdom:5}]},ultimate:{name:'Still Hunter',bonus:{fishingXp:.25}}},
 crab:{name:'Crab',shard:'Crab Familiar Shard',spriteId:'crab',scale:1,
  passive:{name:'Hard Shell',ranks:[{health:8},{health:20}]},ultimate:{name:'Pincer Grip',bonus:{strength:2,damageReduction:.05}}},
 goat:{name:'Goat',shard:'Goat Familiar Shard',spriteId:'goat',scale:.8,
  passive:{name:'Sure Footing',ranks:[{dexterity:1,health:8},{dexterity:3,health:20}]},ultimate:{name:'Ram',bonus:{strength:3}}},
 otter:{name:'Otter',shard:'Otter Familiar Shard',spriteId:'otter',scale:.9,
  passive:{name:'Playful',ranks:[{dexterity:2},{dexterity:5}]},ultimate:{name:'River Luck',bonus:{fishingXp:.15,luck:2}}},
 duck:{name:'Duck',shard:'Duck Familiar Shard',spriteId:'duck',scale:1,
  passive:{name:'Down Feathers',ranks:[{health:5,luck:1},{health:15,luck:2}]},ultimate:{name:'Flock',bonus:{speed:.08}}},
 pike:{name:'Pike',shard:'Pike Familiar Shard',spriteId:'pike',scale:.8,
  passive:{name:'Sharp Teeth',ranks:[{strength:2},{strength:5}]},ultimate:{name:'Ambush',bonus:{strength:2,fishingXp:.1}}},
 seal:{name:'Seal',shard:'Seal Familiar Shard',spriteId:'seal',scale:.7,
  passive:{name:'Blubber',ranks:[{health:15},{health:40}]},ultimate:{name:'Cold Water',bonus:{damageReduction:.1}}},
 turtle:{name:'Turtle',shard:'Turtle Familiar Shard',spriteId:'turtle',scale:.85,
  passive:{name:'Shell Ward',ranks:[{health:15},{health:40}]},ultimate:{name:'Ancient Shell',bonus:{damageReduction:.15}}},
 eel:{name:'Eel',shard:'Eel Familiar Shard',spriteId:'eel',scale:1,
  passive:{name:'Slippery Grip',ranks:[{dexterity:2},{dexterity:5}]},ultimate:{name:'Current Sense',bonus:{fishingXp:.25}}},
 'shadow-walker':{name:'Shadow Walker',shard:'Shadow Walker Familiar Shard',spriteId:'nightwalker',scale:.75,
  passive:{name:'Whispers in the Dark',ranks:[{wisdom:2},{wisdom:5}]},ultimate:{name:'Borrowed Power',bonus:{strength:2,dexterity:2,luck:2,wisdom:2}}},
 moonfang:{name:'Moonfang',shard:'Moonfang Familiar Shard',spriteId:'moonfang',scale:.9,ring:1.8,wellOnly:true,
  passive:{name:'Pack Guardian',ranks:[{strength:1,health:10},{strength:3,health:25}]},ultimate:{name:'Moonlit Run',bonus:{speed:.15}}},
 rimejaw:{name:'Rimejaw',shard:'Rimejaw Familiar Shard',spriteId:'rimejaw',scale:.55,wellOnly:true,
  passive:{name:'Frost Scales',ranks:[{health:10,dexterity:1},{health:30,dexterity:3}]},ultimate:{name:'Frozen Bite',bonus:{damageReduction:.1,strength:2}}},
 flitlynx:{name:'Flitlynx',shard:'Flitlynx Familiar Shard',spriteId:'flitlynx',scale:.7,wellOnly:true,
  passive:{name:'Sky Pounce',ranks:[{dexterity:1,luck:1},{dexterity:3,luck:3}]},ultimate:{name:'Wings on the Wind',bonus:{huntingXp:.15,speed:.08}}}
});
const BONUS_TEXT={health:n=>`+${n} max HP`,strength:n=>`+${n} Strength`,dexterity:n=>`+${n} Dexterity`,luck:n=>`+${n} Luck`,wisdom:n=>`+${n} Wisdom`,
 speed:n=>`+${Math.round(n*100)}% movement speed`,damageReduction:n=>`${Math.round(n*100)}% less damage taken`,
 fishingXp:n=>`+${Math.round(n*100)}% Fishing XP`,huntingXp:n=>`+${Math.round(n*100)}% Hunting XP`,cookingXp:n=>`+${Math.round(n*100)}% Cooking XP`};
export function describeBonus(bonus){
 // Four equal attribute points read better as one phrase.
 const stats=['strength','dexterity','luck','wisdom'],every=bonus.strength!==undefined&&stats.every(id=>bonus[id]===bonus.strength);
 const rest=Object.entries(bonus).filter(([key])=>!every||!stats.includes(key)).map(([key,value])=>BONUS_TEXT[key](value));
 return (every?[`+${bonus.strength} to every attribute`,...rest]:rest).join(', ');
}
export const tierFor=shards=>FAMILIAR_TIERS.filter(n=>shards>=n).length;
// The three passives as the index lists them: the summoning passive, its stronger rank, then the ultimate.
export function familiarPassives(id){
 const f=FAMILIARS[id];
 return [
  {tier:1,shards:FAMILIAR_TIERS[0],name:f.passive.name,bonus:f.passive.ranks[0]},
  {tier:2,shards:FAMILIAR_TIERS[1],name:`${f.passive.name} II`,bonus:f.passive.ranks[1],upgrades:true},
  {tier:3,shards:FAMILIAR_TIERS[2],name:f.ultimate.name,bonus:f.ultimate.bonus}
 ].map(p=>({...p,description:describeBonus(p.bonus)}));
}
// Every bonus a familiar grants at this tier, merged into one flat object.
export function familiarBonus(id,tier){
 const f=FAMILIARS[id];if(!f||tier<1)return null;
 const bonus={...f.passive.ranks[tier>=2?1:0]};
 if(tier>=3)for(const [key,value] of Object.entries(f.ultimate.bonus))bonus[key]=(bonus[key]||0)+value;
 return Object.freeze(bonus);
}
export const createFamiliars=()=>({shards:{},bonded:[],active:null});
export function familiarStatus(world,id){
 const shards=world.familiars?.shards[id]||0,tier=tierFor(shards),bonded=!!world.familiars?.bonded.includes(id);
 return {id,shards,tier,bonded,active:world.familiars?.active===id,canCombine:!bonded&&shards>=FAMILIAR_TIERS[0],next:FAMILIAR_TIERS.find(n=>shards<n)??null};
}
// Keeps the progression bonus in step with the active familiar and its current tier.
export function applyFamiliar(world){
 const active=world.familiars?.active,bonus=active?familiarBonus(active,familiarStatus(world,active).tier):null;
 world.progression.familiar=bonus;
 world.player.health=Math.min(world.player.health,world.progression.maxHealth);
}
// Spawns the follower just behind the player.
function place(world){
 const p=world.player,id=world.familiars.active;if(!id){world.companion=null;return;}
 const spot=[[-36,18],[36,18],[0,34],[-24,-10],[0,0]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy})).find(s=>walkable(s.x,s.y,world.areaId))||{x:p.x,y:p.y};
 // Hunting a shiny of its kind turns the familiar gold.
 world.companion={id,areaId:world.areaId,...spot,state:'idle',time:0,direction:{x:1,y:0},summonRemaining:.8,greet:BRUME_TIMING.bow,shiny:(world.hunting?.shiny?.hunted?.[id]||0)>0};
}
export function absorbShard(world,id){
 if(!FAMILIARS[id]||!world.familiars)return null;
 const before=familiarStatus(world,id);world.familiars.shards[id]=before.shards+1;const after=familiarStatus(world,id),f=FAMILIARS[id];
 let text=`${f.shard} · ${after.shards}${after.next?` / ${after.next}`:''}`;
 if(!after.bonded&&after.canCombine)text+=before.canCombine?'':' · Combine them in the Creature Index to summon a familiar';
 else if(after.bonded&&after.tier>before.tier){
  const passive=familiarPassives(id)[after.tier-1];text+=` · Your ${f.name.toLowerCase()} familiar learned ${passive.name}`;
  if(after.active){applyFamiliar(world);world.effects.push({name:'level-up',label:passive.name,x:world.player.x,y:world.player.y-62,angle:0,life:2.4,duration:2.4});}
 }
 return text;
}
// Five shards fuse into the familiar. The count is kept, so later shards keep strengthening it.
export function combineShards(world,id){
 const status=familiarStatus(world,id);if(!FAMILIARS[id]||!status.canCombine)return false;
 world.familiars.bonded.push(id);summonFamiliar(world,id);
 world.message=`The ${FAMILIARS[id].shard}s fuse. A ${FAMILIARS[id].name.toLowerCase()} familiar answers your call · ${familiarPassives(id)[0].name}: ${familiarPassives(id)[0].description}`;
 return true;
}
// One familiar walks with Eli at a time; summoning another sends the current one back.
export function summonFamiliar(world,id){
 if(!world.familiars?.bonded.includes(id))return false;
 world.familiars.active=id;applyFamiliar(world);place(world);
 world.message=`${FAMILIARS[id].name} familiar summoned.`;return true;
}
export function dismissFamiliar(world){
 if(!world.familiars?.active)return false;
 const name=FAMILIARS[world.familiars.active].name;world.familiars.active=null;applyFamiliar(world);world.companion=null;
 world.message=`${name} familiar dismissed.`;return true;
}
export function familiarAction(world,id,action){
 if(!world.adventure||!FAMILIARS[id])return false;
 if(action==='combine')return combineShards(world,id);
 if(action==='summon')return summonFamiliar(world,id);
 if(action==='dismiss')return world.familiars.active===id&&dismissFamiliar(world);
 return false;
}
// The follower trails the player, catching up quickly when left behind and reappearing beside him in a new area.
export function updateFamiliar(world,dt){
 const p=world.player,c=world.companion;
 if(!world.adventure||!world.familiars?.active){world.companion=null;return;}
 if(!c||c.id!==world.familiars.active||c.areaId!==world.areaId){place(world);return;}
 c.time+=dt;c.summonRemaining=Math.max(0,c.summonRemaining-dt);c.greet=Math.max(0,(c.greet||0)-dt);
 const tx=p.x-Math.cos(p.angle)*42,ty=p.y-Math.sin(p.angle)*42+10,dx=tx-c.x,dy=ty-c.y,distance=Math.hypot(dx,dy);
 if(distance>480){place(world);return;}
 if(distance<14){if(c.state!=='idle'){c.state='idle';c.time=0;}return;}
 const speed=Math.min(distance*4,distance>160?320:210),step=Math.min(distance,speed*dt),nx=c.x+dx/distance*step,ny=c.y+dy/distance*step;
 if(c.state!=='walk'){c.state='walk';c.time=0;}c.direction={x:dx/distance,y:dy/distance};
 // Familiars are spirits: they float over water and props, but stay inside the area.
 const area=areaFor(world.areaId);c.x=Math.max(10,Math.min(area.width-10,nx));c.y=Math.max(10,Math.min(area.height-10,ny));
}
// Accepts only known species and whole counts; older saves start with no familiars.
export function restoreFamiliars(data,world){
 const fail=message=>{throw Error(message);};
 world.familiars=createFamiliars();if(data===undefined||data===null)return;
 if(typeof data!=='object'||!data.shards||typeof data.shards!=='object'||!Array.isArray(data.bonded))fail('Invalid familiar data.');
 for(const [id,count] of Object.entries(data.shards)){if(!FAMILIARS[id]||!Number.isSafeInteger(count)||count<0)fail('Invalid familiar shards.');world.familiars.shards[id]=count;}
 for(const id of data.bonded){if(!FAMILIARS[id]||(world.familiars.shards[id]||0)<FAMILIAR_TIERS[0]||world.familiars.bonded.includes(id))fail('Invalid familiar bond.');world.familiars.bonded.push(id);}
 if(data.active!==null&&data.active!==undefined){if(!world.familiars.bonded.includes(data.active))fail('Invalid active familiar.');world.familiars.active=data.active;}
 world.progression.familiar=world.familiars.active?familiarBonus(world.familiars.active,tierFor(world.familiars.shards[world.familiars.active])):null;
}
