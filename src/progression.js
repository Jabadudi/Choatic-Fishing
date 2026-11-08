import {createSkills,skillXpToNext,BASE_STAT,LEVEL_GROWTH} from './skills.js';
import {createSkillTrees,talentFor,talentState,pointsSpent,pointsEarned,treePassives} from './skill-trees.js';
import {sumPassives} from './passives.js';
import {STUN} from './combo.js';
import {createCoreSkills,CORE_LEVEL_CAP} from './core-skills.js';
export const XP=Object.freeze({catch:30,elimination:90});
// Eli's level curve (approved by Netanel on 8 Nov 2026, the "Hardest" option): EXP to go from level L to L+1 is
// 80·L² + 160·L, so 240 at Lv 1, 9,600 at Lv 10, 20,400 at Lv 15. Clearing each Region 1 map once leaves Eli about
// Lv 10, a few levels under the Lv 14-15 monsters at the end, so reaching Region 2 takes some farming.
// Arena matches keep their own quick flat curve.
export const xpToNext=level=>80*level*level+160*level;
const arenaXpToNext=level=>90+(level-1)*45;
// The level and leftover EXP that a lifetime EXP total reaches on Eli's curve (used to move old saves onto it).
export function levelForTotal(total,cap=CORE_LEVEL_CAP){
 let level=1,xp=Math.max(0,Math.floor(total||0));
 while(level<cap&&xp>=xpToNext(level)){xp-=xpToNext(level);level++;}
 return {level,xp:level>=cap?0:xp};
}
export const BUFFS=Object.freeze([
 {id:'speed',name:'Fleet Footed',description:'+5% movement speed'},
 {id:'power',name:'Heavy Hitter',description:'+8% damage'},
 {id:'vitality',name:'Hardy',description:'+10 maximum health'},
 {id:'armor',name:'Tough Scales',description:'More damage resistance'}
]);
export class Progression {
 constructor(){this.upgradeRemaining=30;this.pendingUpgrades=0;this.upgrades={hermes:0,dash:0,health:0};this.level=1;this.xp=0;this.totalXp=0;this.pendingChoices=0;this.ranks={speed:0,power:0,vitality:0,armor:0};this.specials={tidal:0,whirlpool:0};this.eliminations=new Set();this.lastBuff=null;
  // Exploration characters grow attributes with their level; arena matches keep the flat match balance.
  this.characterStats=false;this.skills=createSkills();this.skillTrees=createSkillTrees();
  // Region Core skill points and wheel slots (core-skills.js).
  this.coreSkills=createCoreSkills();
  // Bonus from the active familiar (familiars.js), or null. Arena matches never have one.
  this.familiar=null;
  // Completed area sets of the collection book (src/collection.js): {health, damage}.
  this.collection=null;}
 get maxDashes(){return 1+this.upgrades.dash;}
 tickUpgrades(dt){this.upgradeRemaining-=dt;while(this.upgradeRemaining<1e-9){this.pendingUpgrades++;this.upgradeRemaining+=30;}}
 chooseUpgrade(kind){if(!this.pendingUpgrades||!Object.hasOwn(this.upgrades,kind))return false;this.upgrades[kind]++;this.pendingUpgrades--;return true;}
 get xpToNextLevel(){return this.characterStats?xpToNext(this.level):arenaXpToNext(this.level);}
 get speedMultiplier(){return (1+this.ranks.speed*.05+this.upgrades.hermes*.15)*(1+(this.familiar?.speed||0));}
 get growth(){return this.characterStats?this.level-1:0;}
 get stats(){const n=this.growth,f=this.familiar||{};return {strength:BASE_STAT+n*LEVEL_GROWTH.strength+(f.strength||0),dexterity:BASE_STAT+n*LEVEL_GROWTH.dexterity+(f.dexterity||0),luck:BASE_STAT+n*LEVEL_GROWTH.luck+(f.luck||0),wisdom:BASE_STAT+n*LEVEL_GROWTH.wisdom+(f.wisdom||0)};}
 get damageMultiplier(){return (1+this.ranks.power*.08)*(1+(this.stats.strength-BASE_STAT)*.03)*(1+(this.collection?.damage||0));}
 get attackSpeed(){return 1+(this.stats.dexterity-BASE_STAT)*.03;}
 get lootMultiplier(){return 1+(this.stats.luck-BASE_STAT)*.04;}
 get skillXpMultiplier(){return 1+(this.stats.wisdom-BASE_STAT)*.05;}
 get maxHealth(){return 100+this.growth*LEVEL_GROWTH.health+this.ranks.vitality*10+this.upgrades.health*20+(this.familiar?.health||0)+(this.collection?.health||0)+this.passive('health.max');}
 // Every system that grants passives adds one source here; gameplay reads only the summed passive(key).
 passiveSources(){return [treePassives(this.skillTrees)];}
 get passives(){return sumPassives(this.passiveSources());}
 passive(key){return this.passives[key]||0;}
 skillPoints(id){return Object.hasOwn(this.skills,id)?pointsEarned(this.skills[id].level)-pointsSpent(this.skillTrees[id]):0;}
 learn(skill,id){
  if(this.skillPoints(skill)<=0||talentState(skill,this.skillTrees[skill],id)!=='open')return false;
  const ranks=this.skillTrees[skill];ranks[id]=(ranks[id]||0)+1;return talentFor(skill,id);
 }
 // Chance that a hit stuns a monster (src/combo.js STUN): base, plus familiars, area sets and passives.
 get stun(){return Math.min(STUN.max,STUN.base+(this.familiar?.stun||0)+(this.collection?.stun||0)+this.passive('combat.stun'));}
 get damageReduction(){return 1-(1-.5*(1-Math.pow(.9,this.ranks.armor)))*(1-(this.familiar?.damageReduction||0));}
 get specialCharges(){return this.specials.tidal+this.specials.whirlpool;}
 grantCatchBuff(random=Math.random){const buff=BUFFS[Math.min(BUFFS.length-1,Math.floor(random()*BUFFS.length))];this.ranks[buff.id]++;this.lastBuff=buff;return buff;}
 award(amount){if(!Number.isSafeInteger(amount)||amount<=0)return 0;this.xp+=amount;this.totalXp+=amount;let levels=0;while(this.level<CORE_LEVEL_CAP&&this.xp>=this.xpToNextLevel){this.xp-=this.xpToNextLevel;this.level++;this.pendingChoices++;levels++;}
  // Eli stops at Lv 150; experience past it still counts toward his total but fills no bar.
  if(this.level>=CORE_LEVEL_CAP)this.xp=0;
  return levels;}
 train(id,base){
  const skill=Object.hasOwn(this.skills,id)?this.skills[id]:null;if(!skill||!Number.isSafeInteger(base)||base<=0)return null;
  const amount=Math.round(base*(this.skillXpMultiplier+this.passive(`skillXp.${id}`))*(1+(this.familiar?.[`${id}Xp`]||0)));let skillLevels=0;skill.xp+=amount;
  while(skill.xp>=skillXpToNext(skill.level)){skill.xp-=skillXpToNext(skill.level);skill.level++;skillLevels++;}
  // Wisdom and familiar bonuses speed up the skill only; Eli's own level gets the plain base EXP.
  return {skill:id,amount,skillLevels,levels:this.award(this.characterStats?base:amount)};
 }
 recordElimination(victimId){if(typeof victimId!=='string'||!victimId.trim()||this.eliminations.has(victimId))return false;this.eliminations.add(victimId);this.award(XP.elimination);return true;}
 choose(reward){if(!this.pendingChoices||!Object.hasOwn(this.specials,reward))return false;this.specials[reward]++;this.pendingChoices--;return true;}
}
