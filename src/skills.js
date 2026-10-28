import {levelUpEffect} from './level-up-fx.js';
// Use-based skills. Skill XP is earned only for a finished success (a landed fish, a hunted animal, a cooked meal),
// and every point also feeds Eli's main level, which raises his attributes.
export const SKILLS=Object.freeze({
 fishing:{name:'Fishing',description:'Land fish. Failed or abandoned lines teach nothing.'},
 hunting:{name:'Hunting',description:'Bring down wild animals. Only a successful hunt counts.'},
 cooking:{name:'Cooking',description:'Turn your catch and kills into a finished meal.'}
});
export const SKILL_IDS=Object.freeze(Object.keys(SKILLS));
export const skillXpToNext=level=>40+(level-1)*30;
// Each main level beyond the first grants these. Attributes start at BASE_STAT.
export const BASE_STAT=5;
export const LEVEL_GROWTH=Object.freeze({health:10,strength:1,dexterity:1,luck:1,wisdom:1});
export const STATS=Object.freeze([
 {id:'strength',name:'Strength',short:'STR',description:'+3% damage per point above 5'},
 {id:'dexterity',name:'Dexterity',short:'DEX',description:'3% faster attacks per point above 5'},
 {id:'luck',name:'Luck',description:'+4% chance of rare loot per point above 5',short:'LUCK'},
 {id:'wisdom',name:'Wisdom',short:'WIS',description:'+5% skill XP per point above 5'}
]);
export const createSkills=()=>Object.fromEntries(SKILL_IDS.map(id=>[id,{level:1,xp:0}]));
export function levelUpText(levels,level){
 if(!levels)return '';
 const g=LEVEL_GROWTH;return `Level ${level}! +${g.health*levels} max HP · +${levels} STR, DEX, LUCK, WIS`;
}
// Rewards one success. Returns null for anything that is not a known skill or a positive whole XP amount.
export function practise(world,actor,id,base,{x=actor.x,y=actor.y-40}={}){
 const result=actor.progression.train(id,base);if(!result)return null;
 if(result.levels)actor.health=Math.min(actor.progression.maxHealth,actor.health+LEVEL_GROWTH.health*result.levels);
 if(actor===world.player){
  // A level of either kind gets a burst over Eli in place of the floating XP, so the two never overlap.
  if(!result.levels&&!result.skillLevels)world.effects.push({name:'skill',label:`${SKILLS[id].name} +${result.amount} XP`,x,y,angle:0,life:1.4,duration:1.4});
  const skillLabel=`${SKILLS[id].name} ${actor.progression.skills[id].level}`;
  if(result.levels)world.effects.push(levelUpEffect(world,`Level ${actor.progression.level}${result.skillLevels?` · ${skillLabel}`:''}`));
  else if(result.skillLevels)world.effects.push(levelUpEffect(world,skillLabel,'skill'));
 }
 result.text=[result.skillLevels?`${SKILLS[id].name} reached ${actor.progression.skills[id].level} (+${result.skillLevels} ${SKILLS[id].name} point${result.skillLevels>1?'s':''})`:'',levelUpText(result.levels,actor.progression.level)].filter(Boolean).join(' · ');
 return result;
}
