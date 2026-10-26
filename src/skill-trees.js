import {SKILL_IDS} from './skills.js';
// One tree per skill. Each level a skill gains earns one point for that skill's tree only.
// A talent needs at least one rank in every talent it requires; effects are passives granted per rank.
export const SKILL_TREES=Object.freeze({
 fishing:[
  {id:'patient-line',name:'Patient Line',maxRank:3,requires:[],description:'Fish bite 10% sooner per rank.',effects:{'fishing.biteTime':.1}},
  {id:'strong-reel',name:'Strong Reel',maxRank:3,requires:[],description:'The catch meter fills 8% faster per rank while you hold the fish.',effects:{'fishing.reel':.08}},
  {id:'river-sense',name:'River Sense',maxRank:2,requires:['patient-line'],description:'+10% Fishing XP per rank.',effects:{'skillXp.fishing':.1}},
  {id:'slack-line',name:'Slack Line',maxRank:2,requires:['strong-reel'],description:'The catch meter drains 20% slower per rank when the fish slips free.',effects:{'fishing.slack':.2}},
  {id:'lucky-haul',name:'Lucky Haul',maxRank:1,requires:['river-sense','slack-line'],description:'A landed fish has a 25% chance to bring a second one.',effects:{'fishing.doubleCatch':.25}}
 ],
 hunting:[
  {id:'sharp-aim',name:'Sharp Aim',maxRank:3,requires:[],description:'+6% damage to animals per rank.',effects:{'hunting.damage':.06}},
  {id:'thick-skin',name:'Thick Skin',maxRank:3,requires:[],description:'Take 8% less damage from animals per rank.',effects:{'hunting.hide':.08}},
  {id:'tracker',name:'Tracker',maxRank:2,requires:['sharp-aim'],description:'Rare animal drops are 15% more likely per rank.',effects:{'hunting.loot':.15}},
  {id:'field-dressing',name:'Field Dressing',maxRank:2,requires:['thick-skin'],description:'Recover 8 health per rank after each successful hunt.',effects:{'hunting.heal':8}},
  {id:'apex-hunter',name:'Apex Hunter',maxRank:1,requires:['tracker','field-dressing'],description:'+10% damage to animals and +20% Hunting XP.',effects:{'hunting.damage':.1,'skillXp.hunting':.2}}
 ],
 cooking:[
  {id:'hearty-portions',name:'Hearty Portions',maxRank:3,requires:[],description:'Food restores 15% more health per rank.',effects:{'food.heal':.15}},
  {id:'iron-stomach',name:'Iron Stomach',maxRank:3,requires:[],description:'+5 maximum health per rank.',effects:{'health.max':5}},
  {id:'kitchen-wisdom',name:'Kitchen Wisdom',maxRank:2,requires:['hearty-portions'],description:'+15% Cooking XP per rank.',effects:{'skillXp.cooking':.15}},
  {id:'fireside-warmth',name:'Fireside Warmth',maxRank:2,requires:['iron-stomach'],description:'Natural health regeneration is 25% faster per rank.',effects:{'health.regen':.25}},
  {id:'well-fed',name:'Well Fed',maxRank:1,requires:['kitchen-wisdom','fireside-warmth'],description:'+10 maximum health and food restores 25% more.',effects:{'health.max':10,'food.heal':.25}}
 ]
});
export const createSkillTrees=()=>Object.fromEntries(SKILL_IDS.map(id=>[id,{}]));
export const talentFor=(skill,id)=>SKILL_TREES[skill]?.find(talent=>talent.id===id)||null;
export const pointsSpent=ranks=>Object.values(ranks||{}).reduce((sum,rank)=>sum+rank,0);
// Points come from levels already gained, so older saves receive every point they earned.
export const pointsEarned=level=>Math.max(0,level-1);
export function talentState(skill,ranks,id){
 const talent=talentFor(skill,id),rank=ranks?.[id]||0;
 if(!talent)return 'unknown';if(rank>=talent.maxRank)return 'maxed';
 return talent.requires.every(need=>(ranks?.[need]||0)>0)?'open':'locked';
}
// Sums every learned rank into a passive source for sumPassives.
export function treePassives(trees){
 const total={};
 for(const [skill,ranks] of Object.entries(trees||{}))for(const [id,rank] of Object.entries(ranks||{})){
  const talent=talentFor(skill,id);if(!talent)continue;
  for(const [key,amount] of Object.entries(talent.effects))total[key]=(total[key]||0)+amount*rank;
 }
 return total;
}
// Valid when every rank is in range, every requirement is met and no tree spends more points than its skill earned.
export function validTree(skill,ranks,level){
 if(!ranks||typeof ranks!=='object'||Array.isArray(ranks))return false;
 for(const [id,rank] of Object.entries(ranks)){const talent=talentFor(skill,id);if(!talent||!Number.isInteger(rank)||rank<0||rank>talent.maxRank)return false;if(rank&&talent.requires.some(need=>!(ranks[need]>0)))return false;}
 return pointsSpent(ranks)<=pointsEarned(level);
}
