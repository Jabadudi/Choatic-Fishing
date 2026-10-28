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
// The bubble over Eli splits a prompt into its action ("Examine") and what it acts on ("The Drowned Road").
export function promptParts(prompt){
 if(!prompt)return {verb:'',target:''};
 if(prompt==='Go to sleep')return {verb:'Sleep',target:''};
 const m=prompt.match(/^(Pick up|Talk to|Trade with|Report to|Look into|\S+)\s*(.*)$/),verb=m[1].replace(/ (to|with|into)$/,''),target=m[2];
 return {verb,target:target&&target[0].toUpperCase()+target.slice(1)};
}
// Rounded for display; low health starts below 30% so the bar can warn before a fight is lost.
export function playerHealth(player,max){
 const current=Math.max(0,Math.ceil(player.health)),fraction=max>0?Math.max(0,Math.min(1,player.health/max)):0;
 return {current:Math.min(current,max),max,fraction,low:fraction<.3};
}
