// Quest progress belongs to the journey, independently of NPC artwork.
export const MARA_SARDINE={id:'mara-sardine',title:"Mara's supper",item:'Sardine',quantity:1,rewardXp:15};
export const createQuests=()=>({'mara-sardine':{status:'available'}});
export function maraQuestDialogue(world){
 const quest=world.quests[MARA_SARDINE.id];
 if(quest.status==='complete')return 'Thank you again for the sardine!';
 if(quest.status==='available'){
  quest.status='active';
  return 'Hello! Catch me 1 sardine and bring it back. Reward: 15 XP.';
 }
 const inventory=world.inventory,index=inventory.allItems.findIndex(item=>item?.name===MARA_SARDINE.item);
 if(index<0)return 'Still hungry! Catch 1 sardine and bring it back to me. Reward: 15 XP.';
 // Hand over exactly one item without changing unrelated slots or using its healing effect.
 inventory.removeId(inventory.allItems[index].id);
 quest.status='complete';world.progression.award(MARA_SARDINE.rewardXp);
 return 'Thank you for the sardine! Quest complete. +15 XP.';
}
export function questObjective(world){
 const quest=world.quests?.[MARA_SARDINE.id];
 if(!quest||quest.status==='available')return null;
 if(quest.status==='complete')return "Mara's supper complete | +15 XP";
 const ready=world.inventory.allItems.some(item=>item?.name===MARA_SARDINE.item);
 return ready?'Sardine 1/1 | Return to Mara | 15 XP':'Sardine 0/1 | Catch one for Mara | 15 XP';
}
