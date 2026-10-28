import {storyObjective,storyPrompt} from './story.js';
import {nearbyDrop} from './drops.js';
import {itemLabel} from './artifacts.js';
import {questObjective} from './quests.js';
import {sideObjective,questFor} from './side-quests.js';
import {placesFor,examinableLandmark} from './wilds.js';
import {nearbyNpc} from './npcs.js';
import {MERCHANTS} from './trade.js';
import {nearWell} from './wishing-well.js';
// What the exploration HUD shows, derived from world state so it can be tested without a DOM.
export function explorationHud(world,exploringSeconds){
 const id=world.areaId,place=examinableLandmark(world.player.x,world.player.y,id),npc=nearbyNpc(world),work=npc&&questFor(world,npc.id);
 return {
  hintVisible:exploringSeconds<10,
  quest:storyObjective(world)||questObjective(world),
  sideQuest:sideObjective(world),
  dots:placesFor(id).map(p=>world.discovered.has(p.id)),
  prompt:storyPrompt(world)|| (nearbyDrop(world)?`Pick up ${itemLabel(nearbyDrop(world).item)}`:work?.state==='ready'?`Report to ${npc.name}`:work?.state==='offer'?`Talk to ${npc.name} · Side mission`:npc?`${npc.interactions?.includes('examine')?'Examine':MERCHANTS[npc.id]?'Trade with':'Talk to'} ${npc.name}`:nearWell(world)?'Look into the Wishing Well':place?`Examine ${place.name}`:null),
  health:playerHealth(world.player,world.progression.maxHealth),
  upgradeFraction:Math.max(0,Math.min(1,1-world.progression.upgradeRemaining/30))
 };
}
// The bubble over Eli shows only the verb; the place or person already has its own label in the world.
export function promptVerb(prompt){
 if(!prompt)return '';
 if(prompt.startsWith('Pick up'))return 'Pick up';
 if(prompt==='Go to sleep')return 'Sleep';
 return prompt.split(' ')[0];
}
// Rounded for display; low health starts below 30% so the bar can warn before a fight is lost.
export function playerHealth(player,max){
 const current=Math.max(0,Math.ceil(player.health)),fraction=max>0?Math.max(0,Math.min(1,player.health/max)):0;
 return {current:Math.min(current,max),max,fraction,low:fraction<.3};
}
