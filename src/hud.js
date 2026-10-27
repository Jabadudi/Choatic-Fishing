import {storyObjective,storyPrompt} from './story.js';
import {nearbyDrop} from './drops.js';
import {questObjective} from './quests.js';
import {sideObjective,questFor} from './side-quests.js';
import {placesFor,nearestLandmark} from './wilds.js';
import {nearbyNpc} from './npcs.js';
import {MERCHANTS} from './trade.js';
// What the exploration HUD shows, derived from world state so it can be tested without a DOM.
export function explorationHud(world,exploringSeconds){
 const id=world.areaId,place=nearestLandmark(world.player.x,world.player.y,id),npc=nearbyNpc(world),work=npc&&questFor(world,npc.id);
 return {
  hintVisible:exploringSeconds<10,
  quest:storyObjective(world)||questObjective(world),
  sideQuest:sideObjective(world),
  dots:placesFor(id).map(p=>world.discovered.has(p.id)),
  prompt:storyPrompt(world)|| (nearbyDrop(world)?`Pick up ${nearbyDrop(world).item.name}`:work?.state==='ready'?`Report to ${npc.name}`:work?.state==='offer'?`Talk to ${npc.name} · Side mission`:npc?`${npc.interactions?.includes('examine')?'Examine':MERCHANTS[npc.id]?'Trade with':'Talk to'} ${npc.name}`:place?`Examine ${place.name}`:null),
  health:playerHealth(world.player,world.progression.maxHealth),
  upgradeFraction:Math.max(0,Math.min(1,1-world.progression.upgradeRemaining/30))
 };
}
// Rounded for display; low health starts below 30% so the bar can warn before a fight is lost.
export function playerHealth(player,max){
 const current=Math.max(0,Math.ceil(player.health)),fraction=max>0?Math.max(0,Math.min(1,player.health/max)):0;
 return {current:Math.min(current,max),max,fraction,low:fraction<.3};
}
