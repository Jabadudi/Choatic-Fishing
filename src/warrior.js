// Eli is a warrior: every journey starts with a sword in his hand, so he can fight from the first map.
// The sword never breaks (PERMANENT_ITEMS) and swings Eli's sabre sheet until it has its own art.
export const STARTER_SWORD='Iron Sword';
export const STARTER_SWORD_ITEM=Object.freeze({name:STARTER_SWORD,category:'weapons',description:'Eli’s sword. A plain, honest blade that never needs mending. 30 damage; swing three times in a row for a combo that ends in a knockdown.'});
// Gives the sword once: on its first free hotbar slot, held ready. Journeys saved before Eli carried one get it on load.
export function giveStarterSword(world){
 if(!world.adventure||!world.story&&!world.regions)return false;
 const inv=world.inventory;if(inv.allItems.some(item=>item.name===STARTER_SWORD))return false;
 if(!inv.receive({...STARTER_SWORD_ITEM}))return false;
 const sword=inv.allItems.find(item=>item.name===STARTER_SWORD),slot=inv.slots.indexOf(null);
 if(slot>=0){inv.assignHotbar(sword.id,slot+2);if(inv.selected<=1||!inv.item)inv.equip(slot+2);}
 return true;
}
