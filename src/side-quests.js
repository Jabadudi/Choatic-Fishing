import {ANIMAL_TYPES} from './entities.js';
import {earnMarks,marksLabel} from './trade.js';
import {levelUpText,LEVEL_GROWTH} from './skills.js';
import {levelUpEffect} from './level-up-fx.js';
import {nearbyNpc} from './npcs.js';
// Side missions: villagers in Willowback ask Eli to hunt creatures or bring them goods.
// Gameplay data only. The quest sheet (quest-ui.js) and the markers over heads read it; neither changes it.
// kill counts hunts made after the mission is accepted; collect counts what the backpack holds and is handed over at the end.
export const SIDE_QUESTS=Object.freeze([
 {id:'garden-raiders',giver:'basket-carrier',giverName:'Basket carrier',title:'Garden raiders',
  objectives:[{type:'kill',species:'rabbit',count:4}],rewards:{marks:10,xp:40,items:[{name:'Willow Apples',count:4}]},
  where:'Rabbits graze the meadows of Reedwater Landing, Windchime Path and the crossroads.',
  offer:'The gardens still need tending, storm or no storm. And the rabbits think the storm was an invitation. Four of them have been at my cabbages since dawn. Thin them out for me?',
  thought:'Pest control. Not the heroic first quest Eli had pictured, but the cabbages did look genuinely threatened.',
  reminder:'Four rabbits. They’re bold now, but they still run.',
  done:'That’s the worst of them. Take some apples for your trouble, and don’t tell the children where they came from.'},
 {id:'deer-in-the-beans',giver:'basket-carrier',giverName:'Basket carrier',title:'Deer in the beans',requires:['garden-raiders'],
  objectives:[{type:'kill',species:'deer',count:2}],rewards:{marks:18,xp:70,items:[{name:'Healing Salve',count:1}]},
  where:'Deer graze the Reedwater meadow and Windchime Path.',
  offer:'Rabbits were the small problem. Two deer have been stripping the bean rows every night. They kick when they’re cornered, so mind yourself.',
  thought:'Deer that fight back. Eli remembered the meadow, and the hooves, and decided he would be bringing the bow.',
  reminder:'Two deer. Mind the hooves.',
  done:'The beans might live to see summer after all. Keep this salve close. You look like someone who’ll need it.'},
 {id:'harness-hides',giver:'village-smith',giverName:'Blacksmith',title:'Hides for the harness',
  objectives:[{type:'collect',item:'Deer Hide',count:2}],rewards:{marks:15,xp:50,items:[{name:'Whetstone',count:1}]},
  where:'Deer sometimes leave a hide behind. Hunt them on the Reedwater meadow and Windchime Path.',
  offer:'The guardian tore her harness on the shore last night. I can stitch new straps if someone brings me good leather. Two deer hides would do it.',
  thought:'Eli looked at the Rimejaw, then at the size of her harness, and privately hoped they were very large deer.',
  reminder:'Two deer hides for the harness. Supple ones.',
  done:'Good leather. She’ll have new straps by tonight. Take the whetstone. It keeps an edge honest.'},
 {id:'tangled-nets',giver:'village-fisher',giverName:'Fisher',title:'Eels in the nets',
  objectives:[{type:'kill',species:'eel',count:3}],rewards:{marks:12,xp:45,items:[{name:'Iron Fishhooks',count:1}]},
  where:'Eels swim the Reedwater shallows, the crossroads river and Shellback Marsh.',
  offer:'The boats are sound, but the storm drove eels into the shallows and they’ve chewed through half our nets. Three fewer eels would be a start.',
  thought:'Eli had arrived in this world with a fishing rod and his grandfather’s cabin. Being hired to fight fish felt on brand.',
  reminder:'Three eels. They bite back less than you’d think.',
  done:'The nets will hold now. Those are proper iron hooks. Don’t lose them to the first snag.'},
 {id:'net-mending',giver:'net-carrier',giverName:'Net carrier',title:'Mending what the night left',
  objectives:[{type:'collect',item:'Eel Skin',count:2}],rewards:{marks:14,xp:50,items:[{name:'Woven Fish Trap',count:1}]},
  where:'Eels sometimes leave their skin behind. Hunt them in the Reedwater shallows, the crossroads river and the marsh.',
  offer:'We’re mending what the night left behind. Eel skin binds a net frame better than any cord. Bring me two and I’ll owe you.',
  thought:'Eli did not know what a net frame was. He suspected admitting that would cost him the job.',
  reminder:'Two eel skins, if you find them.',
  done:'Perfect. That frame will outlast both of us. Take a trap. Set it in the shallows and come back later.'},
 {id:'lucky-foot',giver:'child-one',giverName:'Village child',title:'A lucky foot',
  objectives:[{type:'collect',item:'Rabbit’s Foot',count:1}],rewards:{marks:6,xp:60,items:[]},
  where:'Only a lucky few rabbits leave a foot behind. Luck helps.',
  offer:'Did you see the wolves last night? My brother says a rabbit’s foot keeps shadow walkers away. Can you find me one? I saved six whole marks.',
  thought:'Eli doubted a rabbit’s foot would stop anything carrying an axe. He also was not going to be the one to tell her.',
  reminder:'Did you find a lucky foot yet?',
  done:'It’s so soft! Here, all six marks. Don’t spend them on anything boring.'},
 {id:'walker-iron',giver:'village-smith',giverName:'Blacksmith',title:'Ash and iron',requires:['harness-hides'],
  objectives:[{type:'kill',species:'shadow-walker',count:3}],rewards:{marks:30,xp:120,items:[{name:'Hunting Knife',count:1}]},
  where:'Shadow walkers haunt Shellback Marsh most of all, and the crossroads and Windchime Path too. They come at you, so keep your health up.',
  offer:'You saw one up close and lived. If they’re coming out of the marsh again, I want them gone before they reach the gardens. Three of them.',
  thought:'Last time, Eli had run, fallen over, and been rescued by a wolf. He decided not to mention that.',
  reminder:'Three walkers. Don’t let them close.',
  done:'Three. You’re tougher than you look. Take the knife. You’ve earned a blade that bites back.'}
]);
export const SIDE_QUEST_IDS=Object.freeze(SIDE_QUESTS.map(q=>q.id));
export const sideQuest=id=>SIDE_QUESTS.find(q=>q.id===id)||null;
export const createSideQuests=()=>Object.fromEntries(SIDE_QUEST_IDS.map(id=>[id,{status:'available'}]));
// Villagers start handing out work once Eli has arrived in Willowback with his guide.
export const sideQuestsOpen=world=>!!world.adventure&&!!world.story&&!['ch3-chimes','ch3-travel'].includes(world.story.stage);
const stateOf=(world,quest)=>world.quests?.[quest.id];
// A mission is offered when the ones before it are done and every creature it asks for can be met (it has gameplay, so it spawns).
export const unlocked=(world,quest)=>(quest.requires||[]).every(id=>world.quests?.[id]?.status==='complete')&&quest.objectives.every(o=>o.type!=='kill'||Object.hasOwn(ANIMAL_TYPES,o.species));
const huntedCount=(world,species)=>world.hunting?.bySpecies?.[species]||0;
export function objectiveLabel(o){
 if(o.type==='collect')return o.item;
 const name=ANIMAL_TYPES[o.species]?.name||o.species.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
 return `Hunt ${o.count===1||name==='Deer'?name:`${name}s`}`;
}
export function objectiveProgress(world,quest){
 const state=stateOf(world,quest);
 return quest.objectives.map(o=>{
  const have=state?.status==='complete'?o.count:o.type==='kill'?(state?.status==='active'?Math.max(0,huntedCount(world,o.species)-(state.since?.[o.species]||0)):0):world.inventory.countOf(o.item);
  return {...o,label:objectiveLabel(o),have:Math.min(o.count,have),done:have>=o.count};
 });
}
export const questReady=(world,quest)=>stateOf(world,quest)?.status==='active'&&objectiveProgress(world,quest).every(o=>o.done);
export function rewardParts(quest){
 const r=quest.rewards;return [r.marks?marksLabel(r.marks):'',r.xp?`${r.xp} XP`:'',...(r.items||[]).map(i=>i.count>1?`${i.name} ×${i.count}`:i.name)].filter(Boolean);
}
// What a villager has to say about work: a reward waiting, a job in progress, or a new offer. Givers with nothing return null.
export function questFor(world,npcId){
 if(!sideQuestsOpen(world))return null;
 const quests=SIDE_QUESTS.filter(q=>q.giver===npcId&&stateOf(world,q));
 const ready=quests.find(q=>questReady(world,q));if(ready)return {quest:ready,state:'ready'};
 const active=quests.find(q=>stateOf(world,q).status==='active');if(active)return {quest:active,state:'active'};
 const offer=quests.find(q=>stateOf(world,q).status==='available'&&unlocked(world,q));return offer?{quest:offer,state:'offer'}:null;
}
// The marker drawn over a giver's head: ! for new work, ? once it can be handed in.
export const questMarker=(world,npc)=>{const found=npc?.npc&&questFor(world,npc.id);return found?found.state:null;};
const atGiver=(world,quest)=>nearbyNpc(world)?.id===quest.giver;
const canAct=world=>sideQuestsOpen(world)&&world.matchState==='playing'&&world.player.health>0&&world.fishing.state==='idle';
export function acceptQuest(world,id){
 const quest=sideQuest(id),state=quest&&stateOf(world,quest);
 if(!state||state.status!=='available'||!unlocked(world,quest)||!canAct(world)||!atGiver(world,quest))return false;
 state.status='active';state.acceptedAt=world.elapsed;
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
 state.status='complete';delete state.since;
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
  if(data.status==='active')for(const o of quest.objectives.filter(o=>o.type==='kill')){
   const since=data.since?.[o.species];
   if(since!==undefined&&(!Number.isSafeInteger(since)||since<0||since>huntedCount(world,o.species)))fail('Invalid quest progress.');
   (state.since||={})[o.species]=since??huntedCount(world,o.species);
  }
  world.quests[quest.id]=state;
 }
}
