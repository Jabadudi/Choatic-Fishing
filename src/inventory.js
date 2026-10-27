export const ITEM_CATEGORIES=Object.freeze([
 {id:'consumables',label:'Consumables'}, {id:'weapons',label:'Weapons'},
 {id:'armor',label:'Armor'}, {id:'quest-items',label:'Quest items'},
 {id:'trophies',label:'Trophies'}, {id:'upgrade-materials',label:'Upgrade materials'}
]);
const ITEM_CATEGORY={'Sardine':'consumables','Deer Meat':'consumables','Deer Hide':'upgrade-materials','Deer Antlers':'trophies','Grappling Squid':'consumables','Treasure Key':'quest-items','Old Boot':'trophies'};
const WEAPON_NAMES=new Set(['Frying Pan','Swordfish','Harpoon Gun','Anchor','Reed Spear','Crab Maul','Shell Sling','Pufferfish Bomb','Hunting Bow','Hunting Knife']);
// Permanent tools are never used up, however often they are fired.
export const PERMANENT_ITEMS=new Set(['Hunting Bow']);
// Food bought from the gardens restores health instead of being thrown.
export const HEALING=Object.freeze({'Wild Herbs':15,'Willow Apples':10,'Healing Salve':40});
export const canUseItem=item=>!!item&&(WEAPON_NAMES.has(item.name)||Object.hasOwn(HEALING,item.name)||['Sardine','Grappling Squid','Treasure Key','Old Boot'].includes(item.name));
export function itemCategory(item){
 if(ITEM_CATEGORIES.some(category=>category.id===item.category))return item.category;
 return ITEM_CATEGORY[item.name]||(WEAPON_NAMES.has(item.name)?'weapons':'upgrade-materials');
}
export function backpackItems(inventory,category='all'){
 return inventory.allItems.flatMap((item,index)=>item&&(category==='all'||itemCategory(item)===category)?[{item,slot:inventory.slots.includes(item)?inventory.slots.indexOf(item)+2:null,category:itemCategory(item)}]:[]);
}
const USES={'Frying Pan':3,'Swordfish':3,'Harpoon Gun':3,'Anchor':2,'Reed Spear':5,'Crab Maul':3,'Shell Sling':6,'Hunting Knife':12};
export class Inventory {
 constructor({separateStorage=false}={}){this.selected=1;this.capacity=6;this.slots=Array(6).fill(null);this.separateStorage=separateStorage;this.storedItems=[];this.nextId=1;this.marks=0;}
 get allItems(){return this.separateStorage?this.storedItems:this.slots.filter(Boolean);}
 get full(){return !this.separateStorage&&this.slots.every(Boolean);}
 get item(){return this.slots[this.selected===1?0:this.selected-2]||null;}
 equip(slot){if(!Number.isInteger(slot)||slot<1||slot>this.capacity+1)return false;this.selected=slot;return true;}
 receive(item){
  const index=this.slots.indexOf(null);if(!this.separateStorage&&index<0)return false;
  const stored={...item,id:`item-${this.nextId++}`,uses:Number.isInteger(item.uses)&&item.uses>0?item.uses:USES[item.name]||1};
  if(this.separateStorage)this.storedItems.push(stored);else this.slots[index]=stored;return true;
 }
 assignHotbar(id,slot){
  if(!this.separateStorage||!Number.isInteger(slot)||slot<2||slot>7)return false;
  const item=this.storedItems.find(item=>item.id===id);if(!item)return false;
  for(let i=0;i<this.slots.length;i++)if(this.slots[i]?.id===id)this.slots[i]=null;
  this.slots[slot-2]=item;return true;
 }
 removeId(id){
  const item=this.allItems.find(item=>item.id===id);if(!item)return null;
  if(this.separateStorage)this.storedItems=this.storedItems.filter(item=>item.id!==id);
  for(let i=0;i<this.slots.length;i++)if(this.slots[i]?.id===id){this.slots[i]=null;if(this.selected===i+2)this.selected=1;}
  return item;
 }
 useId(id){
  const item=this.allItems.find(item=>item.id===id);if(!item)return null;
  const used={...item};if(PERMANENT_ITEMS.has(item.name))return used;if(--item.uses===0)this.removeId(id);return used;
 }
 use(){
  if(this.selected===1||!this.item)return null;
  return this.useId(this.item.id);
 }
}
