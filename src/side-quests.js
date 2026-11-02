import {ANIMAL_TYPES} from './entities.js';
import {earnMarks,marksLabel} from './trade.js';
import {levelUpText,LEVEL_GROWTH} from './skills.js';
import {levelUpEffect} from './level-up-fx.js';
import {nearbyNpc} from './npcs.js';
import {QUEST_DATA} from './quest-data.js';
// Side missions: villagers in Willowback ask Eli to hunt creatures or bring them goods.
// Gameplay data only. The quest sheet (quest-ui.js) and the markers over heads read it; neither changes it.
// kill counts hunts made after the mission is accepted; collect counts what the backpack holds and is handed over at the end.
// talk sends Eli to speak to another villager (to); deliver has the giver hand him goods on accepting, which he carries
// to another villager. Both are ticked off in state.done (the objective's index) when he reaches that villager.
// The quests themselves live in src/quest-data.js, which the quest editor in the atlas writes. Each one can wait for
// earlier quests (requires) and for Eli's level (minLevel), and carries a little lore for the quest log.
export const SIDE_QUESTS=QUEST_DATA;
export const SIDE_QUEST_IDS=Object.freeze(SIDE_QUESTS.map(q=>q.id));
export const sideQuest=id=>SIDE_QUESTS.find(q=>q.id===id)||null;
export const createSideQuests=()=>Object.fromEntries(SIDE_QUEST_IDS.map(id=>[id,{status:'available'}]));
// Villagers start handing out work once Eli has arrived in Willowback with his guide.
export const sideQuestsOpen=world=>!!world.adventure&&!!world.story&&!['ch3-chimes','ch3-travel'].includes(world.story.stage);
const stateOf=(world,quest)=>world.quests?.[quest.id];
// A mission is offered when the ones before it are done, Eli is high enough level and every creature it asks for can be
// met (it has gameplay, so it spawns). levelReady is kept apart so a villager can say when to come back.
export const levelReady=(world,quest)=>(world.progression?.level||1)>=(quest.minLevel||1);
const chainReady=(world,quest)=>(quest.requires||[]).every(id=>world.quests?.[id]?.status==='complete')&&quest.objectives.every(o=>o.type!=='kill'||Object.hasOwn(ANIMAL_TYPES,o.species));
export const unlocked=(world,quest)=>chainReady(world,quest)&&levelReady(world,quest);
const huntedCount=(world,species)=>world.hunting?.bySpecies?.[species]||0;
export function objectiveLabel(o){
 if(o.type==='collect')return o.item;
 if(o.type==='talk')return `Talk to the ${(o.toName||'villager').toLowerCase()}`;
 if(o.type==='deliver')return `Deliver ${o.item} to the ${(o.toName||'villager').toLowerCase()}`;
 const name=ANIMAL_TYPES[o.species]?.name||o.species.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
 return `Hunt ${o.count===1||name==='Deer'?name:`${name}s`}`;
}
const visiting=o=>o.type==='talk'||o.type==='deliver';
export function objectiveProgress(world,quest){
 const state=stateOf(world,quest);
 return quest.objectives.map((o,i)=>{
  const have=state?.status==='complete'?o.count:visiting(o)?(state?.done?.includes(i)?o.count:0):o.type==='kill'?(state?.status==='active'?Math.max(0,huntedCount(world,o.species)-(state.since?.[o.species]||0)):0):world.inventory.countOf(o.item);
  return {...o,label:objectiveLabel(o),have:Math.min(o.count,have),done:have>=o.count};
 });
}
export const questReady=(world,quest)=>stateOf(world,quest)?.status==='active'&&objectiveProgress(world,quest).every(o=>o.done);
export function rewardParts(quest){
 const r=quest.rewards;return [r.marks?marksLabel(r.marks):'',r.xp?`${r.xp} XP`:'',...(r.items||[]).map(i=>i.count>1?`${i.name} ×${i.count}`:i.name)].filter(Boolean);
}
// What a villager has to say about work: a reward waiting, a job in progress, a new offer, or (state 'locked') one that
// waits only for Eli to grow stronger. Givers with nothing return null.
export function questFor(world,npcId){
 if(!sideQuestsOpen(world))return null;
 const quests=SIDE_QUESTS.filter(q=>q.giver===npcId&&stateOf(world,q));
 const ready=quests.find(q=>questReady(world,q));if(ready)return {quest:ready,state:'ready'};
 const active=quests.find(q=>stateOf(world,q).status==='active');if(active)return {quest:active,state:'active'};
 const offer=quests.find(q=>stateOf(world,q).status==='available'&&unlocked(world,q));if(offer)return {quest:offer,state:'offer'};
 const later=quests.filter(q=>stateOf(world,q).status==='available'&&chainReady(world,q)).sort((a,b)=>(a.minLevel||1)-(b.minLevel||1))[0];
 return later?{quest:later,state:'locked'}:null;
}
// The marker drawn over a giver's head: ! for new work, ? once it can be handed in.
export const questMarker=(world,npc)=>{if(!npc?.npc)return null;const found=questFor(world,npc.id);if(found&&found.state!=='locked')return found.state;return visitFor(world,npc.id)?'visit':null;};
// What a villager says while their next job waits for Eli's level.
export const lockedLine=quest=>`I might have work for you, but it’s dangerous. Come back when you’re stronger. (Level ${quest.minLevel})`;
const atGiver=(world,quest)=>nearbyNpc(world)?.id===quest.giver;
// An errand under way that sends Eli to this villager: someone to talk to, or goods to hand over.
export function visitFor(world,npcId){
 if(!sideQuestsOpen(world))return null;
 for(const quest of SIDE_QUESTS){const state=stateOf(world,quest);if(state?.status!=='active')continue;
  const index=quest.objectives.findIndex((o,i)=>visiting(o)&&o.to===npcId&&!state.done?.includes(i));
  if(index>=0)return {quest,index,objective:quest.objectives[index]};}
 return null;
}
// Eli reaches the villager an errand sends him to. Returns what they say, or null if there is nothing to do here.
export function visitNpc(world,npc){
 const visit=visitFor(world,npc.id);if(!visit)return null;
 const {quest,index,objective:o}=visit,state=stateOf(world,quest);
 if(o.type==='deliver'&&world.inventory.countOf(o.item)<o.count)return `Weren’t you bringing something from the ${quest.giverName.toLowerCase()}? (${o.item} ×${o.count})`;
 if(o.type==='deliver')world.inventory.removeName(o.item,o.count);
 (state.done||=[]).push(index);
 const left=objectiveProgress(world,quest).every(p=>p.done)?`Return to the ${quest.giverName.toLowerCase()}`:'';
 world.message=`${quest.title} · ${objectiveLabel(o)} ✓${left?` · ${left}`:''}`;
 return o.line||(o.type==='deliver'?'For me? Thank you. Tell them I said so.':'Ah. Yes, I was hoping someone would come.');
}
const canAct=world=>sideQuestsOpen(world)&&world.matchState==='playing'&&world.player.health>0&&world.fishing.state==='idle';
export function acceptQuest(world,id){
 const quest=sideQuest(id),state=quest&&stateOf(world,quest);
 if(!state||state.status!=='available'||!unlocked(world,quest)||!canAct(world)||!atGiver(world,quest))return false;
 // Goods to deliver are handed over with the job. With no room for them, the job waits.
 const parcels=quest.objectives.filter(o=>o.type==='deliver');
 if(parcels.length&&world.inventory.full){world.message='Make room in your pack first.';return false;}
 for(const o of parcels)world.inventory.receive({name:o.item,count:o.count});
 state.status='active';state.acceptedAt=world.elapsed;state.done=[];
 // Hunts before accepting do not count; only the species this mission asks for are remembered.
 const kills=quest.objectives.filter(o=>o.type==='kill');if(kills.length)state.since=Object.fromEntries(kills.map(o=>[o.species,huntedCount(world,o.species)]));
 world.message=`Quest accepted: ${quest.title} · ${objectiveProgress(world,quest).map(o=>`${o.label} ${o.have}/${o.count}`).join(' · ')}`;return true;
}
// Main experience from a reward, healing a level's worth of health the same way skill levels do.
function grantXp(world,amount){
 const levels=world.progression.award(amount);
 if(levels){world.player.health=Math.min(world.progression.maxHealth,world.player.health+LEVEL_GROWTH.health*levels);world.effects.push(levelUpEffect(world,`Level ${world.progression.level}`));}
 return levelUpText(levels,world.progression.level);
}
export function turnInQuest(world,id){
 const quest=sideQuest(id),state=quest&&stateOf(world,quest);
 if(!state||!questReady(world,quest)||!canAct(world)||!atGiver(world,quest))return false;
 for(const o of quest.objectives)if(o.type==='collect')world.inventory.removeName(o.item,o.count);
 state.status='complete';delete state.since;delete state.done;
 const r=quest.rewards;earnMarks(world,r.marks||0);for(const item of r.items||[])world.inventory.receive({...item});
 const level=r.xp?grantXp(world,r.xp):'';
 world.effects.push({name:'skill',label:`Quest complete +${r.xp||0} XP`,x:world.player.x,y:world.player.y-40,angle:0,life:1.8,duration:1.8});
 world.message=`Quest complete: ${quest.title} · ${rewardParts(quest).join(' · ')}${level?` · ${level}`:''}`;return true;
}
// Active missions, most recently accepted first, then finished ones.
export function questLog(world){
 const entries=SIDE_QUESTS.filter(q=>stateOf(world,q)).map(q=>({quest:q,status:stateOf(world,q).status,ready:questReady(world,q),acceptedAt:stateOf(world,q).acceptedAt||0,progress:objectiveProgress(world,q)}));
 return {active:entries.filter(e=>e.status==='active').sort((a,b)=>b.acceptedAt-a.acceptedAt),complete:entries.filter(e=>e.status==='complete')};
}
// One line under the story objective for the mission Eli took on last.
export function sideObjective(world){
 if(!sideQuestsOpen(world))return null;
 const entry=questLog(world).active[0];if(!entry)return null;
 return entry.ready?`${entry.quest.title} · Return to the ${entry.quest.giverName.toLowerCase()}`:`${entry.quest.title} · ${entry.progress.map(o=>`${o.label} ${o.have}/${o.count}`).join(' · ')}`;
}
// After a hunt, the progress it made on any mission.
export function huntProgress(world,species){
 if(!sideQuestsOpen(world))return '';
 return questLog(world).active.flatMap(e=>e.progress.filter(o=>o.type==='kill'&&o.species===species).map(o=>`${e.quest.title} ${o.have}/${o.count}`)).join(' · ');
}
// Saved missions are validated against the current list; unknown or new missions keep their defaults.
export function restoreSideQuests(saved,world,fail){
 for(const quest of SIDE_QUESTS){
  const data=saved?.[quest.id];if(data===undefined)continue;
  if(!data||!['available','active','complete'].includes(data.status))fail('Invalid quest state.');
  const state={status:data.status};
  if(data.acceptedAt!==undefined){if(typeof data.acceptedAt!=='number'||!Number.isFinite(data.acceptedAt)||data.acceptedAt<0)fail('Invalid quest state.');state.acceptedAt=data.acceptedAt;}
  if(data.status==='active'&&data.done!==undefined){
   if(!Array.isArray(data.done)||data.done.some(i=>!Number.isInteger(i)||!visiting(quest.objectives[i]??{}))||new Set(data.done).size!==data.done.length)fail('Invalid quest progress.');
   state.done=[...data.done];
  }else if(data.status==='active')state.done=[];
  if(data.status==='active')for(const o of quest.objectives.filter(o=>o.type==='kill')){
   const since=data.since?.[o.species];
   if(since!==undefined&&(!Number.isSafeInteger(since)||since<0||since>huntedCount(world,o.species)))fail('Invalid quest progress.');
   (state.since||={})[o.species]=since??huntedCount(world,o.species);
  }
  world.quests[quest.id]=state;
 }
}
