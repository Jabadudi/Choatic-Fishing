import {storyObjective,storyPrompt} from './story.js';
import {nearbyDrop} from './drops.js';
import {questObjective} from './quests.js';
import {placesFor,nearestLandmark} from './wilds.js';
import {nearbyNpc} from './npcs.js';
import {MERCHANTS} from './trade.js';
// What the exploration HUD shows, derived from world state so it can be tested without a DOM.
export function explorationHud(world,exploringSeconds){
 const id=world.areaId,place=nearestLandmark(world.player.x,world.player.y,id),npc=nearbyNpc(world);
 return {
  hintVisible:exploringSeconds<10,
  quest:storyObjective(world)||questObjective(world),
  dots:placesFor(id).map(p=>world.discovered.has(p.id)),
  prompt:storyPrompt(world)|| (nearbyDrop(world)?`Pick up ${nearbyDrop(world).item.name}`:npc?`${npc.interactions?.includes('examine')?'Examine':MERCHANTS[npc.id]?'Trade with':'Talk to'} ${npc.name}`:place?`Examine ${place.name}`:null),
  upgradeFraction:Math.max(0,Math.min(1,1-world.progression.upgradeRemaining/30))
 };
}
