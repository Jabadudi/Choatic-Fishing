import {placesFor,nearestLandmark} from './wilds.js';
import {nearbyNpc} from './npcs.js';
// What the exploration HUD shows, derived from world state so it can be tested without a DOM.
export function explorationHud(world,exploringSeconds){
 const id=world.areaId,place=nearestLandmark(world.player.x,world.player.y,id),npc=nearbyNpc(world);
 return {
  hintVisible:exploringSeconds<10,
  dots:placesFor(id).map(p=>world.discovered.has(p.id)),
  prompt:npc?`Talk to ${npc.name}`:place?`Examine ${place.name}`:null,
  upgradeFraction:Math.max(0,Math.min(1,1-world.progression.upgradeRemaining/30))
 };
}
