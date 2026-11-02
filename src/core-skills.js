// Region Core skills, laid out like MapleStory M's skill menu: four tiers opened by Eli's level, 1 Core SP per level
// that can only be spent in the tier it was earned in, and Active, Buff and Passive skills. Actives and Buffs go in
// the four wheel slots around the main attack; Passives never need a slot.
// Every number scales in a straight line from its Lv 1 value to its max level value. Lv 1 matches the game before
// skills existed, so an unspent save plays exactly as it did.
// Rules only: core-abilities.js reads the numbers, skills-ui.js draws the menu.
export const CORE_LEVEL_CAP=150;
export const CORE_TIERS=Object.freeze([
 {id:1,name:'First Ripple',from:1,to:29},
 {id:2,name:'Current',from:30,to:59},
 {id:3,name:'Shaped Water',from:60,to:99},
 {id:4,name:'The Delta Answers',from:100,to:150}
]);
export const CORE_SLOTS=4;
export const DEFAULT_SLOTS=Object.freeze(['still-water','reeds-call',null,null]);
// `grant` is the story flag that wakes a skill at Lv 1 for free. `built:false` skills are listed in the menu but
// cannot be learned yet. `stats` holds [Lv 1, max level] pairs.
export const CORE_SKILLS=Object.freeze([
 {id:'reeds-call',name:'Reedwater’s Call',tier:1,type:'active',max:10,grant:'callAwakened',built:true,
  description:'A line of core-light that bends toward the nearest foe. Cheaper beside living water.',
  stats:{damage:[30,66],cost:[30,21],waterCost:[10,7]},maxBonus:'The line passes through its first foe and hits a second.'},
 {id:'still-water',name:'Still Water',tier:1,type:'buff',max:10,grant:'coreIngested',built:true,
  description:'Your mind is a lake. Panic is a stone. Let it sink. Eli takes less damage and cannot be knocked off his feet.',
  stats:{duration:[5,8],guard:[.25,.4],cooldown:[18,13]},maxBonus:'Also shakes off anything slowing Eli down while it holds.'},
 {id:'steady-heart',name:'Steady Heart',tier:1,type:'passive',max:5,requires:{skill:'still-water',level:3},built:true,
  description:'When a hit drops Eli under 35% health, Still Water fires on its own. Passive. This is not a cast.',
  stats:{duration:[2,4],cooldown:[60,40]}},
 {id:'deep-reserves',name:'Deep Reserves',tier:1,type:'passive',max:6,built:true,
  description:'Learning to heed the hollow. More reserves, and they come back faster.',
  stats:{reserves:[5,30],regen:[.05,.3]}},
 {id:'undertow',name:'Undertow',tier:2,type:'active',max:10,built:false,
  description:'Eli plants the rod and the ground turns to a whirl of river water that drags foes in and slows them.'},
 {id:'set-the-hook',name:'Set the Hook',tier:2,type:'active',max:10,requires:{skill:'reeds-call',level:10},built:false,
  description:'The line latches the first foe it hits. Light foes are reeled in; heavy ones pull Eli to them.'},
 {id:'riverstep',name:'Riverstep',tier:2,type:'buff',max:5,built:false,
  description:'Eli moves like the current. Faster steps, quicker dashes, and a wet trail behind him.'},
 {id:'reading-the-current',name:'Reading the Current',tier:2,type:'passive',max:5,requires:{skill:'set-the-hook',level:1},built:false,
  description:'Core lines hit harder and give some strength back.'},
 {id:'tidewall',name:'Tidewall',tier:3,type:'active',max:10,built:false,
  description:'A curved wall of water rises in front of Eli, stopping arrows and slowing foes who push through.'},
 {id:'floodline',name:'Floodline',tier:3,type:'active',max:15,requires:{skill:'reeds-call',level:10},built:false,
  description:'Three lines fan out at once, each bending toward a different foe.'},
 {id:'core-flare',name:'Core Flare',tier:3,type:'buff',max:5,built:false,
  description:'Eli lets the core shine. Stronger, but every shadow walker nearby sees the light.'},
 {id:'herons-patience',name:'Heron’s Patience',tier:3,type:'passive',max:10,built:false,
  description:'Standing still gathers the core, like a heron waiting over water.'},
 {id:'reedwater-rising',name:'Reedwater Rising',tier:4,type:'active',max:20,built:false,
  description:'The river rises behind Eli and rolls forward as one wave.'},
 {id:'land-remembers',name:'The Land Remembers',tier:4,type:'passive',max:5,requires:{skill:'steady-heart',level:5},built:false,
  description:'A hit that would defeat Eli leaves him standing, and Still Water fires.'},
 {id:'delta-bond',name:'Delta Bond',tier:4,type:'passive',max:15,built:false,
  description:'Beside living water Eli is part of the land: he hits harder and takes less.'},
 {id:'chosen-of-reedwater',name:'Chosen of Reedwater',tier:4,type:'buff',max:10,requires:{skill:'core-flare',level:5},built:false,
  description:'The core’s full voice. Short, rare and decisive.'}
]);
const SKILL=Object.fromEntries(CORE_SKILLS.map(s=>[s.id,s]));
export const coreSkill=id=>SKILL[id]||null;
export const TYPE_LABEL=Object.freeze({active:'Active',buff:'Buff',passive:'Passive'});
export const createCoreSkills=()=>({levels:{},slots:[...DEFAULT_SLOTS]});
const stateOf=world=>world.progression.coreSkills||(world.progression.coreSkills=createCoreSkills());
const tierOf=skill=>CORE_TIERS[skill.tier-1];
// Every level from the tier's first up to Eli's current one gives that tier 1 SP.
export const tierEarned=(tier,level)=>Math.max(0,Math.min(level,tier.to)-tier.from+1);
export const spentIn=(levels,tierId)=>CORE_SKILLS.reduce((sum,s)=>sum+(s.tier===tierId?levels?.[s.id]||0:0),0);
export const tierPoints=(world,tierId)=>tierEarned(CORE_TIERS[tierId-1],world.progression.level)-spentIn(stateOf(world).levels,tierId);
const granted=(world,skill)=>!!skill.grant&&!!world.story?.[skill.grant];
// Lv 1 from the story (if any) plus the points spent on it.
export function coreSkillLevel(world,id){
 const skill=SKILL[id];if(!skill)return 0;
 return Math.min(skill.max,(granted(world,skill)?1:0)+(stateOf(world).levels[id]||0));
}
// A stat at the skill's current level; below Lv 1 it reads the Lv 1 value, which is what the game used before.
export function statAt(skill,key,level){
 const pair=skill?.stats?.[key];if(!pair)return 0;
 const t=skill.max>1?(Math.max(1,Math.min(skill.max,level))-1)/(skill.max-1):1;
 return pair[0]+(pair[1]-pair[0])*t;
}
export const coreStat=(world,id,key)=>statAt(SKILL[id],key,coreSkillLevel(world,id));
const sec=n=>`${Math.round(n*10)/10}s`,pct=n=>`${Math.round(n*100)}%`;
// What a skill does at a given level, as short lines for the menu.
export function statLines(id,level){
 const s=SKILL[id],at=key=>statAt(s,key,level);if(!s?.stats)return [];
 switch(id){
  case 'reeds-call':return [`Damage ${Math.round(at('damage'))}`,`Cost ${Math.round(at('cost'))} reserves (${Math.round(at('waterCost'))} by water)`,'Cooldown 1.2s'];
  case 'still-water':return [`Lasts ${sec(at('duration'))}`,`Damage taken −${pct(at('guard'))}`,`Cooldown ${sec(at('cooldown'))}`];
  case 'steady-heart':return [`Still Water for ${sec(at('duration'))}`,`At most once every ${sec(at('cooldown'))}`];
  case 'deep-reserves':return [`Max reserves +${Math.round(at('reserves'))}`,`Reserves refill ${pct(at('regen'))} faster`];
  default:return [];
 }
}
export const coreMaxed=(world,id)=>{const s=SKILL[id];return !!s&&coreSkillLevel(world,id)>=s.max;};
// Why a skill can or cannot take a point: open, maxed, unbuilt, tier (Eli's level is too low), asleep (the story
// has not woken it), locked (needs another skill first) or broke (no SP left in its tier).
export function coreSkillState(world,id){
 const skill=SKILL[id];if(!skill)return 'unknown';
 if(!skill.built)return 'unbuilt';
 if(world.progression.level<tierOf(skill).from)return 'tier';
 if(skill.grant&&!granted(world,skill))return 'asleep';
 if(coreSkillLevel(world,id)>=skill.max)return 'maxed';
 const need=skill.requires;if(need?.skill&&coreSkillLevel(world,need.skill)<need.level)return 'locked';
 return tierPoints(world,skill.tier)>0?'open':'broke';
}
export function learnCoreSkill(world,id){
 if(coreSkillState(world,id)!=='open')return false;
 const levels=stateOf(world).levels;levels[id]=(levels[id]||0)+1;return true;
}
// Every point comes back; the two story powers keep their free Lv 1 and go back to their usual slots.
export function resetCoreSkills(world){
 const state=stateOf(world),spent=CORE_SKILLS.reduce((sum,s)=>sum+(state.levels[s.id]||0),0);
 if(!spent)return false;state.levels={};state.slots=[...DEFAULT_SLOTS];return true;
}
// Slots 1 and 2 are open from the start; 3 and 4 open with the core's two sealed powers.
export function slotOpen(world,slot){
 if(slot===0||slot===1)return true;
 if(slot===2)return coreSkillLevel(world,'undertow')>0;
 if(slot===3)return coreSkillLevel(world,'reedwater-rising')>0;
 return false;
}
export const equippable=(world,id)=>{const s=SKILL[id];return !!s&&s.type!=='passive'&&s.built&&coreSkillLevel(world,id)>0;};
// Putting a skill in a slot moves it out of any other; whatever the slot held swaps into the old place.
export function equipCoreSkill(world,id,slot){
 if(!equippable(world,id)||!Number.isInteger(slot)||slot<0||slot>=CORE_SLOTS||!slotOpen(world,slot))return false;
 const slots=stateOf(world).slots,from=slots.indexOf(id);
 if(from===slot)return false;
 if(from>=0)slots[from]=slots[slot];slots[slot]=id;return true;
}
export function unequipCoreSkill(world,slot){
 const slots=stateOf(world).slots;if(!slots[slot])return false;slots[slot]=null;return true;
}
export const coreSlots=world=>stateOf(world).slots;
// Save checks: known skills, whole points within range, no tier overspent for the saved level, valid slots.
export function validCoreSkills(data,level){
 if(!data||typeof data!=='object'||Array.isArray(data))return false;
 const levels=data.levels??{};if(!levels||typeof levels!=='object'||Array.isArray(levels))return false;
 for(const [id,points] of Object.entries(levels)){const s=SKILL[id];if(!s||!s.built||!Number.isInteger(points)||points<0||points>s.max-(s.grant?1:0))return false;}
 for(const tier of CORE_TIERS)if(spentIn(levels,tier.id)>tierEarned(tier,level))return false;
 const slots=data.slots??DEFAULT_SLOTS;if(!Array.isArray(slots)||slots.length!==CORE_SLOTS)return false;
 const seen=new Set();for(const id of slots){if(id===null)continue;const s=SKILL[id];if(!s||s.type==='passive'||seen.has(id))return false;seen.add(id);}
 return true;
}
