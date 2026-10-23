export const ITEM_CATEGORIES=Object.freeze([
 {id:'consumables',label:'Consumables'}, {id:'weapons',label:'Weapons'},
 {id:'armor',label:'Armor'}, {id:'quest-items',label:'Quest items'},
 {id:'trophies',label:'Trophies'}, {id:'upgrade-materials',label:'Upgrade materials'}
]);
const ITEM_CATEGORY={'Sardine':'consumables','Grappling Squid':'consumables','Treasure Key':'quest-items','Old Boot':'trophies'};
const WEAPON_NAMES=new Set(['Frying Pan','Swordfish','Harpoon Gun','Anchor','Reed Spear','Crab Maul','Shell Sling','Pufferfish Bomb']);
export function itemCategory(item){
 if(ITEM_CATEGORIES.some(category=>category.id===item.category))return item.category;
 return ITEM_CATEGORY[item.name]||(WEAPON_NAMES.has(item.name)?'weapons':'upgrade-materials');
}
export function backpackItems(inventory,category='all'){
 return inventory.slots.flatMap((item,index)=>item&&(category==='all'||itemCategory(item)===category)?[{item,slot:index+2,category:itemCategory(item)}]:[]);
}
const USES={'Frying Pan':3,'Swordfish':3,'Harpoon Gun':3,'Anchor':2,'Reed Spear':5,'Crab Maul':3,'Shell Sling':6};
export class Inventory {
 constructor(){this.selected=1;this.capacity=6;this.slots=Array(6).fill(null);}
 get full(){return this.slots.every(Boolean);}
 get item(){return this.slots[this.selected===1?0:this.selected-2]||null;}
 equip(slot){if(!Number.isInteger(slot)||slot<1||slot>this.capacity+1)return false;this.selected=slot;return true;}
 receive(item){const index=this.slots.indexOf(null);if(index<0)return false;this.slots[index]={...item,uses:USES[item.name]||1};return true;}
 use(){
  if(this.selected===1||!this.item)return null;
  const index=this.selected-2,used={...this.slots[index]};
  if(--this.slots[index].uses===0){this.slots[index]=null;this.selected=1;}
  return used;
 }
}
